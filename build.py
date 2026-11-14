#!/usr/bin/env python3
"""Regenera un HTML autónomo: python build.py. No requiere librerías externas."""
import base64,json,pathlib
ROOT=pathlib.Path(__file__).resolve().parent
assets=ROOT/'assets'
source=(ROOT/'game.js').read_text(encoding='utf-8')
meta=json.loads((assets/'zombie_meta.json').read_text(encoding='utf-8'))
assert source.count('/*__ZOMBIE_META__*/')==1
source=source.replace('/*__ZOMBIE_META__*/',json.dumps(meta,separators=(',',':'),ensure_ascii=False))
contents={
 'GLB':'zombie_mixamo.glb',
 'BODY':'zombie_body.webp',
 'DETAIL':'zombie_detail.webp',
 **{a.upper():meta['animations'][a]['file'] for a in ('walk','idle','attack','death')}
}
for key,filename in contents.items():
 token=f'__ZOMBIE_{key}__'
 assert source.count(token)==1,token
 source=source.replace(token,base64.b64encode((assets/filename).read_bytes()).decode('ascii'))
for token,filename in (('__RIFLE_GLB__','rifle_tactico.glb'),('__ESCOPETA_GLB__','escopeta_tactica.glb')):
 assert source.count(token)==1,token
 source=source.replace(token,base64.b64encode((assets/filename).read_bytes()).decode('ascii'))
assert '</script' not in source.lower()
three=(ROOT/'three.min.js').read_text(encoding='utf-8')
html=(ROOT/'template.html').read_text(encoding='utf-8').replace('/*__THREE__*/',three).replace('/*__GAME__*/',source)
for file in ('index.html','Sector-04.html'):
 (ROOT/file).write_text(html,encoding='utf-8')
 print(file,round(len(html)/1024/1024,2),'MiB')
