"""
Weekly scheduler for the Job Harvester.

Runs:
  - Sunday 02:00 CET: Part 1 (company websites + LinkedIn Company)
  - Sunday 04:00 CET: Part 2 (Indeed, LinkedIn Jobs, Stepstone)

Usage:
    python scheduler.py          # Start the scheduler daemon (blocking)
    # Or use via run_dashboard.py for background mode + web UI
"""

import asyncio
import logging

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger

from config.settings import DATABASE_URL
from main import run_part1, run_part2
from notifications.alerter import send_report
from storage.database import init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("scheduler")

_scheduler = None


def job_part1():
    logger.info("Scheduled run: Part 1 starting")
    init_db(DATABASE_URL)
    stats = asyncio.run(run_part1())
    send_report("Part 1 — Company scraping", stats)


def job_part2():
    logger.info("Scheduled run: Part 2 starting")
    init_db(DATABASE_URL)
    stats = asyncio.run(run_part2())
    send_report("Part 2 — Job board scraping", stats)


def _add_default_jobs(scheduler):
    """Register the default weekly cron jobs."""
    scheduler.add_job(
        job_part1,
        CronTrigger(day_of_week="sun", hour=2, minute=0),
        id="part1_companies",
        name="Part 1: Company scraping",
        replace_existing=True,
    )
    scheduler.add_job(
        job_part2,
        CronTrigger(day_of_week="sun", hour=4, minute=0),
        id="part2_jobboards",
        name="Part 2: Job board scraping",
        replace_existing=True,
    )


def get_scheduler() -> BackgroundScheduler:
    """Return the singleton BackgroundScheduler (for use with the dashboard)."""
    global _scheduler
    if _scheduler is None:
        _scheduler = BackgroundScheduler(timezone="Europe/Brussels")
        _add_default_jobs(_scheduler)
    return _scheduler


def start():
    """Start in blocking mode (standalone usage without the dashboard)."""
    scheduler = BlockingScheduler(timezone="Europe/Brussels")
    _add_default_jobs(scheduler)
    logger.info("Scheduler started (blocking). Waiting for next run...")
    scheduler.start()


if __name__ == "__main__":
    start()
