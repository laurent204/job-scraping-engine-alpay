"""
Dashboard HTML routes — overview, scrape runs, jobs, companies.
"""

from datetime import datetime, timezone, timedelta

from flask import Blueprint, render_template, request
from sqlalchemy import func, desc

from storage.database import get_session
from storage.models import Job, Company, ScrapeRun

bp = Blueprint("dashboard", __name__)


@bp.route("/")
def index():
    with get_session() as s:
        week_ago = datetime.now(timezone.utc) - timedelta(days=7)

        total_jobs = s.query(func.count(Job.id)).filter(Job.is_active == True).scalar() or 0  # noqa: E712
        new_this_week = s.query(func.count(Job.id)).filter(Job.created_at >= week_ago).scalar() or 0
        total_companies = s.query(func.count(Company.id)).scalar() or 0

        last_run = s.query(ScrapeRun).order_by(desc(ScrapeRun.started_at)).first()
        last_run_info = None
        if last_run:
            last_run_info = {
                "run_type": last_run.run_type,
                "status": last_run.status,
                "started_at": last_run.started_at,
                "jobs_found": last_run.jobs_found or 0,
                "jobs_new": last_run.jobs_new or 0,
            }

    return render_template(
        "dashboard/index.html",
        total_jobs=total_jobs,
        new_this_week=new_this_week,
        total_companies=total_companies,
        last_run=last_run_info,
    )


@bp.route("/scrape-runs")
def scrape_runs():
    page = request.args.get("page", 1, type=int)
    per_page = 20

    with get_session() as s:
        total = s.query(func.count(ScrapeRun.id)).scalar() or 0
        runs = (
            s.query(ScrapeRun)
            .order_by(desc(ScrapeRun.started_at))
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )
        # Detach data before session closes
        runs_data = []
        for r in runs:
            duration = None
            if r.started_at and r.finished_at:
                duration = int((r.finished_at - r.started_at).total_seconds())
            runs_data.append({
                "id": r.id,
                "run_type": r.run_type,
                "started_at": r.started_at,
                "finished_at": r.finished_at,
                "duration": duration,
                "status": r.status,
                "jobs_found": r.jobs_found or 0,
                "jobs_new": r.jobs_new or 0,
                "errors": r.errors,
            })

    total_pages = max(1, (total + per_page - 1) // per_page)
    return render_template(
        "dashboard/scrape_runs.html",
        runs=runs_data,
        page=page,
        total_pages=total_pages,
    )


@bp.route("/jobs")
def jobs():
    page = request.args.get("page", 1, type=int)
    per_page = 50
    source = request.args.get("source", "")
    category = request.args.get("category", "")
    search = request.args.get("search", "")

    with get_session() as s:
        q = s.query(Job)

        if source:
            q = q.filter(Job.source == source)
        if category:
            q = q.filter(Job.category == category)
        if search:
            q = q.filter(
                (Job.title.ilike(f"%{search}%")) | (Job.company_name.ilike(f"%{search}%"))
            )

        total = q.count()
        rows = (
            q.order_by(desc(Job.created_at))
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )

        jobs_data = []
        for j in rows:
            jobs_data.append({
                "id": j.id,
                "title": j.title,
                "company_name": j.company_name,
                "source": j.source,
                "category": j.category,
                "location": j.location,
                "locality": j.locality,
                "is_active": j.is_active,
                "job_url": j.job_url,
                "created_at": j.created_at,
            })

        # Get distinct values for filter dropdowns
        sources = [r[0] for r in s.query(Job.source).distinct().all() if r[0]]
        categories = [r[0] for r in s.query(Job.category).distinct().all() if r[0]]

    total_pages = max(1, (total + per_page - 1) // per_page)
    return render_template(
        "dashboard/jobs.html",
        jobs=jobs_data,
        page=page,
        total_pages=total_pages,
        total=total,
        sources=sources,
        categories=categories,
        current_source=source,
        current_category=category,
        current_search=search,
    )


@bp.route("/companies")
def companies():
    page = request.args.get("page", 1, type=int)
    per_page = 50

    with get_session() as s:
        job_count_sq = (
            s.query(Job.company_id, func.count(Job.id).label("job_count"))
            .filter(Job.company_id != None)  # noqa: E711
            .group_by(Job.company_id)
            .subquery()
        )

        q = s.query(
            Company.id,
            Company.name,
            Company.domain,
            Company.region,
            Company.industry,
            Company.last_scraped_at,
            func.coalesce(job_count_sq.c.job_count, 0).label("job_count"),
        ).outerjoin(
            job_count_sq, Company.id == job_count_sq.c.company_id
        )

        total = s.query(func.count(Company.id)).scalar() or 0
        rows = (
            q.order_by(func.coalesce(job_count_sq.c.job_count, 0).desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )

        companies_data = []
        for row in rows:
            companies_data.append({
                "id": row.id,
                "name": row.name,
                "domain": row.domain,
                "region": row.region,
                "industry": row.industry,
                "company_size": None,
                "job_count": row.job_count,
                "last_scraped_at": row.last_scraped_at,
            })

    total_pages = max(1, (total + per_page - 1) // per_page)
    return render_template(
        "dashboard/companies.html",
        companies=companies_data,
        page=page,
        total_pages=total_pages,
        total=total,
    )
