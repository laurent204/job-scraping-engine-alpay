"""
Scheduler management routes — view, modify, trigger, pause/resume cron jobs.
"""

import logging
from datetime import datetime, timezone

from flask import Blueprint, render_template, request, redirect, url_for, flash, current_app
from apscheduler.triggers.cron import CronTrigger

bp = Blueprint("scheduler_views", __name__)
logger = logging.getLogger(__name__)

DAYS_OF_WEEK = [
    ("mon", "Monday"),
    ("tue", "Tuesday"),
    ("wed", "Wednesday"),
    ("thu", "Thursday"),
    ("fri", "Friday"),
    ("sat", "Saturday"),
    ("sun", "Sunday"),
]


def _get_scheduler():
    return current_app.config["SCHEDULER"]


def _job_info(job):
    """Extract display info from an APScheduler job."""
    trigger = job.trigger
    day = hour = minute = None
    if hasattr(trigger, "fields"):
        for field in trigger.fields:
            if field.name == "day_of_week":
                day = str(field)
            elif field.name == "hour":
                hour = str(field)
            elif field.name == "minute":
                minute = str(field)

    return {
        "id": job.id,
        "name": job.name,
        "next_run": job.next_run_time,
        "day": day,
        "hour": hour,
        "minute": minute,
        "paused": job.next_run_time is None,
    }


@bp.route("/")
def index():
    scheduler = _get_scheduler()
    jobs = [_job_info(j) for j in scheduler.get_jobs()]
    return render_template(
        "scheduler/index.html",
        jobs=jobs,
        days=DAYS_OF_WEEK,
    )


@bp.route("/modify/<job_id>", methods=["POST"])
def modify(job_id):
    scheduler = _get_scheduler()
    day = request.form.get("day", "sun")
    hour = request.form.get("hour", "2", type=int)
    minute = request.form.get("minute", "0", type=int)

    try:
        scheduler.reschedule_job(
            job_id,
            trigger=CronTrigger(day_of_week=day, hour=hour, minute=minute),
        )
        flash(f"Schedule updated: {job_id} → {day} {hour:02d}:{minute:02d}", "success")
        logger.info("Rescheduled %s to %s %02d:%02d", job_id, day, hour, minute)
    except Exception as e:
        flash(f"Error: {e}", "error")
        logger.exception("Failed to reschedule %s", job_id)

    return redirect(url_for("scheduler_views.index"))


@bp.route("/trigger/<job_id>", methods=["POST"])
def trigger(job_id):
    """Trigger an immediate one-off run."""
    scheduler = _get_scheduler()
    job = scheduler.get_job(job_id)
    if not job:
        flash(f"Job {job_id} not found", "error")
        return redirect(url_for("scheduler_views.index"))

    try:
        # Add a one-off job that runs immediately using the same function
        manual_id = f"manual_{job_id}_{int(datetime.now(timezone.utc).timestamp())}"
        scheduler.add_job(
            job.func,
            "date",
            run_date=datetime.now(timezone.utc),
            id=manual_id,
            name=f"Manual: {job.name}",
        )
        flash(f"Manual run triggered for {job.name}", "success")
        logger.info("Manual run triggered: %s", job_id)
    except Exception as e:
        flash(f"Error: {e}", "error")
        logger.exception("Failed to trigger manual run for %s", job_id)

    return redirect(url_for("scheduler_views.index"))


@bp.route("/pause/<job_id>", methods=["POST"])
def pause(job_id):
    scheduler = _get_scheduler()
    try:
        scheduler.pause_job(job_id)
        flash(f"Job {job_id} paused", "success")
    except Exception as e:
        flash(f"Error: {e}", "error")

    return redirect(url_for("scheduler_views.index"))


@bp.route("/resume/<job_id>", methods=["POST"])
def resume(job_id):
    scheduler = _get_scheduler()
    try:
        scheduler.resume_job(job_id)
        flash(f"Job {job_id} resumed", "success")
    except Exception as e:
        flash(f"Error: {e}", "error")

    return redirect(url_for("scheduler_views.index"))
