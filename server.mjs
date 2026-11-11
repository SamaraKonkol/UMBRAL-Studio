import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
(function nodeServer(){
'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=process.cwd(),host='127.0.0.1',port=Number(process.env.PORT||4173);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.jpg':'image/jpeg','.png':'image/png'};
const paths=new Set(['/','/index.html','/styles.css','/app.js','/cloud.js','/richtext.js','/editor-geometry.js','/assets/a-origem-fundo-oficial.jpg','/assets/a-origem-fundo-oficial.png']);
const send=(res,status,data)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data))};
const aiReady=()=>!!(process.env.NEXFORCE_API_KEY&&process.env.NEXFORCE_MODEL);
const categories=new Set(['origem','encontro','boasvindas','comunicado']),formats=new Set(['portrait','square','story']);
const prompt='Redija em português brasileiro textos para o motogrupo UMBRAL. Siga o padrão visual e editorial A Origem: preto, vermelho carmesim e fontes serifadas. Sem datas, locais ou fatos inventados. Retorne SOMENTE JSON com title,subtitle,kicker,eventDate,caption, estilo consistente.';
const server=http.createServer(async(req,res)=>{
 let url=new URL(req.url||'/',`http://${host}:${port}`);
 if(url.pathname==='/api/config')return send(res,200,{cloud:false,aiConfigured:aiReady()});
 if(url.pathname==='/api/status')return send(res,200,{aiConfigured:aiReady(),cloudConfigured:false});
 if(url.pathname==='/api/generate'){
  if(req.method!=='POST')return send(res,405,{error:'Método não permitido.'});
  if(req.headers.origin&&!['http://127.0.0.1:'+port,'http://localhost:'+port].includes(req.headers.origin))return send(res,403,{error:'Origem não autorizada.'});
  if(!aiReady())return send(res,503,{error:'Configure NEXFORCE_API_KEY e NEXFORCE_MODEL.'});
  try{let chunks=[],len=0;for await(let c of req){len+=c.length;if(len>8192)throw Error('Pedido muito grande.');chunks.push(c)}
   let b=JSON.parse(Buffer.concat(chunks).toString('utf8'));
   if(!categories.has(b.category)||!formats.has(b.format)||!b.briefing||b.briefing.length>1500)return send(res,400,{error:'Briefing ou formato inválido.'});
   let r=await fetch((process.env.NEXFORCE_BASE_URL||'https://router.nexforce.ai/v1').replace(/\/$/,'')+'/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+process.env.NEXFORCE_API_KEY,'content-type':'application/json'},body:JSON.stringify({model:process.env.NEXFORCE_MODEL,messages:[{role:'system',content:prompt},{role:'user',content:String(b.briefing)}]}),signal:AbortSignal.timeout(30000)});
   if(!r.ok)throw Error('Serviço IA indisponível');
   let t=(await r.json())?.choices?.[0]?.message?.content||'';
   let obj=JSON.parse(t.replace(/^```(?:json)?\s*|\s*```$/g,'').trim());let proposal={};
   for(let k of ['title','subtitle','kicker','eventDate','caption'])if(typeof obj[k]==='string')proposal[k]=obj[k].slice(0,1100);
   return send(res,200,{proposal});
  }catch{return send(res,502,{error:'Não foi possível gerar com a Nexforce.'})}
 }
 if(req.method!=='GET'&&req.method!=='HEAD')return send(res,405,{error:'Método não permitido.'});
 if(!paths.has(url.pathname))return send(res,404,{error:'Arquivo não encontrado.'});
 let rel=url.pathname==='/'?'index.html':url.pathname.slice(1);
 fs.readFile(path.join(root,rel),(err,body)=>{if(err)return send(res,404,{error:'Arquivo não encontrado.'});res.writeHead(200,{'content-type':mime[path.extname(rel)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});if(req.method==='HEAD')res.end();else res.end(body)});
});
server.listen(port,host,()=>console.log(`UMBRAL Studio em http://${host}:${port}`));
})();