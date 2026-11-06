import sys; sys.path.insert(0, '.')
from mx import *
g = G('neutral_grey')
uv, x, y = basics(g)
side = g.n('ifgreater', name='right', comment='Left half linear 0.18 (18% grey card), right half 0.5. Flat, roughness 0.8, dielectric. Measures the IBL tint.', value1=x, value2=0.5, in1=1.0, in2=0.0)
col = g.n('mix', 'color3', name='base_color', bg=(0.18, 0.18, 0.18), fg=(0.5, 0.5, 0.5), mix=side)
r = g.n('constant', name='roughness', value=0.8)
open(sys.argv[1], 'w').write(std(g, 'Neutral grey reference swatch. UV 1 = 1 m.', col, r, None))
