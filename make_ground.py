#!/usr/bin/env python3
"""Calculate ground-contact baselines for every Mixamo keyframe.
Computed from the actual GPU vertex weights and bone transforms. No external service.
"""
import json, pathlib
import numpy as np
root = pathlib.Path(__file__).parent
adir = root/'assets'
meta = json.loads((adir/'zombie_meta.json').read_text(encoding='utf-8'))
geo_dt=np.dtype([('p','<f4',(3,)),('n','<f4',(3,)),('uv','<f4',(2,)),('j','u1',(4,)),('w','u1',(4,))]); v=np.fromfile(adir/'zombie_geometry.bin',dtype=geo_dt)
assert v.size * geo_dt.itemsize == (adir/'zombie_geometry.bin').stat().st_size
p,j,w=v['p'],v['j'],v['w'].astype('float32')/255
for clip,info in meta['animations'].items():
    seq=np.fromfile(adir/info['file'],dtype='<f4').reshape(info['frames'],meta['nBones'],7)
    baseline=[]
    for frame in seq:
        q=frame[:,3:7]; x,y,z,h = q.T
        ryx=2*(x*y+z*h)
        ryy=1-2*(x*x+z*z)
        ryz=2*(y*z-x*h)
        pos_y=(ryx[j]*p[:,0,None]+ryy[j]*p[:,1,None]+ryz[j]*p[:,2,None]+frame[j,1])*w
        baseline.append(round(float(np.sum(pos_y,axis=1).min()),5))
    meta.setdefault('groundY',{})[clip]=baseline
    print(clip, len(baseline), min(baseline),max(baseline))
(adir/'zombie_meta.json').write_text(json.dumps(meta,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
