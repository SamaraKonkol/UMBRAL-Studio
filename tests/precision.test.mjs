import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const env={window:{}};vm.runInNewContext(fs.readFileSync(new URL('../editor-geometry.js',import.meta.url),'utf8'),env);
const {move,snap,px}=env.window.UMBRAL_GEOMETRY;
test('passo em pixels funciona em story',()=>{
 const p=move({x:.5,y:.5},10,-1,1080,1920);
 assert.ok(Math.abs(p.x-550/1080)<1e-10);assert.ok(Math.abs(p.y-959/1920)<1e-10)
});
test('movimentação fica dentro da margem',()=>{
 const p=move({x:.5,y:.5},-100000,100000,1080,1920);assert.equal(p.x,.02);assert.equal(p.y,.98)
});
test('alinhamento magnético respeita desligado',()=>{
 const on=snap(542/1080,965/1920,1080,1920,true);
 assert.equal(on.x,.5);assert.equal(on.y,.5);assert.equal(on.guideX,true);
 const off=snap(542/1080,965/1920,1080,1920,false);
 assert.equal(off.guideX,false);assert.ok(off.x!==.5)
});
test('coordenadas em pixels são inteiras',()=>{
 const p=px({x:.25,y:.75},1080,1920);assert.equal(p.x,270);assert.equal(p.y,1440)
});
test('UI contém modelos e controles de precisão',()=>{
 const h=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
 for(const id of ['template','background-fit','coord-x','coord-y','snap-enabled','center-x','center-y'])assert.ok(h.includes('id="'+id+'"'),id);
 assert.ok(h.indexOf('src="editor-geometry.js"')<h.indexOf('src="app.js"'));
});
