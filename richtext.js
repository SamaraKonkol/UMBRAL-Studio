(function(root){
'use strict';
/* Palavras entre *asteriscos* recebem o destaque vermelho e itálico do post A Origem.
   Quebras de parágrafo são preservadas; não há HTML nem eval. */
function tokenize(source){
 const text=String(source||'');
 const tokens=[];
 function append(chunk,accent){
  for(const piece of chunk.split(/(\n|[ \t]+)/)){
   if(!piece)continue;
   if(piece==='\n')tokens.push({break:true});
   else tokens.push({text:piece,accent});
  }
 }
 const expression=/\*([^*\n]+)\*/g;let cursor=0,match;
 while((match=expression.exec(text))){append(text.slice(cursor,match.index),false);append(match[1],true);cursor=expression.lastIndex}
 append(text.slice(cursor),false);
 return tokens;
}
function layout(source,measure,maxWidth){
 const lines=[{items:[],width:0}];
 const current=()=>lines[lines.length-1];
 for(const token of tokenize(source)){
  if(token.break){lines.push({items:[],width:0});continue}
  if(/^\s+$/.test(token.text)&&current().items.length===0)continue;
  const width=measure(token.text,!!token.accent);
  if(!/^\s+$/.test(token.text)&&current().items.some(item=>!/^\s+$/.test(item.text))&&current().width+width>maxWidth){
   lines.push({items:[],width:0});
  }
  if(/^\s+$/.test(token.text)&&current().items.length===0)continue;
  current().items.push({...token,width});
  current().width+=width;
 }
 return lines;
}
root.UMBRAL_RICH_TEXT={tokenize,layout};
})(typeof window==='undefined'?globalThis:window);
