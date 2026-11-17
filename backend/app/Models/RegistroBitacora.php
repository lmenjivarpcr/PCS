<?php

namespace App\Models;

use App\Models\Builders\SoloInsercionBuilder;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\UseEloquentBuilder;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use LogicException;

#[Fillable(['actor_id', 'accion', 'entidad', 'entidad_id', 'anterior', 'nuevo', 'ip', 'agente'])]
#[UseEloquentBuilder(SoloInsercionBuilder::class)]
class RegistroBitacora extends Model
{
    protected $table = 'bitacora';

    public $timestamps = false;

    protected function casts(): array
    {
        return ['anterior' => 'array', 'nuevo' => 'array', 'ocurrido_en' => 'datetime'];
    }

    protected function performUpdate(Builder $query): bool
    {
        throw new LogicException('La bitácora solo permite inserciones.');
    }

    public function delete(): ?bool
    {
        throw new LogicException('La bitácora solo permite inserciones.');
    }
}
