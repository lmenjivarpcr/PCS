<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('paises', function (Blueprint $table) {
            $table->id();
            $table->string('codigo', 3)->unique();
            $table->string('nombre', 150);
            $table->boolean('activo')->default(true);
            $table->dateTime('creado_en');
            $table->dateTime('actualizado_en');
        });

        Schema::create('sectores', function (Blueprint $table) {
            $table->id();
            $table->string('codigo', 30)->unique();
            $table->string('nombre', 150);
            $table->boolean('activo')->default(true);
            $table->dateTime('creado_en');
            $table->dateTime('actualizado_en');
        });

        Schema::create('lineas_servicio', function (Blueprint $table) {
            $table->id();
            $table->string('codigo', 30)->unique();
            $table->string('nombre', 150);
            $table->boolean('activo')->default(true);
            $table->dateTime('creado_en');
            $table->dateTime('actualizado_en');
        });

        Schema::create('servicios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('linea_servicio_id')->constrained('lineas_servicio')->restrictOnDelete();
            $table->string('codigo', 30)->unique();
            $table->string('nombre', 150);
            $table->boolean('activo')->default(true);
            $table->unique(['linea_servicio_id', 'nombre']);
            $table->dateTime('creado_en');
            $table->dateTime('actualizado_en');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('servicios');
        Schema::dropIfExists('lineas_servicio');
        Schema::dropIfExists('sectores');
        Schema::dropIfExists('paises');
    }
};
