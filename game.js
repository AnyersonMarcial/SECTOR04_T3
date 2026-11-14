(()=>{'use strict';
const T=THREE,C=4,WH=3.8,GW=48,GH=40;
const rnd=(a,b)=>a+Math.random()*(b-a),$=s=>document.querySelector(s);
document.head.insertAdjacentHTML('beforeend',`<style>*{box-sizing:border-box}html,body{margin:0;height:100%;overflow:hidden;background:#000;font:600 13px system-ui,sans-serif;color:#dfe8e0;user-select:none}canvas{display:block}#hud{position:fixed;inset:0;pointer-events:none;text-shadow:0 2px 5px #000}#hud>*{position:absolute}#cr{left:50%;top:50%;width:6px;height:6px;margin:-3px;border-radius:50%;background:#fff9}#hp{left:24px;bottom:24px;font-size:36px}#hpb{left:24px;bottom:14px;width:190px;height:6px;background:#2a3a35}#hpb i{display:block;height:100%;background:#d4604c}#am{right:26px;bottom:20px;text-align:right;font-size:36px}#am small{display:block;font-size:12px;letter-spacing:.15em;opacity:.7}#ob{top:16px;left:0;right:0;text-align:center;letter-spacing:.14em;color:#e8c98f}#ms{top:28%;left:0;right:0;text-align:center;font-size:26px;letter-spacing:.2em;color:#ff7a5c;opacity:0;transition:opacity .4s}#vg{inset:0;background:radial-gradient(ellipse at 50% 52%,#0000 36%,#000c 100%)}#dm{inset:0;background:radial-gradient(circle,#0000 35%,#b01010cc);opacity:0}#ov{position:fixed;inset:0;display:flex;flex-direction:column;justify-content:center;align-items:center;background:#000d;z-index:5;text-align:center;gap:14px}#ov h1{font-size:clamp(30px,6vw,64px);margin:0;letter-spacing:.08em}#ov button{padding:15px 44px;background:#b5482f;color:#fff;border:0;font:800 15px system-ui;letter-spacing:.15em;cursor:pointer}#ov p{max-width:600px;line-height:1.7;color:#aab8ae;margin:0}</style>`);
document.body.insertAdjacentHTML('beforeend',`<div id=hud><div id=vg></div><div id=cr></div><div id=hp></div><div id=hpb><i></i></div><div id=am></div><div id=ob></div><div id=ms></div><div id=dm></div></div><div id=ov><h1 id=ot>SECTOR 04</h1><p id=op></p><button id=go>JUGAR</button></div>`);
// ---------- audio
let AC;const aud=()=>{AC=AC||new(window.AudioContext||window.webkitAudioContext)();AC.resume()};
const tone=(f,d,ty,v,k)=>{if(!AC||v<.004)return;const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.type=ty;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(Math.max(25,f*k),t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+d)};
const nz=(d,v,fc)=>{if(!AC)return;const n=AC.sampleRate*d|0,b=AC.createBuffer(1,n,AC.sampleRate),a=b.getChannelData(0);for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*(1-i/n);const s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();f.type='lowpass';f.frequency.value=fc;g.gain.value=v;s.buffer=b;s.connect(f);f.connect(g);g.connect(AC.destination);s.start()};
// ---------- renderer / escena
const scene=new T.Scene(),ren=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'}),cam=new T.PerspectiveCamera(75,1,.05,110);
scene.background=new T.Color(0x030506);scene.fog=new T.FogExp2(0x030506,.06);ren.shadowMap.enabled=true;ren.shadowMap.type=T.PCFSoftShadowMap;ren.setPixelRatio(Math.min(devicePixelRatio,1.75));document.body.prepend(ren.domElement);cam.rotation.order='YXZ';scene.add(cam);
const rs=()=>{ren.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()};addEventListener('resize',rs);rs();
scene.add(new T.AmbientLight(0x2c3642,.3));
const fl=new T.SpotLight(0xfff0d0,3.3,42,.46,.8,1.4),ft=new T.Object3D();fl.position.set(.24,-.2,-.5);ft.position.set(0,0,-6);cam.add(fl,ft);fl.target=ft;fl.castShadow=true;fl.shadow.mapSize.set(1024,1024);fl.shadow.camera.near=.35;fl.shadow.camera.far=40;fl.shadow.bias=-.0006;fl.shadow.normalBias=.03;
const ml=new T.PointLight(0xffb060,0,10);ml.position.set(.2,-.1,-1);cam.add(ml);
// ---------- nivel (rejilla de celdas de 4 m)
const R={S:[2,32,7,6],c1:[4,23,3,9],A:[2,15,12,8],c2:[14,17,8,3],B:[22,11,10,12],D:[32,16,8,7],c3:[25,6,3,5],C:[18,1,16,5],c4:[34,2,6,3],c5:[38,5,2,11],E:[40,1,6,6]};
const g=[...Array(GH)].map(()=>new Uint8Array(GW).fill(1));
for(const r of Object.values(R))for(let y=r[1];y<r[1]+r[3];y++)for(let x=r[0];x<r[0]+r[2];x++)g[y][x]=0;
[[6,18],[9,18],[6,20],[9,20],[25,14],[28,14],[25,19],[28,19],[35,19],[37,19],[22,3],[26,3],[30,3]].forEach(([x,y])=>g[y][x]=1);
const wall=(x,y)=>x<0||y<0||x>=GW||y>=GH||g[y][x]===1,hit=(x,z)=>wall(Math.floor(x/C),Math.floor(z/C));
const free=(x,z,r)=>!(hit(x-r,z-r)||hit(x+r,z-r)||hit(x-r,z+r)||hit(x+r,z+r));
const step=(o,mx,mz,r)=>{if(free(o.x+mx,o.z,r))o.x+=mx;if(free(o.x,o.z+mz,r))o.z+=mz};
const los=(x0,z0,x1,z1)=>{const dx=x1-x0,dz=z1-z0,n=Math.ceil(Math.hypot(dx,dz)/.6);for(let i=1;i<n;i++)if(hit(x0+dx*i/n,z0+dz*i/n))return false;return true};
const mkTex=(base,rep,s)=>{const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.fillStyle=base;x.fillRect(0,0,256,256);for(let i=0;i<3000;i++){const v=Math.random()*255|0;x.fillStyle=`rgba(${v},${v},${v},.07)`;x.fillRect(Math.random()*256,Math.random()*256,rnd(1,5),rnd(1,5))}for(let i=0;i<7;i++){x.fillStyle='rgba(0,0,0,.14)';x.beginPath();x.arc(Math.random()*256,Math.random()*256,rnd(15,50),0,7);x.fill()}x.strokeStyle='rgba(0,0,0,.5)';x.lineWidth=3;for(let i=0;i<256;i+=s){x.beginPath();x.moveTo(i,0);x.lineTo(i,256);x.moveTo(0,i);x.lineTo(256,i);x.stroke()}const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(rep,rep);t.anisotropy=4;return t};
const inst=(geo,mat,list,y)=>{const m=new T.InstancedMesh(geo,mat,list.length),M=new T.Matrix4();list.forEach(([x,z],i)=>m.setMatrixAt(i,M.setPosition((x+.5)*C,y,(z+.5)*C)));m.receiveShadow=true;m.castShadow=y===WH/2;scene.add(m)};
{const W=[],F=[];for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){if(!g[y][x])F.push([x,y]);else{let n=0;for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)if(!wall(x+i,y+j))n=1;if(n)W.push([x,y])}}
inst(new T.BoxGeometry(C,WH,C),new T.MeshLambertMaterial({map:mkTex('#565c58',1,64)}),W,WH/2);
inst(new T.PlaneGeometry(C,C).rotateX(-Math.PI/2),new T.MeshLambertMaterial({map:mkTex('#3d3f3c',1,128)}),F,0);
inst(new T.PlaneGeometry(C,C).rotateX(Math.PI/2),new T.MeshLambertMaterial({map:mkTex('#2b2e2d',1,128)}),F,WH);}
const LT=[];['S','A','B','D','C','E'].forEach((k,i)=>{const r=R[k],l=new T.PointLight(k==='E'?0x70ff9a:i%2?0xffd9a0:0xa5c5ff,.55,26,1.6);l.position.set((r[0]+r[2]/2)*C,WH-.7,(r[1]+r[3]/2)*C);l.userData.b=l.intensity;scene.add(l);LT.push(l)});
// RF03/RF08: los hitos de inicio y de extracción son VISIBLES en el mundo 3D.
function worldSign(label,x,z,color,width=5){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#071510';ctx.fillRect(0,0,512,128);
 ctx.strokeStyle=color;ctx.lineWidth=10;ctx.strokeRect(7,7,498,114);
 ctx.font='800 43px system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
 ctx.fillStyle=color;ctx.fillText(label,256,64,490);
 const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;
 const sign=new T.Mesh(new T.PlaneGeometry(width,width/4),new T.MeshBasicMaterial({map:tex,side:T.DoubleSide}));
 sign.position.set(x,2.55,z);scene.add(sign);return sign;
}
worldSign('INICIO · SECTOR 04',5.5*C,33*C,'#f6d49a',6);
worldSign('ZONA DE EXTRACCIÓN',(R.E[0]+3)*C,(R.E[1]+3)*C,'#65ffb2',7);
const extractionMark=new T.Mesh(new T.CircleGeometry(3.7,48).rotateX(-Math.PI/2),
 new T.MeshBasicMaterial({color:0x3af5a1,transparent:true,opacity:.22,depthWrite:false,side:T.DoubleSide}));
extractionMark.position.set((R.E[0]+3)*C,.025,(R.E[1]+3)*C);scene.add(extractionMark);

// ===== PERSONAJE REAL DE MIXAMO: PARASITE L STARKIE =====
// Las cuatro animaciones se guardan como matrices transformadas a
// (traslación + cuaternión) para evitar deformación por interpolar matrices.
// No se usan la malla caricaturesca ni su deformación procedural.
const ZMETA=/*__ZOMBIE_META__*/;
const ZENC={
 model:'__ZOMBIE_GLB__', body:'__ZOMBIE_BODY__', detail:'__ZOMBIE_DETAIL__',
 walk:'__ZOMBIE_WALK__', idle:'__ZOMBIE_IDLE__',
 attack:'__ZOMBIE_ATTACK__', death:'__ZOMBIE_DEATH__'
};
function zDecode(s){const b=atob(s),out=new Uint8Array(b.length);for(let i=0;i<b.length;i++)out[i]=b.charCodeAt(i);return out;}
const ZBONES=ZMETA.nBones;
const ZCLIPS={};
for(const name of ['walk','idle','attack','death']){
 const bin=zDecode(ZENC[name]);
 ZCLIPS[name]={data:new Float32Array(bin.buffer),...ZMETA.animations[name]};
}
// Lectura local de glTF 2.0 binario. Los tres modelos se cargan desde GLB,
// aun cuando el juego se distribuye en un único HTML sin solicitudes externas.
function decodeGLB(encoded){
 const bytes=zDecode(encoded),dv=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 if(dv.getUint32(0,true)!==0x46546c67||dv.getUint32(4,true)!==2||dv.getUint32(8,true)!==bytes.length)throw Error('Archivo GLB inválido');
 let json=null,binStart=-1;
 for(let o=12;o<bytes.length;){
  const size=dv.getUint32(o,true),type=dv.getUint32(o+4,true);o+=8;
  if(o+size>bytes.length)throw Error('Chunk GLB fuera de rango');
  if(type===0x4e4f534a)json=JSON.parse(new TextDecoder().decode(bytes.subarray(o,o+size)));
  if(type===0x004e4942)binStart=o;
  o+=size;
 }
 if(!json||binStart<0||json.asset?.version!=='2.0')throw Error('GLB sin JSON/BIN válido');
 return {json,bytes,dv,binStart};
}
function glbAccessor(doc,id){
 const a=doc.json.accessors[id],bv=doc.json.bufferViews[a.bufferView];
 const dims={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16}[a.type];
 const cbytes={5121:1,5123:2,5125:4,5126:4}[a.componentType],
       getters={5121:'getUint8',5123:'getUint16',5125:'getUint32',5126:'getFloat32'};
 if(!dims||!cbytes)throw Error('Atributo GLB no soportado');
 const ctor={5121:Uint8Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array}[a.componentType];
 const result=new ctor(a.count*dims),stride=bv.byteStride||dims*cbytes;
 const base=doc.binStart+(bv.byteOffset||0)+(a.byteOffset||0);
 for(let i=0;i<a.count;i++)for(let k=0;k<dims;k++)result[i*dims+k]=doc.dv[getters[a.componentType]](base+i*stride+k*cbytes,cbytes===1?undefined:true);
 return result;
}
function glbMesh(encoded,skin){
 const doc=decodeGLB(encoded),prims=doc.json.meshes[0].primitives;
 const total=prims.reduce((n,p)=>n+doc.json.accessors[p.attributes.POSITION].count,0);
 const p=new Float32Array(total*3),normal=new Float32Array(total*3),uv=skin?new Float32Array(total*2):null;
 const joints=skin?new Uint8Array(total*4):null,weights=skin?new Uint8Array(total*4):null;
 const geometry=new T.BufferGeometry();let offset=0;
 for(const prim of prims){
  if(prim.mode!==4||prim.indices!==undefined)throw Error('GLB debe contener triángulos no indexados');
  const count=doc.json.accessors[prim.attributes.POSITION].count;
  p.set(glbAccessor(doc,prim.attributes.POSITION),offset*3);
  normal.set(glbAccessor(doc,prim.attributes.NORMAL),offset*3);
  if(skin){uv.set(glbAccessor(doc,prim.attributes.TEXCOORD_0),offset*2);
   joints.set(glbAccessor(doc,prim.attributes.JOINTS_0),offset*4);
   weights.set(glbAccessor(doc,prim.attributes.WEIGHTS_0),offset*4);}
  geometry.addGroup(offset,count,prim.material||0);offset+=count;
 }
 geometry.setAttribute('position',new T.BufferAttribute(p,3));
 geometry.setAttribute('normal',new T.BufferAttribute(normal,3));
 if(skin){geometry.setAttribute('uv',new T.BufferAttribute(uv,2));
  geometry.setAttribute('skinIndex',new T.Uint8BufferAttribute(joints,4,false));
  geometry.setAttribute('skinWeight',new T.Uint8BufferAttribute(weights,4,true));}
 geometry.computeBoundingSphere();
 return {geometry,materials:doc.json.materials};
}
function makeWeaponGLB(encoded){
 const model=glbMesh(encoded,false);
 const materials=model.materials.map(m=>{
  const fac=m.pbrMetallicRoughness?.baseColorFactor||[1,1,1,1];
  return new T.MeshLambertMaterial({color:new T.Color().setRGB(fac[0],fac[1],fac[2]),side:T.FrontSide});
 });
 const mesh=new T.Mesh(model.geometry,materials);mesh.name='Arma GLB';return mesh;
}
function zGeometry(){return glbMesh(ZENC.model,true).geometry;}

const ZGEO=zGeometry();
// SOMBRAS DE CONTACTO: tres capas proyectadas sobre el suelo, sin shadow-map
// de coste elevado para los 34+ enemigos con malla de esqueleto personalizada.
// El movimiento de cada sombra sigue las posiciones reales de los pies
// calculadas con las mismas matrices óseas que dibujan el modelo.
const ZSHADOW_GEO=new T.PlaneGeometry(1,1).rotateX(-Math.PI/2);
const ZSHADOW_TEXTURE=(()=>{
 const c=document.createElement('canvas');c.width=c.height=128;
 const ctx=c.getContext('2d');
 const g=ctx.createRadialGradient(64,64,3,64,64,64);
 g.addColorStop(0,'rgba(0,0,0,0.94)');
 g.addColorStop(.18,'rgba(0,0,0,0.84)');
 g.addColorStop(.40,'rgba(0,0,0,0.60)');
 g.addColorStop(.69,'rgba(0,0,0,0.22)');
 g.addColorStop(1,'rgba(0,0,0,0)');
 ctx.fillStyle=g;ctx.fillRect(0,0,128,128);
 const t=new T.CanvasTexture(c);t.minFilter=T.LinearFilter;t.magFilter=T.LinearFilter;
 t.wrapS=t.wrapT=T.ClampToEdgeWrapping;return t;
})();
// Índices de vértices reales del modelo Parasite L Starkie. Comprobados contra
// sus huesos 61/62 y 66/67 (talón + punta de ambos pies), y torso.
const ZANCHOR_IDS={leftHeel:8295,leftToe:8453,rightHeel:22674,rightToe:22831,torso:29556};
const ZANCHORS={};
for(const [name,i] of Object.entries(ZANCHOR_IDS)){
 const a=ZGEO.attributes;
 ZANCHORS[name]={p:[a.position.getX(i),a.position.getY(i),a.position.getZ(i)],
  j:[a.skinIndex.getX(i),a.skinIndex.getY(i),a.skinIndex.getZ(i),a.skinIndex.getW(i)],
  w:[a.skinWeight.getX(i),a.skinWeight.getY(i),a.skinWeight.getZ(i),a.skinWeight.getW(i)]};
}
function zSkinnedPoint(z,anchor){
 const b=z.palette.image.data,p=anchor.p,j=anchor.j,w=anchor.w;
 let x=0,y=0,v=0;
 for(let k=0;k<4;k++){
  if(w[k]<.0001)continue;
  const i=j[k]*16,t=w[k];
  x+=t*(b[i]*p[0]+b[i+4]*p[1]+b[i+8]*p[2]+b[i+12]);
  y+=t*(b[i+1]*p[0]+b[i+5]*p[1]+b[i+9]*p[2]+b[i+13]);
  v+=t*(b[i+2]*p[0]+b[i+6]*p[1]+b[i+10]*p[2]+b[i+14]);
 }
 return {x,y,z:v};
}
function zShadowPart(opacity,width,length){
 const material=new T.MeshBasicMaterial({map:ZSHADOW_TEXTURE,color:0x000000,
  transparent:true,depthTest:true,depthWrite:false,opacity,side:T.DoubleSide,
  polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
 const mesh=new T.Mesh(ZSHADOW_GEO,material);
 mesh.scale.set(width,1,length);mesh.renderOrder=1;
 return mesh;
}
function zMakeShadows(x,z,scale){
 const group=new T.Group();group.position.set(x,0,z);scene.add(group);
 const ambient=zShadowPart(.18,2.7*scale,2.8*scale);
 const core=zShadowPart(.53,1.52*scale,1.85*scale);
 const left=zShadowPart(.72,.50*scale,.64*scale);
 const right=zShadowPart(.72,.50*scale,.64*scale);
 ambient.position.y=.011;core.position.y=.015;
 left.position.y=right.position.y=.021;
 group.add(ambient,core,left,right);
 return {group,ambient,core,left,right,baseScale:scale};
}
function zFloorSample(z){
 const name=z.motion,arr=ZMETA.groundY[name],clip=ZCLIPS[name];
 const duration=z.clock*zRate(z,name);
 const t=name==='death'?Math.min(clip.frames-1,duration*clip.fps):
  (((duration%clip.duration)+clip.duration)%clip.duration)*clip.fps;
 const i=Math.min(clip.frames-1,Math.floor(t));
 const j=Math.min(clip.frames-1,i+1),a=Math.max(0,Math.min(1,t-i));
 return arr[i]*(1-a)+arr[j]*a;
}
function zUpdateGroundAndShadows(z){
 const scale=z.visualScale;
 // Mínimo real de la malla animada: alinear calzado/cuerpo con suelo y=0.
 const minY=zFloorSample(z);
 const above=Math.max(0,.007-minY)*scale;
 const sink=z.dead?Math.max(0,z.dd-10)*.4:0;
 z.g.position.y=above-sink;
 z.shadow.group.visible=z.g.visible;
 if(!z.g.visible)return;
 const a=zSkinnedPoint(z,ZANCHORS.leftHeel),b=zSkinnedPoint(z,ZANCHORS.leftToe);
 const c=zSkinnedPoint(z,ZANCHORS.rightHeel),d=zSkinnedPoint(z,ZANCHORS.rightToe);
 const chest=zSkinnedPoint(z,ZANCHORS.torso);
 const sh=z.shadow;
 sh.group.position.set(z.x,0,z.z);sh.group.rotation.y=z.g.rotation.y;
 const fade=z.dead?Math.max(0,1-Math.max(0,z.dd-10)/5):1;
 const fallen=z.dead?Math.min(1,z.clock/ZCLIPS.death.duration):0;
 sh.core.position.set(chest.x*scale,.015,chest.z*scale);
 sh.ambient.position.set(chest.x*scale+.25*scale,.011,chest.z*scale-.17*scale);
 sh.core.scale.set((1.52+fallen*.28)*scale,1,(1.85+fallen*1.5)*scale);
 sh.ambient.scale.set((2.7+fallen*.4)*scale,1,(2.8+fallen*1.3)*scale);
 sh.core.material.opacity=(.53+fallen*.05)*fade;
 sh.ambient.material.opacity=.18*fade;
 for(const [patch,heel,toe] of [[sh.left,a,b],[sh.right,c,d]]){
  const footX=(heel.x+toe.x)*.5,footY=Math.min(heel.y,toe.y),footZ=(heel.z+toe.z)*.5;
  patch.position.set(footX*scale,.021,footZ*scale);
  // El contacto se oscurece solo cuando el pie realmente toca el suelo.
  const lift=Math.max(0,footY*scale+above);
  const contact=1-Math.min(1,Math.max(0,(lift-.008)/.16));
  patch.material.opacity=.78*contact*(1-fallen)*fade;
 }
}

const zTextureLoader=new T.TextureLoader();
function zTexture(encoded){
 const tex=zTextureLoader.load('data:image/webp;base64,'+encoded,()=>{});
 tex.flipY=true;
 if('colorSpace' in tex&&T.SRGBColorSpace)tex.colorSpace=T.SRGBColorSpace;
 tex.wrapS=tex.wrapT=T.RepeatWrapping;
 tex.minFilter=T.LinearMipmapLinearFilter;
 tex.magFilter=T.LinearFilter;
 tex.anisotropy=Math.min(4,ren.capabilities.getMaxAnisotropy());
 return tex;
}
const ZTEX=[zTexture(ZENC.body),zTexture(ZENC.detail)];
const ZVERT=`precision highp float;
precision highp sampler2D;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform sampler2D uBones;
in vec3 position;
in vec3 normal;
in vec2 uv;
in vec4 skinIndex;
in vec4 skinWeight;
out vec3 vWorld;
out vec3 vNormal;
out vec2 vUV;
mat4 zBone(int i){return mat4(
 texelFetch(uBones,ivec2(0,i),0),texelFetch(uBones,ivec2(1,i),0),
 texelFetch(uBones,ivec2(2,i),0),texelFetch(uBones,ivec2(3,i),0));}
void main(){
 mat4 a=zBone(int(skinIndex.x));mat4 b=zBone(int(skinIndex.y));
 mat4 c=zBone(int(skinIndex.z));mat4 d=zBone(int(skinIndex.w));
 vec4 pos=vec4(position,1.);
 vec4 local=(a*pos)*skinWeight.x+(b*pos)*skinWeight.y+
            (c*pos)*skinWeight.z+(d*pos)*skinWeight.w;
 vec3 nor=(mat3(a)*normal)*skinWeight.x+(mat3(b)*normal)*skinWeight.y+
          (mat3(c)*normal)*skinWeight.z+(mat3(d)*normal)*skinWeight.w;
 vec4 w=modelMatrix*local;
 vWorld=w.xyz;
 vNormal=normalize(mat3(modelMatrix)*nor);
 vUV=uv;
 gl_Position=projectionMatrix*viewMatrix*w;
}`;
const ZFRAG=`precision highp float;
precision highp sampler2D;
in vec3 vWorld;
in vec3 vNormal;
in vec2 vUV;
uniform sampler2D uDiffuse;
uniform vec3 uEye;
uniform vec3 uForward;
uniform vec3 uTint;
uniform float uHurt;
out vec4 fragColor;
void main(){
 vec4 texel=texture(uDiffuse,vUV);
 if(texel.a<.25)discard;
 vec3 n=normalize(vNormal);
 vec3 dir=normalize(vec3(-.42,.83,.32));
 float l=max(dot(n,dir),0.);
 vec3 toPixel=vWorld-uEye;
 float dist=length(toPixel);
 vec3 ray=normalize(toPixel);
 float cone=smoothstep(.90,.985,dot(ray,normalize(uForward)));
 float torch=cone*(1.-smoothstep(3.,34.,dist));
 float front=max(dot(n,-ray),0.);
 float lighting=.15+.22*l+torch*(.65+1.5*front);
 vec3 col=texel.rgb*uTint*lighting;
 col+=vec3(.032,.047,.052)*max(dot(n,normalize(vec3(.5,.6,-.2))),0.);
 col=mix(col,col*vec3(1.3,.31,.28),clamp(uHurt,0.,1.));
 float fog=1.-exp(-.05*dist);
 col=mix(col,vec3(.012,.020,.023),clamp(fog,0.,.94));
 fragColor=vec4(max(col,vec3(0.)),1.);
}`;
const ZFRONT=new T.Vector3(0,0,-1);
function makeZMaterial(tex,pal,tint){return new T.RawShaderMaterial({
 glslVersion:T.GLSL3,
 vertexShader:ZVERT,fragmentShader:ZFRAG,
 uniforms:{uBones:{value:pal},uDiffuse:{value:tex},uEye:{value:cam.position},
  uForward:{value:ZFRONT},uTint:{value:tint},uHurt:{value:0}},
 side:T.FrontSide,depthTest:true,depthWrite:true
});}
function makeZDepth(pal){const m=new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking});m.customProgramCacheKey=()=>'zdepth';
 m.onBeforeCompile=sh=>{sh.uniforms.uBones={value:pal};
  sh.vertexShader=sh.vertexShader.replace('#include <common>',`#include <common>
precision highp sampler2D;
uniform sampler2D uBones;
attribute vec4 skinIndex;
attribute vec4 skinWeight;
mat4 zBone(int i){return mat4(texelFetch(uBones,ivec2(0,i),0),texelFetch(uBones,ivec2(1,i),0),texelFetch(uBones,ivec2(2,i),0),texelFetch(uBones,ivec2(3,i),0));}`)
  .replace('#include <begin_vertex>',`vec4 zp=vec4(position,1.);
vec3 transformed=((zBone(int(skinIndex.x))*zp)*skinWeight.x+(zBone(int(skinIndex.y))*zp)*skinWeight.y+(zBone(int(skinIndex.z))*zp)*skinWeight.z+(zBone(int(skinIndex.w))*zp)*skinWeight.w).xyz;`);};
 return m}
// RF07: TODAS las variantes requieren exactamente DOS impactos válidos.
const KIND=[
 {hp:2,sp:1.0,s:.63,tint:0xffffff,dmg:0,rg:1.15,cd:.95},
 {hp:2,sp:1.6,s:.6,tint:0xc6ffb4,dmg:0,rg:1.1,cd:.75},
 {hp:2,sp:1.5,s:1.05,tint:0xff9478,dmg:0,rg:2.3,cd:1.7}
];
const DETECTION_RANGE=13; // RF05: radio de activación configurable en metros.
const Zs=[],turn=(c,t,k)=>c+(((t-c+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI)*k;
function zState(z,wanted){
 if(z.motion===wanted)return;
 z.prevMotion=z.motion;
 z.prevClock=z.clock;
 z.motion=wanted;
 z.clock=0;
 z.fade=0;
}
function zRate(z,m){
 if(m==='attack')return ZCLIPS.attack.duration/z.d.cd;
 if(m==='walk')return z.wr;
 return 1;
}
// Interpola posiciones linealmente y rotaciones con nlerp de cuaterniones
// en el mismo hemisferio. Nunca mezcla directamente matrices de rotación.
function zSample(name,sec,loop,out){
 const clip=ZCLIPS[name],dur=clip.duration;
 const t=loop?((sec%dur)+dur)%dur:Math.min(Math.max(0,sec),dur);
 const frame=Math.min((clip.frames-1),t*clip.fps),f0=Math.floor(frame);
 const f1=Math.min(clip.frames-1,f0+1),a=frame-f0;
 const src=clip.data,base0=f0*ZBONES*7,base1=f1*ZBONES*7;
 for(let i=0;i<ZBONES;i++){
  const k=i*7,s=base0+k,q=base1+k,b=1-a;
  out[k]=src[s]*b+src[q]*a;
  out[k+1]=src[s+1]*b+src[q+1]*a;
  out[k+2]=src[s+2]*b+src[q+2]*a;
  const dot=src[s+3]*src[q+3]+src[s+4]*src[q+4]+src[s+5]*src[q+5]+src[s+6]*src[q+6];
  const sign=dot<0?-1:1;
  let x=src[s+3]*b+src[q+3]*sign*a;
  let y=src[s+4]*b+src[q+4]*sign*a;
  let z=src[s+5]*b+src[q+5]*sign*a;
  let w=src[s+6]*b+src[q+6]*sign*a;
  const norm=1/(Math.hypot(x,y,z,w)||1);
  out[k+3]=x*norm;out[k+4]=y*norm;out[k+5]=z*norm;out[k+6]=w*norm;
 }
}
const ZPOSEA=new Float32Array(ZBONES*7),ZPOSEB=new Float32Array(ZBONES*7);
function zBonePalette(z){
 const name=z.motion;
 const time=z.clock*zRate(z,name);
 zSample(name,time,name!=='death',ZPOSEA);
 let blend=0;
 if(z.fade<1&&z.prevMotion){
  blend=1-z.fade;
  zSample(z.prevMotion,z.prevClock*zRate(z,z.prevMotion),true,ZPOSEB);
 }
 const dst=z.palette.image.data;
 for(let i=0;i<ZBONES;i++){
  const k=i*7,o=i*16;
  let px=ZPOSEA[k],py=ZPOSEA[k+1],pz=ZPOSEA[k+2];
  let x=ZPOSEA[k+3],y=ZPOSEA[k+4],zz=ZPOSEA[k+5],w=ZPOSEA[k+6];
  if(blend){
   px=px*(1-blend)+ZPOSEB[k]*blend;
   py=py*(1-blend)+ZPOSEB[k+1]*blend;
   pz=pz*(1-blend)+ZPOSEB[k+2]*blend;
   const sign=(x*ZPOSEB[k+3]+y*ZPOSEB[k+4]+zz*ZPOSEB[k+5]+w*ZPOSEB[k+6])<0?-1:1;
   x=x*(1-blend)+ZPOSEB[k+3]*blend*sign;
   y=y*(1-blend)+ZPOSEB[k+4]*blend*sign;
   zz=zz*(1-blend)+ZPOSEB[k+5]*blend*sign;
   w=w*(1-blend)+ZPOSEB[k+6]*blend*sign;
   const norm=1/(Math.hypot(x,y,zz,w)||1);x*=norm;y*=norm;zz*=norm;w*=norm;
  }
  const x2=x+x,y2=y+y,z2=zz+zz;
  const xx=x*x2,xy=x*y2,xz=x*z2,yy=y*y2,yz=y*z2,zz2=zz*z2;
  const wx=w*x2,wy=w*y2,wz=w*z2;
  dst[o]=1-(yy+zz2); dst[o+1]=xy+wz; dst[o+2]=xz-wy; dst[o+3]=0;
  dst[o+4]=xy-wz; dst[o+5]=1-(xx+zz2); dst[o+6]=yz+wx; dst[o+7]=0;
  dst[o+8]=xz+wy; dst[o+9]=yz-wx; dst[o+10]=1-(xx+yy); dst[o+11]=0;
  dst[o+12]=px; dst[o+13]=py; dst[o+14]=pz; dst[o+15]=1;
 }
 z.palette.needsUpdate=true;
}
function zAnimate(z,dt,desired){
 zState(z,desired);
 z.clock+=dt;
 if(z.fade<1){z.fade=Math.min(1,z.fade+dt*5.5);z.prevClock+=dt;}
 // No subir texturas de esqueletos que estén lejos de la cámara.
 const d=Math.hypot(z.x-P.x,z.z-P.z);
 z.g.visible=d<78;z.m.castShadow=d<30;
 if(z.g.visible)zBonePalette(z);
}
function spawn(x,z,k,chase){
 const d=KIND[k],s=d.s/.63*.92;
 const bin=new Float32Array(ZBONES*16);
 const palette=new T.DataTexture(bin,4,ZBONES,T.RGBAFormat,T.FloatType);
 palette.magFilter=palette.minFilter=T.NearestFilter;
 palette.wrapS=palette.wrapT=T.ClampToEdgeWrapping;
 palette.generateMipmaps=false;
 const tint=new T.Color(d.tint);
 const materials=ZTEX.map(tex=>makeZMaterial(tex,palette,tint));
 const m=new T.Mesh(ZGEO,materials),gr=new T.Group();
 m.scale.setScalar(s);m.frustumCulled=false;m.castShadow=true;m.customDepthMaterial=makeZDepth(palette);
 gr.add(m);gr.position.set(x,0,z);gr.rotation.y=rnd(0,6.28);scene.add(gr);
 const shadow=zMakeShadows(x,z,s);
 const o={g:gr,m,materials,palette,shadow,visualScale:s,x,z,k,d,H:2.02*s,hp:d.hp,st:0,t:rnd(0,9),ph:rnd(0,6),atk:rnd(0,.5),sw:0,stun:0,
 dead:0,dd:0,wd:rnd(0,6.28),sp:d.sp*rnd(.9,1.15),al:rnd(.2,1),stride:0,wr:1,v:0,dx:0,dz:1,
 motion:'idle',prevMotion:'idle',clock:rnd(0,2),prevClock:0,fade:1,attackActive:0,attackHit:0};
 Zs.push(o);zBonePalette(o);zUpdateGroundAndShadows(o);return o;
}
// ===== FIN RIG Y ANIMACIÓN MIXAMO =====

// ---------- jugador, armas
const P={x:5.5*C,z:35*C,y:0,vy:0,yaw:0,pitch:0,hp:100,rl:0,slow:0,dead:0,dd:0,bob:0};
const Wp=[{n:'FUSIL',rate:.095,pel:1,spr:.011,mag:30,a:30,res:150,rl:1.5},{n:'ESCOPETA',rate:.85,pel:9,spr:.065,mag:8,a:8,res:32,rl:2.1}];let cur=0,fcd=0,kick=0,flash=0,sv=0,kills=0,hs=0,tm=0,playing=0,over=0;
const bx=(w,h,l,c,x,y,z)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,l),new T.MeshLambertMaterial({color:c}));m.position.set(x,y,z);return m};
const MT=(c,e)=>new T.MeshLambertMaterial({color:c,emissive:e||0x0c0c0c}),MM={gun:MT(0x25282b),gun2:MT(0x353b40),met:MT(0x111214),poly:MT(0x1b1c1d),wood:MT(0x5e3b21,0x140a05),skin:MT(0xc08f70,0x1c100a),sl:MT(0x2f3d2a),red:MT(0xb02a20,0x350808)};
const b2=(w,h,l,m,x,y,z)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,l),MM[m]);o.position.set(x,y,z);return o},cy=(r,l,m,x,y,z)=>{const o=new T.Mesh(new T.CylinderGeometry(r,r,l,12),MM[m]);o.rotation.x=Math.PI/2;o.position.set(x,y,z);return o},gp=(...a)=>{const q=new T.Group();q.add(...a);return q};
const magG=gp(b2(.04,.15,.075,'met',0,-.1,-.05),b2(.044,.03,.08,'gun2',0,-.18,-.05)),boltG=gp(b2(.018,.02,.06,'met',.036,.02,.02)),leftG=gp(b2(.075,.075,.13,'skin',0,-.045,-.3),b2(.08,.08,.34,'sl',-.02,-.08,-.12));
// RF01: fusil cargado desde un archivo GLB real, con piezas de recarga independientes.
const rifle=gp(makeWeaponGLB('__RIFLE_GLB__'),b2(.065,.07,.09,'skin',0,-.1,.1),b2(.075,.075,.3,'sl',.03,-.15,.27),magG,boltG,leftG);
const pumpG=gp(b2(.07,.055,.2,'wood',0,-.03,-.3),b2(.075,.075,.12,'skin',0,-.07,-.3),b2(.085,.085,.3,'sl',-.02,-.1,-.12)),loadG=gp(b2(.07,.07,.09,'skin',0,0,0),b2(.025,.025,.07,'red',0,.05,0));loadG.visible=false;
// RF01: escopeta cargada desde su propio GLB, con corredera/cartuchos animados.
const shot=gp(makeWeaponGLB('__ESCOPETA_GLB__'),b2(.065,.07,.09,'skin',0,-.1,.1),b2(.075,.075,.3,'sl',.03,-.15,.27),pumpG,loadG);
const vm=new T.Group(),VW=[rifle,shot];let swp=0;vm.add(rifle,shot);vm.position.set(.22,-.22,-.46);cam.add(vm);const setW=i=>{cur=i;P.rl=0;swp=1;VW.forEach((v,j)=>v.visible=j===i)};setW(0);
const sm=(a,b,p)=>{const x=Math.min(1,Math.max(0,(p-a)/(b-a)));return x*x*(3-2*x)};let pv=0;
function animVM(dt,mvs){const w=Wp[cur],p=P.rl>0?1-P.rl/w.rl:0,mvk=Math.min(1,mvs/4);swp=Math.max(0,swp-dt*4);const shv=sv>0?Math.sin(sv/.7*Math.PI):0;
let rx=kick*.06+shv*.45,rz=0,px=Math.cos(P.bob*.5)*.008*mvk,py=-swp*.3-Math.abs(Math.sin(P.bob*.5))*.006*mvk+Math.sin(tm*1.7)*.003,pz=kick*.07-shv*.1;
const t=sm(0,.12,p)-sm(.85,1,p);
if(cur===0){const toMag=sm(.08,.25,p)-sm(.72,.88,p),pull=sm(.3,.42,p)-sm(.56,.72,p);
 rz=-.5*t;rx+=.18*t;px-=.05*t;py-=.05*t;leftG.position.set(0,-.04*toMag-.12*pull,.3*toMag);magG.position.y=-.25*pull;magG.visible=!(p>.42&&p<.56);boltG.position.z=p>0?(sm(.86,.92,p)-sm(.92,.98,p))*.07:kick*.03}
else{const ph=(p-.12)/.72*4%1,u=ph<.6?ph/.6:1-(ph-.6)/.4,on=p>.12&&p<.84;rz=-.35*t;rx+=.3*t;px-=.03*t;
 loadG.visible=on;if(on){loadG.position.set(.12-.1*u,-.22+.15*u,.16-.1*u);loadG.children[1].visible=ph<.6}
 pumpG.position.z=p>0?Math.sin(Math.PI*sm(.86,.97,p))*.13:fcd>0?Math.sin(Math.PI*sm(.3,.8,1-fcd/w.rate))*.13:0}
if(p>pv){if(cur===0){[.34,.62,.9].forEach(k=>{if(pv<k&&p>=k)tone(k<.5?260:k<.8?420:700,.06,'square',.12,.5)})}else{const a=Math.floor((pv-.12)/.18),b=Math.floor((p-.12)/.18);if(p<.84&&b>a&&b>=0)tone(520,.05,'square',.1,.6);if(pv<.9&&p>=.9)tone(240,.1,'square',.15,.4)}}pv=p;
vm.position.set(.22+px,-.22+py,-.46+pz);vm.rotation.set(rx,0,rz)}
const PP=[],pgm=new T.BoxGeometry(.07,.07,.07),pmt=new T.MeshBasicMaterial({color:0x7d0a0a});let pi=0;for(let i=0;i<90;i++){const m=new T.Mesh(pgm,pmt);m.visible=false;scene.add(m);PP.push({m,v:new T.Vector3(),l:0})}
const emit=(x,y,z,n,s)=>{for(let i=0;i<n;i++){const p=PP[pi++%PP.length];p.m.position.set(x,y,z);p.v.set(rnd(-s,s),rnd(0,s),rnd(-s,s));p.l=rnd(.3,.8);p.m.visible=true}};
const keys={},msgEl=$('#ms');let mt=0;const msg=t=>{msgEl.textContent=t;msgEl.style.opacity=1;clearTimeout(mt);mt=setTimeout(()=>msgEl.style.opacity=0,2800)};
// RF09: el CONTACTO físico, no la pérdida gradual de puntos, termina la partida.
function caught(){if(P.dead||over)return;P.hp=0;P.dead=1;$('#dm').style.opacity=1;tone(180,.15,'square',.18,.5);finish('GAME OVER','Un zombi te ha atrapado.');}
function killZ(z,head){z.dead=1;z.attackActive=0;z.sw=0;zState(z,'death');z.clock=0;kills++;if(head)hs++;z.g.position.y=0;tone(90,.4,'sawtooth',.1,.4);if(z.k===2)msg('TANK ABATIDO')}
function hurtZ(z,head,px,py,pz){if(z.dead)return;z.hp-=1;emit(px,py,pz,6,2.5);if(z.st===0)z.st=1;z.stun=Math.max(z.stun,.18);if(z.hp===0)killZ(z,head);}
function alertNear(x,z,r){for(const o of Zs)if(!o.dead&&o.st===0&&Math.hypot(o.x-x,o.z-z)<Math.min(r,DETECTION_RANGE))o.st=1;}
const wallDist=(ox,oz,dx,dz,mx)=>{for(let t=.2;t<mx;t+=.2)if(hit(ox+dx*t,oz+dz*t))return t;return mx};
function ray(ox,oy,oz,dx,dy,dz,mx){let best=mx,hz=null,head=0;for(const z of Zs){if(z.dead)continue;const H=z.H;for(const[y,r,h]of[[.9*H,.15*H,1],[.62*H,.19*H,0],[.35*H,.2*H,0]]){const cx=z.x-ox,cy=y-oy,cz=z.z-oz,t=cx*dx+cy*dy+cz*dz;if(t<0||t>best)continue;const d2=cx*cx+cy*cy+cz*cz-t*t;if(d2<r*r){const th=t-Math.sqrt(r*r-d2);if(th<best){best=th;hz=z;head=h}}}}return{t:best,z:hz,head}}
// RF01/RF07: UNA pulsación = UN disparo. Una ráfaga de perdigones puede
// tocar varios zombis, pero solo descuenta UN punto a cada uno por clic.
function fire(){
 const w=Wp[cur];if(P.rl>0||P.dead||over)return;
 if(w.a<=0){reload();return}
 w.a--;fcd=w.rate;kick=1;flash=.05;
 nz(cur?.25:.14,cur?.7:.45,cur?1800:3200);tone(cur?90:130,.12,'square',.25,.3);
 alertNear(P.x,P.z,DETECTION_RANGE);
 const fx=-Math.sin(P.yaw)*Math.cos(P.pitch),fy=Math.sin(P.pitch),fz=-Math.cos(P.yaw)*Math.cos(P.pitch),
       rx=Math.cos(P.yaw),rz=-Math.sin(P.yaw),ey=1.65+P.y;
 const targets=new Map();
 for(let i=0;i<w.pel;i++){
  const a=rnd(-1,1)*w.spr,b=rnd(-1,1)*w.spr;
  let dx=fx+rx*a,dy=fy+b,dz=fz+rz*a;
  const l=Math.hypot(dx,dy,dz);dx/=l;dy/=l;dz/=l;
  const h=Math.hypot(dx,dz);
  const wallMax=wallDist(P.x,P.z,h>0?dx/h:0,h>0?dz/h:0,90)/(h||1);
  const r=ray(P.x,ey,P.z,dx,dy,dz,Math.min(90,wallMax));
  if(!r.z)continue;
  const old=targets.get(r.z);
  if(!old||(!old.head&&r.head))targets.set(r.z,{head:r.head,x:P.x+dx*r.t,y:ey+dy*r.t,z:P.z+dz*r.t});
 }
 for(const [z,h] of targets){hurtZ(z,h.head,h.x,h.y,h.z);}
 if(targets.size){$('#cr').style.background=[...targets.values()].some(t=>t.head)?'#f33':'#fb6';setTimeout(()=>$('#cr').style.background='#fff9',90)}
 if(!w.a)reload();
}
function reload(){const w=Wp[cur];if(P.rl>0||w.a>=w.mag||w.res<=0)return;P.rl=w.rl;tone(300,.08,'square',.1,.6)}
function shove(){if(sv>0||P.dead)return;sv=.7;nz(.1,.2,900);for(const z of Zs){if(z.dead)continue;const dx=z.x-P.x,dz=z.z-P.z,l=Math.hypot(dx,dz);if(l<2.5&&(-Math.sin(P.yaw)*dx-Math.cos(P.yaw)*dz)/l>.3){const k=z.k===2?.15:2.2;step(z,dx/l*k,dz/l*k,.3);z.stun=z.k===2?.35:1.2;z.st=1}}}
// ---------- campo de flujo (camino mínimo hasta el jugador) y director
const dist=new Int16Array(GW*GH),N4=[[1,0],[-1,0],[0,1],[0,-1]];
function flow(){dist.fill(-1);const q=[Math.floor(P.z/C)*GW+Math.floor(P.x/C)];dist[q[0]]=0;for(let h=0;h<q.length;h++){const c=q[h],x=c%GW,y=c/GW|0;for(const[a,b]of N4){const nx=x+a,ny=y+b;if(!wall(nx,ny)&&dist[ny*GW+nx]<0){dist[ny*GW+nx]=dist[c]+1;q.push(ny*GW+nx)}}}}
function mob(n,rr){flow();const c=[];for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const d=dist[y*GW+x];if(d>=3&&d<=8&&!los((x+.5)*C,(y+.5)*C,P.x,P.z))c.push([x,y])}if(!c.length)return;for(let i=0;i<n;i++){const[x,y]=c[Math.random()*c.length|0];spawn((x+rnd(.15,.85))*C,(y+rnd(.15,.85))*C,Math.random()<rr?1:0,true)}}
const grp=(r,n)=>{for(let i=0;i<n;i++){let x,y,k=0;do{x=r[0]+(Math.random()*r[2]|0);y=r[1]+(Math.random()*r[3]|0)}while(g[y][x]&&++k<60);spawn((x+rnd(.2,.8))*C,(y+rnd(.2,.8))*C,Math.random()<.12?1:0,false)}};
grp(R.A,7);grp(R.c2,2);grp(R.B,5);grp(R.D,7);grp(R.C,6);grp(R.c5,2);
const PK=[],pkAdd=(t,x,y)=>{const m=bx(.4,.4,.4,t==='h'?0x45aadb:0xc8b030,0,0,0);if(t==='h')m.add(bx(.44,.12,.44,0x00ffee,0,0,0));m.position.set((x+.5)*C,.5,(y+.5)*C);scene.add(m);PK.push({m,t,x:m.position.x,z:m.position.z})};
[['h',3,35],['a',7,33],['a',4,18],['h',12,20],['a',20,18],['h',24,21],['a',29,12],['a',33,21],['h',38,18],['a',38,8],['h',20,4],['a',31,3],['h',36,3]].forEach(a=>pkAdd(...a));
const inR=(r,x,z)=>{const cx=x/C,cy=z/C;return cx>=r[0]&&cx<r[0]+r[2]&&cy>=r[1]&&cy<r[1]+r[3]};
let stage=0,nextMob=45,ft2=0,gt=0,obT=0;
const TR=[[R.B,()=>{msg('¡ALARMA! ¡HORDA!');mob(26,.25);stage=1}],[R.C,()=>{msg('¡TANK!');spawn((R.C[0]+1.5)*C,(R.C[1]+2.5)*C,2,true);mob(8,.4);stage=2}]],fired=[0,0];
function finish(t,p){over=1;playing=0;document.exitPointerLock&&document.exitPointerLock();const s=tm|0;$('#ot').textContent=t;$('#op').innerHTML=`${p}<br><br>Infectados abatidos: <b>${kills}</b> · Disparos a la cabeza: <b>${hs}</b> · Tiempo: <b>${s/60|0}:${String(s%60).padStart(2,'0')}</b>`;$('#go').textContent='REINTENTAR';$('#go').onclick=()=>location.reload();$('#ov').style.display='flex'}
// ---------- bucle de actualización
function update(dt){tm+=dt;fcd-=dt;sv-=dt;kick=Math.max(0,kick-dt*9);flash-=dt;P.slow-=dt;
if(P.rl>0){P.rl-=dt;if(P.rl<=0){const w=Wp[cur],n=Math.min(w.mag-w.a,w.res);w.a+=n;w.res-=n}}
// No existe disparo automático: mantener pulsado el mouse no llama a fire().
const fw=(keys.KeyW?1:0)-(keys.KeyS?1:0),sd=(keys.KeyD?1:0)-(keys.KeyA?1:0);let mx=-Math.sin(P.yaw)*fw+Math.cos(P.yaw)*sd,mz=-Math.cos(P.yaw)*fw-Math.sin(P.yaw)*sd;const ml2=Math.hypot(mx,mz);if(ml2>1){mx/=ml2;mz/=ml2}
const sp=(keys.ShiftLeft?5.4:3.8)*(P.slow>0?.45:1);step(P,mx*sp*dt,mz*sp*dt,.3);P.bob+=ml2*sp*dt*1.7;
if(keys.Space&&P.y===0)P.vy=6;if(P.y>0||P.vy>0){P.vy-=18*dt;P.y+=P.vy*dt;if(P.y<=0){P.y=0;P.vy=0}}
ft2-=dt;if(ft2<=0){ft2=.3;flow()}
let ch=0;for(let i=Zs.length-1;i>=0;i--){const z=Zs[i];if(z.dead){z.dd+=dt;zAnimate(z,dt,'death');zUpdateGroundAndShadows(z);
 if(z.dd>15){scene.remove(z.g);scene.remove(z.shadow.group);
  for(const mt of z.materials)mt.dispose();z.m.customDepthMaterial.dispose();
  for(const part of [z.shadow.ambient,z.shadow.core,z.shadow.left,z.shadow.right])part.material.dispose();
  z.palette.dispose();Zs.splice(i,1)}continue}
z.t+=dt;z.stun=Math.max(0,z.stun-dt);z.atk-=dt;const dx=P.x-z.x,dz=P.z-z.z,d=Math.hypot(dx,dz);
// Radio físico ajustado al tamaño del modelo, independiente del alcance de ataque.
if(d<.44+.40*z.visualScale&&P.y<1.2){caught();return;}
let mv=0,tx=0,tz=0,spd=0;
if(z.st===0){if(d<DETECTION_RANGE&&(d<4||los(z.x,z.z,P.x,P.z)))z.st=1;} // Estado inactivo: inmóvil, sin patrulla ni persecución.
else{ch++;if(z.stun>0){}else if(d<z.d.rg&&P.y<1.2){tx=dx/d;tz=dz/d;z.g.rotation.y=turn(z.g.rotation.y,Math.atan2(dx,dz),.3);if(z.atk<=0){z.atk=z.d.cd;z.sw=z.d.cd*.42;z.attackActive=1;z.attackHit=0}}
else{let gx=dx,gz=dz;if(!los(z.x,z.z,P.x,P.z)){const cx=Math.floor(z.x/C),cy=Math.floor(z.z/C);let b=dist[cy*GW+cx],bx2=cx,by=cy;if(b<0)b=999;for(const[a,c2]of N4){const v=dist[(cy+c2)*GW+cx+a];if(!wall(cx+a,cy+c2)&&v>=0&&v<b){b=v;bx2=cx+a;by=cy+c2}}gx=(bx2+.5)*C-z.x;gz=(by+.5)*C-z.z}const l=Math.hypot(gx,gz)||1;tx=gx/l;tz=gz/l;spd=z.sp;mv=1}}
if(z.attackActive&&d>z.d.rg*1.7){z.attackActive=0;z.sw=0;}if(z.atk<=0)z.attackActive=0;
if(z.sw>0)z.sw-=dt; // Impacto por distancia prohibido: solo el CONTACTO provoca Game Over.
if(mv){for(const o of Zs)if(o!==z&&!o.dead){const ax=z.x-o.x,az=z.z-o.z,dd=ax*ax+az*az;if(dd<.7&&dd>1e-4){const q=Math.sqrt(dd);tx+=ax/q*.5;tz+=az/q*.5}}
const l2=Math.hypot(tx,tz)||1;z.dx=tx/l2;z.dz=tz/l2;z.g.rotation.y=turn(z.g.rotation.y,Math.atan2(tx,tz),Math.min(1,dt*7))}
 z.v+=((mv?spd:0)-z.v)*Math.min(1,dt*(mv?4:8));if(z.v<.03)z.v=0;if(z.v>0)step(z,z.dx*z.v*dt,z.dz*z.v*dt,.32*z.d.s/.63);
z.wr=Math.min(6,Math.max(.7,z.v/(.33*z.visualScale)));z.g.position.x=z.x;z.g.position.z=z.z;
// Sin rebote vertical artificial: el apoyo lo determina la pose del esqueleto.
for(const mat of z.materials)mat.uniforms.uHurt.value=Math.min(1,z.stun*2.4);
const animation=z.attackActive&&z.atk>0?'attack':z.v>.2?'walk':'idle';
zAnimate(z,dt,animation);zUpdateGroundAndShadows(z)}
// groan sound
gt-=dt;if(gt<=0){gt=rnd(.8,1.8);const c=Zs.filter(z=>!z.dead&&z.st&&Math.hypot(z.x-P.x,z.z-P.z)<28);if(c.length){const z=c[Math.random()*c.length|0],d=Math.hypot(z.x-P.x,z.z-P.z);tone(z.k===2?45:rnd(60,110),z.k===2?1.1:.7,'sawtooth',.09*(1-d/28),.6)}}
// director: oleadas periódicas si hay poca presión
if(ch<4)nextMob-=dt;else nextMob=Math.max(nextMob,12);if(nextMob<=0&&Zs.length<60){nextMob=rnd(35,55);mob(6+(Math.random()*4|0),.2);msg('¡INFECTADOS ACERCÁNDOSE!')}
TR.forEach(([r,f],i)=>{if(!fired[i]&&inR(r,P.x,P.z)){fired[i]=1;f()}});if(inR(R.E,P.x,P.z)){playing=0;finish('¡MISIÓN COMPLETADA!','Has llegado a la zona de extracción. Cierras la compuerta y sobrevives.')}
for(const k of PK){k.m.rotation.y+=dt*2;k.m.position.y=.5+Math.sin(tm*3)*.08;if(k.m.visible&&Math.hypot(k.x-P.x,k.z-P.z)<1.2){if(k.t==='h'){Wp[0].res+=20;Wp[1].res+=4;k.m.visible=0;msg('SUMINISTROS: +20 FUSIL / +4 ESCOPETA')}else{Wp[0].res+=60;Wp[1].res+=12;k.m.visible=0;msg('MUNICIÓN: +60 FUSIL / +12 ESCOPETA')}}}
for(const p of PP)if(p.m.visible){p.v.y-=12*dt;p.m.position.addScaledVector(p.v,dt);p.l-=dt;if(p.l<=0||p.m.position.y<.03)p.m.visible=false}
// cámara y viewmodel
cam.position.set(P.x,1.65+P.y+Math.sin(P.bob)*.045*(P.y?0:1),P.z);cam.rotation.set(P.pitch,P.yaw,0);cam.getWorldDirection(ZFRONT);
animVM(dt,ml2*sp);ml.intensity=flash>0?4:0;
LT[2].intensity=LT[2].userData.b*(Math.random()<.04?.3:1);
const w=Wp[cur];$('#hp').textContent=P.hp|0;$('#hpb i').style.width=P.hp+'%';$('#am').innerHTML=`${P.rl>0?'···':w.a}<small>/ ${w.res} · ${w.n} (1/2)</small>`;
const dm=$('#dm');dm.style.opacity=Math.max(+dm.style.opacity-dt*2.2,P.hp<30?.35:0);
obT-=dt;if(obT<=0){obT=.5;const gd=dist[Math.floor((R.E[1]+3)*1)*GW+R.E[0]+3]*C;$('#ob').textContent=`LLEGA AL REFUGIO VERDE · ${gd>0?gd:'—'} m · ${Zs.filter(z=>!z.dead).length} INFECTADOS`}}
let last=0;function loop(t){requestAnimationFrame(loop);const dt=Math.min(.05,(t-last)/1000||0);last=t;if(playing&&!P.dead&&!over)update(dt);else if(P.dead){P.dd+=dt;cam.position.y=Math.max(.3,1.65-P.dd*1.5);cam.rotation.z=Math.min(.9,P.dd)}ren.render(scene,cam)}
// ---------- entrada
addEventListener('keydown',e=>{keys[e.code]=1;if(!playing)return;if(e.code==='KeyR')reload();if(e.code==='Digit1')setW(0);if(e.code==='Digit2')setW(1);if(e.code==='Space')e.preventDefault()});addEventListener('keyup',e=>keys[e.code]=0);
addEventListener('mousemove',e=>{if(document.pointerLockElement&&playing){P.yaw-=e.movementX*.0022;P.pitch=Math.max(-1.5,Math.min(1.5,P.pitch-e.movementY*.0022))}});
addEventListener('mousedown',e=>{if(!playing)return;if(e.button===0)fire();if(e.button===2)shove()});addEventListener('contextmenu',e=>e.preventDefault());
const start=()=>{aud();$('#ov').style.display='none';playing=1;ren.domElement.requestPointerLock&&ren.domElement.requestPointerLock();if(!tm)msg('LLEGA AL REFUGIO')};
document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&playing&&!over){playing=0;$('#ot').textContent='PAUSA';$('#go').textContent='CONTINUAR';$('#ov').style.display='flex'}});
$('#op').innerHTML='Llega a la <b>zona de extracción verde</b> esquivando zombis. <b>Un solo contacto significa GAME OVER.</b> Cada zombi cae con dos disparos válidos; la munición se recupera únicamente en cajas.<br><br><b>WASD</b> mover · <b>SHIFT</b> correr · <b>ESPACIO</b> saltar · <b>CLIC IZQ.</b> un disparo · <b>CLIC DER.</b> empujar<br><b>R</b> recargar de la reserva · <b>1/2</b> fusil / escopeta · <b>ESC</b> pausa';
$('#go').onclick=start;requestAnimationFrame(loop);
})();
