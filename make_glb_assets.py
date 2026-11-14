#!/usr/bin/env python3
"""Exporta los modelos de zombis/armas a glTF 2.0 binario (GLB).
El modelo zombi se extrae de la geometría Mixamo que trae el proyecto; las
animaciones originales continúan siendo evaluadas por el sistema de poses.
Requiere numpy, trimesh y Pillow únicamente para REGENERAR estos GLB.
"""
from pathlib import Path
from PIL import Image
import io, json, struct
import numpy as np
import trimesh

root = Path(__file__).resolve().parent
out = root/'assets'
out.mkdir(exist_ok=True)

def pad(data, ch=b'\0'):
    return data + ch*((-len(data)) % 4)

def package_gltf(gltf, buf):
    gltf['buffers']=[{'byteLength':len(buf)}]
    j=pad(json.dumps(gltf,ensure_ascii=False,separators=(',',':')).encode('utf-8'), b' ')
    b=pad(buf)
    chunks=struct.pack('<I4s',len(j),b'JSON')+j+struct.pack('<I4s',len(b),b'BIN\0')+b
    return struct.pack('<4sII',b'glTF',2,len(chunks)+12)+chunks

meta=json.loads((out/'zombie_meta.json').read_text(encoding='utf8'))
vertex_data=(out/'zombie_geometry.bin').read_bytes()
assert len(vertex_data) == sum(m['count'] for m in meta['materials'])*meta['stride']
buffer=bytearray(vertex_data)
views=[{'buffer':0,'byteOffset':0,'byteLength':len(vertex_data),'byteStride':40,'target':34962}]
accessors=[]
primitives=[]
attrs={'POSITION':(0,5126,'VEC3',False),'NORMAL':(12,5126,'VEC3',False),
       'TEXCOORD_0':(24,5126,'VEC2',False),'JOINTS_0':(32,5121,'VEC4',False),
       'WEIGHTS_0':(36,5121,'VEC4',True)}
for part in meta['materials']:
    ai={}
    for name,(offset,ctype,typ,norm) in attrs.items():
        ai[name]=len(accessors)
        acc={'bufferView':0,'byteOffset':part['offset']+offset,'componentType':ctype,
             'count':part['count'],'type':typ}
        if norm:acc['normalized']=True
        accessors.append(acc)
    primitives.append({'attributes':ai,'material':part['material'],'mode':4})

images=[]; tex=[]; mats=[]
for image_file in ('zombie_body.webp','zombie_detail.webp'):
    im=Image.open(out/image_file).convert('RGBA')
    file=io.BytesIO();im.save(file,format='PNG',optimize=True)
    raw=file.getvalue()
    buffer.extend(b'\0'*((-len(buffer))%4))
    views.append({'buffer':0,'byteOffset':len(buffer),'byteLength':len(raw)})
    buffer.extend(raw)
    images.append({'bufferView':len(views)-1,'mimeType':'image/png'})
    tex.append({'source':len(tex)})
    mats.append({'name':f'Mixamo {image_file}','pbrMetallicRoughness':{'baseColorTexture':{'index':len(tex)-1},'metallicFactor':0.0,'roughnessFactor':.9},
                 'alphaMode':'MASK','alphaCutoff':0.25,'doubleSided':False})
# Esqueleto identidad: los 69 huesos originales y sus pesos se preservan.
# La animación se ejecuta desde poses por GPU en el código existente del juego.
ibms=np.tile(np.eye(4,dtype=np.float32).reshape(1,16),(meta['nBones'],1)).astype('<f4')
buffer.extend(b'\0'*((-len(buffer))%4))
views.append({'buffer':0,'byteOffset':len(buffer),'byteLength':ibms.nbytes})
buffer.extend(ibms.tobytes())
accessors.append({'bufferView':len(views)-1,'componentType':5126,'count':meta['nBones'],'type':'MAT4'})
nodes=[{'mesh':0,'skin':0,'name':'Parasite L Starkie'}, {'name':'Mixamo armature root','children':list(range(2,meta['nBones']+2))}] + [{'name':str(n)} for n in meta['boneNames']]
zgltf={'asset':{'version':'2.0','generator':'Sector04 exporter; original Mixamo model'},
       'scene':0,'scenes':[{'nodes':[0,1]}],'nodes':nodes,'meshes':[{'name':'Parasite L Starkie','primitives':primitives}],
       'skins':[{'name':'Mixamo joints','joints':list(range(2,meta['nBones']+2)),'skeleton':1,'inverseBindMatrices':len(accessors)-1}],
       'bufferViews':views,'accessors':accessors,'images':images,'textures':tex,'materials':mats,
       'extras':{'animationSource':'assets/pose_walk.bin, pose_idle.bin, pose_attack.bin, pose_death.bin'}}
(out/'zombie_mixamo.glb').write_bytes(package_gltf(zgltf,buffer))

COLORS={'gun':0x25282b,'gun2':0x353b40,'met':0x111214,'poly':0x1b1c1d,'wood':0x5e3b21,'skin':0xc08f70,'sl':0x2f3d2a,'red':0xb02a20}

def box(w,h,l,mat,x=0,y=0,z=0):
    obj=trimesh.creation.box(extents=[w,h,l]);obj.apply_translation([x,y,z]);return mat,obj

def cy(r,l,mat,x=0,y=0,z=0):
    obj=trimesh.creation.cylinder(radius=r,height=l,sections=12)
    # Tres ejes de cilindro: por defecto Z y el código original orienta su eje a Z.
    obj.apply_translation([x,y,z]);return mat,obj

rifle_parts=[box(.06,.085,.34,'gun'),box(.052,.06,.26,'gun2',0,.005,-.29),
             cy(.013,.32,'met',0,.014,-.55),cy(.021,.06,'met',0,.014,-.7),
             box(.012,.045,.012,'met',0,.05,-.58),box(.03,.03,.14,'met',0,.058,.02),
             box(.05,.085,.2,'poly',0,-.015,.27),box(.04,.1,.05,'poly',0,-.085,.09),
             box(.034,.02,.11,'gun2',0,.052,-.1),box(.014,.05,.014,'met',0,.074,-.22)]
shotgun_parts=[box(.06,.08,.3,'gun'),cy(.018,.62,'met',0,.028,-.46),cy(.014,.5,'met',0,-.027,-.4),
               box(.012,.02,.012,'met',0,.06,-.76),box(.05,.09,.26,'wood',0,-.02,.28),
               box(.04,.1,.05,'wood',0,-.085,.09),box(.025,.018,.08,'gun2',0,.063,-.3)]

def make_weapon(parts,name):
    gbuf=bytearray(); gviews=[]; gacc=[]; materials=[]; prims=[]
    for color in sorted({m for m,_ in parts}):
        tris=np.concatenate([mesh.triangles for mat,mesh in parts if mat==color],axis=0).astype('<f4')
        normals=np.cross(tris[:,1]-tris[:,0],tris[:,2]-tris[:,0]); normals/=np.maximum(np.linalg.norm(normals,axis=1,keepdims=True),1e-7)
        vertices=tris.reshape(-1,3); n=np.repeat(normals,3,axis=0)
        attrs={}
        for attr,data in [('POSITION',vertices),('NORMAL',n)]:
            gbuf.extend(b'\0'*((-len(gbuf))%4));offset=len(gbuf)
            b=data.astype('<f4',copy=False).tobytes();gbuf.extend(b)
            gviews.append({'buffer':0,'byteOffset':offset,'byteLength':len(b),'target':34962})
            acc={'bufferView':len(gviews)-1,'componentType':5126,'count':len(data),'type':'VEC3'}
            if attr=='POSITION':acc['min']=data.min(axis=0).astype(float).tolist();acc['max']=data.max(axis=0).astype(float).tolist()
            gacc.append(acc);attrs[attr]=len(gacc)-1
        col=COLORS[color]
        mats={'name':color,'pbrMetallicRoughness':{'baseColorFactor':[((col>>16)&255)/255,((col>>8)&255)/255,(col&255)/255,1],
                          'metallicFactor':.48 if color in ('met','gun2') else .12,'roughnessFactor':.65},'doubleSided':False}
        materials.append(mats)
        prims.append({'attributes':attrs,'material':len(materials)-1,'mode':4})
    gltf={'asset':{'version':'2.0','generator':'Sector04 armas, glTF 2.0'},'scene':0,'scenes':[{'nodes':[0]}],
          'nodes':[{'mesh':0,'name':name}],'meshes':[{'name':name,'primitives':prims}],
          'bufferViews':gviews,'accessors':gacc,'materials':materials}
    (out/f'{name}.glb').write_bytes(package_gltf(gltf,gbuf))

make_weapon(rifle_parts,'rifle_tactico')
make_weapon(shotgun_parts,'escopeta_tactica')
for name in ('zombie_mixamo','rifle_tactico','escopeta_tactica'):
    path=out/f'{name}.glb';print(path.name, round(path.stat().st_size/1024,1),'KB')
