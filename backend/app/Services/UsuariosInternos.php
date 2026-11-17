<?php

namespace App\Services;

use App\Models\Perfil;
use App\Models\User;
use App\Services\Directorio\DirectorioUsuarios;
use App\Services\Directorio\DominiosInternos;
use App\Services\Directorio\PersonaDirectorio;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UsuariosInternos
{
    public function __construct(
        private DirectorioUsuarios $directorio,
        private DominiosInternos $dominios,
        private Bitacora $bitacora,
    ) {}

    public function emisor(): string
    {
        return config('pcs.microsoft.tenant_id') ?: 'simulado';
    }

    public function registrado(PersonaDirectorio $persona): bool
    {
        return User::query()->whereRaw('LOWER(correo) = ?', [mb_strtolower($persona->correo)])->exists()
            || DB::table('identidades_usuario')->where('proveedor', 'microsoft')
                ->where('emisor', $this->emisor())->where('sujeto', $persona->idExterno)->exists();
    }

    /** @return list<array{persona: PersonaDirectorio, registrado: bool}> */
    public function buscarDirectorio(string $texto): array
    {
        $personas = $this->directorio->buscar($texto);
        $correos = array_map(fn (PersonaDirectorio $p): string => mb_strtolower($p->correo), $personas);
        $sujetos = array_map(fn (PersonaDirectorio $p): string => $p->idExterno, $personas);
        $registrados = User::query()->whereIn(DB::raw('LOWER(correo)'), $correos)->pluck('correo')
            ->map(fn (string $correo): string => mb_strtolower($correo))->all();
        $identidades = DB::table('identidades_usuario')->where('proveedor', 'microsoft')
            ->where('emisor', $this->emisor())->whereIn('sujeto', $sujetos)->pluck('sujeto')->all();

        return array_map(fn (PersonaDirectorio $p): array => [
            'persona' => $p,
            'registrado' => in_array(mb_strtolower($p->correo), $registrados, true) || in_array($p->idExterno, $identidades, true),
        ], $personas);
    }

    public function crear(string $idExterno, int $perfilId, User $actor): User
    {
        $persona = $this->directorio->obtener($idExterno);
        if (! $persona || ! $this->dominios->permite($persona->correo)) {
            throw ValidationException::withMessages(['id_externo' => 'La cuenta no está disponible o su dominio no está permitido.']);
        }
        try {
            return DB::transaction(function () use ($persona, $perfilId, $actor): User {
                $this->perfilActivo($perfilId);
                if ($this->registrado($persona)) {
                    throw ValidationException::withMessages(['id_externo' => 'La persona ya está registrada.']);
                }
                $usuario = User::query()->create([
                    'nombre' => $persona->nombre, 'correo' => mb_strtolower($persona->correo),
                    'perfil_id' => $perfilId, 'tipo' => 'interno', 'activo' => true, 'contrasena' => null,
                ]);
                DB::table('identidades_usuario')->insert([
                    'usuario_id' => $usuario->id, 'proveedor' => 'microsoft',
                    'emisor' => $this->emisor(), 'sujeto' => $persona->idExterno,
                    'creado_en' => now(), 'actualizado_en' => now(),
                ]);
                $this->bitacora->registrar('usuario.creado', $usuario, $usuario->id, null, $usuario->fresh()->toArray(), $actor);

                return $usuario->refresh()->load('perfil');
            });
        } catch (UniqueConstraintViolationException) {
            throw ValidationException::withMessages(['id_externo' => 'La persona ya está registrada.']);
        }
    }

    public function editar(User $usuario, array $datos, User $actor): User
    {
        return DB::transaction(function () use ($usuario, $datos, $actor): User {
            // Todos los cambios de usuarios bloquean primero la misma fila para conservar al último administrador.
            Perfil::query()->where('codigo', 'administrador')->lockForUpdate()->first();
            $usuario = User::query()->where('tipo', 'interno')->lockForUpdate()->findOrFail($usuario->id);
            abort_if($usuario->version !== (int) $datos['version'], 409, 'El usuario fue modificado. Actualice la información e intente nuevamente.');

            $perfilId = (int) ($datos['perfil_id'] ?? $usuario->perfil_id);
            $activo = array_key_exists('activo', $datos) ? (bool) $datos['activo'] : $usuario->activo;
            if (array_key_exists('perfil_id', $datos)) {
                $this->perfilActivo($perfilId);
            }
            $eraAdministrador = $usuario->activo && $usuario->perfil()->where('codigo', 'administrador')->exists();
            $seguiraAdministrador = $activo && Perfil::query()->whereKey($perfilId)->where('codigo', 'administrador')->exists();
            if ($eraAdministrador && ! $seguiraAdministrador) {
                $otros = User::query()->where('tipo', 'interno')->where('activo', true)
                    ->whereKeyNot($usuario->id)->whereHas('perfil', fn ($q) => $q->where('codigo', 'administrador'))
                    ->lockForUpdate()->get();
                if ($otros->isEmpty()) {
                    throw ValidationException::withMessages(['usuario' => 'Debe conservar al menos un administrador interno activo.']);
                }
            }
            $anterior = ['perfil_id' => $usuario->perfil_id, 'activo' => $usuario->activo, 'version' => $usuario->version];
            $usuario->perfil_id = $perfilId;
            $usuario->activo = $activo;
            $usuario->version++;
            $usuario->save();
            $nuevo = ['perfil_id' => $usuario->perfil_id, 'activo' => $usuario->activo, 'version' => $usuario->version];
            if ($anterior['perfil_id'] !== $perfilId) {
                $this->bitacora->registrar('usuario.perfil_cambiado', $usuario, $usuario->id, $anterior, $nuevo, $actor);
            }
            if ($anterior['activo'] !== $activo) {
                $this->bitacora->registrar($activo ? 'usuario.activado' : 'usuario.desactivado', $usuario, $usuario->id, $anterior, $nuevo, $actor);
            }

            return $usuario->load('perfil');
        }, 3);
    }

    private function perfilActivo(int $id): void
    {
        if (! Perfil::query()->whereKey($id)->where('activo', true)->lockForUpdate()->first()) {
            throw ValidationException::withMessages(['perfil_id' => 'Seleccione un perfil activo.']);
        }
    }
}
