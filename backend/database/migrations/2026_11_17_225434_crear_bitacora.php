<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bitacora', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actor_id')->nullable()->constrained('usuarios')->nullOnDelete();
            $table->string('accion', 80);
            $table->string('entidad', 50);
            $table->string('entidad_id', 100);
            $table->json('anterior')->nullable();
            $table->json('nuevo')->nullable();
            $table->string('ip', 45)->nullable();
            $table->string('agente', 255)->nullable();
            $table->dateTime('ocurrido_en')->useCurrent();
            $table->index(['entidad', 'entidad_id']);
            $table->index(['actor_id', 'ocurrido_en']);
            $table->index(['accion', 'ocurrido_en']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bitacora');
    }
};
