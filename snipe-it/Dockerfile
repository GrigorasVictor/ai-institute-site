FROM snipe/snipe-it:latest

# The stock provider treats an explicit "/" as unset and falls back to the
# path in APP_URL, which duplicates the public subdirectory during URL().
COPY LivewireServiceProvider.php /var/www/html/app/Providers/LivewireServiceProvider.php

RUN sed -i "/^    'component_locations'/i\\    'url_prefix' => env('LIVEWIRE_URL_PREFIX', null),\n" \
    /var/www/html/config/livewire.php
