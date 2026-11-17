<?php

namespace App\Services\Directorio;

class SimuladoDirectorioUsuarios implements DirectorioUsuarios
{
    /** @return list<PersonaDirectorio> */
    private function personas(): array
    {
        $nombres = [
            ['Alina Brisamar', 'alina.brisamar', 'Analista', 'El Salvador'],
            ['Dario Nublar', 'dario.nublar', 'Coordinador', 'Guatemala'],
            ['Elia Monteluz', 'elia.monteluz', 'Consultora', 'Perú'],
            ['Nilo Verdazul', 'nilo.verdazul', 'Analista', 'Ecuador'],
            ['Liora Valdelago', 'liora.valdelago', 'Gerente', 'El Salvador'],
            ['Teo Solbrisa', 'teo.solbrisa', 'Consultor', 'Costa Rica'],
            ['Mara Cedravel', 'mara.cedravel', 'Analista', 'Panamá'],
            ['Ivo Claraloma', 'ivo.claraloma', 'Consultor', 'Colombia'],
        ];

        return array_map(fn (array $datos, int $indice): PersonaDirectorio => new PersonaDirectorio(
            'simulado-'.($indice + 1), $datos[0], $datos[1].'@pcslatam.com', $datos[2], $datos[3],
        ), $nombres, array_keys($nombres));
    }

    public function buscar(string $texto): array
    {
        return array_values(array_filter($this->personas(), fn (PersonaDirectorio $p): bool => str_contains(mb_strtolower($p->nombre.' '.$p->correo), mb_strtolower($texto))
        ));
    }

    public function obtener(string $idExterno): ?PersonaDirectorio
    {
        foreach ($this->personas() as $persona) {
            if ($persona->idExterno === $idExterno) {
                return $persona;
            }
        }

        return null;
    }
}
