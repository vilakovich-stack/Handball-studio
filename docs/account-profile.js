(function(root){
'use strict';
function describe(account){
 const email=String(account?.email||'');
 const name=String(account?.name||email||'Tu cuenta').trim();
 const role=({owner:'Administrador',writer:'Editor',reader:'Lector'})[account?.role]||'Sin sesión';
 const initials=(name.includes('@')?name.split('@')[0]:name).split(/[\s._-]+/).filter(Boolean).slice(0,2).map(x=>Array.from(x)[0]).join('').toUpperCase()||'HS';
 return {name,email,role,initials,isAdmin:account?.role==='owner',accessTitle:account?.role==='owner'?'Administración de usuarios':'Mi cuenta',accessDescription:account?.role==='owner'?'Aprueba correos y administra los permisos de tu biblioteca.':'Tu cuenta y tus permisos en la biblioteca compartida de Sergio Vila.'};
}
function render(doc,account){
 const model=describe(account),q=s=>doc.querySelector(s);
 const profile=q('.profile span');if(profile){profile.textContent=model.name;const small=doc.createElement('small');small.textContent=model.email||model.role;profile.append(small)}
 for(const selector of ['.profile > div','.header-right .avatar']){const el=q(selector);if(el){el.textContent=model.initials;el.title=model.email?model.name+' · '+model.email+' · '+model.role:model.name}}
 const workspace=q('.workspace');if(workspace){workspace.textContent='MI CUENTA';const small=doc.createElement('small');small.textContent=model.name;const role=doc.createElement('span');role.textContent=model.role;small.append(role);workspace.append(small)}
 const nav=q('nav [data-view="access"] span');if(nav)nav.textContent=model.isAdmin?'Administración':'Mi cuenta';
 const storage=q('nav [data-view="storage"]');if(storage)storage.hidden=!model.isAdmin;
 const cards=q('#access .role-cards');if(cards)cards.hidden=!model.isAdmin;
 const help=q('#access .access-help');if(help)help.hidden=!model.isAdmin;
 const title=q('#access .page-heading h1');if(title)title.textContent=model.accessTitle;
 const description=q('#access .page-heading p');if(description)description.textContent=model.accessDescription;
 const eyebrow=q('#access .eyebrow');if(eyebrow)eyebrow.textContent=model.isAdmin?'TU BIBLIOTECA · TUS REGLAS':'CUENTA DE ENTRENADOR';
 return model;
}
root.StudioAccountProfile={describe,render};
})(typeof module==='object'&&module.exports?module.exports:window);
