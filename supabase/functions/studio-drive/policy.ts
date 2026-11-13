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
