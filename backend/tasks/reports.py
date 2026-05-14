from tasks.celery_app import celery_app

@celery_app.task
def generate_daily_report():
    print("Generating daily analytics report for developers...")
    return True
