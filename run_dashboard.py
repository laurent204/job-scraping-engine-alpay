"""
Unified entry point: starts the BackgroundScheduler + Flask dashboard.

Usage:
    python run_dashboard.py
"""

import logging
import os

from config.settings import DATABASE_URL
from scheduler import get_scheduler
from storage.database import init_db
from web import create_app

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("dashboard")


def main():
    init_db(DATABASE_URL)

    scheduler = get_scheduler()
    scheduler.start()
    logger.info("Background scheduler started.")

    app = create_app(scheduler)

    host = os.getenv("DASHBOARD_HOST", "0.0.0.0")
    port = int(os.getenv("DASHBOARD_PORT", "5000"))
    debug = os.getenv("FLASK_DEBUG", "0") == "1"

    logger.info("Dashboard running on http://%s:%d", host, port)
    app.run(host=host, port=port, debug=debug)


if __name__ == "__main__":
    main()
