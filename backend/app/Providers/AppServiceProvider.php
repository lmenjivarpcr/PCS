<?php

namespace App\Providers;

use App\Services\Directorio\DirectorioUsuarios;
use App\Services\Directorio\GraphDirectorioUsuarios;
use App\Services\Directorio\SimuladoDirectorioUsuarios;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(DirectorioUsuarios::class, function ($app) {
            return match (config('pcs.directorio.driver')) {
                'simulado' => $app->make(SimuladoDirectorioUsuarios::class),
                'graph' => $app->make(GraphDirectorioUsuarios::class),
                default => throw new \InvalidArgumentException('Driver de directorio no válido.'),
            };
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
