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
 origem:{name:'A Origem',kicker:'A',title:'ORIGEM',subtitle:'Tudo começou com um *sonho.*\n\nAntes de existir uma frota, uma sede ou qualquer estrada marcada com o nosso nome, existia apenas a vontade de conquistar a liberdade sobre duas rodas.\n\nA Umbral nasceu da necessidade de *pertencimento, apoio e evolução.*\n\nDe um desejo genuíno de reunir pessoas que, assim como eu, buscavam mais que motocicletas: buscavam lugar, propósito e irmandade.',eventDate:'',caption:'Tudo começou com um sonho. O UMBRAL nasceu do desejo de construir pertencimento, apoio e evolução.'},
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
 style:'livre',template:'origem',snapEnabled:true,backgroundFit:'cover',backgroundPreset:'origem',backgroundData:null,logoData:storedLogo,
 overlayEnabled:false,overlayOpacity:0,briefing:'',...copy[category],elements:positions(mode),layers:[],updated:Date.now()
});
let project=fresh(), selected=null, gesture=null;
const undoStack=[],redoStack=[];
const geo=window.UMBRAL_GEOMETRY;
let guides=null;
function checkpoint(){const s=JSON.stringify(project);if(undoStack.at(-1)!==s){undoStack.push(s);if(undoStack.length>15)undoStack.shift()}redoStack.length=0;updateHistoryButtons()}
function updateHistoryButtons(){if($('undo'))$('undo').disabled=!undoStack.length;if($('redo'))$('redo').disabled=!redoStack.length}
function undo(){if(!undoStack.length)return;redoStack.push(JSON.stringify(project));project=JSON.parse(undoStack.pop());project.layers ||= [];selected=null;ui();updateHistoryButtons();notify('Alteração desfeita.')}
function redo(){if(!redoStack.length)return;undoStack.push(JSON.stringify(project));project=JSON.parse(redoStack.pop());project.layers ||= [];selected=null;ui();updateHistoryButtons();notify('Alteração refeita.')}
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
function cover(img,w,h){
 const contain=project.backgroundFit==='contain';
 const r=contain?Math.min(w/img.naturalWidth,h/img.naturalHeight):Math.max(w/img.naturalWidth,h/img.naturalHeight);
 if(contain){let dw=img.naturalWidth*r,dh=img.naturalHeight*r;ctx.drawImage(img,(w-dw)/2,(h-dh)/2,dw,dh)}
 else{let sw=w/r,sh=h/r;ctx.drawImage(img,(img.naturalWidth-sw)/2,(img.naturalHeight-sh)/2,sw,sh,0,0,w,h)}
}
function fontOf(el){return `${el.italic?'italic ':''}${el.family==='title'?600:500} ${el.fontSize}px ${el.family==='title'?'Cinzel,Georgia,serif':'"Cormorant Garamond",Georgia,serif'}`}
function wrap(text,limit){
 let list=[];ctx.font=limit.font;for(let para of String(text||'').split('\n')){if(!para.trim()){list.push('');continue}
  let line='';for(let word of para.split(/\s+/).filter(Boolean)){let next=line?line+' '+word:word;if(ctx.measureText(next).width>limit.width&&line){list.push(line);line=word}else line=next}if(line)list.push(line)
 }return list;
}
function paintText(key,text,el,w,h){
 ctx.save();ctx.globalAlpha=el.opacity??1;ctx.textBaseline='top';
 const lines=window.UMBRAL_RICH_TEXT.layout(text,(part,accent)=>{
  ctx.font=fontOf({...el,italic:accent||el.italic});return ctx.measureText(part).width
 },el.maxWidth*w);
 let step=el.fontSize*(el.family==='title'?1:1.18),max=0,x=el.x*w,y=el.y*h;
 lines.forEach((line,i)=>{
  max=Math.max(max,line.width);let at=el.align==='left'?x:el.align==='right'?x-line.width:x-line.width/2;
  for(const item of line.items){
   ctx.font=fontOf({...el,italic:item.accent||el.italic});
   ctx.fillStyle=item.accent?'#b9414b':(el.color||'#ede0d9');
   ctx.fillText(item.text,at,y+i*step);at+=item.width;
  }
 });
 boxes[key]={x:el.align==='left'?x:el.align==='right'?x-max:x-max/2,y,w:max||el.fontSize,h:Math.max(step,lines.length*step)};ctx.restore();
}
function paintOrnament(key,el,w,h){
 let x=el.x*w,y=el.y*h,s=el.scale||1;
 ctx.save();ctx.strokeStyle=el.color||'#ab303b';ctx.fillStyle=ctx.strokeStyle;ctx.globalAlpha=el.opacity??1;ctx.lineWidth=2*s;
 ctx.beginPath();ctx.moveTo(x-165*s,y);ctx.lineTo(x-26*s,y);ctx.moveTo(x+26*s,y);ctx.lineTo(x+165*s,y);ctx.stroke();
 ctx.translate(x,y);ctx.rotate(Math.PI/4);ctx.fillRect(-8*s,-8*s,16*s,16*s);ctx.restore();
 boxes[key]={x:x-165*s,y:y-15*s,w:330*s,h:30*s};
}
function paintLogo(el,w,h){
 let img=imageFor(project.logoData);if(!img?.naturalWidth)return;
 let base=170*(el.scale||1),r=img.naturalWidth/img.naturalHeight;
 let iw=r>=1?base:base*r,ih=r>=1?base/r:base;
 let x=el.x*w-iw/2,y=el.y*h-ih/2;
 ctx.save();ctx.globalAlpha=el.opacity??1;ctx.drawImage(img,x,y,iw,ih);ctx.restore();boxes.logo={x,y,w:iw,h:ih};
}
function paintLayerImage(key,el,w,h){
 const img=imageFor(el.src);if(!img?.naturalWidth)return;
 const base=330*(el.scale||1),r=img.naturalWidth/img.naturalHeight;
 const iw=r>=1?base:base*r,ih=r>=1?base/r:base;
 const x=el.x*w-iw/2,y=el.y*h-ih/2;
 ctx.save();ctx.globalAlpha=el.opacity??1;ctx.drawImage(img,x,y,iw,ih);ctx.restore();boxes[key]={x,y,w:iw,h:ih};
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
  else if(k==='ornament')paintOrnament(k,el,w,h);
  else paintText(k,project[k],el,w,h);
 }
 for(const layer of project.layers||[]){
  if(layer.visible===false)continue;
  if(layer.type==='image')paintLayerImage(layer.id,layer,w,h);
  else if(layer.type==='ornament')paintOrnament(layer.id,layer,w,h);
  else paintText(layer.id,layer.text||'',layer,w,h);
 }
 if(edit&&selected&&boxes[selected]){
  let b=boxes[selected];ctx.save();ctx.strokeStyle='#ebeeef';ctx.setLineDash([8,7]);ctx.lineWidth=2;ctx.strokeRect(b.x-8,b.y-8,b.w+16,b.h+16);ctx.setLineDash([]);
  let hx=b.x+b.w+8,hy=b.y+b.h+8;ctx.fillStyle='#ebeeef';ctx.fillRect(hx-9,hy-9,18,18);ctx.restore();
 }
 if(edit&&gesture?.kind==='move'&&guides){
  ctx.save();ctx.strokeStyle='rgba(204,73,87,.9)';ctx.lineWidth=2;ctx.setLineDash([10,9]);
  if(guides.guideX){ctx.beginPath();ctx.moveTo(w/2,0);ctx.lineTo(w/2,h);ctx.stroke()}
  if(guides.guideY){ctx.beginPath();ctx.moveTo(0,h/2);ctx.lineTo(w,h/2);ctx.stroke()}
  ctx.restore();
 }
}
function getElement(k){return k&&(project.elements[k]||(project.layers||[]).find(item=>item.id===k))||null}
function getLayerText(id){const el=getElement(id);return el?.type==='text'?(Object.prototype.hasOwnProperty.call(project,id)?project[id]:el.text||''):''}
function updateLayerList(){
 const list=$('layer-list');if(!list)return;list.textContent='';
 const keys=['kicker','title','ornament','subtitle','eventDate','logo',...(project.layers||[]).map(el=>el.id)];
 const labels={kicker:'Chamada superior',title:'Título',ornament:'Ornamento',subtitle:'Texto principal',eventDate:'Rodapé',logo:'Brasão'};
 for(const key of keys){
  const el=getElement(key);if(!el)continue;
  const row=document.createElement('div');row.className='layer-row';
  const pick=document.createElement('button');pick.type='button';pick.textContent=labels[key]||(el.type==='image'?'Imagem adicionada':'Texto adicionado');pick.className=selected===key?'layer-pick active':'layer-pick';
  pick.addEventListener('click',()=>{selected=key;selectedUi();updateLayerList();draw()});
  const toggle=document.createElement('button');toggle.type='button';toggle.className='layer-toggle';toggle.title=el.visible===false?'Mostrar camada':'Ocultar camada';toggle.textContent=el.visible===false?'◌':'◉';
  toggle.addEventListener('click',()=>{checkpoint();el.visible=el.visible===false;updateLayerList();draw()});
  row.append(pick,toggle);list.appendChild(row);
 }
}
function newLayerId(){return 'layer_'+Date.now()+'_'+Math.random().toString(36).slice(2,6)}
function addTextLayer(){
 checkpoint();const id=newLayerId();project.layers ||= [];project.layers.push({id,type:'text',text:'NOVO TEXTO',x:.5,y:.55,fontSize:48,maxWidth:.72,align:'center',family:'body',color:'#ede0d9',opacity:1,italic:false,visible:true});
 selected=id;ui();$('layer-text').focus();notify('Texto independente adicionado: arraste na arte para posicionar.')
}
function duplicateSelected(){
 const el=getElement(selected);if(!el)return;checkpoint();
 const id=newLayerId();const item={...structuredClone(el),id,x:Math.min(.9,el.x+.035),y:Math.min(.9,el.y+.035),visible:true};
 if(item.type==='text')item.text=getLayerText(selected);
 if(selected==='logo')item.src=project.logoData;
 project.layers ||= [];project.layers.push(item);selected=id;ui();notify('Elemento duplicado.')
}
function deleteSelected(){
 const el=getElement(selected);if(!el)return;checkpoint();
 const index=(project.layers||[]).findIndex(x=>x.id===selected);
 if(index>=0)project.layers.splice(index,1);
 else el.visible=false;
 selected=null;ui();notify(index>=0?'Camada removida.':'Elemento-base ocultado. Você pode reexibi-lo na lista de camadas.')
}
function moveLayer(direction){
 const layers=project.layers||[];const i=layers.findIndex(x=>x.id===selected);
 if(i<0)return;const j=i+direction;if(j<0||j>=layers.length)return;
 checkpoint();[layers[i],layers[j]]=[layers[j],layers[i]];updateLayerList();draw()
}

const templateNames={origem:'Clássico',narrativa:'Narrativa',chamada:'Chamada'};
function applyTemplate(name){
 if(!Object.hasOwn(templateNames,name))return;checkpoint();
 let p=positions(project.format);
 if(name==='narrativa'){
  p.kicker.y=.085;p.title.y=.17;p.title.fontSize=106;p.ornament.y=.29;
  p.subtitle.y=.38;p.subtitle.fontSize=38;p.subtitle.maxWidth=.82;p.eventDate.y=.91;
 }else if(name==='chamada'){
  p.kicker.y=.14;p.title.y=.27;p.title.fontSize=104;p.ornament.y=.4;
  p.subtitle.y=.47;p.subtitle.fontSize=45;p.subtitle.maxWidth=.77;p.eventDate.y=.82;
 }
 for(let k of Object.keys(p)){
  const old=project.elements[k]||{};
  p[k]={...p[k],color:old.color??p[k].color,opacity:old.opacity??p[k].opacity,italic:old.italic??p[k].italic,visible:old.visible??true,scale:old.scale??p[k].scale};
 }
 project.template=name;project.elements=p;selected=null;ui();notify('Modelo aplicado sem apagar textos nem camadas. Desfazer disponível.')
}
function coordinateUI(){
 const el=getElement(selected),f=format[project.format];
 for(let id of ['coord-x','coord-y','center-x','center-y'])$(id).disabled=!el;
 $('coord-x').max=f.w;$('coord-y').max=f.h;
 if(!el){$('coord-x').value='';$('coord-y').value='';return}
 let v=geo.px(el,f.w,f.h);
 if(document.activeElement!==$('coord-x'))$('coord-x').value=v.x;
 if(document.activeElement!==$('coord-y'))$('coord-y').value=v.y;
}
function selectedUi(){
 coordinateUI();
 let el=getElement(selected);$('selected-label').textContent=el?({logo:'Brasão',kicker:'Chamada superior',title:'Título',ornament:'Ornamento',subtitle:'Texto principal',eventDate:'Rodapé'}[selected]||(el.type==='image'?'Imagem adicionada':'Texto adicionado')):'Nenhum';
 $('layer-text-wrap').hidden=el?.type!=='text';
 if(el?.type==='text'&&document.activeElement!==$('layer-text'))$('layer-text').value=getLayerText(selected);
 $('duplicate-layer').disabled=!el;
 $('delete-layer').disabled=!el;
 $('layer-up').disabled=!el||!(project.layers||[]).some(x=>x.id===selected);
 $('layer-down').disabled=!el||!(project.layers||[]).some(x=>x.id===selected);
 for(let id of ['font-size','box-width','element-align','element-color','element-opacity','element-scale','element-italic'])$(id).disabled=!el||(el.type==='text'?id==='element-scale':['font-size','box-width','element-align','element-italic'].includes(id)||(el.type==='image'&&id==='element-color'));
 if(!el)return;
 $('font-size').value=el.fontSize||44;$('box-width').value=Math.round((el.maxWidth||.7)*100);
 $('element-align').value=el.align||'center';$('element-color').value=el.color||'#ece2da';
 $('element-opacity').value=Math.round((el.opacity??1)*100);$('element-scale').value=Math.round((el.scale||1)*100);$('element-italic').checked=!!el.italic;
}
function ui(){
 $('project-name').textContent=project.name;$('format').value=project.format;$('category').value=project.category;$('template').value=project.template||'origem';$('background-fit').value=project.backgroundFit||'cover';$('snap-enabled').checked=project.snapEnabled!==false;
 $('background-preset').value=project.backgroundData?'custom':project.backgroundPreset;
 $('overlay-enabled').value=project.overlayEnabled?'on':'off';$('overlay-opacity').value=Math.round(project.overlayOpacity*100);
 for(let id of ['kicker','title','subtitle','caption','briefing'])$(id).value=project[id]||'';
 $('event-date').value=project.eventDate||'';
 document.querySelectorAll('[data-style]').forEach(b=>b.classList.toggle('selected',b.dataset.style===project.style));
 selectedUi();updateLayerList();draw();
}
function hit(p){let order=[...(project.layers||[]).map(x=>x.id).reverse(),'eventDate','subtitle','ornament','title','kicker','logo'];for(let k of order){let b=boxes[k];if(b&&p.x>=b.x-12&&p.x<=b.x+b.w+12&&p.y>=b.y-12&&p.y<=b.y+b.h+12)return k}return null}
function point(e){let r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height}}
canvas.addEventListener('pointerdown',e=>{
 let p=point(e),b=boxes[selected];
 if(b&&Math.abs(p.x-(b.x+b.w+8))<23&&Math.abs(p.y-(b.y+b.h+8))<23){(checkpoint(),gesture={kind:'resize',key:selected,start:p,base:{...getElement(selected)}})}
 else{selected=hit(p);let el=getElement(selected);gesture=el?(checkpoint(),{kind:'move',key:selected,dx:p.x-el.x*canvas.width,dy:p.y-el.y*canvas.height}):null}
 if(gesture){canvas.setPointerCapture(e.pointerId);canvas.classList.add('dragging')}
 selectedUi();updateLayerList();draw();
});
canvas.addEventListener('pointermove',e=>{
 if(!gesture)return;let p=point(e),el=getElement(gesture.key);
 if(gesture.kind==='move'){guides=geo.snap((p.x-gesture.dx)/canvas.width,(p.y-gesture.dy)/canvas.height,canvas.width,canvas.height,project.snapEnabled!==false);el.x=guides.x;el.y=guides.y}
 else{let b=gesture.base,dx=(p.x-gesture.start.x)/canvas.width,dy=(p.y-gesture.start.y)/canvas.height;
  if(el.type==='text'){el.fontSize=Math.round(Math.max(12,Math.min(160,b.fontSize+dy*950)));el.maxWidth=Math.max(.1,Math.min(.95,b.maxWidth+dx))}
  else el.scale=Math.max(.1,Math.min(2,(b.scale||1)+dx*2+dy*2));
 }
 selectedUi();draw();
});
for(let name of ['pointerup','pointercancel'])canvas.addEventListener(name,()=>{gesture=null;guides=null;canvas.classList.remove('dragging');draw()});
canvas.addEventListener('dblclick',()=>{selected=null;selectedUi();draw()});
for(let id of ['kicker','title','subtitle','caption','briefing'])$(id).addEventListener('input',e=>{project[id]=e.target.value;if(selected===id&&document.activeElement!==$('layer-text'))$('layer-text').value=e.target.value;draw()});
$('event-date').addEventListener('input',e=>{project.eventDate=e.target.value;draw()});
$('format').addEventListener('change',e=>{
 let old=project.elements,newPos=positions(e.target.value);
 // Mantém a variação editorial também ao alternar Post / Story.
 if(project.template==='narrativa'){
  newPos.kicker.y=.085;newPos.title.y=.17;newPos.title.fontSize=106;newPos.ornament.y=.29;
  newPos.subtitle.y=.38;newPos.subtitle.fontSize=38;newPos.subtitle.maxWidth=.82;newPos.eventDate.y=.91;
 }else if(project.template==='chamada'){
  newPos.kicker.y=.14;newPos.title.y=.27;newPos.title.fontSize=104;newPos.ornament.y=.4;
  newPos.subtitle.y=.47;newPos.subtitle.fontSize=45;newPos.subtitle.maxWidth=.77;newPos.eventDate.y=.82;
 }
 for(let k of Object.keys(old))if(newPos[k])newPos[k]={...newPos[k],color:old[k].color,opacity:old[k].opacity,italic:old[k].italic};
 project.elements=newPos;project.format=e.target.value;selected=null;ui();
});
$('template').addEventListener('change',e=>applyTemplate(e.target.value));
$('category').addEventListener('change',e=>{checkpoint();project={...project,...copy[e.target.value],category:e.target.value,elements:positions(project.format)};selected=null;ui()});
$('background-preset').addEventListener('change',e=>{
 if(e.target.value==='custom'&&!project.backgroundData){notify('Carregue uma imagem usando ADICIONAR FOTO DE FUNDO.');e.target.value=project.backgroundPreset;return}
 project.backgroundPreset=e.target.value;if(e.target.value!=='custom')project.backgroundData=null;draw();
});
$('background-fit').addEventListener('change',e=>{checkpoint();project.backgroundFit=e.target.value;draw()});
$('snap-enabled').addEventListener('change',e=>{project.snapEnabled=e.target.checked;notify(project.snapEnabled?'Alinhamento magnético ativo.':'Alinhamento magnético desligado.')});
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
function newPost(mode){checkpoint();project=fresh('origem',mode);selected=null;switchView('studio');ui();notify(`Novo ${mode==='story'?'Story':'Post'} iniciado.`)}
$('new-post').addEventListener('click',()=>newPost('portrait'));$('new-story').addEventListener('click',()=>newPost('story'));
function fileData(file){return new Promise((ok,no)=>{if(!file||!file.type.startsWith('image/'))return no(Error('Selecione uma imagem válida'));let r=new FileReader();r.onload=()=>ok(r.result);r.onerror=()=>no(Error('Não foi possível ler a imagem'));r.readAsDataURL(file)})}
$('bg-upload').addEventListener('change',async e=>{try{const src=await fileData(e.target.files[0]);checkpoint();project.backgroundData=src;project.backgroundPreset='custom';ui();notify('Imagem adicionada sem escurecimento automático.')}catch(err){notify(err.message)}e.target.value=''});
$('remove-photo').addEventListener('click',()=>{checkpoint();project.backgroundPreset='origem';project.backgroundData=null;ui();notify('Fundo oficial restaurado.')});
$('logo-upload').addEventListener('change',async e=>{try{const src=await fileData(e.target.files[0]);checkpoint();storedLogo=src;project.logoData=storedLogo;try{localStorage.setItem('umbral-brand-logo',storedLogo)}catch(_){}selected='logo';ui();notify('Brasão inserido: mova e redimensione no canvas.')}catch(err){notify(err.message)}e.target.value=''});
$('clear-logo').addEventListener('click',()=>{checkpoint();project.logoData=null;storedLogo=null;try{localStorage.removeItem('umbral-brand-logo')}catch(_){}selected=null;ui()});
$('download-png').addEventListener('click',()=>{draw(false);try{let a=document.createElement('a');a.href=canvas.toDataURL('image/png');a.download=`UMBRAL_${project.category}_${project.format}.png`;a.click();notify('PNG exportado sem marca-d’água.')}catch(err){notify(`Falha ao exportar: ${err.message}`)}draw(true)});
$('copy-caption').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(project.caption);notify('Legenda copiada.')}catch{notify('Não foi possível copiar.') }});
$('draft').addEventListener('click',()=>{checkpoint();let brief=project.briefing.trim();if(brief)project.subtitle=brief.slice(0,520);else project.subtitle=copy[project.category].subtitle;ui();notify('Sugestão de texto aplicada sem alterar o estilo visual.')});
const cloud=window.umbralCloud||{};
$('generate-ai').addEventListener('click',async()=>{
 let brief=project.briefing.trim();if(!brief){notify('Escreva sua ideia para a IA antes de gerar.');return}
 $('generate-ai').disabled=true;notify('Gerando texto com IA...');
 try{let headers={'Content-Type':'application/json'};
  if(cloud.loggedIn&&cloud.bearer)headers.Authorization=await cloud.bearer();
  let res=await fetch('/api/generate',{method:'POST',headers,body:JSON.stringify({category:project.category,format:project.format,briefing:brief})});
  let data=await res.json();if(!res.ok)throw Error(data.error||`Falha HTTP ${res.status}`);
  checkpoint();let v=data.proposal||data;for(let k of ['title','subtitle','kicker','eventDate','caption'])if(typeof v[k]==='string')project[k]=v[k];
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
 meta.append(date,del);card.append(thumb,name,meta);card.onclick=()=>{checkpoint();project={...fresh(),...p,layers:p.layers||[],elements:{...positions(p.format),...p.elements}};selected=null;switchView('studio');ui();notify('Projeto restaurado.')};grid.append(card)}
}
document.querySelectorAll('[data-view]').forEach(btn=>btn.addEventListener('click',()=>switchView(btn.dataset.view)));
$('add-text-layer').addEventListener('click',addTextLayer);
$('image-layer-upload').addEventListener('change',async e=>{try{const src=await fileData(e.target.files[0]);checkpoint();const id=newLayerId();project.layers ||= [];project.layers.push({id,type:'image',src,x:.5,y:.55,scale:1,opacity:1,visible:true});selected=id;ui();notify('Imagem independente inserida, sem escurecimento.')}catch(err){notify(err.message)}e.target.value=''});
$('duplicate-layer').addEventListener('click',duplicateSelected);
$('delete-layer').addEventListener('click',deleteSelected);
$('layer-up').addEventListener('click',()=>moveLayer(1));
$('layer-down').addEventListener('click',()=>moveLayer(-1));
$('layer-text').addEventListener('input',e=>{const el=getElement(selected);if(!el||el.type!=='text')return;
 if(Object.prototype.hasOwnProperty.call(project,selected)){project[selected]=e.target.value;const other=$(selected==='eventDate'?'event-date':selected);if(other)other.value=e.target.value}
 else el.text=e.target.value;
 draw();
});
for(const axis of ['x','y'])$('coord-'+axis).addEventListener('change',e=>{
 const el=getElement(selected),num=Number(e.target.value);if(!el||!Number.isFinite(num))return;
 checkpoint();const size=format[project.format][axis==='x'?'w':'h'];el[axis]=Math.max(.02,Math.min(.98,num/size));coordinateUI();draw();
});
for(const axis of ['x','y'])$('center-'+axis).addEventListener('click',()=>{
 const el=getElement(selected);if(!el)return;checkpoint();el[axis]=.5;coordinateUI();draw();
});
$('undo').addEventListener('click',undo);$('redo').addEventListener('click',redo);
document.querySelector('.inspector').addEventListener('focusin',e=>{if(e.target.matches('input,textarea,select'))checkpoint()});
document.addEventListener('keydown',e=>{
 if(!e.ctrlKey&&!e.metaKey&&selected&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)&&!e.target.closest?.('input,textarea,select,[contenteditable="true"]')){
  const el=getElement(selected);if(!el)return;e.preventDefault();checkpoint();
  const d=e.shiftKey?10:1,dx=e.key==='ArrowLeft'?-d:e.key==='ArrowRight'?d:0,dy=e.key==='ArrowUp'?-d:e.key==='ArrowDown'?d:0;
  Object.assign(el,geo.move(el,dx,dy,format[project.format].w,format[project.format].h));coordinateUI();draw();return;
 }
 if(!(e.ctrlKey||e.metaKey))return;
 const key=e.key.toLowerCase();
 if(key==='s'){e.preventDefault();$('save-project').click()}
 else if((key==='z'||key==='y')&&!['TEXTAREA','INPUT'].includes(e.target.tagName)){e.preventDefault();if(key==='y'||e.shiftKey)redo();else undo()}
});
const gate=$('login-gate');
const localHost=location.protocol==='file:'||['localhost','127.0.0.1','::1','[::1]'].includes(location.hostname);
function blockUnconfigured(){
 gate.hidden=false;
 $('logout').hidden=true;
 $('environment-label').textContent='CONFIGURAÇÃO PENDENTE';
 $('login-error').textContent='A versão hospedada precisa da autenticação Supabase configurada para liberar o Studio.';
 for(const id of ['login-email','login-password','login-submit'])$(id).disabled=true;
}
// No servidor público o bloqueio permanece visível até a sessão ser verificada.
gate.hidden=localHost;
if(cloud.init)cloud.init().then(x=>{
 if(x?.cloud){
  gate.hidden=Boolean(x.loggedIn);
  $('logout').hidden=!x.loggedIn;
  $('environment-label').textContent=x.loggedIn?'NUVEM ATIVA':'ACESSO PRIVADO';
 }else if(localHost){gate.hidden=true;$('environment-label').textContent='MODO LOCAL'}
 else blockUnconfigured();
}).catch(()=>{if(localHost){gate.hidden=true;$('environment-label').textContent='MODO LOCAL'}else blockUnconfigured()});
$('login-form').addEventListener('submit',async e=>{e.preventDefault();try{await cloud.signIn($('login-email').value,$('login-password').value);gate.hidden=true;$('logout').hidden=false;$('environment-label').textContent='NUVEM ATIVA'}catch(err){$('login-error').textContent=err.message}});
$('logout').addEventListener('click',async()=>{if(cloud.signOut)await cloud.signOut();gate.hidden=false;$('logout').hidden=true;$('environment-label').textContent='ACESSO PRIVADO'});
ui();updateHistoryButtons();if(document.fonts?.ready)document.fonts.ready.then(draw);
})();