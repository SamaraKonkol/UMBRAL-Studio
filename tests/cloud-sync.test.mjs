import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('cliente de nuvem lista e exclui somente com sessão',()=>{
 const client=file('cloud.js');
 assert.match(client,/async function listProjects\(\)/);
 assert.match(client,/async function removeProject\(id\)/);
 assert.match(client,/authorization:await bearer\(\)/);
});
test('regras RLS e acesso autenticado preservados',()=>{
 const sql=file('db/schema.sql');
 assert.match(sql,/enable row level security/i);
 assert.match(sql,/owner_id/i);
 assert.match(sql,/auth\.uid\(\)=owner_id/);
 assert.match(sql,/grant select, insert, update, delete/i);
 assert.match(sql,/revoke all on table .* from anon/i);
});
test('somente chave publicável é retornada pelo backend',async()=>{
 const {publicConfig}=await import('../lib-api.mjs');
 const env=process.env;
 const orig={SUPABASE_URL:env.SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY:env.SUPABASE_PUBLISHABLE_KEY,SUPABASE_ANON_KEY:env.SUPABASE_ANON_KEY,ALLOWED_EMAIL:env.ALLOWED_EMAIL};
 try{
  process.env.SUPABASE_URL='https://example.supabase.co';
  process.env.SUPABASE_PUBLISHABLE_KEY='sb_publishable_test';
  process.env.SUPABASE_ANON_KEY='';
  process.env.ALLOWED_EMAIL='allowed@example.test';
  const response=publicConfig();
  assert.equal(response.cloud,true);
  assert.equal(response.supabaseAnonKey,'sb_publishable_test');
 }finally{
  for(const [key,val] of Object.entries(orig)){if(val===undefined)delete process.env[key];else process.env[key]=val}
 }
});
