import hashlib
from urllib.parse import urlparse

from rapidfuzz import fuzz


class JobDeduplicator:

    def __init__(self, title_threshold: int = 85, company_threshold: int = 80):
        self.title_threshold = title_threshold
        self.company_threshold = company_threshold

    def is_duplicate(
        self, job: dict, existing_jobs: list
    ) -> tuple:
        """
        Check if *job* is a duplicate of any entry in *existing_jobs*.
        Returns (is_dup, existing_job_id).

        Layer 0: external_id exact match (PRIMARY)
        Layer 1: Hash match (title+company+locality)
        Layer 2: URL match (domain+path+query)
        Layer 3: Fuzzy match (title+company+same city)
        """
        job_ext_id = job.get("external_id", "")
        job_hash = self._hash(job)
        job_url_key = self._url_key(job.get("job_url", ""))

        for existing in existing_jobs:
            # Layer 0: external_id exact match
            if job_ext_id and existing.get("external_id") == job_ext_id:
                return True, existing.get("id")

            # Layer 1: Hash match
            if self._hash(existing) == job_hash:
                return True, existing.get("id")

            # Layer 2: URL match
            if job_url_key and job_url_key == self._url_key(
                existing.get("job_url", "")
            ):
                return True, existing.get("id")

            # Layer 3: Fuzzy match
            if self._fuzzy_match(job, existing):
                return True, existing.get("id")

        return False, None

    def deduplicate_batch(self, jobs: list) -> list:
        """Remove duplicates within a batch. Keeps the first occurrence."""
        unique: list = []
        for job in jobs:
            is_dup, _ = self.is_duplicate(job, unique)
            if not is_dup:
                unique.append(job)
        return unique

    # ------------------------------------------------------------------

    @staticmethod
    def _hash(job: dict) -> str:
        key = (
            job.get("title", "").lower().strip()
            + "|"
            + job.get("company_name", "").lower().strip()
            + "|"
            + (job.get("locality") or job.get("location", "")).lower().strip()
        )
        return hashlib.md5(key.encode()).hexdigest()

    @staticmethod
    def _url_key(url: str) -> str:
        if not url:
            return ""
        parsed = urlparse(url)
        # Include query for redirect URLs (e.g. indeed.com/rc/clk?jk=...)
        key = f"{parsed.netloc}{parsed.path}".rstrip("/").lower()
        if parsed.query:
            key = f"{key}?{parsed.query.lower()}"
        return key

    def _fuzzy_match(self, a: dict, b: dict) -> bool:
        title_a = a.get("title", "").lower()
        title_b = b.get("title", "").lower()
        if not title_a or not title_b:
            return False

        company_a = a.get("company_name", "").lower()
        company_b = b.get("company_name", "").lower()

        if fuzz.ratio(title_a, title_b) < self.title_threshold:
            return False
        if fuzz.ratio(company_a, company_b) < self.company_threshold:
            return False

        # Same city (if both have one)
        loc_a = (a.get("locality") or a.get("location", "")).lower()
        loc_b = (b.get("locality") or b.get("location", "")).lower()
        if loc_a and loc_b and loc_a != loc_b:
            return False

        return True
