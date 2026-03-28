# URL paths to test when discovering a company's careers page.
# Ordered from most common to least common.
JOB_PAGE_PATHS = [
    # French
    "/emploi", "/emplois", "/carrieres", "/carriere", "/recrutement",
    "/offres-emploi", "/nous-rejoindre", "/travailler-chez-nous",
    "/fr/emploi", "/fr/carrieres", "/fr/jobs", "/fr/recrutement",
    # Dutch
    "/vacatures", "/jobs", "/werken-bij", "/werken-bij-ons",
    "/carriere", "/nl/vacatures", "/nl/jobs", "/nl/werken-bij",
    # English
    "/careers", "/jobs", "/work-with-us", "/join-us", "/open-positions",
    "/en/careers", "/en/jobs", "/en/work-with-us",
    # Generic
    "/job", "/career", "/recruitment", "/hiring",
]

# Keywords to look for inside <a> tags on the homepage
JOB_LINK_KEYWORDS = [
    "job", "jobs", "career", "careers", "vacature", "vacatures",
    "emploi", "emplois", "carriere", "carrieres", "recrutement",
    "werken", "werk", "recruitment", "hiring", "sollicit",
    "offre", "rejoindre", "travailler",
]
