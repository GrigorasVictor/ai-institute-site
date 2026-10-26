<?php

namespace App\Providers;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Livewire\Livewire;

class LivewireServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        $configuredPrefix = config('livewire.url_prefix');
        $prefix = $configuredPrefix === null
            ? trim((string) parse_url(config('app.url'), PHP_URL_PATH), '/')
            : trim((string) $configuredPrefix, '/');

        $prefix = $prefix === '' ? '' : '/'.$prefix;

        Livewire::setUpdateRoute(function ($handle) use ($prefix) {
            return Route::post($prefix.'/livewire/update', $handle);
        });

        Livewire::setScriptRoute(function ($handle) use ($prefix) {
            return Route::get($prefix.'/livewire/livewire.js', $handle);
        });
    }
}
