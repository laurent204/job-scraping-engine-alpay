"""
Scrape job boards (Indeed, LinkedIn Jobs, Stepstone) for Belgian job listings.

Strategy per board:
- Indeed:    Firecrawl scrape() → markdown → regex parse
- LinkedIn:  Guest API (httpx) → HTML → BeautifulSoup parse
- Stepstone: httpx → __PRELOADED_STATE__ JSON → structured data
"""

import hashlib
import json
import re
from urllib.parse import quote_plus, urljoin, parse_qs, urlparse
from typing import List

import httpx
from bs4 import BeautifulSoup
from firecrawl import FirecrawlApp

from config.segments import SEGMENTS
from config.settings import FIRECRAWL_API_KEY
from scrapers.base_scraper import BaseScraper

# URL templates
INDEED_URL = "https://be.indeed.com/jobs?q={query}&l=Belgium&fromage=7"
LINKEDIN_GUEST_API = (
    "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"
)
STEPSTONE_URL = "https://www.stepstone.be/jobs/{query}"


class JobBoardScraper(BaseScraper):
    """Scrape Indeed, LinkedIn Jobs, and Stepstone."""

    def __init__(self, session):
        super().__init__(session)
        self.firecrawl = FirecrawlApp(api_key=FIRECRAWL_API_KEY)

    async def scrape(self) -> list:
        return await self.scrape_all_segments()

    async def scrape_all_segments(self) -> list:
        all_jobs = []
        for segment_name, kw_sets in SEGMENTS.items():
            jobs = await self.scrape_segment(segment_name, kw_sets)
            all_jobs.extend(jobs)
            await self._random_delay(min_s=5, max_s=10)
        return all_jobs

    async def scrape_segment(self, segment_name: str, kw_sets: dict) -> list:
        self.logger.info("=== Segment: %s ===", segment_name)
        all_jobs = []

        # Indeed (Firecrawl scrape + markdown parse)
        indeed_kw = kw_sets.get("keywords_indeed", [])
        if indeed_kw:
            jobs = self._scrape_indeed(indeed_kw, segment_name)
            all_jobs.extend(jobs)
            await self._random_delay(min_s=3, max_s=6)

        # LinkedIn Jobs (guest API)
        linkedin_kw = kw_sets.get("keywords_linkedin", [])
        if linkedin_kw:
            jobs = await self._scrape_linkedin(linkedin_kw, segment_name)
            all_jobs.extend(jobs)
            await self._random_delay(min_s=3, max_s=6)

        # Stepstone (httpx + embedded JSON)
        stepstone_kw = kw_sets.get("keywords_stepstone", [])
        if stepstone_kw:
            jobs = self._scrape_stepstone(stepstone_kw, segment_name)
            all_jobs.extend(jobs)

        self.logger.info(
            "Segment '%s': %d total jobs", segment_name, len(all_jobs)
        )
        return all_jobs

    # ==================================================================
    # Indeed (Firecrawl scrape → markdown → regex)
    # ==================================================================

    def _scrape_indeed(self, keywords: List[str], segment: str) -> list:
        all_jobs = []
        seen = set()
        queries = self._build_queries(keywords)

        for query in queries:
            url = INDEED_URL.format(query=quote_plus(query))
            self.logger.info("Indeed scrape: %s", url)

            try:
                result = self.firecrawl.scrape(url, formats=["markdown"])
            except Exception:
                self.logger.exception("Indeed failed for q=%s", query)
                continue

            markdown = getattr(result, "markdown", "") or ""
            if len(markdown) < 500:
                continue

            self.logger.info(
                "indeed/%s q='%s': %d chars", segment, query, len(markdown)
            )

            for j in self._parse_indeed_md(markdown):
                key = f"{j['title'].lower()}|{j['company'].lower()}"
                if key in seen:
                    continue
                seen.add(key)

                job_url = j["url"]
                if job_url and not job_url.startswith("http"):
                    job_url = f"https://{job_url}"

                # Generate external_id from Indeed URL
                ext_id = ""
                if job_url:
                    qs = parse_qs(urlparse(job_url).query)
                    jk = qs.get("jk", [""])[0]
                    ext_id = f"indeed_{jk}" if jk else f"indeed_{hashlib.md5(job_url.encode()).hexdigest()[:12]}"

                all_jobs.append({
                    "title": j["title"],
                    "company_name": j["company"],
                    "location": j["location"],
                    "job_url": job_url,
                    "description": j.get("description", ""),
                    "contract_type": None,
                    "date_posted": None,
                    "salary_min": None,
                    "salary_max": None,
                    "source": "indeed",
                    "category": segment,
                    "external_id": ext_id,
                })

        self.logger.info("indeed/%s: %d jobs", segment, len(all_jobs))
        return all_jobs

    @staticmethod
    def _parse_indeed_md(markdown: str) -> list:
        """Parse Indeed markdown table blocks."""
        jobs = []
        blocks = re.split(r'\n- \|', markdown)

        for block in blocks:
            # Primary: ## [Title](url)<br>Company<br>Location
            match = re.search(
                r'##\s+\[([^\]]+)\]\(([^)]+)\)<br>([^<]+)<br>([^<|]+)',
                block,
            )
            if match:
                title = match.group(1).strip()
                url = match.group(2).strip()
                company = match.group(3).strip()
                location = match.group(4).strip()
            else:
                # Fallback: title + "View all [Company jobs]"
                title_m = re.search(r'##\s+\[([^\]]+)\]\(([^)]+)\)', block)
                if not title_m:
                    continue
                title = title_m.group(1).strip()
                url = title_m.group(2).strip()
                if "/q-" in url and "-jobs.html" in url:
                    continue

                comp_m = re.search(r'View all \[([^\]]+?)\s+jobs\]', block)
                company = comp_m.group(1).strip() if comp_m else ""

                loc_m = re.search(r'View all .+? \\- \[([^\]]+?)\s+jobs\]', block)
                location = loc_m.group(1).strip() if loc_m else ""

            if "salaries" in url.lower():
                continue

            # Snippet
            snippets = re.findall(r'^\s+- (.+)$', block, re.MULTILINE)
            desc = " ".join(
                s for s in snippets[:3]
                if not s.startswith(("View all", "Salary Search", "See popular"))
            )

            if title and company:
                jobs.append({
                    "title": title,
                    "company": company,
                    "location": location,
                    "url": url,
                    "description": desc,
                })

        return jobs

    # ==================================================================
    # LinkedIn Jobs (guest API → HTML → BeautifulSoup)
    # ==================================================================

    async def _scrape_linkedin(self, keywords: List[str], segment: str) -> list:
        all_jobs = []
        seen = set()
        queries = self._build_queries(keywords)

        async with httpx.AsyncClient(
            timeout=15, follow_redirects=True, headers=self._get_headers()
        ) as client:
            for query in queries:
                for start in (0, 10):  # 2 pages × 10 results
                    params = {
                        "keywords": query,
                        "location": "Belgium",
                        "f_TPR": "r604800",  # last 7 days
                        "start": str(start),
                    }
                    self.logger.info(
                        "LinkedIn API: q='%s' start=%d", query, start
                    )

                    try:
                        resp = await client.get(
                            LINKEDIN_GUEST_API, params=params
                        )
                        if resp.status_code != 200:
                            self.logger.warning(
                                "LinkedIn API %d for q=%s", resp.status_code, query
                            )
                            break
                    except Exception:
                        self.logger.exception("LinkedIn API failed for q=%s", query)
                        break

                    soup = BeautifulSoup(resp.text, "lxml")
                    cards = soup.find_all("li")
                    if not cards:
                        break

                    for card in cards:
                        title_el = card.find(
                            "h3", class_="base-search-card__title"
                        )
                        company_el = card.find(
                            "h4", class_="base-search-card__subtitle"
                        )
                        loc_el = card.find(
                            "span", class_="job-search-card__location"
                        )
                        link_el = card.find(
                            "a", class_="base-card__full-link"
                        )
                        date_el = card.find(
                            "time", class_="job-search-card__listdate"
                        )

                        title = (
                            title_el.get_text(strip=True) if title_el else ""
                        )
                        company = (
                            company_el.get_text(strip=True) if company_el else ""
                        )
                        if not title or not company:
                            continue

                        key = f"{title.lower()}|{company.lower()}"
                        if key in seen:
                            continue
                        seen.add(key)

                        href = ""
                        if link_el and link_el.get("href"):
                            href = link_el["href"]
                            if not href.startswith("http"):
                                href = urljoin(
                                    "https://www.linkedin.com", href
                                )

                        # Generate external_id from LinkedIn URL
                        ext_id = ""
                        if href:
                            m = re.search(r'/view/(\d+)', href) or re.search(r'-(\d{8,})(?:\?|$)', href)
                            if m:
                                ext_id = f"linkedin_{m.group(1)}"

                        all_jobs.append({
                            "title": title,
                            "company_name": company,
                            "location": (
                                loc_el.get_text(strip=True) if loc_el else ""
                            ),
                            "job_url": href,
                            "description": "",
                            "contract_type": None,
                            "date_posted": (
                                date_el.get_text(strip=True) if date_el else None
                            ),
                            "salary_min": None,
                            "salary_max": None,
                            "source": "linkedin",
                            "category": segment,
                            "external_id": ext_id,
                        })

                    if len(cards) < 10:
                        break  # no more pages

                    await self._random_delay(min_s=2, max_s=4)
                await self._random_delay(min_s=2, max_s=4)

        self.logger.info("linkedin/%s: %d jobs", segment, len(all_jobs))
        return all_jobs

    # ==================================================================
    # Stepstone (httpx → embedded JSON)
    # ==================================================================

    def _scrape_stepstone(self, keywords: List[str], segment: str) -> list:
        all_jobs = []
        seen = set()

        # Stepstone uses slug-style URLs: /jobs/keyword-keyword
        for kw in keywords[:3]:
            slug = kw.lower().replace(" ", "-")
            url = STEPSTONE_URL.format(query=slug)
            self.logger.info("Stepstone: %s", url)

            try:
                resp = httpx.get(
                    url,
                    headers=self._get_headers(),
                    follow_redirects=True,
                    timeout=20,
                )
            except Exception:
                self.logger.exception("Stepstone failed for %s", slug)
                continue

            if resp.status_code != 200:
                self.logger.warning("Stepstone %d for %s", resp.status_code, slug)
                continue

            items = self._extract_stepstone_json(resp.text)
            self.logger.info(
                "stepstone/%s q='%s': %d items", segment, kw, len(items)
            )

            for item in items:
                title = item.get("title", "").strip()
                company = item.get("companyName", "").strip()
                if not title or not company:
                    continue

                key = f"{title.lower()}|{company.lower()}"
                if key in seen:
                    continue
                seen.add(key)

                job_url = item.get("url", "")
                if job_url and not job_url.startswith("http"):
                    job_url = f"https://www.stepstone.be{job_url}"

                location_parts = []
                loc = item.get("location", "")
                if isinstance(loc, str):
                    location_parts.append(loc)
                elif isinstance(loc, dict):
                    location_parts.append(loc.get("city", ""))
                elif isinstance(loc, list):
                    for l in loc:
                        if isinstance(l, dict):
                            location_parts.append(l.get("city", ""))
                        elif isinstance(l, str):
                            location_parts.append(l)

                salary = item.get("unifiedSalary", {})
                salary_text = ""
                if isinstance(salary, dict):
                    salary_text = salary.get("displayText", "")

                # textSnippet is the only description available from search
                snippet = item.get("textSnippet", "")
                if snippet:
                    snippet = re.sub(r"<[^>]+>", "", snippet).strip()

                # Generate external_id from Stepstone URL or item id
                ext_id = ""
                item_id = item.get("id", "")
                if item_id:
                    ext_id = f"stepstone_{item_id}"
                elif job_url:
                    m = re.search(r'/offer/(\d+)', job_url) or re.search(r'--(\d+)(?:\?|$)', job_url)
                    ext_id = f"stepstone_{m.group(1)}" if m else f"stepstone_{hashlib.md5(job_url.encode()).hexdigest()[:12]}"

                all_jobs.append({
                    "title": title,
                    "company_name": company,
                    "location": ", ".join(filter(None, location_parts)),
                    "job_url": job_url,
                    "description": snippet,
                    "contract_type": None,
                    "date_posted": item.get("datePosted"),
                    "salary_min": None,
                    "salary_max": None,
                    "source": "stepstone",
                    "category": segment,
                    "external_id": ext_id,
                })

        self.logger.info("stepstone/%s: %d jobs", segment, len(all_jobs))
        return all_jobs

    @staticmethod
    def _extract_stepstone_json(html: str) -> list:
        """Extract job items from Stepstone's __PRELOADED_STATE__ JSON."""
        match = re.search(
            r'window\.__PRELOADED_STATE__\["app-unifiedResultlist"\]\s*=\s*(.+?);\s*\n',
            html,
        )
        if not match:
            return []
        try:
            data = json.loads(match.group(1))
            items = data.get("searchResults", {}).get("items", [])
            return items if isinstance(items, list) else []
        except (json.JSONDecodeError, KeyError):
            return []

    # ==================================================================
    # Helpers
    # ==================================================================

    @staticmethod
    def _build_queries(keywords: List[str]) -> List[str]:
        """Build short 2-keyword queries."""
        queries = []
        for i in range(0, len(keywords), 2):
            queries.append(" ".join(keywords[i:i + 2]))
        return queries[:3]
