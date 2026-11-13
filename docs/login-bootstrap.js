'use strict';
// GitHub Pages publishes static application code. Drive ACLs protect shared data.
window.HANDBALL_AUTH_REQUIRED=!!window.STUDIO_ACCOUNT_CONFIG?.enabled||location.hostname.endsWith('.github.io')||location.hostname==='github.io'||new URLSearchParams(location.search).get('login')==='1';
if(window.HANDBALL_AUTH_REQUIRED)document.documentElement.classList.add('handball-login-locked');
