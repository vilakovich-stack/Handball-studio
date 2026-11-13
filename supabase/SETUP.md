# Activación de cuentas de Handball Studio

Estado: implementación preparada; **no activada en producción**. La web sigue
usando su acceso anterior hasta completar este proceso. No ejecutar el SQL en
Handball Club Pro / ORGHAND.

## Proyecto dedicado

1. Elegir con Sergio la organización de Supabase y crear un proyecto dedicado
   `Handball Studio` en plan gratuito. No activar servicios de pago.
2. Ejecutar `schema.sql` una vez en el nuevo proyecto. Las dos tablas tienen
   RLS, sin acceso directo para anon/authenticated. Solo la función autenticada
   consulta y modifica los datos. Comprobar advisors antes de activar.
3. En Supabase Auth, activar Google con el ID OAuth y su secreto. Guardar el
   secreto únicamente en el proveedor Auth y los secretos de Edge Functions.
   Nunca en GitHub ni en el navegador.
4. En Google Cloud, añadir el callback que muestre Supabase a las URI de
   redireccionamiento. Conservar el origen JavaScript
   `https://vilakovich-stack.github.io` para la conexión del Drive propietario.
5. Configurar Site URL y redirect allowlist de Supabase con
   `https://vilakovich-stack.github.io/Handball-studio/`.
   Permitir alta mediante Google: crear cuenta NO concede acceso a la biblioteca;
   cada nuevo correo queda pendiente y solo el propietario puede aprobarlo.

## Función `studio-drive`

Desplegar `supabase/functions/studio-drive/index.ts` y `policy.ts` con la config
incluida. `verify_jwt=false` es intencionado: la propia función ejecuta
`auth.getUser` para verificar el token y comprueba la aprobación en cada petición.
No usar el header Authorization sin esa verificación.

Secretos/variables del servidor:

- `STUDIO_OWNER_EMAIL=servilagar13@gmail.com` (cuenta propietaria verificada de Drive).
- `STUDIO_DRIVE_FOLDER_ID=1t5jTPqWFHFaUw3Mz6cYk_s9b75oKwi1E`
- `STUDIO_ALLOWED_ORIGINS=https://vilakovich-stack.github.io`
- `GOOGLE_CLIENT_ID`: ID OAuth existente.
- `GOOGLE_CLIENT_SECRET`: introducir por el dashboard seguro, no por chat.
- SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY: variables automáticas de la función.

La función no devuelve credenciales de Google. El refresh token se conserva en
`studio_drive_connection`, inaccesible para roles del navegador. Los endpoints de
lectura/subida comprueban la ascendencia hasta la carpeta fija. No se permite
borrar archivos ni gestionar permisos Google a través del proxy.

## Activar y comprobar

1. Exportar una copia de seguridad desde la app actual y sincronizar el Drive.
   Las cuentas nuevas cargan el catálogo remoto, sin mezclar el caché anterior.
2. En `docs/studio-account-config.js`, poner la URL y clave **publicable** del
   proyecto y cambiar `enabled` a `true` solo después de desplegar el servidor.
3. Entrar con la cuenta propietaria, ir a Acceso de entrenadores y pulsar
   Conectar / renovar mi Drive. Autorizar la misma cuenta propietaria.
4. Aprobar `tecnicobalonmanovila@gmail.com` como lector desde el panel.
5. Cambiar Acceso general de la carpeta a **Restringido**. Revisar y retirar
   permisos directos de otros entrenadores si se quiere que la app sea el único
   acceso. Bloquear en la app no revoca permisos Google concedidos por separado.
6. Probar propietario, lector, editor, pendiente y bloqueado con cuentas reales.
   Comprobar carga, guardado, recarga de sesión y renovación de Drive.

Google Auth requiere configurar el proveedor. Mientras OAuth de Drive esté en
Prueba, el refresh token del propietario puede caducar a los siete días y habrá
que renovarlo desde su panel. Para operación estable revisar publicación y los
requisitos de verificación de los scopes solicitados. No prometer conexión
permanente ni omitir las políticas de Google. Login de entrenadores y conexión
Drive son dos autorizaciones diferentes: los entrenadores solo necesitan perfil
Google, no permiso directo al Drive del propietario.

## Validación realizada sin servicios desplegados

`node --test tests/accounts.test.mjs` ejecuta la función con Auth/Drive simulados:
JWT inválido, origen ajeno, pendiente, aprobación, bloqueo, lectura, escritura y
rechazo de rutas fuera de la biblioteca. No sustituye la prueba con OAuth real.
