import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../richtext.js',import.meta.url),'utf8');
const scope={window:{}};
vm.runInNewContext(source,scope);
const {tokenize,layout}=scope.window.UMBRAL_RICH_TEXT;

test('destaques vermelhos são delimitados por asteriscos',()=>{
 const tokens=tokenize('Tudo começou com um *sonho.*');
 assert.equal(tokens.some(x=>x.text==='sonho.'&&x.accent),true);
 assert.equal(tokens.some(x=>x.text==='Tudo'&&!x.accent),true);
});
test('layout preserva parágrafos e quebra linhas',()=>{
 const lines=layout('Primeira linha\n\nMais uma frase longa',s=>s.length*10,85);
 assert.ok(lines.length>=4);
 assert.equal(lines[1].items.length,0);
});
test('texto puro mantém a formatação padrão',()=>{
 const t=tokenize('UMBRAL');
 assert.equal(t[0].accent,false);
});
test('HTML contem controles do editor e scripts na ordem correta',()=>{
 const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.ok(html.indexOf('src="richtext.js"')<html.indexOf('src="app.js"'));
 for(const id of ['add-text-layer','image-layer-upload','layer-list','undo','redo','layer-text']){
  assert.ok(html.includes('id="'+id+'"'),id);
 }
});
