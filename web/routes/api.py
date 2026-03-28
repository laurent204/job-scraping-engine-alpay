"""
JSON API endpoints for dashboard charts.
"""

from datetime import datetime, timezone, timedelta

from flask import Blueprint, jsonify
from sqlalchemy import func

from storage.database import get_session
from storage.models import Job, Company, ScrapeRun

bp = Blueprint("api", __name__)


@bp.route("/kpis")
def kpis():
    with get_session() as s:
        week_ago = datetime.now(timezone.utc) - timedelta(days=7)

        total_jobs = s.query(func.count(Job.id)).filter(Job.is_active == True).scalar() or 0  # noqa: E712
        new_this_week = s.query(func.count(Job.id)).filter(Job.created_at >= week_ago).scalar() or 0
        total_companies = s.query(func.count(Company.id)).scalar() or 0

        last_run = s.query(ScrapeRun).order_by(ScrapeRun.started_at.desc()).first()
        last_run_data = None
        if last_run:
            last_run_data = {
                "run_type": last_run.run_type,
                "status": last_run.status,
                "started_at": last_run.started_at.isoformat() if last_run.started_at else None,
                "jobs_found": last_run.jobs_found or 0,
                "jobs_new": last_run.jobs_new or 0,
            }

    return jsonify({
        "total_jobs": total_jobs,
        "new_this_week": new_this_week,
        "total_companies": total_companies,
        "last_run": last_run_data,
    })


@bp.route("/jobs-over-time")
def jobs_over_time():
    """Jobs discovered per week for the last 12 weeks."""
    with get_session() as s:
        twelve_weeks_ago = datetime.now(timezone.utc) - timedelta(weeks=12)

        rows = (
            s.query(
                func.date_trunc("week", Job.created_at).label("week"),
                func.count(Job.id),
            )
            .filter(Job.created_at >= twelve_weeks_ago)
            .group_by("week")
            .order_by("week")
            .all()
        )

    labels = []
    values = []
    for week, count in rows:
        labels.append(week.strftime("%d %b") if week else "")
        values.append(count)

    return jsonify({"labels": labels, "values": values})


@bp.route("/jobs-by-source")
def jobs_by_source():
    with get_session() as s:
        rows = (
            s.query(Job.source, func.count(Job.id))
            .filter(Job.is_active == True)  # noqa: E712
            .group_by(Job.source)
            .all()
        )

    labels = [r[0] or "unknown" for r in rows]
    values = [r[1] for r in rows]
    return jsonify({"labels": labels, "values": values})


@bp.route("/jobs-by-category")
def jobs_by_category():
    with get_session() as s:
        rows = (
            s.query(Job.category, func.count(Job.id))
            .filter(Job.is_active == True, Job.category != None)  # noqa: E711, E712
            .group_by(Job.category)
            .order_by(func.count(Job.id).desc())
            .all()
        )

    labels = [r[0] for r in rows]
    values = [r[1] for r in rows]
    return jsonify({"labels": labels, "values": values})
