FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH="/app"

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Install uv for fast package management
RUN pip install uv

# Set work directory
WORKDIR /app

# Copy pyproject.toml
COPY pyproject.toml ./

# Install dependencies
RUN uv sync --no-dev

# Copy application code
COPY . .

# Create directories for repositories and data
RUN mkdir -p /app/repositories /app/data

# Create non-root user
RUN useradd --create-home --shell /bin/bash atlantis \
    && chown -R atlantis:atlantis /app
USER atlantis

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start the application
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
