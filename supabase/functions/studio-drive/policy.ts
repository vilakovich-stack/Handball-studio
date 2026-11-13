export function normalizeEmail(value: unknown): string {
 const email=String(value||'').trim().toLowerCase();
 if(email.length>254||!/^\S+@\S+\.\S+$/.test(email))throw new Error('Correo no válido.');
 return email;
}
export function canWrite(role: string): boolean {return role==='owner'||role==='writer';}
export function parseDrivePath(path: string) {
 if(path.includes('..')||path.includes('#')||path.includes('\\')||path.startsWith('/'))throw new Error('Ruta no permitida.');
 const url=new URL(path,'https://www.googleapis.com/');
 if(url.origin!=='https://www.googleapis.com')throw new Error('Ruta no permitida.');
 const file=url.pathname.match(/^\/drive\/v3\/files\/([A-Za-z0-9_-]+)$/);
 if(file)return {kind:'file',id:file[1],url};
 if(url.pathname==='/drive/v3/files')return {kind:'files',id:'',url};
 if(url.pathname==='/upload/drive/v3/files')return {kind:'upload',id:'',url};
 if(url.pathname==='/drive/v3/about')return {kind:'about',id:'',url};
 throw new Error('Operación de Drive no permitida.');
}
export function listParent(query: string): string {
 // Client list queries are only a parent plus our fixed catalogue filters.
 const match=query.match(/^'([A-Za-z0-9_-]+)' in parents and trashed = false(?: and (.*))?$/);
 if(!match)throw new Error('Consulta no permitida.');
 if(match[2]&&!/^(?:mimeType = 'application\/vnd\.google-apps\.folder' and )?appProperties has \{ key='(?:studioFolder|studioKind)' and value='[A-Za-z]+' \}$/.test(match[2]))throw new Error('Filtro no permitido.');
 return match[1];
}
export function googleTokenError(code: unknown, grantType: string): string {
 if(code==='invalid_client')return 'Google rechaza las credenciales del servidor (invalid_client). Revisa GOOGLE_CLIENT_SECRET en Supabase: debe ser el secreto OAuth de Handball Studio Web, no la clave de API, y corresponder al mismo Client ID.';
 if(code==='invalid_grant')return grantType==='refresh_token'?'La autorización de Drive ha caducado o se ha revocado (invalid_grant). El administrador debe volver a conectar Drive.':'Google rechazó el código de conexión (invalid_grant). Cierra las ventanas anteriores y vuelve a pulsar Conectar para generar un código nuevo.';
 if(code==='redirect_uri_mismatch')return 'La dirección de autorización de Google no coincide (redirect_uri_mismatch). Revisa el origen https://vilakovich-stack.github.io en el cliente OAuth.';
 if(code==='invalid_scope')return 'Google ha rechazado el permiso de Drive (invalid_scope).';
 return 'Google no pudo autorizar la conexión de Drive. Vuelve a intentarlo; si se repite, revisa el cliente OAuth del servidor.';
}
