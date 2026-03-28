from datetime import datetime, timezone

from sqlalchemy import (
    ARRAY,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    Index,
)
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    domain = Column(String(255), unique=True)
    company_url = Column(String(500))
    company_size = Column(String(20))  # Small, Medium, Large, XL, XXL, Public
    zip = Column(String(10))
    locality = Column(String(100))
    province = Column(String(100))
    region = Column(String(50))  # Wallonie, Flandre, Bruxelles
    street_address = Column(String(500))
    job_page_url = Column(String(500))
    linkedin_company_url = Column(String(500))
    linkedin_company_name = Column(String(255))
    industry = Column(String(255))
    employee_count = Column(Integer)
    contact_name = Column(String(255))
    contact_linkedin_url = Column(String(500))
    is_group_s_client = Column(Boolean, default=True)
    last_scraped_at = Column(DateTime(timezone=True))
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    jobs = relationship("Job", back_populates="company")

    __table_args__ = (Index("ix_companies_domain", "domain"),)


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True)
    external_id = Column(String(255))
    title = Column(String(500), nullable=False)
    company_name = Column(String(255))
    company_id = Column(Integer, ForeignKey("companies.id"))
    location = Column(String(255))
    zip = Column(String(10))
    locality = Column(String(100))
    description = Column(Text)
    summary = Column(Text)
    job_url = Column(String(1000))
    source = Column(String(50), nullable=False)
    category = Column(String(50))
    contract_type = Column(ARRAY(Text))
    benefits = Column(ARRAY(Text))
    salary_min = Column(Integer)
    salary_max = Column(Integer)
    date_posted = Column(DateTime(timezone=True))
    date_discovered = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    scraped_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    is_active = Column(Boolean, default=True)
    status = Column(String(20), default="new")
    source_language = Column(String(5))
    raw_data = Column(JSON)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    company = relationship("Company", back_populates="jobs")
    sources = relationship("JobSource", back_populates="job")

    __table_args__ = (
        Index("ix_jobs_source", "source"),
        Index("ix_jobs_company_id", "company_id"),
        Index("ix_jobs_status", "status"),
        Index("ix_jobs_category", "category"),
        Index("ix_jobs_external_id", "external_id"),
        Index("ix_jobs_is_active", "is_active"),
        Index("ix_jobs_title_company", "title", "company_name"),
    )


class ScrapeRun(Base):
    __tablename__ = "scrape_runs"

    id = Column(Integer, primary_key=True)
    run_type = Column(String(50), nullable=False)
    started_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    finished_at = Column(DateTime(timezone=True))
    status = Column(String(20), default="running")
    jobs_found = Column(Integer, default=0)
    jobs_new = Column(Integer, default=0)
    errors = Column(JSON)


class JobSource(Base):
    __tablename__ = "job_sources"

    id = Column(Integer, primary_key=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    source = Column(String(50), nullable=False)
    source_url = Column(String(1000))
    discovered_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    job = relationship("Job", back_populates="sources")

    __table_args__ = (Index("ix_job_sources_job_id", "job_id"),)
