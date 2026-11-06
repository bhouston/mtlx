#!/usr/bin/env python3
"""Deterministic procedural authoring for architectural catalog families 17–24.

Run from any directory; the catalog is resolved relative to this file. Linear
Rec.709 colors below are art-directed starting points, not measured swatches.
All frequencies are per metre and all heights are metres. Geometry, coverage,
particle distributions and macroscopic silhouettes belong to the consumer.
"""
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
CATALOG = ROOT / 'ARCHITECTURAL_MATERIALS.md'
if not CATALOG.exists():
    CATALOG = HERE / 'catalog-source.md'
DEST = HERE.parent

PALETTE = {
    'dark brown': (.065,.027,.012), 'dark green': (.025,.075,.035),
    'near-black': (.008,.009,.011), 'off-white': (.72,.70,.65),
    'red-brown': (.25,.065,.027), 'gray-brown': (.20,.15,.10),
    'yellow-brown': (.38,.26,.08), 'pink-brown': (.38,.20,.15),
    'blue-green': (.035,.20,.16), 'warm white': (.83,.68,.47),
    'cool white': (.61,.74,.90), 'neutral white': (.8,.8,.8),
    'brown': (.18,.075,.027), 'cognac': (.33,.12,.037),
    'ivory': (.79,.73,.59), 'cream': (.75,.67,.49),
    'white': (.80,.80,.78), 'black': (.012,.014,.016),
    'charcoal': (.055,.060,.065), 'gray': (.33,.34,.35),
    'tan': (.48,.31,.15), 'sand': (.53,.43,.28),
    'burgundy': (.15,.018,.034), 'navy': (.018,.041,.11),
    'green': (.045,.23,.08), 'blue': (.025,.13,.37),
    'red': (.42,.025,.016), 'yellow': (.72,.52,.055),
    'orange': (.62,.17,.025), 'amber': (.60,.28,.045),
    'pink': (.65,.28,.35), 'olive': (.22,.23,.10),
    'beige': (.57,.46,.30), 'buff': (.56,.42,.24),
    'gold': (.83,.61,.21), 'silver': (.82,.85,.89),
    'copper': (.90,.43,.24), 'bronze': (.40,.24,.095),
    'rose': (.52,.23,.25), 'champagne': (.72,.60,.42),
    'pearl': (.74,.72,.66), 'natural': (.43,.29,.14),
    'bleached': (.69,.58,.35), 'bleached straw': (.69,.58,.35), 'straw': (.57,.40,.14),
}

def color(name, description):
    text = re.sub(r'([a-z])([A-Z])',r'\1 \2',name).lower()
    # The first clause normally names the intended color; avoid finding words
    # such as white scattering or brown flecks later in the specification.
    label = description.split(';')[0].split(' with ')[0].lower()
    # Natural/bleached describe processing, not a hue. Prefer a named hue
    # in the label, then in the identifier. Preserve the compound bleached
    # straw target so bleaching is not discarded when straw is named.
    if re.search(r'\b(?:natural|bleached)\b', label + ' ' + text):
        hues = [key for key in PALETTE if key not in ('natural', 'bleached')]
        for candidate in (label, text):
            matches = []
            for key in hues:
                match = re.search(r'(?<![a-z])' + re.escape(key) + r'(?![a-z])', candidate)
                if match: matches.append((match.start(), -len(key), key))
            if matches: return PALETTE[min(matches)[2]]
    text = label + ' ' + text
    for key in sorted(PALETTE, key=len, reverse=True):
        if key in text:
            return PALETTE[key]
    return (.35,.30,.23)

class Ref:
    def __init__(self,name,typ): self.name,self.typ=name,typ

class Graph:
    def __init__(self,name): self.name=name; self.nodes=[]; self.outputs={}
    def n(self,category,name,typ='float',**inputs):
        node=ET.Element(category,name=name,type=typ)
        for key,val in inputs.items():
            key = 'in' if key == 'inp' else key
            if isinstance(val,Ref):
                ET.SubElement(node,'input',name=key,type=val.typ,nodename=val.name)
            else:
                if isinstance(val,tuple) and len(val)==2 and isinstance(val[0],str):
                    vt,v=val
                else:
                    v=val; vt='boolean' if isinstance(v,bool) else 'float'
                value = ', '.join(f'{x:.9g}' for x in v) if isinstance(v,(list,tuple)) else str(v).lower() if isinstance(v,bool) else f'{v:.9g}'
                ET.SubElement(node,'input',name=key,type=vt,value=value)
        self.nodes.append(node); return Ref(name,typ)
    def c(self,name,v,typ='float'): return self.n('constant',name,typ,value=(typ,v))
    def mul(self,name,a,b,typ='float'): return self.n('multiply',name,typ,in1=a,in2=b)
    def add(self,name,a,b,typ='float'): return self.n('add',name,typ,in1=a,in2=b)
    def mix(self,name,a,b,m,typ='float'): return self.n('mix',name,typ,bg=a,fg=b,mix=m)
    def coords(self,name,freq,offset=(3.71,8.29),angle=0):
        p=self.mul(name+'_scale',self.uv,('vector2',freq),'vector2')
        if angle: p=self.n('rotate2d',name+'_rotate','vector2',inp=p,amount=angle)
        return self.add(name+'_offset',p,('vector2',offset),'vector2')
    def noise(self,name,freq,amp=1,octaves=1,angle=0,offset=(3.71,8.29)):
        p=self.coords(name,freq,offset,angle)
        return self.n('fractal2d',name,'float',texcoord=p,amplitude=amp,octaves=('integer',octaves))
    def normmask(self,name,n):
        a=self.add(name+'_bias',self.mul(name+'_gain',n,.6),.5)
        return self.n('clamp',name,inp=a,low=0,high=1)
    def dome(self,name,freq,r=.19):
        p=self.coords(name,freq,offset=(21.3,7.9),angle=17)
        f=self.n('worleynoise2d',name+'_distance',texcoord=p,jitter=.6)
        s=self.n('smoothstep',name+'_edge',inp=f,low=.025,high=r)
        return self.n('subtract',name,in1=1,in2=s)
    def fiber(self,name,freq=(6,370),amp=.00003):
        a=self.noise(name+'_a',freq,amp,angle=11)
        b=self.noise(name+'_b',(freq[1],freq[0]),amp*.55,angle=-31,offset=(19.4,31.7))
        return self.add(name,a,b)
    def leather(self):
        p=self.coords('hide',(230,280),offset=(11.2,13.4),angle=13)
        w=self.n('worleynoise2d','hide_cells','vector2',texcoord=p,jitter=.95)
        edge=self.n('dotproduct','hide_edge',in1=w,in2=('vector2',(-1,1)))
        return self.n('smoothstep','hide_grain',inp=edge,low=.015,high=.18)
    def output(self,name,value): self.outputs[name]=value
    def xml(self):
        # Prune unused authoring intermediates so all four strict rules pass.
        byname={n.attrib['name']:n for n in self.nodes}; needed=set()
        def visit(name):
            if name in needed:return
            needed.add(name)
            for i in byname[name]:
                if 'nodename' in i.attrib:visit(i.attrib['nodename'])
        for ref in self.outputs.values():visit(ref.name)
        ng=ET.Element('nodegraph',name='NG_'+self.name)
        for node in self.nodes:
            if node.attrib['name'] in needed:ng.append(node)
        for name,ref in self.outputs.items():ET.SubElement(ng,'output',name='out_'+name,type=ref.typ,nodename=ref.name)
        return ng


def author(family,name,description):
    col=color(name,description); alt=tuple(min(.92,c*1.15+.005) for c in col)
    g=Graph(name);g.uv=g.n('texcoord','uv','vector2',index=('integer',0))
    shader={'base':1.,'specular':.5,'specular_IOR':1.5,'diffuse_roughness':.25}
    rough=.55; variation=.03; amp=.000015; freq=(160,160); contrast=.04; mode='smooth'
    notes=[]; scales=[]; met=0.; sheen=0.; coat=0.; transparency=False
    low=g.c('flat_height',0)
    mask=None; h=low
    if family==17:
        mode='leather';rough=.43;contrast=.075;amp=.000065;freq=(230,280)
        if 'Pigmented' in name:contrast=.022;rough=.39;amp=.000045
        if name.startswith('vinyl'):contrast=.012;rough=.36;amp=.000045
        if name.startswith(('suede','nubuck','sheepskin','cowhide')):
            mode='fiber';rough=.89;sheen=.45;shader['specular']=.18;amp=.000025;contrast=.10
            if name.startswith('sheepskin'):freq=(35,120);amp=.00025;sheen=.7
            elif name.startswith('cowhide'):freq=(12,420);rough=.67;sheen=.3;contrast=.15
        scales=['hide grain 3.5–4.3 mm, height 45–65 micrometres; nap 2–30 mm filtered bundles']
    elif family==18:
        rough=.43;freq=(260,260);amp=.000008;contrast=.008
        if name.startswith('abs'):amp=.000022;rough=.49
        if name.startswith(('polypropylene','polyethylene')):rough=.50;shader['specular']=.35;shader['subsurface']=.03;shader['subsurface_scale']=.001
        if 'Opaque' in name:rough=.09;amp=.000001
        if name.startswith('acrylicCaulk'):rough=.86;amp=.000025;mode='powder';contrast=.025
        if name.startswith(('rubber','polyurethaneSealant')):rough=.6;amp=.00002;contrast=.018
        if name.startswith('siliconeSealant'):rough=.40;amp=.000004
        if name.startswith('rubberButyl'):freq=(9,280);amp=.00002;rough=.50
        if name.startswith('adhesiveCement'):mode='grains';rough=.91;amp=.00010;freq=(370,370);contrast=.15
        if name=='ptfeCoatedGlassFiberWhite':
            mode='fiber';freq=(35,460);rough=.84;amp=.000015;sheen=.15;transparency=True
            shader.update(base=.65,transmission=.35,thin_walled=True,transmission_color=(.86,.85,.80),transmission_scatter=(.4,.4,.4),transmission_depth=.001)
        if any(t in name for t in ['Clear','Frosted','SmokeGray','Opal','Translucent','Milky','Bronze']) and name not in ['adhesiveCementGray'] or name in ['adhesiveEpoxyAmber','adhesiveWoodDriedClear']:
            transparency=True;rough=.05;amp=.000001
            shader['transmission']=1.;shader['base']=0.;shader['transmission_color']=(.97,.98,.98);shader['transmission_depth']=.02
            if name.startswith('acrylic'):shader['specular_IOR']=1.49
            elif name.startswith('polycarbonate'):shader['specular_IOR']=1.586
            elif name.startswith('etfe'):shader['specular_IOR']=1.40;shader['thin_walled']=True
            elif name.startswith(('silicone','rubberSilicone')):shader['specular_IOR']=1.41;rough=.25
            if any(t in name for t in ['Opal','Translucent','Milky']):
                rough=.25;shader['transmission_scatter']=(.6,.6,.6);shader['transmission_scatter_anisotropy']=.1
                # The preview ignores transmission_scatter. Keep native bulk
                # parameters while providing a disclosed mixed surface response.
                col=(.76,.76,.73);shader.update(base=1.,transmission=.35)
                notes.append('Mixed diffuse reflection and transmission approximate milky volume scattering in preview renderers that ignore transmission_scatter. Native scattering parameters are retained for capable renderers; this surface fallback is not a full volume solution.')
            if 'Frosted' in name:rough=.58;shader['transmission_extra_roughness']=.25;amp=.000003
            if 'SmokeGray' in name:shader['transmission_color']=(.42,.43,.44)
            if 'Bronze' in name:shader['transmission_color']=(.64,.37,.13);shader['transmission_scatter']=(.06,.05,.04)
            if 'Amber' in name:shader['transmission_color']=(.83,.44,.09)
            if 'DriedClear' in name:shader['transmission']=.45;shader['base']=.55;shader['transmission_color']=(.9,.68,.28);rough=.4
        scales=['molded skin 3.8 mm filtered texture, 1–25 micrometre height; sand adhesive 2.7 mm cells']
    elif family==19:
        rough=.08;amp=.0000007;freq=(120,120);contrast=.002;shader['subsurface']=.035;shader['subsurface_scale']=.0005
        if name.startswith('porcelainEnamel'):freq=(180,180);amp=.000006;rough=.12
        if name.startswith('mineralCast'):rough=.44;amp=.000008;contrast=.02;mode='powder'
        if name.startswith('graniteResin'):rough=.56;amp=.000015;mode='grains';freq=(400,400);contrast=.3;alt=(.13,.14,.14) if col[0]>.15 else (.48,.49,.47)
        if name.startswith('fiberglass'):mode='fiber';freq=(14,380);amp=.000008;rough=.13;contrast=.012
        if name=='fiberglassRawAmber':contrast=.17;shader.update(transmission=.65,base=.35,transmission_color=(.8,.53,.21),transmission_depth=.005);transparency=True
        if name=='fiberglassGelcoatGray':rough=.38
        if name=='glassCeramicBlack':col=(.005,.004,.003);shader.update(transmission=.01,transmission_color=(.23,.06,.012),transmission_depth=.002);transparency=True
        scales=['glaze ripple 8 mm, <1 micrometre height; enamel orange peel 5.6 mm/6 micrometres; resin flecks 0.95 mm']
    elif family==20:
        mode='powder';rough=.91;contrast=.1;amp=.000045;freq=(300,300)
        if any(x in name.lower() for x in ['wool','fiber','cellulose','kraft']):mode='fiber';freq=(18,390);amp=.000065;sheen=.22;shader['specular']=.2
        if any(x in name.lower() for x in ['foam','polystyrene']):mode='foam';amp=.00008;freq=(400,400);shader['subsurface']=.12;shader['subsurface_scale']=.0015
        if name.startswith('expandedPolystyrene'):
            mode='beads';freq=(170,170);amp=.00016
            if name.endswith('Graphite'):col=(.065,.068,.07)
        if name.startswith('sprayPolyurethane'):freq=(240,240);amp=.00015
        if name=='insulationFoilAluminum':mode='foil';met=1.;col=(.91,.92,.92);rough=.22;freq=(35,35);amp=.00018;contrast=.025
        if any(x in name for x in ['Sealant','Coating','Putty']):mode='smooth';rough=.56;amp=.00002;contrast=.018
        if name.startswith(('hdpe','pvc','cpvc','pex')):mode='smooth';rough=.36;amp=.000004;contrast=.005
        if name.startswith('pvc'):rough=.24
        if name=='pexWhiteUtility':shader['subsurface']=.10;shader['subsurface_scale']=.001
        scales=['bonded fiber bundles 2.6 mm across/55 mm long; 65 micrometre relief; foam cells 2.5–5.9 mm, 0.08–0.16 mm relief; foil wrinkles 28 mm/0.18 mm']
    elif family==21:
        mode='fiber';rough=.88;amp=.000025;contrast=.04;freq=(15,420);shader['specular']=.25
        if 'LinenTexture' in name:mode='weave';rough=.55;freq=(300,300);amp=.00002;contrast=.015
        if 'Grasscloth' in name:mode='fiber';freq=(4,280);amp=.00012;contrast=.17;sheen=.15
        if 'Silk' in name:mode='fiber';rough=.44;freq=(5,500);amp=.000008;contrast=.06;sheen=.45;shader['specular_anisotropy']=.35
        if 'Metallic' in name or 'Mica' in name or name.startswith('decorative'):
            mode='flakes';freq=(480,480);amp=.000008;rough=.52;contrast=.08
            shader['specular']=.5;coat=.15
            if 'Pearl' in name or 'Pearlescent' in name:shader['thin_film_thickness']=340.;shader['thin_film_IOR']=1.45;notes.append('Thin-film lobe approximates pearl pigment; no spectral flake scattering.')
            notes.append('Pigment flake coverage drives metalness locally; dielectric binder remains nonmetallic.')
        if name.endswith('Leaf'):
            mode='foil';met=1.;rough=.21;amp=.000055;freq=(70,55);contrast=.045;shader['specular']=1.
            if name=='goldLeaf':col=(.95,.71,.29)
            if name=='silverLeaf':col=(.96,.94,.91)
            if name=='copperLeaf':col=(.95,.57,.35)
        scales=['paper fiber bundles 2.4 mm across/67 mm long, 25 micrometre relief; grasscloth 3.6 mm/0.12 mm; leaf wrinkles 14–18 mm/55 micrometres; flakes <0.8 mm']
    elif family==22:
        mode='grains';rough=.85;amp=.00010;freq=(330,330);contrast=.22
        if name.startswith('asphalt'):freq=(250,250);amp=.00012;col=(.018,.020,.022);alt=(.18,.17,.15)
        if name=='asphaltWeatheredGray':col=(.10,.11,.11);alt=(.32,.31,.29)
        if name=='asphaltRedPigmented':col=(.18,.034,.020);alt=(.31,.13,.075)
        if 'Wet' in name:rough=.27;coat=.7;col=tuple(c*.55 for c in col)
        if name.startswith('aggregate'):
            freq=(380,380);amp=.000045;contrast=.17
            notes.append('This is the mineral skin only; particle shape/distribution is deliberately excluded.')
            if 'RiverStone' in name or 'PeaGravel' in name:rough=.57;amp=.000008
            if 'Lava' in name:mode='foam';amp=.00009;freq=(300,300)
            if 'Granite' in name:alt=(.65,.60,.46) if 'Gold' in name else (.64,.66,.64);contrast=.32
        if name.startswith('sand'):freq=(520,520);amp=.00007;contrast=.15
        if name.startswith('soil'):freq=(370,370);amp=.00010;contrast=.22
        if name.startswith(('mulch','bark','straw','thatch')):
            mode='fiber';freq=(5,260);amp=.00012;rough=.88;contrast=.22
            if name=='barkBirchWhite':mode='birch';freq=(300,12);amp=.00003;contrast=.35;alt=(.025,.02,.016)
            if name=='strawDryGold':rough=.60;sheen=.15
        if name.startswith(('grassBlade','leaf')):
            mode='leaf' if name.startswith('leafDeciduous') or 'Autumn' in name else 'fiber'
            freq=(4,350);amp=.000012;rough=.38;contrast=.12
            shader['thin_walled']=True;shader['subsurface']=.35;shader['subsurface_color']=col;shader['subsurface_scale']=.0004;shader['transmission']=.12;shader['transmission_color']=col;transparency=True
            if 'DarkGreen' in name:shader['transmission']=.05;rough=.23
            if 'Dry' in name:rough=.78;shader['transmission']=.04
        if name=='mossGreen':mode='fiber';freq=(55,270);amp=.00010;rough=.96;sheen=.35;shader['subsurface']=.1;shader['specular']=.18
        if name=='turfSyntheticGreen':mode='fiber';freq=(5,400);amp=.00004;rough=.46;sheen=.15;contrast=.20;alt=(.36,.29,.09)
        scales=['mineral skin grains 1–2 mm with 8–120 micrometre relief, no stone distribution; organic longitudinal striae 3.8 mm/0.12 mm; tissue vein color spacing 3–15 mm']
    elif family==23:
        mode='powder';rough=.94;amp=.00003;freq=(450,450);contrast=.10
        if name.startswith(('water','ice')) or name=='oilFilmAmber':
            transparency=True;mode='smooth';amp=0.;rough=.018;variation=0.;contrast=0.;shader.update(base=0.,transmission=1.,transmission_color=(.92,.98,.99),transmission_depth=1.,specular_IOR=1.333)
            if name=='waterPoolBlue':shader.update(transmission_color=(.75,.92,.98),transmission_depth=2.,transmission_scatter=(.003,.006,.01))
            if name=='waterFreshwaterGreen':shader.update(transmission_color=(.60,.84,.64),transmission_depth=1.,transmission_scatter=(.05,.08,.04))
            if name=='waterPondBrown':shader.update(transmission_color=(.40,.24,.08),transmission_depth=.5,transmission_scatter=(.18,.12,.06))
            if name.startswith('ice'):shader['specular_IOR']=1.31
            if name=='iceClear':shader['transmission_scatter']=(.004,.006,.007);notes.append('Sparse internal bubbles are homogenized as weak volume scattering, not explicit bubble geometry.')
            if name=='iceCloudyWhite':
                shader.update(base=1.,transmission=.35,transmission_scatter=(.7,.7,.7),transmission_depth=.06,transmission_color=(.94,.97,.99));rough=.21;col=(.78,.80,.81)
                notes.append('Mixed white diffuse reflection and transmission approximate bubble-induced volume scattering in preview renderers that ignore transmission_scatter. Native scattering parameters are retained for capable renderers; this surface fallback is not explicit bubble geometry or a full volume solution.')
            if name=='oilFilmAmber':shader.update(specular_IOR=1.47,transmission_color=(.87,.52,.13),transmission_depth=.004,thin_film_thickness=0.,thin_film_IOR=1.47);notes.append('Optional interference is disabled at thin_film_thickness=0 nm; enable only at appropriate film thickness.')
        elif name.startswith(('snow','frost','salt')):
            mode='crystals';amp=.00005;contrast=.08;freq=(480,480);shader['subsurface']=.45;shader['subsurface_scale']=.002
            if name=='snowCompactedGray':rough=.65;shader['subsurface']=.2;amp=.00002
        if name=='dustWarmGray':col=(.33,.30,.25)
        if name=='sootBlack':col=(.004,.004,.004);rough=.99
        if name=='mildewDepositBlack':col=(.008,.010,.007)
        if name=='rustDepositOrange':col=(.35,.085,.02);amp=.00004;mode='grains'
        if name=='algaeFilmGreen':mode='smooth';rough=.35;freq=(50,80);amp=.000035;contrast=.25;coat=.4
        scales=['powder/crystal grains 1–2 mm, 20–50 micrometre relief; liquid surface flat, motion excluded; absorption depth 4 mm oil to 2 m pool water']
    elif family==24:
        rough=.38;amp=.000002;freq=(200,200);contrast=.005
        if name.startswith('emissiveDiffuser'):
            shader.update(emission=1.,emission_color=col,subsurface=.3,subsurface_scale=.002)
            if name.endswith('WarmWhite'):shader['emission_color']=(1.,.70,.40)
            if name.endswith('NeutralWhite'):shader['emission_color']=(1.,1.,1.)
            if name.endswith('CoolWhite'):shader['emission_color']=(.66,.80,1.)
            notes.append('Emission strength defaults to 1 in renderer-relative units and must be scene-calibrated; not a measured luminance.')
        if name=='displayGlassBlackOff':rough=.025;col=(.003,.004,.005);shader.update(transmission=.025,transmission_color=(.02,.025,.03),transmission_depth=.003);transparency=True
        if name=='displaySurfaceNeutralEmissive':rough=.18;col=(.03,.03,.03);shader.update(emission=1.,emission_color=(1.,1.,1.));notes.append('Connect image/color and calibrate emission_strength; default emits uniform neutral white.')
        if name in ['displayAntiglareCoating','opticalAntireflectionCoating']:
            rough=.22 if 'Antiglare' in name else .025;shader.update(base=0.,transmission=1.,transmission_color=(.99,.99,1.),transmission_depth=.001);transparency=True
            if 'Antiglare' in name:shader.update(transmission_extra_roughness=.12,transmission_scatter=(.012,.012,.012),transmission_scatter_anisotropy=.8)
            else:shader.update(specular=.15,thin_film_thickness=110.,thin_film_IOR=1.38);notes.append('Single effective thin-film lobe and reduced reflectance approximate antireflection; no measured multilayer/polarization response.')
        if name.startswith('photovoltaic'):
            mode='crystalline';rough=.28;freq=(50,45);amp=.000001;contrast=.15;col=(.008,.022,.09) if 'Blue' in name else (.006,.008,.012);shader.update(specular_color=(.70,.82,1.),thin_film_thickness=75.,thin_film_IOR=1.45)
            notes.append('Opaque effective silicon/antireflection appearance; no cell grid, electrical response, or spectral optical calibration.')
        if name.startswith('phosphor'):
            rough=.90;mode='powder';amp=.000008;col=(.74,.65,.30) if 'Warm' in name else (.76,.73,.54)
            shader.update(emission=0.,emission_color=(1.,.68,.37) if 'Warm' in name else (.68,.82,1.))
            notes.append('Excitation is external: emission_strength defaults to 0; drive it from a scene excitation model to activate glow.')
        scales=['diffuser molded skin 5 mm/2 micrometres; silicon crystal color domains 20 mm; thin-film thicknesses in nm; emission strength explicit']

    # Physical recipe construction. The same masks drive relief, pigment and roughness.
    if mode=='leather':
        mask=g.leather(); pores=g.dome('pores',(650,650),.15)
        h=g.add('hide_height',g.mul('grain_height',mask,amp),g.mul('pore_depth',pores,-.000008))
    elif mode in ['fiber','weave','birch']:
        h=g.fiber('fibers',freq,amp)
        if mode=='weave':
            # Intersected filtered yarn bundles, not modeled cloth geometry.
            weave=g.noise('cross_yarn',(freq[1],freq[0]),amp,angle=0,offset=(43.2,9.1))
            h=g.add('embossing',h,weave)
        mask=g.normmask('fiber_mask',g.noise('fiber_tone',freq,1,angle=11))
        if name=='cowhideBrownWhite':
            mask=g.n('smoothstep','pigment_patches',inp=g.noise('hide_patches',(5,7),1,octaves=3),low=-.08,high=.12)
            col=(.74,.70,.62);alt=(.105,.035,.012)
        if mode=='birch':
            # Private 50 x 2 mm cells; variable lenticel disks become
            # 7.5–23 mm horizontal marks by 0.3–0.92 mm high. Only
            # ~20% of cells carry a mark, independently selected. The
            # radius stays below (1-jitter)/2, preventing clipped bands.
            p=g.coords('lenticel',(20,500),offset=(19.4,31.7))
            dist=g.n('worleynoise2d','lenticel_distance',texcoord=p,jitter=.5)
            identity=g.n('worleynoise2d','lenticel_identity',texcoord=p,jitter=.5,style=('integer',1))
            radius_random=g.n('fract','lenticel_radius_random',inp=g.mul('lenticel_radius_seed',identity,13.73))
            radius=g.add('lenticel_radius',g.mul('lenticel_radius_gain',radius_random,.155),.075)
            normalized=g.n('divide','lenticel_normalized_distance',in1=dist,in2=radius)
            edge=g.n('smoothstep','lenticel_edge',inp=normalized,low=.55,high=1.)
            disk=g.n('subtract','lenticel_disk',in1=1.,in2=edge)
            presence=g.n('smoothstep','lenticel_presence',inp=identity,low=.72,high=.82)
            mask=g.mul('lenticels',disk,presence)
            h=g.add('papery_lenticel_height',h,g.mul('lenticel_depth',mask,-.000004))
            notes.append('Sparse independently gated lenticels measure 7.5–23 mm horizontally by 0.3–0.92 mm vertically, with 4 micrometre depression; the white papery microfiber remains continuous.')
    elif mode=='beads':
        p=g.coords('beads',freq,offset=(17.8,3.2),angle=14)
        w=g.n('worleynoise2d','bead_distances','vector2',texcoord=p,jitter=.85)
        e=g.n('dotproduct','bead_edges',in1=w,in2=('vector2',(-1,1)))
        mask=g.n('smoothstep','bead_crown',inp=e,low=.01,high=.30)
        h=g.mul('fused_bead_height',mask,amp)
    elif mode in ['grains','powder','crystals','flakes','foam']:
        if mode=='foam':
            mask=g.dome('cell_pores',freq,.19);h=g.mul('pore_height',mask,-amp)
        else:
            grains=g.dome('grains',freq,.19)
            h=g.mul('grain_height',grains,amp)
            mask=grains
            if mode=='grains':
                second=g.dome('fine_grains',(freq[0]*1.43,freq[1]*1.43),.18)
                h=g.add('granular_height',h,g.mul('fine_height',second,amp*.3))
                mask=g.n('max','grain_mask',in1=grains,in2=second)
    elif mode=='foil':
        h=g.add('wrinkles',g.noise('coarse_crinkle',freq,amp,octaves=2),g.noise('fine_crinkle',(freq[0]*3,freq[1]*3),amp*.16,offset=(18.3,2.7)))
        mask=g.normmask('crinkle_tone',g.noise('foil_drift',(4,3),1,octaves=2))
    elif mode=='leaf':
        # Two oblique branching contour networks without a leaf outline.
        network=g.noise('vein_network',(28,95),1,octaves=2,angle=27)
        absolute=g.n('absval','vein_abs',inp=network)
        ramp=g.n('smoothstep','vein_ramp',inp=absolute,low=.015,high=.07)
        mask=g.n('subtract','vein_mask',in1=1,in2=ramp)
        h=g.mul('vein_height',mask,.000012);alt=tuple(min(.9,c*1.3) for c in col)
    elif mode=='crystalline':
        p=g.coords('crystal',(50,45),offset=(6.3,13.7))
        ids=g.n('worleynoise2d','crystal_id',texcoord=p,jitter=.95,style=('integer',1))
        mask=ids;h=g.noise('silicon_skin',(180,180),amp)
    else:
        h=g.noise('surface_skin',freq,amp,octaves=2)
        mask=g.normmask('skin_mask',g.noise('skin_tone',freq,1,octaves=2))

    # Low-frequency drift is pigmentation, never baked illumination/AO.
    drift=g.normmask('tone_drift',g.noise('tone_drift_noise',(3.7,4.9),1,octaves=2,offset=(15.1,9.7)))
    if mode in ['flakes','crystalline','birch'] or name=='cowhideBrownWhite' or name.startswith('graniteResin') or name.startswith('asphalt'):
        base=g.mix('base_color',('color3',col),('color3',alt),mask,'color3')
    else:
        contrast_mask=g.mix('pigment_variation',1.-contrast,1.+contrast,mask)
        base=g.mul('micro_color',('color3',col),contrast_mask,'color3')
        macro=g.mix('macro_pigment',1.-contrast*.3,1.+contrast*.3,drift)
        base=g.mul('base_color',base,macro,'color3')
    roughness=g.mix('roughness',max(.001,rough-variation),min(.999,rough+variation),mask)
    metal=g.mul('flake_metalness',mask,.75) if mode=='flakes' and not ('Pearl' in name or 'Mica' in name) else g.c('metalness',met)
    if mode=='crystals':
        glint=g.n('smoothstep','glint_mask',inp=mask,low=.85,high=.98)
        roughness=g.mix('crystal_roughness',roughness,.16,glint)
    height=g.add('height',h,0.)
    uv_mm=g.mul('uv_mm',g.uv,1000.,'vector2');height_mm=g.mul('height_mm',height,1000.)
    tangent=g.n('heighttonormal','n_tangent','vector3',inp=height_mm,scale=16.,texcoord=uv_mm)
    normal=g.n('normalmap','n_world','vector3',inp=tangent)
    g.output('base_color',base);g.output('roughness',roughness);g.output('metalness',metal);g.output('normal',normal)
    # Named controls are separate constant nodes, exposed as graph outputs.
    if sheen:shader.update(sheen=sheen,sheen_color=tuple(min(.95,c*1.25+.03) for c in col),sheen_roughness=.7)
    if coat:shader.update(coat=coat,coat_roughness=.12)
    if transparency:notes.append('Requires renderer support for refraction, Beer-Lambert transmission_depth, and volume/scattering inputs; opacity remains 1. Closed solids need physical thickness. Thin films use thin_walled where stated.')
    if any(k.startswith('subsurface') for k in shader):notes.append('Subsurface scattering is an effective homogeneous approximation; renderer support varies.')
    notes.append('All colors are art-directed scene-linear Rec.709, not calibrated manufacturer measurements. UV 0–1 = 1 metre; height in metres. Relief is filtered surface appearance, not silhouette geometry.')
    doc=description+' Recipe: '+mode+'. '+ '; '.join(scales)+'. '+' '.join(notes)
    root=ET.Element('materialx',version='1.39',colorspace='lin_rec709',doc=doc)
    for key,value in shader.items():
        typ='boolean' if isinstance(value,bool) else 'color3' if isinstance(value,tuple) else 'float'
        n='emission_strength' if key=='emission' else key
        if key=='coat' and family==22 and 'Wet' in name:
            g.output(n,g.mix('water_between_grains',value,.12,mask))
        else:
            g.output(n,g.c(n,value,typ))
    root.append(g.xml())
    ss=ET.SubElement(root,'standard_surface',name='SR_'+name,type='surfaceshader')
    for inp,out,typ in [('base_color','base_color','color3'),('specular_roughness','roughness','float'),('metalness','metalness','float'),('normal','normal','vector3')]:
        ET.SubElement(ss,'input',name=inp,type=typ,nodegraph='NG_'+name,output='out_'+out)
    for key,value in shader.items():
        typ='boolean' if isinstance(value,bool) else 'color3' if isinstance(value,tuple) else 'float'
        out='emission_strength' if key=='emission' else key
        ET.SubElement(ss,'input',name=key,type=typ,nodegraph='NG_'+name,output='out_'+out)
    if coat:ET.SubElement(ss,'input',name='coat_normal',type='vector3',nodegraph='NG_'+name,output='out_normal')
    material=ET.SubElement(root,'surfacematerial',name='M_'+name,type='material',doc=description)
    ET.SubElement(material,'input',name='surfaceshader',type='surfaceshader',nodename='SR_'+name)
    ET.indent(root,space='  ')
    return '<?xml version="1.0" encoding="UTF-8"?>\n'+ET.tostring(root,encoding='unicode')+'\n',mode


def main():
    text=CATALOG.read_text();sections=re.split(r'^## ',text,flags=re.M)[3:]
    counts={};n=0
    for number,section in enumerate(sections,1):
        if number<17 or number>24:continue
        title=section.splitlines()[0];slug=re.sub('[^a-z0-9]+','-',title.lower()).strip('-')
        folder=DEST/slug;folder.mkdir(parents=True,exist_ok=True)
        rows=re.findall(r'^\| `([^`]+)`\s*\|\s*(.*?)\s*\|$',section,re.M)
        for name,description in rows:
            xml,mode=author(number,name,description)
            (folder/(name+'.mtlx')).write_text(xml)
            counts[mode]=counts.get(mode,0)+1;n+=1
    print(json.dumps({'generated':n,'recipes':counts},indent=2))

if __name__=='__main__':main()
