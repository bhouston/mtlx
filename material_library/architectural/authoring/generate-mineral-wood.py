#!/usr/bin/env python3
"""Regenerate catalog families 1–8. Python standard library only.

All color constants are authored linear Rec.709 art-direction targets, not measured
swatches. UV units and height are metres. The procedural textures describe a single
continuous surface; they deliberately contain no board, brick, or tile arrangements.
"""
from __future__ import annotations
import hashlib
import math
import re
from pathlib import Path
import xml.etree.ElementTree as ET

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
DEST = HERE.parent
SOURCE = ROOT / 'ARCHITECTURAL_MATERIALS.md'
if not SOURCE.exists():
    SOURCE = HERE / 'catalog-source.md'

# Linear-light RGB palette, deliberately below perfect white / above perfect black.
COLORS = {
 'PureWhite':(.82,.82,.82), 'WarmWhite':(.78,.745,.65), 'ChalkWhite':(.77,.76,.71),
 'White':(.75,.74,.69), 'Ivory':(.74,.67,.52), 'Cream':(.67,.57,.39),
 'Beige':(.46,.36,.25), 'Greige':(.38,.34,.29), 'Sand':(.51,.40,.26),
 'LightGray':(.52,.52,.50), 'MediumGray':(.30,.31,.31), 'NaturalGray':(.36,.37,.35),
 'WarmGray':(.37,.34,.29), 'CoolGray':(.31,.35,.38), 'DarkGray':(.12,.135,.14),
 'BlueGray':(.20,.27,.31), 'SilverGray':(.39,.42,.42), 'Gray':(.33,.34,.33),
 'Charcoal':(.058,.063,.066), 'BlueBlack':(.022,.028,.034), 'Black':(.018,.019,.020),
 'SageGreen':(.27,.35,.23), 'OliveGreen':(.19,.23,.08), 'ForestGreen':(.035,.095,.055),
 'PaleBlue':(.37,.55,.64), 'SkyBlue':(.16,.40,.60), 'NavyBlue':(.022,.047,.11),
 'DustyRose':(.43,.24,.23), 'MutedPurple':(.20,.12,.23), 'EarthBrown':(.21,.105,.045),
 'DarkBrown':(.075,.035,.017), 'Brown':(.22,.115,.056), 'Salmon':(.49,.225,.14),
 'Terracotta':(.43,.14,.067), 'Ochre':(.47,.29,.07), 'Buff':(.52,.39,.22),
 'Emerald':(.025,.24,.095), 'Turquoise':(.035,.40,.37), 'Cobalt':(.018,.065,.35),
 'Amber':(.53,.23,.025), 'Celadon':(.39,.55,.37), 'Green':(.13,.26,.15),
 'Olive':(.20,.24,.10), 'Blue':(.045,.135,.31), 'Navy':(.023,.05,.12),
 'Sage':(.27,.35,.23), 'Pink':(.62,.35,.33), 'Rose':(.48,.23,.21),
 'Teal':(.025,.22,.21), 'Orange':(.52,.19,.055), 'Yellow':(.73,.49,.035),
 'Red':(.39,.045,.028), 'Rust':(.25,.075,.03), 'Honey':(.53,.30,.065),
}
WOOD = {
 'whiteOak':(.43,.31,.18), 'redOak':(.42,.235,.135), 'maple':(.61,.47,.28),
 'birch':(.58,.45,.29), 'beech':(.51,.35,.21), 'ash':(.57,.43,.25),
 'walnut':(.18,.09,.043), 'cherry':(.37,.145,.065), 'pine':(.60,.40,.18),
 'spruce':(.61,.49,.31), 'douglasFir':(.44,.24,.105), 'westernRedCedar':(.33,.15,.07),
 'easternWhiteCedar':(.54,.40,.23), 'larch':(.48,.29,.13), 'teak':(.32,.20,.085),
 'ipe':(.14,.073,.032), 'mahogany':(.28,.078,.033), 'sapele':(.28,.105,.047),
 'bambooNatural':(.57,.43,.20), 'bambooCarbonized':(.33,.18,.065),
}

MARBLE_RECIPE = r'''<!-- in: sl_p (slab coords, m). out: mv_vein (0..1: mix the vein colour by it), mv_core. Warp 4/m A 25 mm (s 0.1) then fBm 15/m A 6 mm (s 0.09). Main veins: |fBm| contours at (3, 10)/m, 5 oct; soft core t 0.008..0.032 (edge wobble at 90/m) swelling and fading over ~35 cm, pigment varying along the vein, halo offset to one side and broken by clouds. Hairline network: finer contours, t 0.005, in its own patches -->
<multiply name="mv_w1p0" type="vector2"><input name="in1" type="vector2" nodename="sl_p" /><input name="in2" type="float" value="4" /></multiply>
<add name="mv_w1p" type="vector2"><input name="in1" type="vector2" nodename="mv_w1p0" /><input name="in2" type="vector2" value="3.1, 7.9" /></add>
<noise2d name="mv_w1" type="vector3"><input name="texcoord" type="vector2" nodename="mv_w1p" /><input name="amplitude" type="vector3" value="0.025, 0.025, 0" /></noise2d>
<convert name="mv_w1v" type="vector2"><input name="in" type="vector3" nodename="mv_w1" /></convert>
<add name="mv_m1" type="vector2"><input name="in1" type="vector2" nodename="sl_p" /><input name="in2" type="vector2" nodename="mv_w1v" /></add>
<multiply name="mv_w2p0" type="vector2"><input name="in1" type="vector2" nodename="mv_m1" /><input name="in2" type="float" value="15" /></multiply>
<add name="mv_w2p" type="vector2"><input name="in1" type="vector2" nodename="mv_w2p0" /><input name="in2" type="vector2" value="11.3, 4.7" /></add>
<fractal2d name="mv_w2" type="vector3"><input name="texcoord" type="vector2" nodename="mv_w2p" /><input name="octaves" type="integer" value="3" /><input name="amplitude" type="vector3" value="0.006, 0.006, 0" /></fractal2d>
<convert name="mv_w2v" type="vector2"><input name="in" type="vector3" nodename="mv_w2" /></convert>
<add name="mv_m" type="vector2"><input name="in1" type="vector2" nodename="mv_m1" /><input name="in2" type="vector2" nodename="mv_w2v" /></add>
<multiply name="mv_vp0" type="vector2"><input name="in1" type="vector2" nodename="mv_m" /><input name="in2" type="vector2" value="3, 10" /></multiply>
<add name="mv_vp" type="vector2"><input name="in1" type="vector2" nodename="mv_vp0" /><input name="in2" type="vector2" value="17.3, 5.8" /></add>
<fractal2d name="mv_v" type="float"><input name="texcoord" type="vector2" nodename="mv_vp" /><input name="octaves" type="integer" value="5" /></fractal2d>
<absval name="mv_va" type="float"><input name="in" type="float" nodename="mv_v" /></absval>
<multiply name="mv_tpp0" type="vector2"><input name="in1" type="vector2" nodename="sl_p" /><input name="in2" type="float" value="2" /></multiply>
<add name="mv_tpp" type="vector2"><input name="in1" type="vector2" nodename="mv_tpp0" /><input name="in2" type="vector2" value="29.6, 15.2" /></add>
<noise2d name="mv_tp" type="float"><input name="texcoord" type="vector2" nodename="mv_tpp" /><input name="amplitude" type="float" value="0.8" /><input name="pivot" type="float" value="0.5" /></noise2d>
<smoothstep name="mv_tap" type="float"><input name="in" type="float" nodename="mv_tp" /><input name="low" type="float" value="0.15" /><input name="high" type="float" value="0.85" /></smoothstep>
<multiply name="mv_ep0" type="vector2"><input name="in1" type="vector2" nodename="mv_m" /><input name="in2" type="float" value="90" /></multiply>
<add name="mv_ep" type="vector2"><input name="in1" type="vector2" nodename="mv_ep0" /><input name="in2" type="vector2" value="41.3, 9.1" /></add>
<noise2d name="mv_en" type="float"><input name="texcoord" type="vector2" nodename="mv_ep" /><input name="amplitude" type="float" value="0.012" /><input name="pivot" type="float" value="0.02" /></noise2d>
<multiply name="mv_tc0" type="float"><input name="in1" type="float" nodename="mv_tap" /><input name="in2" type="float" nodename="mv_en" /></multiply>
<max name="mv_tc" type="float"><input name="in1" type="float" nodename="mv_tc0" /><input name="in2" type="float" value="0.0001" /></max>
<multiply name="mv_tl" type="float"><input name="in1" type="float" nodename="mv_tc" /><input name="in2" type="float" value="0.4" /></multiply>
<smoothstep name="mv_cs" type="float"><input name="in" type="float" nodename="mv_va" /><input name="low" type="float" nodename="mv_tl" /><input name="high" type="float" nodename="mv_tc" /></smoothstep>
<subtract name="mv_c0" type="float"><input name="in1" type="float" value="1" /><input name="in2" type="float" nodename="mv_cs" /></subtract>
<multiply name="mv_dp0" type="vector2"><input name="in1" type="vector2" nodename="mv_m" /><input name="in2" type="float" value="60" /></multiply>
<add name="mv_dp" type="vector2"><input name="in1" type="vector2" nodename="mv_dp0" /><input name="in2" type="vector2" value="7.7, 2.3" /></add>
<noise2d name="mv_dn" type="float"><input name="texcoord" type="vector2" nodename="mv_dp" /><input name="amplitude" type="float" value="0.3" /><input name="pivot" type="float" value="0.75" /></noise2d>
<multiply name="mv_core" type="float"><input name="in1" type="float" nodename="mv_c0" /><input name="in2" type="float" nodename="mv_dn" /></multiply>
<subtract name="mv_vh" type="float"><input name="in1" type="float" nodename="mv_v" /><input name="in2" type="float" value="0.04" /></subtract>
<absval name="mv_vha" type="float"><input name="in" type="float" nodename="mv_vh" /></absval>
<multiply name="mv_th0" type="float"><input name="in1" type="float" nodename="mv_tap" /><input name="in2" type="float" value="0.1" /></multiply>
<max name="mv_th" type="float"><input name="in1" type="float" nodename="mv_th0" /><input name="in2" type="float" value="0.0001" /></max>
<smoothstep name="mv_hs" type="float"><input name="in" type="float" nodename="mv_vha" /><input name="low" type="float" value="0" /><input name="high" type="float" nodename="mv_th" /></smoothstep>
<multiply name="mv_cp0" type="vector2"><input name="in1" type="vector2" nodename="mv_m" /><input name="in2" type="float" value="20" /></multiply>
<add name="mv_cp" type="vector2"><input name="in1" type="vector2" nodename="mv_cp0" /><input name="in2" type="vector2" value="3.3, 61.7" /></add>
<fractal2d name="mv_cl" type="float"><input name="texcoord" type="vector2" nodename="mv_cp" /><input name="octaves" type="integer" value="3" /><input name="amplitude" type="float" value="0.4" /></fractal2d>
<add name="mv_cl1" type="float"><input name="in1" type="float" nodename="mv_cl" /><input name="in2" type="float" value="0.3" /></add>
<clamp name="mv_cld" type="float"><input name="in" type="float" nodename="mv_cl1" /></clamp>
<subtract name="mv_h0" type="float"><input name="in1" type="float" value="1" /><input name="in2" type="float" nodename="mv_hs" /></subtract>
<multiply name="mv_halo" type="float"><input name="in1" type="float" nodename="mv_h0" /><input name="in2" type="float" nodename="mv_cld" /></multiply>
<multiply name="mv_up0" type="vector2"><input name="in1" type="vector2" nodename="mv_m" /><input name="in2" type="vector2" value="6, 13" /></multiply>
<add name="mv_up" type="vector2"><input name="in1" type="vector2" nodename="mv_up0" /><input name="in2" type="vector2" value="71.9, 23.3" /></add>
<fractal2d name="mv_u" type="float"><input name="texcoord" type="vector2" nodename="mv_up" /><input name="octaves" type="integer" value="4" /></fractal2d>
<absval name="mv_ua" type="float"><input name="in" type="float" nodename="mv_u" /></absval>
<multiply name="mv_upp0" type="vector2"><input name="in1" type="vector2" nodename="sl_p" /><input name="in2" type="float" value="3" /></multiply>
<add name="mv_upp" type="vector2"><input name="in1" type="vector2" nodename="mv_upp0" /><input name="in2" type="vector2" value="5.5, 88.1" /></add>
<noise2d name="mv_upn" type="float"><input name="texcoord" type="vector2" nodename="mv_upp" /><input name="amplitude" type="float" value="0.8" /><input name="pivot" type="float" value="0.5" /></noise2d>
<smoothstep name="mv_utap" type="float"><input name="in" type="float" nodename="mv_upn" /><input name="low" type="float" value="0.3" /><input name="high" type="float" value="0.7" /></smoothstep>
<multiply name="mv_ut0" type="float"><input name="in1" type="float" nodename="mv_utap" /><input name="in2" type="float" value="0.005" /></multiply>
<max name="mv_ut" type="float"><input name="in1" type="float" nodename="mv_ut0" /><input name="in2" type="float" value="0.0001" /></max>
<smoothstep name="mv_us" type="float"><input name="in" type="float" nodename="mv_ua" /><input name="low" type="float" value="0" /><input name="high" type="float" nodename="mv_ut" /></smoothstep>
<subtract name="mv_u1" type="float"><input name="in1" type="float" value="1" /><input name="in2" type="float" nodename="mv_us" /></subtract>
<multiply name="mv_hair" type="float"><input name="in1" type="float" nodename="mv_u1" /><input name="in2" type="float" value="0.55" /></multiply>
<multiply name="mv_hw" type="float"><input name="in1" type="float" nodename="mv_halo" /><input name="in2" type="float" value="0.3" /></multiply>
<max name="mv_v2" type="float"><input name="in1" type="float" nodename="mv_core" /><input name="in2" type="float" nodename="mv_hw" /></max>
<max name="mv_vein" type="float"><input name="in1" type="float" nodename="mv_v2" /><input name="in2" type="float" nodename="mv_hair" /></max>'''

class Ref:
    def __init__(self, name, typ): self.name, self.typ = name, typ

class Graph:
    def __init__(self, name, seed):
        self.el = ET.Element('nodegraph', name='NG_' + name)
        self.i = 0
        self.seed = seed
        self.uv = self.n('texcoord', 'vector2', name='uv')
        self.el.append(ET.Comment(' Metric UVs: one UV unit = one metre. Height values below are metres. '))
    def n(self, category, typ='float', name=None, **ins):
        if name is None:
            self.i += 1
            name = category + '_' + str(self.i)
        node = ET.SubElement(self.el, category, name=name, type=typ)
        for port, val in ins.items():
            port = port.rstrip('_')
            if isinstance(val, Ref):
                ET.SubElement(node,'input', name=port, type=val.typ, nodename=val.name)
            else:
                if isinstance(val, tuple) and len(val)==2 and isinstance(val[1], str):
                    val, vt = val
                else: vt = 'float'
                value = ', '.join(f'{x:.9g}' for x in val) if isinstance(val,(list,tuple)) else str(val).lower() if isinstance(val,bool) else f'{val:.9g}'
                ET.SubElement(node,'input',name=port,type=vt,value=value)
        return Ref(name,typ)
    def c(self, value, typ='float', name=None): return self.n('constant',typ,name=name,value=(value,typ))
    def add(self,a,b,typ='float',name=None): return self.n('add',typ,name=name,in1=a,in2=b)
    def sub(self,a,b,typ='float',name=None): return self.n('subtract',typ,name=name,in1=a,in2=b)
    def mul(self,a,b,typ='float',name=None): return self.n('multiply',typ,name=name,in1=a,in2=b)
    def mix(self,a,b,t,typ='float',name=None): return self.n('mix',typ,name=name,bg=a,fg=b,mix=t)
    def ss(self,a,low,high,name=None): return self.n('smoothstep',name=name,in_=a,low=low,high=high)
    def clamp(self,a,lo=0,hi=1,name=None): return self.n('clamp',name=name,in_=a,low=lo,high=hi)
    def point(self,freq,offset=(3.37,8.61),uv=None,angle=0):
        p = uv or self.uv
        if angle: p=self.n('rotate2d','vector2',in_=p,amount=angle)
        p=self.mul(p,(freq,'vector2') if isinstance(freq,tuple) else freq,'vector2')
        return self.add(p,((offset[0]+self.seed,offset[1]+self.seed*.37),'vector2'),'vector2')
    def noise(self,freq,amp=1,octaves=1,offset=(3.37,8.61),uv=None,angle=0,name=None):
        p=self.point(freq,offset,uv,angle)
        return self.n('fractal2d',name=name,texcoord=p,amplitude=amp,octaves=(octaves,'integer'),lacunarity=2.03,diminish=.5)
    def remap(self,n): return self.clamp(self.add(self.mul(n,.6),.5))
    def tint(self,color,mask,amount=.2,name=None):
        fac=self.mix(1-amount,1+amount,mask)
        return self.mul(color,fac,'color3',name=name)
    def grains(self,freq=180,radius=.26,soft=.12,uv=None):
        p=self.point(freq,(17.3,5.8),uv,angle=23)
        d=self.n('worleynoise2d',texcoord=p,jitter=.6)
        mask=self.sub(1,self.ss(d,radius-soft,radius))
        ident=self.n('worleynoise2d',texcoord=p,jitter=.6,style=(1,'integer'))
        return mask,ident
    def cavities(self,freq=90,depth=.00015,radius=.19,uv=None):
        p=self.point(freq,(29.6,15.2),uv,angle=31)
        d=self.n('worleynoise2d',texcoord=p,jitter=.55)
        mask=self.sub(1,self.ss(d,radius*.15,radius))
        return mask,self.mul(mask,-depth)
    def chips(self,freq=135):
        # Interlocking angular crystals, with ~0.05–0.1-cell matrix between chips.
        # A mild millimetre-scale warp breaks the cellular outlines without folding.
        frequency=freq if isinstance(freq,(int,float)) else max(freq)
        wp=self.point(frequency*2.5,(5.3,71.9))
        wa=.045/frequency
        warp=self.n('fractal2d','vector3',texcoord=wp,amplitude=((wa,wa,0),'vector3'),octaves=(1,'integer'))
        uv=self.add(self.uv,self.n('convert','vector2',in_=warp),'vector2')
        p=self.point(freq,(17.3,5.8),uv,angle=23)
        w=self.n('worleynoise2d','vector2',texcoord=p,jitter=.7)
        edge=self.n('dotproduct',in1=w,in2=((-1,1),'vector2'))
        f1=self.n('extract',in_=w,index=(0,'integer'))
        ident=self.n('worleynoise2d',texcoord=p,jitter=.7,style=(1,'integer'))
        lump=self.noise(frequency*3,amp=.12,octaves=2,offset=(19.2,6.8))
        radial=self.add(self.sub(.9,f1),lump)
        outline=self.n('min',in1=self.sub(edge,.075),in2=radial)
        mask=self.ss(outline,0,.035)
        return mask,ident
    def voids(self,freq=(26,80),depth=.00035):
        # Open travertine voids: random radii and missing cells, irregular outline,
        # and patches of unbroken calcite. Profiles stay zero at cell boundaries.
        wp=self.point(55,(5.3,71.9))
        warp=self.n('fractal2d','vector3',texcoord=wp,amplitude=((.0015,.0015,0),'vector3'),octaves=(2,'integer'))
        uv=self.add(self.uv,self.n('convert','vector2',in_=warp),'vector2')
        p=self.point(freq,(29.6,15.2),uv,angle=7)
        dist=self.n('worleynoise2d',texcoord=p,jitter=.55)
        ident=self.n('worleynoise2d',texcoord=p,jitter=.55,style=(1,'integer'))
        radius=self.add(.04,self.mul(self.n('fract',in_=self.mul(ident,13.73)),.17))
        on=self.ss(ident,.43,.55)
        patch=self.ss(self.noise((4,9),octaves=2,offset=(8.31,2.53)),-.2,.23)
        radius=self.mul(radius,self.mul(on,patch))
        ramp=self.n('max',in1=self.mul(radius,.55),in2=.008)
        profile=self.ss(self.sub(radius,dist),0,ramp)
        profile=self.mul(profile,self.ss(radius,.002,.008))
        return profile,self.mul(profile,-depth)
    def vein(self,freq=(3,10),width=.026):
        # Full verified cookbook recipe: two warps, taper, edge wobble,
        # pigment changes, one-sided patchy halo, and secondary hairline patches.
        xml=MARBLE_RECIPE.replace('nodename="sl_p"','nodename="uv"')
        snippet=ET.fromstring('<fragment>'+xml+'</fragment>')
        factor=width/.02
        for node in snippet:
            if node.get('name')=='mv_vp0':
                node.find("input[@name='in2']").set('value',', '.join(str(x) for x in freq))
            if node.get('name')=='mv_en':
                node.find("input[@name='amplitude']").set('value',str(.012*factor))
                node.find("input[@name='pivot']").set('value',str(.02*factor))
            self.el.append(node)
        return Ref('mv_vein','float')
    def normal(self,height):
        mm=self.mul(height,1000,name='height_mm')
        uvmm=self.mul(self.uv,1000,'vector2',name='uv_mm')
        nt=self.n('heighttonormal','vector3',name='n_tangent',in_=mm,scale=16,texcoord=uvmm)
        return self.n('normalmap','vector3',name='n_world',in_=nt)
    def prune(self, outputs):
        # Eliminate unused recipe branches, keeping strict unused-node validation meaningful.
        nodes={n.get('name'):n for n in self.el if isinstance(n.tag,str)}
        live=set()
        def visit(name):
            if name in live: return
            live.add(name)
            for i in nodes[name].findall('input'):
                if i.get('nodename'): visit(i.get('nodename'))
        for ref in outputs.values(): visit(ref.name)
        for child in list(self.el):
            if isinstance(child.tag,str) and child.get('name') not in live: self.el.remove(child)
        for port,ref in outputs.items():
            ET.SubElement(self.el,'output',name=port,type=ref.typ,nodename=ref.name)


def color(name, desc):
    for token in sorted(COLORS,key=len,reverse=True):
        if token.lower() in name.lower(): return COLORS[token]
    return (.38,.32,.24)

def roughness(name, default=.8):
    for token,r in [('HighGloss',.085),('SemiGloss',.24),('Polished',.14),('Gloss',.14),('Honed',.43),('Satin',.42),('Eggshell',.67),('Matte',.9),('Leathered',.58),('Flamed',.9),('BushHammered',.94),('Textured',.9)]:
        if token in name: return r
    return default

def common(g,c,r=.8,amp=.00004,freq=170,tone=.08):
    macro=g.remap(g.noise(3.1,octaves=3,offset=(7.7,1.3)))
    micro=g.noise(freq,amp=amp,octaves=2,angle=31,offset=(11.3,4.7))
    col=g.tint((c,'color3'),macro,tone)
    rough=g.clamp(g.add(r,g.mul(g.sub(.5,macro),.06)),.03,.99)
    return col,micro,rough

def paint(g,n,d,c):
    if n.startswith('projectionCoating'):c=(.76,.76,.76) if 'White' in n else (.30,.30,.30)
    if n=='chalkboardPaintGreen':c=(.025,.07,.035)
    if n.startswith('limewash'):
        cloud=g.remap(g.noise((2.8,5.7),octaves=3,angle=17))
        brush=g.remap(g.noise((4,95),octaves=2,angle=-24,offset=(19.2,6.8)))
        pigment=g.mix(cloud,brush,.18)
        col=g.tint((c,'color3'),pigment,.22)
        return col,g.noise((4,130),amp=.000026,angle=17),g.mix(.86,.96,pigment),{}
    if n.startswith('clayPaint'):
        col,h,r=common(g,c,.95,.000022,350,.09)
        return col,h,r,{'specular':.28}
    r=roughness(n,.94 if 'chalkboard' in n else .9)
    if 'whiteboard' in n:r=.09
    if 'projection' in n:r=.98
    amp=.000016 if r>.6 else .000006
    # Roller stipple around 1.5–3 mm; gloss application ripple at 30–60 mm.
    col,h,rr=common(g,c,r,amp,440,.014)
    if r<.3:h=g.add(h,g.noise(22,amp=.000022,octaves=2))
    return col,h,rr,{'specular':.25 if 'chalkboard' in n or 'projection' in n else .5}

def plaster(g,n,d,c):
    r=roughness(n,.88)
    if n.startswith('venetian'):r=.27
    if n.startswith('tadelakt'):r=.4
    if n.startswith('microcement'):r=.44
    coarse='Coarse' in n
    amp=.00021 if coarse else .00008
    if any(x in n for x in ['Smooth','venetian','tadelakt','microcement']):amp=.000009 if r<.5 else .00002
    col,h,rr=common(g,c,r,amp,110 if coarse else 260,.12 if r<.5 else .07)
    if 'stucco' in n or 'acrylicRender' in n:
        # Embedded aggregate: variable 1–2 mm coarse grains, 0.5–0.9 mm fine.
        # Radius <= (1-jitter)/2 keeps every profile inside its own Worley cell.
        # A 70–100 micrometre domain warp breaks round outlines without folding.
        gf=220 if coarse else 460
        wp=g.point(gf*6,(5.3,71.9))
        wa=.00010 if coarse else .00007
        warp=g.n('fractal2d','vector3',texcoord=wp,amplitude=((wa,wa,0),'vector3'),octaves=(1,'integer'))
        guv=g.add(g.uv,g.n('convert','vector2',in_=warp),'vector2')
        gp=g.point(gf,(8.8,40.3),guv,angle=23)
        dist=g.n('worleynoise2d',texcoord=gp,jitter=.55)
        ident=g.n('worleynoise2d',texcoord=gp,jitter=.55,style=(1,'integer'))
        radius=g.add(.11,g.mul(g.n('fract',in_=g.mul(ident,13.73)),.10))
        inside=g.sub(radius,dist)
        mask=g.ss(inside,0,radius)
        col=g.tint(col,g.mul(mask,ident),.16)
        # Most of the mineral remains buried in binder, rather than proud beads.
        h=g.add(h,g.mul(mask,.000065 if coarse else .000020))
        rr=g.mix(.8,.95,mask)
    if 'Troweled' in n or any(x in n for x in ['venetian','tadelakt','microcement']):
        t=g.remap(g.noise((6,14),octaves=3,angle=37))
        col=g.tint(col,t,.13)
        rr=g.mix(r-.1,min(.97,r+.12),t)
        h=g.add(h,g.noise((7,16),amp=.00004 if r>.5 else .000016,octaves=2,angle=37))
    if 'gypsumBoard' in n or 'gypsumJoint' in n:
        if 'Green' in n:c=(.45,.59,.32)
        elif 'Pink' in n:c=(.67,.37,.36)
        else:c=(.64,.59,.49)
        col,h,rr=common(g,c,.94,.000012,650,.04)
        h=g.add(h,g.noise((750,12),amp=.000006,angle=11))
    if n.startswith('rammedEarth'):
        band=g.remap(g.noise((1.3,25),octaves=2,angle=2))
        col=g.tint(col,band,.23)
        h=g.add(h,g.noise((2,70),amp=.00012,octaves=2))
    if n=='earthenPlasterStraw':
        col,h,rr=common(g,(.30,.17,.075),.94,.00007,240,.15)
        # Sparse 10–20 mm straw fragments, ~0.3–0.7 mm across, embedded in
        # clay. Independent presence fields keep the orientations from making a mat.
        fragments=[]
        for angle,off,gateoff in [(27,(3.37,8.61),(1.37,6.61)),(-43,(19.2,6.8),(8.31,2.53)),(76,(8.2,43.1),(17.8,31.2))]:
            fiber=g.ss(g.noise((45,650),angle=angle,offset=off),.40,.65)
            presence=g.ss(g.noise((8,11),octaves=2,offset=gateoff),.10,.40)
            fragments.append(g.mul(fiber,presence))
        straw=g.n('max',in1=fragments[0],in2=g.n('max',in1=fragments[1],in2=fragments[2]))
        col=g.mix(col,((.57,.43,.22),'color3'),g.mul(straw,.8),'color3')
        h=g.add(h,g.mul(straw,.000025))
    return col,h,rr,{}

def mineral_mix(g,c,r=.8,relief=.00003,freq=210,contrast=.35):
    col,h,rr=common(g,c,r,relief,freq,.09)
    mask,ident=g.chips(freq)
    # Feldspar/body color, dark mica, and pale quartz occupy angular crystals.
    # Independent per-crystal brightness keeps adjoining matching colors distinct.
    pick=g.n('fract',in_=g.mul(ident,13.73))
    inclusion=g.mix(((.022,.023,.021),'color3'),(c,'color3'),g.ss(pick,.14,.17),'color3')
    inclusion=g.mix(inclusion,((.73,.70,.62),'color3'),g.ss(pick,.62,.65),'color3')
    inclusion=g.mul(inclusion,g.add(.86,g.mul(ident,.25)),'color3')
    col=g.mix(col,inclusion,g.mul(mask,contrast),'color3')
    # Use a broad, tiny continuous crystal crown; hard pigment edges carry no steps.
    h=g.add(h,g.mul(g.ss(mask,.05,.95),relief*.2))
    rr=g.clamp(g.add(rr,g.mul(g.sub(.5,mask),.09)),.04,.99)
    return col,h,rr

def concrete(g,n,d,c):
    if n=='concreteLightweightAerated':c=(.53,.54,.50)
    r=roughness(n,.85)
    amp=.000035 if r>.6 else .000003
    col,h,rr=common(g,c,r,amp,250,.12)
    extras={}
    if 'Terrazzo' in n:
        # Continuous binder remains visible between sparse angular inclusions.
        # Fine chips ~3–8 mm; large chips ~10–25 mm occupy fewer cells and have
        # private insets, so they cannot turn into a dense tiled mosaic.
        tr=.15 if n.startswith('resin') else .40
        col,h,rr=common(g,c,tr,.000002,250,.025)
        for size,f,presence in [('fine',110,.25),('large',37,.58)]:
            wp=g.point(f*2.5,(5.3,71.9))
            wa=.045/f
            warp=g.n('fractal2d','vector3',texcoord=wp,amplitude=((wa,wa,0),'vector3'),octaves=(1,'integer'))
            uv=g.add(g.uv,g.n('convert','vector2',in_=warp),'vector2')
            p=g.point(f,(17.3,5.8),uv,angle=23)
            w=g.n('worleynoise2d','vector2',texcoord=p,jitter=.7)
            e=g.n('dotproduct',in1=w,in2=((-1,1),'vector2'))
            f1=g.n('extract',in_=w,index=(0,'integer'))
            ident=g.n('worleynoise2d',texcoord=p,jitter=.7,style=(1,'integer'))
            rand=g.n('fract',in_=g.add(g.mul(ident,13.73),.37))
            inset=g.add(.10,g.mul(rand,.25))
            radius=g.add(.61,g.mul(g.n('fract',in_=g.mul(ident,29.17)),.25))
            outline=g.n('min',in1=g.sub(e,inset),in2=g.sub(radius,f1))
            mask=g.mul(g.ss(outline,0,.035),g.ss(ident,presence,presence+.05))
            pick=g.n('fract',in_=g.mul(ident,47.91))
            dark=(.27,.29,.28);light=(.79,.76,.68)
            if 'Cream' in n:dark=(.40,.32,.23);light=(.78,.69,.51)
            if 'Pink' in n:dark=(.40,.09,.065);light=(.80,.73,.65)
            if 'Green' in n:dark=(.32,.40,.29);light=(.75,.77,.63)
            chips=g.mix((dark,'color3'),(light,'color3'),g.ss(pick,.25,.28),'color3')
            if n=='resinTerrazzoWhite':
                colorful=g.mix(((.35,.065,.045),'color3'),((.055,.23,.13),'color3'),g.ss(pick,.16,.19),'color3')
                chips=g.mix(colorful,chips,g.ss(pick,.33,.36),'color3')
            col=g.mix(col,chips,mask,'color3')
            h=g.add(h,g.mul(mask,.0000003))
        return col,h,rr,{}
    if any(x in n for x in ['AsCast','SmoothPrecast','Aerated','Weathered','Wet']):
        freq=105 if 'Aerated' in n else 83 if 'AsCast' in n else 180
        pit,ph=g.cavities(freq,.00023 if 'Aerated' in n else .000065)
        h=g.add(h,ph)
        col=g.tint(col,g.sub(1,pit),.17 if 'Aerated' in n else .07)
    if any(x in n for x in ['Sandblasted','ExposedAggregate','Honed','Polished']):
        col,h,rr=mineral_mix(g,c,r,amp,130 if 'Exposed' in n else 300,.8 if 'Exposed' in n else .30)
    if 'BoardImprinted' in n:
        grain=g.noise((210,2.5),amp=.00019,octaves=2)
        h=g.add(h,grain)
        col=g.tint(col,g.remap(g.noise((130,1.8),octaves=2)),.1)
    if 'BroomFinished' in n:
        h=g.add(h,g.noise((4,330),amp=.00016,angle=4))
        h=g.add(h,g.noise((5,462),amp=.00009,angle=-2,offset=(9.1,2.7)))
    if 'Weathered' in n:
        stain=g.remap(g.noise((3,8),octaves=3))
        col=g.mix(col,((.10,.12,.085),'color3'),g.mul(stain,.35),'color3')
    if 'Carbonated' in n:
        deposit=g.ss(g.noise(8,octaves=3),-.18,.3)
        col=g.mix(col,((.69,.69,.65),'color3'),deposit,'color3')
    if 'Wet' in n:
        col=g.mul(col,.58,'color3')
        extras={'coat':1,'coat_roughness':.07,'coat_IOR':1.333}
    return col,h,rr,extras

def brick(g,n,d,c):
    glazed='Glaze' in n
    r=.15 if glazed else .91 if 'mortar' in n.lower() else .84
    amp=.000007 if glazed else .00006
    col,h,rr=common(g,c,r,amp,230,.08 if glazed else .20)
    if glazed:
        pool=g.remap(g.noise((8,14),octaves=3))
        col=g.tint(col,pool,.13)
        h=g.add(h,g.noise(19,amp=.00003,octaves=2))
    else:
        mask,ident=g.grains(410,.27)
        col=g.tint(col,g.mul(mask,ident),.2)
        h=g.add(h,g.mul(mask,.000055))
        pit,ph=g.cavities(180,.00008)
        h=g.add(h,ph)
        if 'SplitTexture' in n:h=g.add(h,g.noise(37,amp=.0008,octaves=3))
        if 'Reclaimed' in n:
            deposit=g.ss(g.noise(18,octaves=3),.1,.46)
            col=g.mix(col,((.66,.59,.45),'color3'),g.mul(deposit,.55),'color3')
    return col,h,rr,{'coat':.35,'coat_roughness':.12} if glazed else {}

def stone_color(n,c):
    special={'Carrara':(.70,.71,.69),'Calacatta':(.74,.70,.58),'Statuario':(.77,.76,.71),
      'CremaMarfil':(.60,.45,.28),'Emperador':(.16,.075,.035),'NeroMarquina':(.018,.022,.024),
      'Verde':(.045,.15,.075),'Rosso':(.34,.065,.035),'SaltAndPepper':(.40,.41,.39),
      'AbsoluteBlack':(.017,.021,.021),'BalticBrown':(.19,.09,.045),'RosePink':(.50,.25,.20),
      'TajMahal':(.55,.44,.29),'Silver':(.39,.41,.40),'Walnut':(.22,.135,.07),
      'Honey':(.57,.30,.055),'RustMulticolor':(.20,.16,.115)}
    for token,col in special.items():
        if token in n:return col
    return c

def stone(g,n,d,c):
    c=stone_color(n,c)
    r=roughness(n,.88 if 'Porous' in n or 'fieldstone' in n else .45)
    if 'Unfilled' in n:r=.52
    if n.startswith('onyx'):r=.16
    amp=.000002 if r<.5 else .00011 if r>.8 else .000032
    col,h,rr=common(g,c,r,amp,160,.09)
    extra={}
    if n.startswith(('marble','quartzite','soapstone')):
        v=g.vein((2.4,7) if 'Calacatta' in n else (3,10) if 'Statuario' not in n else (1.7,6),.016 if 'Carrara' in n else .070 if 'Calacatta' in n else .032)
        if any(x in n for x in ['Nero','Verde','Rosso','Emperador','soapstone']): vc=(.66,.64,.53)
        elif 'Calacatta' in n:vc=g.mix(((.33,.34,.31),'color3'),((.43,.30,.13),'color3'),g.remap(g.noise((6,3),octaves=3)),'color3')
        else:vc=(.22,.235,.23)
        col=g.mix(col,vc if isinstance(vc,Ref) else (vc,'color3'),v,'color3')
        if n.startswith('quartzite'):
            mask,ident=g.grains(550,.29)
            col=g.tint(col,g.mul(mask,ident),.1)
    elif n.startswith('granite'):
        col,h,rr=mineral_mix(g,c,r,amp,260 if 'AbsoluteBlack' in n else 135,.2 if 'AbsoluteBlack' in n else .92)
        if 'BalticBrown' in n:
            # Rounded 2–3 cm mineral clusters, not a masonry layout.
            mask,ident=g.grains(38,.38,.14)
            col=g.mix(col,((.30,.16,.075),'color3'),g.mul(mask,.65),'color3')
    elif n.startswith(('travertine','onyx','sandstone','bluestone','slate','schist')):
        bands=g.remap(g.noise((1.5,32 if 'travertine' in n else 16),octaves=3,angle=7))
        col=g.tint(col,bands,.28 if 'onyx' in n else .18)
        if n.startswith('travertine'):
            pit,ph=g.voids((26,80),.00035 if 'Unfilled' in n else .000009)
            col=g.mix(col,((.22,.19,.14),'color3'),g.mul(pit,.55),'color3')
            h=g.add(h,ph)
        if n.startswith(('slate','schist')):
            h=g.add(h,g.noise((3,75),amp=.00018 if r>.7 else .000004,octaves=2,angle=7))
            if 'RustMulticolor' in n:
                rust=g.ss(g.noise((6,10),octaves=3),-.12,.28)
                col=g.mix(col,((.37,.13,.035),'color3'),g.mul(rust,.7),'color3')
            if n.startswith('schist'):
                mica=g.ss(g.noise((180,40),angle=7),.25,.55)
                col=g.mix(col,((.64,.64,.58),'color3'),g.mul(mica,.5),'color3')
                rr=g.mix(rr,.26,mica)
    elif n.startswith('limestone'):
        pit,ph=g.cavities(120,.000015)
        h=g.add(h,ph)
        fossil,ident=g.grains((110,240),.22)
        col=g.mix(col,((.70,.65,.50),'color3'),g.mul(fossil,.25),'color3')
    elif n.startswith(('basalt','lava')):
        pit,ph=g.cavities(95 if 'lava' in n else 260,.00035 if 'lava' in n else .000025,radius=.24)
        col=g.tint(col,g.sub(1,pit),.2)
        h=g.add(h,ph)
    if 'BushHammered' in n:
        pit,ph=g.cavities(260,.00015,.24)
        h=g.add(h,ph)
        rr=g.mix(.86,.97,pit)
    if 'Flamed' in n:
        h=g.add(h,g.noise(210,amp=.00016,octaves=2))
    if 'Leathered' in n:
        leather=g.remap(g.noise(80,octaves=3))
        h=g.add(h,g.mul(leather,.00012))
        rr=g.mix(.4,.75,leather)
    if 'Translucent' in n:
        # Diffuse transmission is a bulk medium: requires a closed mesh and renderer SSS.
        extra={'subsurface':.85,'subsurface_color':(c,'color3'),'subsurface_radius':((.022,.010,.004),'color3'),'subsurface_scale':1,'transmission':.12,'transmission_color':(c,'color3'),'transmission_depth':.02}
    return col,h,rr,extra

def engineered_stone(g,n,d,c):
    if n=='ceramicIridescentPearl':c=(.74,.71,.64)
    r=roughness(n,.8)
    extra={}
    if n.startswith('quartzComposite'):
        col,h,rr=mineral_mix(g,c,r,.000002 if r<.5 else .00001,650,.13)
        if 'Veined' in n:
            col=g.mix(col,((.31,.21,.08) if 'Gold' in n else (.22,.24,.24),'color3'),g.vein(),'color3')
            rr=g.c(.14)
    elif n.startswith(('sintered','cementPigmented','grout')):
        r=.5 if 'Epoxy' in n else .91 if 'grout' in n else r
        col,h,rr=mineral_mix(g,c,r,.000025,550,.08)
    elif n.startswith('solidSurface'):
        col,h,rr=common(g,c,.4,.000003,650,.025)
        if 'Speckled' in n:
            mask,_=g.grains(620,.16,.07)
            col=g.mix(col,((.22,.23,.23),'color3'),g.mul(mask,.55),'color3')
        if 'Translucent' in n:extra={'subsurface':.75,'subsurface_color':(c,'color3'),'subsurface_radius':((.008,.005,.0025),'color3'),'subsurface_scale':1,'transmission':.1,'transmission_depth':.01}
    else:
        glazed=any(x in n for x in ['Glaze','Gloss','Polished','glassMosaic','Iridescent'])
        r=.13 if glazed and 'Matte' not in n else .74 if 'Matte' in n else .8
        col,h,rr=common(g,c,r,.000003 if glazed else .000013,500,.025)
        if n.startswith('zellige'):
            pool=g.remap(g.noise((9,16),octaves=3))
            col=g.tint(col,pool,.21)
            h=g.add(h,g.noise(18,amp=.000055,octaves=2))
            pit,ph=g.cavities(210,.000012)
            h=g.add(h,ph)
            rr=g.mix(.07,.22,pool)
        if n.startswith('ceramicCrackle'):
            p=g.point(145,(17.3,5.8),angle=23)
            w=g.n('worleynoise2d','vector2',texcoord=p,jitter=.65)
            border=g.n('dotproduct',in1=w,in2=((-1,1),'vector2'))
            crack=g.sub(1,g.ss(border,.007,.027))
            col=g.mix(col,((.08,.10,.07),'color3'),g.mul(crack,.7),'color3')
        if glazed:
            extra={'coat':.35,'coat_roughness':.1}
        if 'Iridescent' in n:
            extra.update({'thin_film_thickness':380,'thin_film_IOR':1.38})
    return col,h,rr,extra


def wood_species(n):
    for species in sorted(WOOD,key=len,reverse=True):
        if species.lower() in n.lower():return species,WOOD[species]
    if 'walnut' in n.lower():return 'walnut',WOOD['walnut']
    if 'maple' in n.lower() or 'Birch' in n:return 'maple',WOOD['maple']
    if 'Ash' in n:return 'ash',WOOD['ash']
    if 'pine' in n.lower() or 'Softwood' in n:return 'pine',WOOD['pine']
    if 'Cedar' in n or 'cedar' in n:return 'westernRedCedar',WOOD['westernRedCedar']
    return 'whiteOak',WOOD['whiteOak']

def wood(g,n,d,c,printed=False):
    if n.startswith('cork'):
        col,h,rr=mineral_mix(g,(.34,.20,.085) if n=='corkNatural' else (.13,.065,.025) if n=='corkDark' else (.65,.56,.39),.55 if n=='corkDark' else .9,.000045,360,.26)
        return col,h,rr,{}
    species,c=wood_species(n)
    if n=='plywoodMarineBrown':c=(.26,.14,.063)
    soft=species in ['pine','spruce','douglasFir','westernRedCedar','easternWhiteCedar','larch']
    openp=species in ['whiteOak','redOak','ash','walnut','mahogany','sapele']
    fine=species in ['maple','birch','beech']
    weathered=any(x in n for x in ['Weathered','Reclaimed','Charred'])
    if 'Stain' in n:
        stains={'Whitewashed':(.60,.53,.41),'Natural':(.43,.31,.18),'Honey':(.40,.23,.07),'Smoked':(.18,.115,.065),'Walnut':(.16,.078,.032),'Espresso':(.065,.035,.022),'Gray':(.25,.26,.24),'Black':(.022,.025,.025)}
        for key,val in stains.items():
            if key in n:c=val;break
    for key,val in {'Fumed':(.13,.074,.033),'Limed':(.43,.33,.19),'Ebonized':(.018,.021,.021),'Silver':(.32,.34,.31),'Reclaimed':(.20,.115,.055),'WeatheredGray':(.24,.25,.23),'CharredBlack':(.018,.019,.018),'CharredBrushedBrown':(.10,.045,.020)}.items():
        if key in n:c=val
    if 'Oiled' in n:c=tuple(x*.78 for x in c)
    grain_uv=g.uv
    knot=None
    if soft:
        # Sparse knots, 12–24 mm across and elongated along grain, private to 40x50 cm
        # placement cells. Every mask and deflection vanishes well before a cell border.
        kp=g.point((2.5,2),(19.2,6.8))
        kid=g.n('cellnoise2d',texcoord=g.n('floor','vector2',in_=kp))
        kl=g.mul(g.sub(g.n('fract','vector2',in_=kp),((.5,.5),'vector2'),'vector2'),((.4,.5),'vector2'),'vector2')
        kx=g.mul(g.sub(g.n('fract',in_=g.mul(kid,13.73)),.5),.10)
        ky=g.mul(g.sub(g.n('fract',in_=g.mul(kid,29.17)),.5),.16)
        q=g.sub(kl,g.n('combine2','vector2',in1=kx,in2=ky),'vector2')
        rho=g.n('magnitude',in_=g.mul(q,((1,.45),'vector2'),'vector2'))
        active=g.ss(kid,.55,.65)
        knot=g.mul(g.sub(1,g.ss(rho,.004,.012)),active)
        flow=g.mul(g.sub(1,g.ss(rho,.015,.060)),active)
        dx=g.mul(g.n('dotproduct',in1=q,in2=((1,0),'vector2')),g.mul(flow,.65))
        grain_uv=g.sub(g.uv,g.n('combine2','vector2',in1=dx,in2=0),'vector2')
    # Stretched, irregular rift grain: unlike sinusoidal stripes it has no periodic aliasing.
    coarse=g.remap(g.noise((65 if not fine else 130,1.7),octaves=3,uv=grain_uv))
    lines=g.ss(g.noise((320 if not fine else 520,2.8),octaves=2,offset=(29.6,15.2),uv=grain_uv),.05,.38)
    # Softwood cathedral figure from cylindrical rings (one continuous flitch; no board layout).
    if soft:
        cross=g.n('dotproduct',in1=grain_uv,in2=((1,0),'vector2'))
        along=g.n('dotproduct',in1=grain_uv,in2=((0,1),'vector2'))
        yc=g.sub(cross,.45)
        rad=g.n('sqrt',in_=g.add(g.mul(yc,yc),.06**2))
        phase=g.add(g.mul(rad,125),g.mul(along,2.5))
        phase=g.add(phase,g.noise((12,4),amp=.35,octaves=2))
        wave=g.n('sin',in_=g.mul(phase,2*math.pi))
        bands=g.ss(wave,.15,.75)
        # Fade narrow rings on the flanks to a soft mean; > 100 lines/m is unresolved at plane.
        slope=g.n('absval',in_=g.n('divide',in1=yc,in2=rad))
        fade=g.sub(1,g.ss(g.mul(slope,125),80,125))
        lines=g.mix(.30,bands,fade)
    pigment=g.mix(coarse,lines,.45 if not fine else .20)
    col=g.tint((c,'color3'),pigment,.32 if soft else .25 if not fine else .14)
    r=.82 if 'Raw' in n else .51 if 'Oiled' in n or weathered else .38
    if 'Gloss' in n:r=.18
    if printed:r=.42
    h=g.mul(g.sub(coarse,.5),.000025 if not weathered else .00018)
    h=g.add(h,g.mul(lines,.000010 if printed else .000025 if soft else -.000025))
    pore=g.ss(g.noise((1800 if fine else 1000,85 if fine else 90),octaves=1,offset=(71.9,23.3),uv=grain_uv),.27,.58)
    if knot is not None:
        col=g.mix(col,((.055,.025,.008),'color3'),g.mul(knot,.85),'color3')
        h=g.add(h,g.mul(knot,-.000045))
    if openp or weathered or printed:
        col=g.tint(col,g.sub(1,pore),.14 if not printed else .08)
        h=g.add(h,g.mul(pore,-.000015 if not printed else -.000004))
    if species in ['whiteOak','redOak'] and 'Charred' not in n:
        # Tangential ray flecks: 1–3 cm along grain and 2–5 mm across.
        ray=g.ss(g.noise((330,45),octaves=1,offset=(8.2,43.1)),.22,.48)
        ray=g.mul(ray,g.ss(g.noise((12,6),octaves=2),.05,.35))
        col=g.tint(col,ray,.06)
    if 'Limed' in n:col=g.mix(col,((.71,.66,.54),'color3'),g.mul(pore,.8),'color3')
    if weathered:
        checks=g.ss(g.noise((300,4),octaves=2,offset=(31.2,18.7)),.38,.65)
        col=g.mix(col,((.025,.022,.019),'color3'),g.mul(checks,.6),'color3')
        h=g.add(h,g.mul(checks,-.00008))
    if 'Charred' in n:
        cp=g.point((170,35),(31.2,18.7),angle=7)
        cw=g.n('worleynoise2d','vector2',texcoord=cp,jitter=.65)
        ce=g.n('dotproduct',in1=cw,in2=((-1,1),'vector2'))
        carbon=g.sub(1,g.ss(ce,.02,.12))
        col=g.mix(col,((.007,.008,.007),'color3'),g.mul(carbon,.8),'color3')
        h=g.add(h,g.mul(carbon,-.000025))
    if species=='sapele':
        ribbon=g.remap(g.noise((22,.7),octaves=2))
        col=g.tint(col,ribbon,.18)
    rr=g.clamp(g.add(r,g.mul(g.sub(pigment,.5),.13)),.05,.97)
    extra={}
    if any(x in n for x in ['Clear','Satin']) and not printed:
        extra={'coat':.65,'coat_roughness':.10 if 'Gloss' in n else .32,'coat_IOR':1.5}
    return col,h,rr,extra


def engineered_wood(g,n,d,c):
    if any(x in n for x in ['woodPrint','WoodTexture','woodPlastic','plywood']) and 'Edge' not in n:
        col,h,rr,extra=wood(g,n,d,c,printed='woodPrint' in n)
        if 'WoodTexture' in n:
            c=color(n,d)
            col=g.tint((c,'color3'),g.remap(g.noise((180,2),octaves=3)),.07)
            rr=g.c(.85)
            extra={}
        if 'woodPlastic' in n:
            if 'Gray' in n or 'Charcoal' in n:c=color(n,d)
            else:c=WOOD['walnut'] if 'Walnut' in n else WOOD['westernRedCedar']
            col=g.tint((c,'color3'),g.remap(g.noise((160,3),octaves=2)),.12)
            rr=g.c(.76)
            extra={}
        return col,h,rr,extra
    if n=='plywoodBirchEdgeRaw':
        # Alternating exposed veneer laminations at 1.5 mm, with continuous eased color transitions.
        p=g.n('dotproduct',in1=g.uv,in2=((0,1),'vector2'))
        band=g.add(g.mul(p,2*math.pi/0.003),g.noise((4,35),amp=.13))
        mask=g.add(g.mul(g.n('sin',in_=band),.5),.5)
        col=g.mix(((.35,.22,.095),'color3'),((.64,.48,.27),'color3'),mask,'color3')
        return col,g.noise((320,10),amp=.000008),g.c(.85),{}
    if n=='orientedStrandBoardNatural':
        # Overlapping embedded wood flakes, 20–80 mm long x 5–15 mm wide.
        # Placement cells are only a texture sampling device: every fragment ends
        # inside its cell, and twelve independently rotated layers hide the lattice.
        col=g.c((.23,.14,.065),'color3')
        h=g.noise(250,amp=.000012,octaves=2)
        rr=g.c(.55)
        for layer,angle in enumerate([-81,-65,-49,-32,-17,-2,13,28,43,58,73,87]):
            uv=g.n('rotate2d','vector2',in_=g.uv,amount=angle)
            p=g.point((50,1/.105),(3.37+layer*7.3,8.61+layer*3.7),uv)
            cells=g.n('floor','vector2',in_=p)
            ident=g.n('cellnoise2d',texcoord=cells)
            def rand(k):return g.n('fract',in_=g.add(g.mul(ident,k),.37))
            local=g.mul(g.sub(g.n('fract','vector2',in_=p),((.5,.5),'vector2'),'vector2'),((.02,.105),'vector2'),'vector2')
            offset=g.n('combine2','vector2',in1=g.mul(g.sub(rand(13.73),.5),.002),in2=g.mul(g.sub(rand(29.17),.5),.006))
            q=g.sub(local,offset,'vector2')
            x=g.n('dotproduct',in1=q,in2=((1,0),'vector2'))
            y=g.n('dotproduct',in1=q,in2=((0,1),'vector2'))
            half_width=g.add(.0025,g.mul(rand(47.91),.005))
            half_length=g.add(.010,g.mul(rand(71.33),.030))
            along=g.n('divide',in1=y,in2=half_length)
            # Slanted, slightly tapered torn ends/sides; no perfectly round dots.
            skew=g.mul(along,g.mul(g.sub(rand(97.61),.5),.003))
            width=g.mul(half_width,g.add(1,g.mul(along,.12)))
            side=g.sub(width,g.n('absval',in_=g.add(x,skew)))
            end=g.sub(half_length,g.n('absval',in_=g.add(y,g.mul(x,.25))))
            distance=g.n('min',in1=side,in2=end)
            on=g.ss(ident,.08,.14)
            mask=g.mul(g.ss(distance,0,.00035),on)
            profile=g.mul(g.ss(distance,0,.0018),on)
            # Private directional softwood fibers follow each flake's long axis.
            grain=g.remap(g.noise((650,6),octaves=2,offset=(11.3+layer,4.7),uv=uv))
            streak=g.remap(g.noise((140,3),octaves=2,offset=(29.6,15.2+layer),uv=uv))
            strand=g.tint(((.49,.36,.20),'color3'),g.mix(grain,streak,.35),.13)
            strand=g.mul(strand,g.add(.72,g.mul(rand(113.19),.48)),'color3')
            col=g.mix(col,strand,mask,'color3')
            crown=g.add(.000025,g.mul(ident,.000025))
            h=g.mix(h,g.add(crown,g.mul(g.sub(grain,.5),.000008)),profile)
            rr=g.mix(rr,g.mix(.62,.82,grain),mask)
        return col,h,rr,{}
    if n.startswith('woodWool'):
        wool=n.startswith('woodWool')
        c=color(n,d) if 'Painted' in n else (.46,.38,.24) if wool else (.49,.31,.12)
        col,h,rr=common(g,c,.93 if wool else .78,.000035,240,.1)
        masks=[]
        for angle,off in [(17,(3.3,7.7)),(-47,(21.1,9.7)),(72,(8.2,43.1))]:
            field=g.noise((150 if wool else 55,4 if wool else 12),octaves=2,angle=angle,offset=off)
            masks.append(g.ss(field,.08,.42))
        mask=g.n('max',in1=masks[0],in2=g.n('max',in1=masks[1],in2=masks[2]))
        col=g.tint(col,mask,.12 if 'Painted' in n else .32)
        h=g.add(h,g.mul(mask,.00020 if wool else .00009))
        return col,h,rr,{}
    if n in ['mediumDensityFiberboardRaw','particleboardRaw','hardboardBrown']:
        c=(.35,.24,.12) if n=='mediumDensityFiberboardRaw' else (.29,.19,.085) if n=='particleboardRaw' else (.12,.06,.026)
        return (*mineral_mix(g,c,.88,.000025,210 if 'particleboard' in n else 850,.35 if 'particleboard' in n else .08),{})
    if n.startswith('fiberCement'):
        col,h,rr=common(g,c,.82,.000028,350,.065)
        h=g.add(h,g.noise((600,30),amp=.000010,angle=17))
        return col,h,rr,{}
    # Opaque factory laminates and lacquers remain dielectric, even glossy black.
    r=roughness(n,.96 if 'fenix' in n else .8)
    col,h,rr=common(g,c,r,.000002 if r<.5 else .000008,650,.008)
    return col,h,rr,{'specular':.28 if 'fenix' in n else .5}

RECIPES=[paint,plaster,concrete,brick,stone,engineered_stone,wood,engineered_wood]

def make(family,index,name,description):
    clean=re.sub(r'(Raw|Oiled|ClearSatin|ClearGloss|Honed|Polished|Textured|Flamed|BushHammered|Leathered)$','',name)
    seed=int(hashlib.sha256(clean.encode()).hexdigest()[:8],16)%700/13.0
    g=Graph(name,seed)
    col,height,rough,extras=RECIPES[index](g,name,description,color(name,description))
    if not isinstance(rough,Ref):rough=g.c(rough)
    normal=g.normal(height)
    outputs={'base_color_out':col,'roughness_out':rough,'metalness_out':g.c(0,name='metalness'),'normal_out':normal}
    if extras.get('coat',0):outputs['coat_normal_out']=normal
    g.prune(outputs)
    root=ET.Element('materialx',version='1.39',colorspace='lin_rec709')
    root.append(ET.Comment(' '+description.replace('--','—')+' '))
    root.append(ET.Comment(' Authored linear Rec.709 art target; not a calibrated manufacturer sample. Regenerate with authoring/generate-mineral-wood.py. '))
    root.append(g.el)
    surf=ET.SubElement(root,'standard_surface',name='SR_'+name,type='surfaceshader')
    for port,typ,value in [('base','float',1),('specular','float',extras.pop('specular',.5)),('specular_IOR','float',1.5)]:
        ET.SubElement(surf,'input',name=port,type=typ,value=str(value))
    for port,out in [('base_color','base_color_out'),('specular_roughness','roughness_out'),('metalness','metalness_out'),('normal','normal_out')]:
        ET.SubElement(surf,'input',name=port,type=outputs[out].typ,nodegraph='NG_'+name,output=out)
    if 'coat_normal_out' in outputs:ET.SubElement(surf,'input',name='coat_normal',type='vector3',nodegraph='NG_'+name,output='coat_normal_out')
    for port,val in extras.items():
        if isinstance(val,tuple) and len(val)==2 and isinstance(val[1],str):val,typ=val
        else:typ='float'
        value=', '.join(str(v) for v in val) if isinstance(val,tuple) else str(val)
        ET.SubElement(surf,'input',name=port,type=typ,value=value)
    mat=ET.SubElement(root,'surfacematerial',name='M_'+name,type='material')
    ET.SubElement(mat,'input',name='surfaceshader',type='surfaceshader',nodename='SR_'+name)
    ET.indent(root,space='  ')
    slug=re.sub('[^a-z0-9]+','-',family.lower()).strip('-')
    folder=DEST/slug
    folder.mkdir(exist_ok=True,parents=True)
    file=folder/(name+'.mtlx')
    ET.ElementTree(root).write(file,encoding='utf-8',xml_declaration=True)
    return str(file)

if __name__=='__main__':
    sections=re.split(r'^## ',SOURCE.read_text(),flags=re.M)
    families=[]
    for section in sections:
        rows=re.findall(r'^\|\s*`([a-z][A-Za-z0-9]*)`\s*\|\s*(.*?)\s*\|\s*$',section,re.M)
        if rows:families.append((section.splitlines()[0],rows))
    count=0
    for i,(family,rows) in enumerate(families[:8]):
        for name,description in rows:
            make(family,i,name,description)
            count+=1
        print(f'{family}: {len(rows)}')
    print(f'Generated {count} MaterialX documents')
