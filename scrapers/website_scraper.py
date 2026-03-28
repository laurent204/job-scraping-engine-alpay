import hashlib
import json
import re
from typing import List, Optional
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup
from firecrawl import FirecrawlApp

from config.job_page_patterns import JOB_PAGE_PATHS, JOB_LINK_KEYWORDS
from config.settings import FIRECRAWL_API_KEY
from scrapers.base_scraper import BaseScraper


class WebsiteScraper(BaseScraper):
    """Scrape career pages of company websites using Firecrawl."""

    def __init__(self, session):
        super().__init__(session)
        self.firecrawl = FirecrawlApp(api_key=FIRECRAWL_API_KEY)

    async def scrape(self, companies: list) -> list:
        all_jobs = []
        for company in companies:
            try:
                jobs = await self._scrape_company(company)
                all_jobs.extend(jobs)
                self.logger.info(
                    "%s: found %d jobs", company["company_name"], len(jobs)
                )
            except Exception:
                self.logger.exception(
                    "Error scraping website for %s", company["company_name"]
                )
            await self._random_delay()
        return all_jobs

    async def _scrape_company(self, company: dict) -> list:
        # Determine which URL to scrape
        url = company.get("job_page_url", "") or company.get("company_url", "")
        if not url:
            return []
        if not url.startswith("http"):
            url = f"https://{url}"

        # If no known job page, try to discover one
        if not company.get("job_page_url"):
            discovered = await self._discover_job_page(company)
            if discovered:
                url = discovered
            else:
                self.logger.info("%s: no job page found", company["company_name"])
                return []

        return self._extract_with_firecrawl(url, company)

    # ------------------------------------------------------------------
    # Firecrawl extraction (main strategy)
    # ------------------------------------------------------------------

    def _extract_with_firecrawl(self, url: str, company: dict) -> list:
        """Use Firecrawl extract to pull structured job listings from career page."""
        self.logger.info("Firecrawl: extracting jobs from %s", url)

        try:
            result = self.firecrawl.extract(
                urls=[url],
                prompt=(
                    "Extract all job/vacancy listings from this career page. "
                    "For each job, extract the title, location, direct URL link to the job posting, "
                    "type (fulltime/parttime/contract/internship), and a short description if visible. "
                    "Only extract actual job openings, not navigation links or general page content."
                ),
                schema={
                    "type": "object",
                    "properties": {
                        "jobs": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "title": {"type": "string"},
                                    "location": {"type": "string"},
                                    "url": {"type": "string"},
                                    "type": {"type": "string"},
                                    "short_description": {"type": "string"},
                                },
                                "required": ["title"],
                            },
                        }
                    },
                },
            )
        except Exception:
            self.logger.exception("Firecrawl extract failed for %s", url)
            return []

        raw_jobs = self._parse_firecrawl_result(result)

        jobs = []
        for j in raw_jobs:
            title = (j.get("title") or "").strip()
            if not title or len(title) < 3:
                continue
            job_url = j.get("url", "")
            if job_url and not job_url.startswith("http"):
                job_url = urljoin(url, job_url)

            final_url = job_url or url
            ext_id = f"website_{hashlib.md5(final_url.encode()).hexdigest()[:12]}"

            jobs.append({
                "title": title,
                "company_name": company["company_name"],
                "job_url": final_url,
                "location": j.get("location", ""),
                "contract_type": [j["type"]] if j.get("type") else None,
                "description": j.get("short_description", ""),
                "source": "website",
                "source_language": "",
                "external_id": ext_id,
            })

        return jobs

    def enrich_jobs(self, jobs: list) -> list:
        """
        Enrich jobs by scraping each individual job URL with Firecrawl.
        Gets markdown content and uses extract() for structured fields.
        Costs 1 credit per job.
        """
        enriched = []
        for job in jobs:
            job_url = job.get("job_url", "")
            if not job_url:
                enriched.append(job)
                continue

            # Skip if already has a full description
            if job.get("description") and len(job["description"]) > 200:
                enriched.append(job)
                continue

            self.logger.info("Enriching: %s", job["title"][:50])
            try:
                # Use extract on the individual job page
                result = self.firecrawl.extract(
                    urls=[job_url],
                    prompt=(
                        "Extract the full details of this job posting. "
                        "Return the complete job description, employment type "
                        "(fulltime/parttime/contract/internship), the language "
                        "of the page (nl/fr/en), location, and the date posted."
                    ),
                    schema={
                        "type": "object",
                        "properties": {
                            "description": {"type": "string"},
                            "employment_type": {"type": "string"},
                            "language": {"type": "string"},
                            "date_posted": {"type": "string"},
                            "location": {"type": "string"},
                        },
                    },
                )

                data = {}
                if isinstance(result, dict):
                    data = result
                elif hasattr(result, "data"):
                    d = result.data
                    if isinstance(d, dict):
                        data = d
                    elif isinstance(d, list) and d:
                        data = d[0] if isinstance(d[0], dict) else {}

                if data.get("description"):
                    job["description"] = data["description"]
                if data.get("employment_type"):
                    job["contract_type"] = [data["employment_type"]]
                if data.get("language"):
                    job["source_language"] = data["language"][:2].lower()
                if data.get("date_posted"):
                    job["date_posted"] = data["date_posted"]
                if data.get("location") and not job.get("location"):
                    job["location"] = data["location"]

            except Exception:
                self.logger.warning("Enrichment failed for %s", job_url)

            enriched.append(job)
        return enriched

    @staticmethod
    def _parse_firecrawl_result(result) -> list:
        """Parse Firecrawl extract result into a list of job dicts."""
        raw_jobs = []
        if isinstance(result, dict):
            raw_jobs = result.get("jobs", [])
        elif hasattr(result, "data"):
            data = result.data
            if isinstance(data, dict):
                raw_jobs = data.get("jobs", [])
            elif isinstance(data, list):
                for item in data:
                    if isinstance(item, dict):
                        raw_jobs.extend(item.get("jobs", []))
        return raw_jobs

    # ------------------------------------------------------------------
    # Job page discovery (lightweight, no Firecrawl credits)
    # ------------------------------------------------------------------

    async def _discover_job_page(self, company: dict) -> Optional[str]:
        """Try to find the careers page URL using httpx (cheap)."""
        website = company.get("company_url", "")
        if not website:
            return None
        if not website.startswith("http"):
            website = f"https://{website}"

        async with httpx.AsyncClient(
            timeout=10, follow_redirects=True, headers=self._get_headers()
        ) as client:
            # Probe known paths
            for path in JOB_PAGE_PATHS:
                candidate = urljoin(website.rstrip("/") + "/", path.lstrip("/"))
                if await self._probe_url(client, candidate):
                    return candidate

            # Crawl homepage for job links
            return await self._find_job_link_on_homepage(client, website)

    async def _probe_url(self, client: httpx.AsyncClient, url: str) -> bool:
        try:
            resp = await client.get(url)
            if resp.status_code != 200:
                return False
            text = resp.text.lower()
            return any(kw in text for kw in JOB_LINK_KEYWORDS)
        except Exception:
            return False

    async def _find_job_link_on_homepage(
        self, client: httpx.AsyncClient, website: str
    ) -> Optional[str]:
        try:
            resp = await client.get(website)
            if resp.status_code != 200:
                return None
        except Exception:
            return None

        soup = BeautifulSoup(resp.text, "lxml")
        for a_tag in soup.find_all("a", href=True):
            href = a_tag["href"]
            text = (a_tag.get_text() + " " + href).lower()
            if any(kw in text for kw in JOB_LINK_KEYWORDS):
                abs_url = urljoin(website, href)
                if urlparse(abs_url).netloc == urlparse(website).netloc:
                    return abs_url
        return None
