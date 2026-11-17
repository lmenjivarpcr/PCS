import { NavLink } from "react-router-dom";
import { navigation } from "@/config/navigation";
export function Navigation({
  permisos,
  onNavigate,
}: {
  permisos: string[];
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Menú principal" className="space-y-2">
      {navigation
        .filter(
          (item) =>
            item.permission === null || permisos.includes(item.permission),
        )
        .map((item) => (
          <div key={item.path}>
            {item.section && (
              <p className="mb-2 mt-8 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {item.section}
              </p>
            )}
            <NavLink
              end
              to={item.path}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-3 text-sm ${isActive ? "bg-accent font-medium" : "hover:bg-muted"}`
              }
            >
              <item.icon className="size-4" aria-hidden="true" />
              {item.label}
            </NavLink>
          </div>
        ))}
    </nav>
  );
}
