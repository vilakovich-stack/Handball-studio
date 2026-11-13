(function(){
'use strict';
const config=window.STUDIO_ACCOUNT_CONFIG;
if(!config?.enabled)return;
let client,session=null,account=null,ready=false,loading=false,generation=0,timer,started=false;
const gate=$('#entryGate'),button=$('#entryLogin'),status=$('#entryStatus');
const note=$('.entry-note');note.textContent='Accede con tu cuenta. Sergio aprueba cada correo y decide sus permisos.';
const exit=document.createElement('button');exit.textContent='Usar otra cuenta / salir';exit.hidden=true;button.after(exit);
const retry=document.createElement('button');retry.textContent='Comprobar aprobación';retry.hidden=true;exit.after(retry);
const badge=document.createElement('button');badge.id='studioAccountBadge';badge.onclick=()=>show('access');$('.header-right').append(badge);
const logout=document.createElement('button');logout.textContent='Salir';logout.onclick=signOut;$('.header-right').append(logout);exit.onclick=signOut;
function lock(message){document.documentElement.classList.add('handball-login-locked');gate.setAttribute('aria-hidden','false');status.textContent=message;}
function identity(){badge.textContent=account?account.name+' · '+({owner:'Administrador',writer:'Editor',reader:'Lector'})[account.role]:'Sin sesión';const profile=$('.profile span');if(profile){profile.textContent=account?.name||'Tu cuenta';const small=document.createElement('small');small.textContent=account?.email||'Acceso privado';profile.append(small)}const avatar=$('.header-right .avatar');if(avatar)avatar.textContent=account?(account.name||account.email).slice(0,2).toUpperCase():'HS';}
async function api(action,options={}){
 const {data,error}=await client.auth.getSession();if(error||!data.session)throw Error('Inicia sesión de nuevo.');
 const response=await fetch(config.url+'/functions/v1/studio-drive?action='+action,{...options,headers:{apikey:config.publishableKey,Authorization:'Bearer '+data.session.access_token,...options.headers}});
 if(!response.ok){const info=await response.json().catch(()=>({}));const e=Error(info.error||'No se pudo completar la operación.');e.status=response.status;throw e}return response;
}
async function json(action,body){return (await api(action,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})).json()}
cloudFetch=async function(path,options={},mode='json'){
 const response=await api('proxy&path='+encodeURIComponent(path),options);return mode==='blob'?response.blob():response.json();
};
// Drive credentials stay on the server. This sentinel only preserves the legacy
// sync guard; it is never sent to Google and cannot grant access by itself.
const sentinel='server-managed-drive';
clearTimeout(expiryTimer);forgetDriveSession();
resumeDriveSession=async()=>{};
setDriveAccess=async()=>{driveAccess={role:account?.role||'reader',canShare:false,email:account?.email||''};applyAccessUI()};
$('#connectDrive').onclick=()=>{if(account?.role==='owner')show('access');else toast('El administrador conecta el almacenamiento compartido.')};
$('#disconnectDrive').onclick=signOut;
$('#importDriveFiles').hidden=true;$('#googleSettings').hidden=true;$('#rememberDrive').closest('div').hidden=true;
renderAccess=async function(){
 const panel=$('#accessPanel');$('#accessRole').textContent=account?({owner:'Administrador',writer:'Editor',reader:'Solo lectura'})[account.role]:'Sin sesión';
 if(!account){panel.textContent='Inicia sesión para ver tu cuenta.';return}
 if(account.role!=='owner'){panel.innerHTML='<h2>Tu cuenta</h2><p>'+esc(account.email)+'</p><p>'+esc(account.role==='reader'?'Puedes ver los ejercicios y reproducir animaciones.':'Puedes crear y modificar ejercicios y sesiones.')+'</p>';return}
 panel.innerHTML='<h2>Usuarios y permisos</h2><p>Aprueba correos o bloquea su acceso. Los cambios se comprueban en el servidor.</p><form id="studioInvite" class="invite-form"><label>Correo<input name="email" type="email" required placeholder="entrenador@gmail.com"></label><label>Permiso<select name="role"><option value="reader">Lector</option><option value="writer">Editor</option></select></label><button class="primary">Autorizar correo</button></form><div id="studioUserStatus" role="status"></div><div id="studioUsers">Cargando usuarios…</div><div class="studio-drive-setup"><h2>Biblioteca en Drive</h2><p>La cuenta propietaria conecta la carpeta. Los entrenadores no necesitan configurar Drive.</p><button id="studioConnectOwner">Conectar / renovar mi Drive</button><p id="studioDriveStatus"></p></div>';
 const report=message=>{if($('#studioUserStatus'))$('#studioUserStatus').textContent=message};
 $('#studioInvite').onsubmit=async e=>{e.preventDefault();const form=e.currentTarget,b=form.querySelector('button');b.disabled=true;try{await json('users',{email:form.elements.email.value.trim().toLowerCase(),role:form.elements.role.value,status:'approved'});await renderAccess();toast('Correo autorizado.')}catch(error){report(error.message);b.disabled=false}};
 $('#studioConnectOwner').onclick=async()=>{try{
 await loadGoogle();google.accounts.oauth2.initCodeClient({client_id:window.HANDBALL_GOOGLE_CONFIG.clientId,scope:DRIVE_SCOPE,ux_mode:'popup',callback:async response=>{if(response.error||!response.code){toast('Google no autorizó Drive.');return}try{await json('connect',{code:response.code});toast('Drive conectado.');await activateLibrary();await renderAccess()}catch(error){toast(error.message)}},error_callback:()=>toast('Conexión cancelada.')}).requestCode();
 }catch(error){toast(error.message)}};
 try{
 const [result,drive]=await Promise.all([json('users'),json('drive-status')]);if(!$('#studioUsers'))return;
 $('#studioDriveStatus').textContent=drive.connected?'Drive conectado.':'Pendiente: conecta tu Drive para cargar la biblioteca.';
 $('#studioUsers').innerHTML=result.users.length?result.users.map((u,i)=>'<div class="permission-row"><div><b>'+esc(u.email)+'</b><small>'+esc(({pending:'Pendiente de aprobación',approved:'Autorizado',blocked:'Bloqueado'})[u.status])+'</small></div><select data-user-role="'+i+'" aria-label="Permiso de '+esc(u.email)+'"><option value="reader" '+(u.role==='reader'?'selected':'')+'>Lector</option><option value="writer" '+(u.role==='writer'?'selected':'')+'>Editor</option></select><button data-user-approve="'+i+'">'+(u.status==='approved'?'Guardar permiso':'Aprobar')+'</button><button data-user-block="'+i+'">Bloquear</button></div>').join(''):'<p>No hay solicitudes. Añade el primer correo arriba.</p>';
 for(const [selector,target] of [['[data-user-approve]','approved'],['[data-user-block]','blocked']])$$(selector).forEach(b=>b.onclick=async()=>{const index=Number(target==='approved'?b.dataset.userApprove:b.dataset.userBlock),u=result.users[index];const role=panel.querySelector('[data-user-role="'+index+'"]').value;b.disabled=true;try{await json('users',{email:u.email,role,status:target});await renderAccess()}catch(error){report(error.message);b.disabled=false}});
 }catch(error){report(error.message)}
};
async function activateLibrary(){
 if(!account||account.status!=='approved')return;
 const version=generation,drive=await json('drive-status');if(version!==generation)return;
 if(!drive.connected){authorized=false;driveToken=null;syncStatus('Almacenamiento pendiente','El administrador debe conectar Drive.');if(account.role==='owner'){show('access');await renderAccess()}return}
 driveToken=sentinel;authorized=true;folderLabel='Biblioteca de Sergio Vila';appFolders={};
 // Initial load must replace the previous browser user's cache, never merge it
 // into the shared catalogue. The original sync helper already supports readers.
 driveAccess={role:'reader',canShare:false,email:account.email};
 await synchronize(true);if(version!==generation){authorized=false;driveToken=null;return}
 driveAccess={role:account.role,canShare:false,email:account.email};applyAccessUI();setCloudControls();
}
async function refreshAccount(){
 if(loading||!ready||!session)return;loading=true;const version=generation;
 try{
 const next=await json('me');if(version!==generation)return;
 const previous=account;account=next;identity();button.hidden=true;exit.hidden=false;retry.hidden=false;
 if(next.status!=='approved'){authorized=false;driveToken=null;clearTimeout(syncTimer);lock(next.status==='blocked'?'Tu acceso está bloqueado. Contacta con Sergio.':'Tu cuenta está pendiente de aprobación por Sergio.');return}
 document.documentElement.classList.remove('handball-login-locked');gate.setAttribute('aria-hidden','true');retry.hidden=true;
 driveAccess={role:next.role,canShare:false,email:next.email};applyAccessUI();
 if(!previous||previous.email!==next.email||previous.status!=='approved'){
 // Never show a different user's cached library or draft after login.
 state={exercises:[],sessions:[],folders:[],draft:null};draft=blank();frame=0;driveBase=null;renderLibrary();loadFields();show('library');await activateLibrary();
 }
 }catch(error){if(version!==generation)return;authorized=false;driveToken=null;lock(error.message);exit.hidden=false;retry.hidden=false}finally{loading=false}
}
retry.onclick=refreshAccount;
async function signOut(){
 generation++;clearTimeout(syncTimer);clearInterval(timer);authorized=false;driveToken=null;account=null;session=null;
 stop();state={exercises:[],sessions:[],folders:[],draft:null};draft=blank();frame=0;renderLibrary();loadFields();identity();lock('Entra con una cuenta autorizada por Sergio.');button.hidden=false;exit.hidden=true;retry.hidden=true;
 // Clear browser workspace on explicit logout; exported backups and Drive remain.
 suppressSync=true;try{await persist()}finally{suppressSync=false}
 await client.auth.signOut();
}
button.onclick=async()=>{button.disabled=true;try{
 const {error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname,queryParams:{prompt:'select_account'}}});if(error)throw error;
 }catch(error){status.textContent=error.message;button.disabled=false}};
async function start(){
 if(started)return;started=true;
 try{
 if(!config.url||!config.publishableKey)throw Error('El administrador debe completar la configuración de las cuentas.');
 await loadScript('vendor/supabase-2.49.8.js');
 client=window.supabase.createClient(config.url,config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'}});
 client.auth.onAuthStateChange((_event,next)=>{session=next;if(next){setTimeout(()=>{clearInterval(timer);timer=setInterval(refreshAccount,30000);refreshAccount()},0)}else{authorized=false;driveToken=null;account=null;identity();lock('Entra con una cuenta autorizada por Sergio.');button.hidden=false;button.disabled=false}});
 ready=true;button.disabled=false;const {data,error}=await client.auth.getSession();if(error)throw error;session=data.session;if(session)await refreshAccount();else lock('Entra con una cuenta autorizada por Sergio.');
 }catch(error){lock(error.message);button.disabled=true}
}
const originalReady=studioReady;studioReady=function(){originalReady();start()};
if(db&&draft)start();
})();
