import sys; sys.path.insert(0, '.')
from mx import *
g = G('ruler')
uv, x, y = basics(g)

def line(c, f, hw, tag, off=0.5):
    """1 on lines every 1/f m, half-width hw m."""
    a = g.n('multiply', in1=c, in2=f)
    b = g.n("add", in1=a, in2=off)
    m = g.n('modulo', in1=b, in2=1.0)
    s = g.n('subtract', in1=m, in2=0.5)
    ab = g.n('absval', in_=s)
    d = g.n('divide', in1=ab, in2=f)
    st = g.n('smoothstep', in_=d, low=hw, high=hw + 0.0002)
    return g.n('subtract', name=tag, in1=1.0, in2=st)

col = g.n('constant', 'color3', value=(0.8, 0.8, 0.8), comment='Unlit calibration grid: 1 cm grey, 5 cm blue, 10 cm black, u=0.5/v=0.5 red. UV 1 = 1 m.')
for f, hw, c, t in [(100, 0.0003, (0.3, 0.3, 0.3), 'cm'), (20, 0.0007, (0.1, 0.2, 0.9), 'cm5'), (10, 0.0015, (0, 0, 0), 'cm10'), (1, 0.001, (0.9, 0.05, 0.05), 'center')]:
    o = 0.0 if f == 1 else 0.5; lx = line(x, f, hw, f'{t}_u', o); ly = line(y, f, hw, f'{t}_v', o)
    l = g.n('max', name=t, in1=lx, in2=ly)
    col = g.n('mix', 'color3', bg=col, fg=c, mix=l)
g.out('emission_out', 'color3', col)
open(sys.argv[1], 'w').write(g.xml('Ruler / calibration: unlit (emission) grid in true meters. Render -g plane to read visible width per zoom.',
    {'base': 0.0, 'specular': 0.0, 'emission': 1.0, 'emission_color': ('out', 'emission_out')}))
