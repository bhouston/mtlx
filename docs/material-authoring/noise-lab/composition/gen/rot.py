import sys; sys.path.insert(0, '.')
from mx import *
g = G('rot')
uv, x, y = basics(g)
qr, qt = quadrants(g, x, y)
r1 = g.n('rotate2d', 'vector2', in_=uv, amount=30.0)
r2 = g.n('place2d', 'vector2', texcoord=uv, rotate=30.0)
p = g.n('mix', 'vector2', bg=r1, fg=r2, mix=qr)
ps = g.n('separate2', 'multioutput', name='ps', in_=p)
l = g.n('smoothstep', in_=g.n('sin', in_=g.n('multiply', in1=Ref('ps', 'outy'), in2=6.2832 * 10)), low=0.9, high=0.95)
c = g.n('mix', 'color3', bg=(0.9, 0.9, 0.9), fg=(0.0, 0.0, 0.0), mix=l)
g.out('emission_out', 'color3', c)
open(sys.argv[1], 'w').write(g.xml('rot test: left rotate2d 30, right place2d rotate 30; lines of constant rotated v every 10 cm',
     {'base': 0.0, 'specular': 0.0, 'emission': 1.0, 'emission_color': ('out', 'emission_out')}))
