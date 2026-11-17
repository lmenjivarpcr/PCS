<?php

namespace Database\Factories;

use App\Models\Perfil;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Perfil> */
class PerfilFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'codigo' => fake()->unique()->uuid(),
            'nombre' => fake()->words(3, true),
            'activo' => true,
        ];
    }
}
