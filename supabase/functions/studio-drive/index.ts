import {createClient} from 'npm:@supabase/supabase-js@2.49.8';
import {normalizeEmail,canWrite,parseDrivePath,listParent} from './policy.ts';
const defaults:Record<string,string>={STUDIO_OWNER_EMAIL:'servilagar13@gmail.com',STUDIO_DRIVE_FOLDER_ID:'1t5jTPqWFHFaUw3Mz6cYk_s9b75oKwi1E',STUDIO_ALLOWED_ORIGINS:'https://vilakovich-stack.github.io',GOOGLE_CLIENT_ID:'863222978088-05m9ud1at33jikfq54ucilu7kun03eb6.apps.googleusercontent.com'};
const env=(name:string)=>{const value=Deno.env.get(name)||defaults[name];if(!value)throw new Error('Configuración pendiente: '+name);return value;};
const folder=()=>env('STUDIO_DRIVE_FOLDER_ID');
const owner=()=>normalizeEmail(env('STUDIO_OWNER_EMAIL'));
const admin=()=>createClient(env('SUPABASE_URL'),env('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false,autoRefreshToken:false}});
function check(result:any){if(result.error)throw new Error('No se pudo guardar o consultar la configuración.');return result.data;}
async function googleToken(params:Record<string,string>){
 const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({...params,client_id:env('GOOGLE_CLIENT_ID'),client_secret:env('GOOGLE_CLIENT_SECRET')})});
 const data=await response.json();if(!response.ok)throw new Error('Debes volver a conectar el Drive del administrador.');return data;
}
Deno.serve(async req=>{
 let cors:Record<string,string>={'Vary':'Origin','Cache-Control':'no-store'};
 const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json'}});
 try{
 const origin=req.headers.get('Origin')||'';
 const allowed=env('STUDIO_ALLOWED_ORIGINS').split(',').map(x=>x.trim());
 if(!allowed.includes(origin))return json({error:'Origen no autorizado.'},403);
 cors={...cors,'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(!['GET','POST'].includes(req.method))return json({error:'Método no permitido.'},405);
 const db=admin();const jwt=req.headers.get('Authorization')?.replace(/^Bearer /,'');
 if(!jwt)return json({error:'Inicia sesión.'},401);
 const {data:{user},error}=await db.auth.getUser(jwt);
 if(error||!user?.email||!user.email_confirmed_at)return json({error:'Cuenta no verificada.'},401);
 const email=normalizeEmail(user.email),isOwner=email===owner();
 const action=new URL(req.url).searchParams.get('action')||'me';
 let member=check(await db.from('studio_members').select('email,role,status,display_name').eq('email',email).maybeSingle());
 if(!member&&!isOwner){member=check(await db.from('studio_members').insert({email,user_id:user.id,display_name:String(user.user_metadata?.full_name||'').slice(0,120)}).select('email,role,status,display_name').single());}
 const role=isOwner?'owner':member?.role||'reader',status=isOwner?'approved':member?.status||'pending';
 if(action==='me')return json({email,name:String(user.user_metadata?.full_name||email),role,status});
 if(status!=='approved')return json({error:status==='blocked'?'Acceso bloqueado por el administrador.':'Acceso pendiente de aprobación.'},403);
 if(action==='users'){
 if(!isOwner)return json({error:'Solo el administrador puede gestionar usuarios.'},403);
 if(req.method==='GET')return json({users:check(await db.from('studio_members').select('email,role,status,display_name,updated_at').order('email'))});
 const input=await req.json(),target=normalizeEmail(input.email);
 if(target===owner())return json({error:'El acceso del propietario no se modifica.'},400);
 if(!['reader','writer'].includes(input.role)||!['approved','blocked'].includes(input.status))return json({error:'Permiso no válido.'},400);
 check(await db.from('studio_members').upsert({email:target,role:input.role,status:input.status,updated_at:new Date().toISOString()},{onConflict:'email'}));return json({ok:true});
 }
 const connection=check(await db.from('studio_drive_connection').select('refresh_token,owner_email').eq('id',true).maybeSingle());
 if(action==='drive-status')return json({connected:!!connection});
 if(action==='connect'){
 if(!isOwner||req.method!=='POST')return json({error:'Solo el propietario puede conectar Drive.'},403);
 const {code}=await req.json();if(typeof code!=='string'||code.length>4096)return json({error:'Código no válido.'},400);
 const tokens=await googleToken({grant_type:'authorization_code',code,redirect_uri:origin});
 const identityResponse=await fetch('https://www.googleapis.com/drive/v3/about?fields=user(emailAddress)',{headers:{Authorization:'Bearer '+tokens.access_token}});
 if(!identityResponse.ok)throw new Error('No se pudo comprobar la cuenta de Drive.');
 const identity=await identityResponse.json();if(normalizeEmail(identity.user?.emailAddress)!==owner())return json({error:'Conecta el Drive de la cuenta propietaria.'},403);
 const refresh=tokens.refresh_token||connection?.refresh_token;if(!refresh)throw new Error('Google no concedió conexión persistente. Vuelve a autorizar Drive.');
 const permission=await fetch('https://www.googleapis.com/drive/v3/files/'+folder()+'?fields=ownedByMe,mimeType',{headers:{Authorization:'Bearer '+tokens.access_token}});
 const meta=await permission.json();if(!permission.ok||!meta.ownedByMe||meta.mimeType!=='application/vnd.google-apps.folder')return json({error:'La cuenta debe ser propietaria de la carpeta.'},403);
 check(await db.from('studio_drive_connection').upsert({id:true,refresh_token:refresh,owner_email:owner(),updated_at:new Date().toISOString()}));return json({ok:true});
 }
 if(action!=='proxy')return json({error:'Acción no permitida.'},404);
 if(!connection) return json({error:'El administrador debe conectar Drive.'},409);
 const tokens=await googleToken({grant_type:'refresh_token',refresh_token:connection.refresh_token});
 const headers={Authorization:'Bearer '+tokens.access_token};
 async function inside(id:string,depth=0):Promise<void>{
 if(id===folder())return;if(depth>8)throw new Error('Archivo fuera de la biblioteca.');
 const r=await fetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(id)+'?fields=parents,trashed&supportsAllDrives=true',{headers});
 if(!r.ok)throw new Error('Archivo no disponible.');const meta=await r.json();
 if(meta.trashed||!meta.parents?.length)throw new Error('Archivo fuera de la biblioteca.');
 // Drive files have one parent. Check every ancestor before granting a read.
 await inside(meta.parents[0],depth+1);
 }
 const parsed=parseDrivePath(new URL(req.url).searchParams.get('path')||'');
 if(req.method==='GET'){
 if(parsed.kind==='about')return json({user:{emailAddress:email}});
 if(parsed.kind==='files')await inside(listParent(parsed.url.searchParams.get('q')||''));
 else if(parsed.kind==='file')await inside(parsed.id);else throw new Error('Lectura no permitida.');
 }else{
 if(!canWrite(role))return json({error:'Acceso de solo lectura.'},403);
 if(!['files','upload'].includes(parsed.kind))throw new Error('Escritura no permitida.');
 }
 let body:BodyInit|undefined;
 if(req.method==='POST'){
 if(parsed.kind==='upload'){
 if(Number(req.headers.get('Content-Length')||0)>28*1024*1024)return json({error:'Archivo demasiado grande.'},413);
 const form=await req.formData(),part=form.get('metadata'),blob=form.get('file');
 if(!(part instanceof Blob)||!(blob instanceof Blob)||blob.size>25*1024*1024)throw new Error('Subida no válida.');
 const meta=JSON.parse(await part.text());if(!Array.isArray(meta.parents)||meta.parents.length!==1)throw new Error('Destino no válido.');await inside(meta.parents[0]);
 body=form;
 }else{
 const meta=await req.json();if(meta.mimeType!=='application/vnd.google-apps.folder'||!Array.isArray(meta.parents)||meta.parents.length!==1)throw new Error('Solo se permite crear carpetas de la biblioteca.');await inside(meta.parents[0]);
 body=JSON.stringify(meta);Object.assign(headers,{'Content-Type':'application/json'});
 }
 }
 // Exact fixed-origin Google endpoint. No caller Authorization or redirect forwarding.
 const upstream=await fetch(parsed.url,{method:req.method,headers,body,redirect:'error'});
 if(!upstream.ok)return json({error:'Drive no pudo completar la operación ('+upstream.status+').'},upstream.status===401?409:upstream.status);
 let data:BodyInit|null=upstream.body;
 if(parsed.kind==='file'&&parsed.id===folder()&&!parsed.url.searchParams.has('alt')){
 const meta=await upstream.json();data=JSON.stringify({...meta,ownedByMe:isOwner,capabilities:{canListChildren:true,canAddChildren:canWrite(role),canShare:false}});
 }
 return new Response(data,{status:upstream.status,headers:{...cors,'Content-Type':upstream.headers.get('Content-Type')||'application/json'}});
 }catch(error){return json({error:error instanceof Error?error.message:'No se pudo completar la operación.'},400);}
});
