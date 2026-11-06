import sys; sys.path.insert(0, '.')
from mx import *
g = G('grad_probe')
uv, x, y = basics(g)
p = g.n('multiply', 'vector2', in1=uv, in2=40.0)
e = 0.002
def fd(kind, extra):
    v0 = g.n(kind, texcoord=p, **extra)
    vx = g.n(kind, texcoord=g.n('add', 'vector2', in1=p, in2=(e, 0.0)), **extra)
    vy = g.n(kind, texcoord=g.n('add', 'vector2', in1=p, in2=(0.0, e)), **extra)
    gx = g.n('divide', in1=g.n('subtract', in1=vx, in2=v0), in2=e)
    gy = g.n('divide', in1=g.n('subtract', in1=vy, in2=v0), in2=e)
    return g.n('magnitude', in_=g.n('combine2', 'vector2', in1=gx, in2=gy)), v0
gn, vn = fd('noise2d', {})
gf, vf = fd('fractal2d', {'octaves': 5})
side = g.n('ifgreater', value1=x, value2=0.5, in1=1.0, in2=0.0)
gm = g.n('mix', bg=gn, fg=gf, mix=side)
vm = g.n('mix', bg=vn, fg=vf, mix=side)
T = [float(t) for t in sys.argv[2].split(',')]
chs = [g.n('ifgreater', value1=gm, value2=t, in1=1.0, in2=0.0) for t in T]
if len(sys.argv) > 3:  # value thresholds instead
    chs = [g.n('ifgreater', value1=g.n('absval', in_=vm), value2=t, in1=1.0, in2=0.0) for t in T]
col = g.n('combine3', 'color3', in1=chs[0], in2=chs[1], in3=chs[2])
g.out('emission_out', 'color3', col)
open(sys.argv[1], 'w').write(g.xml('grad probe', {'base': 0.0, 'specular': 0.0, 'emission': 1.0, 'emission_color': ('out', 'emission_out')}))
