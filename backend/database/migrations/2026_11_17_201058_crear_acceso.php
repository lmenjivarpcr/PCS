<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('identidades_usuario', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_id')->constrained('usuarios')->cascadeOnDelete();
            $table->string('proveedor', 50);
            $table->string('emisor', 255);
            $table->string('sujeto', 255);
            $table->unique(['proveedor', 'emisor', 'sujeto']);
            $table->dateTime('creado_en');
            $table->dateTime('actualizado_en');
        });

        Schema::create('modulos', function (Blueprint $table) {
            $table->id();
            $table->string('codigo', 80)->unique();
            $table->string('nombre', 150);
            $table->unsignedSmallInteger('orden')->default(0);
            $table->boolean('activo')->default(true);
        });

        Schema::create('grupos_permiso', function (Blueprint $table) {
            $table->id();
            $table->foreignId('modulo_id')->constrained('modulos')->restrictOnDelete();
            $table->string('codigo', 80);
            $table->string('nombre', 150);
            $table->unsignedSmallInteger('orden')->default(0);
            $table->boolean('activo')->default(true);
            $table->unique(['modulo_id', 'codigo']);
        });

        Schema::create('permisos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('grupo_id')->constrained('grupos_permiso')->restrictOnDelete();
            $table->string('codigo', 190)->unique();
            $table->string('nombre', 255);
            $table->enum('audiencia', ['interno', 'cliente', 'ambos']);
            $table->enum('contexto', ['general', 'orden']);
            $table->boolean('activo')->default(true);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permisos');
        Schema::dropIfExists('grupos_permiso');
        Schema::dropIfExists('modulos');
        Schema::dropIfExists('identidades_usuario');
    }
};
