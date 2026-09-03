import json, re, os

d = json.load(open('ds-page.json'))
root = d['nodes']['161:9']['document']
colors = json.load(open('colors.json'))

def find(n, i):
    if n.get('id') == i: return n
    for c in n.get('children', []):
        r = find(c, i)
        if r: return r

def texts(n, o=None):
    if o is None: o = []
    if n.get('type') == 'TEXT' and n.get('characters', '').strip():
        o.append(n['characters'].strip())
    for c in n.get('children', []): texts(c, o)
    return o

# ---------- 타이포 파싱 ----------
raw = texts(find(root, '168:2296'))
SPEC = re.compile(r'^(\d+)\s*/\s*(\d+)\s*/\s*(\d+)\s*/\s*(-?\d+)%$')
scale, i = [], 0
while i < len(raw):
    t = raw[i]
    if '/' in t and not SPEC.match(t) and i + 1 < len(raw) and SPEC.match(raw[i + 1]):
        m = SPEC.match(raw[i + 1])
        scale.append({
            'name': t,
            'size': int(m[1]), 'weight': int(m[2]),
            'line': int(m[3]), 'tracking': int(m[4]),
            'desc': raw[i + 2] if i + 2 < len(raw) else ''
        })
        i += 3
    else:
        i += 1

# Label 이름 오류 교정 (Regular 바로 뒤 Emphasis는 같은 등급이어야 함)
issues = []
for idx, s in enumerate(scale):
    if s['name'].endswith('/Emphasis') and idx > 0:
        prev = scale[idx - 1]
        if prev['name'].endswith('/Regular') and prev['size'] == s['size']:
            want = prev['name'].replace('/Regular', '/Emphasis')
            if want != s['name']:
                issues.append(f"타이포 이름 오류: '{s['name']}'({s['size']}px) -> '{want}' 로 교정")
                s['name'] = want

def slug(n):
    return n.lower().replace('/', '-')

# ---------- CSS 생성 ----------
L = []
L.append('/* ============================================================')
L.append(' * Uttae Design Tokens — Figma "🐰디자인-디자인 시스템" 자동 추출')
L.append(' * file: zz7vcIin1K1QYiBTpeySyt / node 161:9')
L.append(' * 수정하지 말고 재추출로 갱신할 것')
L.append(' * ============================================================ */')
L.append('')
L.append(':root {')
L.append('  /* ---------- 1. PRIMITIVE ---------- */')
for fam, sw in colors['primitive'].items():
    L.append(f'  /* {fam} */')
    for s in sw:
        L.append(f'  --{fam.lower()}-{s["step"]}: {s["ref"].lower()};')
    L.append('')

L.append('  /* ---------- 2. SEMANTIC (primitive 참조) ---------- */')
pm = {f'{f.lower()}-{s["step"]}': s['ref'].lower()
      for f, sw in colors['primitive'].items() for s in sw}
for grp, sw in colors['semantic'].items():
    L.append(f'  /* {grp} */')
    for s in sw:
        step = 'default' if s['step'] == 'defualt' else s['step']
        if s['step'] == 'defualt':
            issues.append(f"컬러 이름 오타: '{grp}/defualt' -> 'default' 로 교정")
        ref = s['ref'].lower()
        actual = s['color'].lower()
        if pm.get(ref) != actual:
            rev = [k for k, v in pm.items() if v == actual]
            issues.append(
                f"컬러 참조 불일치: {grp}/{step} 라벨={ref}({pm.get(ref)}) 실제={actual}({rev[0] if rev else '?'}) — 실제값 채택")
            ref = rev[0] if rev else ref
        L.append(f'  --color-{grp.lower()}-{step}: var(--{ref});')
    L.append('')

L.append('  /* ---------- 3. TYPOGRAPHY ---------- */')
L.append('  --font-sans: "Pretendard Variable", Pretendard, -apple-system,')
L.append('    BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", sans-serif;')
L.append('')
for w, v in [('regular', 400), ('medium', 500), ('semibold', 600), ('bold', 700)]:
    L.append(f'  --font-weight-{w}: {v};')
L.append('}')
css = '\n'.join(L)

# ---------- Tailwind config 조각 ----------
T = []
T.append('// Figma 디자인 시스템 자동 추출 — tailwind.config.js 의 theme.extend 에 병합')
T.append('module.exports = {')
T.append('  colors: {')
for fam in colors['primitive']:
    T.append(f'    {fam.lower()}: {{')
    for s in colors['primitive'][fam]:
        T.append(f'      {s["step"]}: "var(--{fam.lower()}-{s["step"]})",')
    T.append('    },')
T.append('')
for grp, sw in colors['semantic'].items():
    g = grp.lower()
    steps = {('default' if s['step'] == 'defualt' else s['step']) for s in sw}
    T.append(f'    {g}: {{')
    for s in sorted(steps):
        key = 'DEFAULT' if s == 'default' else s
        T.append(f'      {key}: "var(--color-{g}-{s})",')
    T.append('    },')
T.append('  },')
T.append('')
T.append('  fontSize: {')
for s in scale:
    tr = f'{s["tracking"]/100:.2f}em'
    T.append(f'    "{slug(s["name"])}": ["{s["size"]}px", {{ lineHeight: "{s["line"]}px", '
             f'fontWeight: "{s["weight"]}", letterSpacing: "{tr}" }}],  // {s["desc"]}')
T.append('  },')
T.append('};')
tw = '\n'.join(T)

os.makedirs('out', exist_ok=True)
open('out/tokens.css', 'w').write(css + '\n')
open('out/tailwind.tokens.js', 'w').write(tw + '\n')
json.dump({'scale': scale, 'issues': issues}, open('out/typography.json', 'w'),
          ensure_ascii=False, indent=2)

print(f'스케일 {len(scale)}개, CSS 변수 {css.count("--")}개')
print('\n=== 발견된 데이터 이슈 ===')
for x in issues: print(' -', x)
