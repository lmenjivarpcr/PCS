<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ListarUsuariosInternosRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'buscar' => ['nullable', 'string', 'max:190'],
            'perfil_id' => ['nullable', 'integer', 'min:1'],
            'activo' => ['nullable', 'in:0,1'],
            'pagina' => ['nullable', 'integer', 'min:1'],
        ];
    }

    public function messages(): array
    {
        return [
            'buscar.string' => 'La búsqueda debe ser texto.',
            'buscar.max' => 'La búsqueda no debe superar 190 caracteres.',
            'perfil_id.integer' => 'El perfil debe ser un identificador válido.',
            'perfil_id.min' => 'El perfil debe ser mayor o igual a 1.',
            'activo.in' => 'El filtro activo debe ser 0 o 1.',
            'pagina.integer' => 'La página debe ser un número entero.',
            'pagina.min' => 'La página debe ser mayor o igual a 1.',
        ];
    }
}
