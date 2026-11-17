<?php

namespace App\Services\Directorio;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class GraphDirectorioUsuarios implements DirectorioUsuarios
{
    private const SELECT = 'id,displayName,mail,jobTitle,country,accountEnabled';

    public function __construct(private DominiosInternos $dominios) {}

    private function cliente(): PendingRequest
    {
        $tenant = (string) config('pcs.microsoft.tenant_id');
        $client = (string) config('pcs.microsoft.client_id');
        $secret = (string) config('pcs.microsoft.client_secret');
        if ($tenant === '' || $client === '' || $secret === '') {
            throw new RuntimeException('El directorio de Microsoft no está configurado.');
        }
        $clave = 'pcs.graph.token.'.hash('sha256', $tenant.'|'.$client.'|'.$secret);
        $token = Cache::get($clave);
        if (! is_string($token)) {
            $respuesta = Http::asForm()->connectTimeout(5)->timeout(15)
                ->post('https://login.microsoftonline.com/'.rawurlencode($tenant).'/oauth2/v2.0/token', [
                    'grant_type' => 'client_credentials',
                    'client_id' => $client,
                    'client_secret' => $secret,
                    'scope' => 'https://graph.microsoft.com/.default',
                ])->throw()->json();
            $token = $respuesta['access_token'] ?? null;
            $duracion = (int) ($respuesta['expires_in'] ?? 0);
            if (! is_string($token) || $token === '' || $duracion <= 0) {
                throw new RuntimeException('Microsoft devolvió un token inválido.');
            }
            Cache::put($clave, $token, max(1, $duracion - 30));
        }

        return Http::withToken($token)->acceptJson()->connectTimeout(5)->timeout(15);
    }

    public function buscar(string $texto): array
    {
        $texto = str_replace(['\\', '"'], ['\\\\', '\\"'], $texto);
        $datos = $this->cliente()->withHeaders(['ConsistencyLevel' => 'eventual'])
            ->get('https://graph.microsoft.com/v1.0/users', [
                '$search' => '"displayName:'.$texto.'" OR "mail:'.$texto.'"',
                '$select' => self::SELECT,
                '$top' => 20,
            ])->throw()->json('value', []);

        return array_values(array_filter(array_map($this->persona(...), $datos)));
    }

    public function obtener(string $idExterno): ?PersonaDirectorio
    {
        $respuesta = $this->cliente()->get('https://graph.microsoft.com/v1.0/users/'.rawurlencode($idExterno), [
            '$select' => self::SELECT,
        ]);
        if ($respuesta->notFound()) {
            return null;
        }

        return $this->persona($respuesta->throw()->json());
    }

    private function persona(array $datos): ?PersonaDirectorio
    {
        if (($datos['accountEnabled'] ?? false) !== true || ! $this->dominios->permite($datos['mail'] ?? '')
            || empty($datos['id']) || empty($datos['displayName'])) {
            return null;
        }

        return new PersonaDirectorio($datos['id'], $datos['displayName'], mb_strtolower($datos['mail']), $datos['jobTitle'] ?? null, $datos['country'] ?? null);
    }
}
