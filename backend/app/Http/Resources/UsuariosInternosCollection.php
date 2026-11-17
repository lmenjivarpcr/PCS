<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class UsuariosInternosCollection extends ResourceCollection
{
    public $collects = UsuarioInternoResource::class;

    public function paginationInformation(Request $request, array $paginated, array $default): array
    {
        return ['meta' => [
            'pagina' => $paginated['current_page'], 'por_pagina' => $paginated['per_page'],
            'total' => $paginated['total'], 'ultima_pagina' => $paginated['last_page'],
        ]];
    }
}
