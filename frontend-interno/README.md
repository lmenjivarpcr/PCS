# Portal interno

Maquetación funcional de acceso con Microsoft, sin conexión real a Microsoft ni al backend.

## Ejecutar

```sh
npm ci
npm run dev
npm run build
npm run lint
npm test
```

Vite utiliza el puerto **5173**, sin cambiar automáticamente si está ocupado.

## Rutas y simulación

- `/ingresar`: botón de Microsoft con icono neutro, carga y errores.
- `/`: inicio provisional protegido con nombre y cierre de sesión.
- `/ingresar?simular=no-registrado`: cuenta no registrada o inactiva.
- `/ingresar?simular=conexion`: error de conexión.

Los parámetros solo se interpretan en `src/services/auth/simulated.ts`. Cada operación tarda 800 ms. El contexto conserva la sesión únicamente en memoria: recargar requiere ingresar de nuevo. Los datos de prueba y las indicaciones de MSAL están en el simulador.

## Integración posterior

`src/services/auth/types.ts` define `AuthService`. Sustituir la instancia en `src/services/auth/index.ts` por un adaptador que use MSAL y valide la identidad con la API de Laravel. La sesión real y su restauración se incorporarán al proveedor cuando se defina el contrato. Los componentes no conocen Microsoft, parámetros de simulación ni transporte HTTP.

## Presentación y comprobación

Tema provisional neutro centralizado en `src/index.css`, fuente del sistema y marcador PCS comentado en `AuthLayout`. Configuración de shadcn/ui en `components.json`; componentes locales adaptados de la fuente de shadcn/ui (new-york). Alias `@/` configurado en TypeScript y Vite. No se utiliza el logo oficial de Microsoft.

Tres pruebas con Vitest y Testing Library verifican la ruta protegida, ingreso y cierre de sesión, cuenta no registrada y error de conexión con posibilidad de reintentar.

Los permisos, contenidos operativos e identidad institucional del portal siguen pendientes de definición. Esta implementación cubre únicamente el acceso solicitado el 17 de noviembre de 2026.
