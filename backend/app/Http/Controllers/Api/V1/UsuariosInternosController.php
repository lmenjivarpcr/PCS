<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\BuscarDirectorioRequest;
use App\Http\Requests\CrearUsuarioInternoRequest;
use App\Http\Requests\EditarUsuarioInternoRequest;
use App\Http\Requests\ListarUsuariosInternosRequest;
use App\Http\Resources\PerfilResource;
use App\Http\Resources\PersonaDirectorioResource;
use App\Http\Resources\UsuarioInternoResource;
use App\Http\Resources\UsuariosInternosCollection;
use App\Models\Perfil;
use App\Models\User;
use App\Services\UsuariosInternos;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class UsuariosInternosController extends Controller
{
    public function perfiles(): AnonymousResourceCollection
    {
        return PerfilResource::collection(Perfil::query()->where('activo', true)->orderBy('nombre')->get());
    }

    public function index(ListarUsuariosInternosRequest $request): UsuariosInternosCollection
    {
        $datos = $request->validated();
        $usuarios = User::query()->with('perfil')->where('tipo', 'interno')
            ->when($datos['buscar'] ?? null, function (Builder $query, string $buscar): void {
                $query->where(function (Builder $q) use ($buscar): void {
                    $q->where('nombre', 'like', '%'.$buscar.'%')->orWhere('correo', 'like', '%'.$buscar.'%');
                });
            })
            ->when($datos['perfil_id'] ?? null, fn (Builder $q, int $id) => $q->where('perfil_id', $id))
            ->when(isset($datos['activo']), fn (Builder $q) => $q->where('activo', $datos['activo']))
            ->orderBy('nombre')->orderBy('id')->paginate(20, ['*'], 'pagina', $datos['pagina'] ?? 1);

        return new UsuariosInternosCollection($usuarios);
    }

    public function directorio(BuscarDirectorioRequest $request, UsuariosInternos $usuarios): AnonymousResourceCollection
    {
        return PersonaDirectorioResource::collection($usuarios->buscarDirectorio($request->validated('buscar')));
    }

    public function store(CrearUsuarioInternoRequest $request, UsuariosInternos $usuarios): JsonResponse
    {
        $usuario = $usuarios->crear($request->validated('id_externo'), (int) $request->validated('perfil_id'), $request->user());

        return (new UsuarioInternoResource($usuario))->response()->setStatusCode(201);
    }

    public function update(EditarUsuarioInternoRequest $request, User $usuario, UsuariosInternos $usuarios): UsuarioInternoResource
    {
        return new UsuarioInternoResource($usuarios->editar($usuario, $request->validated(), $request->user()));
    }
}
