import sys; sys.path.insert(0, '.')
from mx import *
g = G('orient')
uv, x, y = basics(g)
qr, qt = quadrants(g, x, y)
# 4 quadrants: stripes varying along u (vertical ridges), along v (horizontal), +45, -45. 1 cm period, 10 deg max slope.
def stripes(c, tag):
    return g.n('multiply', name=tag, in1=g.n('sin', in_=g.n('multiply', in1=c, in2=628.32)), in2=0.176 / 628.32)
d1 = g.n('add', in1=x, in2=y); d2 = g.n('subtract', in1=x, in2=y)
hu = stripes(x, 'h_u'); hv = stripes(y, 'h_v'); hd1 = stripes(g.n('multiply', in1=d1, in2=0.7071), 'h_d1'); hd2 = stripes(g.n('multiply', in1=d2, in2=0.7071), 'h_d2')
h = g.n('mix', bg=g.n('mix', bg=hu, fg=hv, mix=qr), fg=g.n('mix', bg=hd1, fg=hd2, mix=qr), mix=qt)
n = normal(g, h, uv)
open(sys.argv[1], 'w').write(std(g, 'orientation test BL u-varying, BR v-varying, TL along x+y, TR x-y', g.n('constant', 'color3', value=(0.4, 0.4, 0.4)), g.n('constant', value=0.8), n))
