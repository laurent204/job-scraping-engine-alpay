"""
Enrich jobs that are missing description, salary, job_type, or language.

Strategy per source (optimized for cost):
- Stepstone:  httpx GET → JSON-LD (application/ld+json)   → FREE
- LinkedIn:   httpx GET → guest API jobPosting/{id}        → FREE
- Indeed:     Firecrawl scrape() → markdown                → 1 credit/job
- Website:    Firecrawl scrape() → markdown                → 1 credit/job
"""

import json
import logging
import re
import time
from datetime import datetime, timezone
from html import unescape
from typing import List, Optional
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup
from firecrawl import FirecrawlApp

from config.settings import FIRECRAWL_API_KEY, USER_AGENTS
from processors.normalizer import JobNormalizer, detect_language
from storage.database import get_session
from storage.models import Job

logger = logging.getLogger("enricher")

# ── Helpers ──────────────────────────────────────────────────────────

_HEADERS = {
    "User-Agent": USER_AGENTS[0],
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,fr;q=0.8,nl;q=0.7",
}


def _clean_html(html: str) -> str:
    """Strip HTML tags and collapse whitespace."""
    text = re.sub(r"<[^>]+>", " ", unescape(html))
    return re.sub(r"\s+", " ", text).strip()



def _parse_salary(salary_data) -> tuple:
    """Extract (min, max) from JSON-LD baseSalary."""
    if not salary_data or not isinstance(salary_data, dict):
        return None, None
    value = salary_data.get("value", {})
    if isinstance(value, dict):
        return value.get("minValue"), value.get("maxValue")
    if isinstance(value, (int, float)):
        return int(value), int(value)
    return None, None


def _extract_linkedin_job_id(url: str) -> Optional[str]:
    """Extract numeric job ID from LinkedIn URL."""
    match = re.search(r"/view/(\d+)", url)
    if match:
        return match.group(1)
    match = re.search(r"currentJobId=(\d+)", url)
    if match:
        return match.group(1)
    # Try last numeric segment
    match = re.search(r"-(\d{8,})(?:\?|$)", url)
    if match:
        return match.group(1)
    return None


# ── Source-specific enrichers ────────────────────────────────────────


def _enrich_stepstone(job_url: str, client: httpx.Client) -> dict:
    """
    Fetch Stepstone detail page and extract JSON-LD (free, httpx only).
    NOTE: Stepstone blocks bot access to detail pages (403/timeout).
    This works when not rate-limited; otherwise returns empty.
    """
    result = {}
    try:
        resp = client.get(job_url, follow_redirects=True, timeout=30)
        if resp.status_code != 200:
            logger.debug("Stepstone %d: %s", resp.status_code, job_url)
            return result
        html = resp.text
    except Exception:
        logger.debug("Stepstone fetch failed: %s", job_url)
        return result

    if len(html) < 1000:
        return result

    # Try JSON-LD first
    soup = BeautifulSoup(resp.text, "lxml")
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string)
            if isinstance(data, list):
                data = next((d for d in data if d.get("@type") == "JobPosting"), None)
            if not data or data.get("@type") != "JobPosting":
                continue

            desc = data.get("description", "")
            if desc:
                result["description"] = _clean_html(desc)[:5000]
                result["language"] = detect_language(result["description"])

            emp_type = data.get("employmentType", "")
            if isinstance(emp_type, list):
                emp_type = emp_type[0] if emp_type else ""
            if emp_type:
                result["job_type"] = emp_type

            date = data.get("datePosted")
            if date:
                result["date_posted"] = date

            sal_min, sal_max = _parse_salary(data.get("baseSalary"))
            if sal_min:
                result["salary_min"] = int(sal_min)
            if sal_max:
                result["salary_max"] = int(sal_max)

            break
        except (json.JSONDecodeError, StopIteration):
            continue

    return result


def _enrich_linkedin(job_url: str, client: httpx.Client) -> dict:
    """Fetch LinkedIn guest job posting page and parse HTML."""
    result = {}
    job_id = _extract_linkedin_job_id(job_url)
    if not job_id:
        return result

    api_url = f"https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{job_id}"
    try:
        resp = client.get(api_url, follow_redirects=True, timeout=15)
        if resp.status_code != 200:
            return result
    except Exception:
        logger.debug("LinkedIn fetch failed: %s", api_url)
        return result

    soup = BeautifulSoup(resp.text, "lxml")

    # Description
    desc_el = soup.find("div", class_="show-more-less-html__markup")
    if desc_el:
        result["description"] = _clean_html(str(desc_el))[:5000]
        result["language"] = detect_language(result["description"])

    # Job criteria (seniority, employment type, function, industries)
    criteria = soup.find_all("li", class_="description__job-criteria-item")
    for item in criteria:
        header = item.find("h3")
        value = item.find("span")
        if not header or not value:
            continue
        label = header.get_text(strip=True).lower()
        val = value.get_text(strip=True)
        if "employment type" in label or "type d'emploi" in label or "dienstverband" in label:
            result["job_type"] = val

    # JSON-LD for date
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string)
            if isinstance(data, dict) and data.get("@type") == "JobPosting":
                if data.get("datePosted"):
                    result["date_posted"] = data["datePosted"]
                break
        except (json.JSONDecodeError, TypeError):
            continue

    return result


def _enrich_firecrawl(job_url: str, firecrawl: FirecrawlApp) -> dict:
    """Fetch job page via Firecrawl scrape() and extract text."""
    result = {}
    try:
        response = firecrawl.scrape(job_url, formats=["markdown"])
    except Exception:
        logger.debug("Firecrawl scrape failed: %s", job_url)
        return result

    markdown = getattr(response, "markdown", "") or ""
    if len(markdown) < 100:
        return result

    # Take first 5000 chars as description
    result["description"] = markdown[:5000]
    result["language"] = detect_language(markdown[:2000])
    return result


# ── Main enrichment function ─────────────────────────────────────────


def enrich_jobs(
    limit: int = 0,
    source_filter: Optional[str] = None,
    dry_run: bool = False,
) -> dict:
    """
    Enrich jobs missing description/salary/job_type/language.

    Args:
        limit: Max jobs to enrich (0 = all).
        source_filter: Only enrich jobs from this source.
        dry_run: If True, fetch but don't write to DB.

    Returns:
        Stats dict with counts.
    """
    stats = {"total": 0, "enriched": 0, "failed": 0, "skipped": 0, "credits_used": 0}

    with get_session() as session:
        query = session.query(Job).filter(
            (Job.description == None) | (Job.description == "")  # noqa: E711
        )
        if source_filter:
            query = query.filter(Job.source == source_filter)
        query = query.order_by(Job.id)

        jobs = query.all()
        if limit > 0:
            jobs = jobs[:limit]

        stats["total"] = len(jobs)
        logger.info("Found %d jobs to enrich", len(jobs))

        if not jobs:
            return stats

        # Group by source for efficient batch processing
        firecrawl = None
        client = httpx.Client(headers=_HEADERS, timeout=60)

        try:
            for i, job in enumerate(jobs):
                url = job.job_url
                if not url:
                    stats["skipped"] += 1
                    continue

                source = job.source or ""
                logger.info(
                    "[%d/%d] Enriching %s — %s (%s)",
                    i + 1, stats["total"], job.title[:40], job.company_name, source,
                )

                enriched = {}
                try:
                    if source == "stepstone":
                        enriched = _enrich_stepstone(url, client)
                    elif source in ("linkedin", "linkedin_company"):
                        enriched = _enrich_linkedin(url, client)
                    elif source in ("indeed", "website"):
                        if firecrawl is None:
                            firecrawl = FirecrawlApp(api_key=FIRECRAWL_API_KEY)
                        enriched = _enrich_firecrawl(url, firecrawl)
                        stats["credits_used"] += 1
                    else:
                        if firecrawl is None:
                            firecrawl = FirecrawlApp(api_key=FIRECRAWL_API_KEY)
                        enriched = _enrich_firecrawl(url, firecrawl)
                        stats["credits_used"] += 1
                except Exception:
                    logger.exception("Failed to enrich job %d", job.id)
                    stats["failed"] += 1
                    continue

                if not enriched or not enriched.get("description"):
                    stats["failed"] += 1
                    continue

                if not dry_run:
                    if enriched.get("description"):
                        job.description = enriched["description"]
                    if enriched.get("language") and not job.source_language:
                        job.source_language = enriched["language"]
                    if enriched.get("job_type") and not job.contract_type:
                        job.contract_type = JobNormalizer._normalize_contract_type(enriched["job_type"])
                    if enriched.get("date_posted") and not job.date_posted:
                        dp = enriched["date_posted"]
                        if isinstance(dp, str):
                            try:
                                job.date_posted = datetime.fromisoformat(
                                    dp.replace("Z", "+00:00")
                                )
                            except ValueError:
                                pass
                    if enriched.get("salary_min") and not job.salary_min:
                        job.salary_min = enriched["salary_min"]
                    if enriched.get("salary_max") and not job.salary_max:
                        job.salary_max = enriched["salary_max"]

                stats["enriched"] += 1
                logger.info(
                    "  → OK: %d chars, lang=%s, type=%s",
                    len(enriched.get("description", "")),
                    enriched.get("language", "?"),
                    enriched.get("job_type", "?"),
                )

                # Rate-limit: 2s between free sources, 1s for Firecrawl
                if source in ("stepstone", "linkedin", "linkedin_company"):
                    time.sleep(2)
                else:
                    time.sleep(1)

        finally:
            client.close()

    logger.info(
        "Enrichment done: %d/%d enriched, %d failed, %d skipped, %d credits used",
        stats["enriched"], stats["total"], stats["failed"],
        stats["skipped"], stats["credits_used"],
    )
    return stats
