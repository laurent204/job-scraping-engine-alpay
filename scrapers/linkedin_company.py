import re
from typing import List, Optional
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup
from rapidfuzz import fuzz

from scrapers.base_scraper import BaseScraper

LINKEDIN_GUEST_JOBS_URL = (
    "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"
)


class LinkedInCompanyScraper(BaseScraper):
    """Scrape job listings from LinkedIn Company pages."""

    async def scrape(self, companies: List[dict]) -> List[dict]:
        all_jobs: List[dict] = []
        for company in companies:
            li_url = company.get("linkedin_company_url", "")
            li_name = company.get("linkedin_company_name", "")
            if not li_url:
                continue

            # Validate matching
            if li_name and not self.validate_company_match(
                company["company_name"], li_name
            ):
                self.logger.warning(
                    "LinkedIn name mismatch: sheet='%s' linkedin='%s' — skipping",
                    company["company_name"],
                    li_name,
                )
                continue

            try:
                jobs = await self.get_company_jobs(li_url, company)
                all_jobs.extend(jobs)
                self.logger.info(
                    "%s: found %d LinkedIn jobs", company["company_name"], len(jobs)
                )
            except Exception:
                self.logger.exception(
                    "Error scraping LinkedIn for %s", company["company_name"]
                )
            await self._random_delay(min_s=3, max_s=7)

        return all_jobs

    def validate_company_match(self, sheet_name: str, linkedin_name: str) -> bool:
        # token_sort_ratio handles word reordering:
        # "DE SMAELE NV GLASHANDEL" vs "GLASHANDEL DE SMAELE" → high score
        ratio = fuzz.token_sort_ratio(sheet_name.lower(), linkedin_name.lower())
        self.logger.debug(
            "Fuzzy match %s vs %s = %d%%", sheet_name, linkedin_name, ratio
        )
        return ratio >= 55

    async def get_company_jobs(
        self, linkedin_url: str, company: dict
    ) -> List[dict]:
        slug = self._extract_slug(linkedin_url)
        if not slug:
            return []

        # Try company ID first, fall back to keyword search
        company_id = await self._resolve_company_id(slug)
        if company_id:
            return await self._fetch_jobs(company_id, company)

        # Fallback: search by company name
        self.logger.info(
            "Using keyword search for %s", company["company_name"]
        )
        return await self._fetch_jobs_by_keyword(company["company_name"], company)

    def _extract_slug(self, url: str) -> str:
        match = re.search(r"linkedin\.com/company/([^/?#]+)", url)
        return match.group(1) if match else ""

    async def _resolve_company_id(self, slug: str) -> Optional[str]:
        """Fetch the public company page and extract the company ID."""
        url = f"https://www.linkedin.com/company/{slug}/"
        try:
            async with httpx.AsyncClient(
                timeout=15, follow_redirects=True, headers=self._get_headers()
            ) as client:
                resp = await client.get(url)
                if resp.status_code != 200:
                    return None
                # Look for companyId in the page source
                match = re.search(r'"companyId":(\d+)', resp.text)
                if match:
                    return match.group(1)
                # Alternative pattern
                match = re.search(r'company/(\d+)/', resp.text)
                if match:
                    return match.group(1)
        except Exception:
            self.logger.debug("Failed to resolve company ID for slug %s", slug)
        return None

    async def _fetch_jobs(
        self, company_id: str, company: dict
    ) -> List[dict]:
        jobs: List[dict] = []
        start = 0
        page_size = 25

        async with httpx.AsyncClient(
            timeout=15, follow_redirects=True, headers=self._get_headers()
        ) as client:
            while True:
                params = {
                    "keywords": "",
                    "location": "Belgium",
                    "f_C": company_id,
                    "start": str(start),
                }
                try:
                    resp = await client.get(LINKEDIN_GUEST_JOBS_URL, params=params)
                    if resp.status_code != 200:
                        break
                except Exception:
                    break

                soup = BeautifulSoup(resp.text, "lxml")
                cards = soup.find_all("li")
                if not cards:
                    break

                for card in cards:
                    title_el = card.find("h3", class_=re.compile("title", re.I))
                    link_el = card.find("a", href=True)
                    location_el = card.find("span", class_=re.compile("location", re.I))

                    title = title_el.get_text(strip=True) if title_el else ""
                    if not title:
                        continue

                    job_url = ""
                    if link_el:
                        href = link_el["href"]
                        job_url = href if href.startswith("http") else urljoin(
                            "https://www.linkedin.com", href
                        )

                    # Generate external_id from LinkedIn URL
                    ext_id = ""
                    if job_url:
                        m = re.search(r'/view/(\d+)', job_url) or re.search(r'-(\d{8,})(?:\?|$)', job_url)
                        if m:
                            ext_id = f"linkedin_{m.group(1)}"

                    jobs.append({
                        "title": title,
                        "company_name": company["company_name"],
                        "job_url": job_url,
                        "location": location_el.get_text(strip=True) if location_el else "",
                        "source": "linkedin_company",
                        "source_language": "",
                        "external_id": ext_id,
                    })

                if len(cards) < page_size:
                    break
                start += page_size
                await self._random_delay(min_s=2, max_s=5)

        return jobs

    async def _fetch_jobs_by_keyword(
        self, company_name: str, company: dict
    ) -> List[dict]:
        """Search LinkedIn guest jobs API by company name as keyword."""
        jobs: List[dict] = []

        async with httpx.AsyncClient(
            timeout=15, follow_redirects=True, headers=self._get_headers()
        ) as client:
            params = {
                "keywords": company_name,
                "location": "Belgium",
                "start": "0",
            }
            try:
                resp = await client.get(LINKEDIN_GUEST_JOBS_URL, params=params)
                if resp.status_code != 200:
                    return []
            except Exception:
                return []

            soup = BeautifulSoup(resp.text, "lxml")
            cards = soup.find_all("li")

            for card in cards:
                title_el = card.find("h3", class_=re.compile("title", re.I))
                link_el = card.find("a", href=True)
                location_el = card.find(
                    "span", class_=re.compile("location", re.I)
                )
                company_el = card.find("h4", class_=re.compile("company", re.I))

                title = title_el.get_text(strip=True) if title_el else ""
                if not title:
                    continue

                # Verify the result belongs to this company (fuzzy)
                found_company = (
                    company_el.get_text(strip=True) if company_el else ""
                )
                if found_company and not self.validate_company_match(
                    company["company_name"], found_company
                ):
                    continue

                job_url = ""
                if link_el:
                    href = link_el["href"]
                    job_url = (
                        href
                        if href.startswith("http")
                        else urljoin("https://www.linkedin.com", href)
                    )

                # Generate external_id from LinkedIn URL
                ext_id = ""
                if job_url:
                    m = re.search(r'/view/(\d+)', job_url) or re.search(r'-(\d{8,})(?:\?|$)', job_url)
                    if m:
                        ext_id = f"linkedin_{m.group(1)}"

                jobs.append({
                    "title": title,
                    "company_name": company["company_name"],
                    "job_url": job_url,
                    "location": (
                        location_el.get_text(strip=True) if location_el else ""
                    ),
                    "source": "linkedin_company",
                    "source_language": "",
                    "external_id": ext_id,
                })

        return jobs
