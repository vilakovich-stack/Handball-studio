import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
import * as policy from '../supabase/functions/studio-drive/policy.ts';
const owner='servilagar13@gmail.com';
const members=new Map([
 ['reader@example.com',{email:'reader@example.com',role:'reader',status:'approved'}],
 ['editor@example.com',{email:'editor@example.com',role:'writer',status:'approved'}],
 ['blocked@example.com',{email:'blocked@example.com',role:'writer',status:'blocked'}]
]);
const connection={refresh_token:'SERVER_ONLY_SECRET',owner_email:owner};
function database(){return {
 auth:{getUser:async jwt=>({data:{user:jwt==='invalid'?null:{id:'id-'+jwt,email:jwt==='owner'?owner:jwt+'@example.com',email_confirmed_at:'2026-01-01',user_metadata:{full_name:'Trainer',role:'owner'}}},error:null})},
 from(table){let email;const q={select(){return q},eq(_key,value){email=value;return q},async maybeSingle(){return {data:table==='studio_members'?members.get(email)||null:connection,error:null}},insert(row){members.set(row.email,row);return {...q,select(){return {single:async()=>({data:row,error:null})}}}},async upsert(row){members.set(row.email,row);return {error:null}},async order(){return {data:[...members.values()],error:null}}};return q}
};}
let handler,googleCalls=0;
const env={SUPABASE_URL:'https://test.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'PRIVATE_SERVICE',STUDIO_ALLOWED_ORIGINS:'https://vilakovich-stack.github.io',STUDIO_OWNER_EMAIL:owner,STUDIO_DRIVE_FOLDER_ID:'root-folder',GOOGLE_CLIENT_ID:'public-client',GOOGLE_CLIENT_SECRET:'PRIVATE_GOOGLE'};
let source=readFileSync(new URL('../supabase/functions/studio-drive/index.ts',import.meta.url),'utf8');
source=source.replace(/^import .*;$/gm,'');
source='const {normalizeEmail,canWrite,parseDrivePath,listParent}=testPolicy;\n'+stripTypeScriptTypes(source);
vm.runInNewContext(source,{testPolicy:policy,createClient:database,Request,Response,Headers,FormData,Blob,URL,URLSearchParams,console,Deno:{env:{get:key=>env[key]},serve:fn=>{handler=fn}},fetch:async(url,opts)=>{
 googleCalls++;
 if(String(url).includes('oauth2.googleapis.com'))return Response.json({access_token:'PRIVATE_DRIVE'});
 if(String(url).includes('/outside?'))return Response.json({parents:['outside-root']});
 if(String(url).includes('/outside-root?'))return Response.json({parents:[]});
 if(String(url).includes('/inside?')&&String(url).includes('fields=parents'))return Response.json({parents:['root-folder']});
 return Response.json({id:'inside',files:[],ownedByMe:true,mimeType:'application/vnd.google-apps.folder'});
}});
async function request(token,action,body,origin='https://vilakovich-stack.github.io'){
 const r=await handler(new Request('https://test.supabase.co/functions/v1/studio-drive?action='+action,{method:body?'POST':'GET',headers:{Origin:origin,Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}));return {status:r.status,data:await r.json()};
}
test('path policy rejects external origins, traversal and permissions endpoints',()=>{
 for(const path of ['https://evil.example/drive/v3/files','//evil.example/drive/v3/files','drive/v3/files/../about','drive/v3/files/root/permissions','drive/v3/files/root#x'])assert.throws(()=>policy.parseDrivePath(path));
 assert.equal(policy.parseDrivePath('drive/v3/files/inside?alt=media').id,'inside');
 assert.throws(()=>policy.listParent("'root' in parents and trashed = false or true"));
 assert.equal(policy.listParent("'root' in parents and trashed = false and appProperties has { key='studioKind' and value='catalogue' }"),'root');
});
test('unverified sessions and unapproved origins cannot access data',async()=>{
 assert.equal((await request('invalid','me')).status,401);
 assert.equal((await request('owner','users',null,'https://evil.example')).status,403);
});
test('new users are pending, metadata cannot grant admin and only owner manages users',async()=>{
 assert.equal((await request('new','me')).data.status,'pending');
 assert.equal((await request('new','proxy&path=drive/v3/files/inside')).status,403);
 assert.equal((await request('reader','me')).data.role,'reader');
 assert.equal((await request('reader','users')).status,403);
 assert.equal((await request('owner','users',{email:'new@example.com',role:'writer',status:'approved'})).status,200);
 assert.equal((await request('new','me')).data.status,'approved');
 assert.equal((await request('owner','users',{email:owner,role:'reader',status:'blocked'})).status,400);
});
test('blocked users and readers cannot write even with a valid session',async()=>{
 assert.equal((await request('blocked','drive-status')).status,403);
 const result=await request('reader','proxy&path=drive/v3/files',{name:'Bad',mimeType:'application/vnd.google-apps.folder',parents:['root-folder']});
 assert.equal(result.status,403);
});
test('approved reader can read library, not arbitrary owner files, with no token returned',async()=>{
 const inside=await request('reader','proxy&path='+encodeURIComponent('drive/v3/files/inside?alt=media'));
 assert.equal(inside.status,200);assert.ok(!JSON.stringify(inside).includes('PRIVATE_'));
 assert.equal((await request('reader','proxy&path='+encodeURIComponent('drive/v3/files/outside?alt=media'))).status,400);
});
test('editor cannot create files in an outside folder',async()=>{
 assert.equal((await request('editor','proxy&path=drive/v3/files',{name:'folder',mimeType:'application/vnd.google-apps.folder',parents:['outside']})).status,400);
});
