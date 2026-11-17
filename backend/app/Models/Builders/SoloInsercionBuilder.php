<?php

namespace App\Models\Builders;

use App\Models\RegistroBitacora;
use Illuminate\Database\Eloquent\Builder;
use LogicException;

/** @extends Builder<RegistroBitacora> */
class SoloInsercionBuilder extends Builder
{
    public function update(array $values): never
    {
        throw new LogicException('La bitácora solo permite inserciones.');
    }

    public function delete(): never
    {
        throw new LogicException('La bitácora solo permite inserciones.');
    }

    public function forceDelete(): never
    {
        throw new LogicException('La bitácora solo permite inserciones.');
    }

    public function upsert(array $values, $uniqueBy, $update = null): never
    {
        throw new LogicException('La bitácora solo permite inserciones.');
    }

    public function increment($column, $amount = 1, array $extra = []): never
    {
        throw new LogicException('La bitácora solo permite inserciones.');
    }

    public function decrement($column, $amount = 1, array $extra = []): never
    {
        throw new LogicException('La bitácora solo permite inserciones.');
    }

    public function incrementEach(array $columns, array $extra = []): never
    {
        throw new LogicException('La bitácora solo permite inserciones.');
    }

    public function decrementEach(array $columns, array $extra = []): never
    {
        throw new LogicException('La bitácora solo permite inserciones.');
    }
}
