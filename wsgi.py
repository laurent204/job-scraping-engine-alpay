"""
WSGI entry point for production (gunicorn).
Initializes DB, starts background scheduler, creates Flask app.
"""

import logging

from config.settings import DATABASE_URL
from scheduler import get_scheduler
from storage.database import init_db
from web import create_app

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

init_db(DATABASE_URL)

scheduler = get_scheduler()
scheduler.start()

app = create_app(scheduler)
