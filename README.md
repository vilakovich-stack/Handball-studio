# Handball Studio · Vila — GitHub Pages

Pizarra por pasos, animación y biblioteca personal. Sin integración con ORGHAND.

## Publicación gratuita

1. Crea el repositorio `Handball-Studio` en tu cuenta de GitHub. GitHub Free requiere un repositorio público para Pages: el código será público, los ejercicios privados de Drive no se suben al repositorio.
2. Sube el contenido de `github-export` a la raíz del repositorio. La app está dentro de `docs`.
3. Settings → Pages → Deploy from a branch → main → /docs → Save.
4. Usa la URL que GitHub muestre cuando termine la publicación.

## Autorizar el nuevo dominio en Google Cloud

Con tu usuario `vilakovich-stack`, el origen es `https://vilakovich-stack.github.io` (sin nombre del repositorio ni barra final).

1. Google Auth Platform → Clientes → Handball Studio Web → Orígenes JavaScript autorizados: añade ese origen, conservando el anterior durante la migración.
2. APIs y servicios → Credenciales → Handball Studio Picker → Sitios web: añade `https://vilakovich-stack.github.io/*`, conserva `https://docs.google.com/*` y el dominio anterior. Mantén la clave restringida a Drive API y Picker API.
3. No añadas contraseñas, secretos OAuth, tokens de usuarios ni archivos de ejercicios a GitHub.

## Usuarios de acceso

En esta versión los usuarios entran con Google: no se crean contraseñas nuevas.

1. Sergio entra con la cuenta propietaria de la carpeta.
2. Abre «Acceso de entrenadores». Añade el correo del entrenador y elige lector o editor.
3. Mientras OAuth esté en Prueba, añade ese correo también en Google Cloud → Público → Usuarios de prueba.
4. Envía al entrenador el enlace de la app. Debe entrar con esa misma cuenta.

Un lector consulta y reproduce. Un editor puede modificar toda la biblioteca compartida. Solo el propietario gestiona los permisos desde la app. Drive verifica el acceso en sus servidores. El inicio de sesión de la interfaz no convierte el código de GitHub Pages en privado y no sustituye los permisos de Drive. No compartas la carpeta como «cualquiera con el enlace» si quieres usuarios concretos.

La autorización de Google caduca; al caducar se vuelve a la pantalla de acceso. Se recupera al recargar la pestaña mientras siga vigente. Google puede exigir verificación para salir del modo Prueba.

## Migración de ejercicios

Antes de cambiar de dominio, sincroniza la biblioteca en la app anterior o descarga una copia completa. El guardado local pertenece al navegador y al dominio: no viaja automáticamente a GitHub Pages. Tras entrar desde el nuevo enlace, la app recupera el catálogo de Drive. El borrador de pizarra se debe guardar como ejercicio antes de sincronizarlo.

No hay servicios de pago nuevos. Se aplican los límites de GitHub Pages y de tu cuenta de Google Drive.
