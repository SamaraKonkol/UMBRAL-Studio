const REMOTE = process.env.NEXFORCE_BASE_URL || 'https://router.nexforce.ai/v1';
const MAX = 8192;
const fields={title:80,subtitle:1200,kicker:80,eventDate:80,caption:1100};
const allowedCategories=new Set(['origem','encontro','boasvindas','comunicado']);
const allowedFormats=new Set(['portrait','square','story']);
const safeError='Falha ao consultar a IA. Confira os créditos, a chave e o modelo no painel da Nexforce.';
export const aiReady=()=>Boolean(process.env.NEXFORCE_API_KEY && process.env.NEXFORCE_MODEL);
export const cloudReady=()=>Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY && process.env.ALLOWED_EMAIL);
export const publicConfig=()=>({cloud:cloudReady(),supabaseUrl:cloudReady()?process.env.SUPABASE_URL:undefined,supabaseAnonKey:cloudReady()?process.env.SUPABASE_ANON_KEY:undefined,aiConfigured:aiReady()});
export function reply(res,status,data){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.end(JSON.stringify(data))}
export async function authorize(req){
  if(!cloudReady())return{ok:false,status:503,error:'Acesso privado ainda não configurado.'};
  let token=String(req.headers.authorization||'').replace(/^Bearer /i,'').trim();
  if(!token)return{ok:false,status:401,error:'Faça login para usar o Studio.'};
  try{
    let r=await fetch(process.env.SUPABASE_URL.replace(/\/$/,'')+'/auth/v1/user',{headers:{authorization:'Bearer '+token,apikey:process.env.SUPABASE_ANON_KEY},signal:AbortSignal.timeout(10000)});
    if(!r.ok)return{ok:false,status:401,error:'Sessão inválida.'};
    let user=await r.json();
    if(!user.id||String(user.email||'').toLowerCase()!==process.env.ALLOWED_EMAIL.toLowerCase())return{ok:false,status:403,error:'Conta não autorizada.'};
    return{ok:true,user:{id:user.id,email:user.email}};
  }catch{return{ok:false,status:502,error:'Não foi possível validar a sessão.'}}
}
export function parsePayload(body){
  let b=typeof body==='string'?JSON.parse(body):body;
  if(!b||typeof b!=='object')throw Error('Dados inválidos.');
  if(JSON.stringify(b).length>MAX)throw Error('Pedido muito grande.');
  if(!allowedCategories.has(b.category)||!allowedFormats.has(b.format))throw Error('Categoria ou formato inválido.');
  if(typeof b.briefing!=='string'||b.briefing.trim().length<2||b.briefing.length>1500)throw Error('Escreva uma ideia entre 2 e 1500 caracteres.');
  return{category:b.category,format:b.format,briefing:b.briefing.trim()};
}
const prompt='Você escreve textos para o motogrupo UMBRAL, em português do Brasil. Identidade: manifesto editorial inspirado em A Origem, fundo de nuvens tempestuosas com vermelho carmesim, tipografia serifada marfim, foco em respeito, liberdade, pertencimento, apoio e evolução. NÃO escolha outros estilos. Não invente fatos, datas, locais, nomes de membros ou eventos confirmados. Gere somente JSON válido com title, subtitle, kicker, eventDate, caption. Mantenha textos elegantes, claros e sem clichês; a arte será editada manualmente.';
export async function generate(body){
 if(!aiReady())return{status:503,error:'Configure NEXFORCE_API_KEY e NEXFORCE_MODEL no servidor.'};
 let input;
 try{input=parsePayload(body)}catch(e){return{status:400,error:e.message}}
 try{
  let response=await fetch(REMOTE.replace(/\/$/,'')+'/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+process.env.NEXFORCE_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.NEXFORCE_MODEL,messages:[{role:'system',content:prompt},{role:'user',content:'Categoria: '+input.category+'; formato: '+input.format+'; pedido: '+input.briefing}],temperature:0.6}),signal:AbortSignal.timeout(30000)});
  if(!response.ok)return{status:502,error:safeError};
  let data=await response.json();
  let t=data?.choices?.[0]?.message?.content;
  if(Array.isArray(t))t=t.map(x=>x.text||'').join('');
  if(typeof t!=='string')return{status:502,error:'Resposta não textual da IA.'};
  let parsed;try{const i=t.indexOf('{'),j=t.lastIndexOf('}');if(i<0||j<i)throw Error('Sem JSON');parsed=JSON.parse(t.slice(i,j+1))}catch{return{status:502,error:'A IA retornou um texto em formato inválido.'}}
  let proposal={};for(let [k,lim] of Object.entries(fields))if(typeof parsed[k]==='string')proposal[k]=parsed[k].trim().slice(0,lim);
  if(!Object.keys(proposal).length)return{status:502,error:'A IA não gerou uma proposta válida.'};
  return{status:200,proposal};
 }catch{return{status:502,error:safeError}}
}