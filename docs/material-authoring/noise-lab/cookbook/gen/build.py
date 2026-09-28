import os, sys
S = os.path.join(os.path.dirname(os.path.abspath(__file__)), 's')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
def frag(n): return open(os.path.join(S, n + '.xml')).read().strip()

def f(name, v):  # float input: node name or literal
    return (f'<input name="{name}" type="float" value="{v}" />' if isinstance(v, (int, float))
            else f'<input name="{name}" type="float" nodename="{v}" />')
def c(name, v):
    return (f'<input name="{name}" type="color3" value="{v}" />' if ',' in v
            else f'<input name="{name}" type="color3" nodename="{v}" />')

def quad(out, typ, tl, tr, bl, br):
    w = f if typ == 'float' else c
    if len({tl, tr, bl, br}) == 1:  # whole tile: one pass-through, not a 4x copy of the graph
        return f'<add name="{out}" type="{typ}">{w("in1", tl)}{w("in2", 0 if typ == "float" else "0, 0, 0")}</add>'
    return '\n'.join([
        f'<mix name="{out}_t" type="{typ}">{w("bg", tl)}{w("fg", tr)}<input name="mix" type="float" nodename="q_right" /></mix>',
        f'<mix name="{out}_b" type="{typ}">{w("bg", bl)}{w("fg", br)}<input name="mix" type="float" nodename="q_right" /></mix>',
        f'<mix name="{out}" type="{typ}"><input name="bg" type="{typ}" nodename="{out}_b" /><input name="fg" type="{typ}" nodename="{out}_t" /><input name="mix" type="float" nodename="q_top" /></mix>'])

def build(name, desc, frags, glue, h, col, rough, tail=(), nrm='n_world', extra=None):
    # tail: fragments after the normal snippet (they may read height or n_world); extra: {shader input: (type, node or value)}
    body = [f'<!-- {desc} -->', '<texcoord name="uv" type="vector2" />',
      '<separate2 name="uv_sep" type="multioutput"><input name="in" type="vector2" nodename="uv" /></separate2>',
      '<ifgreater name="q_right" type="float"><input name="value1" type="float" nodename="uv_sep" output="outx" /><input name="value2" type="float" value="0.5" /><input name="in1" type="float" value="1" /><input name="in2" type="float" value="0" /></ifgreater>',
      '<ifgreater name="q_top" type="float"><input name="value1" type="float" nodename="uv_sep" output="outy" /><input name="value2" type="float" value="0.5" /><input name="in1" type="float" value="1" /><input name="in2" type="float" value="0" /></ifgreater>']
    for fr in frags: body += ['', f'<!-- snippet: {fr} -->', frag(fr)]
    body += ['', '<!-- test glue -->', glue.strip(), quad('height', 'float', *h), quad('base_color', 'color3', *col),
             quad('roughness', 'float', *rough), '<constant name="metalness" type="float"><input name="value" type="float" value="0" /></constant>',
             '', '<!-- snippet: normal -->', frag('normal')]
    for fr in tail: body += ['', f'<!-- snippet: {fr} -->', frag(fr)]
    used = '\n'.join(body[5:])
    body = [l for l in body if not (('name="q_right"' in l and 'nodename="q_right"' not in used) or ('name="q_top"' in l and 'nodename="q_top"' not in used))]
    ng = '\n'.join('    ' + l if l else '' for l in '\n'.join(body).split('\n'))
    xo = xi = ''
    for k, (t, v) in (extra or {}).items():
        if isinstance(v, str):
            xo += f'    <output name="{k}_out" type="{t}" nodename="{v}" />\n'
            xi += f'    <input name="{k}" type="{t}" nodegraph="NG_{name}" output="{k}_out" />\n'
        else:
            xi += f'    <input name="{k}" type="{t}" value="{v}" />\n'
    doc = f'''<?xml version="1.0"?>
<materialx version="1.39" colorspace="lin_rec709">
  <!-- NOISE_COOKBOOK.md test material. UV 1 = 1 m. Quadrants: {desc} -->
  <nodegraph name="NG_{name}">
{ng}
    <output name="base_color_out" type="color3" nodename="base_color" />
    <output name="roughness_out" type="float" nodename="roughness" />
    <output name="normal_out" type="vector3" nodename="{nrm}" />
    <output name="metalness_out" type="float" nodename="metalness" />
{xo}  </nodegraph>
  <standard_surface name="SR_{name}" type="surfaceshader">
    <input name="base" type="float" value="1" />
    <input name="base_color" type="color3" nodegraph="NG_{name}" output="base_color_out" />
    <input name="specular" type="float" value="0.5" />
    <input name="specular_IOR" type="float" value="1.5" />
    <input name="specular_roughness" type="float" nodegraph="NG_{name}" output="roughness_out" />
    <input name="metalness" type="float" nodegraph="NG_{name}" output="metalness_out" />
    <input name="normal" type="vector3" nodegraph="NG_{name}" output="normal_out" />
{xi}  </standard_surface>
  <surfacematerial name="M_{name}" type="material"><input name="surfaceshader" type="surfaceshader" nodename="SR_{name}" /></surfacematerial>
</materialx>
'''
    open(os.path.join(OUT, name + '.mtlx'), 'w').write(doc)

G = '0.36, 0.35, 0.33'
build('cookbook_smooth', 'TL ridged, TR billow, BL terraces, BR macro/meso/micro layers',
  ['decorrelate', 'remap', 'unified', 'ridged', 'terraces', 'layers'], '''
<multiply name="h_ridge" type="float"><input name="in1" type="float" nodename="ridged" /><input name="in2" type="float" value="0.004" /></multiply>
<multiply name="h_billow" type="float"><input name="in1" type="float" nodename="billow" /><input name="in2" type="float" value="0.004" /></multiply>
<multiply name="h_terr" type="float"><input name="in1" type="float" nodename="terraced" /><input name="in2" type="float" value="0.0006" /></multiply>
<mix name="col_n" type="color3"><input name="bg" type="color3" value="0.28, 0.27, 0.25" /><input name="fg" type="color3" value="0.46, 0.45, 0.43" /><input name="mix" type="float" nodename="n01" /></mix>
<mix name="col_f" type="color3"><input name="bg" type="color3" value="0.28, 0.27, 0.25" /><input name="fg" type="color3" value="0.46, 0.45, 0.43" /><input name="mix" type="float" nodename="fbm01" /></mix>
<mix name="col_u" type="color3"><input name="bg" type="color3" value="0.28, 0.27, 0.25" /><input name="fg" type="color3" value="0.46, 0.45, 0.43" /><input name="mix" type="float" nodename="u_fbm01" /></mix>
''', ('h_ridge', 'h_billow', 'h_terr', 'h_layers'), ('col_n', 'col_n', 'col_f', 'col_u'), (0.8, 0.8, 0.8, 0.8))

build('cookbook_cells_a', 'TL round pits, TR domed pebbles, BL angular stones, BR faceted chips',
  ['pits', 'pebbles', 'stones', 'chips'], f'''
<mix name="col_pit" type="color3"><input name="bg" type="color3" value="{G}" /><input name="fg" type="color3" value="0.17, 0.165, 0.16" /><input name="mix" type="float" nodename="p_bowl" /></mix>
<mix name="col_peb" type="color3"><input name="bg" type="color3" value="0.3, 0.29, 0.27" /><input name="fg" type="color3" nodename="b_col" /><input name="mix" type="float" nodename="b_mask" /></mix>
''', ('h_pits', 'h_peb', 'h_stone', 'h_chip'), ('col_pit', 'col_peb', 'a_col', G), (0.85, 0.8, 0.7, 0.88))

build('cookbook_cells_b', 'TL tapering cracks, TR flagstones, BL terrazzo palette, BR sparse features (worley below v=0.25, manual grid above)',
  ['warp', 'cracks', 'flag', 'palette', 'sparse', 'grid'], f'''
<multiply name="h_terz" type="float"><input name="in1" type="float" nodename="t_chip" /><input name="in2" type="float" value="0.0004" /></multiply>
<ifgreater name="h_sp" type="float"><input name="value1" type="float" nodename="uv_sep" output="outy" /><input name="value2" type="float" value="0.25" /><input name="in1" type="float" nodename="h_grid" /><input name="in2" type="float" nodename="h_sparse" /></ifgreater>
<ifgreater name="m_sp" type="float"><input name="value1" type="float" nodename="uv_sep" output="outy" /><input name="value2" type="float" value="0.25" /><input name="in1" type="float" nodename="g_mask" /><input name="in2" type="float" nodename="v_mask" /></ifgreater>
<mix name="col_sp" type="color3"><input name="bg" type="color3" value="{G}" /><input name="fg" type="color3" value="0.5, 0.3, 0.2" /><input name="mix" type="float" nodename="m_sp" /></mix>
<mix name="col_fl0" type="color3"><input name="bg" type="color3" value="0.45, 0.42, 0.38" /><input name="fg" type="color3" value="0.28, 0.27, 0.26" /><input name="mix" type="float" nodename="f_id" /></mix>
<mix name="col_fl" type="color3"><input name="bg" type="color3" value="0.2, 0.19, 0.18" /><input name="fg" type="color3" nodename="col_fl0" /><input name="mix" type="float" nodename="f_top" /></mix>
<mix name="col_tz" type="color3"><input name="bg" type="color3" value="0.62, 0.6, 0.56" /><input name="fg" type="color3" nodename="t_col" /><input name="mix" type="float" nodename="t_chip" /></mix>
<mix name="col_cr" type="color3"><input name="bg" type="color3" value="{G}" /><input name="fg" type="color3" value="0.12, 0.12, 0.11" /><input name="mix" type="float" nodename="crack" /></mix>
''', ('h_crack', 'h_flag', 'h_terz', 'h_sp'), ('col_cr', 'col_fl', 'col_tz', 'col_sp'), (0.85, 0.8, 0.35, 0.85))

build('cookbook_misc', 'TL broom strokes + anisotropic tint, TR per-band broom, BL smooth max of two noises + FD slope tint, BR correlated cavity/wear',
  ['aniso', 'broom', 'bands', 'bandbroom', 'fd', 'smax', 'cavity'], f'''
<multiply name="sm_pa" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="6" /></multiply>
<add name="sm_pb" type="vector2"><input name="in1" type="vector2" nodename="sm_pa" /><input name="in2" type="vector2" value="5.3, 2.9" /></add>
<noise2d name="sm_a" type="float"><input name="texcoord" type="vector2" nodename="sm_pa" /></noise2d>
<noise2d name="sm_b" type="float"><input name="texcoord" type="vector2" nodename="sm_pb" /></noise2d>
<multiply name="h_smax" type="float"><input name="in1" type="float" nodename="smax" /><input name="in2" type="float" value="0.01" /></multiply>
<mix name="cw_col0" type="color3"><input name="bg" type="color3" value="0.36, 0.35, 0.33" /><input name="fg" type="color3" value="0.16, 0.15, 0.14" /><input name="mix" type="float" nodename="cavity" /></mix>
<mix name="rock_col" type="color3"><input name="bg" type="color3" nodename="cw_col0" /><input name="fg" type="color3" value="0.56, 0.55, 0.53" /><input name="mix" type="float" nodename="wear" /></mix>
<mix name="cw_r0" type="float"><input name="bg" type="float" value="0.8" /><input name="fg" type="float" value="0.95" /><input name="mix" type="float" nodename="cavity" /></mix>
<mix name="rock_rough" type="float"><input name="bg" type="float" nodename="cw_r0" /><input name="fg" type="float" value="0.45" /><input name="mix" type="float" nodename="wear" /></mix>
<mix name="col_an" type="color3"><input name="bg" type="color3" value="0.34, 0.33, 0.31" /><input name="fg" type="color3" value="0.44, 0.43, 0.41" /><input name="mix" type="float" nodename="n_an" /></mix>
<smoothstep name="fd_m" type="float"><input name="in" type="float" nodename="fd_slope" /><input name="low" type="float" value="0.02" /><input name="high" type="float" value="0.06" /></smoothstep>
<mix name="col_fd" type="color3"><input name="bg" type="color3" value="{G}" /><input name="fg" type="color3" value="0.5, 0.25, 0.15" /><input name="mix" type="float" nodename="fd_m" /></mix>
''', ('h_broom', 'h_band', 'h_smax', 'h_rock'), ('col_an', G, 'col_fd', 'rock_col'), (0.8, 0.8, 0.8, 'rock_rough'))

build('cookbook_layouts', 'TL running bond + rounded rect + cushion edge, TR hex, BL herringbone, BR random-length planks',
  ['lay_bond', 'edge_rrect', 'edge_cushion', 'lay_hex', 'lay_herr', 'lay_plank'], f'''
<smoothstep name="hx_pr" type="float"><input name="in" type="float" nodename="hx_d" /><input name="low" type="float" value="-0.0005" /><input name="high" type="float" value="0.0015" /></smoothstep>
<multiply name="h_hx" type="float"><input name="in1" type="float" nodename="hx_pr" /><input name="in2" type="float" value="0.0008" /></multiply>
<smoothstep name="hb_pr" type="float"><input name="in" type="float" nodename="hb_d" /><input name="low" type="float" value="-0.0004" /><input name="high" type="float" value="0.0012" /></smoothstep>
<multiply name="h_hb" type="float"><input name="in1" type="float" nodename="hb_pr" /><input name="in2" type="float" value="0.0007" /></multiply>
<smoothstep name="pk_pr" type="float"><input name="in" type="float" nodename="pk_d" /><input name="low" type="float" value="-0.0005" /><input name="high" type="float" value="0.0015" /></smoothstep>
<multiply name="h_pk" type="float"><input name="in1" type="float" nodename="pk_pr" /><input name="in2" type="float" value="0.0008" /></multiply>
<mix name="col_rg0" type="color3"><input name="bg" type="color3" value="0.62, 0.6, 0.55" /><input name="fg" type="color3" value="0.3, 0.42, 0.5" /><input name="mix" type="float" nodename="rg_id" /></mix>
<mix name="col_rg" type="color3"><input name="bg" type="color3" value="{G}" /><input name="fg" type="color3" nodename="col_rg0" /><input name="mix" type="float" nodename="cu_tile" /></mix>
<mix name="col_hx0" type="color3"><input name="bg" type="color3" value="0.7, 0.68, 0.64" /><input name="fg" type="color3" value="0.2, 0.3, 0.25" /><input name="mix" type="float" nodename="hx_id" /></mix>
<mix name="col_hx" type="color3"><input name="bg" type="color3" value="{G}" /><input name="fg" type="color3" nodename="col_hx0" /><input name="mix" type="float" nodename="hx_tile" /></mix>
<mix name="col_hb0" type="color3"><input name="bg" type="color3" value="0.65, 0.64, 0.62" /><input name="fg" type="color3" value="0.4, 0.4, 0.42" /><input name="mix" type="float" nodename="hb_id" /></mix>
<mix name="col_hb" type="color3"><input name="bg" type="color3" value="{G}" /><input name="fg" type="color3" nodename="col_hb0" /><input name="mix" type="float" nodename="hb_tile" /></mix>
<mix name="col_pk0" type="color3"><input name="bg" type="color3" value="0.45, 0.28, 0.14" /><input name="fg" type="color3" value="0.25, 0.14, 0.07" /><input name="mix" type="float" nodename="pk_id" /></mix>
<mix name="col_pk" type="color3"><input name="bg" type="color3" value="0.05, 0.035, 0.02" /><input name="fg" type="color3" nodename="col_pk0" /><input name="mix" type="float" nodename="pk_tile" /></mix>
<mix name="r_rg" type="float"><input name="bg" type="float" value="0.9" /><input name="fg" type="float" value="0.3" /><input name="mix" type="float" nodename="rg_tile" /></mix>
''', ('h_cush', 'h_hx', 'h_hb', 'h_pk'), ('col_rg', 'col_hx', 'col_hb', 'col_pk'), ('r_rg', 0.4, 0.35, 0.5))

build('cookbook_surface', 'TL marble veins in per-tile slab coords, TR true-distance cracks + child layer, BL hand-cut outline + per-tile reseed, BR sparse scuffs',
  ['lay_bond', 'vary', 'veins', 'warp', 'crack_true', 'crack_child', 'edge_hand', 'scuffs'], f'''
<smoothstep name="mb_pr" type="float"><input name="in" type="float" nodename="rg_d" /><input name="low" type="float" value="-0.0005" /><input name="high" type="float" value="0.0015" /></smoothstep>
<multiply name="h_mb" type="float"><input name="in1" type="float" nodename="mb_pr" /><input name="in2" type="float" value="0.0008" /></multiply>
<mix name="col_mb0" type="color3"><input name="bg" type="color3" value="0.72, 0.71, 0.69" /><input name="fg" type="color3" value="0.3, 0.31, 0.33" /><input name="mix" type="float" nodename="mv_vein" /></mix>
<mix name="col_mb" type="color3"><input name="bg" type="color3" value="{G}" /><input name="fg" type="color3" nodename="col_mb0" /><input name="mix" type="float" nodename="rg_tile" /></mix>
<mix name="col_cr2" type="color3"><input name="bg" type="color3" value="0.6, 0.58, 0.52" /><input name="fg" type="color3" value="0.12, 0.11, 0.1" /><input name="mix" type="float" nodename="hc_crack" /></mix>
<smoothstep name="hm_pr" type="float"><input name="in" type="float" nodename="hm_d" /><input name="low" type="float" value="0" /><input name="high" type="float" value="0.004" /></smoothstep>
<multiply name="hm_und" type="float"><input name="in1" type="float" nodename="rs_n" /><input name="in2" type="float" value="0.0003" /></multiply>
<add name="hm_top" type="float"><input name="in1" type="float" nodename="hm_und" /><input name="in2" type="float" value="0.0015" /></add>
<multiply name="h_hm" type="float"><input name="in1" type="float" nodename="hm_pr" /><input name="in2" type="float" nodename="hm_top" /></multiply>
<mix name="col_hm0" type="color3"><input name="bg" type="color3" value="0.03, 0.16, 0.12" /><input name="fg" type="color3" value="0.06, 0.25, 0.2" /><input name="mix" type="float" nodename="rg_id" /></mix>
<smoothstep name="hm_tl" type="float"><input name="in" type="float" nodename="hm_d" /><input name="low" type="float" value="-0.0002" /><input name="high" type="float" value="0.0002" /></smoothstep>
<mix name="col_hm" type="color3"><input name="bg" type="color3" value="0.55, 0.53, 0.5" /><input name="fg" type="color3" nodename="col_hm0" /><input name="mix" type="float" nodename="hm_tl" /></mix>
<mix name="col_sc" type="color3"><input name="bg" type="color3" value="0.08, 0.08, 0.085" /><input name="fg" type="color3" value="0.2, 0.2, 0.2" /><input name="mix" type="float" nodename="sc_mask" /></mix>
<mix name="r_sc" type="float"><input name="bg" type="float" value="0.15" /><input name="fg" type="float" value="0.5" /><input name="mix" type="float" nodename="sc_mask" /></mix>
''', ('h_mb', 'h_hcrack', 'h_hm', 'h_scuff'), ('col_mb', 'col_cr2', 'col_hm', 'col_sc'), (0.35, 0.8, 0.1, 'r_sc'))

# ---- round 3: wood, chevron, stagger planks, variable rows, scoops, dents, polar (fragments from frags.py)
WOOD = ['lay_stagger', 'wood_knot', 'wood_rings', 'wood_pores', 'wood_fleck', 'wood_color', 'wood_height']
build('cookbook_wood', 'whole tile: white oak, guaranteed-stagger planks, plain + quarter sawn, knots, pores, fleck, wire-brushed earlywood, micro-bevel',
  WOOD, '''
<divide name="wb_x0" type="float"><input name="in1" type="float" nodename="pk_d" /><input name="in2" type="float" value="0.0016" /></divide>
<clamp name="wb_x" type="float"><input name="in" type="float" nodename="wb_x0" /></clamp>
<subtract name="wb_o" type="float"><input name="in1" type="float" value="1" /><input name="in2" type="float" nodename="wb_x" /></subtract>
<multiply name="wb_o2" type="float"><input name="in1" type="float" nodename="wb_o" /><input name="in2" type="float" nodename="wb_o" /></multiply>
<multiply name="wb_bev" type="float"><input name="in1" type="float" nodename="wb_o2" /><input name="in2" type="float" nodename="wb_o" /></multiply>
<multiply name="wb_h" type="float"><input name="in1" type="float" nodename="wb_bev" /><input name="in2" type="float" value="-0.00035" /></multiply>
<add name="h_floor" type="float"><input name="in1" type="float" nodename="h_wood" /><input name="in2" type="float" nodename="wb_h" /></add>
<smoothstep name="wb_j0" type="float"><input name="in" type="float" nodename="pk_d" /><input name="low" type="float" value="0" /><input name="high" type="float" value="0.0009" /></smoothstep>
<subtract name="wb_j" type="float"><input name="in1" type="float" value="1" /><input name="in2" type="float" nodename="wb_j0" /></subtract>
<multiply name="wb_j9" type="float"><input name="in1" type="float" nodename="wb_j" /><input name="in2" type="float" value="0.9" /></multiply>
<mix name="col_wood" type="color3"><input name="bg" type="color3" nodename="wd_col" /><input name="fg" type="color3" value="0.05, 0.032, 0.018" /><input name="mix" type="float" nodename="wb_j9" /></mix>
<mix name="r_wood0" type="float"><input name="bg" type="float" nodename="wd_rough" /><input name="fg" type="float" value="0.8" /><input name="mix" type="float" nodename="wb_j" /></mix>
<mix name="r_wood" type="float"><input name="bg" type="float" value="0.85" /><input name="fg" type="float" nodename="r_wood0" /><input name="mix" type="float" nodename="pk_tile" /></mix>
''', ('h_floor',) * 4, ('col_wood',) * 4, ('r_wood',) * 4)

build('cookbook_wood_end', 'whole tile: oiled oak end-grain blocks (150 x 75 mm half bond), ring arcs round an off-block pith, rays and radial checks from the polar recipe',
  ['lay_bond', 'wood_end', 'polar'], '''
<add name="po_rel" type="vector2"><input name="in1" type="vector2" nodename="eg_rel" /><input name="in2" type="vector2" value="0, 0" /></add>
<multiply name="po_seed" type="float"><input name="in1" type="float" nodename="rg_id" /><input name="in2" type="float" value="613" /></multiply>
<mix name="eg_c0" type="color3"><input name="bg" type="color3" value="0.1, 0.055, 0.028" /><input name="fg" type="color3" value="0.3, 0.17, 0.085" /><input name="mix" type="float" nodename="rg_id" /></mix>
<mix name="eg_lwc" type="color3"><input name="bg" type="color3" value="1, 1, 1" /><input name="fg" type="color3" value="0.55, 0.46, 0.4" /><input name="mix" type="float" nodename="eg_lw" /></mix>
<multiply name="eg_c1" type="color3"><input name="in1" type="color3" nodename="eg_c0" /><input name="in2" type="color3" nodename="eg_lwc" /></multiply>
<multiply name="eg_ewd0" type="float"><input name="in1" type="float" nodename="eg_ew" /><input name="in2" type="float" value="-0.12" /></multiply>
<multiply name="eg_ray0" type="float"><input name="in1" type="float" nodename="po_ray" /><input name="in2" type="float" value="0.12" /></multiply>
<add name="eg_br" type="float"><input name="in1" type="float" nodename="eg_ewd0" /><input name="in2" type="float" nodename="eg_ray0" /></add>
<add name="eg_br1" type="float"><input name="in1" type="float" nodename="eg_br" /><input name="in2" type="float" value="1" /></add>
<multiply name="eg_c2" type="color3"><input name="in1" type="color3" nodename="eg_c1" /><input name="in2" type="float" nodename="eg_br1" /></multiply>
<multiply name="eg_ck9" type="float"><input name="in1" type="float" nodename="po_check" /><input name="in2" type="float" value="0.9" /></multiply>
<mix name="eg_c3" type="color3"><input name="bg" type="color3" nodename="eg_c2" /><input name="fg" type="color3" value="0.018, 0.013, 0.01" /><input name="mix" type="float" nodename="eg_ck9" /></mix>
<mix name="col_eg" type="color3"><input name="bg" type="color3" value="0.03, 0.025, 0.02" /><input name="fg" type="color3" nodename="eg_c3" /><input name="mix" type="float" nodename="rg_tile" /></mix>
<multiply name="eg_hl" type="float"><input name="in1" type="float" nodename="eg_lw" /><input name="in2" type="float" value="0.000008" /></multiply>
<multiply name="eg_hc" type="float"><input name="in1" type="float" nodename="po_check" /><input name="in2" type="float" value="-0.0002" /></multiply>
<add name="eg_top" type="float"><input name="in1" type="float" nodename="eg_hl" /><input name="in2" type="float" nodename="eg_hc" /></add>
<smoothstep name="eg_ease" type="float"><input name="in" type="float" nodename="rg_d" /><input name="low" type="float" value="-0.0005" /><input name="high" type="float" value="0.0011" /></smoothstep>
<mix name="h_eg" type="float"><input name="bg" type="float" value="-0.0004" /><input name="fg" type="float" nodename="eg_top" /><input name="mix" type="float" nodename="eg_ease" /></mix>
<multiply name="eg_r0" type="float"><input name="in1" type="float" nodename="eg_ew" /><input name="in2" type="float" value="0.08" /></multiply>
<multiply name="eg_r1" type="float"><input name="in1" type="float" nodename="eg_lw" /><input name="in2" type="float" value="-0.06" /></multiply>
<multiply name="eg_r2" type="float"><input name="in1" type="float" nodename="po_check" /><input name="in2" type="float" value="0.12" /></multiply>
<add name="eg_r3" type="float"><input name="in1" type="float" nodename="eg_r0" /><input name="in2" type="float" nodename="eg_r1" /></add>
<add name="eg_r4" type="float"><input name="in1" type="float" nodename="eg_r3" /><input name="in2" type="float" nodename="eg_r2" /></add>
<add name="eg_r5" type="float"><input name="in1" type="float" nodename="eg_r4" /><input name="in2" type="float" value="0.66" /></add>
<mix name="r_eg" type="float"><input name="bg" type="float" value="0.88" /><input name="fg" type="float" nodename="eg_r5" /><input name="mix" type="float" nodename="rg_tile" /></mix>
''', ('h_eg',) * 4, ('col_eg',) * 4, ('r_eg',) * 4)

def lay_glue(p, c1, c2):  # joint profile + id colour for one layout prefix
    return f'''
<smoothstep name="{p}_pr" type="float"><input name="in" type="float" nodename="{p}_d" /><input name="low" type="float" value="-0.0005" /><input name="high" type="float" value="0.0015" /></smoothstep>
<multiply name="h_{p}" type="float"><input name="in1" type="float" nodename="{p}_pr" /><input name="in2" type="float" value="0.0008" /></multiply>
<mix name="col_{p}0" type="color3"><input name="bg" type="color3" value="{c1}" /><input name="fg" type="color3" value="{c2}" /><input name="mix" type="float" nodename="{p}_id" /></mix>
<mix name="col_{p}" type="color3"><input name="bg" type="color3" value="0.05, 0.035, 0.02" /><input name="fg" type="color3" nodename="col_{p}0" /><input name="mix" type="float" nodename="{p}_tile" /></mix>'''

build('cookbook_layouts2', 'TL chevron, TR variable-width rows, bottom guaranteed-stagger planks',
  ['lay_chevron', 'lay_rows', 'lay_stagger'],
  lay_glue('cv', '0.45, 0.28, 0.14', '0.2, 0.12, 0.06') + '''
<separate2 name="cv_ls" type="multioutput"><input name="in" type="vector2" nodename="cv_loc" /></separate2>
<multiply name="cv_g0" type="float"><input name="in1" type="float" nodename="cv_ls" output="outx" /><input name="in2" type="float" value="2" /></multiply>
<add name="cv_g" type="float"><input name="in1" type="float" nodename="cv_g0" /><input name="in2" type="float" value="1" /></add>
<multiply name="col_cvg" type="color3"><input name="in1" type="color3" nodename="col_cv" /><input name="in2" type="float" nodename="cv_g" /></multiply>''' + lay_glue('vw', '0.5, 0.36, 0.2', '0.3, 0.18, 0.08') + lay_glue('pk', '0.45, 0.28, 0.14', '0.25, 0.14, 0.07'),
  ('h_cv', 'h_vw', 'h_pk', 'h_pk'), ('col_cvg', 'col_vw', 'col_pk', 'col_pk'), (0.5, 0.5, 0.5, 0.5))

build('cookbook_surface2', 'TL hand-scraped scoops, TR crisp-rim dents, BL radial checks and rays round the quadrant centre, BR the same dents as (1 - t^2) bowls (reads as domes)',
  ['scoops', 'dents', 'polar'], f'''
<multiply name="sc_pl" type="float"><input name="in1" type="float" nodename="sc_pool" /><input name="in2" type="float" value="0.3" /></multiply>
<mix name="col_sc" type="color3"><input name="bg" type="color3" value="0.34, 0.2, 0.1" /><input name="fg" type="color3" value="0.2, 0.11, 0.05" /><input name="mix" type="float" nodename="sc_pl" /></mix>
<mix name="r_sc2" type="float"><input name="bg" type="float" value="0.45" /><input name="fg" type="float" value="0.6" /><input name="mix" type="float" nodename="sc_crest" /></mix>
<mix name="col_dn" type="color3"><input name="bg" type="color3" value="0.4, 0.26, 0.13" /><input name="fg" type="color3" value="0.3, 0.19, 0.09" /><input name="mix" type="float" nodename="dn_dent" /></mix>
<subtract name="po_rel" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="vector2" value="0.25, 0.25" /></subtract>
<constant name="po_seed" type="float"><input name="value" type="float" value="0.37" /></constant>
<multiply name="po_ray1" type="float"><input name="in1" type="float" nodename="po_ray" /><input name="in2" type="float" value="0.25" /></multiply>
<mix name="col_po0" type="color3"><input name="bg" type="color3" value="0.4, 0.26, 0.13" /><input name="fg" type="color3" value="0.5, 0.36, 0.2" /><input name="mix" type="float" nodename="po_ray1" /></mix>
<mix name="col_po" type="color3"><input name="bg" type="color3" nodename="col_po0" /><input name="fg" type="color3" value="0.03, 0.02, 0.015" /><input name="mix" type="float" nodename="po_check" /></mix>
<multiply name="h_po" type="float"><input name="in1" type="float" nodename="po_check" /><input name="in2" type="float" value="-0.0002" /></multiply>
<multiply name="dn_t2" type="float"><input name="in1" type="float" nodename="dn_t" /><input name="in2" type="float" nodename="dn_t" /></multiply>
<subtract name="dn_b0" type="float"><input name="in1" type="float" value="1" /><input name="in2" type="float" nodename="dn_t2" /></subtract>
<max name="dn_b1" type="float"><input name="in1" type="float" nodename="dn_b0" /><input name="in2" type="float" value="0" /></max>
<multiply name="dn_bowl" type="float"><input name="in1" type="float" nodename="dn_b1" /><input name="in2" type="float" nodename="dn_on" /></multiply>
<multiply name="dn_bd" type="float"><input name="in1" type="float" nodename="dn_r" /><input name="in2" type="float" value="-0.0035" /></multiply>
<multiply name="h_bowl" type="float"><input name="in1" type="float" nodename="dn_bowl" /><input name="in2" type="float" nodename="dn_bd" /></multiply>
<mix name="col_bw" type="color3"><input name="bg" type="color3" value="0.4, 0.26, 0.13" /><input name="fg" type="color3" value="0.3, 0.19, 0.09" /><input name="mix" type="float" nodename="dn_bowl" /></mix>
''', ('h_scoop', 'h_dent', 'h_po', 'h_bowl'), ('col_sc', 'col_dn', 'col_po', 'col_bw'), ('r_sc2', 0.6, 0.6, 0.6))

# ---- round 4: wall panelling (profiles, book-match and lacquer, panel wood, rough-sawn and weathered surfaces)
build('cookbook_profiles', 'TL beadboard moulding + zero-at-joint bows, TR recessed Shaker step + per-member seeds, BL 19 mm batten over a cupped board, BR slats over a deep channel with AO',
  ['prof_mould', 'prof_bow', 'prof_step', 'prof_batten', 'prof_over', 'prof_channel'], '''
<add name="h_bb" type="float"><input name="in1" type="float" nodename="h_mould" /><input name="in2" type="float" nodename="h_bow" /></add>
<mix name="bb_cav" type="color3"><input name="bg" type="color3" value="1, 1, 1" /><input name="fg" type="color3" value="0.62, 0.6, 0.56" /><input name="mix" type="float" nodename="mb_cav" /></mix>
<multiply name="col_bb" type="color3"><input name="in1" type="color3" value="0.8, 0.78, 0.725" /><input name="in2" type="color3" nodename="bb_cav" /></multiply>
<multiply name="ps_t0" type="float"><input name="in1" type="float" nodename="ps_tone" /><input name="in2" type="float" value="0.25" /></multiply>
<add name="ps_t1" type="float"><input name="in1" type="float" nodename="ps_t0" /><input name="in2" type="float" value="0.88" /></add>
<mix name="ps_ao" type="float"><input name="bg" type="float" value="1" /><input name="fg" type="float" value="0.85" /><input name="mix" type="float" nodename="ps_corner" /></mix>
<multiply name="ps_t2" type="float"><input name="in1" type="float" nodename="ps_t1" /><input name="in2" type="float" nodename="ps_ao" /></multiply>
<multiply name="col_ps" type="color3"><input name="in1" type="color3" value="0.31, 0.38, 0.25" /><input name="in2" type="float" nodename="ps_t2" /></multiply>
<multiply name="col_bt" type="color3"><input name="in1" type="color3" value="0.2, 0.24, 0.3" /><input name="in2" type="float" nodename="bt_ao" /></multiply>
<mix name="ch_c0" type="color3"><input name="bg" type="color3" value="0.17, 0.12, 0.065" /><input name="fg" type="color3" value="0.56, 0.39, 0.21" /><input name="mix" type="float" nodename="ch_face" /></mix>
<multiply name="ch_felt" type="color3"><input name="in1" type="color3" value="0.035, 0.037, 0.042" /><input name="in2" type="float" nodename="ch_ao" /></multiply>
<mix name="col_ch" type="color3"><input name="bg" type="color3" nodename="ch_c0" /><input name="fg" type="color3" nodename="ch_felt" /><input name="mix" type="float" nodename="ch_floor" /></mix>
<mix name="r_ch" type="float"><input name="bg" type="float" value="0.52" /><input name="fg" type="float" value="1" /><input name="mix" type="float" nodename="ch_floor" /></mix>
''', ('h_bb', 'h_step', 'h_bat', 'h_chan'), ('col_bb', 'col_ps', 'col_bt', 'col_ch'), (0.3, 0.4, 0.45, 'r_ch'))

build('cookbook_wood2', 'TL walnut cove flutes with the relief-aware ring fade, TR rift oak from stretched fractal lines, BL rough-sawn pine rows under a whitewash, BR weathered pine: eroded earlywood and along-grain checks (test glue adds a 1.5 mm row joint)',
  ['prof_cove', 'wood_relief', 'wood_straight', 'wood_pine', 'surf_kerf', 'surf_wash', 'wood_erode', 'surf_checks'], '''
<multiply name="wl_tex" type="float"><input name="in1" type="float" nodename="fz_fig" /><input name="in2" type="float" value="-0.000008" /></multiply>
<add name="h_wl" type="float"><input name="in1" type="float" nodename="h_flute" /><input name="in2" type="float" nodename="wl_tex" /></add>
<multiply name="wl_f8" type="float"><input name="in1" type="float" nodename="fz_fig" /><input name="in2" type="float" value="0.8" /></multiply>
<mix name="wl_k" type="color3"><input name="bg" type="color3" value="1, 1, 1" /><input name="fg" type="color3" value="0.62, 0.58, 0.56" /><input name="mix" type="float" nodename="wl_f8" /></mix>
<multiply name="col_wl" type="color3"><input name="in1" type="color3" value="0.12, 0.065, 0.035" /><input name="in2" type="color3" nodename="wl_k" /></multiply>
<multiply name="ws_h1" type="float"><input name="in1" type="float" nodename="ws_late" /><input name="in2" type="float" value="0.000005" /></multiply>
<multiply name="ws_h2" type="float"><input name="in1" type="float" nodename="ws_pore" /><input name="in2" type="float" value="-0.000015" /></multiply>
<add name="h_ws" type="float"><input name="in1" type="float" nodename="ws_h1" /><input name="in2" type="float" nodename="ws_h2" /></add>
<multiply name="ws_s9" type="float"><input name="in1" type="float" nodename="ws_str" /><input name="in2" type="float" value="0.09" /></multiply>
<add name="ws_tone" type="float"><input name="in1" type="float" nodename="ws_s9" /><input name="in2" type="float" value="1" /></add>
<multiply name="ws_c0" type="color3"><input name="in1" type="color3" value="0.57, 0.4, 0.22" /><input name="in2" type="float" nodename="ws_tone" /></multiply>
<mix name="ws_kl" type="color3"><input name="bg" type="color3" value="1, 1, 1" /><input name="fg" type="color3" value="0.66, 0.55, 0.44" /><input name="mix" type="float" nodename="ws_late" /></mix>
<multiply name="ws_c1" type="color3"><input name="in1" type="color3" nodename="ws_c0" /><input name="in2" type="color3" nodename="ws_kl" /></multiply>
<multiply name="ws_p5" type="float"><input name="in1" type="float" nodename="ws_pore" /><input name="in2" type="float" value="0.55" /></multiply>
<mix name="ws_kp" type="color3"><input name="bg" type="color3" value="1, 1, 1" /><input name="fg" type="color3" value="0.5, 0.44, 0.38" /><input name="mix" type="float" nodename="ws_p5" /></mix>
<multiply name="col_ws" type="color3"><input name="in1" type="color3" nodename="ws_c1" /><input name="in2" type="color3" nodename="ws_kp" /></multiply>
<multiply name="sl_lw" type="float"><input name="in1" type="float" nodename="pn_lw" /><input name="in2" type="float" value="0.00005" /></multiply>
<absval name="pn_ac" type="float"><input name="in" type="float" nodename="pn_c" /></absval>
<subtract name="pn_e" type="float"><input name="in1" type="float" value="0.075" /><input name="in2" type="float" nodename="pn_ac" /></subtract>
<smoothstep name="pn_jt" type="float"><input name="in" type="float" nodename="pn_e" /><input name="low" type="float" value="0.0003" /><input name="high" type="float" value="0.0025" /></smoothstep>
<subtract name="pn_j0" type="float"><input name="in1" type="float" nodename="pn_jt" /><input name="in2" type="float" value="1" /></subtract>
<multiply name="pn_jh" type="float"><input name="in1" type="float" nodename="pn_j0" /><input name="in2" type="float" value="0.0015" /></multiply>
<add name="sl_h0" type="float"><input name="in1" type="float" nodename="h_kerf" /><input name="in2" type="float" nodename="sl_lw" /></add>
<add name="h_sl" type="float"><input name="in1" type="float" nodename="sl_h0" /><input name="in2" type="float" nodename="pn_jh" /></add>
<add name="bw_h0" type="float"><input name="in1" type="float" nodename="h_erode" /><input name="in2" type="float" nodename="h_check" /></add>
<add name="h_bw" type="float"><input name="in1" type="float" nodename="bw_h0" /><input name="in2" type="float" nodename="pn_jh" /></add>
<mix name="pn_jk" type="float"><input name="bg" type="float" value="0.25" /><input name="fg" type="float" value="1" /><input name="mix" type="float" nodename="pn_jt" /></mix>
<multiply name="col_sl" type="color3"><input name="in1" type="color3" nodename="wa_col" /><input name="in2" type="float" nodename="pn_jk" /></multiply>
<multiply name="bw_f" type="float"><input name="in1" type="float" nodename="er_fig" /><input name="in2" type="float" value="-0.28" /></multiply>
<add name="bw_t" type="float"><input name="in1" type="float" nodename="bw_f" /><input name="in2" type="float" value="1.12" /></add>
<multiply name="bw_c0" type="color3"><input name="in1" type="color3" value="0.23, 0.22, 0.2" /><input name="in2" type="float" nodename="bw_t" /></multiply>
<multiply name="bw_c9" type="float"><input name="in1" type="float" nodename="ck_check" /><input name="in2" type="float" value="0.9" /></multiply>
<mix name="bw_kc" type="color3"><input name="bg" type="color3" value="1, 1, 1" /><input name="fg" type="color3" value="0.35, 0.3, 0.27" /><input name="mix" type="float" nodename="bw_c9" /></mix>
<multiply name="bw_c1" type="color3"><input name="in1" type="color3" nodename="bw_c0" /><input name="in2" type="color3" nodename="bw_kc" /></multiply>
<multiply name="col_bw" type="color3"><input name="in1" type="color3" nodename="bw_c1" /><input name="in2" type="float" nodename="pn_jk" /></multiply>
''', ('h_wl', 'h_ws', 'h_sl', 'h_bw'), ('col_wl', 'col_ws', 'col_sl', 'col_bw'), (0.45, 0.52, 0.85, 0.9))

build('cookbook_veneer', 'whole tile: book-matched figured anigre, 150 mm leaves, 600 mm panels, satin lacquer coat over a fibre-tilted base normal (chatoyance)',
  ['lay_bookmatch', 'wood_fiddle'], '''
<multiply name="vn_p0" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="3" /></multiply>
<add name="vn_p1" type="vector2"><input name="in1" type="vector2" nodename="vn_p0" /><input name="in2" type="vector2" value="13.1, 71.3" /></add>
<fractal2d name="vn_wave" type="float"><input name="texcoord" type="vector2" nodename="vn_p1" /><input name="amplitude" type="float" value="0.0005" /><input name="octaves" type="integer" value="1" /></fractal2d>
<multiply name="vn_p2" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="120" /></multiply>
<add name="vn_p3" type="vector2"><input name="in1" type="vector2" nodename="vn_p2" /><input name="in2" type="vector2" value="57.7, 21.9" /></add>
<fractal2d name="vn_peel" type="float"><input name="texcoord" type="vector2" nodename="vn_p3" /><input name="amplitude" type="float" value="0.000015" /><input name="octaves" type="integer" value="1" /></fractal2d>
<add name="h_vn" type="float"><input name="in1" type="float" nodename="vn_wave" /><input name="in2" type="float" nodename="vn_peel" /></add>
<multiply name="vn_t0" type="float"><input name="in1" type="float" nodename="lq_fig" /><input name="in2" type="float" value="0.22" /></multiply>
<multiply name="vn_t1" type="float"><input name="in1" type="float" nodename="lq_rb" /><input name="in2" type="float" value="0.1" /></multiply>
<add name="vn_t2" type="float"><input name="in1" type="float" nodename="vn_t0" /><input name="in2" type="float" nodename="vn_t1" /></add>
<add name="vn_t3" type="float"><input name="in1" type="float" nodename="vn_t2" /><input name="in2" type="float" value="1" /></add>
<multiply name="vn_c0" type="color3"><input name="in1" type="color3" value="0.62, 0.4, 0.2" /><input name="in2" type="float" nodename="vn_t3" /></multiply>
<smoothstep name="vn_s0" type="float"><input name="in" type="float" nodename="bm_ds" /><input name="low" type="float" value="0.00005" /><input name="high" type="float" value="0.0002" /></smoothstep>
<mix name="vn_ks" type="color3"><input name="bg" type="color3" value="0.8, 0.75, 0.7" /><input name="fg" type="color3" value="1, 1, 1" /><input name="mix" type="float" nodename="vn_s0" /></mix>
<multiply name="col_vn" type="color3"><input name="in1" type="color3" nodename="vn_c0" /><input name="in2" type="color3" nodename="vn_ks" /></multiply>
<multiply name="vn_r0" type="float"><input name="in1" type="float" nodename="lq_fig" /><input name="in2" type="float" value="-0.06" /></multiply>
<add name="r_vn" type="float"><input name="in1" type="float" nodename="vn_r0" /><input name="in2" type="float" value="0.38" /></add>
''', ('h_vn',) * 4, ('col_vn',) * 4, ('r_vn',) * 4, tail=['wood_lacquer'], nrm='n_base',
  extra={'coat': ('float', 1), 'coat_roughness': ('float', 0.34), 'coat_IOR': ('float', 1.5), 'coat_normal': ('vector3', 'n_world')})

# ---- round 5: concrete (grains, pebbles, voids; sparse cracks, rain, swirls, cross-faded bands; board-formed imprint)
build('cookbook_grains', 'TL packed sand (two rotated F1 dome layers, tint on the domes only), TR rounded river pebbles, BL air voids / bug holes (flat floor + AO), BR sparse 0.8-1.5 mm grit in white paste',
  ['sand', 'grit', 'river', 'voids'], f'''
<multiply name="sd_t6" type="float"><input name="in1" type="float" nodename="sd_tone" /><input name="in2" type="float" value="0.6" /></multiply>
<add name="sd_k" type="float"><input name="in1" type="float" nodename="sd_t6" /><input name="in2" type="float" value="1" /></add>
<multiply name="col_sd" type="color3"><input name="in1" type="color3" value="{G}" /><input name="in2" type="float" nodename="sd_k" /></multiply>
<multiply name="rp_ao0" type="float"><input name="in1" type="float" nodename="rp_near" /><input name="in2" type="float" value="-0.22" /></multiply>
<add name="rp_ao" type="float"><input name="in1" type="float" nodename="rp_ao0" /><input name="in2" type="float" value="1" /></add>
<multiply name="rp_cem" type="color3"><input name="in1" type="color3" value="0.36, 0.355, 0.34" /><input name="in2" type="float" nodename="rp_ao" /></multiply>
<mix name="col_rp" type="color3"><input name="bg" type="color3" nodename="rp_cem" /><input name="fg" type="color3" nodename="rp_col" /><input name="mix" type="float" nodename="rp_stone" /></mix>
<mix name="r_rp" type="float"><input name="bg" type="float" value="0.9" /><input name="fg" type="float" value="0.5" /><input name="mix" type="float" nodename="rp_stone" /></mix>
<multiply name="col_av" type="color3"><input name="in1" type="color3" value="{G}" /><input name="in2" type="float" nodename="av_ao" /></multiply>
<mix name="r_av" type="float"><input name="bg" type="float" value="0.85" /><input name="fg" type="float" value="0.95" /><input name="mix" type="float" nodename="av_m" /></mix>
<multiply name="gt_t3" type="float"><input name="in1" type="float" nodename="gt_tone" /><input name="in2" type="float" value="0.3" /></multiply>
<add name="gt_k" type="float"><input name="in1" type="float" nodename="gt_t3" /><input name="in2" type="float" value="1" /></add>
<multiply name="col_gt" type="color3"><input name="in1" type="color3" value="0.645, 0.625, 0.59" /><input name="in2" type="float" nodename="gt_k" /></multiply>
''', ('h_sand', 'h_river', 'h_void', 'h_grit'), ('col_sd', 'col_rp', 'col_av', 'col_gt'), (0.88, 'r_rp', 'r_av', 0.84))

build('cookbook_weathering', 'TL sparse structural cracks with a dirt halo, TR rain streaks (colour only), BL cross-faded broom passes, BR grinder swirls (roughness only, 0.185 + 0.07)',
  ['crack_sparse', 'rain', 'band_xfade', 'swirl'], f'''
<mix name="sk_k0" type="float"><input name="bg" type="float" value="1" /><input name="fg" type="float" value="0.72" /><input name="mix" type="float" nodename="sk_halo" /></mix>
<mix name="sk_k1" type="float"><input name="bg" type="float" value="1" /><input name="fg" type="float" value="0.2" /><input name="mix" type="float" nodename="sk_crack" /></mix>
<multiply name="sk_k" type="float"><input name="in1" type="float" nodename="sk_k0" /><input name="in2" type="float" nodename="sk_k1" /></multiply>
<multiply name="col_sk" type="color3"><input name="in1" type="color3" value="{G}" /><input name="in2" type="float" nodename="sk_k" /></multiply>
<mix name="rn_k" type="float"><input name="bg" type="float" value="1" /><input name="fg" type="float" value="0.45" /><input name="mix" type="float" nodename="rn_streak" /></mix>
<multiply name="col_rn" type="color3"><input name="in1" type="color3" value="0.3, 0.29, 0.27" /><input name="in2" type="float" nodename="rn_k" /></multiply>
<mix name="r_rn" type="float"><input name="bg" type="float" value="0.92" /><input name="fg" type="float" value="0.86" /><input name="mix" type="float" nodename="rn_streak" /></mix>
<multiply name="bx_t0" type="float"><input name="in1" type="float" nodename="bx_tone" /><input name="in2" type="float" value="0.12" /></multiply>
<add name="bx_k" type="float"><input name="in1" type="float" nodename="bx_t0" /><input name="in2" type="float" value="0.94" /></add>
<multiply name="col_bx" type="color3"><input name="in1" type="color3" value="0.395, 0.385, 0.365" /><input name="in2" type="float" nodename="bx_k" /></multiply>
<multiply name="sw_r7" type="float"><input name="in1" type="float" nodename="sw_swirl" /><input name="in2" type="float" value="0.07" /></multiply>
<add name="r_sw" type="float"><input name="in1" type="float" nodename="sw_r7" /><input name="in2" type="float" value="0.185" /></add>
''', ('h_sk', 0, 'bx_h', 0), ('col_sk', 'col_rn', 'col_bx', '0.3, 0.295, 0.285'), (0.86, 'r_rn', 0.86, 'r_sw'))

build('cookbook_boards', 'whole tile: board-formed concrete, the negative of weathered oak boards (guaranteed-stagger layout, 180 mm rows) with per-cell knots and swirl rings every 0.4 m, grain faded inside the joint fins',
  ['lay_stagger', 'knot_cells', 'wood_rings', 'imprint'], '''
<multiply name="bf_r0" type="float"><input name="in1" type="float" nodename="pk_id" /><input name="in2" type="float" value="211.3" /></multiply>
<add name="bf_r1" type="float"><input name="in1" type="float" nodename="bf_r0" /><input name="in2" type="float" value="0.11" /></add>
<fract name="bf_r" type="float"><input name="in" type="float" nodename="bf_r1" /></fract>
<multiply name="bf_t0" type="float"><input name="in1" type="float" nodename="bf_r" /><input name="in2" type="float" value="0.3" /></multiply>
<add name="bf_t1" type="float"><input name="in1" type="float" nodename="bf_t0" /><input name="in2" type="float" value="0.85" /></add>
<mix name="bf_k" type="float"><input name="bg" type="float" value="1" /><input name="fg" type="float" value="0.78" /><input name="mix" type="float" nodename="im_fin" /></mix>
<max name="bf_kn" type="float"><input name="in1" type="float" nodename="wk_core" /><input name="in2" type="float" nodename="wk_rim" /></max>
<mix name="bf_kc" type="float"><input name="bg" type="float" value="1" /><input name="fg" type="float" value="0.8" /><input name="mix" type="float" nodename="bf_kn" /></mix>
<multiply name="bf_t3" type="float"><input name="in1" type="float" nodename="bf_t1" /><input name="in2" type="float" nodename="bf_k" /></multiply>
<multiply name="bf_t4" type="float"><input name="in1" type="float" nodename="bf_t3" /><input name="in2" type="float" nodename="bf_kc" /></multiply>
<multiply name="bf_b" type="float"><input name="in1" type="float" nodename="wr_band" /><input name="in2" type="float" value="0.05" /></multiply>
<add name="bf_t5" type="float"><input name="in1" type="float" nodename="bf_t4" /><input name="in2" type="float" nodename="bf_b" /></add>
<multiply name="col_bf" type="color3"><input name="in1" type="color3" value="0.345, 0.337, 0.318" /><input name="in2" type="float" nodename="bf_t5" /></multiply>
<mix name="bf_r2" type="float"><input name="bg" type="float" value="0.87" /><input name="fg" type="float" value="0.84" /><input name="mix" type="float" nodename="wr_flank" /></mix>
<mix name="r_bf" type="float"><input name="bg" type="float" value="0.9" /><input name="fg" type="float" nodename="bf_r2" /><input name="mix" type="float" nodename="pk_tile" /></mix>
''', ('h_imp',) * 4, ('col_bf',) * 4, ('r_bf',) * 4)
