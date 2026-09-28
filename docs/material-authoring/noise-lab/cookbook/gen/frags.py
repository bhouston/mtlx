# Writes the round-3 fragments (wood, chevron, stagger planks, variable rows, scoops, dents, polar) into s/*.xml.
# The fragments, not this script, are the source of truth: build.py tests them, mkmd.py quotes them verbatim.
# `python3 frags.py && python3 build.py && python3 mkmd.py`
import math, os, re, sys
D = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(D, '..', '..', '..', 'tools'))
from mx import G, Ref

# types of nodes that fragments read from other fragments or glue
TYPES = {'height': 'float', 'fl_xc': 'float', 'fl_pid': 'float', 'h_flute': 'float', 'fl_dh': 'float', 'pn_loc': 'vector2', 'pn_rid': 'float', 'pn_col': 'color3', 'pn_lw': 'float', 'pn_ph': 'float', 'pn_fade': 'float', 'pn_sp': 'float', 'kf_saw': 'float', 'kf_groove': 'float', 'bt_m': 'float', 'bt_xb': 'float', 'bm_q': 'vector2', 'bm_a': 'float', 'lq_fig': 'float', 'lq_fib': 'float',
         'uv': 'vector2', 'pk_id': 'float', 'pk_lm': 'float', 'pk_loc': 'vector2', 'pk_cell': 'vector2', 'rg_loc': 'vector2', 'rg_cell': 'vector2',
         'po_rel': 'vector2', 'po_seed': 'float', 'wk_loc': 'vector2', 'wk_bump': 'float', 'wr_lp': 'vector2',
         'wr_t': 'float', 'wr_fig': 'float', 'wr_band': 'float', 'wr_flank': 'float', 'wp_pore': 'float',
         'wf_fleck': 'float', 'wk_core': 'float', 'wk_rim': 'float',
         'pk_d': 'float', 'wr_fig': 'float', 'kc_ring': 'float', 'kc_swirl': 'float'}
U, V = Ref('uv_sep', 'outx'), Ref('uv_sep', 'outy')
TAU = 6.283185


def num(m):
    return ('%.8f' % float(m.group())).rstrip('0')


class F:
    def __init__(s, name, pre, header):
        s.g, s.name, s.pre, s.header, s.i = G(name), name, pre, header, 0
        s.g.types = TYPES

    def n(s, op, t='float', name=None, **k):
        s.i += 1
        return s.g.n(op, t, name=name or f'{s.pre}{s.i}', **k)

    def add(s, a, b, t='float', name=None): return s.n('add', t, name, in1=a, in2=b)
    def sub(s, a, b, t='float', name=None): return s.n('subtract', t, name, in1=a, in2=b)
    def mul(s, a, b, t='float', name=None): return s.n('multiply', t, name, in1=a, in2=b)
    def div(s, a, b, t='float', name=None): return s.n('divide', t, name, in1=a, in2=b)
    def mix(s, bg, fg, m, t='float', name=None): return s.n('mix', t, name, bg=bg, fg=fg, mix=m)
    def ss(s, x, lo, hi, name=None): return s.n('smoothstep', 'float', name, in_=x, low=lo, high=hi)
    def inv(s, x, name=None): return s.sub(1.0, x, name=name)
    def c2(s, a, b, name=None): return s.n('combine2', 'vector2', name, in1=a, in2=b)
    def gt(s, a, b, x=1.0, y=0.0, name=None): return s.n('ifgreater', 'float', name, value1=a, value2=b, in1=x, in2=y)
    def floor(s, x, t='float', name=None): return s.n('floor', t, name, in_=x)
    def cell(s, base, off, name=None): return s.n('cellnoise2d', 'float', name, texcoord=s.add(base, off, 'vector2'))
    def rnd(s, i, salt, name=None):  # extra per-board randoms from pk_id without another cellnoise (renderer bug 6)
        M = (13.73, 29.17, 47.91, 71.33, 97.61, 131.27, 173.89)[i]
        return s.n('fract', 'float', name, in_=s.add(s.mul(Ref('pk_id'), round(M * (1 + salt), 3)), salt))  # salt changes k too, or the randoms correlate
    def sep(s, x, name): s.n('separate2', 'multioutput', name, in_=x); return Ref(name, 'outx'), Ref(name, 'outy')
    def r01(s, idn, k, c, name=None): return s.n('fract', 'float', name, in_=s.add(s.mul(idn, k), c))  # extra random from an id
    def fn1(s, p, f, off, amp=1.0, name=None, octaves=1):  # signed noise on any texcoord: fractal2d (bug 6 safe)
        return s.n('fractal2d', 'float', name, texcoord=s.add(s.mul(p, f, 'vector2'), off, 'vector2'), amplitude=amp, octaves=octaves)
    def smax(s, a, b, k, name=None):  # quadratic smooth max: max + h^2 k/4, h = max(k - |a-b|, 0)/k (a fillet)
        h = s.div(s.n('max', in1=s.sub(k, s.n('absval', in_=s.sub(a, b))), in2=0.0), k)
        return s.add(s.n('max', in1=a, in2=b), s.mul(s.mul(h, h), k / 4), name=name)
    def smin(s, a, b, k, name=None):  # cubic smooth min: min - h^3 k/6 (an arris with continuous curvature)
        h = s.div(s.n('max', in1=s.sub(k, s.n('absval', in_=s.sub(a, b))), in2=0.0), k)
        return s.sub(s.n('min', in1=a, in2=b), s.mul(s.mul(s.mul(h, h), h), k / 6), name=name)

    def save(s):
        lines = [re.sub(r'-?\d+\.?\d*e-\d+', num, l.strip()) for l in s.g.lines]
        open(os.path.join(D, 's', s.name + '.xml'), 'w').write(f'<!-- {s.header} -->\n' + '\n'.join(lines) + '\n')


# ---------------------------------------------------------------- layouts
def lay_stagger():
    ROW, S, W, GAP = 0.18, 1.2, 0.42, 0.0005
    f = F('lay_stagger', 'pk_', f'in: uv_sep. out: pk_loc (board-local m, centred; x along, y across), pk_cell, pk_id, pk_lm (board length, m), pk_d (m to the board edge), pk_tile. Same outputs as the random-length planks, so it drops in. Rows {ROW*1000:g} mm; segment S = {S} m, joint window w = {W}: lengths S(1 +- w) = {S*(1-W):.2f}..{S*(1+W):.2f} m; odd rows shift half a segment, so neighbouring joints are always >= S(0.5 - w) = {S*(0.5-W)*1000:.0f} mm apart; 1 mm joints')
    pv = f.div(V, ROW, name='pk_v')
    row = f.floor(pv, name='pk_row')
    fv = f.sub(pv, row, name='pk_fv')
    par = f.n('modulo', name='pk_par', in1=row, in2=2.0)
    x = f.add(f.div(U, S), f.mul(par, 0.5), name='pk_x')
    k = f.floor(x, name='pk_k')
    fx = f.sub(x, k, name='pk_fx')
    def joint(kk, nm):
        return f.add(f.mul(f.cell(f.c2(kk, row), (11.37, 5.61)), W), round(0.5 - W / 2, 6), name=nm)
    j = joint(k, 'pk_j')
    right = f.gt(fx, j, name='pk_right')
    sg = f.sub(f.mul(right, 2.0), 1.0, name='pk_sg')
    jn = f.add(joint(f.add(k, sg), 'pk_n0'), sg, name='pk_n')
    mid = f.mul(f.add(j, jn), 0.5, name='pk_mid')  # (j+n)/2 and |n-j|: each joint read once (min/max reads both twice, bug 7)
    lm = f.mul(f.n('absval', in_=f.sub(jn, j)), S, name='pk_lm')
    loc = f.c2(f.mul(f.sub(fx, mid), S), f.mul(f.sub(fv, 0.5), ROW), name='pk_loc')
    half = f.c2(f.mul(lm, 0.5), ROW / 2, name='pk_half')
    e = f.sub(f.sub(half, f.n('absval', 'vector2', in_=loc), 'vector2'), GAP, 'vector2', name='pk_e')
    ex, ey = f.sep(e, 'pk_es')
    d = f.n('min', name='pk_d', in1=ex, in2=ey)
    cell = f.c2(f.add(k, right), row, name='pk_cell')
    f.cell(cell, (200.37, 300.61), name='pk_id')
    f.ss(d, -0.00025, 0.00025, name='pk_tile')
    f.save()


def lay_chevron():
    W, HC, GAP = 0.09, 0.25, 0.0005
    P, R2 = round(W * math.sqrt(2), 6), round(1 / math.sqrt(2), 6)
    f = F('lay_chevron', 'cv_', f'in: uv_sep. out: cv_loc (block-local m, centred; x along the block axis, y across), cv_cell, cv_id, cv_d (m to the block edge), cv_tile. Columns 2*HC = {2*HC} m along U, each split into two half-columns; {W*1000:g} mm blocks at 45 deg, mitred ends on the vertical half-column lines. Long joints: left s = v - x, right s = v + x - 2*HC (continuous at both lines, points toward +V); block k owns P*k <= s < P*(k+1), P = W*sqrt(2) = {P}. 1 mm joints')
    cu = f.div(U, 2 * HC, name='cv_u')
    col = f.floor(cu, name='cv_col')
    x = f.mul(f.sub(cu, col), 2 * HC, name='cv_x')
    left = f.gt(HC, x, name='cv_l')
    s = f.mix(f.sub(f.add(V, x), 2 * HC), f.sub(V, x), left, name='cv_s')
    q = f.div(s, P, name='cv_q')
    k = f.floor(q, name='cv_k')
    fr = f.sub(q, k, name='cv_fr')
    right = f.inv(left, name='cv_r')
    xh = f.sub(x, f.mul(right, HC), name='cv_xh')
    dend = f.n('min', name='cv_dend', in1=xh, in2=f.sub(HC, xh))
    dside = f.mul(f.n('min', in1=fr, in2=f.inv(fr)), W, name='cv_dside')
    d = f.sub(f.n('min', in1=dend, in2=dside), GAP, name='cv_d')
    cell = f.c2(f.add(f.mul(col, 2.0), right), k, name='cv_cell')
    f.cell(cell, (200.37, 300.61), name='cv_id')
    sc = f.mul(f.add(k, 0.5), P, name='cv_sc')
    # along the block axis, from the block centre: left (x + v - HC - sc)/sqrt2, right (x - v - HC + sc)/sqrt2
    al = f.sub(f.sub(f.add(x, V), HC), sc)
    ar = f.add(f.sub(f.sub(x, V), HC), sc)
    along = f.mul(f.mix(ar, al, left), R2, name='cv_along')
    f.c2(along, f.mul(f.sub(fr, 0.5), W), name='cv_loc')
    f.ss(d, -0.00025, 0.00025, name='cv_tile')
    f.save()


def lay_rows():
    S, JW, SU, GAP = 0.2, 0.25, 1.2, 0.0005
    f = F('lay_rows', 'vw_', f'in: uv_sep. out: vw_loc (board-local m, centred), vw_w (row width, m), vw_row, vw_cell, vw_id, vw_d, vw_tile. Variable-width rows: the plank trick along V, one row joint per S = {S} m segment at {0.5-JW/2}..{0.5+JW/2} of it, so widths are S(1 +- JW) = {S*(1-JW)*1000:.0f}..{S*(1+JW)*1000:.0f} mm. Boards {SU} m long along U, shifted by a random per row. 1 mm joints')
    vs = f.div(V, S, name='vw_v')
    rk = f.floor(vs, name='vw_rk')
    fv = f.sub(vs, rk, name='vw_fv')
    def joint(kk, nm):
        return f.add(f.mul(f.cell(f.c2(kk, 3.0), (11.37, 5.61)), JW), round(0.5 - JW / 2, 6), name=nm)
    j = joint(rk, 'vw_j')
    up = f.gt(fv, j, name='vw_up')
    sg = f.sub(f.mul(up, 2.0), 1.0, name='vw_sg')
    jn = f.add(joint(f.add(rk, sg), 'vw_n0'), sg, name='vw_n')
    w = f.mul(f.n('absval', in_=f.sub(jn, j)), S, name='vw_w')  # |n-j| and (j+n)/2: each joint read once (bug 7)
    row = f.add(rk, up, name='vw_row')
    across = f.mul(f.sub(fv, f.mul(f.add(j, jn), 0.5)), S, name='vw_c')
    bx = f.add(f.div(U, SU), f.cell(f.c2(row, 7.0), (3.37, 1.61)), name='vw_bx')
    bk = f.floor(bx, name='vw_bk')
    loc = f.c2(f.mul(f.sub(f.sub(bx, bk), 0.5), SU), across, name='vw_loc')
    half = f.c2(SU / 2, f.mul(w, 0.5), name='vw_half')
    e = f.sub(f.sub(half, f.n('absval', 'vector2', in_=loc), 'vector2'), GAP, 'vector2', name='vw_e')
    ex, ey = f.sep(e, 'vw_es')
    d = f.n('min', name='vw_d', in1=ex, in2=ey)
    cell = f.c2(bk, row, name='vw_cell')
    f.cell(cell, (200.37, 300.61), name='vw_id')
    f.ss(d, -0.00025, 0.00025, name='vw_tile')
    f.save()


# ---------------------------------------------------------------- wood (board frame: pk_loc, pk_cell)
def wood_knot():
    f = F('wood_knot', 'wk_', 'in: pk_loc, pk_id, pk_lm. out: wk_loc (board-local m with the across-grain coordinate deflected round the knot), wk_bump (m added to the ring radius), wk_core, wk_rim (0..1). ~20% of boards, radius 4..9 mm, anywhere along the board up to 12.5 cm from its ends (offset scaled by the board length pk_lm), +-4 cm across. y\' = y - qy*1.6*r^2/(rho_e^2 + r^2), rho_e = |q*(0.4, 1)| (stretched along the grain)')
    r = [f.rnd(i, 0.37) for i in range(4)]
    on = f.gt(r[0], 0.8, name='wk_on')
    kr = f.add(f.mul(r[1], 0.005), 0.004, name='wk_r')
    kx = f.mul(f.sub(r[2], 0.5), f.sub(Ref('pk_lm'), 0.25), name='wk_px')  # along: anywhere but the last 12.5 cm of each end
    kp = f.c2(kx, f.mul(f.sub(r[3], 0.5), 0.08), name='wk_p')
    q = f.sub(Ref('pk_loc'), kp, 'vector2', name='wk_q')
    kr2 = f.mul(kr, kr, name='wk_r2')
    rho = f.n('magnitude', name='wk_rho', in_=f.mul(q, (0.7, 1.0), 'vector2'))
    f.mul(f.div(kr2, f.add(f.mul(rho, rho), kr2)), f.mul(on, 0.004), name='wk_bump')
    rhoe = f.n('magnitude', name='wk_rhoe', in_=f.mul(q, (0.4, 1.0), 'vector2'))
    dfl = f.mul(f.div(f.mul(kr2, 1.6), f.add(f.mul(rhoe, rhoe), kr2)), on, name='wk_def')
    qx, qy = f.sep(q, 'wk_qs')
    f.sub(Ref('pk_loc'), f.c2(0.0, f.mul(qy, dfl)), 'vector2', name='wk_loc')
    f.mul(f.inv(f.ss(rho, f.mul(kr, 0.85), kr)), on, name='wk_core')
    f.mul(f.mul(f.ss(rho, f.mul(kr, 0.8), f.mul(kr, 0.95)), f.inv(f.ss(rho, kr, f.mul(kr, 1.2)))), on, name='wk_rim')
    f.save()


def wood_rings():
    FMAX = 130.0
    f = F('wood_rings', 'wr_', f'in: wk_loc, wk_bump, pk_id. out: wr_t (ring phase 0..1), wr_ew (earlywood band), wr_fade, wr_fig (ew faded to its mean 0.35 where rings alias), wr_band (ring-group tone, safe at any view), wr_flank (1 where rings stand perpendicular to the face), wr_lp (board coords in a private patch), wr_q (1 quarter-sawn). Cone model R = sqrt((y + o)^2 + D^2) + taper*x: plain-sawn (65%) pith o = +-11 cm off-centre, D = 4..14 cm deep, taper +-4%; quarter-sawn o = 0.2..0.3 m, D ~ 0. Rings 4..7 mm, widths uneven +-30%. Local ring frequency f = 1.3*|grad R|/lambda lines/m; the figure fades between FMAX/2 and FMAX = {FMAX:g}/m (6 px at `plane` at the default 800 px; 85 at -s 512)')
    r = [f.rnd(i, 0.61) for i in range(7)]
    q = f.gt(r[0], 0.65, name='wr_q')
    o = f.mix(f.mul(f.sub(r[1], 0.5), 0.22), f.add(f.mul(r[1], 0.1), 0.2), q, name='wr_o')
    dd = f.mix(f.add(f.mul(r[2], 0.1), 0.04), 0.002, q, name='wr_D')
    tap = f.mul(f.sub(r[3], 0.5), f.mix(0.08, 0.03, q), name='wr_tap')
    lam = f.add(f.mul(r[4], 0.003), 0.004, name='wr_lam')
    lp = f.add(Ref('wk_loc'), f.mul(f.c2(r[5], r[6]), (97.3, 61.7), 'vector2'), 'vector2', name='wr_lp')
    lx, ly = f.sep(Ref('wk_loc'), 'wr_ls')
    yo = f.add(ly, o, name='wr_yo')
    R0 = f.n('magnitude', name='wr_R0', in_=f.c2(yo, dd))
    wob = f.n('fractal2d', name='wr_wob', texcoord=f.add(f.mul(lp, (3.0, 12.0), 'vector2'), (4.1, 9.3), 'vector2'), amplitude=0.002, octaves=1)
    R = f.add(f.add(f.add(R0, f.mul(tap, lx)), wob), Ref('wk_bump'), name='wr_R')
    yr = f.n('fractal2d', name='wr_yr', texcoord=f.c2(f.mul(R, 35.0), f.mul(r[5], 71.0)), amplitude=1.2, octaves=1)
    ph = f.add(f.add(f.div(R, lam), yr), f.mul(r[6], 13.0), name='wr_ph')
    t = f.n('fract', name='wr_t', in_=ph)
    grad = f.n('magnitude', name='wr_grad', in_=f.c2(f.div(yo, R0), tap))
    fl = f.div(f.mul(grad, 1.3), lam, name='wr_f')
    fade = f.inv(f.ss(fl, FMAX / 2, FMAX), name='wr_fade')
    ew = f.mul(f.ss(t, 0.0, 0.1), f.inv(f.ss(t, 0.25, 0.55)), name='wr_ew')
    f.mix(0.35, ew, fade, name='wr_fig')
    f.n('fractal2d', name='wr_band', texcoord=f.add(f.c2(f.mul(R, 40.0), f.mul(lx, 2.0)), f.mul(r[4], 37.0), 'vector2'), octaves=2)
    f.div(f.n('absval', in_=yo), R0, name='wr_flank')
    f.save()


def wood_pores():
    f = F('wood_pores', 'wp_', 'in: wr_lp, wr_t. out: wp_pore (0..1). Open pores as dashes along the grain: worley cells 5.6 x 0.38 mm (180 x 2600 /m), dash F1 < 0.1..0.22 (~2 x 0.15 mm); every cell in the earlywood band, ~20% of cells at half strength in the latewood (pores then draw the ring lines at closeup, where the figure is faded). Jitter 1: tiny features look best fully random (clips are invisible under ~4 px)')
    pp = f.add(f.mul(Ref('wr_lp'), (180.0, 2600.0), 'vector2'), (0.37, 0.61), 'vector2', name='wp_p')
    f1 = f.n('worleynoise2d', name='wp_f1', texcoord=pp, jitter=1.0)
    pid = f.n('worleynoise2d', name='wp_id', texcoord=pp, jitter=1.0, style=1)
    t = Ref('wr_t')
    ewp = f.mul(f.ss(t, 0.0, 0.04), f.inv(f.ss(t, 0.18, 0.3)), name='wp_ew')
    on = f.n('max', name='wp_on', in1=ewp, in2=f.gt(pid, 0.8, 0.5, 0.0))
    f.mul(f.inv(f.ss(f1, 0.1, 0.22)), on, name='wp_pore')
    f.save()


def wood_fleck():
    f = F('wood_fleck', 'wf_', 'in: wr_lp, wr_flank, pk_id. out: wf_fleck (0..1). Quarter-sawn ray fleck: thresholded stretched fBm (35 x 180 /m, 3 oct) gives ragged flakes ~1..4 cm x 2..5 mm along the grain, tilted +-10 deg per board. Thresholded noise makes worms, which is what flecks are. Only where rings stand perpendicular to the face (wr_flank > 0.85: quarter-sawn boards and rift edges); a slow presence field breaks them into patches')
    ang = f.mul(f.sub(f.rnd(4, 0.83), 0.5), 20.0, name='wf_ang')
    fp = f.add(f.mul(f.n('rotate2d', 'vector2', in_=Ref('wr_lp'), amount=ang), (35.0, 180.0), 'vector2'), (3.7, 1.3), 'vector2', name='wf_p')
    fn = f.n('fractal2d', name='wf_n', texcoord=fp, octaves=3)
    pres = f.n('fractal2d', name='wf_pres', texcoord=f.add(f.mul(Ref('wr_lp'), (4.0, 10.0), 'vector2'), (8.3, 2.1), 'vector2'), octaves=1)
    thr = f.sub(0.52, f.mul(pres, 0.3), name='wf_thr')
    shape = f.ss(f.sub(fn, thr), 0.0, 0.12, name='wf_shape')
    f.mul(shape, f.ss(Ref('wr_flank'), 0.85, 0.97), name='wf_fleck')
    f.save()


def wood_color():
    f = F('wood_color', 'wc_', 'in: uv, pk_id, wr_lp, wr_fig, wr_band, wp_pore, wf_fleck, wk_core, wk_rim. out: wd_col, wd_rough. White oak, matte oil (linear): honey..light tan per board, +-14% level; streaks along the grain (3 x 60 /m), mottle, fibre (60 x 1400 /m, speckle only), 70 cm drift, ring groups; earlywood darker and rougher, flecks lighter and smoother, pores dark, knot core and rim near black')
    r0 = Ref('pk_id')
    r1 = f.rnd(5, 0.29, name='wc_r1')
    lp = Ref('wr_lp')
    bc = f.mix((0.5, 0.28, 0.11), (0.58, 0.36, 0.17), r0, 'color3', name='wc_bc')
    st = f.n('fractal2d', name='wc_st', texcoord=f.add(f.mul(lp, (3.0, 60.0), 'vector2'), (1.7, 8.3), 'vector2'), amplitude=0.16, octaves=1)
    mo = f.n('fractal2d', name='wc_mo', texcoord=f.add(f.mul(lp, (4.0, 12.0), 'vector2'), (6.1, 2.9), 'vector2'), amplitude=0.1, octaves=3)
    fib = f.n('fractal2d', name='wc_fib', texcoord=f.add(f.mul(lp, (60.0, 1400.0), 'vector2'), (2.3, 4.1), 'vector2'), amplitude=0.1, octaves=1)
    dr = f.n('noise2d', name='wc_dr', texcoord=f.add(f.mul(Ref('uv'), 1.5, 'vector2'), (4.4, 7.7), 'vector2'), amplitude=0.08)
    tone = f.add(f.add(f.add(f.add(st, mo), f.add(fib, dr)), f.mul(f.sub(r1, 0.5), 0.28)), f.add(f.mul(Ref('wr_band'), 0.15), 1.0), name='wc_tone')
    c = f.mul(bc, tone, 'color3', name='wc_c0')
    c = f.mul(c, f.mix((1.0, 1.0, 1.0), (0.74, 0.66, 0.58), f.mul(Ref('wr_fig'), 0.75), 'color3'), 'color3', name='wc_c1')
    c = f.mul(c, f.mix((1.0, 1.0, 1.0), (1.18, 1.14, 1.08), f.mul(Ref('wf_fleck'), 0.7), 'color3'), 'color3', name='wc_c2')
    c = f.mul(c, f.mix((1.0, 1.0, 1.0), (0.5, 0.44, 0.38), f.mul(Ref('wp_pore'), 0.65), 'color3'), 'color3', name='wc_c3')
    c = f.mix(c, (0.17, 0.085, 0.038), f.mul(Ref('wk_core'), 0.9), 'color3', name='wc_c4')
    f.mix(c, (0.06, 0.032, 0.015), f.mul(Ref('wk_rim'), 0.8), 'color3', name='wd_col')
    rg = f.add(f.add(f.mul(f.sub(Ref('wr_fig'), 0.35), 0.09), 0.6), f.sub(f.mul(Ref('wp_pore'), 0.07), f.mul(Ref('wf_fleck'), 0.1)), name='wc_rg')
    f.mix(rg, 0.56, Ref('wk_core'), name='wd_rough')
    f.save()


def wood_height():
    f = F('wood_height', 'wh_', 'in: wr_lp, wr_fig, wp_pore, wf_fleck, wk_core. out: h_wood (m). Wire-brushed: soft earlywood eroded 0.07 mm (faded with the figure), pores -0.02 mm, flecks +5 um, knot core -0.06 mm, brush scratches along the grain 12 um at 1800 /m across (~2 deg). For a plain sanded face scale the earlywood term to ~0.01 mm')
    br = f.n('fractal2d', name='wh_brush', texcoord=f.add(f.mul(Ref('wr_lp'), (12.0, 1800.0), 'vector2'), (29.6, 15.2), 'vector2'), amplitude=0.000012, octaves=1)
    a = f.add(f.mul(Ref('wr_fig'), -0.00007), f.mul(Ref('wp_pore'), -0.00002), name='wh_a')
    b = f.add(f.mul(Ref('wf_fleck'), 0.000005), f.mul(Ref('wk_core'), -0.00006), name='wh_b')
    f.add(f.add(a, b), br, name='h_wood')
    f.save()


def wood_end():
    f = F('wood_end', 'eg_', 'in: rg_loc, rg_cell (any tile layout). out: eg_rel (m from the pith: feed the polar recipe), eg_fr (ring phase 0..1), eg_lw (latewood, strength varies per ring), eg_ew (earlywood). End grain: 85% of blocks have the pith 6..28 cm away (arcs), 15% inside (full rings); rings warped 2.5 mm at 10 /m, spacing 1.5..5.5 mm per block, +-20% ring to ring')
    r = [f.cell(Ref('rg_cell'), (200.37 + 13.1 * i, 300.61 + 7.3 * i)) for i in range(7)]
    far = f.gt(r[1], 0.15, name='eg_far')
    dist = f.mix(f.mul(r[2], 0.018), f.add(f.mul(r[2], 0.22), 0.06), far, name='eg_dist')
    pdir = f.n('rotate2d', 'vector2', name='eg_dir', in_=(1.0, 0.0), amount=f.mul(r[0], 360.0))
    rel = f.sub(Ref('rg_loc'), f.mul(pdir, dist, 'vector2'), 'vector2', name='eg_rel')
    seed = f.mul(f.c2(r[5], r[6]), (97.0, 61.0), 'vector2', name='eg_seed')
    wa = f.n('fractal2d', 'vector3', name='eg_wa', texcoord=f.add(f.mul(rel, 10.0, 'vector2'), seed, 'vector2'), amplitude=('vector3', (0.0025, 0.0025, 0.0)), octaves=2)
    rad = f.n('magnitude', name='eg_rad', in_=f.add(rel, f.n('convert', 'vector2', in_=wa), 'vector2'))
    sp = f.add(f.mul(f.mul(r[3], r[3]), 0.004), 0.0015, name='eg_sp')
    q = f.div(rad, sp, name='eg_q')
    qn = f.n('fractal2d', name='eg_qn', texcoord=f.c2(f.mul(q, 0.25), f.mul(r[4], 71.0)), amplitude=0.8, octaves=1)
    ph = f.add(q, qn, name='eg_ph')
    k = f.floor(ph, name='eg_k')
    fr = f.sub(ph, k, name='eg_fr')
    rr = f.n('cellnoise2d', name='eg_rr', texcoord=f.c2(k, f.add(f.mul(r[4], 500.0), 0.37)))
    lw0 = f.add(f.mul(rr, 0.25), 0.42, name='eg_lw0')
    lw = f.mul(f.ss(fr, lw0, f.add(lw0, 0.4)), f.inv(f.ss(fr, 0.93, 1.0)))
    f.mul(lw, f.add(f.mul(rr, 0.5), 0.5), name='eg_lw')
    f.inv(f.ss(fr, 0.02, 0.3), name='eg_ew')
    f.save()


# ---------------------------------------------------------------- surfaces
def polar():
    NS = 48
    f = F('polar', 'po_', f'in: po_rel (vector2, m from the centre), po_seed (per-centre random, e.g. id*613). out: po_th (angle, rad), po_r (m), po_ray (0..1 radial rays, r/40 apart), po_check (0..1 radial checks). {NS} angular sectors; ~38% hold a check 8..30 mm long, <= 0.7 mm wide, tapered to both ends. Width is the perpendicular distance r*(theta - theta_c); the wobble goes on the signed offset BEFORE absval, and the gate smoothstep(w, 2e-5, 6e-5) removes the hairline where the width is at its floor')
    x, y = f.sep(Ref('po_rel'), 'po_s')
    th = f.n('atan2', name='po_th', iny=y, inx=x)
    r = f.n('magnitude', name='po_r', in_=Ref('po_rel'))
    rn = f.n('fractal2d', name='po_rn', texcoord=f.c2(f.mul(th, 40.0), f.add(f.mul(r, 45.0), Ref('po_seed'))), octaves=1)
    f.ss(rn, 0.3, 0.55, name='po_ray')
    sec = f.floor(f.mul(th, round(NS / TAU, 6)), name='po_sec')
    cs = f.c2(sec, Ref('po_seed'), name='po_cs')
    c1 = f.n('cellnoise2d', name='po_c1', texcoord=cs)
    c2 = f.cell(cs, (31.0, 17.0), name='po_c2')
    c3 = f.cell(cs, (71.0, 5.0), name='po_c3')
    thc = f.mul(f.add(sec, f.add(f.mul(c1, 0.6), 0.2)), round(TAU / NS, 6), name='po_thc')
    wob = f.n('fractal2d', name='po_wob', texcoord=f.c2(f.mul(r, 350.0), f.mul(c1, 37.0)), amplitude=0.00015, octaves=1)
    dp = f.n('absval', name='po_dp', in_=f.add(f.mul(r, f.sub(th, thc)), wob))
    ln = f.add(f.mul(c2, 0.022), 0.008, name='po_len')
    cen = f.add(f.add(f.mul(ln, 0.5), 0.004), f.mul(c1, 0.05), name='po_cen')
    cx = f.div(f.sub(r, cen), f.mul(ln, 0.5), name='po_cx')
    prof = f.n('max', name='po_prof', in1=f.inv(f.mul(cx, cx)), in2=0.0)
    w = f.n('max', name='po_w', in1=f.mul(f.mul(prof, f.gt(c3, 0.62)), 0.00035), in2=0.00001)
    f.mul(f.inv(f.ss(dp, 0.0, w)), f.ss(w, 0.00002, 0.00006), name='po_check')
    f.save()


def scoops():
    f = F('scoops', 'sc_', 'in: uv. out: h_scoop (m), sc_pool (0..1 in the hollows), sc_crest (0..1 on the ridges). Paraboloid dishes D*(smin(F1^2, F2^2)/R^2 - 1): cells 22 mm along U x 45 mm across (draw-knife scoops across the grain), jitter 0.9, R^2 = 0.36, smooth-min k 0.06 rounds the crest. Depth D 0.33..0.77 mm from a smooth field, never per cell (steps)')
    sp = f.add(f.mul(f.n('rotate2d', 'vector2', in_=Ref('uv'), amount=4.0), (45.0, 22.0), 'vector2'), (3.1, 7.9), 'vector2', name='sc_p')
    w = f.n('worleynoise2d', 'vector2', name='sc_w', texcoord=sp, jitter=0.9)
    f1, f2 = f.sep(w, 'sc_ws')
    a2 = f.mul(f1, f1, name='sc_a2')
    b2 = f.mul(f2, f2, name='sc_b2')
    K = 0.06
    h = f.div(f.n('max', in1=f.sub(K, f.sub(b2, a2)), in2=0.0), K, name='sc_h')
    fs = f.sub(a2, f.mul(f.mul(h, h), K / 4), name='sc_fs')
    dish = f.sub(f.div(fs, 0.36), 1.0, name='sc_dish')
    dep = f.n('noise2d', name='sc_D', texcoord=f.add(f.mul(Ref('uv'), (14.0, 9.0), 'vector2'), (17.3, 5.1), 'vector2'), amplitude=0.0004, pivot=0.00055)
    f.mul(dish, dep, name='h_scoop')
    f.ss(f.mul(dish, -1.0), 0.2, 0.9, name='sc_pool')
    f.inv(f.ss(f.sub(b2, a2), 0.0, 0.25), name='sc_crest')
    f.save()


def dents():
    f = F('dents', 'dn_', 'in: uv. out: h_dent (m), dn_dent (0..1). Impact dents with a crisp rim and a flat floor: 1 - smoothstep(t, 0.45, 1), t = F1/r. 18 cells/m, jitter 0.7, 40% of cells, r 0.05..0.15 cell (3..8 mm, never clips), depth r*3.5 mm (0.2..0.5 mm, rim ~10 deg)')
    pp = f.add(f.mul(Ref('uv'), 18.0, 'vector2'), (3.7, 1.9), 'vector2', name='dn_p')
    f1 = f.n('worleynoise2d', name='dn_f1', texcoord=pp, jitter=0.7)
    pid = f.n('worleynoise2d', name='dn_id', texcoord=pp, jitter=0.7, style=1)
    on = f.gt(pid, 0.6, name='dn_on')
    r = f.add(f.mul(f.mul(f.n('fract', in_=f.mul(pid, 7.3)), 0.1), on), 0.05, name='dn_r')
    t = f.div(f1, r, name='dn_t')
    dent = f.mul(f.inv(f.ss(t, 0.45, 1.0)), on, name='dn_dent')
    f.mul(dent, f.mul(r, -0.0035), name='h_dent')
    f.save()


# ---------------------------------------------------------------- round 4: wall panelling (profiles, book-match, grain, surfaces)
FMAX4 = 170.0  # ring-figure fade top for docs/material-authoring/render.sh (-s 512 --supersample = 1024 px across 1 m: 6 px per line)


def prof_mould():
    B, R, D, KF, KA, SLOT = 0.045, 0.0045, 0.0015, 0.0006, 0.0005, 0.0006
    TB = math.sqrt(R * R - (R - D) ** 2)
    f = F('prof_mould', 'mb_', f'in: uv_sep. out: mb_s (m from the bead centre, across U), mb_k (bead index), h_mould (m, 0 = board face), mb_cav (0..1 in the quirks). Beadboard moulding across U: a half-round bead every {B*1000:g} mm (circular arc sqrt(max(R^2 - t^2, 0)) - R, R {R*1000:g} mm), meeting a 45 deg V quirk {D*1000:g} mm deep at t = TB = {TB*1000:.2f} mm; smooth-max fillet k {KF*1000:g} mm in the V, cubic smooth-min arris k {KA*1000:g} mm where the quirk wall meets the face (applied to the wall before the union, so the bead crown stays true); even beads open a {SLOT*1000:g} mm slot on their right (the board joint) with a flat floor max(., -D)')
    wb = f.add(f.div(U, B), round(TB / B + 0.5, 6), name='mb_wb')
    k = f.floor(wb, name='mb_k')
    sb = f.mul(f.sub(f.sub(wb, k), 0.5), B, name='mb_s')
    t = f.n('absval', name='mb_t', in_=sb)
    bead = f.sub(f.n('sqrt', in_=f.n('max', in1=f.sub(R * R, f.mul(t, t)), in2=0.0)), R, name='mb_bead')
    even = f.gt(0.25, f.n('fract', in_=f.mul(k, 0.5)), name='mb_even')
    slot = f.mul(f.mul(even, f.gt(sb, 0.0)), SLOT, name='mb_slot')
    wall = f.sub(f.sub(t, slot), round(TB + D, 7), name='mb_wall')  # 45 deg: rises 1 m per m from -D at TB + slot
    arris = f.smin(wall, 0.0, KA, name='mb_arris')
    fil = f.smax(bead, arris, KF, name='mb_fil')
    f.n('max', name='h_mould', in1=fil, in2=-D)
    f.ss(f.mul(Ref('h_mould'), -1.0), 0.0005, 0.0014, name='mb_cav')
    f.save()


def prof_bow():
    P = 0.09
    f = F('prof_bow', 'bw_', f'in: uv_sep. out: bw_x (m across the board, 0 at its joint), bw_id, h_bow (m). Per-board unevenness that is 0 at both joints: bow a1*sin(pi*x/P) (a1 = +-0.15 mm per board plus 0.15 mm noise along V at 1.3/m) and twist a2*sin(2*pi*x/P) (+-0.06 mm), boards {P*1000:g} mm across U. Neighbours never step at the joint, whatever their randoms')
    ub = f.div(U, P, name='bw_u')
    m = f.floor(ub, name='bw_m')
    x = f.mul(f.sub(ub, m), P, name='bw_x')
    bid = f.cell(f.c2(m, 7.0), (200.37, 300.61), name='bw_id')
    bow = f.n('sin', name='bw_bow', in_=f.mul(x, round(math.pi / P, 6)))
    tw = f.n('sin', name='bw_tw', in_=f.mul(x, round(2 * math.pi / P, 6)))
    a1 = f.add(f.mul(f.sub(bid, 0.5), 0.0003), f.fn1(f.c2(V, m), (1.3, 7.7), (3.1, 0.4), 0.00015), name='bw_a1')
    a2 = f.mul(f.sub(f.r01(bid, 29.17, 0.3), 0.5), 0.00012, name='bw_a2')
    f.add(f.mul(a1, bow), f.mul(a2, tw), name='h_bow')
    f.save()


def prof_cove():
    P, PITCH, A, S = 0.506, 0.022, 0.010, 0.004
    RC = (A * A + S * S) / (2 * S)
    f = F('prof_cove', 'fl_', f'in: uv_sep. out: fl_pid (panel index), fl_xc (m from the panel centre, across U), h_flute (m), fl_dh (dh/dx, for the ring-frequency fade). Fluted panel: {P*1000:g} mm panels (23 flutes, so the panel edge falls on a land), circular cove flutes {2*A*1000:g} mm wide x {S*1000:g} mm deep on a {PITCH*1000:g} mm pitch (2 mm lands): cove radius RC = (A^2 + S^2)/2S = {RC*1000:.1f} mm, h = (RC - S) - sqrt(RC^2 - min(x^2, A^2)). The wall at the arris is asin(A/RC) = {math.degrees(math.asin(A/RC)):.1f} deg; it renders cleanly with a ~6 px ramp at closeup')
    pid = f.floor(f.div(U, P), name='fl_pid')
    xc = f.sub(U, f.mul(f.add(pid, 0.5), P), name='fl_xc')
    xf = f.mul(f.sub(f.n('fract', in_=f.add(f.div(xc, PITCH), 0.5)), 0.5), PITCH, name='fl_x')
    xf2 = f.mul(xf, xf, name='fl_x2')
    root = f.n('sqrt', name='fl_root', in_=f.sub(round(RC * RC, 10), f.n('min', in1=xf2, in2=round(A * A, 10))))
    f.sub(round(RC - S, 6), root, name='h_flute')
    f.gt(round(A * A, 10), xf2, f.div(xf, root), 0.0, name='fl_dh')
    f.save()


def prof_step():
    PU, PV, HX, HY, D, S, K1, K2 = 0.47, 0.67, 0.2, 0.3, 0.008, 2.0, 0.002, 0.0012
    f = F('prof_step', 'ps_', f'in: uv_sep. out: h_step (m, 0 = frame face), ps_d (m to the panel outline, + on the frame), ps_stile (1 on stiles), ps_tone (per-member random 0..1), ps_corner (1 in the inside corner). Recessed Shaker panel: {HX*2000:g} x {HY*2000:g} mm panels on a {PU*1000:g} x {PV*1000:g} mm pitch (70 mm stiles and rails), {D*1000:g} mm step. The wall is d*{S:g} ({math.degrees(math.atan(S)):.0f} deg, {D/S*1000:g} mm wide: ~10 px at closeup, which is what lets it be this steep), then a cubic smooth-min arris (k {K1*1000:g} mm) and a quadratic smooth-max fillet (k {K2*1000:g} mm) at the panel floor. Seeds are per member: stiles run through and are keyed on the stile column, rails on (column, rail row), panels on the cell, so no tone step lands mid-member')
    pu = f.div(U, PU, name='ps_u')
    pv = f.div(V, PV, name='ps_v')
    lx = f.mul(f.sub(f.n('fract', in_=pu), 0.5), PU, name='ps_lx')
    ly = f.mul(f.sub(f.n('fract', in_=pv), 0.5), PV, name='ps_ly')
    ex = f.sub(f.n('absval', in_=lx), HX, name='ps_ex')
    ey = f.sub(f.n('absval', in_=ly), HY, name='ps_ey')
    d = f.n('max', name='ps_d', in1=ex, in2=ey)
    top = f.smin(f.mul(d, S), 0.0, K1, name='ps_top')
    f.smax(top, -D, K2, name='h_step')
    f.inv(f.ss(f.sub(f.mul(d, -1.0), D / S), -0.001, 0.003), name='ps_corner')
    # per-member seeds: stile = column floor(u/PU + 0.5); rail = (panel column, rail row floor(v/PV + 0.5)); panel = cell
    stile = f.ss(ex, -0.0002, 0.0002, name='ps_stile')
    rail = f.mul(f.inv(stile), f.ss(ey, -0.0002, 0.0002), name='ps_rail')
    col = f.floor(pu, name='ps_col')
    sid = f.cell(f.c2(f.floor(f.add(pu, 0.5)), 1.0), (200.37, 300.61), name='ps_sid')
    rid = f.cell(f.c2(col, f.floor(f.add(pv, 0.5))), (41.37, 9.61), name='ps_rid')
    pid = f.cell(f.c2(col, f.floor(pv)), (11.37, 5.61), name='ps_pid')
    f.mix(f.mix(pid, rid, rail), sid, stile, name='ps_tone')
    f.save()


def prof_batten():
    P, H, E, SMAX, C, HWF = 0.25, 0.019, 0.0025, 1.43, 0.0045, 0.0215
    W = H / SMAX + (C + E) / 2
    f = F('prof_batten', 'bt_', f'in: uv_sep. out: bt_m (0 board .. 1 batten top), bt_x (m up the side from the toe), bt_xb (m from the board centre, for the base), bt_ao (albedo factor, 0.65 at the toe). Board-and-batten: {P*1000:g} mm boards, a 50 mm batten H = {H*1000:g} mm proud over each seam. The side slope is SMAX*smoothstep(x/C)*(1 - smoothstep((x - W + E)/E)), integrated analytically: I(t) = tc^3 - tc^4/2 + max(t - 1, 0), tc = clamp(t), so curvature is continuous at the toe (fillet C = {C*1000:g} mm) and the arris (ease E = {E*1000:g} mm). Width W = H/SMAX + (C + E)/2 = {W*1000:.1f} mm for a {math.degrees(math.atan(SMAX)):.0f} deg face (SMAX = tan)')
    us = f.div(U, P, name='bt_us')
    bk = f.floor(us, name='bt_bk')
    f.mul(f.sub(f.sub(us, bk), 0.5), P, name='bt_xb')
    s = f.add(us, 0.5)
    xs = f.mul(f.sub(f.sub(s, f.floor(s)), 0.5), P, name='bt_xs')
    x = f.sub(round(HWF + W, 6), f.n('absval', in_=xs), name='bt_x')

    def I(tn, nm):
        tc = f.n('clamp', in_=tn)
        t2 = f.mul(tc, tc)
        return f.add(f.sub(f.mul(t2, tc), f.mul(f.mul(t2, t2), 0.5)), f.n('max', in1=f.sub(tn, 1.0), in2=0.0), name=nm)
    raw = f.sub(f.mul(I(f.div(x, C), 'bt_ic'), C), f.mul(I(f.div(f.sub(x, round(W - E, 6)), E), 'bt_ie'), E), name='bt_raw')
    f.n('clamp', name='bt_m', in_=f.div(raw, round(W - E / 2 - C / 2, 6)))
    f.add(f.mul(f.inv(f.ss(x, -0.004, C)), -0.35), 1.0, name='bt_ao')
    f.save()


def prof_over():
    H, P = 0.019, 0.25
    f = F('prof_over', 'ov_', f'in: bt_m, bt_xb. out: h_bat (m). A raised element over a varying base: h = H*m + h_base*(1 - m). The base here is a board cup 0.8 mm deep (0 at the seams, -0.8 mm mid-board). Adding H*m on top of the cup instead creases where the cup slope changes sign under the batten side')
    xq = f.div(Ref('bt_xb'), P / 2, name='ov_xq')
    base = f.mul(f.sub(f.mul(xq, xq), 1.0), 0.0008, name='ov_base')
    f.add(f.mul(Ref('bt_m'), H), f.mul(base, f.inv(Ref('bt_m'))), name='h_bat')
    f.save()


def prof_channel():
    P, HW, DEP, LO, HI = 0.040, 0.0135, 0.004, -0.0055, 0.0008
    f = F('prof_channel', 'ch_', f'in: uv_sep. out: h_chan (m), ch_face (1 on the slat face), ch_floor (1 on the channel floor), ch_ao (albedo factor 0.4 at the walls .. 1 mid-channel). Slats {2*HW*1000:g} mm on a {P*1000:g} mm pitch, 13 mm channels: the real channel is deeper than it is wide, which the slope budget cannot model, so the height is a {DEP*1000:g} mm smoothstep ramp from 5.5 mm into the gap to 0.8 mm onto the face (max ~43 deg; 3 px at plane at -s 512, 5 px at the default 800 px, 16 px at closeup) and the depth goes into albedo: the floor darkens toward the walls (baked AO)')
    s = f.div(U, P, name='ch_s')
    y = f.mul(f.sub(f.sub(s, f.floor(s)), 0.5), P, name='ch_y')
    d = f.sub(HW, f.n('absval', in_=y), name='ch_d')
    f.mul(f.ss(d, LO, HI), DEP, name='h_chan')
    f.ss(d, -0.0007, 0.0002, name='ch_face')
    f.inv(f.ss(d, -0.0038, -0.0018), name='ch_floor')
    f.add(f.mul(f.ss(f.n('max', in1=f.mul(d, -1.0), in2=0.0), 0.0015, 0.0065), 0.6), 0.4, name='ch_ao')
    f.save()


def lay_bookmatch():
    L, PW = 0.15, 0.6
    f = F('lay_bookmatch', 'bm_', f'in: uv_sep. out: bm_a (flitch m across the grain, 0..L), bm_q (flitch coords: across, along), bm_ds (m to the nearest seam). Book-matched leaves L = {L*1000:g} mm wide across U: a = L - |mod(u, 2L) - L| is a triangle wave, so every seam is an exact mirror line (4 nodes). Leaves 2-3 repeat leaves 0-1, so shift the along-grain coordinate per panel ({PW*1000:g} mm panels here, 0.31 m each) or repeats show')
    t = f.n('modulo', name='bm_t', in1=U, in2=2 * L)
    a = f.sub(L, f.n('absval', in_=f.sub(t, L)), name='bm_a')
    f.n('min', name='bm_ds', in1=a, in2=f.sub(L, a))
    b = f.add(V, f.mul(f.floor(f.div(U, PW)), 0.31), name='bm_b')
    f.c2(a, b, name='bm_q')
    f.save()


def wood_fiddle():
    FB, RB, TILT = 0.0025, 0.0035, 0.035
    f = F('wood_fiddle', 'lq_', f'in: bm_q, bm_a. out: lq_fig (signed fiddleback figure, ~+-0.5), lq_rb (ribbon, signed), lq_fib (fibre pseudo-height, m). Figured veneer on flitch coords: fiddleback cross-bands ~13 mm apart (75/m along the grain) slanted ~20 deg so they meet the seams as chevrons, curved by a 6 mm warp and in patches; ribbon stripes ~3 cm across (22/m). The fibre tilt becomes a pseudo-height: fiddleback {FB*1000:g} mm x figure (~+-12 deg), ribbon {RB*1000:g} mm x ribbon, whole-leaf tilt {TILT:g} m/m x a. All are functions of the flitch coords and the leaf tilt uses a itself (a triangle wave: continuous, its slope flips at the seam), so seams stay invisible; a per-leaf +-1 sign times a constant steps at every seam')
    q = Ref('bm_q')
    qa, qb = f.sep(q, 'lq_qs')
    bw = f.fn1(q, (10.0, 2.0), (7.7, 1.9), 0.006, name='lq_bw')
    slant = f.add(f.fn1(q, (1.0, 0.8), (3.9, 12.7), 0.8), 0.35, name='lq_slant')
    fq = f.c2(qa, f.add(f.add(qb, bw), f.mul(qa, slant)), name='lq_fq')
    fb = f.fn1(fq, (4.0, 75.0), (13.3, 5.1), name='lq_fb')
    pres = f.n('clamp', name='lq_pres', in_=f.add(f.mul(f.fn1(q, (5.0, 1.6), (21.7, 3.3)), 1.4), 0.55))
    fig = f.mul(fb, pres, name='lq_fig')
    rb = f.fn1(q, (22.0, 0.8), (31.1, 17.9), name='lq_rb')
    f.add(f.add(f.mul(fig, FB), f.mul(rb, RB)), f.mul(Ref('bm_a'), TILT), name='lq_fib')
    f.save()


def wood_lacquer():
    f = F('wood_lacquer', 'ln_', 'in: height (true surface, m), lq_fib, uv. out: n_base -> standard_surface.normal. Paste after the normal snippet, whose n_world goes to coat_normal. Lacquered wood has two normals: the base layer (the fibres) sees height + the fibre pseudo-height, so its highlight rolls across the figure as the view changes (chatoyance, fiddleback shimmer), while the coat sees only the true, near-flat surface. Set coat 1, coat_IOR 1.5, coat_roughness ~0.3; without coat_normal the coat is a flat mirror')
    hb = f.mul(f.add(Ref('height'), Ref('lq_fib')), 1000.0, name='ln_mm')
    nt = f.n('heighttonormal', 'vector3', name='ln_nt', in_=hb, scale=16, texcoord=f.mul(Ref('uv'), 1000.0, 'vector2'))
    f.n('normalmap', 'vector3', name='n_base', in_=nt)
    f.save()


def wood_relief():
    f = F('wood_relief', 'fz_', f'in: fl_xc, fl_pid, h_flute, fl_dh, uv_sep. out: fz_t (ring phase), fz_f (ring lines/m on the face), fz_fig (earlywood faded to 0.35 where rings alias). One plain-sawn flitch per panel, grain along V (cone model). The cut depth h enters the pith depth, D + h, so the figure shifts where the cutter went deeper, and the relief slope enters the ring frequency: dR/dx = (yo + (D + h)*dh/dx)/R0, so flute walls fade first. Pith +-15 cm, 6..20 cm deep, taper +-5% (spires ~lambda/taper = 6..30 cm apart), rings 3..6 mm; fade FMAX/2..FMAX = {FMAX4/2:g}..{FMAX4:g}/m (render.sh)')
    pid = f.cell(f.c2(Ref('fl_pid'), 0.0), (200.37, 300.61), name='fz_id')
    r = [f.r01(pid, k, 0.37) for k in (18.81, 39.963, 65.637, 97.722, 22.105, 46.964, 77.135)]
    yo = f.add(Ref('fl_xc'), f.mul(f.sub(r[0], 0.5), 0.3), name='fz_yo')
    dd = f.add(f.add(f.mul(r[1], 0.14), 0.06), Ref('h_flute'), name='fz_D')
    R0 = f.n('magnitude', name='fz_R0', in_=f.c2(yo, dd))
    tap = f.mul(f.sub(r[2], 0.5), 0.1, name='fz_tap')
    lp = f.add(f.c2(V, Ref('fl_xc')), f.mul(f.c2(r[5], r[6]), (97.3, 61.7), 'vector2'), 'vector2', name='fz_lp')
    R = f.add(f.add(R0, f.mul(tap, V)), f.fn1(lp, (1.5, 6.0), (4.1, 9.3), 0.006), name='fz_R')
    lam = f.add(f.mul(r[3], 0.003), 0.003, name='fz_lam')
    yr = f.n('fractal2d', name='fz_yr', texcoord=f.c2(f.mul(R, 35.0), f.mul(r[4], 71.0)), amplitude=1.2, octaves=1)
    t = f.n('fract', name='fz_t', in_=f.add(f.add(f.div(R, lam), yr), f.mul(r[4], 13.0)))
    gx = f.div(f.add(yo, f.mul(dd, Ref('fl_dh'))), R0, name='fz_gx')
    fl = f.div(f.mul(f.n('magnitude', in_=f.c2(gx, tap)), 1.3), lam, name='fz_f')
    ew = f.mul(f.ss(t, 0.0, 0.1), f.inv(f.ss(t, 0.25, 0.55)), name='fz_ew')
    f.mix(0.35, ew, f.inv(f.ss(fl, FMAX4 / 2, FMAX4)), name='fz_fig')
    f.save()


def wood_straight():
    f = F('wood_straight', 'ws_', 'in: uv (x across the grain, y along; feed board-local coords for per-board patches). out: ws_late (0..1 latewood lines), ws_pore (0..1), ws_str (signed streaks). Straight or rift grain: fractal lines stretched ~380:1 (380 x 1 /m, lines ~1..3 mm apart), grouped by a slower 110 x 0.8 /m field, plus 60 x 1.5 /m streaks and oak pore dashes (cells 0.38 x 5.6 mm). Noise lines only speckle when sub-pixel; they never moire, so no fade is needed. The analytic ring fade does not work here: a quarter-sawn ring frequency is constant, so it fades everywhere or nowhere')
    p = Ref('uv')
    st = f.fn1(p, (60.0, 1.5), (3.1, 7.9), octaves=2, name='ws_str')
    bnd = f.fn1(p, (380.0, 1.0), (29.6, 15.2), name='ws_bnd')
    grp = f.fn1(p, (110.0, 0.8), (5.2, 19.4), name='ws_grp')
    late = f.mul(f.ss(bnd, 0.0, 0.22), f.ss(grp, -0.5, 0.1), name='ws_late')
    wf = f.n('worleynoise2d', name='ws_f1', texcoord=f.add(f.mul(p, (2600.0, 180.0), 'vector2'), (0.37, 0.61), 'vector2'), jitter=1.0)
    f.mul(f.inv(f.ss(wf, 0.1, 0.22)), f.inv(f.mul(late, 0.8)), name='ws_pore')
    f.save()


def wood_pine():
    ROW = 0.15
    f = F('wood_pine', 'pn_', f'in: uv_sep. out: pn_loc (m: along U, across from the row centre), pn_rid (per-row random), pn_ph (ring phase), pn_sp (ring pitch, m), pn_fade, pn_lw (latewood, faded to its mean 0.28), pn_col (wood colour). Flat-sawn pine rows {ROW*1000:g} mm along V, grain along U. Softwood rings are the reverse of oak: pale straw earlywood, then an abrupt dark, hard latewood band, t 0.56..0.61 up and 0.92..1 down (smoothstep). Cone model: pith +-12 cm off the row centre, 4..12 cm deep, taper +-2%, pitch 6..11 mm; the latewood fades to its mean between 150 and 230 lines/m (|dR/dy|/pitch; moire-free under render.sh)')
    vr = f.div(V, ROW, name='pn_v')
    row = f.floor(vr, name='pn_row')
    c = f.mul(f.sub(f.sub(vr, row), 0.5), ROW, name='pn_c')
    f.c2(U, c, name='pn_loc')
    rid = f.cell(f.c2(row, 5.0), (200.37, 300.61), name='pn_rid')
    r = [f.r01(rid, k, 0.61) for k in (13.73, 29.17, 47.91, 71.33, 97.61)]
    zc = f.add(f.add(f.mul(r[1], 0.08), 0.04), f.mul(U, f.mul(f.sub(r[2], 0.5), 0.04)), name='pn_zc')
    dy = f.add(f.sub(c, f.mul(f.sub(r[0], 0.5), 0.24)), f.fn1(Ref('pn_loc'), (2.2, 6.0), (13.1, 2.9), 0.005), name='pn_dy')
    R = f.n('magnitude', name='pn_R', in_=f.c2(dy, zc))
    sp = f.add(f.mul(r[3], 0.005), 0.006, name='pn_sp')
    ph = f.add(f.div(R, sp), f.n('fractal2d', texcoord=f.c2(f.mul(R, 25.0), f.mul(r[4], 53.0)), amplitude=1.3, octaves=1), name='pn_ph')
    t = f.n('fract', name='pn_t', in_=ph)
    lw0 = f.mul(f.ss(t, 0.56, 0.61), f.inv(f.ss(t, 0.92, 1.0)), name='pn_lw0')
    fade = f.inv(f.ss(f.div(f.n('absval', in_=f.div(dy, R)), sp), 150.0, 230.0), name='pn_fade')
    lw = f.mix(0.28, lw0, fade, name='pn_lw')
    ewc = f.mix((0.56, 0.41, 0.24), (0.64, 0.48, 0.3), r[0], 'color3', name='pn_ewc')
    f.mul(f.mix(ewc, (0.34, 0.2, 0.1), lw, 'color3'), f.add(f.mul(r[3], 0.3), 0.85), 'color3', name='pn_col')
    f.save()


def surf_kerf():
    f = F('surf_kerf', 'kf_', 'in: pn_loc (m: along, across), pn_rid, uv. out: kf_saw (signed, ~+-0.5), kf_groove (0..1), h_kerf (m). Rough-sawn band-saw marks: noise stretched along the kerf line (texcoord x*200..300, y*5 in a frame turned +-4 deg per board) gives straight, irregular lines 3..5 mm apart; the kerf grooves are its zero crossings, 1 - smoothstep(|n|, 0, 0.22), about 1 mm wide. Relief 0.14 mm x n minus 0.06 mm grooves, in patches (35..100%)')
    sl = f.n('rotate2d', 'vector2', name='kf_sl', in_=Ref('pn_loc'), amount=f.mul(f.sub(f.r01(Ref('pn_rid'), 131.27, 0.2), 0.5), 8.0))
    sx, sy = f.sep(sl, 'kf_ss')
    sf = f.add(f.mul(f.r01(Ref('pn_rid'), 173.89, 0.4), 100.0), 200.0, name='kf_f')
    n = f.n('fractal2d', name='kf_n', texcoord=f.add(f.c2(f.mul(sx, sf), f.mul(f.add(sy, f.mul(Ref('pn_rid'), 11.0)), 5.0)), (3.3, 0.4), 'vector2'), octaves=1)
    pres = f.add(f.mul(f.n('clamp', in_=f.add(f.fn1(Ref('uv'), (2.5, 9.0), (1.3, 77.1), 0.8), 0.5)), 0.65), 0.35, name='kf_pres')
    saw = f.mul(n, pres, name='kf_saw')
    groove = f.mul(f.inv(f.ss(f.n('absval', in_=n), 0.0, 0.22)), pres, name='kf_groove')
    f.sub(f.mul(saw, 0.00014), f.mul(groove, 0.00006), name='h_kerf')
    f.save()


def surf_wash():
    f = F('surf_wash', 'wa_', 'in: pn_col, pn_lw, pn_rid, kf_saw, kf_groove, uv. out: wa_cov (0.03..0.95 wash coverage), wa_col. Translucent whitewash (0.78, 0.775, 0.75) mixed over the wood by a coverage built from the same layers as the relief: per board 0.36..0.82, brushy 30 x 10 cm patches +-0.45, latewood sheds it (-0.55 x lw), saw valleys and kerf grooves hold it. The wood shows through where it is thin, so it reads as a stain, not paint')
    cb = f.add(f.mul(f.r01(Ref('pn_rid'), 71.33, 0.9), 0.46), 0.36, name='wa_cb')
    patch = f.fn1(Ref('uv'), (2.5, 7.0), (3.1, 9.7), 0.45, name='wa_patch')
    grain = f.add(f.mul(Ref('pn_lw'), -0.55), 0.1, name='wa_grain')
    saw = f.add(f.mul(Ref('kf_saw'), -0.12), f.mul(Ref('kf_groove'), 0.05), name='wa_saw')
    cov = f.n('clamp', name='wa_cov', in_=f.add(f.add(cb, patch), f.add(grain, saw)), low=0.03, high=0.95)
    f.mix(Ref('pn_col'), (0.78, 0.775, 0.75), cov, 'color3', name='wa_col')
    f.save()


def wood_erode():
    f = F('wood_erode', 'er_', 'in: pn_ph, pn_sp, pn_fade. out: er_fig (1 soft earlywood trough .. 0 latewood ridge, faded to 0.5), h_erode (m). Weathered, eroded earlywood (barnwood): er_t = fract(phase + 0.24) is 0 at the pine latewood centre, and the profile 1 - smoothstep(|er_t - 0.5|, 0.15, 0.4) leaves a narrow rounded ridge and a wide trough. Depth 0.15 x ring pitch (~1..1.6 mm); the ring phase is read once')
    tw = f.n('absval', name='er_tw', in_=f.sub(f.n('fract', in_=f.add(Ref('pn_ph'), 0.24)), 0.5))
    fig = f.mix(0.5, f.inv(f.ss(tw, 0.15, 0.4)), Ref('pn_fade'), name='er_fig')
    f.mul(f.sub(fig, 0.5), f.mul(Ref('pn_sp'), -0.15), name='h_erode')
    f.save()


def surf_checks():
    P = 0.009
    f = F('surf_checks', 'ck_', f'in: pn_loc (m: along, across), pn_rid, uv_sep. out: ck_check (0..1), h_check (m). Along-grain checks from per-band slits: the across coordinate is cut into bands {P*1000:g} mm apart, each band line wobbles gently (+-3 mm at 3 x 8 /m), and a check is a slit on the band centre line whose half-width 0..0.1 band (up to 1.8 mm wide) follows a per-band noise along U (3/m) above a per-band threshold, so checks run straight, taper to points and are 5..30 cm long. Contours of 2-D noise zigzag across lattice rows instead')
    ax, cx = f.sep(Ref('pn_loc'), 'ck_ls')
    y = f.add(f.div(f.add(cx, f.fn1(Ref('pn_loc'), (3.0, 8.0), (7.7, 1.3), P * 0.35)), P), 0.5, name='ck_y')
    bi = f.floor(y, name='ck_bi')
    fy = f.n('absval', name='ck_fy', in_=f.sub(f.sub(y, bi), 0.5))
    br = f.cell(f.c2(bi, f.mul(Ref('pn_rid'), 97.0)), (7.7, 1.3), name='ck_br')
    pn = f.n('clamp', in_=f.add(f.fn1(f.c2(U, br), (3.0, 53.0), (7.7, 1.3), 0.8), 0.5), name='ck_pn')
    pres = f.ss(pn, f.add(f.mul(br, 0.3), 0.55), 1.0, name='ck_pres')
    tw = f.n('max', name='ck_tw', in1=f.mul(pres, 0.1), in2=0.0001)
    ck = f.mul(f.inv(f.ss(fy, 0.0, tw)), f.ss(tw, 0.01, 0.03), name='ck_check')
    f.mul(ck, -0.0012, name='h_check')
    f.save()



# ---------------------------------------------------------------- round 5: concrete (grains, pebbles, voids, cracks, streaks, swirls, bands, knots, imprint)
def worley(f, p, jit, name=None, t='float', style=0):
    k = dict(style=style) if style else {}
    return f.n('worleynoise2d', t, name, texcoord=p, jitter=jit, **k)


def w3(f, p, fr, off, amp, name=None, kind='noise2d', **kw):  # vector3 noise -> vector2 displacement (m)
    n = f.n(kind, 'vector3', texcoord=f.add(f.mul(p, fr, 'vector2'), off, 'vector2'), amplitude=('vector3', (amp, amp, 0.0)), **kw)
    return f.n('convert', 'vector2', name, in_=n)


def sand():
    f = F('sand', 'sd_', 'in: uv. out: sd_dome (0..1 grain domes), sd_tone (signed per-grain tone, 0 between grains), h_sand (m). Packed sand: two rotated layers of separate F1 domes 1 - smoothstep(F1, 0.05, 0.35) (r ~0.35 cell), 330/m (3 mm cells, ~2 mm grains) turned 11 deg and 520/m (1.9 mm cells, ~1.3 mm grains) turned -37 deg, jitter 0.85, max of the two; 0.12 mm high (~8 deg). Tint only the domes (sd_tone), so the matrix between them stays neutral')
    d = []
    for k, (fr, rot, off) in enumerate(((330.0, 11.0, (9.1, 2.7)), (520.0, -37.0, (1.3, 44.9)))):
        p = f.add(f.n('rotate2d', 'vector2', in_=f.mul(Ref('uv'), fr, 'vector2'), amount=rot), off, 'vector2', name=f'sd_p{k}')
        dome = f.inv(f.ss(worley(f, p, 0.85, f'sd_f{k}'), 0.05, 0.35), name=f'sd_d{k}')
        d.append((dome, worley(f, p, 0.85, f'sd_id{k}', style=1)))
    dome = f.n('max', name='sd_dome', in1=d[0][0], in2=d[1][0])
    f.add(f.mul(d[0][0], f.sub(d[0][1], 0.5)), f.mul(d[1][0], f.sub(d[1][1], 0.5)), name='sd_tone')
    f.mul(dome, 0.00012, name='h_sand')
    f.save()


def grit():
    f = F('grit', 'gt_', 'in: uv. out: gt_dome (0..1, for height), gt_m (0..1 flat-topped colour mask), gt_tone (signed per-grain tone), h_grit (m). Sparse coarse grains, the layer that makes paste read as stone at closeup: 300/m (3.3 mm cells), jitter 0.55, 55% of cells hold a grain r 0.12..0.22 cell (0.8..1.5 mm across; r <= (1 - jitter)/2, so none clip), on a grain-scale warp (1700/m, 0.1 mm, s = 0.17) so outlines are irregular. Dome smoothstep(r - F1, 0, r), 0.04 mm (~8 deg max)')
    p = f.add(f.mul(f.add(Ref('uv'), w3(f, Ref('uv'), 1700.0, (5.3, 71.9), 0.0001), 'vector2'), 300.0, 'vector2'), (8.8, 40.3), 'vector2', name='gt_p')
    f1 = worley(f, p, 0.55, 'gt_f1')
    gid = worley(f, p, 0.55, 'gt_id', style=1)
    r = f.mul(f.add(f.mul(f.r01(gid, 5.17, 0.3), 0.1), 0.12), f.gt(gid, 0.45), name='gt_r')
    d = f.sub(r, f1, name='gt_d')
    dome = f.ss(d, 0.0, f.n('max', in1=r, in2=0.01), name='gt_dome')
    m = f.ss(d, 0.0, f.n('max', in1=f.mul(r, 0.35), in2=0.004), name='gt_m')
    f.mul(m, f.sub(f.r01(gid, 11.9, 0.3), 0.6), name='gt_tone')
    f.mul(dome, 0.00004, name='h_grit')
    f.save()


def river():
    f = F('river', 'rp_', 'in: uv. out: rp_dome (0..1), rp_stone (0..1 stone mask), rp_near (0..1 on the matrix next to a stone: crevice AO), rp_id, rp_col, h_river (m). Rounded river pebbles 7..14 mm: a paraboloid dome max(1 - (F1/R)^2, 0) per stone, gated to 0 at the cell border by smoothstep(F2 - F1, 0.04, 0.28), with a per-stone R 0.24..0.46 cell for size variety (one worley grid; a second grid for mixed sizes leaves crescent slivers). 72 cells/m (13.9 mm), jitter 0.45, turned 23 deg, on a two-stage warp (30/m 4 mm, 110/m 0.8 mm; s 0.12 + 0.09). Heights 1..2.8 mm, bigger stones prouder; 5-colour palette with a per-stone brightness 0.8..1.15')
    uvw = f.add(Ref('uv'), f.add(w3(f, Ref('uv'), 30.0, (3.1, 7.9), 0.004), w3(f, Ref('uv'), 110.0, (41.3, 12.7), 0.0008), 'vector2'), 'vector2', name='rp_uvw')
    p = f.add(f.mul(f.n('rotate2d', 'vector2', in_=uvw, amount=23.0), 72.0, 'vector2'), (17.3, 5.1), 'vector2', name='rp_p')
    w = worley(f, p, 0.45, 'rp_w', 'vector2')
    rid = worley(f, p, 0.45, 'rp_id', style=1)
    f1 = f.n('extract', name='rp_f1', in_=w, index=0)
    e = f.n('dotproduct', name='rp_e', in1=w, in2=('vector2', (-1.0, 1.0)))
    rr = f.r01(rid, 7.31, 0.13, name='rp_rr')
    q = f.div(f1, f.add(f.mul(rr, 0.22), 0.24), name='rp_q')
    dome = f.mul(f.n('max', in1=f.inv(f.mul(q, q)), in2=0.0), f.ss(e, 0.04, 0.28), name='rp_dome')
    f.mul(dome, f.add(f.mul(f.add(f.mul(rr, 0.5), f.mul(f.r01(rid, 3.17, 0.41), 0.5)), 0.0018), 0.001), name='h_river')
    f.ss(dome, 0.0, 0.12, name='rp_stone')
    s_ = f.n('min', name='rp_s', in1=f.sub(0.35, f1), in2=f.mul(e, 0.5))  # constant R and gap: continuous across borders
    f.ss(s_, -0.06, 0.0, name='rp_near')
    k = f.r01(rid, 13.7, 0.05, name='rp_k')
    c = ('color3', (0.78, 0.77, 0.74))  # white quartz above 0.9
    for t, col in reversed(((0.25, (0.40, 0.31, 0.21)), (0.45, (0.62, 0.56, 0.44)), (0.6, (0.27, 0.14, 0.08)), (0.9, (0.2, 0.215, 0.23)))):
        c = f.n('ifgreater', 'color3', value1=k, value2=t, in1=c, in2=('color3', col))
    f.mul(c, f.add(f.mul(f.r01(rid, 5.37, 0.71), 0.35), 0.8), 'color3', name='rp_col')
    f.save()


def voids():
    f = F('voids', 'av_', 'in: uv. out: av_m (0..1 void mask), av_ao (albedo factor 0.2..1), h_void (m). Air voids and bug holes with a flat floor, 1 - smoothstep(t, 0.6, 1), t = F1/r (a rim at 0.45..0.68 of r; higher is crisper), on a warped texcoord (250/m, 0.5 mm, s = 0.125) for ragged outlines, plus strong baked AO: walls x0.5, core x0.4. 12 cells/m, jitter 0.7, 30% of cells, r = 0.02 + 0.055*rand^2 cell (1.7..6 mm, mostly small), depth 0.25 r (~43 deg wall). A (1 - t^2) bowl reads as a soft dimple or a lunar crater')
    p = f.add(f.mul(f.add(Ref('uv'), w3(f, Ref('uv'), 250.0, (5.1, 9.7), 0.0005), 'vector2'), 12.0, 'vector2'), (3.7, 1.9), 'vector2', name='av_p')
    f1 = worley(f, p, 0.7, 'av_f1')
    vid = worley(f, p, 0.7, 'av_id', style=1)
    on = f.gt(vid, 0.7, name='av_on')
    rr = f.r01(vid, 7.31, 0.0)
    r = f.add(f.mul(f.mul(f.mul(rr, rr), 0.055), on), 0.02, name='av_r')
    t = f.div(f1, r, name='av_t')
    m = f.mul(f.inv(f.ss(t, 0.6, 1.0)), on, name='av_m')
    core = f.mul(f.inv(f.ss(t, 0.0, 0.8)), on, name='av_core')
    f.mul(f.mix(1.0, 0.5, m), f.mix(1.0, 0.4, core), name='av_ao')
    f.mul(m, f.mul(r, -0.0208), name='h_void')  # depth 0.25 r: r cells / 12 per m * 0.25
    f.save()


def crack_sparse():
    FC, ST, D = 1.1, 1.7, 0.005
    f = F('crack_sparse', 'sk_', f'in: uv. out: sk_d (m to the crack centreline), sk_hw (half width, m), sk_crack (0..1), sk_halo (0..1 dirt halo), h_sk (m). A few long, meandering structural cracks instead of a crazing network: Voronoi borders at ~1 cell/m ({FC} x {FC*ST:.2f} /m: stretched {ST}x after a 28 deg turn, which breaks the 120 deg Y-junctions and runs cracks long), kept where a presence noise at 0.55/m (half the cell frequency) passes a wide ramp 0.4..0.55: ~40% of the borders, each tapering to points over ~20 cm. Warp 1.3/m 12 cm (s 0.16), 5/m 3 cm, then 30/m 2.5 mm 3-oct (s 0.08) for jagged kinks. True distance = (F2 - F1)/|grad|, with the finite-difference step ({D*1000:g} mm) taken in metres before the turn and stretch, so sk_d is in metres whatever the stretch. Half width 1..2.6 mm, depth 0.38 x half width')
    uv1 = f.add(Ref('uv'), w3(f, Ref('uv'), 1.3, (3.1, 7.9), 0.12), 'vector2', name='sk_uv1')
    uv2 = f.add(uv1, w3(f, uv1, 5.0, (8.3, 1.7), 0.03, kind='fractal2d', octaves=1), 'vector2', name='sk_uv2')  # deep texcoord: fractal2d (bug 6)
    uvw = f.add(uv2, w3(f, uv2, 30.0, (21.9, 4.2), 0.0025, kind='fractal2d', octaves=3), 'vector2', name='sk_uvw')

    def e(q, name=None):
        p = f.add(f.mul(f.n('rotate2d', 'vector2', in_=q, amount=28.0), (FC, FC * ST), 'vector2'), (0.37, 0.71), 'vector2')
        return f.n('dotproduct', name=name, in1=worley(f, p, 1.0, t='vector2'), in2=('vector2', (-1.0, 1.0)))
    e0 = e(uvw, 'sk_e0')
    g = f.c2(f.sub(e(f.add(uvw, (D, 0.0), 'vector2')), e0), f.sub(e(f.add(uvw, (0.0, D), 'vector2')), e0), name='sk_g')
    gm = f.n('max', name='sk_gm', in1=f.div(f.n('magnitude', in_=g), D), in2=0.4)  # cells per metre
    d = f.div(e0, gm, name='sk_d')
    pres = f.ss(f.n('noise2d', texcoord=f.add(f.mul(Ref('uv'), 0.55, 'vector2'), (41.3, 12.9), 'vector2'), amplitude=0.8, pivot=0.5), 0.4, 0.55, name='sk_pres')
    wn = f.n('clamp', in_=f.add(f.fn1(uvw, 9.0, (5.7, 33.1), 0.8), 0.5), name='sk_wn')
    hw0 = f.mul(pres, f.add(f.mul(wn, 0.0016), 0.001), name='sk_hw0')
    hw = f.n('max', name='sk_hw', in1=hw0, in2=0.00002)
    gate = f.ss(hw0, 0.00015, 0.0005, name='sk_gate')
    crack = f.mul(f.inv(f.ss(d, 0.0, hw)), gate, name='sk_crack')
    f.mul(f.inv(f.ss(d, hw, f.add(f.mul(hw, 3.0), 0.005))), gate, name='sk_halo')
    f.mul(crack, f.mul(hw, -0.38), name='h_sk')
    f.save()


def rain():
    f = F('rain', 'rn_', 'in: uv, uv_sep. out: rn_streak (0..1; colour and roughness only). Rain streaks down the wall (-V): zero contours |n| < w*presence of noise stretched along V, on a texcoord whose u wavers slowly (6 mm at 2 x 5 /m, s 0.03). Thin family 22 x 0.8 /m: lines ~5 cm apart, 8..12 mm wide, 30..80 cm long; broad washes 6.5 x 0.55 /m, 3..5 cm wide; intensity varies along each streak. Soft stains fade their intensity with the presence as well as the threshold: a threshold-only taper (right for cracks) ends every streak in a sharp grass-blade point')
    uvs = f.c2(f.add(U, f.n('noise2d', texcoord=f.add(f.mul(Ref('uv'), (2.0, 5.0), 'vector2'), (3.1, 7.7), 'vector2'), amplitude=0.006)), V, name='rn_uvs')

    def fam(fu, fv, off, w0, pf, poff, tag):
        nn = f.n('absval', in_=f.fn1(uvs, (fu, fv), off))  # fractal2d octaves=1 = noise2d, cheap on a derived texcoord
        pres = f.ss(f.n('noise2d', texcoord=f.add(f.mul(Ref('uv'), pf, 'vector2'), poff, 'vector2')), -0.05, 0.35, name=f'rn_pres{tag}')
        return f.mul(f.ss(f.sub(f.mul(pres, w0), nn), 0.0, w0 * 0.9), f.ss(pres, 0.05, 0.6), name=f'rn_s{tag}')
    thin = fam(22.0, 0.8, (5.3, 1.9), 0.15, (5.0, 1.0), (8.7, 3.4), 'a')
    broad = fam(6.5, 0.55, (41.3, 12.8), 0.22, (3.0, 0.8), (6.2, 29.1), 'b')
    inten = f.n('noise2d', name='rn_int', texcoord=f.add(f.mul(Ref('uv'), (9.0, 3.5), 'vector2'), (8.8, 2.2), 'vector2'), amplitude=0.8, pivot=0.55)
    f.n('clamp', name='rn_streak', in_=f.add(f.mul(f.mul(thin, f.n('clamp', in_=inten)), 0.7), f.mul(broad, 0.45)))
    f.save()


def swirl():
    f = F('swirl', 'sw_', 'in: uv. out: sw_swirl (0..1; roughness only, add ~0.07). Grinder swirls on polished concrete: partial arcs of fine scratches round jittered centres, one grid of 38 cm cells turned 17 deg (repeat the block on 1-2 more grids, e.g. 29 cm at -38 deg and 33 cm at 71 deg, and take the max); full rings read as a bullseye. Arcs ~2.5 mm apart radially between 0.12 and 0.4 cell; an angular gate (noise of the angle, per cell) keeps ~1/3 of each circle, 1 - smoothstep(|theta|, 2.7, 3.1) hides the atan2 seam at +-pi, and 75% of cells hold a swirl. Noise on polar coordinates is fractal2d octaves=1 (bug 6)')
    out = []
    for k, (cell, ang, o, seed) in enumerate(((0.38, 17.0, (0.3, 0.7), 23.0),)):
        p = f.add(f.mul(f.n('rotate2d', 'vector2', in_=Ref('uv'), amount=ang), round(1.0 / cell, 4), 'vector2'), o, 'vector2')
        fl = f.floor(p, 'vector2', name=f'sw_fl{k}')
        jx = f.cell(fl, (seed, 11.0), name=f'sw_jx{k}')
        jy = f.cell(fl, (5.0, seed))
        loc = f.sub(f.sub(p, fl, 'vector2'), f.add(f.mul(f.sub(f.c2(jx, jy), (0.5, 0.5), 'vector2'), 0.2, 'vector2'), (0.5, 0.5), 'vector2'), 'vector2', name=f'sw_loc{k}')
        r = f.n('magnitude', name=f'sw_r{k}', in_=loc)
        lx, ly = f.sep(loc, f'sw_ls{k}')
        th = f.n('atan2', name=f'sw_th{k}', iny=ly, inx=lx)
        arc = f.ss(f.fn1(f.c2(f.mul(r, cell / 0.0025), f.mul(th, 2.2)), 1.0, (seed, 3.3)), 0.1, 0.5)
        ring = f.mul(f.ss(r, 0.12, 0.22), f.inv(f.ss(r, 0.3, 0.4)))
        gate = f.ss(f.fn1(f.c2(f.mul(th, 1.1), f.mul(jx, 50.0)), 1.0, (0.0, 0.0)), 0.0, 0.25)
        seam = f.inv(f.ss(f.n('absval', in_=th), 2.7, 3.1))
        pres = f.ss(f.cell(fl, (seed, seed)), 0.25, 0.4)
        out.append(f.mul(f.mul(arc, f.mul(ring, gate)), f.mul(seam, pres), name='sw_swirl'))
    f.save()


def band_xfade():
    P = 0.7
    f = F('band_xfade', 'bx_', f'in: uv, uv_sep. out: bx_h (m), bx_tone (0..1 per-pass random, cross-faded). Broom passes ~35 cm wide, each with its own stroke angle (+-4 deg), pressure (0.45..1.3) and seed, without seams: two band lattices of period {P} m, half a period apart, each weighted by w = smoothstep(tri, 0.3, 0.7) (tri = 1 at its band centre, 0 at its border, so w0 + w1 = 1), blended as (w0*h0 + w1*h1)/sqrt(w0^2 + w1^2). Dividing by the RMS weight keeps the stroke contrast through the ~7 cm overlap; a plain weighted average loses ~30% of it at w0 = w1 = 0.5. Borders wobble +-3 cm; strokes are noise 9 x 330 /m, 0.36 mm (~3 mm apart, ~4 deg)')
    vw = f.add(V, f.fn1(Ref('uv'), 2.3, (3.1, 7.7), 0.06), name='bx_v')
    hs, ws, ts = [], [], []
    for k in (0, 1):
        vb = f.add(f.div(vw, P), 0.5 * k, name=f'bx_vb{k}')
        band = f.floor(vb, name=f'bx_id{k}')
        fr = f.sub(vb, band)
        r1 = f.cell(f.c2(band, 7.5 + 13 * k), (0.0, 0.0), name=f'bx_r1{k}')
        r2 = f.cell(f.c2(band, 31.5 + 13 * k), (0.0, 0.0), name=f'bx_r2{k}')
        rot = f.n('rotate2d', 'vector2', in_=Ref('uv'), amount=f.mul(f.sub(r1, 0.5), 8.0))
        p = f.add(rot, f.mul(f.c2(r2, r1), (53.0, 17.0), 'vector2'), 'vector2', name=f'bx_p{k}')
        hs.append(f.mul(f.fn1(p, (9.0, 330.0), (0.11, 0.0037), 0.00036), f.add(f.mul(r2, 0.85), 0.45), name=f'bx_h{k}'))
        ws.append(f.ss(f.inv(f.mul(f.n('absval', in_=f.sub(fr, 0.5)), 2.0)), 0.3, 0.7, name=f'bx_w{k}'))
        ts.append(r1)
    num = f.add(f.mul(hs[0], ws[0]), f.mul(hs[1], ws[1]))
    den = f.n('sqrt', in_=f.add(f.mul(ws[0], ws[0]), f.mul(ws[1], ws[1])))
    f.div(num, den, name='bx_h')
    f.add(f.mul(ts[0], ws[0]), f.mul(ts[1], ws[1]), name='bx_tone')
    f.save()


def knot_cells():
    C = 0.4
    f = F('knot_cells', 'kc_', f'in: pk_loc, pk_id, uv_sep. out: wk_loc, wk_bump, wk_core, wk_rim (the knot recipe\'s outputs, so it drops in for it), kc_swirl (0..1 swirl zone), kc_ring (0..1 swirl-ring profile). Knots along long boards: {C*1000:g} mm cells along U, keyed on (board id, cell), 40% hold a knot r 5..11 mm, +-8 cm along the cell and +-4 cm across (a knot a butt joint cuts is simply cut, as in real boards). The deflection and bump are windowed by 1 - smoothstep(|x_cell|, 0.33, 0.5), so they are 0 at the cell ends and the grain stays continuous. Swirl: explicit rings 4 mm apart from 0.9r out to ~2.6r, wobbled +-1.2 mm by 2-oct noise (perfect rings read as a bullseye; deflection plus a core alone reads as a stain). Mix it into the figure: fig = mix(wr_fig, kc_ring, kc_swirl). Squared radii use dotproduct, so wk_loc stays small: the ring recipe reads it ~8 times (bug 7)')
    kx = f.div(U, C, name='kc_x')
    kf = f.sub(f.n('fract', in_=kx), 0.5, name='kc_f')
    kid = f.cell(f.c2(f.mul(Ref('pk_id'), 97.0), f.floor(kx)), (5.3, 71.9), name='kc_id')
    on = f.gt(f.r01(kid, 18.81, 0.37), 0.6, name='kc_on')
    onw = f.mul(on, f.inv(f.ss(f.n('absval', in_=kf), 0.33, 0.5)), name='kc_onw')
    kr = f.add(f.mul(f.r01(kid, 39.963, 0.37), 0.006), 0.005, name='kc_r')
    kr2 = f.mul(kr, kr, name='kc_r2')
    lx, ly = f.sep(Ref('pk_loc'), 'kc_ls')
    qx = f.mul(f.sub(kf, f.mul(f.sub(f.r01(kid, 65.637, 0.37), 0.5), 0.4)), C)
    qy = f.sub(ly, f.mul(f.sub(f.r01(kid, 97.722, 0.37), 0.5), 0.08), name='kc_qy')
    q = f.c2(qx, qy, name='kc_q')
    qa = f.mul(q, (0.7, 1.0), 'vector2', name='kc_qa')
    f.mul(f.div(kr2, f.add(f.n('dotproduct', in1=qa, in2=qa), kr2)), f.mul(onw, 0.004), name='wk_bump')
    qe = f.mul(q, (0.4, 1.0), 'vector2', name='kc_qe')
    dfl = f.mul(f.div(f.mul(kr2, 1.6), f.add(f.n('dotproduct', in1=qe, in2=qe), kr2)), onw, name='kc_def')
    f.sub(Ref('pk_loc'), f.c2(0.0, f.mul(qy, dfl)), 'vector2', name='wk_loc')
    rho = f.n('magnitude', name='kc_rho', in_=qa)
    f.mul(f.inv(f.ss(rho, f.mul(kr, 0.85), kr)), on, name='wk_core')
    f.mul(f.mul(f.ss(rho, f.mul(kr, 0.8), f.mul(kr, 0.95)), f.inv(f.ss(rho, kr, f.mul(kr, 1.2)))), on, name='wk_rim')
    wob = f.fn1(Ref('pk_loc'), (90.0, 140.0), (8.8, 3.1), 0.0012, octaves=2, name='kc_wob')
    f.inv(f.ss(f.n('absval', in_=f.sub(f.n('fract', in_=f.div(f.add(rho, wob), 0.004)), 0.5)), 0.22, 0.42), name='kc_ring')
    f.mul(f.mul(f.ss(rho, f.mul(kr, 0.9), f.mul(kr, 1.1)), f.inv(f.ss(rho, f.mul(kr, 1.4), f.mul(kr, 2.6)))), onw, name='kc_swirl')
    f.save()


def imprint():
    f = F('imprint', 'im_', 'in: wr_fig, kc_ring, kc_swirl, wk_core, pk_d, uv. out: im_fig (figure with knot swirls, 0..1), im_fin (0..1 paste fin), h_imp (m). Board-formed concrete takes the NEGATIVE of the board surface: the weathered board\'s soft earlywood is eroded 0.26 mm below the mean and its knot cores stand 0.15 mm proud, so in the concrete earlywood becomes ridges and knots become dimples. The grain fades to 0 inside the joint, smoothstep(pk_d, 1.5, 5 mm), where cement paste squeezed between the boards leaves a fin 0.4..2.2 mm from the edge: +0.28 mm, broken to -0.12 mm in patches')
    fig = f.mix(Ref('wr_fig'), Ref('kc_ring'), Ref('kc_swirl'), name='im_fig')
    wood = f.add(f.mul(f.sub(0.35, fig), 0.0004), f.mul(Ref('wk_core'), 0.00015), name='im_wood')
    keep = f.ss(Ref('pk_d'), 0.0015, 0.005, name='im_keep')
    line = f.inv(f.ss(Ref('pk_d'), 0.0004, 0.0022), name='im_line')
    fp = f.ss(f.fn1(Ref('uv'), 6.0, (41.3, 7.7), octaves=2), -0.25, 0.25, name='im_fp')
    f.mul(line, fp, name='im_fin')
    fin = f.mul(line, f.sub(f.mul(fp, 0.0004), 0.00012), name='im_finh')
    f.add(f.mul(f.mul(wood, keep), -1.0), fin, name='h_imp')
    f.save()



for fn in (lay_stagger, lay_chevron, lay_rows, wood_knot, wood_rings, wood_pores, wood_fleck, wood_color, wood_height, wood_end, polar, scoops, dents,
           prof_mould, prof_bow, prof_cove, prof_step, prof_batten, prof_over, prof_channel, lay_bookmatch, wood_fiddle, wood_lacquer,
           wood_relief, wood_straight, wood_pine, surf_kerf, surf_wash, wood_erode, surf_checks,
           sand, grit, river, voids, crack_sparse, rain, swirl, band_xfade, knot_cells, imprint):
    fn()
