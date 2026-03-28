import asyncio
from functools import partial

from jobspy import scrape_jobs

from config.segments import SEGMENTS
from config.settings import PROXY_LIST
from scrapers.base_scraper import BaseScraper


class JobSpyScraper(BaseScraper):
    """Scrape Indeed + LinkedIn Jobs via the JobSpy library."""

    async def scrape(self) -> list[dict]:
        return await self.scrape_all_segments()

    async def scrape_segment(
        self, segment_name: str, keywords: list[str]
    ) -> list[dict]:
        search_term = " OR ".join(keywords)
        self.logger.info("JobSpy: scraping segment '%s' — %s", segment_name, search_term)

        loop = asyncio.get_running_loop()
        kwargs = dict(
            site_name=["indeed", "linkedin"],
            search_term=search_term,
            location="Belgium",
            country_indeed="Belgium",
            results_wanted=100,
            hours_old=168,  # 7 days
            linkedin_fetch_description=True,
        )
        if PROXY_LIST:
            kwargs["proxies"] = PROXY_LIST

        try:
            df = await loop.run_in_executor(None, partial(scrape_jobs, **kwargs))
        except Exception:
            self.logger.exception("JobSpy failed for segment %s", segment_name)
            return []

        if df is None or df.empty:
            self.logger.info("JobSpy: no results for segment %s", segment_name)
            return []

        jobs: list[dict] = []
        for _, row in df.iterrows():
            jobs.append({
                "title": str(row.get("title", "")),
                "company_name": str(row.get("company_name", "")),
                "location": str(row.get("location", "")),
                "job_url": str(row.get("job_url", "")),
                "description": str(row.get("description", "")),
                "date_posted": row.get("date_posted"),
                "job_type": str(row.get("job_type", "")),
                "salary_min": row.get("min_amount"),
                "salary_max": row.get("max_amount"),
                "source": str(row.get("site", "indeed")),
                "segment": segment_name,
                "external_id": str(row.get("id", "")),
            })

        self.logger.info(
            "JobSpy: segment '%s' yielded %d jobs", segment_name, len(jobs)
        )
        return jobs

    async def scrape_all_segments(self) -> list[dict]:
        all_jobs: list[dict] = []
        for segment_name, kw_sets in SEGMENTS.items():
            keywords = kw_sets.get("keywords_indeed", [])
            jobs = await self.scrape_segment(segment_name, keywords)
            all_jobs.extend(jobs)
            # Respect rate limits between segments
            await self._random_delay(min_s=30, max_s=60)
        return all_jobs
