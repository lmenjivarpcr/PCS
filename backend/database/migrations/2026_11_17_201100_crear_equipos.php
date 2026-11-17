<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('funciones_equipo', function (Blueprint $table) {
            $table->id();
            $table->string('codigo', 80)->unique();
            $table->string('nombre', 150);
            $table->boolean('activo')->default(true);
            $table->dateTime('creado_en');
            $table->dateTime('actualizado_en');
        });

        Schema::create('funcion_permiso', function (Blueprint $table) {
            $table->foreignId('funcion_id')->constrained('funciones_equipo')->cascadeOnDelete();
            $table->foreignId('permiso_id')->constrained('permisos')->cascadeOnDelete();
            $table->primary(['funcion_id', 'permiso_id']);
        });

        Schema::create('equipos_predefinidos', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 150);
            $table->boolean('activo')->default(true);
            $table->dateTime('creado_en');
            $table->dateTime('actualizado_en');
        });

        Schema::create('integrantes_equipo_predefinido', function (Blueprint $table) {
            $table->foreignId('equipo_id')->constrained('equipos_predefinidos')->cascadeOnDelete();
            $table->foreignId('usuario_id')->constrained('usuarios')->cascadeOnDelete();
            $table->foreignId('funcion_id')->constrained('funciones_equipo')->restrictOnDelete();
            $table->primary(['equipo_id', 'usuario_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('integrantes_equipo_predefinido');
        Schema::dropIfExists('equipos_predefinidos');
        Schema::dropIfExists('funcion_permiso');
        Schema::dropIfExists('funciones_equipo');
    }
};
