# 把 data.json 编码成紧凑格式，生成给 Figma use_figma 用的脚本（calls/*.js）
import json, os, sys
os.chdir(os.path.dirname(os.path.abspath(__file__)))
J = json.load(open('data.json'))
os.makedirs('calls', exist_ok=True)

def C(c):
    h = '#%02x%02x%02x' % tuple(round(v * 255) for v in c[:3])
    return h if c[3] >= 1 else h + '@' + str(round(c[3], 3))
def P(p):
    if p['k'] == 's': return ['s', C(p['c'])]
    st = [[round(a, 3), C(c)] for a, c in p['s']]
    return ['l', p['t'], st] if p['k'] == 'l' else [p['k'], st]
def SH(s): return [s[0], s[1], s[2], s[3], C(s[4]), s[5]]
num = lambda v: int(v) if v == int(v) else v

def encode(frame):
    T, B, Ti, Bi = [], [], {}, {}
    def ti(n):
        k = json.dumps([n['f'], n['wt'], n['sz'], n['lh'], n['ls'], C(n['c'])])
        if k not in Ti: Ti[k] = len(T); T.append(json.loads(k))
        return Ti[k]
    def bi(n):
        b = {}
        if n.get('bg'): b['bg'] = [P(p) for p in n['bg']]
        if 'r' in n: b['r'] = n['r']
        if n.get('st'): b['st'] = [C(n['st']['c']), n['st']['w'], n['st']['d']]
        if n.get('sh'): b['sh'] = [SH(s) for s in n['sh']]
        if 'op' in n: b['op'] = n['op']
        if n.get('clip'): b['clip'] = 1
        if n.get('blur'): b['blur'] = n['blur']
        k = json.dumps(b, sort_keys=True)
        if k not in Bi: Bi[k] = len(B); B.append(b)
        return Bi[k]
    def enc(ch):
        out = []
        for n in ch:
            xywh = [num(n['x']), num(n['y']), num(n['w']), num(n['h'])]
            if n['t'] == 't':
                e = [0] + xywh + [ti(n), n['s']]
                if n.get('wrap'): e += [1, 1 if n.get('al') else 0]
            elif n['t'] == 'f':
                e = [1] + xywh + [bi(n), n['n'], enc(n.get('ch') or [])]
                if n.get('rot'): e.append(n['rot'])
            else:
                parts = [['p', p['p']] if 'p' in p else ['u', p['u'], p['a'], p['b'], p['s'], p['rot'], p.get('op') or 0] for p in n['parts']]
                fl = (1 if n.get('stk') else 0) | (2 if n.get('sh') else 0)
                e = [2] + xywh + [n['n'], parts, fl]
                if n.get('rot'): e.append(n['rot'])
            out.append(e)
        return out
    D = enc(frame['ch'])
    return T, B, D

LIB = open('lib.js', encoding='utf-8').read()

# 画板在画布上的位置：3 列网格
pos, X, Y, rowh = {}, 0, 0, 0
for i, f in enumerate(J['frames']):
    if f['id'] == 'phones':
        X, Y = 0, Y + rowh + 200
    elif i and i % 3 == 0:
        X, Y, rowh = 0, Y + rowh + 200, 0
    pos[f['id']] = (X, Y)
    X += f['w'] + 160; rowh = max(rowh, f['h'])

sym_ids = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {}
for f in J['frames']:
    T, B, D = encode(f)
    FR = {'title': f['title'], 'w': f['w'], 'h': f['h'], 'X': pos[f['id']][0], 'Y': pos[f['id']][1], 'bg': [P(p) for p in f['bg']] or [['s', '#ffffff']], 'r': f['r']}
    head = 'const SY=%s;const T=%s;const B=%s;const FR=%s;const D=%s;\n' % tuple(json.dumps(v, ensure_ascii=False, separators=(',', ':')) for v in (sym_ids, T, B, FR, D))
    code = head + LIB
    open('calls/%s.js' % f['id'], 'w', encoding='utf-8').write(code)
    print(f['id'], len(code))

# 插画组件
syms = J['syms']
open('calls/_symbols.json', 'w').write(json.dumps({k: v['s'] for k, v in syms.items()}, ensure_ascii=False))
