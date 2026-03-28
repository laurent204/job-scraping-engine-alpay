import re
from urllib.parse import quote_plus

import httpx
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright

from config.segments import SEGMENTS
from config.settings import APIFY_API_TOKEN
from scrapers.base_scraper import BaseScraper

STEPSTONE_BASE = "https://www.stepstone.be/en/jobs"


class StepstoneScraper(BaseScraper):
    """Scrape Stepstone.be — via Apify if token available, else direct."""

    async def scrape(self) -> list[dict]:
        all_jobs: list[dict] = []
        for segment_name, kw_sets in SEGMENTS.items():
            keywords = kw_sets.get("keywords_stepstone", [])
            if APIFY_API_TOKEN:
                jobs = await self.scrape_via_apify(segment_name, keywords)
            else:
                jobs = await self.scrape_direct(segment_name, keywords)
            all_jobs.extend(jobs)
            await self._random_delay(min_s=10, max_s=20)
        return all_jobs

    # ------------------------------------------------------------------
    # Apify path
    # ------------------------------------------------------------------

    async def scrape_via_apify(
        self, segment_name: str, keywords: list[str]
    ) -> list[dict]:
        from apify_client import ApifyClient

        self.logger.info("Stepstone (Apify): segment '%s'", segment_name)
        client = ApifyClient(APIFY_API_TOKEN)

        search_term = " ".join(keywords[:3])  # Apify actors often use short queries
        run_input = {
            "searchUrl": f"{STEPSTONE_BASE}/{quote_plus(search_term)}/in-belgium",
            "maxItems": 100,
        }

        try:
            run = client.actor("easyapi~stepstone-jobs-scraper").call(
                run_input=run_input
            )
            dataset = client.dataset(run["defaultDatasetId"]).list_items().items
        except Exception:
            self.logger.exception(
                "Apify failed for Stepstone segment %s", segment_name
            )
            return []

        jobs: list[dict] = []
        for item in dataset:
            jobs.append({
                "title": item.get("title", ""),
                "company_name": item.get("companyName", ""),
                "location": item.get("location", ""),
                "job_url": item.get("url", ""),
                "description": item.get("description", ""),
                "date_posted": item.get("datePosted"),
                "source": "stepstone",
                "segment": segment_name,
            })

        self.logger.info(
            "Stepstone (Apify): segment '%s' yielded %d jobs",
            segment_name,
            len(jobs),
        )
        return jobs

    # ------------------------------------------------------------------
    # Direct scraping fallback
    # ------------------------------------------------------------------

    async def scrape_direct(
        self, segment_name: str, keywords: list[str]
    ) -> list[dict]:
        self.logger.info("Stepstone (direct): segment '%s'", segment_name)
        all_jobs: list[dict] = []

        for keyword in keywords[:3]:
            url = f"{STEPSTONE_BASE}/{quote_plus(keyword)}/in-belgium"
            jobs = await self._scrape_stepstone_pages(url, segment_name)
            all_jobs.extend(jobs)
            await self._random_delay()

        return all_jobs

    async def _scrape_stepstone_pages(
        self, base_url: str, segment_name: str
    ) -> list[dict]:
        jobs: list[dict] = []
        max_pages = 5

        async with async_playwright() as pw:
            browser = await pw.chromium.launch(headless=True)
            page = await browser.new_page()

            for page_num in range(1, max_pages + 1):
                url = base_url if page_num == 1 else f"{base_url}?page={page_num}"
                try:
                    await page.goto(url, wait_until="networkidle", timeout=30_000)
                    html = await page.content()
                except Exception:
                    self.logger.warning("Stepstone page failed: %s", url)
                    break

                soup = BeautifulSoup(html, "lxml")
                cards = soup.find_all(
                    "article", attrs={"data-testid": re.compile("job", re.I)}
                )
                if not cards:
                    # Fallback: any article that looks like a job card
                    cards = soup.select("article[class*='job'], div[class*='job-element']")

                if not cards:
                    break

                for card in cards:
                    title_el = card.find(["h2", "h3", "a"])
                    link_el = card.find("a", href=True)
                    location_el = card.find(
                        class_=re.compile("location|city|lieu", re.I)
                    )
                    company_el = card.find(
                        class_=re.compile("company|employer", re.I)
                    )

                    title = title_el.get_text(strip=True) if title_el else ""
                    if not title:
                        continue

                    job_url = ""
                    if link_el:
                        href = link_el["href"]
                        if href.startswith("/"):
                            job_url = f"https://www.stepstone.be{href}"
                        elif href.startswith("http"):
                            job_url = href

                    jobs.append({
                        "title": title,
                        "company_name": (
                            company_el.get_text(strip=True) if company_el else ""
                        ),
                        "location": (
                            location_el.get_text(strip=True) if location_el else ""
                        ),
                        "job_url": job_url,
                        "source": "stepstone",
                        "segment": segment_name,
                    })

                await self._random_delay()

            await browser.close()

        self.logger.info(
            "Stepstone (direct): '%s' yielded %d jobs", segment_name, len(jobs)
        )
        return jobs
