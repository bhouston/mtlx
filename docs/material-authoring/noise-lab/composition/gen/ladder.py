import sys; sys.path.insert(0, '.')
from mx import *
k = float(sys.argv[2]) if len(sys.argv) > 2 else 1.0   # 1 = plane; 3.35 = fits the z5 view; 13.4 = fits the z20 view
g = G('relief_ladder')
uv, x, y = basics(g)
# Ladder coordinate c: the 8x4 grid of test cells is scaled by k about the tile center to fill the view.
c0 = g.n('subtract', 'vector2', comment=f'Relief visibility ladder, k={k}. Columns (u, left->right): max slope tan = 0.003*2.6^col '
         '(0.17, 0.45, 1.2, 3, 7.8, 20, 43, 67 deg). Rows (v, bottom->top): wavelength 0.005*2.8^row / k m.', in1=uv, in2=(0.5, 0.5))
c1 = g.n('multiply', 'vector2', in1=c0, in2=k)
c = g.n('add', 'vector2', in1=c1, in2=(0.5, 0.5))
cs = g.n('separate2', 'multioutput', name='c_sep', in_=c)
colf = g.n('floor', in_=g.n('multiply', in1=Ref('c_sep', 'outx'), in2=8.0))
rowf = g.n('floor', in_=g.n('multiply', in1=Ref('c_sep', 'outy'), in2=4.0))
tan = g.n('multiply', name='tan_slope', in1=g.n('power', in1=2.6, in2=colf), in2=0.003)
lam = g.n('multiply', name='wavelength', in1=g.n('power', in1=2.8, in2=rowf), in2=0.005 / k)
amp = g.n('multiply', name='amplitude', in1=g.n('divide', in1=tan, in2=6.2832), in2=lam)
fq = g.n('divide', in1=6.2832, in2=lam)
su = g.n('sin', in_=g.n('multiply', in1=x, in2=fq))
sv = g.n('sin', in_=g.n('multiply', in1=y, in2=fq))
h = g.n('multiply', name='height', in1=g.n('multiply', in1=su, in2=sv), in2=amp)
n = normal(g, h, uv)
col = g.n('constant', 'color3', name='base_color', value=(0.4, 0.4, 0.4))
r = g.n('constant', name='roughness', value=0.8)
open(sys.argv[1], 'w').write(std(g, 'Relief ladder: egg-crate bumps of known slope and wavelength. UV 1 = 1 m, height in m.', col, r, n))
