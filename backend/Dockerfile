FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PORT=8080

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install anthropic celery redis

COPY . .

RUN useradd -m myuser && chown -R myuser /app
USER myuser

EXPOSE ${PORT:-8080}
CMD sh -c "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080} --forwarded-allow-ips '*'"
