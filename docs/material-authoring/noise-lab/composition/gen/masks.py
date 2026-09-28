import sys; sys.path.insert(0, '.')
from mx import *
g = G('masks')
uv, x, y = basics(g)
# --- col 0: specks. top: thresholded noise (worms). bottom: worley pits with noise-driven radius (round specks).
nz = noise(g, uv, 60.0, 1.0, name='speck_noise', comment='Col 0 top: smoothstep(noise2d) threshold -> worm-like blobs, never round specks.')
worms = g.n('smoothstep', name='worms', in_=nz, low=0.3, high=0.34)
f1 = g.n('worleynoise2d', name='pit_f1', texcoord=g.n('multiply', 'vector2', in1=uv, in2=60.0), jitter=0.9,
         comment='Col 0 bottom: worley F1 pits, radius from smooth noise (<0 = no pit).')
rad = g.n('noise2d', name='pit_r', texcoord=g.n('multiply', 'vector2', in1=uv, in2=9.0), amplitude=0.6, pivot=0.05)
pits = g.n('smoothstep', name='pits', in_=g.n('subtract', in1=rad, in2=f1), low=0.0, high=0.04)
# --- col 1: cracks with presence. top: output * mask (lines fade, keep width). bottom: threshold * mask (lines taper).
wn = g.n('combine2', 'vector2', in1=noise(g, uv, 8.0, 0.02), in2=noise(g, g.n('add', 'vector2', in1=uv, in2=(2.17, 1.13)), 8.0, 0.02))
wuv = g.n('add', 'vector2', in1=uv, in2=wn,
          comment='Col 1: worley F2-F1 crack network on a 12 cm cell, warped (s = A*f = 0.16).')
wv = g.n('worleynoise2d', 'vector2', name='crack_f', texcoord=g.n('multiply', 'vector2', in1=wuv, in2=8.0), jitter=0.9)
f21 = g.n('dotproduct', name='f2_f1', in1=wv, in2=(-1.0, 1.0))
pres = g.n('smoothstep', name='presence', in_=noise(g, uv, 4.0, 1.0), low=-0.3, high=0.1)
crack_full = g.n('subtract', name='crack_full', in1=1.0, in2=g.n('smoothstep', in_=f21, low=0.0, high=0.05))
crack_mul = g.n('multiply', name='crack_mul', in1=crack_full, in2=pres)
thr = g.n('multiply', name='crack_thr', in1=pres, in2=0.05)
crack_tap = g.n('subtract', name='crack_taper', in1=1.0, in2=g.n('smoothstep', in_=f21, low=0.0, high=g.n('add', in1=thr, in2=0.0005)))
# --- col 2: union of two dome sets. top: hard max (creases). bottom: smooth max k=0.06 (fillets).
def domes(off, tag):
    p = g.n('add', 'vector2', in1=g.n('multiply', 'vector2', in1=uv, in2=10.0), in2=off)
    f = g.n('worleynoise2d', texcoord=p, jitter=0.8)
    return g.n('subtract', name=tag, in1=0.18, in2=g.n('multiply', in1=f, in2=f))  # parabolic dome, radius 0.42 cell
d1 = domes((0.0, 0.0), 'dome_a'); d2 = domes((37.5, 11.25), 'dome_b')
hard = g.n('max', name='union_hard', in1=g.n('max', in1=d1, in2=d2), in2=0.0)
soft = g.n('max', name='union_smooth', in1=smax(g, d1, d2, 0.06), in2=0.0)
# --- assemble. Heights in meters.
h_worms = g.n('multiply', in1=worms, in2=-0.0006); h_pits = g.n('multiply', in1=pits, in2=-0.0006)
h_cm = g.n('multiply', in1=crack_mul, in2=-0.0015); h_ct = g.n('multiply', in1=crack_tap, in2=-0.0015)
h_hard = g.n('multiply', in1=hard, in2=0.015); h_soft = g.n('multiply', in1=soft, in2=0.015)
h = grid_select(g, x, y, [[h_pits, h_ct, h_soft], [h_worms, h_cm, h_hard]])
dark = grid_select(g, x, y, [[pits, crack_tap, 0.0], [worms, crack_mul, 0.0]], tag='dk')
n = normal(g, g.n('multiply', name='height', in1=h, in2=1.0), uv)
col = g.n('mix', 'color3', name='base_color', bg=(0.42, 0.41, 0.39), fg=(0.15, 0.145, 0.14), mix=dark)
r = g.n('mix', name='roughness', bg=0.75, fg=0.95, mix=dark)
open(sys.argv[1], 'w').write(std(g, 'Masks: 3x2 cells, top = naive, bottom = better. Cols: specks | crack presence | union of domes. UV 1 = 1 m.', col, r, n))
