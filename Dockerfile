# AtmosphereX Production Dockerfile
FROM python:3.13-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000 \
    PYTHONPATH="/app:$PYTHONPATH" \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /app

# Create an isolated virtual environment to suppress root user warnings
RUN python -m venv /opt/venv

# Install dependencies inside the virtual environment
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Expose default application port
EXPOSE 8000

# Start production server using python run.py
CMD ["python", "run.py"]
