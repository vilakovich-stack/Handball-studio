'use strict';
// Use ordinary same-tab navigation to a plain page, keeping the same origin/storage.
const directUpload=document.createElement('a');directUpload.id='importMedia';directUpload.className='primary upload-link';directUpload.href=new URL('subir.html',location.href).href;directUpload.textContent='＋ Subir PDF o imagen';$('#importMedia').replaceWith(directUpload);
