const {test}=require('node:test');
const assert=require('node:assert/strict');
const {StudioDriveConnector}=require('../docs/owner-drive-connector.js');
function controls(){return {button:{isConnected:true},status:{setAttribute(){}},help:{hidden:true}}}
test('preloads Google before click; clicking requests the popup synchronously',async()=>{
 const c=controls();let google,requested=false,loads=0;
 await StudioDriveConnector.mount({...c,setupRequired:false,loadGoogleScript:async()=>{loads++;google={accounts:{oauth2:{initCodeClient:()=>({requestCode(){requested=true}})}}}},getGoogle:()=>google,clientId:'client',scope:'drive',onCode:async()=>{}});
 assert.equal(loads,1);assert.equal(c.button.disabled,false);c.button.onclick();assert.equal(requested,true);assert.match(c.status.textContent,/Abriendo/);
});
test('missing server secret gives a clickable explanation rather than a disabled button',async()=>{
 const c=controls();await StudioDriveConnector.mount({...c,setupRequired:true});assert.equal(c.button.disabled,false);c.button.onclick();assert.equal(c.help.hidden,false);assert.match(c.status.textContent,/GOOGLE_CLIENT_SECRET/);
});
test('blocked popup and exchange failure report inline and allow retry',async()=>{
 const c=controls();let options;
 await StudioDriveConnector.mount({...c,setupRequired:false,getGoogle:()=>({accounts:{oauth2:{initCodeClient:o=>{options=o;return {requestCode(){}}}}}}),clientId:'client',scope:'drive',onCode:async()=>{throw Error('Server configuration missing')}});
 options.error_callback({type:'popup_failed_to_open'});assert.match(c.status.textContent,/bloqueado/);assert.equal(c.button.disabled,false);
 await options.callback({code:'example'});assert.equal(c.status.textContent,'Server configuration missing');assert.equal(c.button.disabled,false);
});
