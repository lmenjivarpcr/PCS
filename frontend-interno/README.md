# Portal interno

Última actualización: 17 de noviembre de 2026. Alcance solicitado por el usuario: estructura autenticada y administración simulada de usuarios internos.

React 19, TypeScript, Vite, Tailwind 4 y componentes locales basados en shadcn/ui. Tema provisional neutro centralizado en `src/index.css`, fuente del sistema y marcador PCS. No hay identidad institucional validada. Los errores usan la variante `destructive`.

## Ejecutar

```sh
npm ci
npm run dev
npm run build
npm run lint
npx vitest run
```

Vite utiliza el puerto **5173**, sin cambiar automáticamente si está ocupado.

## Acceso y navegación

- `/ingresar`: inicio simulado con Microsoft; 800 ms de latencia.
- `/`: inicio protegido con menú, datos de sesión y cierre de sesión.
- `/usuarios-internos`: exige `usuarios.internos.leer`, también al entrar directamente.
- `/ingresar?simular=consulta`: solo lectura; oculta registro y edición.
- `/ingresar?simular=no-registrado`: cuenta no registrada o inactiva.
- `/ingresar?simular=conexion`: error de conexión con reintento.

El usuario por defecto tiene perfil Administrador y permisos `usuarios.internos.leer`, `usuarios.internos.crear` y `usuarios.internos.editar`. La configuración del menú está en `src/config/navigation.ts`; cada entrada declara su permiso (`null` para acceso autenticado general). El menú móvil es un diálogo modal con foco contenido, Escape y retorno de foco. El perfil y el correo se consultan en el desplegable del nombre.

La sesión permanece únicamente en memoria: recargar requiere ingresar de nuevo. Los datos simulados también viven en memoria y se reinician al recargar la aplicación. Las comprobaciones de permisos son de interfaz; la integración real deberá aplicar autorización en la API.

## Usuarios internos

Filtros de nombre/correo (300 ms), perfil y estado; activos por defecto. Los parámetros `buscar`, `perfil_id`, `activo` (`1`, `0` o `todos`) y `pagina` conservan el estado en la URL. Omitir `activo` equivale al filtro inicial Activos; `todos` se traduce a omitir el filtro en el servicio. Cambiar filtros reinicia la página. La tabla muestra 20 registros por página y se transforma en tarjetas bajo 768 px.

Registrar busca en el directorio (mínimo tres caracteres, espera de 400 ms), deshabilita personas registradas y permite recorrer resultados con flechas, Inicio, Fin, Tab y Enter. Seleccionar una persona lleva al selector de perfil. El éxito cierra el diálogo, avisa mediante Sonner y recarga el listado.

Editar envía la versión original. Activar o desactivar requiere confirmación y guarda también el perfil seleccionado. Un 409 bloquea nuevas escrituras hasta recargar el registro vigente; un 422 conserva el diálogo con su explicación. Los errores del listado, perfiles y directorio permiten reintentar. Las respuestas de consultas descartadas no reemplazan resultados vigentes.

## Contrato e integración

Los tipos y la interfaz `UsuariosService` están en `src/services/usuarios/types.ts`. Cambiar la instancia exportada en `src/services/usuarios/index.ts` para incorporar el adaptador real. La implementación en memoria usa 25 usuarios ficticios y 28 personas de directorio con correo `@pcslatam.com`, perfiles Administrador, Gerente y Analista, y 450 ms de latencia por operación.

| Método | API prevista | Resultado |
| --- | --- | --- |
| `perfiles()` | `GET /api/v1/perfiles` | `{data: Perfil[]}` |
| `listar(filtros)` | `GET /api/v1/usuarios-internos?buscar=&perfil_id=&activo=&pagina=` | `{data: UsuarioInterno[], meta: {pagina, por_pagina, total, ultima_pagina}}` |
| `directorio(buscar)` | `GET /api/v1/directorio/usuarios?buscar=` | `{data: PersonaDirectorio[]}` |
| `registrar({id_externo, perfil_id})` | `POST /api/v1/usuarios-internos` | Usuario, 201; error 422 `{message}` |
| `editar(id, {perfil_id?, activo?, version})` | `PATCH /api/v1/usuarios-internos/{id}` | Usuario, 200; error 409 o 422 `{message}` |

El adaptador deberá serializar booleanos de filtros como `1`/`0`, omitir valores indefinidos y convertir errores HTTP a `UsuariosError(status, message)`. El simulador entrega las mismas estructuras; no realiza peticiones HTTP. Los identificadores simulados son numéricos y las fechas ISO UTC se muestran en hora local.

El contrato no incluye consulta por ID. «Recargar datos» consulta por correo sin filtrar estado y selecciona el ID correspondiente. El simulador rechaza versiones antiguas con 409, duplicados o perfiles inválidos con 422 y cambios que quiten al último administrador activo. Ana Torres es inicialmente la única administradora activa: cambiar su perfil o desactivarla permite verificar el 422. Las pruebas crean dos versiones del mismo registro para verificar el 409 y su recuperación.

La integración futura de autenticación con MSAL y Laravel se realiza en `src/services/auth/index.ts`. La interfaz existente se amplió con perfil y permisos; los escenarios de error anteriores se conservan.

## Verificación y pendientes

Vitest y Testing Library cubren acceso y cierre de sesión previos, menú y ruta por permisos, menú móvil con Escape, URL e historial de filtros, estado vacío, errores y reintento, directorio con registrados deshabilitados, selección por teclado, registro, edición con 409/422 y protección del último administrador.

Pendientes: Microsoft y Graph reales, API y autorización del servidor, restauración de sesión e identidad visual oficial. Los perfiles y datos de la simulación no constituyen una matriz aprobada para producción. Este trabajo se limitó al frontend interno, sin acceder a `backend/`.
