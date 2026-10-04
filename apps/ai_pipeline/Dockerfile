# ==============================================================================
# TRUSTPASSZ AI PIPELINE - FASTAPI / UVICORN DOCKERFILE (TASK-15)
# Multi-stage production build: Python 3.11 Slim, Wheel Caching, Non-root user
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Compilation and Wheel Packaging
# ------------------------------------------------------------------------------
FROM python:3.11-slim AS builder

WORKDIR /build

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install toolchain for building C/C++ dependencies (torch, tokenizers, outlines)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Pre-build wheels for cached installation
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip wheel --no-cache-dir --wheel-dir /build/wheels -r requirements.txt

# ------------------------------------------------------------------------------
# Stage 2: Lean Production Runtime
# ------------------------------------------------------------------------------
FROM python:3.11-slim AS runner

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    ENVIRONMENT=production

# Install minimal runtime shared libraries (libgomp for PyTorch openmp) and curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Security: Create non-root unprivileged service account
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -s /bin/sh -m appuser

# Install pre-built wheels without internet index lookup
COPY --from=builder /build/wheels /wheels
COPY requirements.txt .
RUN pip install --no-cache-dir --no-index --find-links=/wheels -r requirements.txt && \
    rm -rf /wheels

# Copy application source tree with correct ownership
COPY --chown=appuser:appgroup . .

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD curl -f http://localhost:${PORT}/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
