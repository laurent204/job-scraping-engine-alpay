"""
Send summary reports after each scrape run via email (SMTP) or Slack webhook.
"""

import json
import logging
import smtplib
from email.mime.text import MIMEText

import httpx

from config.settings import (
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASSWORD,
    NOTIFICATION_EMAIL,
    SLACK_WEBHOOK_URL,
)

logger = logging.getLogger(__name__)


def send_report(title: str, stats: dict):
    """Dispatch a summary report to all configured channels."""
    body = _format_report(title, stats)

    if SLACK_WEBHOOK_URL:
        _send_slack(body)

    if SMTP_HOST and NOTIFICATION_EMAIL:
        _send_email(title, body)

    if not SLACK_WEBHOOK_URL and not (SMTP_HOST and NOTIFICATION_EMAIL):
        logger.info("No notification channels configured. Report:\n%s", body)


def _format_report(title: str, stats: dict) -> str:
    found = stats.get("found", 0)
    new = stats.get("new", 0)
    errors = stats.get("errors", [])

    lines = [
        f"*{title}*",
        f"Jobs found: {found}",
        f"New jobs: {new}",
        f"Duplicates skipped: {found - new}",
    ]
    if errors:
        lines.append(f"Errors: {len(errors)}")
        for err in errors[:5]:
            lines.append(f"  - {err}")
    return "\n".join(lines)


def _send_slack(text: str):
    try:
        resp = httpx.post(
            SLACK_WEBHOOK_URL,
            json={"text": text},
            timeout=10,
        )
        resp.raise_for_status()
        logger.info("Slack notification sent.")
    except Exception:
        logger.exception("Failed to send Slack notification.")


def _send_email(subject: str, body: str):
    try:
        msg = MIMEText(body)
        msg["Subject"] = f"[Job Harvester] {subject}"
        msg["From"] = SMTP_USER
        msg["To"] = NOTIFICATION_EMAIL

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        logger.info("Email notification sent to %s.", NOTIFICATION_EMAIL)
    except Exception:
        logger.exception("Failed to send email notification.")
