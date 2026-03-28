import logging
import re
from typing import Optional

import gspread
from oauth2client.service_account import ServiceAccountCredentials

from config.settings import GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_FILE, GENERIC_EMAIL_DOMAINS

logger = logging.getLogger(__name__)

SCOPES = [
    "https://spreadsheets.google.com/feeds",
    "https://www.googleapis.com/auth/drive.readonly",
]

# Columns (0-indexed):
#  0  A  Company name
#  1  B  Street address
#  2  C  Postal Code
#  3  D  City
#  4  E  SIze (Group-S size: medium, Large, XL, XXL)
#  5  F  Emails
#  6  G  Email Domain
#  7  H  Valid domain (TRUE/FALSE)
#  8  I  Belgium Company Website (AI response text — NOT a clean URL)
#  9  J  Response AI Search
# 10  K  URL Extraction (extracted domain from AI text)
# 11  L  Domain Verification (clean verified domain, e.g. "vandecasteele.be")
# 12  M  Job Page URL (2) (may contain URLs, markdown links, or failure text)
# 13  N  Company Name LinkedInn
# 14  O  Website (full URL from LinkedIn, e.g. "https://vandecasteele.be/")
# 15  P  Employee Count
# 16  Q  Size (LinkedIn size, e.g. "11-50 employees")
# 17  R  Industry
# 18  S  Description
# 19  T  LinkedIn Company URL
# 20  U  Find HR People


def _parse_int(value: str) -> Optional[int]:
    if not value:
        return None
    try:
        # Handle "1,001-5,000 employees" or plain numbers
        cleaned = re.sub(r"[^\d]", "", str(value).split("-")[0].split(" ")[0])
        return int(cleaned) if cleaned else None
    except (ValueError, TypeError):
        return None


_COMPANY_SIZE_MAP = {
    "small": "Small",
    "medium": "Medium",
    "large": "Large",
    "xl": "XL",
    "xxl": "XXL",
    "public": "Public",
}


def _normalize_company_size(value: str) -> str:
    """Normalize company_size to enum: Small, Medium, Large, XL, XXL, Public."""
    if not value:
        return ""
    normalized = _COMPANY_SIZE_MAP.get(value.strip().lower())
    if normalized:
        return normalized
    logger.warning("Unknown company_size value: '%s'", value)
    return value.strip()


def _extract_job_page_url(raw: str) -> str:
    """
    Clean the Job Page URL field which may contain:
    - A clean URL: "https://vandecasteele.be/en/jobs"
    - A markdown link: "[Job page URL](https://www.climagroup.be/nl/jobs)"
    - Failure text: "I was unable to locate the job page URL on..."
    - Empty string
    """
    raw = raw.strip()
    if not raw:
        return ""

    # Check if it's obviously not a URL (AI failure text)
    failure_indicators = [
        "could not find", "unable to", "couldn't find", "was not found",
        "does not appear", "no direct", "not available", "issue accessing",
    ]
    if any(indicator in raw.lower() for indicator in failure_indicators):
        # But it might still contain a URL embedded in the text
        pass

    # Try to extract URL from markdown link: [text](url)
    md_match = re.search(r'\[.*?\]\((https?://[^\s)]+)\)', raw)
    if md_match:
        return md_match.group(1)

    # If it starts with http, it's a URL
    if raw.startswith("http://") or raw.startswith("https://"):
        # Take only the URL part (stop at whitespace)
        return raw.split()[0]

    # If it looks like a domain-based path (e.g. "vandecasteele.be" shouldn't happen here
    # but job page URLs should be full URLs)
    url_match = re.search(r'(https?://[^\s"\'<>]+)', raw)
    if url_match:
        return url_match.group(1)

    return ""


def _build_website_url(domain_verification: str, linkedin_website: str) -> str:
    """
    Build the best website URL from available data.
    Priority: Domain Verification (col L) > LinkedIn Website (col O)
    """
    # Domain Verification has clean domains like "vandecasteele.be"
    if domain_verification:
        domain = domain_verification.strip().lower()
        if domain and "." in domain and " " not in domain:
            return f"https://{domain}"

    # LinkedIn Website has full URLs like "https://vandecasteele.be/"
    if linkedin_website:
        url = linkedin_website.strip()
        if url.startswith("http"):
            return url

    return ""


def read_companies() -> list[dict]:
    """Read the Google Sheet and return a deduplicated list of company dicts."""
    creds = ServiceAccountCredentials.from_json_keyfile_name(
        GOOGLE_SERVICE_ACCOUNT_FILE, SCOPES
    )
    client = gspread.authorize(creds)
    sheet = client.open_by_key(GOOGLE_SHEET_ID).sheet1
    rows = sheet.get_all_values()

    if not rows:
        logger.warning("Google Sheet is empty.")
        return []

    # Skip header row
    data_rows = rows[1:]
    seen_domains: set[str] = set()
    companies: list[dict] = []
    skipped_generic = 0
    skipped_invalid = 0
    skipped_duplicate = 0

    for row in data_rows:
        # Pad row to at least 21 columns to avoid IndexError
        row = row + [""] * (21 - len(row))

        email_domain = row[6].strip().lower()   # G: Email Domain
        valid_domain = row[7].strip().upper()    # H: Valid domain (TRUE/FALSE)

        # Skip rows without a domain
        if not email_domain:
            continue
        domain_root = email_domain.split("@")[-1] if "@" in email_domain else email_domain

        # Skip generic email domains (gmail, hotmail, skynet, telenet...)
        if domain_root in GENERIC_EMAIL_DOMAINS:
            skipped_generic += 1
            continue

        # Skip rows explicitly marked as invalid domain
        if valid_domain == "FALSE":
            skipped_invalid += 1
            continue

        # Deduplicate on email_domain
        if domain_root in seen_domains:
            skipped_duplicate += 1
            continue
        seen_domains.add(domain_root)

        website_url = _build_website_url(
            domain_verification=row[11],   # L: Domain Verification
            linkedin_website=row[14],      # O: Website (from LinkedIn)
        )
        job_page_url = _extract_job_page_url(row[12])  # M: Job Page URL (2)

        company = {
            "company_name": row[0].strip(),            # A
            "street_address": row[1].strip(),           # B
            "zip": row[2].strip(),                     # C
            "locality": row[3].strip(),                # D
            "company_size": _normalize_company_size(row[4]),  # E (Group-S size)
            "domain": domain_root,                     # G (cleaned)
            "company_url": website_url,                # Built from L + O
            "job_page_url": job_page_url,              # M (cleaned)
            "linkedin_company_name": row[13].strip(),  # N
            "employee_count": _parse_int(row[15]),     # P
            "industry": row[17].strip(),               # R
            "linkedin_company_url": row[19].strip(),   # T
            "contact_name": row[20].strip(),              # U (Find HR People)
            "is_group_s_client": True,
        }
        companies.append(company)

    logger.info(
        "Loaded %d unique companies from Google Sheet "
        "(skipped: %d generic, %d invalid, %d duplicate).",
        len(companies), skipped_generic, skipped_invalid, skipped_duplicate,
    )
    return companies
