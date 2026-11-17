# Portal del cliente

Maquetación funcional de acceso, sin conexión al backend ni envío real de correos.

## Ejecutar

```sh
npm ci
npm run dev
npm run build
npm run lint
npm test
```

Vite utiliza el puerto **5174**, sin cambiar automáticamente si está ocupado.

## Rutas y comportamiento

- `/ingresar`: correo y contraseña, visibilidad de contraseña y errores de acceso.
- `/ingresar/codigo`: PIN de seis dígitos, pegado y envío al completar, vencimiento, intentos y reenvío. Requiere identificación previa.
- `/recuperar-contrasena`: respuesta neutra para cualquier correo válido.
- `/restablecer-contrasena?token=...&correo=...`: nueva contraseña y confirmación; éxito y enlace inválido.
- `/`: inicio provisional protegido, nombre del usuario y cierre de sesión.

Los datos de prueba están documentados en `src/services/auth/simulated.ts`. El simulador tarda 650 ms por operación, devuelve `expira_en` en segundos (cinco minutos) y `reenviar_en` (60 segundos). Cinco contraseñas incorrectas bloquean ese correo por un minuto. Cada desafío admite cinco intentos de PIN; el reenvío reinicia el vencimiento y los intentos. El token de restablecimiento admite un uso por instancia y actualiza la contraseña de prueba durante esa instancia.

La sesión y el desafío se mantienen únicamente en memoria mediante React Context: recargar requiere ingresar de nuevo. No se almacenan contraseñas, códigos ni tokens en el navegador.

## Integración posterior

`src/services/auth/types.ts` define `AuthService`, respuestas y errores tipados. Para integrar Laravel, implementar ese contrato y sustituir la instancia en `src/services/auth/index.ts`. Los componentes y las rutas consumen el contrato a través del contexto, sin importar el simulador. El adaptador deberá convertir los errores de la API a `AuthError`, mantener la referencia del desafío, mapear sus tiempos y gestionar la sesión real. La restauración de sesión tras recargar se incorporará en el proveedor cuando se defina ese contrato de API.

## Presentación y comprobación

Tema provisional neutro centralizado en `src/index.css`, fuente del sistema y marcador PCS comentado en `AuthLayout`. Configuración de shadcn/ui en `components.json`; componentes locales adaptados de la fuente de shadcn/ui (new-york), con Radix para botón/label e input-otp. Alias `@/` configurado en TypeScript y Vite.

Pruebas con Vitest y Testing Library: validación, guardas de rutas, ingreso completo con PIN pegado, cierre de sesión, recuperación neutra, restablecimiento y límites, expiración y reenvío. Las pruebas del servicio avanzan el reloj, conservando el retardo artificial.

Los permisos, contenidos operativos e identidad institucional del portal siguen pendientes de definición. Esta implementación cubre únicamente el acceso solicitado el 17 de noviembre de 2026.
