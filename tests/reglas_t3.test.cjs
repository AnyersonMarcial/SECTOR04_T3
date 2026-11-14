// Pruebas automáticas de las reglas obligatorias. Ejecutar: node tests/reglas_t3.test.cjs
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'game.js'),'utf8');
function between(start,end){const a=source.indexOf(start);const b=source.indexOf(end,a);assert(a>=0&&b>a);return source.slice(a,b);}
const calls=[];const z={hp:2,dead:false};
let cur=1, fcd=0, shots=0, kills=0;
const gun=[{mag:30,a:30,res:0,pel:1,spr:0,rate:.095},{mag:8,a:8,res:0,pel:9,spr:.065,rate:.85}];
const crosshair={style:{}};
const ctx={Wp:gun,cur,P:{rl:0,dead:0,x:0,z:0,y:0,yaw:0,pitch:0},
 fcd,over:0,kick:0,flash:0,DETECTION_RANGE:13,Math,Map, setTimeout:()=>0,
 nz:()=>{},tone:()=>{},alertNear:()=>{},wallDist:()=>90,rand:()=>0,rnd:()=>0,
 ray:()=>({t:2,z,head:0}),
 hurtZ:(enemy,head)=>{enemy.hp--;if(enemy.hp===0){enemy.dead=true;kills++}},
 reload:()=>{},'$':()=>crosshair};
vm.createContext(ctx);
vm.runInContext(between('function fire(){','\nfunction reload(){'),ctx);
ctx.fire();
assert.equal(gun[1].a,7,'Un clic con escopeta consume un cartucho');
assert.equal(z.hp,1,'9 perdigones en un mismo zombi solo producen UN impacto');
ctx.fire();
assert.equal(gun[1].a,6,'Dos clics consumen dos cartuchos');
assert.equal(z.hp,0,'El zombi requiere exactamente DOS disparos válidos');
assert.equal(kills,1,'Un zombi muerto se contabiliza una sola vez');
ctx.cur=0;ctx.fire();
assert.equal(gun[0].a,29,'Un clic con el fusil consume una sola bala');
assert.ok(!between('function update(dt){','\nlet last=0;').includes('fire();'),'Mantener el botón no ejecuta disparos automáticos');
assert.ok(source.includes('hp:2,sp:1.0') && source.includes('hp:2,sp:1.6') && source.includes('hp:2,sp:1.5'));
assert.ok(source.includes('st:0,t:rnd(0,9)'),'Enemigos no empiezan en persecución');
assert.ok(source.includes("finish('GAME OVER'"),'Debe existir Game Over por contacto');
assert.ok(source.includes('if(d<.44+.40*z.visualScale'),'Debe detectarse contacto en el bucle');
assert.ok(source.includes('¡MISIÓN COMPLETADA!'),'Debe existir mensaje de extracción');
// Verifica lectura REAL del GLB binario, incluidos vértices y bytes intercalados.
const reader=between('function decodeGLB(encoded){','\nfunction glbMesh(encoded,skin){');
const loader={TextDecoder,DataView,Uint8Array,Uint16Array,Uint32Array,Float32Array,Map,
 zDecode:s=>Uint8Array.from(Buffer.from(s,'base64'))};
vm.createContext(loader);vm.runInContext(reader,loader);
for(const [file,verts] of [['zombie_mixamo.glb',32568],['rifle_tactico.glb',0],['escopeta_tactica.glb',0]]){
 const encoded=fs.readFileSync(path.join(root,'assets',file)).toString('base64');
 const doc=loader.decodeGLB(encoded);
 assert.equal(doc.json.asset.version,'2.0');
 const prims=doc.json.meshes[0].primitives;
 const count=prims.reduce((sum,p)=>sum+doc.json.accessors[p.attributes.POSITION].count,0);
 assert.ok(count>100 && (verts===0||count===verts));
 for(const p of prims){const pos=loader.glbAccessor(doc,p.attributes.POSITION);assert.ok(pos.length>=3);assert.ok(Number.isFinite(pos[0]))}
}
console.log('OK: GLB de las dos armas y zombi, clic único, perdigones, 2 impactos, contacto, extracción y activación.');
