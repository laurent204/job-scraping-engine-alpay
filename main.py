"""
Job Harvester Engine — main entry point.

Usage:
    python main.py --part 1        # Scrape company websites + LinkedIn Company
    python main.py --part 2        # Scrape job boards (Indeed, LinkedIn Jobs, Stepstone)
    python main.py --all           # Both parts
    python main.py --enrich        # Enrich jobs missing descriptions
    python main.py --dry-run       # Test without saving to DB
"""

import asyncio
import logging
import time
from datetime import datetime, timezone

import click

from config.settings import DATABASE_URL
from processors.classifier import JobClassifier
from processors.deduplicator import JobDeduplicator
from processors.normalizer import JobNormalizer, zip_to_region
from storage.database import init_db, get_session
from storage.google_sheet import read_companies
from storage.models import Company, Job, JobSource, ScrapeRun

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("harvester")


# ------------------------------------------------------------------
# Part 1: Company-targeted scraping
# ------------------------------------------------------------------

async def run_part1(dry_run: bool = False) -> dict:
    from scrapers.website_scraper import WebsiteScraper
    from scrapers.linkedin_company import LinkedInCompanyScraper

    logger.info("=== Part 1: Company-targeted scraping ===")
    stats = {"found": 0, "new": 0, "errors": []}

    companies = read_companies()
    logger.info("Loaded %d companies from Google Sheet", len(companies))

    if not dry_run:
        _sync_companies(companies)

    with get_session() as session:
        ws = WebsiteScraper(session)
        website_jobs = await ws.scrape(companies)
        logger.info("Website scraper found %d raw jobs", len(website_jobs))

        lcs = LinkedInCompanyScraper(session)
        linkedin_jobs = await lcs.scrape(companies)
        logger.info("LinkedIn Company scraper found %d raw jobs", len(linkedin_jobs))

    all_raw = website_jobs + linkedin_jobs
    processed = _process_jobs(all_raw, stats, classify=True)

    if not dry_run:
        _save_jobs(processed, stats, run_type="part1_companies")

    return stats


# ------------------------------------------------------------------
# Part 2: Job board scraping
# ------------------------------------------------------------------

async def run_part2(dry_run: bool = False) -> dict:
    from scrapers.jobboard_scraper import JobBoardScraper

    logger.info("=== Part 2: Job board scraping ===")
    stats = {"found": 0, "new": 0, "errors": []}

    with get_session() as session:
        jbs = JobBoardScraper(session)
        board_jobs = await jbs.scrape()
        logger.info("Job board scraper found %d raw jobs", len(board_jobs))

    processed = _process_jobs(board_jobs, stats, classify=True)

    if not dry_run:
        _save_jobs(processed, stats, run_type="part2_jobboards")

    return stats


# ------------------------------------------------------------------
# Processing pipeline
# ------------------------------------------------------------------

def _process_jobs(
    raw_jobs: list, stats: dict, classify: bool = False
) -> list:
    normalizer = JobNormalizer()
    deduplicator = JobDeduplicator()
    classifier = JobClassifier()

    normalized = [
        normalizer.normalize(j, j.get("source", "unknown")) for j in raw_jobs
    ]
    stats["found"] = len(normalized)

    unique = deduplicator.deduplicate_batch(normalized)
    logger.info(
        "After dedup: %d unique jobs (removed %d duplicates)",
        len(unique),
        len(normalized) - len(unique),
    )

    if classify:
        for job in unique:
            if not job.get("category"):
                categories = classifier.classify(job)
                job["category"] = categories[0] if categories else None

    return unique


def _sync_companies(companies: list):
    """Create or update companies in the database."""
    with get_session() as session:
        for c in companies:
            existing = (
                session.query(Company)
                .filter_by(domain=c["domain"])
                .first()
            )
            # Derive province + region from zip
            province, region = zip_to_region(c.get("zip"))

            if existing:
                for key in (
                    "name", "street_address", "zip", "locality", "company_size",
                    "company_url", "job_page_url", "linkedin_company_url",
                    "linkedin_company_name", "industry", "employee_count",
                    "contact_name",
                ):
                    val = c.get(key if key != "name" else "company_name")
                    if val:
                        setattr(existing, key if key != "name" else "name", val)
                if province:
                    existing.province = province
                if region:
                    existing.region = region
            else:
                session.add(Company(
                    name=c["company_name"],
                    street_address=c.get("street_address"),
                    zip=c.get("zip"),
                    locality=c.get("locality"),
                    company_size=c.get("company_size"),
                    domain=c["domain"],
                    company_url=c.get("company_url"),
                    job_page_url=c.get("job_page_url"),
                    linkedin_company_url=c.get("linkedin_company_url"),
                    linkedin_company_name=c.get("linkedin_company_name"),
                    industry=c.get("industry"),
                    employee_count=c.get("employee_count"),
                    is_group_s_client=c.get("is_group_s_client", True),
                    contact_name=c.get("contact_name"),
                    province=province,
                    region=region,
                ))
        logger.info("Synced %d companies to database", len(companies))


def _save_jobs(jobs: list, stats: dict, run_type: str):
    """Persist new jobs and record the scrape run."""
    deduplicator = JobDeduplicator()

    with get_session() as session:
        run = ScrapeRun(run_type=run_type, status="running")
        session.add(run)
        session.flush()

        # Load existing jobs for cross-run dedup
        existing = session.query(Job).filter(Job.is_active == True).all()  # noqa: E712
        existing_dicts = [
            {
                "id": j.id,
                "external_id": j.external_id or "",
                "title": j.title,
                "company_name": j.company_name,
                "location": j.location or "",
                "locality": j.locality or "",
                "job_url": j.job_url or "",
            }
            for j in existing
        ]

        new_count = 0
        for job_data in jobs:
            is_dup, existing_id = deduplicator.is_duplicate(job_data, existing_dicts)

            if is_dup and existing_id:
                # Update scraped_at and keep active on re-encounter
                existing_job = session.query(Job).get(existing_id)
                if existing_job:
                    existing_job.scraped_at = datetime.now(timezone.utc)
                    existing_job.is_active = True
                # Add as additional source
                session.add(JobSource(
                    job_id=existing_id,
                    source=job_data["source"],
                    source_url=job_data.get("job_url", ""),
                ))
                continue

            # Link to company if possible
            company_id = None
            if job_data.get("company_name"):
                comp = (
                    session.query(Company)
                    .filter(Company.name == job_data["company_name"])
                    .first()
                )
                if comp:
                    company_id = comp.id
                    comp.last_scraped_at = datetime.now(timezone.utc)

            raw = job_data.pop("raw_data", None)
            job = Job(
                company_id=company_id,
                raw_data=raw,
                **{k: v for k, v in job_data.items() if k != "raw_data"},
            )
            session.add(job)
            session.flush()

            session.add(JobSource(
                job_id=job.id,
                source=job_data["source"],
                source_url=job_data.get("job_url", ""),
            ))

            # Add to existing list for further dedup
            existing_dicts.append({
                "id": job.id,
                "external_id": job.external_id or "",
                "title": job.title,
                "company_name": job.company_name,
                "location": job.location or "",
                "locality": job.locality or "",
                "job_url": job.job_url or "",
            })
            new_count += 1

        run.finished_at = datetime.now(timezone.utc)
        run.status = "completed"
        run.jobs_found = stats["found"]
        run.jobs_new = new_count
        stats["new"] = new_count

        logger.info(
            "Scrape run %s complete: %d found, %d new",
            run_type, stats["found"], new_count,
        )


# ------------------------------------------------------------------
# CLI
# ------------------------------------------------------------------

@click.command()
@click.option("--part", type=int, help="Run part 1 or 2 only")
@click.option("--all", "run_all", is_flag=True, help="Run both parts")
@click.option("--enrich", is_flag=True, help="Enrich jobs missing descriptions")
@click.option("--enrich-limit", type=int, default=0, help="Max jobs to enrich (0=all)")
@click.option("--enrich-source", type=str, default=None, help="Only enrich this source")
@click.option("--dry-run", is_flag=True, help="Test without saving to DB")
def main(part, run_all, enrich, enrich_limit, enrich_source, dry_run):
    start = time.time()

    init_db(DATABASE_URL)

    if enrich:
        from processors.enricher import enrich_jobs
        stats = enrich_jobs(
            limit=enrich_limit,
            source_filter=enrich_source,
            dry_run=dry_run,
        )
        logger.info(
            "Enrichment: %d/%d enriched, %d failed, %d credits used",
            stats["enriched"], stats["total"], stats["failed"], stats["credits_used"],
        )
    elif run_all or part is None:
        stats1 = asyncio.run(run_part1(dry_run))
        stats2 = asyncio.run(run_part2(dry_run))
        _print_report({"part1": stats1, "part2": stats2}, time.time() - start)
    elif part == 1:
        stats = asyncio.run(run_part1(dry_run))
        _print_report({"part1": stats}, time.time() - start)
    elif part == 2:
        stats = asyncio.run(run_part2(dry_run))
        _print_report({"part2": stats}, time.time() - start)
    else:
        click.echo("Invalid part. Use --part 1 or --part 2.")


def _print_report(all_stats: dict, elapsed: float):
    logger.info("=" * 60)
    logger.info("HARVEST REPORT")
    logger.info("=" * 60)
    total_found = 0
    total_new = 0
    for name, stats in all_stats.items():
        found = stats.get("found", 0)
        new = stats.get("new", 0)
        errors = stats.get("errors", [])
        logger.info("  %s: %d found, %d new, %d errors", name, found, new, len(errors))
        total_found += found
        total_new += new
    logger.info("  TOTAL: %d found, %d new", total_found, total_new)
    logger.info("  Duration: %.1f seconds", elapsed)
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
