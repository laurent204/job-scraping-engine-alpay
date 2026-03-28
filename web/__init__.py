"""
Flask application factory for the Job Harvester dashboard.
"""

import os

from flask import Flask


def create_app(scheduler=None):
    app = Flask(
        __name__,
        template_folder="templates",
        static_folder="static",
    )
    app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret-change-me")

    # Store scheduler in app config for access in routes
    app.config["SCHEDULER"] = scheduler

    # Register blueprints
    from web.routes.dashboard import bp as dashboard_bp
    from web.routes.api import bp as api_bp
    from web.routes.scheduler_views import bp as scheduler_bp

    app.register_blueprint(dashboard_bp)
    app.register_blueprint(api_bp, url_prefix="/api")
    app.register_blueprint(scheduler_bp, url_prefix="/scheduler")

    return app
