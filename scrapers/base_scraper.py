import asyncio
import logging
import random
from abc import ABC, abstractmethod
from typing import Optional, List

from sqlalchemy.orm import Session

from config.settings import SCRAPE_DELAY_MIN, SCRAPE_DELAY_MAX, USER_AGENTS


class BaseScraper(ABC):
    def __init__(self, session: Session):
        self.session = session
        self.logger = logging.getLogger(self.__class__.__name__)

    @abstractmethod
    async def scrape(self) -> List[dict]:
        """Run the scraper and return a list of raw job dicts."""

    async def _random_delay(self, min_s: Optional[float] = None, max_s: Optional[float] = None):
        delay = random.uniform(
            min_s or SCRAPE_DELAY_MIN,
            max_s or SCRAPE_DELAY_MAX,
        )
        self.logger.debug("Sleeping %.1fs", delay)
        await asyncio.sleep(delay)

    def _get_headers(self) -> dict[str, str]:
        return {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9,fr;q=0.8,nl;q=0.7",
        }
