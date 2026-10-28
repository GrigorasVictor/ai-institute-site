# Defaults to AWS ECR Public for local builds. CI overrides PYTHON_IMAGE to
# point at the GHCR mirror, so it never pulls from Docker Hub or ECR Public.
ARG PYTHON_IMAGE=public.ecr.aws/docker/library/python:3.12-slim
FROM ${PYTHON_IMAGE}

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
  cron \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install CPU-only torch first, then other requirements
# This prevents pip from pulling the huge CUDA version
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt

COPY . .

COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Can be overridden with: docker run ... python main.py for one-off runs
ENTRYPOINT ["/app/entrypoint.sh"]