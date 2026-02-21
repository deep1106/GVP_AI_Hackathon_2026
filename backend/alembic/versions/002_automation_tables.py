"""002_automation_tables

Add automation tables: notifications, domain_events, analytics_summary, automation_logs

Revision ID: 002_automation
Revises: 001
Create Date: 2026-02-21
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = "002_automation"
down_revision = None  # Set to your latest revision ID if you have prior migrations
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── notifications ──────────────────────────────────────────────────────
    op.create_table(
        "notifications",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("type", sa.Enum("safety", "financial", "maintenance", "compliance", "operational",
                                  name="notificationtype"), nullable=False),
        sa.Column("severity", sa.Enum("info", "warning", "critical",
                                      name="notificationseverity"), nullable=False,
                  server_default="info"),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("message", sa.Text, nullable=False),
        sa.Column("entity_type", sa.String(50), nullable=True),
        sa.Column("entity_id", sa.String(36), nullable=True),
        sa.Column("is_read", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime, nullable=False,
                  server_default=sa.text("NOW()")),
    )
    op.create_index("ix_notifications_type", "notifications", ["type"])
    op.create_index("ix_notifications_is_read", "notifications", ["is_read"])
    op.create_index("ix_notifications_created_at", "notifications", ["created_at"])

    # ── domain_events ──────────────────────────────────────────────────────
    op.create_table(
        "domain_events",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("event_type", sa.String(100), nullable=False),
        sa.Column("payload", sa.Text, nullable=False),
        sa.Column("triggered_by", sa.String(36), nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False,
                  server_default=sa.text("NOW()")),
    )
    op.create_index("ix_domain_events_event_type", "domain_events", ["event_type"])
    op.create_index("ix_domain_events_created_at", "domain_events", ["created_at"])

    # ── analytics_summary ──────────────────────────────────────────────────
    op.create_table(
        "analytics_summary",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("period_year", sa.Integer, nullable=False),
        sa.Column("period_month", sa.Integer, nullable=False),
        sa.Column("vehicle_id", sa.String(36), nullable=True),
        sa.Column("total_fuel_cost", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("total_maintenance_cost", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("total_operational_cost", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("total_trips", sa.Integer, nullable=False, server_default="0"),
        sa.Column("total_distance_km", sa.Float, nullable=False, server_default="0"),
        sa.Column("avg_fuel_efficiency", sa.Float, nullable=False, server_default="0"),
        sa.Column("predicted_next_service_km", sa.Float, nullable=True),
        sa.Column("predicted_next_service_date", sa.Date, nullable=True),
        sa.Column("updated_at", sa.DateTime, nullable=False,
                  server_default=sa.text("NOW()")),
    )
    op.create_index("ix_analytics_summary_vehicle_id", "analytics_summary", ["vehicle_id"])
    op.create_index(
        "ix_analytics_period_vehicle",
        "analytics_summary",
        ["period_year", "period_month", "vehicle_id"],
        unique=True,
    )

    # ── automation_logs ────────────────────────────────────────────────────
    op.create_table(
        "automation_logs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("job_name", sa.String(100), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("records_processed", sa.Integer, nullable=False, server_default="0"),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("duration_ms", sa.Integer, nullable=False, server_default="0"),
        sa.Column("ran_at", sa.DateTime, nullable=False, server_default=sa.text("NOW()")),
    )
    op.create_index("ix_automation_logs_job_name", "automation_logs", ["job_name"])
    op.create_index("ix_automation_logs_ran_at", "automation_logs", ["ran_at"])


def downgrade() -> None:
    op.drop_table("automation_logs")
    op.drop_table("analytics_summary")
    op.drop_table("domain_events")
    op.drop_table("notifications")
    op.execute("DROP TYPE IF EXISTS notificationtype")
    op.execute("DROP TYPE IF EXISTS notificationseverity")
