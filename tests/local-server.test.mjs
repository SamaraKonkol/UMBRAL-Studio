import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {readFileSync} from 'node:fs';

test('acesso remoto bloqueado quando falta Supabase',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const code=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 assert.match(html,/<div id="login-gate" class="login-gate">/);
 assert.match(code,/function blockUnconfigured\(\)/);
 assert.match(code,/gate\.hidden=localHost/);
});
test('servidor local entrega módulos, fundo original e API sem segredos',async()=>{
 const port=22000+Math.floor(Math.random()*19000);
 const env={...process.env,PORT:String(port),NEXFORCE_API_KEY:'',NEXFORCE_MODEL:'',SUPABASE_URL:'',SUPABASE_PUBLISHABLE_KEY:'',SUPABASE_ANON_KEY:'',ALLOWED_EMAIL:''};
 const child=spawn(process.execPath,['server.mjs'],{cwd:new URL('../',import.meta.url),env,stdio:'ignore'});
 try{
  let ready=false;
  for(let attempt=0;attempt<50;attempt++){
   try{const response=await fetch('http://127.0.0.1:'+port+'/api/config');if(response.ok){ready=true;break}}catch{}
   await delay(70);
  }
  assert.equal(ready,true,'servidor deve iniciar');
  for(const asset of ['/','/app.js','/cloud.js','/richtext.js','/editor-geometry.js','/assets/a-origem-fundo-oficial.jpg']){
   const response=await fetch('http://127.0.0.1:'+port+asset);
   assert.equal(response.status,200,asset);
   assert.ok((await response.arrayBuffer()).byteLength>0,asset);
  }
  const config=await (await fetch('http://127.0.0.1:'+port+'/api/config')).json();
  assert.equal(config.cloud,false);
  assert.equal(config.aiConfigured,false);
  const response=await fetch('http://127.0.0.1:'+port+'/api/generate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({category:'origem',format:'portrait',briefing:'teste'})});
  assert.equal(response.status,503);
 }finally{child.kill('SIGTERM')}
});
