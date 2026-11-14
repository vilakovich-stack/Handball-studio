const {test}=require('node:test');const assert=require('node:assert/strict');
const {StudioAccountProfile}=require('../docs/account-profile.js');
test('reader and editor profiles use their own account and do not show administrator wording',()=>{
 for(const role of ['reader','writer']){
 const m=StudioAccountProfile.describe({email:'tecnicobalonmanovila@gmail.com',name:'Técnico Vila',role});
 assert.equal(m.name,'Técnico Vila');assert.equal(m.email,'tecnicobalonmanovila@gmail.com');assert.equal(m.initials,'TV');assert.equal(m.isAdmin,false);assert.equal(m.accessTitle,'Mi cuenta');assert.ok(!m.accessDescription.includes('Tú decides'));
 }
});
test('only the server-supplied owner role shows administration and logout clears identity',()=>{
 assert.equal(StudioAccountProfile.describe({role:'owner',email:'owner@example.com'}).isAdmin,true);
 const m=StudioAccountProfile.describe(null);assert.equal(m.name,'Tu cuenta');assert.equal(m.isAdmin,false);assert.equal(m.email,'');
});
test('profile renderer replaces every personal label and hides owner-only controls for a reader',()=>{
 class Element{constructor(){this.textContent='Sergio Vila';this.children=[]}append(x){this.children.push(x)}}
 const selectors=['.profile span','.profile > div','.header-right .avatar','.workspace','nav [data-view="access"] span','nav [data-view="storage"]','#access .role-cards','#access .access-help','#access .page-heading h1','#access .page-heading p','#access .eyebrow'];
 const map=new Map(selectors.map(s=>[s,new Element()]));const doc={querySelector:s=>map.get(s),createElement:()=>new Element()};
 StudioAccountProfile.render(doc,{name:'Ana López',email:'ana@example.com',role:'reader'});
 assert.equal(map.get('.profile span').textContent,'Ana López');assert.equal(map.get('.profile > div').textContent,'AL');assert.equal(map.get('.header-right .avatar').textContent,'AL');assert.equal(map.get('.workspace').children[0].textContent,'Ana López');assert.equal(map.get('#access .role-cards').hidden,true);assert.equal(map.get('nav [data-view="storage"]').hidden,true);
 StudioAccountProfile.render(doc,{name:'Sergio',email:'owner@example.com',role:'owner'});assert.equal(map.get('#access .role-cards').hidden,false);
});
