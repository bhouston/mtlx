import sys; sys.path.insert(0, '.')
from mx import *
g = G('directional')
uv, x, y = basics(g)
qr, qt = quadrants(g, x, y)
F = 330.0  # ~3 mm stroke spacing across V
# Shared hand wobble: lines wander ~1.5 mm over ~15 cm.
wob = noise(g, uv, (6.0, 3.0), 0.003, name='wobble', comment='Quadrants: BL sin stripes | BR stretched-noise corrugation | TL flat-bottom smoothstep grooves | TR per-band rotated broom.')
v_w = g.n('add', name='v_wob', in1=y, in2=wob)
# BL: sin stripes, 0.15 mm amplitude.
s = g.n('sin', in_=g.n('multiply', in1=v_w, in2=6.2832 * F))
h_sin = g.n('multiply', name='h_sin', in1=s, in2=0.00008)
# BR: two stretched noises (strokes ~30 cm and ~20 cm long), summed and used directly as height.
uvw = g.n('combine2', 'vector2', name='uv_wob', in1=x, in2=v_w)
n1 = noise(g, uvw, (3.0, F), 0.00016, name='stroke_a')
n2 = noise(g, g.n('add', 'vector2', in1=uvw, in2=(0.37, 0.0021)), (5.0, F * 1.4), 0.00011, name='stroke_b')
h_str = g.n('add', name='h_stroke', in1=n1, in2=n2)
# TL: same noise thresholded into flat-bottom grooves.
gm = g.n('smoothstep', name='groove_mask', in_=noise(g, uvw, (3.0, F), 1.0), low=0.15, high=0.25)
h_grv = g.n('multiply', name='h_groove', in1=gm, in2=-0.00015)
# TR: bands ~33 cm tall (wobbly borders) with per-band random angle (+-15 deg via rotate2d, degrees), phase and pressure.
vb = g.n('add', in1=y, in2=noise(g, uv, 2.5, 0.06))
band = g.n('floor', name='band', in_=g.n('multiply', in1=vb, in2=6.0))
def rnd(seed, tag):
    return g.n('cellnoise2d', name=tag, texcoord=g.n('combine2', 'vector2', in1=band, in2=seed))
r1 = rnd(7.5, 'band_rand_angle'); r2 = rnd(19.5, 'band_rand_phase'); r3 = rnd(31.5, 'band_rand_press')
ang = g.n('multiply', name='band_angle', in1=g.n('subtract', in1=r1, in2=0.5), in2=30.0)
ruv = g.n('rotate2d', 'vector2', name='uv_rot', in_=uvw, amount=ang)
ruv2 = g.n('add', 'vector2', in1=ruv, in2=g.n('combine2', 'vector2', in1=0.0, in2=r2))
press = g.n('add', in1=g.n('multiply', in1=r3, in2=0.8), in2=0.4)
h_band = g.n('multiply', name='h_band', in1=g.n('add', in1=noise(g, ruv2, (3.0, F), 0.00016), in2=noise(g, ruv2, (5.0, F * 1.4), 0.00011)), in2=press)
bot = g.n('mix', bg=h_sin, fg=h_str, mix=qr)
top = g.n('mix', bg=h_grv, fg=h_band, mix=qr)
h = g.n('mix', name='height', bg=bot, fg=top, mix=qt)
n = normal(g, h, uv)
col = g.n('constant', 'color3', name='base_color', value=(0.4, 0.39, 0.37))
r = g.n('constant', name='roughness', value=0.8)
open(sys.argv[1], 'w').write(std(g, 'Directional structure: stripes vs strokes, corrugation vs grooves, per-band random rotation. UV 1 = 1 m.', col, r, n))
