import sys; sys.path.insert(0, '.')
from mx import *
g = G('correlation')
uv, x, y = basics(g)
right = g.n('ifgreater', name='q_right', value1=x, value2=0.5, in1=1.0, in2=0.0)
def fr(p, oct, tag):
    return g.n('fractal2d', name=tag, texcoord=g.n('multiply', 'vector2', in1=p, in2=8.0), octaves=oct, amplitude=1.0)
# Relief: 5-octave fractal on ~12 cm features.
f5 = fr(uv, 5, 'relief_f5')
height = g.n('multiply', name='height', in1=f5, in2=0.008, comment='Relief: fractal2d(uv*8, 5 oct) * 8 mm (~9 deg typical slope). Left half: colour/roughness masks from this same field. Right half: masks from an offset copy (uncorrelated).')
# Masks from a field: cavity = low areas; convexity = f5 - f2 (the octaves above the 2nd: local bumps and ridges).
def masks(p, tag):
    a5 = fr(p, 5, f'{tag}_f5'); a2 = fr(p, 2, f'{tag}_f2')
    conv = g.n('subtract', name=f'{tag}_convexity', in1=a5, in2=a2)
    crev = g.n('smoothstep', in_=g.n('subtract', in1=0.0, in2=conv), low=0.06, high=0.16)   # local concavities
    deep = g.n('smoothstep', in_=g.n('subtract', in1=0.0, in2=a5), low=0.25, high=0.45)     # lowest basins
    cav = g.n('max', name=f'{tag}_cavity', in1=crev, in2=deep)
    wear = g.n('multiply', name=f'{tag}_wear', in1=g.n('smoothstep', in_=conv, low=0.06, high=0.16), in2=g.n('smoothstep', in_=a5, low=0.0, high=0.15))
    return cav, wear
cav_c, wear_c = masks(uv, 'corr')
cav_u, wear_u = masks(g.n('add', 'vector2', in1=uv, in2=(3.7, 1.9)), 'unc')
cav = g.n('mix', name='cavity', bg=cav_c, fg=cav_u, mix=right)
wear = g.n('mix', name='wear', bg=wear_c, fg=wear_u, mix=right)
n = normal(g, height, uv)
c = g.n('mix', 'color3', bg=(0.36, 0.35, 0.33), fg=(0.16, 0.15, 0.14), mix=cav, comment='Cavities darker and rougher; worn highs lighter and smoother.')
c = g.n('mix', 'color3', name='base_color', bg=c, fg=(0.56, 0.55, 0.53), mix=wear)
r = g.n('mix', bg=0.8, fg=0.95, mix=cav)
r = g.n('mix', name='roughness', bg=r, fg=0.45, mix=wear)
open(sys.argv[1], 'w').write(std(g, 'Channel correlation: left = colour/roughness from the height field, right = same masks from an unrelated field. UV 1 = 1 m.', c, r, n))
