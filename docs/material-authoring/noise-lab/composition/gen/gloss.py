import sys; sys.path.insert(0, '.')
from mx import *
g = G('gloss')
uv, x, y = basics(g)
t = g.n('ifgreater', value1=y, value2=0.5, in1=1.0, in2=0.0)
r = g.n('mix', name='roughness', bg=0.5, fg=0.05, mix=t)
col = g.n('constant', 'color3', name='base_color', value=(0.18, 0.18, 0.18))
open(sys.argv[1], 'w').write(std(g, 'gloss test: v>0.5 roughness 0.05, else 0.5', col, r, None))
