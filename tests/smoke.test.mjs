import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFile,stat} from 'node:fs/promises';

const url='http://127.0.0.1:4173';
async function ready(){
  for(let i=0;i<40;i++){
    try{let r=await fetch(url+'/api/config');if(r.ok)return}catch{}
    await new Promise(r=>setTimeout(r,150));
  }
  throw Error('Servidor local não iniciou.');
}
test('Studio local: arquivo oficial, interface e API segura',async()=>{
  const server=spawn(process.execPath,['server.mjs'],{
    cwd:process.cwd(),
    env:{...process.env,NEXFORCE_API_KEY:'',NEXFORCE_MODEL:'',SUPABASE_URL:'',SUPABASE_ANON_KEY:'',ALLOWED_EMAIL:''},
    stdio:'ignore'
  });
  try{
    await ready();
    const page=await fetch(url+'/');assert.equal(page.status,200);
    const html=await page.text();assert.match(html,/CRIAR POST/);assert.match(html,/CRIAR STORY/);
    const asset=await fetch(url+'/assets/a-origem-fundo-oficial.jpg');
    assert.equal(asset.status,200);assert.match(asset.headers.get('content-type'),/image\/jpeg/);
    const bytes=await asset.arrayBuffer();assert.ok(bytes.byteLength>50000);
    const cfg=await (await fetch(url+'/api/config')).json();assert.equal(cfg.cloud,false);assert.equal(cfg.aiConfigured,false);
    const resp=await fetch(url+'/api/generate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({category:'origem',format:'portrait',briefing:'teste'})});
    assert.equal(resp.status,503);
  }finally{server.kill()}
});
