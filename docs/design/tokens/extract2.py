import json, re

d = json.load(open('ds-page.json'))
root = d['nodes']['161:9']['document']

def find(n, i):
    if n.get('id') == i: return n
    for c in n.get('children', []):
        r = find(c, i)
        if r: return r

def hexof(n):
    for f in (n.get('fills') or []):
        if f.get('type') == 'SOLID' and f.get('visible', True):
            c = f['color']
            return '#%02x%02x%02x' % tuple(round(c[k] * 255) for k in 'rgb')
    return None

def texts(n, out=None):
    if out is None: out = []
    if n.get('type') == 'TEXT':
        t = n.get('characters', '').strip()
        if t: out.append(t)
    for c in n.get('children', []): texts(c, out)
    return out

def painted(n):
    """TEXT가 아닌 노드 중 처음 칠해진 색"""
    if n.get('type') != 'TEXT':
        h = hexof(n)
        if h: return h
    for c in n.get('children', []):
        r = painted(c)
        if r: return r
    return None

def swatches(n, out=None):
    """스와치 = TEXT 2개(단계명, 참조값) + 칠해진 프레임"""
    if out is None: out = []
    ts = texts(n)
    if len(ts) == 2 and painted(n):
        out.append({'step': ts[0], 'ref': ts[1], 'color': painted(n)})
        return out
    for c in n.get('children', []): swatches(c, out)
    return out

def groups(container):
    res = []
    for g in container.get('children', []):
        if g.get('type') == 'LINE': continue
        name = next((k.get('characters', '').strip() for k in g.get('children', [])
                     if k.get('type') == 'TEXT'), None)
        sw = swatches(g)
        if sw: res.append((name or '(무명)', sw))
    return res

out = {'primitive': {}, 'semantic': {}}

print('=' * 78)
print('PRIMITIVE')
print('=' * 78)
for name, sw in groups(find(root, '168:2934')):
    out['primitive'][name] = sw
    print(f'\n[{name}]')
    for s in sw:
        flag = '' if s['ref'].lower() == s['color'] else f'   (렌더:{s["color"]})'
        print(f'  {name.lower()}-{s["step"]:<6} {s["ref"]}{flag}')

print()
print('=' * 78)
print('SEMANTIC  (단계 -> 참조 primitive)')
print('=' * 78)
for name, sw in groups(find(root, '168:3115')):
    out['semantic'][name] = sw
    print(f'\n[{name}]')
    for s in sw:
        print(f'  {name.lower()}-{s["step"]:<10} -> {s["ref"]:<14} {s["color"]}')

json.dump(out, open('colors.json', 'w'), ensure_ascii=False, indent=2)
print('\n\n>> colors.json 저장 완료')
