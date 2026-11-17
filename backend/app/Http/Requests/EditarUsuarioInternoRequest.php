<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EditarUsuarioInternoRequest extends FormRequest
{
    public function authorize(): bool
    {
        abort_if($this->route('usuario')->tipo !== 'interno', 404, 'Usuario no encontrado.');

        return true;
    }

    public function rules(): array
    {
        return [
            'perfil_id' => ['sometimes', 'required', 'integer', Rule::exists('perfiles', 'id')->where('activo', true)],
            'activo' => ['sometimes', 'required', 'boolean'],
            'version' => ['required', 'integer', 'min:1'],
        ];
    }

    public function messages(): array
    {
        return [
            'perfil_id.required' => 'Seleccione un perfil activo.',
            'perfil_id.integer' => 'El perfil debe ser un identificador válido.',
            'perfil_id.exists' => 'Seleccione un perfil activo.',
            'activo.required' => 'Indique si el usuario está activo.',
            'activo.boolean' => 'El estado activo debe ser verdadero o falso.',
            'version.required' => 'Indique la versión del usuario.',
            'version.integer' => 'La versión debe ser un número entero.',
            'version.min' => 'La versión debe ser mayor o igual a 1.',
        ];
    }
}
