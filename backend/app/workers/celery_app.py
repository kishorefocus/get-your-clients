from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery_app = Celery(
    "crm",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_acks_late=True,  # a crashed worker mid-task shouldn't silently drop the job
    worker_prefetch_multiplier=1,  # important for long-ish tasks like bulk geocoding
    task_routes={
        "app.workers.tasks.dispatch_reminder": {"queue": "reminders"},
        "app.workers.tasks.send_outreach_email_step": {"queue": "outreach"},
        "app.workers.tasks.import_csv_rows": {"queue": "ingestion"},
        "app.workers.tasks.refresh_places_grid": {"queue": "ingestion"},
    },
)

celery_app.conf.beat_schedule = {
    "check-due-reminders-every-minute": {
        "task": "app.workers.tasks.check_due_reminders",
        "schedule": crontab(minute="*"),
    },
    # Example scheduled Google Places refresh — uncomment and set real
    # category/location grid cells once step 4 (ingestion) is prioritized.
    # "refresh-places-grid-nightly": {
    #     "task": "app.workers.tasks.refresh_places_grid",
    #     "schedule": crontab(hour=3, minute=0),
    # },
}
