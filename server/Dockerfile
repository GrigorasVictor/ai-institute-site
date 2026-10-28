# Defaults to AWS ECR Public for local builds. CI overrides NODE_IMAGE to point
# at the GHCR mirror, so it never pulls from Docker Hub or ECR Public.
ARG NODE_IMAGE=public.ecr.aws/docker/library/node:22-alpine
FROM ${NODE_IMAGE}

RUN apk update && apk upgrade --no-cache

WORKDIR /app

# Install dependencies before copying the source so edits don't invalidate
# this layer.
COPY package*.json ./
RUN npm ci

COPY . .

# Build-time config for Strapi admin bundle. Compose runtime env does NOT apply during `docker build`.
ARG PUBLIC_STRAPI_URL
ARG STRAPI_ADMIN_URL
ENV PUBLIC_STRAPI_URL=$PUBLIC_STRAPI_URL
ENV STRAPI_ADMIN_URL=$STRAPI_ADMIN_URL

RUN npm run build

EXPOSE 1337
# Run in production mode (serve the built admin). Use `develop` only for local development.
CMD ["npm", "start"]
