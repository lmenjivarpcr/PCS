<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(SuperadministradorSeeder::class);

        if (app()->environment('local') && ! User::query()->where('correo', 'test@example.com')->exists()) {
            User::factory()->create([
                'nombre' => 'Usuario de prueba',
                'correo' => 'test@example.com',
                'tipo' => 'interno',
                'activo' => true,
            ]);
        }
    }
}
