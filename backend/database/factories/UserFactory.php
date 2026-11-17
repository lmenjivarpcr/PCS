<?php

namespace Database\Factories;

use App\Models\Perfil;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<User> */
class UserFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'perfil_id' => Perfil::factory(),
            'nombre' => fake()->name(),
            'correo' => fake()->unique()->safeEmail(),
            'tipo' => 'interno',
            'activo' => true,
        ];
    }
}
