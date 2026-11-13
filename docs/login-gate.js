(function(){
'use strict';
if(!window.HANDBALL_AUTH_REQUIRED||window.STUDIO_ACCOUNT_CONFIG?.enabled)return;
let ready=false,entered=false;
const gate=$('#entryGate'),login=$('#entryLogin'),message=$('#entryStatus');
function updateEntry(){const approved=authorized&&!!driveToken&&['owner','writer','reader'].includes(driveAccess.role);document.documentElement.classList.toggle('handball-login-locked',!approved);gate.setAttribute('aria-hidden',String(approved));if(approved){login.disabled=false;if(!entered){entered=true;show('library')}$('#entryIdentity').textContent=driveAccess.email||'Cuenta Google autorizada'}else{entered=false;login.disabled=!ready||$('#connectDrive').disabled;message.textContent=['Configuración pendiente','Pendiente de conectar'].includes($('#driveStatus').textContent)?'Entra con una cuenta autorizada por Sergio Vila.':$('#driveActivity').textContent||'Entra con una cuenta autorizada por Sergio Vila.'}}
const baseControls=setCloudControls;setCloudControls=function(){baseControls();updateEntry()};
const baseStatus=syncStatus;syncStatus=function(label,detail){baseStatus(label,detail);updateEntry()};
const baseError=cloudError;cloudError=function(error){if(error.status===403||error.status===404){authorized=false;driveToken=null;forgetDriveSession();clearDriveAccess();setCloudControls()}baseError(error);updateEntry()};
login.onclick=()=>{if(!ready)return;message.textContent='Abriendo Google…';$('#connectDrive').click()};
const baseReady=studioReady;studioReady=function(){ready=true;baseReady();updateEntry()};
const logout=document.createElement('button');logout.id='accountLogout';logout.textContent='Salir';logout.title='Cerrar la conexión de Google';logout.onclick=()=>{$('#disconnectDrive').click();updateEntry()};$('.header-right').append(logout);
updateEntry();
})();
