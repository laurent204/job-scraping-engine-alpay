import re
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple


# Belgian zip code → (province, region) mapping
ZIP_RANGES = [
    (1000, 1299, "Bruxelles-Capitale", "Bruxelles"),
    (1300, 1499, "Brabant wallon", "Wallonie"),
    (1500, 1999, "Brabant flamand", "Flandre"),
    (2000, 2999, "Anvers", "Flandre"),
    (3000, 3499, "Brabant flamand", "Flandre"),
    (3500, 3999, "Limbourg", "Flandre"),
    (4000, 4999, "Liège", "Wallonie"),
    (5000, 5999, "Namur", "Wallonie"),
    (6000, 6599, "Hainaut", "Wallonie"),
    (6600, 6999, "Luxembourg", "Wallonie"),
    (7000, 7999, "Hainaut", "Wallonie"),
    (8000, 8999, "Flandre-Occidentale", "Flandre"),
    (9000, 9999, "Flandre-Orientale", "Flandre"),
]


def zip_to_region(zip_code) -> Tuple[Optional[str], Optional[str]]:
    """Return (province, region) from a Belgian zip code string."""
    try:
        z = int(zip_code)
    except (ValueError, TypeError):
        return None, None
    for lo, hi, province, region in ZIP_RANGES:
        if lo <= z <= hi:
            return province, region
    return None, None


# Belgian city name variants -> canonical form
CITY_ALIASES = {
    "brussel": "Brussels", "bruxelles": "Brussels", "brussels": "Brussels",
    "antwerpen": "Antwerp", "anvers": "Antwerp", "antwerp": "Antwerp",
    "gent": "Ghent", "gand": "Ghent", "ghent": "Ghent",
    "luik": "Liège", "liège": "Liège", "liege": "Liège",
    "leuven": "Leuven", "louvain": "Leuven",
    "namen": "Namur", "namur": "Namur",
    "brugge": "Bruges", "bruges": "Bruges",
    "mechelen": "Mechelen", "malines": "Mechelen",
    "hasselt": "Hasselt", "charleroi": "Charleroi",
    "mons": "Mons", "bergen": "Mons",
    "kortrijk": "Kortrijk", "courtrai": "Kortrijk",
    "aalst": "Aalst", "alost": "Aalst",
    "sint-niklaas": "Sint-Niklaas",
    "tournai": "Tournai", "doornik": "Tournai",
    "genk": "Genk", "wavre": "Wavre", "waver": "Wavre",
    "ottignies": "Ottignies-Louvain-la-Neuve",
    "louvain-la-neuve": "Ottignies-Louvain-la-Neuve",
    "zaventem": "Zaventem", "waterloo": "Waterloo",
}

# Language detection keyword sets
_NL_WORDS = {"en", "van", "voor", "een", "het", "met", "wij", "jij", "onze", "zijn"}
_FR_WORDS = {"et", "des", "pour", "une", "les", "avec", "nous", "vous", "notre", "dans"}
_EN_WORDS = {"and", "the", "for", "with", "you", "our", "your", "will", "are", "this"}


def detect_language(text: str) -> str:
    """Simple keyword-based language detection (nl/fr/en)."""
    if not text:
        return ""
    words = set(re.findall(r"\b\w+\b", text.lower()))
    nl_score = len(words & _NL_WORDS)
    fr_score = len(words & _FR_WORDS)
    en_score = len(words & _EN_WORDS)
    best = max(nl_score, fr_score, en_score)
    if best == 0:
        return ""
    if nl_score == best:
        return "nl"
    if fr_score == best:
        return "fr"
    return "en"


# Patterns to strip from job titles
TITLE_NOISE = re.compile(
    r"\s*\(?\s*[mfxhvd]/[mfxhvd](/[mfxhvd])?\s*\)?\s*$", re.I
)

# Legal forms to normalise in company names
LEGAL_FORMS = re.compile(
    r"\b(NV|SA|BVBA|BV|SPRL|SRL|CVBA|SC|VOF|SNC|COMM\.V|SCS)\b", re.I
)


class JobNormalizer:

    def normalize(self, raw_job: dict, source: str) -> dict:
        location = raw_job.get("location", "")
        zip_code, locality = self._split_location(location)

        contract = self._normalize_contract_type(
            raw_job.get("contract_type", raw_job.get("job_type", ""))
        )

        description = (raw_job.get("description") or "").strip() or None

        # Detect language from explicit field, fallback to description analysis
        lang = (raw_job.get("source_language", raw_job.get("language")) or "")[:2].lower()
        if not lang and description:
            lang = detect_language(description)

        return {
            "title": self._clean_title(raw_job.get("title", "")),
            "company_name": self._clean_company(raw_job.get("company_name", "")),
            "location": location.strip(),
            "zip": zip_code or raw_job.get("zip"),
            "locality": locality or raw_job.get("locality"),
            "job_url": raw_job.get("job_url", "").strip(),
            "description": description,
            "date_posted": self._parse_date(raw_job.get("date_posted")),
            "source": source or raw_job.get("source", "unknown"),
            "category": raw_job.get("category", raw_job.get("segment")),
            "contract_type": contract,
            "salary_min": self._safe_int(raw_job.get("salary_min")),
            "salary_max": self._safe_int(raw_job.get("salary_max")),
            "source_language": lang or None,
            "external_id": raw_job.get("external_id", ""),
            "is_active": True,
            "scraped_at": datetime.now(timezone.utc),
            "raw_data": raw_job,
        }

    @staticmethod
    def _clean_title(title: str) -> str:
        title = title.strip()
        title = TITLE_NOISE.sub("", title)
        words = title.split()
        cleaned = []
        for w in words:
            if w.isupper() and len(w) >= 2:
                cleaned.append(w)
            else:
                cleaned.append(w.capitalize() if w.islower() else w)
        return " ".join(cleaned)

    @staticmethod
    def _clean_company(name: str) -> str:
        name = name.strip()
        name = LEGAL_FORMS.sub(lambda m: m.group(1).upper(), name)
        return name

    @staticmethod
    def _normalize_location(location: str) -> str:
        if not location:
            return ""
        loc = location.strip()
        parts = re.split(r"[,\-|]", loc)
        city_part = parts[0].strip()
        city_part = re.sub(r"^\d{4}\s*", "", city_part)
        canonical = CITY_ALIASES.get(city_part.lower())
        if canonical:
            return canonical
        return loc

    @staticmethod
    def _split_location(location: str) -> tuple:
        """Split location into (zip, locality)."""
        if not location:
            return None, None
        loc = location.strip()

        # Pattern: "1000 Brussels" or "1000 Brussels, Belgium"
        m = re.match(r"^(\d{4})\s+(.+?)(?:,.*)?$", loc)
        if m:
            zip_code = m.group(1)
            city = m.group(2).strip()
            canonical = CITY_ALIASES.get(city.lower(), city)
            return zip_code, canonical

        # Pattern: "Brussels, Belgium" or just "Brussels"
        parts = re.split(r"[,\-|]", loc)
        city = parts[0].strip()
        city = re.sub(r"^\d{4}\s*", "", city)
        canonical = CITY_ALIASES.get(city.lower())
        if canonical:
            return None, canonical
        return None, city if city else None

    @staticmethod
    def _normalize_contract_type(value) -> Optional[list]:
        """Normalize contract type to a list of values."""
        if not value:
            return None
        if isinstance(value, list):
            return value if value else None

        jt_lower = str(value).lower().replace("-", "").replace("_", "").replace(" ", "")
        if "fulltime" in jt_lower or "voltijds" in jt_lower or "tempsplein" in jt_lower or "cdi" in jt_lower:
            return ["CDI"]
        if "parttime" in jt_lower or "deeltijds" in jt_lower or "tempspartiel" in jt_lower:
            return ["CDI"]  # part-time is still CDI in Belgian context
        if "contract" in jt_lower or "interim" in jt_lower or "temporary" in jt_lower or "cdd" in jt_lower:
            return ["CDD"]
        if "freelance" in jt_lower:
            return ["Freelance"]
        if "stage" in jt_lower or "intern" in jt_lower:
            return ["Intérim"]
        return [str(value).strip()]

    @staticmethod
    def _parse_date(value) -> Optional[datetime]:
        if value is None:
            return None
        if isinstance(value, datetime):
            if value.tzinfo is None:
                return value.replace(tzinfo=timezone.utc)
            return value
        if isinstance(value, str):
            value = value.strip()
            # ISO format with timezone
            try:
                return datetime.fromisoformat(value.replace("Z", "+00:00"))
            except ValueError:
                pass
            for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%d/%m/%Y", "%d-%m-%Y"):
                try:
                    return datetime.strptime(value, fmt).replace(
                        tzinfo=timezone.utc
                    )
                except ValueError:
                    continue
            # Relative dates: "3 days ago", "1 week ago"
            return JobNormalizer._parse_relative_date(value)
        return None

    @staticmethod
    def _parse_relative_date(text: str) -> Optional[datetime]:
        text = text.lower().strip()
        match = re.match(r"(\d+)\s+(second|minute|hour|day|week|month)s?\s+ago", text)
        if not match:
            return None
        n = int(match.group(1))
        unit = match.group(2)
        now = datetime.now(timezone.utc)
        deltas = {
            "second": timedelta(seconds=n),
            "minute": timedelta(minutes=n),
            "hour": timedelta(hours=n),
            "day": timedelta(days=n),
            "week": timedelta(weeks=n),
            "month": timedelta(days=n * 30),
        }
        delta = deltas.get(unit)
        return now - delta if delta else None

    @staticmethod
    def _safe_int(value) -> Optional[int]:
        if value is None:
            return None
        try:
            return int(float(value))
        except (ValueError, TypeError):
            return None
