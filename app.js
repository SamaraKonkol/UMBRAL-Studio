(function studioApp(){
'use strict';
const $=id=>document.getElementById(id);
const canvas=$('artboard'),ctx=canvas.getContext('2d'),status=$('notice');
const format={
 portrait:{w:1080,h:1350,label:'1080 × 1350 PX'},
 square:{w:1080,h:1080,label:'1080 × 1080 PX'},
 story:{w:1080,h:1920,label:'1080 × 1920 PX'}
};
const copy={
 origem:{name:'A Origem',kicker:'A',title:'ORIGEM',subtitle:'Tudo começou com um sonho.\n\nAntes de existir uma frota, uma sede ou qualquer estrada marcada com o nosso nome, existia apenas a vontade de conquistar a liberdade sobre duas rodas.\n\nA Umbral nasceu da necessidade de pertencimento, apoio e evolução.',eventDate:'',caption:'Tudo começou com um sonho. O UMBRAL nasceu do desejo de construir pertencimento, apoio e evolução.'},
 encontro:{name:'Encontro oficial',kicker:'UMBRAL',title:'A ESTRADA NOS CHAMA',subtitle:'O que nos une vai muito além do caminho. A estrada é apenas o começo.',eventDate:'DATA A DEFINIR',caption:'Um encontro de pessoas e propósitos, além das motocicletas.'},
 boasvindas:{name:'Boas-vindas',kicker:'UMBRAL',title:'SEJA BEM-VINDO',subtitle:'Toda história importa. Toda presença fortalece a irmandade.',eventDate:'',caption:'Seja bem-vindo ao UMBRAL.'},
 comunicado:{name:'Comunicado',kicker:'UMBRAL',title:'ATENÇÃO, IRMANDADE',subtitle:'Informações importantes para quem constrói essa história conosco.',eventDate:'COMUNICADO OFICIAL',caption:'Comunicado oficial do UMBRAL.'}
};
const positions=mode=>({
 kicker:{type:'text',x:.5,y:mode==='story'?.12:.10,fontSize:62,maxWidth:.35,align:'center',family:'body',color:'#ede0d9',opacity:1,italic:false},
 title:{type:'text',x:.5,y:mode==='story'?.205:.185,fontSize:120,maxWidth:.85,align:'center',family:'title',color:'#ede0d9',opacity:1,italic:false},
 ornament:{type:'ornament',x:.5,y:mode==='story'?.3:.315,scale:1,color:'#a72c35',opacity:1},
 subtitle:{type:'text',x:.5,y:mode==='story'?.41:.405,fontSize:39,maxWidth:.78,align:'center',family:'body',color:'#ede0d9',opacity:1,italic:false},
 eventDate:{type:'text',x:.5,y:mode==='story'?.91:.9,fontSize:30,maxWidth:.7,align:'center',family:'body',color:'#ded3ce',opacity:1,italic:true},
 logo:{type:'image',x:.86,y:.09,scale:1,opacity:1}
});
const STORAGE='umbral-studio-v05';
let storedLogo=null;
try{storedLogo=localStorage.getItem('umbral-brand-logo')}catch(_){}
const fresh=(category='origem',mode='portrait')=>({
 id:`p${Date.now()}${Math.random().toString(36).slice(2,6)}`,category,format:mode,
 style:'livre',backgroundPreset:'origem',backgroundData:null,logoData:storedLogo,
 overlayEnabled:false,overlayOpacity:0,briefing:'',...copy[category],elements:positions(mode),updated:Date.now()
});
let project=fresh(), selected=null, gesture=null, selecting=true;
const loaded=new Map(), boxes={};
function notify(s){status.textContent=s}
let dbPromise;
function database(){if(!('indexedDB' in window))throw Error('Seu navegador não oferece IndexedDB');
 if(!dbPromise)dbPromise=new Promise((ok,no)=>{let r=indexedDB.open(STORAGE,1);r.onupgradeneeded=()=>r.result.createObjectStore('projects',{keyPath:'id'});r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
 return dbPromise;
}
async function readAll(){try{let db=await database();return await new Promise((ok,no)=>{let r=db.transaction('projects','readonly').objectStore('projects').getAll();r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})}catch{return JSON.parse(localStorage.getItem(STORAGE)||'[]')}}
async function saveLocal(p){try{let db=await database();await new Promise((ok,no)=>{let t=db.transaction('projects','readwrite');t.objectStore('projects').put(p);t.oncomplete=ok;t.onerror=()=>no(t.error)})}catch{let arr=await readAll();let i=arr.findIndex(v=>v.id===p.id);if(i>=0)arr[i]=p;else arr.push(p);localStorage.setItem(STORAGE,JSON.stringify(arr))}}
async function deleteLocal(id){try{let db=await database();await new Promise((ok,no)=>{let t=db.transaction('projects','readwrite');t.objectStore('projects').delete(id);t.oncomplete=ok;t.onerror=()=>no(t.error)})}catch{localStorage.setItem(STORAGE,JSON.stringify((await readAll()).filter(p=>p.id!==id)))}}
function imageFor(url){
 if(!url)return null;
 if(!loaded.has(url)){
  let img=new Image();img.onload=()=>draw();img.onerror=()=>{loaded.set(url,null);notify('Imagem não carregou. Faça upload dela em Fundos.')};img.src=url;loaded.set(url,img);
 }
 return loaded.get(url);
}
function cover(img,w,h){let r=Math.max(w/img.naturalWidth,h/img.naturalHeight),sw=w/r,sh=h/r;ctx.drawImage(img,(img.naturalWidth-sw)/2,(img.naturalHeight-sh)/2,sw,sh,0,0,w,h)}
function fontOf(el){return `${el.italic?'italic ':''}${el.family==='title'?600:500} ${el.fontSize}px ${el.family==='title'?'Cinzel,Georgia,serif':'"Cormorant Garamond",Georgia,serif'}`}
function wrap(text,limit){
 let list=[];ctx.font=limit.font;for(let para of String(text||'').split('\n')){if(!para.trim()){list.push('');continue}
  let line='';for(let word of para.split(/\s+/).filter(Boolean)){let next=line?line+' '+word:word;if(ctx.measureText(next).width>limit.width&&line){list.push(line);line=word}else line=next}if(line)list.push(line)
 }return list;
}
function paintText(key,text,el,w,h){
 ctx.save();ctx.globalAlpha=el.opacity??1;ctx.fillStyle=el.color||'#ede0d9';ctx.font=fontOf(el);ctx.textBaseline='top';
 let lines=wrap(text,{width:el.maxWidth*w,font:ctx.font});
 let step=el.fontSize*(el.family==='title'?1:1.18);
 let max=0,x=el.x*w,y=el.y*h;
 lines.forEach((ln,i)=>{let len=ctx.measureText(ln).width;max=Math.max(max,len);let left=el.align==='left'?x:el.align==='right'?x-len:x-len/2;ctx.fillText(ln,left,y+i*step)});
 boxes[key]={x:el.align==='left'?x:el.align==='right'?x-max:x-max/2,y,w:max||el.fontSize,h:Math.max(step,lines.length*step)};ctx.restore();
}
function paintOrnament(el,w,h){
 let x=el.x*w,y=el.y*h,s=el.scale||1;
 ctx.save();ctx.strokeStyle=el.color||'#ab303b';ctx.fillStyle=ctx.strokeStyle;ctx.globalAlpha=el.opacity??1;ctx.lineWidth=2*s;
 ctx.beginPath();ctx.moveTo(x-165*s,y);ctx.lineTo(x-26*s,y);ctx.moveTo(x+26*s,y);ctx.lineTo(x+165*s,y);ctx.stroke();
 ctx.translate(x,y);ctx.rotate(Math.PI/4);ctx.fillRect(-8*s,-8*s,16*s,16*s);ctx.restore();
 boxes.ornament={x:x-165*s,y:y-15*s,w:330*s,h:30*s};
}
function paintLogo(el,w,h){
 let img=imageFor(project.logoData);if(!img?.naturalWidth)return;
 let base=170*(el.scale||1),r=img.naturalWidth/img.naturalHeight;
 let iw=r>=1?base:base*r,ih=r>=1?base/r:base;
 let x=el.x*w-iw/2,y=el.y*h-ih/2;
 ctx.save();ctx.globalAlpha=el.opacity??1;ctx.drawImage(img,x,y,iw,ih);ctx.restore();boxes.logo={x,y,w:iw,h:ih};
}
function optionalPaint(w,h){
 ctx.save();ctx.lineWidth=2;ctx.strokeStyle='#b5a7a644';
 if(project.style==='portal'){ctx.beginPath();ctx.arc(w*.5,h*.43,w*.39,Math.PI*.83,2.12*Math.PI);ctx.stroke()}
 if(project.style==='asfalto'){for(let k=0;k<10;k++){ctx.beginPath();ctx.moveTo(w*(.6+.05*k),0);ctx.lineTo(w*(.07+.05*k),h);ctx.stroke()}}
 if(project.style==='codigo'){ctx.strokeRect(w*.055,h*.055,w*.89,h*.89)}
 ctx.restore();
}
function draw(edit=true){
 let {w,h,label}=format[project.format]||format.portrait;
 if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;$('dimensions').textContent=label;
 ctx.clearRect(0,0,w,h);ctx.fillStyle='#090909';ctx.fillRect(0,0,w,h);
 let path=project.backgroundData||(project.backgroundPreset==='origem'?'./assets/a-origem-fundo-oficial.jpg':null);
 let bg=imageFor(path);if(bg?.naturalWidth)cover(bg,w,h);
 if(project.overlayEnabled&&project.overlayOpacity>0){ctx.fillStyle=`rgba(0,0,0,${project.overlayOpacity})`;ctx.fillRect(0,0,w,h)}
 optionalPaint(w,h);
 for(let k of Object.keys(boxes))delete boxes[k];
 for(let k of ['logo','kicker','title','ornament','subtitle','eventDate']){
  let el=project.elements[k];if(!el||el.visible===false)continue;
  if(k==='logo')paintLogo(el,w,h);
  else if(k==='ornament')paintOrnament(el,w,h);
  else paintText(k,project[k],el,w,h);
 }
 if(edit&&selected&&boxes[selected]){
  let b=boxes[selected];ctx.save();ctx.strokeStyle='#ebeeef';ctx.setLineDash([8,7]);ctx.lineWidth=2;ctx.strokeRect(b.x-8,b.y-8,b.w+16,b.h+16);ctx.setLineDash([]);
  let hx=b.x+b.w+8,hy=b.y+b.h+8;ctx.fillStyle='#ebeeef';ctx.fillRect(hx-9,hy-9,18,18);ctx.restore();
 }
}
function getElement(k){return k&&project.elements[k]||null}
function selectedUi(){
 let el=getElement(selected);$('selected-label').textContent=el?({logo:'Brasão',kicker:'Chamada superior',title:'Título',ornament:'Ornamento',subtitle:'Texto principal',eventDate:'Rodapé'}[selected]||selected):'Nenhum';
 for(let id of ['font-size','box-width','element-align','element-color','element-opacity','element-scale','element-italic'])$(id).disabled=!el||(el.type==='text'?id==='element-scale':['font-size','box-width','element-align','element-italic'].includes(id));
 if(!el)return;
 $('font-size').value=el.fontSize||44;$('box-width').value=Math.round((el.maxWidth||.7)*100);
 $('element-align').value=el.align||'center';$('element-color').value=el.color||'#ece2da';
 $('element-opacity').value=Math.round((el.opacity??1)*100);$('element-scale').value=Math.round((el.scale||1)*100);$('element-italic').checked=!!el.italic;
}
function ui(){
 $('project-name').textContent=project.name;$('format').value=project.format;$('category').value=project.category;
 $('background-preset').value=project.backgroundData?'custom':project.backgroundPreset;
 $('overlay-enabled').value=project.overlayEnabled?'on':'off';$('overlay-opacity').value=Math.round(project.overlayOpacity*100);
 for(let id of ['kicker','title','subtitle','caption','briefing'])$(id).value=project[id]||'';
 $('event-date').value=project.eventDate||'';
 document.querySelectorAll('[data-style]').forEach(b=>b.classList.toggle('selected',b.dataset.style===project.style));
 selectedUi();draw();
}
function hit(p){let order=['eventDate','subtitle','ornament','title','kicker','logo'];for(let k of order){let b=boxes[k];if(b&&p.x>=b.x-12&&p.x<=b.x+b.w+12&&p.y>=b.y-12&&p.y<=b.y+b.h+12)return k}return null}
function point(e){let r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height}}
canvas.addEventListener('pointerdown',e=>{
 let p=point(e),b=boxes[selected];
 if(b&&Math.abs(p.x-(b.x+b.w+8))<23&&Math.abs(p.y-(b.y+b.h+8))<23){gesture={kind:'resize',key:selected,start:p,base:{...project.elements[selected]}}}
 else{selected=hit(p);let el=getElement(selected);gesture=el?{kind:'move',key:selected,dx:p.x-el.x*canvas.width,dy:p.y-el.y*canvas.height}:null}
 if(gesture){canvas.setPointerCapture(e.pointerId);canvas.classList.add('dragging')}
 selectedUi();draw();
});
canvas.addEventListener('pointermove',e=>{
 if(!gesture)return;let p=point(e),el=project.elements[gesture.key];
 if(gesture.kind==='move'){el.x=Math.min(.98,Math.max(.02,(p.x-gesture.dx)/canvas.width));el.y=Math.min(.98,Math.max(.02,(p.y-gesture.dy)/canvas.height))}
 else{let b=gesture.base,dx=(p.x-gesture.start.x)/canvas.width,dy=(p.y-gesture.start.y)/canvas.height;
  if(el.type==='text'){el.fontSize=Math.round(Math.max(12,Math.min(160,b.fontSize+dy*950)));el.maxWidth=Math.max(.1,Math.min(.95,b.maxWidth+dx))}
  else el.scale=Math.max(.1,Math.min(2,b.scale+dx*2+dy*2));
 }
 selectedUi();draw();
});
for(let name of ['pointerup','pointercancel'])canvas.addEventListener(name,()=>{gesture=null;canvas.classList.remove('dragging')});
canvas.addEventListener('dblclick',()=>{selected=null;selectedUi();draw()});
for(let id of ['kicker','title','subtitle','caption','briefing'])$(id).addEventListener('input',e=>{project[id]=e.target.value;draw()});
$('event-date').addEventListener('input',e=>{project.eventDate=e.target.value;draw()});
$('format').addEventListener('change',e=>{
 let old=project.elements,newPos=positions(e.target.value);
 for(let k of Object.keys(old))if(newPos[k])newPos[k]={...newPos[k],color:old[k].color,opacity:old[k].opacity,italic:old[k].italic};
 project.elements=newPos;project.format=e.target.value;selected=null;ui();
});
$('category').addEventListener('change',e=>{project={...project,...copy[e.target.value],category:e.target.value,elements:positions(project.format)};selected=null;ui()});
$('background-preset').addEventListener('change',e=>{
 if(e.target.value==='custom'&&!project.backgroundData){notify('Carregue uma imagem usando ADICIONAR FOTO DE FUNDO.');e.target.value=project.backgroundPreset;return}
 project.backgroundPreset=e.target.value;if(e.target.value!=='custom')project.backgroundData=null;draw();
});
$('overlay-enabled').addEventListener('change',e=>{project.overlayEnabled=e.target.value==='on';draw()});
$('overlay-opacity').addEventListener('input',e=>{project.overlayOpacity=+e.target.value/100;draw()});
$('style-options').addEventListener('click',e=>{let b=e.target.closest('[data-style]');if(!b)return;project.style=b.dataset.style;ui()});
const bind=(id,fn,event='input')=>$(id).addEventListener(event,e=>{let el=getElement(selected);if(!el)return;fn(el,e.target);draw()});
bind('font-size',(el,t)=>el.fontSize=+t.value);
bind('box-width',(el,t)=>el.maxWidth=+t.value/100);
bind('element-align',(el,t)=>el.align=t.value,'change');
bind('element-color',(el,t)=>el.color=t.value);
bind('element-opacity',(el,t)=>el.opacity=+t.value/100);
bind('element-scale',(el,t)=>el.scale=+t.value/100);
bind('element-italic',(el,t)=>el.italic=t.checked,'change');
function newPost(mode){project=fresh('origem',mode);selected=null;switchView('studio');ui();notify(`Novo ${mode==='story'?'Story':'Post'} iniciado.`)}
$('new-post').addEventListener('click',()=>newPost('portrait'));$('new-story').addEventListener('click',()=>newPost('story'));
function fileData(file){return new Promise((ok,no)=>{if(!file||!file.type.startsWith('image/'))return no(Error('Selecione uma imagem válida'));let r=new FileReader();r.onload=()=>ok(r.result);r.onerror=()=>no(Error('Não foi possível ler a imagem'));r.readAsDataURL(file)})}
$('bg-upload').addEventListener('change',async e=>{try{project.backgroundData=await fileData(e.target.files[0]);project.backgroundPreset='custom';ui();notify('Imagem adicionada sem escurecimento automático.')}catch(err){notify(err.message)}e.target.value=''});
$('remove-photo').addEventListener('click',()=>{project.backgroundPreset='origem';project.backgroundData=null;ui();notify('Fundo oficial restaurado.')});
$('logo-upload').addEventListener('change',async e=>{try{storedLogo=await fileData(e.target.files[0]);project.logoData=storedLogo;try{localStorage.setItem('umbral-brand-logo',storedLogo)}catch(_){}selected='logo';ui();notify('Brasão inserido: mova e redimensione no canvas.')}catch(err){notify(err.message)}e.target.value=''});
$('clear-logo').addEventListener('click',()=>{project.logoData=null;storedLogo=null;try{localStorage.removeItem('umbral-brand-logo')}catch(_){}selected=null;ui()});
$('download-png').addEventListener('click',()=>{draw(false);try{let a=document.createElement('a');a.href=canvas.toDataURL('image/png');a.download=`UMBRAL_${project.category}_${project.format}.png`;a.click();notify('PNG exportado sem marca-d’água.')}catch(err){notify(`Falha ao exportar: ${err.message}`)}draw(true)});
$('copy-caption').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(project.caption);notify('Legenda copiada.')}catch{notify('Não foi possível copiar.') }});
$('draft').addEventListener('click',()=>{let brief=project.briefing.trim();if(brief)project.subtitle=brief.slice(0,520);else project.subtitle=copy[project.category].subtitle;ui();notify('Sugestão de texto aplicada sem alterar o estilo visual.')});
const cloud=window.umbralCloud||{};
$('generate-ai').addEventListener('click',async()=>{
 let brief=project.briefing.trim();if(!brief){notify('Escreva sua ideia para a IA antes de gerar.');return}
 $('generate-ai').disabled=true;notify('Gerando texto com IA...');
 try{let headers={'Content-Type':'application/json'};
  if(cloud.loggedIn&&cloud.bearer)headers.Authorization=await cloud.bearer();
  let res=await fetch('/api/generate',{method:'POST',headers,body:JSON.stringify({category:project.category,format:project.format,briefing:brief})});
  let data=await res.json();if(!res.ok)throw Error(data.error||`Falha HTTP ${res.status}`);
  let v=data.proposal||data;for(let k of ['title','subtitle','kicker','eventDate','caption'])if(typeof v[k]==='string')project[k]=v[k];
  ui();notify('Textos gerados. O layout oficial foi preservado.');
 }catch(err){notify(`IA indisponível: ${err.message}`)}finally{$('generate-ai').disabled=false}
});
$('save-project').addEventListener('click',async()=>{
 project.updated=Date.now();
 try{await saveLocal(project);notify('Projeto salvo localmente.');
 if(cloud.cloud&&cloud.loggedIn&&cloud.saveProject){try{await cloud.saveProject(project);notify('Projeto salvo localmente e na nuvem.')}catch(e){notify('Salvo localmente; nuvem indisponível: '+e.message)}}}
 catch(e){notify('Falha ao salvar: '+e.message)}
});
function switchView(page){document.querySelectorAll('.view').forEach(e=>e.classList.toggle('active',e.id===`${page}-view`));document.querySelectorAll('.nav-btn').forEach(e=>e.classList.toggle('active',e.dataset.view===page));$('location-label').textContent=page.toUpperCase();if(page==='archive')showArchive()}
async function showArchive(){
 let list=(await readAll()).sort((a,b)=>b.updated-a.updated),grid=$('archive-grid');grid.textContent='';
 if(!list.length){let d=document.createElement('div');d.className='empty-archive';d.textContent='Nenhum projeto salvo ainda.';grid.append(d)}
 for(let p of list){let card=document.createElement('button');card.className='archive-card',card.type='button';
 let thumb=document.createElement('div');thumb.className='archive-thumb';
 let strong=document.createElement('strong');strong.textContent=(p.title||'UMBRAL').slice(0,26);thumb.append(strong);
 let name=document.createElement('div');name.textContent=p.name||'Projeto';
 let meta=document.createElement('div');meta.className='archive-meta';
 let date=document.createElement('span');date.textContent=new Date(p.updated).toLocaleDateString('pt-BR');
 let del=document.createElement('span');del.textContent='EXCLUIR ×';del.style.padding='5px';
 del.onclick=async e=>{e.stopPropagation();if(confirm('Excluir este projeto local?')){await deleteLocal(p.id);showArchive()}};
 meta.append(date,del);card.append(thumb,name,meta);card.onclick=()=>{project={...fresh(),...p,elements:{...positions(p.format),...p.elements}};selected=null;switchView('studio');ui();notify('Projeto restaurado.')};grid.append(card)}
}
document.querySelectorAll('[data-view]').forEach(btn=>btn.addEventListener('click',()=>switchView(btn.dataset.view)));
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();$('save-project').click()}});
const gate=$('login-gate');gate.hidden=true;
if(cloud.init)cloud.init().then(x=>{if(x?.cloud){gate.hidden=!(!x.loggedIn);$('logout').hidden=!x.loggedIn;$('environment-label').textContent=x.loggedIn?'NUVEM ATIVA':'ACESSO PRIVADO'}else{$('environment-label').textContent='MODO LOCAL'}}).catch(()=>{$('environment-label').textContent='MODO LOCAL'});
$('login-form').addEventListener('submit',async e=>{e.preventDefault();try{await cloud.signIn($('login-email').value,$('login-password').value);gate.hidden=true;$('logout').hidden=false;$('environment-label').textContent='NUVEM ATIVA'}catch(err){$('login-error').textContent=err.message}});
$('logout').addEventListener('click',async()=>{if(cloud.signOut)await cloud.signOut();gate.hidden=false;$('logout').hidden=true;$('environment-label').textContent='ACESSO PRIVADO'});
ui();if(document.fonts?.ready)document.fonts.ready.then(draw);
})();