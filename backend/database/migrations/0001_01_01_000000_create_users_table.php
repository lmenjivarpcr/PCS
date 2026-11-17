<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('perfiles', function (Blueprint $table) {
            $table->id();
            $table->string('codigo', 80)->unique();
            $table->string('nombre', 150);
            $table->boolean('activo')->default(true);
            $table->unsignedInteger('version')->default(1);
            $table->dateTime('creado_en');
            $table->dateTime('actualizado_en');
        });

        Schema::create('usuarios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('perfil_id')->constrained('perfiles')->restrictOnDelete();
            $table->string('nombre', 150);
            $table->string('correo', 190)->unique();
            $table->enum('tipo', ['interno', 'cliente']);
            $table->boolean('activo')->default(true);
            $table->unsignedInteger('version')->default(1);
            $table->dateTime('creado_en');
            $table->dateTime('actualizado_en');
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            // Tabla del framework: Laravel escribe user_id al guardar la sesion.
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('usuarios');
        Schema::dropIfExists('perfiles');
    }
};
