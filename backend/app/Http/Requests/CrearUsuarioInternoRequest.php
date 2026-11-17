<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CrearUsuarioInternoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_externo' => ['required', 'string', 'max:255'],
            'perfil_id' => ['required', 'integer', Rule::exists('perfiles', 'id')->where('activo', true)],
        ];
    }

    public function messages(): array
    {
        return [
            'id_externo.required' => 'Seleccione una persona del directorio.',
            'id_externo.string' => 'El identificador externo debe ser texto.',
            'id_externo.max' => 'El identificador externo no debe superar 255 caracteres.',
            'perfil_id.required' => 'Seleccione un perfil activo.',
            'perfil_id.integer' => 'El perfil debe ser un identificador válido.',
            'perfil_id.exists' => 'Seleccione un perfil activo.',
        ];
    }
}
