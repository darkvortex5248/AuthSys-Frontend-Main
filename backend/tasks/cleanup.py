from tasks.celery_app import celery_app
from datetime import datetime, timezone

def utc_now():
    return datetime.now(timezone.utc)

@celery_app.task
def cleanup_expired_sessions():
    print("Running background task: cleanup_expired_sessions")
    # This requires a synchronous DB connection or an async loop wrap
    # Ex: db.query(Session).filter(Session.expires_at < utc_now()).delete()
    return "Cleanup complete"
