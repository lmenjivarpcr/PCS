<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BuscarDirectorioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['buscar' => ['required', 'string', 'min:3', 'max:190']];
    }

    public function messages(): array
    {
        return [
            'buscar.required' => 'Escriba al menos 3 caracteres para buscar.',
            'buscar.string' => 'La búsqueda debe ser texto.',
            'buscar.min' => 'Escriba al menos 3 caracteres para buscar.',
            'buscar.max' => 'La búsqueda no debe superar 190 caracteres.',
        ];
    }
}
