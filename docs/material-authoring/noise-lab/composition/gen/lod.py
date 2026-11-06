import sys; sys.path.insert(0, '.')
from mx import *
g = G('lod_probe')
uv, x, y = basics(g)
def probe(J0, tag):
    s = (1e-7 / J0) ** 0.5
    tc = g.n('multiply', 'vector2', in1=uv, in2=s)
    hn = g.n('heighttonormal', 'vector3', in_=x, scale=160 * s, texcoord=tc)
    g.n('separate3', 'multioutput', name=f'{tag}_sep', in_=hn)
    return g.n('smoothstep', name=tag, in_=Ref(f'{tag}_sep', 'outz'), low=0.8, high=0.9)
a = probe(3e-6, 'fine1'); b = probe(3e-7, 'fine2'); c = probe(3e-8, 'fine3')
col = g.n('combine3', 'color3', in1=a, in2=b, in3=c)
g.out('emission_out', 'color3', col)
open(sys.argv[1], 'w').write(g.xml('LOD probe', {'base': 0.0, 'specular': 0.0, 'emission': 1.0, 'emission_color': ('out', 'emission_out')}))
