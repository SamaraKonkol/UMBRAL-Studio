(function cloudClient(){
'use strict';
const CACHE='umbral-session-v05';
let cfg={cloud:false},session=null,user=null;
const root=s=>String(s||'').replace(/\/$/,'');
async function request(url,opts={}){
 const res=await fetch(url,opts);let body;try{body=await res.json()}catch{body={}};
 if(!res.ok)throw Error(body.error_description||body.error||body.message||`Falha ${res.status}`);
 return body;
}
function headers(){return{'content-type':'application/json',apikey:cfg.supabaseAnonKey}}
function clear(){session=null;user=null;try{localStorage.removeItem(CACHE)}catch(_){}}
function persist(data){if(!data.access_token||!data.refresh_token)throw Error('Sessão inválida');session={access_token:data.access_token,refresh_token:data.refresh_token,expires_at:Date.now()+1000*(data.expires_in||3600)};user=data.user||user;try{localStorage.setItem(CACHE,JSON.stringify(session))}catch(_){}}
async function refresh(){
 if(!session)return null;
 if(session.expires_at>Date.now()+90000)return session.access_token;
 let data=await request(`${root(cfg.supabaseUrl)}/auth/v1/token?grant_type=refresh_token`,{method:'POST',headers:headers(),body:JSON.stringify({refresh_token:session.refresh_token})});persist(data);return session.access_token;
}
async function bearer(){let token=await refresh();if(!token)throw Error('Faça login.');return `Bearer ${token}`}
async function me(){let token=await bearer();user=await request('/api/me',{headers:{authorization:token}});return user}
async function init(){
 try{cfg=await request('/api/config')}catch{cfg={cloud:false}}
 if(!cfg.cloud)return{cloud:false,loggedIn:false};
 try{session=JSON.parse(localStorage.getItem(CACHE)||'null')}catch{session=null}
 if(session?.access_token){try{await me();return{cloud:true,loggedIn:true,email:user?.email}}catch{clear()}}
 return{cloud:true,loggedIn:false};
}
async function signIn(email,password){
 if(!cfg.cloud)throw Error('Nuvem não configurada');
 let auth=await request(`${root(cfg.supabaseUrl)}/auth/v1/token?grant_type=password`,{method:'POST',headers:headers(),body:JSON.stringify({email,password})});
 persist(auth);try{return await me()}catch(e){clear();throw e}
}
async function signOut(){let token=session?.access_token;clear();if(token)fetch(`${root(cfg.supabaseUrl)}/auth/v1/logout`,{method:'POST',headers:{...headers(),authorization:`Bearer ${token}`}}).catch(()=>{})}
async function saveProject(p){
 if(!cfg.cloud)return false;if(!user)await me();
 let text=JSON.stringify(p);if(text.length>2800000)throw Error('Projeto muito grande; reduza imagens antes de sincronizar.');
 await request(`${root(cfg.supabaseUrl)}/rest/v1/studio_projects?on_conflict=id`,{method:'POST',
 headers:{...headers(),authorization:await bearer(),Prefer:'resolution=merge-duplicates'},
 body:JSON.stringify({id:p.id,owner_id:user.id,title:String(p.title||'Sem título').slice(0,150),format:p.format,data:p,updated_at:new Date(p.updated||Date.now()).toISOString()})});
 return true;
}
window.umbralCloud={init,signIn,signOut,bearer,saveProject,get cloud(){return!!cfg.cloud},get loggedIn(){return!!session?.access_token},get email(){return user?.email||''}};
})();