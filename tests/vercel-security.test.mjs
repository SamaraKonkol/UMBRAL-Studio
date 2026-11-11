import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const config=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));
test('hospedagem aplica proteções mínimas',()=>{
 assert.ok(config.rewrites.some(r=>r.source==='/'&&r.destination==='/index.html'));
 const h=Object.fromEntries(config.headers.flatMap(x=>x.headers).map(x=>[x.key,x.value]));
 assert.equal(h['X-Frame-Options'],'DENY');
 assert.match(h['Content-Security-Policy'],/script-src 'self'/);
 assert.match(h['Content-Security-Policy'],/connect-src 'self' https:\/\/\*\.supabase\.co/);
 assert.match(h['Content-Security-Policy'],/img-src 'self' data: blob:/);
 assert.ok(!h['Content-Security-Policy'].includes("script-src 'self' 'unsafe-inline'"));
});
