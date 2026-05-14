from tasks.celery_app import celery_app

@celery_app.task
def send_suspicious_activity_alert(app_id: int, details: dict):
    print(f"Sending webhook/email alert for app {app_id} with details {details}")
    return True
