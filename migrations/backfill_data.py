"""
Backfill data after schema migration 001:
1. Generate external_id for existing jobs
2. Split location into zip + locality
3. Derive region/province from Belgian zip codes
"""

import hashlib
import re
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from config.settings import DATABASE_URL
from storage.database import _build_engine

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
    "genk": "Genk", "wavre": "Wavre", "waver": "Wavre",
    "zaventem": "Zaventem", "waterloo": "Waterloo",
    "deinze": "Deinze", "aalst": "Aalst", "alost": "Aalst",
    "tournai": "Tournai", "doornik": "Tournai",
}


def zip_to_region(zip_code):
    """Return (province, region) from a Belgian zip code string."""
    try:
        z = int(zip_code)
    except (ValueError, TypeError):
        return None, None
    for lo, hi, province, region in ZIP_RANGES:
        if lo <= z <= hi:
            return province, region
    return None, None


def extract_external_id(source, job_url):
    """Generate external_id from source + URL."""
    if not job_url:
        return None

    if source in ("linkedin", "linkedin_company"):
        m = re.search(r"/view/(\d+)", job_url)
        if m:
            return f"linkedin_{m.group(1)}"
        m = re.search(r"currentJobId=(\d+)", job_url)
        if m:
            return f"linkedin_{m.group(1)}"
        m = re.search(r"-(\d{8,})(?:\?|$)", job_url)
        if m:
            return f"linkedin_{m.group(1)}"

    elif source == "stepstone":
        m = re.search(r"--(\d+)(?:-inline)?\.html", job_url)
        if m:
            return f"stepstone_{m.group(1)}"

    elif source == "indeed":
        m = re.search(r"jk=([a-f0-9]+)", job_url)
        if m:
            return f"indeed_{m.group(1)}"

    elif source == "website":
        url_hash = hashlib.md5(job_url.encode()).hexdigest()[:12]
        return f"website_{url_hash}"

    return None


def split_location(location):
    """Split location string into (zip, locality)."""
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

    # Pattern: "Brussels, Belgium" or "Brussels"
    parts = re.split(r"[,\-|]", loc)
    city = parts[0].strip()
    # Strip postal code prefix if embedded
    city = re.sub(r"^\d{4}\s*", "", city)
    canonical = CITY_ALIASES.get(city.lower(), city)
    return None, canonical if canonical != loc else city


def main():
    engine = _build_engine(DATABASE_URL)

    with engine.connect() as conn:
        # Fetch all jobs
        rows = conn.execute(text(
            "SELECT id, source, job_url, external_id, location, zip, locality "
            "FROM jobs ORDER BY id"
        )).fetchall()
        print(f"Processing {len(rows)} jobs...")

        ext_count = 0
        loc_count = 0

        for row in rows:
            job_id, source, job_url, existing_ext, location, existing_zip, existing_loc = row
            updates = {}

            # 1. Generate external_id if missing
            if not existing_ext:
                ext_id = extract_external_id(source, job_url)
                if ext_id:
                    updates["external_id"] = ext_id
                    ext_count += 1
                else:
                    updates["external_id"] = f"legacy_{job_id}"
                    ext_count += 1

            # 2. Split location into zip + locality
            if not existing_zip and not existing_loc and location:
                zip_code, locality = split_location(location)
                if zip_code:
                    updates["zip"] = zip_code
                if locality:
                    updates["locality"] = locality
                if zip_code or locality:
                    loc_count += 1

            if updates:
                set_clauses = ", ".join(f"{k} = :{k}" for k in updates)
                updates["job_id"] = job_id
                conn.execute(
                    text(f"UPDATE jobs SET {set_clauses} WHERE id = :job_id"),
                    updates,
                )

        conn.commit()
        print(f"external_id: {ext_count} backfilled")
        print(f"location split: {loc_count} processed")

        # 3. Derive region/province from zip codes
        rows_with_zip = conn.execute(text(
            "SELECT id, zip FROM jobs WHERE zip IS NOT NULL AND zip != ''"
        )).fetchall()

        region_count = 0
        for row in rows_with_zip:
            job_id, zip_code = row
            province, region = zip_to_region(zip_code)
            if province or region:
                # Jobs don't have province/region columns, but we can store in locality context
                # Actually the spec has zip+locality on jobs, province+region on companies
                # So we skip this for jobs - it's a company-level field
                region_count += 1

        print(f"Jobs with Belgian zip: {region_count}")
        print("Done!")


if __name__ == "__main__":
    main()
