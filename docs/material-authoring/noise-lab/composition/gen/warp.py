import sys; sys.path.insert(0, '.')
from mx import *
g = G('warp_ladder')
uv, x, y = basics(g)
F = 10.0  # warp features per meter (10 cm)
colf = g.n('floor', name='col', in_=g.n('multiply', in1=x, in2=6.0),
           comment='Columns: warp strength s = A*f = 0.05*1.74^col (0.05 0.087 0.15 0.26 0.46 0.8). Rows (bottom->top): nested noise2d, fractal2d 3 oct, single noise2d.')
rowf = g.n('floor', name='row', in_=g.n('multiply', in1=y, in2=3.0))
A = g.n('divide', name='warp_amp', in1=g.n('multiply', in1=g.n('power', in1=1.74, in2=colf), in2=0.05), in2=F)

def w(p, kind, **kw):
    # Two float noises at offset coordinates: noise2d/fractal2d type="vector2" return x == y in three.js (known bug).
    pf = g.n('multiply', 'vector2', in1=p, in2=F)
    nx = g.n(kind, texcoord=pf, **kw)
    ny = g.n(kind, texcoord=g.n('add', 'vector2', in1=pf, in2=(17.3, 9.1)), **kw)
    n = g.n('combine2', 'vector2', in1=nx, in2=ny)
    return g.n('add', 'vector2', in1=p, in2=g.n('multiply', 'vector2', in1=n, in2=A))

def q_of(p):
    single = w(p, 'noise2d')
    frac = w(p, 'fractal2d', octaves=3)
    nested = w(w(p, 'noise2d'), 'noise2d')   # warp the already-warped coordinate
    a = g.n('ifgreater', 'vector2', value1=rowf, value2=1.5, in1=single, in2=frac)
    return g.n('ifgreater', 'vector2', value1=rowf, value2=0.5, in1=a, in2=nested)

e = 1e-4
q0 = q_of(uv)
qx = q_of(g.n('add', 'vector2', in1=uv, in2=(e, 0.0), comment='Finite-difference Jacobian: re-evaluate the warp 0.1 mm to the right and up.'))
qy = q_of(g.n('add', 'vector2', in1=uv, in2=(0.0, e)))
dx = g.n('separate2', 'multioutput', name='dx', in_=g.n('subtract', 'vector2', in1=qx, in2=q0))
dy = g.n('separate2', 'multioutput', name='dy', in_=g.n('subtract', 'vector2', in1=qy, in2=q0))
det = g.n('divide', name='jac_det', in1=g.n('subtract', in1=g.n('multiply', in1=Ref('dx', 'outx'), in2=Ref('dy', 'outy')),
                                     in2=g.n('multiply', in1=Ref('dx', 'outy'), in2=Ref('dy', 'outx'))), in2=e * e)
# Display: 2 cm grid lines of the warped coordinate. det(J) = pattern-space area per surface area.
# Orange: det < 0.25 (pattern magnified >2x linearly, smeared blobs). Purple: det > 4 (pattern crushed). Red: det < 0 (space folded, mirrored).
qs = g.n('separate2', 'multioutput', name='qs', in_=q0)
def lines(c):
    m = g.n('modulo', in1=g.n('multiply', in1=c, in2=50.0), in2=1.0)
    return g.n('smoothstep', in_=g.n('absval', in_=g.n('subtract', in1=m, in2=0.5)), low=0.40, high=0.46)
gl = g.n('max', in1=lines(Ref('qs', 'outx')), in2=lines(Ref('qs', 'outy')))
c = g.n('mix', 'color3', bg=(0.85, 0.85, 0.85), fg=(0.1, 0.1, 0.1), mix=gl)
sq = g.n('ifgreater', value1=0.25, value2=det, in1=1.0, in2=0.0)
fold = g.n('ifgreater', value1=0.0, value2=det, in1=1.0, in2=0.0)
c = g.n('mix', 'color3', bg=c, fg=(1.0, 0.6, 0.1), mix=sq)
dense = g.n('ifgreater', value1=det, value2=4.0, in1=1.0, in2=0.0)
c = g.n('mix', 'color3', bg=c, fg=(0.6, 0.2, 0.9), mix=dense)
c = g.n('mix', 'color3', bg=c, fg=(1.0, 0.0, 0.0), mix=fold)
sep = g.n('smoothstep', in_=g.n('absval', in_=g.n('subtract', in1=g.n('modulo', in1=g.n('multiply', in1=x, in2=6.0), in2=1.0), in2=0.5)), low=0.48, high=0.49)
sepv = g.n('smoothstep', in_=g.n('absval', in_=g.n('subtract', in1=g.n('modulo', in1=g.n('multiply', in1=y, in2=3.0), in2=1.0), in2=0.5)), low=0.49, high=0.495)
c = g.n('mix', 'color3', bg=c, fg=(0.1, 0.3, 1.0), mix=g.n('max', in1=sep, in2=sepv))
g.out('emission_out', 'color3', c)
open(sys.argv[1], 'w').write(g.xml('Warp ladder with finite-difference fold detector. Unlit. UV 1 = 1 m.',
     {'base': 0.0, 'specular': 0.0, 'emission': 1.0, 'emission_color': ('out', 'emission_out')}))
