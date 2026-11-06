# Renders tmpl/*.md: NOISE_COOKBOOK.md -> docs/material-authoring/, the rest -> docs/material-authoring/cookbook/. `@@name@@` becomes s/name.xml.
# Refuses a snippet line that isn't in a built cookbook_*.mtlx (run build.py first), and a broken local link or anchor.
import glob, os, re
D = os.path.dirname(os.path.abspath(__file__))
LIB = os.path.normpath(os.path.join(D, '..', '..', '..'))
built = {l.strip() for f in glob.glob(os.path.join(D, '..', 'cookbook_*.mtlx')) for l in open(f)}
os.makedirs(os.path.join(LIB, 'cookbook'), exist_ok=True)
out = {}
for t in sorted(glob.glob(os.path.join(D, 'tmpl', '*.md'))):
    name = os.path.basename(t)
    dst = os.path.join(LIB, name) if name == 'NOISE_COOKBOOK.md' else os.path.join(LIB, 'cookbook', name)
    def sub(m):
        x = open(os.path.join(D, 's', m.group(1) + '.xml')).read().strip()
        missing = [l for l in x.split('\n') if l.strip() and l.strip() not in built]
        assert not missing, f'{m.group(1)}: not in any built material: {missing[0][:120]}'
        return '```xml\n' + x + '\n```'
    out[dst] = re.sub(r'@@(\w+)@@', sub, open(t).read())
    assert '@@' not in out[dst], name

def slug(h): return re.sub(r'[^\w\- ]', '', h.strip().lower()).replace(' ', '-')
def anchors(path):
    return {slug(h) for h in re.findall(r'^#+ (.*)$', out.get(path) or open(path).read(), re.M)}
for dst, text in out.items():
    for link in re.findall(r'\]\(([^)\s]+)\)', re.sub(r'```.*?```', '', text, flags=re.S)):
        if link.startswith('http'): continue
        f, _, a = link.partition('#')
        p = os.path.normpath(os.path.join(os.path.dirname(dst), f)) if f else dst
        assert os.path.exists(p) or p in out, f'{os.path.basename(dst)}: broken link {link}'
        assert not a or a in anchors(p), f'{os.path.basename(dst)}: no anchor {link}'
for dst, text in out.items():
    open(dst, 'w').write(text)
    print(f'{os.path.relpath(dst, LIB)}: {text.count(chr(10))} lines, {len(text)} chars')
