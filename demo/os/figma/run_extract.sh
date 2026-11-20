#!/bin/bash
# 用法：bash run_extract.sh  → 生成 data.json（每个画板的图层数据）
cd "$(dirname "$0")"
T=$(mktemp -d)
python3 - "$T" <<'PY'
import sys
src=open('../../人生OS-全部页面.html',encoding='utf-8').read()
js=open('extract.js',encoding='utf-8').read()
open(sys.argv[1]+'/ex.html','w',encoding='utf-8').write(src.replace('</body>','<script>'+js+'</script></body>'))
PY
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --window-size=1900,1200 --virtual-time-budget=20000 --dump-dom "file://$T/ex.html" 2>/dev/null > "$T/dom.html"
python3 - "$T" <<'PY'
import html,re,json,sys
d=open(sys.argv[1]+'/dom.html',encoding='utf-8').read()
j=json.loads(html.unescape(re.search(r'<pre id="OUT">(.*)</pre>',d,re.S).group(1)))
json.dump(j,open('data.json','w'),ensure_ascii=False,separators=(',',':'))
print(len(j['frames']),'frames',len(j['syms']),'symbols',sum(len(v['s']) for v in j['syms'].values()),'symbol chars')
for k,v in j['syms'].items(): print(' ',k,len(v['s']))
def walk(ch):
  for c in ch:
    yield c
    yield from walk(c.get('ch') or [])
for f in j['frames']:
  ps=[p for n in walk(f['ch']) if n['t']=='s' for p in n['parts']]
  print(f['id'],len(json.dumps(f,ensure_ascii=False,separators=(',',':'))),'parts p:',sum(len(p['p']) for p in ps if 'p' in p),'u:',sum(1 for p in ps if 'u' in p))
PY
rm -rf "$T"
