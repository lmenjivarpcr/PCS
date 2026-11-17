import type { Perfil } from "@/services/usuarios/types";
import { Select } from "../ui/select";
export function PerfilSelect({
  perfiles,
  value,
  onChange,
  autoFocus = false,
}: {
  perfiles: Perfil[];
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <label className="block space-y-2 text-sm font-medium">
      Perfil
      <Select
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      >
        <option value="" disabled>
          Selecciona un perfil
        </option>
        {perfiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre}
          </option>
        ))}
      </Select>
    </label>
  );
}
