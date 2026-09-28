import sys; sys.path.insert(0, '.')
from mx import *
g = G('layering_lod')
uv, x, y = basics(g)
qr, qt = quadrants(g, x, y)
# Slope budget: noise2d(uv*f)*A has typical slope ~1.3*A*f rad (max ~2.7*A*f).
macro = noise(g, uv, 3.0, 0.0067, name='h_macro', comment='Macro: ~30 cm undulation, 6.7 mm amplitude, ~1.5 deg typical slope.')
meso = noise(g, uv, 40.0, 0.001, 'fractal2d', name='h_meso', octaves=3, comment='Meso: ~2.5 cm lumps, 1 mm amplitude, ~3-5 deg.')
micro = noise(g, uv, 1500.0, 0.000036, name='h_micro_ok', comment='Micro: ~0.7 mm grain. Budgeted: 0.036 mm amplitude = ~4 deg.')
hot = noise(g, uv, 1500.0, 0.00024, name='h_micro_hot', comment='Hot micro: 0.24 mm amplitude = ~25 deg. Reads at z20, turns to noise soup at z1.')
# LOD: fraction of three probes that say the pixel is fine enough (J0 = 2e-7, 1e-7, 5e-8 m^2 per pixel; z5 ~4e-7, z20 ~2.6e-8).
l1 = lod_fine(g, uv, 2e-7, 'lod1'); l2 = lod_fine(g, uv, 1e-7, 'lod2'); l3 = lod_fine(g, uv, 5e-8, 'lod3')
lod = g.n('divide', name='lod', in1=g.n('add', in1=g.n('add', in1=l1, in2=l2), in2=l3), in2=3.0)
hot_lod = g.n('multiply', name='h_micro_lod', in1=hot, in2=lod)
# Quadrants: BL budgeted micro | BR hot micro | TL hot micro faded by LOD | TR no micro in the normal.
bottom = g.n('mix', name='micro_bottom', bg=micro, fg=hot, mix=qr)
top = g.n('mix', name='micro_top', bg=hot_lod, fg=0.0, mix=qr)
mic = g.n('mix', name='h_micro', bg=bottom, fg=top, mix=qt)
h = g.n('add', name='height', in1=g.n('add', in1=macro, in2=meso), in2=mic)
n = normal(g, h, uv)
# Colour: mottled by meso layer (shared mask).
mm = g.n('add', in1=g.n('multiply', in1=meso, in2=150.0), in2=0.5)
col = g.n('mix', 'color3', name='base_color', bg=(0.34, 0.33, 0.32), fg=(0.44, 0.43, 0.41), mix=mm)
# Roughness: micro slope the normal no longer carries goes into roughness (TL where LOD fades, TR always).
lost = g.n('mix', name='micro_lost', bg=g.n('subtract', in1=1.0, in2=lod), fg=1.0, mix=qr)
lost_q = g.n('multiply', in1=lost, in2=qt)
r = g.n('add', name='roughness', in1=0.72, in2=g.n('multiply', in1=lost_q, in2=0.2))
open(sys.argv[1], 'w').write(std(g, 'Height layering + slope budget + LOD fade. UV 1 = 1 m, heights in m. Quadrants meet at the tile center.', col, r, n))
