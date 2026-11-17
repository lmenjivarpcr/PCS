<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('perfil_permiso', function (Blueprint $table) {
            $table->foreignId('perfil_id')->constrained('perfiles')->cascadeOnDelete();
            $table->foreignId('permiso_id')->constrained('permisos')->cascadeOnDelete();
            $table->boolean('activo')->default(true);
            $table->foreignId('actualizado_por')->nullable()->constrained('usuarios')->nullOnDelete();
            $table->dateTime('actualizado_en')->nullable();
            $table->primary(['perfil_id', 'permiso_id']);
        });

        Schema::create('usuario_permiso', function (Blueprint $table) {
            $table->foreignId('usuario_id')->constrained('usuarios')->cascadeOnDelete();
            $table->foreignId('permiso_id')->constrained('permisos')->cascadeOnDelete();
            $table->enum('efecto', ['conceder', 'revocar']);
            $table->foreignId('creado_por')->nullable()->constrained('usuarios')->nullOnDelete();
            $table->foreignId('actualizado_por')->nullable()->constrained('usuarios')->nullOnDelete();
            $table->dateTime('creado_en');
            $table->dateTime('actualizado_en');
            $table->primary(['usuario_id', 'permiso_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('usuario_permiso');
        Schema::dropIfExists('perfil_permiso');
    }
};
