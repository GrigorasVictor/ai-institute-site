# Mirrored from Docker Hub into GHCR by .github/workflows/mirror-images.yml.
# Keep this version in sync with SNIPE_IT_VERSION in that workflow. Local builds
# without a GHCR login can override it:
#   docker build --build-arg SNIPE_IT_IMAGE=snipe/snipe-it:v8.8.3 .
ARG SNIPE_IT_IMAGE=ghcr.io/airi-utcn/ai-institute-site/mirror/snipe-it:v8.8.3
FROM ${SNIPE_IT_IMAGE}

# The stock provider treats an explicit "/" as unset and falls back to the
# path in APP_URL, which duplicates the public subdirectory during URL().
COPY LivewireServiceProvider.php /var/www/html/app/Providers/LivewireServiceProvider.php

RUN sed -i "/^    'component_locations'/i\\    'url_prefix' => env('LIVEWIRE_URL_PREFIX', null),\n" \
    /var/www/html/config/livewire.php
