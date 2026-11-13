# Handball Studio — backend preparado

Proyecto dedicado: `nuyuossupchjfnmbpgbe` (eu-west-1).
Organización: `vercel_icfg_Kv4ucvki4XMOF9SV8fqvfn66`, plan Free verificado.
No se modificaron otros proyectos.

- Migración `studio_accounts_and_private_drive` aplicada.
- Función `studio-drive`, versión 2, desplegada y activa.
- `tecnicobalonmanovila@gmail.com`: approved / reader.
- Propietario administrador: `servilagar13@gmail.com`, la cuenta propietaria de Drive.
- Las tablas rechazan acceso directo de anon/authenticated. El advisor informa
  RLS sin políticas: es deliberado, porque solo la función con service_role
  accede a ellas después de verificar sesión y autorización en cada petición.
- Configuración pública del frontend asociada al proyecto, `enabled:true`.

Google Auth activado y comprobado mediante /auth/v1/settings.
La entrada usa Google Identity Services con nonce y signInWithIdToken;
no necesita redirecciones a la URL de la web para iniciar sesión.

Pendiente para cargar la biblioteca:
1. Configurar Google en Supabase Auth con su client ID y secreto OAuth.
2. Configurar Site URL / redirect URL de GitHub Pages y añadir en Google Cloud
   la URL callback que muestre Supabase.
3. Añadir `GOOGLE_CLIENT_SECRET` a los secretos de Edge Functions del proyecto.
   Los otros ajustes no secretos tienen valores por defecto en la función.
4. Conectar Drive desde la cuenta propietaria, una vez guardado el secreto.
5. Restringir acceso general de la carpeta y revisar los permisos directos
   existentes. La app no revoca permisos externos concedidos por Drive.
6. Verificar login, sesiones, aprobación y carga/guardado con cuentas reales.

No publicar secretos OAuth ni refresh tokens en el repositorio o el chat.
