<?php

use App\Http\Controllers\Api\V1\UsuariosInternosController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware('auth:sanctum')->group(function (): void {
    Route::get('perfiles', [UsuariosInternosController::class, 'perfiles'])->middleware('permiso:usuarios.internos.leer')->name('perfiles.index');
    Route::get('usuarios-internos', [UsuariosInternosController::class, 'index'])->middleware('permiso:usuarios.internos.leer')->name('usuarios-internos.index');
    Route::get('directorio/usuarios', [UsuariosInternosController::class, 'directorio'])->middleware('permiso:usuarios.internos.crear')->name('directorio.usuarios');
    Route::post('usuarios-internos', [UsuariosInternosController::class, 'store'])->middleware('permiso:usuarios.internos.crear')->name('usuarios-internos.store');
    Route::patch('usuarios-internos/{usuario}', [UsuariosInternosController::class, 'update'])->middleware('permiso:usuarios.internos.editar')->name('usuarios-internos.update');
});
