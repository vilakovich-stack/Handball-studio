(function(root){
'use strict';
async function mount({button,status,help,setupRequired,loadGoogleScript,getGoogle,clientId,scope,onCode}){
 let codeClient;
 const report=message=>{status.textContent=message;status.setAttribute('role','status')};
 const reset=()=>{button.disabled=false;button.textContent='Conectar / renovar mi Drive'};
 button.disabled=true;button.textContent='Preparando conexión…';
 if(setupRequired){
  button.disabled=false;button.textContent='Completar conexión de Drive';
  report('Falta un paso de configuración del administrador. Pulsa el botón para ver las instrucciones.');
  button.onclick=()=>{help.hidden=false;report('En Supabase → Edge Functions → Secrets, guarda GOOGLE_CLIENT_SECRET con el mismo secreto de Google que usaste en Authentication. Después vuelve aquí y pulsa Actualizar conexión.');help.scrollIntoView?.({block:'nearest',behavior:'smooth'})};return;
 }
 try{
  if(!getGoogle()?.accounts?.oauth2)await loadGoogleScript();
  if(!button.isConnected)return;
  codeClient=getGoogle().accounts.oauth2.initCodeClient({client_id:clientId,scope,ux_mode:'popup',callback:async response=>{
   if(response.error||!response.code){reset();report('Google no autorizó la conexión. Puedes intentarlo de nuevo.');return}
   report('Autorización recibida. Conectando tu biblioteca…');
   try{await onCode(response.code)}catch(error){reset();report(error.message||'No se pudo conectar Drive.')}
  },error_callback:error=>{reset();report(error?.type==='popup_failed_to_open'?'El navegador ha bloqueado la ventana de Google. Permite las ventanas emergentes para esta app y vuelve a pulsar Conectar.':'La ventana de Google se cerró sin completar la conexión. Puedes volver a intentarlo.')}});
  reset();
  // This handler must remain synchronous. Awaiting a network/script load here
  // loses the click gesture and mobile browsers can block Google's popup.
  button.onclick=()=>{button.disabled=true;report('Abriendo la ventana de Google…');try{codeClient.requestCode()}catch(error){reset();report(error.message||'No se pudo abrir Google.')}};
 }catch(error){button.disabled=false;button.textContent='Reintentar conexión';report(error.message||'No se pudo cargar Google.');button.onclick=()=>mount({button,status,help,setupRequired,loadGoogleScript,getGoogle,clientId,scope,onCode})}
}
root.StudioDriveConnector={mount};
})(typeof module==='object'&&module.exports?module.exports:window);
