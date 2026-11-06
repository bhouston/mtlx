#!/usr/bin/env python3
"""Rebuild catalog families 1–11. UV coordinates and all relief are in metres.

Run from any directory: python3 material_library/vehicle/tools/coatings.py
Colors are authored linear Rec.709 appearance targets, not measured OEM values.
"""
from pathlib import Path
import re
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[3]
DEST = Path(__file__).resolve().parents[1]
PALETTE = {
    'PureWhite':(.82,.82,.82),'WarmWhite':(.79,.75,.66),'Ivory':(.72,.65,.48),'Cream':(.76,.68,.48),
    'White':(.77,.77,.77),'CoolWhite':(.69,.75,.82),'LightGray':(.45,.46,.47),'MediumGray':(.22,.23,.24),
    'DarkGray':(.065,.07,.075),'Gray':(.23,.24,.25),'NeutralGray':(.23,.23,.23),'Charcoal':(.025,.029,.033),
    'JetBlack':(.004,.0045,.005),'PianoBlack':(.004,.0045,.005),'Black':(.009,.011,.013),
    'BrightRed':(.54,.014,.016),'DarkRed':(.20,.009,.012),'RedBrown':(.19,.045,.022),'ReddishBrown':(.16,.035,.016),
    'Burgundy':(.14,.012,.029),'Red':(.43,.012,.015),'SafetyOrange':(.88,.15,.008),'Orange':(.76,.13,.008),
    'SafetyYellow':(.85,.66,.008),'Yellow':(.8,.58,.008),'LimeGreen':(.23,.61,.018),'OliveGreen':(.12,.15,.035),
    'ForestGreen':(.012,.065,.023),'EmeraldGreen':(.008,.22,.068),'Green':(.018,.22,.05),'Teal':(.008,.18,.17),
    'Cyan':(.008,.42,.58),'IceBlue':(.36,.53,.62),'SkyBlue':(.08,.35,.64),'RoyalBlue':(.012,.045,.40),
    'NavyBlue':(.008,.018,.07),'Blue':(.014,.08,.37),'Violet':(.16,.025,.29),'Purple':(.17,.018,.24),
    'Plum':(.12,.018,.07),'Pink':(.68,.14,.27),'Sand':(.46,.36,.22),'Beige':(.48,.40,.29),
    'Tan':(.36,.22,.11),'ChocolateBrown':(.075,.028,.012),'DarkBrown':(.045,.019,.008),'Brown':(.12,.05,.021),
    'PaleAmber':(.83,.55,.21),'Amber':(.66,.27,.026),'Bronze':(.39,.22,.09),'Champagne':(.59,.48,.31),
    'Copper':(.65,.27,.13),'RoseGold':(.68,.40,.29),'Gold':(.72,.48,.12),'Silver':(.64,.66,.68),
    'LightSilver':(.76,.78,.80),'DarkSilver':(.31,.33,.35),'Gunmetal':(.10,.12,.14),'Graphite':(.048,.055,.065),
    'LightSmoke':(.52,.53,.54),'DarkSmoke':(.085,.09,.10),'MediumSmoke':(.24,.25,.26),'Smoke':(.24,.25,.26),
    'LightGreen':(.70,.86,.76),'LightBlue':(.67,.80,.9),'BlueGray':(.20,.28,.36),'GreenGray':(.23,.31,.25),
    'SmokeGray':(.12,.13,.14),'DeepBlack':(.018,.02,.022),'DeepPrivacyGray':(.035,.038,.04),
    'PaleViolet':(.75,.67,.85),'PaleBlue':(.71,.81,.9),'Neutral':(.72,.73,.74),'Clear':(.96,.98,.99),
    'Colorless':(.99,.99,.99),'Translucent':(.83,.78,.65),
}

def color(name):
    special = {'paintInterferenceSilverRose':(.68,.57,.59), 'blackOxideCoating':(.012,.014,.017), 'copperTinned':(.72,.74,.75), 'glassSwitchablePrivacyFrosted':(.96,.97,.95), 'glassHeatedTransparentCoating':(.93,.96,.94)}
    if name in special:return special[name]
    # Longest suffix avoids interpreting LightGray as Gray, and RoseGold as Gold.
    for k in sorted(PALETTE,key=len,reverse=True):
        if name.endswith(k): return PALETTE[k]
    if name.endswith('Rubber') or 'Whitewall' in name:return (.77,.73,.65)
    if any(x in name for x in ['aluminum','magnesium','zinc','Aluminum','Aluminized','mirror','Steel','steel','nickel','Nickel']):return (.60,.62,.64)
    if 'copperBare' in name:return (.92,.48,.29)
    if 'brass' in name:return (.77,.57,.22)
    if 'bronze' in name:return (.61,.38,.16)
    if 'titanium' in name:return (.48,.44,.40)
    if 'castIron' in name:return (.14,.15,.16)
    if 'lead' in name:return (.30,.32,.35)
    return (.055,.06,.065)

class Ref:
    def __init__(self,name,typ):self.name=name;self.typ=typ
class Graph:
    def __init__(self):self.nodes=[];self.out=[]
    def inp(self,name,v,typ=None):
        if isinstance(v,Ref):return f'<input name="{name}" type="{v.typ}" nodename="{v.name}" />'
        typ=typ or ('color3' if isinstance(v,tuple) and len(v)==3 else 'vector2' if isinstance(v,tuple) else 'float')
        val=', '.join(f'{x:.9g}' for x in v) if isinstance(v,tuple) else str(v).lower() if isinstance(v,bool) else str(v)
        return f'<input name="{name}" type="{typ}" value="{escape(val)}" />'
    def n(self,cat,name,typ='float',**inputs):
        self.nodes.append(f'    <{cat} name="{name}" type="{typ}">'+''.join(self.inp(k,v) for k,v in inputs.items())+f'</{cat}>');return Ref(name,typ)
    def c(self,name,v,typ=None):return self.n('constant',name,typ or ('color3' if isinstance(v,tuple) else 'float'),value=v)
    def note(self,s):self.nodes.append(f'    <!-- {s} -->')
    def output(self,name,v):
        self.out.append(f'    <output name="{name}" type="{v.typ}" nodename="{v.name}" />');return v
    def mul(self,name,a,b,typ=None):return self.n('multiply',name,typ or a.typ,in1=a,in2=b)
    def add(self,name,a,b,typ=None):return self.n('add',name,typ or a.typ,in1=a,in2=b)
    def mix(self,name,a,b,m,typ=None):return self.n('mix',name,typ or a.typ if isinstance(a,Ref) else typ or 'float',bg=a,fg=b,mix=m)
    def noise(self,name,uv,f,amp=1):
        p=self.mul(name+'_coordinates',uv, f, 'vector2')
        return self.n('fractal2d',name,texcoord=p,octaves=RefInteger(2),amplitude=amp)
class RefInteger(int):pass
# integer literal input support
oldinp=Graph.inp
def inp(self,n,v,typ=None):return oldinp(self,n,v,'integer' if isinstance(v,RefInteger) else typ)
Graph.inp=inp

def build(name,desc,section):
    g=Graph(); c=color(name); low=name.lower(); notes=[]
    rough=.42; metal=0.; coat=0.; coatrough=.09; amp=.000006; freq=(450,450); anis=0.; ior=1.5; trans=0.; scatter=0.; depth=.01; sheen=0.; spec=.5; film=0.; pattern=None
    if any(x in low for x in ['gloss','polished','bright','bare','mirror']):rough=.10;amp=.000001
    if any(x in low for x in ['satin','smooth']):rough=.36
    if any(x in low for x in ['matte','ptfe','primer']):rough=.72
    if section in (1,2):
        rough=.27;freq=(320,320);amp=.000008;coat=1.;coatrough=.085
        if 'Satin' in name:coatrough=.36;rough=.43
        if 'Matte' in name:coatrough=.64;rough=.62
        if 'SingleStage' in name or 'Utility' in name:coat=0.;rough=.11 if 'Gloss' in name else .36;amp=.000014
    if section==2:
        if any(x in name for x in ['Metallic','CoarseMetalFlake','Candy']):pattern='flake';rough=.23
        if any(x in name for x in ['Pearl','Interference']):film=370 if 'Interference' in name else 180;rough=.24
        if 'Candy' in name:metal=1.;c=(.75,.77,.8);notes.append('Tinted coat over reflective ground; coat_color represents absorbing dye.')
    if section==3:
        freq=(650,650);amp=.000013
        if 'FineTexture' in name:freq=(420,420);amp=.00005;rough=.64
        if 'Wrinkle' in name:freq=(240,240);amp=.00012;rough=.61;pattern='wrinkle'
        if any(x in name for x in ['BedLiner','StoneGuard','underbody','antiSlip']):freq=(180,180);amp=.00023;rough=.68;pattern='granular'
        if 'seamSealer' in name:freq=(160,160);amp=.00004
        if 'cavityWax' in name:trans=.78;depth=.0005;rough=.43;amp=.000008
        if 'blackOxide' in name:metal=.65;rough=.4
        if 'phosphate' in name:metal=.4;rough=.74
        if name.endswith('Silver') and 'powderCoat' in name:pattern='flake';coat=.8
    if section==4:
        freq=(650,650);amp=.000003
        if 'Metallic' in name:pattern='flake';coat=.7
        if 'BrushedMetal' in name:freq=(6,1800);amp=.000003;anis=.4;metal=.38;coat=.4
        if 'CarbonFiber' in name:pattern='weave';rough=.3
        if 'ForgedCarbon' in name:pattern='chopped';rough=.26
        if 'Camouflage' in name:pattern='camo';amp=.000001;rough=.76
        if 'ProtectionFilm' in name or 'ProtectiveFilm' in name:trans=1.;depth=.0002;c=(.99,.99,.99) if 'clear' in name else (.98,.87,.53);rough=.08 if 'Gloss' in name else .34 if 'Satin' in name else .64
    if section==5:
        metal=1.;amp=.000002;freq=(600,600);rough=.28
        if any(x in name for x in ['Polished','Bright','Bare']):rough=.09;amp=.0000005
        if any(x in name for x in ['Brushed','Machined','Rolled','Turned']):freq=(6,1800);anis=.72;amp=.000006;rough=.28
        if 'BeadBlasted' in name:rough=.60;amp=.000018
        if any(x in name for x in ['Cast','Forged']):freq=(350,350);amp=.00006;rough=.52
        if 'Spangle' in name and 'SpangleFree' not in name:pattern='spangle';freq=(80,80) if 'Fine' in name else (20,20);amp=.000001
        if 'anodized' in name:coat=.8;coatrough=.30
        if 'ClearCoated' in name:coat=1.;coatrough=.20
        if 'Iridescent' in name:film=280
        if 'diamondLike' in name:metal=.25;rough=.18;c=(.025,.028,.032)
        if name.startswith('aluminum') or name.startswith('magnesium'):c=(.86,.88,.90)
        if name.startswith('stainless') or name.startswith('steel'):c=(.55,.57,.59)
    if section==6:
        freq=(700,700);amp=.000004
        if 'FineGrain' in name:freq=(480,480);amp=.000055;pattern='grain'
        if 'CoarseGrain' in name:freq=(230,230);amp=.00012;rough=.63;pattern='grain'
        if 'softTouch' in name:rough=.8;spec=.25;sheen=.12;amp=.000009
        if 'glassFilled' in name or 'bioFilled' in name:pattern='fibers';rough=.72
        if 'recycledPlastic' in name:pattern='chopped';rough=.65
        if name.startswith('paintedPlasticGloss'):coat=1.;coatrough=.085;rough=.26
        if any(x in name for x in ['Silver','Champagne','Bronze']) and any(x in name for x in ['absGloss','paintedPlastic']):pattern='flake';coat=.8
        if name.endswith('NaturalTranslucent'):trans=.8;scatter=.65;depth=.004;rough=.48;c=(.9,.87,.75)
        if 'polycarbonateOpaque' in name:ior=1.586
        if 'Rotomolded' in name:freq=(350,350);amp=.000035
    if section==7:
        amp=.0000005;rough=.06;trans=1.;depth=.005;ior=1.586 if 'polycarbonate' in name else 1.49
        if 'opticalSilicone' in name:ior=1.41
        if any(x in name for x in ['Frosted','Diffuser','Diffusing']):rough=.43;scatter=.7;trans=.88;amp=.000005
        if name.startswith('retroreflective'):
            trans=0.;rough=.20;coat=.8;pattern='microprism'
            notes.append('Portable standard_surface fallback only: exact source-directed retroreflection requires a renderer-specific retroreflective BSDF; no emission is substituted.')
        if any(x in name for x in ['nearInfrared','radarTransparent']):trans=0.;rough=.1 if 'Infrared' in name else .42
        if 'antiReflective' in name:spec=.12;film=100
    if section==8:
        trans=1.;rough=.025;amp=.0000001;freq=(300,300);ior=1.52;depth=.006
        if 'Clear' in name:c=(.94,.98,.96)
        if any(x in name for x in ['Frosted']):scatter=.9;trans=.94;rough=.08
        if 'CeramicFrit' in name:trans=0.;rough=.63;amp=.000005
        if any(x in name for x in ['SolarControl','InfraredReflective','HeatedTransparent']):film=190
        if 'AntiReflective' in name:spec=.12;film=100
        if 'TintFilm' in name or 'Interlayer' in name:ior=1.48;depth=.0005
        if 'BulletResistant' in name:depth=.035
        if 'SwitchablePrivacyClear' in name:scatter=.03
        if 'ElectrochromicDarkBlue' in name:c=(.018,.055,.25)
    if section==9:
        metal=1.;rough=.025;amp=.0000002;c=(.94,.95,.96);coat=.8
        if 'Aluminum' in name or 'Aluminized' in name:c=(.86,.88,.9)
        if 'Satin' in name:rough=.36;coatrough=.25
        if 'BlueTint' in name:c=(.35,.52,.75)
        if 'Dimmed' in name:c=(.16,.19,.2)
        if 'WhiteDiffuse' in name:metal=0.;coat=0.;c=(.86,.86,.86);rough=.75
    if section in (10,11):
        rough=.62;amp=.000011;freq=(800,800);spec=.35
        if 'Smooth' in name or 'Sidewall' in name:rough=.45;amp=.000003
        if 'Satin' in name:rough=.38
        if 'Flocked' in name:rough=.9;sheen=.35;spec=.18;freq=(1000,200);amp=.000025
        if 'Foam' in name:pattern='grain';freq=(600,600);amp=.00007;rough=.83
        if 'Tread' in name or 'Conveyor' in name:freq=(600,600);amp=.00003;rough=.76
        if 'Ink' in name:rough=.8;amp=.000002
        if 'FabricFacing' in name:pattern='weave';rough=.87;sheen=.16;spec=.2
        if name.endswith('Clear') or name.endswith('Translucent') or ('polyurethaneElastomer' in name and name.endswith('Amber')):
            trans=.86;scatter=.3;depth=.004;rough=.32
        if name.startswith('naturalRubberAmber'):trans=.35;scatter=.15;depth=.003
        if 'tireWhitewall' in name:c=(.76,.72,.62)
    g.note('Real-world scale: texcoord 0 to 1 = one metre. All height values below are metres. Factory-new process texture only.')
    uv=g.n('texcoord','uv','vector2')
    g.note(f'Finish microstructure: coordinate frequencies {freq[0]}, {freq[1]} per metre; relief amplitude {amp:g} m, correlated color and roughness.')
    n=g.noise('finish_noise',uv,freq)
    mask=g.n('clamp','finish_mask',**{'in':g.add('finish_remap',g.mul('finish_gain',n,.45),.5),'low':0,'high':1})
    height=g.mul('height',n,amp)
    active=mask
    if pattern in ('grain','granular','microprism'):
        p=g.mul('grain_uv',uv,(350,350) if pattern=='grain' else (200,200) if pattern=='granular' else (2000,2000),'vector2')
        d=g.n('worleynoise2d','grain_distance',texcoord=p,jitter=.7)
        active=g.n('clamp','grain_mask',**{'in':d,'low':0.,'high':1.})
        height=g.mul('height_grain',active,amp*2)
    if pattern=='wrinkle':
        active=g.n('absval','wrinkle_mask',**{'in':n});height=g.mul('height_wrinkle',active,amp)
    if pattern in ('flake','spangle','chopped','fibers'):
        f=(1800,1800) if pattern=='flake' else freq if pattern=='spangle' else (230,230) if pattern=='chopped' else (2000,80)
        if 'CoarseMetalFlake' in name:f=(650,650)
        p=g.mul('pigment_uv',uv,f,'vector2')
        if pattern in ('spangle','chopped'):
            active=g.n('worleynoise2d','pigment_mask',texcoord=p,jitter=.75,style=RefInteger(1))
        else:
            d=g.n('worleynoise2d','pigment_distance',texcoord=p,jitter=.75)
            sm=g.n('smoothstep','pigment_edges',**{'in':d,'low':.07,'high':.16})
            active=g.n('subtract','pigment_mask',in1=1.,in2=sm)
    if pattern=='weave':
        g.note('Printed carbon twill: 2 mm yarn pitch; rubber fabric facing: 0.8 mm yarn pitch. No geometry or stitch arrangement.')
        f=500 if section==4 else 1250
        p=g.mul('weave_uv',uv,(f,f),'vector2')
        sep=g.n('separate2','weave_axes','multioutput',**{'in':p})
        # Explicit multioutput references are generated here.
        for axis in ['x','y']:
            g.nodes.append(f'    <extract name="weave_{axis}" type="float"><input name="in" type="vector2" nodename="weave_uv" /><input name="index" type="integer" value="{0 if axis=="x" else 1}" /></extract>')
        g.nodes.pop(len(g.nodes)-3) # remove unused separate2
        x=Ref('weave_x','float');y=Ref('weave_y','float')
        rows=g.n('floor','weave_rows',**{'in':y});phase=g.add('weave_phase',x,rows)
        wave=g.n('sin','weave_wave',**{'in':g.mul('weave_radians',phase,3.141592653589793)})
        active=g.add('weave_mask',g.mul('weave_contrast',wave,.45),.5);height=g.mul('height_weave',active,.000014 if section==4 else .000025)
    if pattern=='camo':
        field=g.noise('camouflage_field',uv,(9,9));m1=g.n('smoothstep','camouflage_one',**{'in':field,'low':-.2,'high':-.15});m2=g.n('smoothstep','camouflage_two',**{'in':field,'low':.19,'high':.24})
        colors=((.045,.065,.018),(.16,.20,.07),(.018,.025,.009)) if 'Woodland' in name else ((.45,.32,.17),(.65,.51,.31),(.18,.12,.065)) if 'Desert' in name else ((.75,.77,.78),(.38,.41,.44),(.11,.13,.15))
        a=g.mix('camouflage_low',colors[0],colors[1],m1,'color3');base=g.mix('base_color',a,colors[2],m2,'color3')
    else:
        strength=.10 if section not in (7,8,9) else .005
        if pattern in ('chopped','weave'):strength=.6
        if pattern=='spangle':strength=.3
        if pattern=='flake':strength=.35
        bg=tuple(max(.001,v*(1-strength)) for v in c);fg=tuple(min(.95,v*(1+strength)) for v in c)
        base=g.mix('base_color',bg,fg,active,'color3')
    # The microscopic mask modulates the substrate, preserving a distinct dielectric coat.
    roughnode=g.mix('roughness',max(.015,rough-.025),min(.98,rough+.025),active)
    metalnode=g.mix('metalness',0.,.85,active) if pattern=='flake' and not metal else g.c('metalness',metal)
    # Every authored noise has a consumer even for a separate feature mask.
    if active.name!=mask.name:
        roughnode=g.add('roughness_correlated',roughnode,g.mul('roughness_finish_detail',mask,.008))
    if height.name!='height':
        height=g.add('height_combined',height,Ref('height','float'))
    uvmm=g.mul('uv_mm',uv,1000.);hmm=g.mul('height_mm',height,1000.)
    nt=g.n('heighttonormal','n_tangent','vector3',**{'in':hmm,'scale':16.,'texcoord':uvmm});normal=g.n('normalmap','n_world','vector3',**{'in':nt})
    coatnormal=normal
    if pattern=='flake':
        coat=max(coat,.7)
        g.note('Independent pigment-normal microstructure beneath smooth coat: fine flake tilt at 0.56 mm pitch (coarse at 1.54 mm). Clearcoat retains the application normal.')
        fn=g.noise('flake_tilt',uv,(650,650) if 'CoarseMetalFlake' in name else (1800,1800),.000035 if 'CoarseMetalFlake' in name else .000014)
        fh=g.add('substrate_height',height,fn);fm=g.mul('substrate_height_mm',fh,1000.)
        ft=g.n('heighttonormal','flake_tangent','vector3',**{'in':fm,'scale':16.,'texcoord':uvmm})
        normal=g.n('normalmap','flake_world','vector3',**{'in':ft})
        if coat:g.output('coat_normal_out',coatnormal)
    g.output('base_color_out',base);g.output('roughness_out',roughnode);g.output('metalness_out',metalnode);g.output('normal_out',normal)
    shader=[]
    for nm,typ,v in [('base_color','color3',None),('specular_roughness','float',None),('metalness','float',None),('normal','vector3',None)]:
        out={'specular_roughness':'roughness','normal':'normal','base_color':'base_color','metalness':'metalness'}[nm]
        shader.append(f'    <input name="{nm}" type="{typ}" nodegraph="NG_{name}" output="{out}_out" />')
    values={'base':1.,'specular':spec,'specular_IOR':ior,'specular_anisotropy':anis,'coat':coat,'coat_roughness':coatrough,'coat_IOR':1.5,'sheen':sheen,'sheen_roughness':.65}
    if trans:
        notes.append(f'Volume absorption reference distance {depth:g} m. Supply physical closed mesh thickness in metres; opacity remains one. Scattering needs renderer support.')
        values.update(transmission=trans,transmission_color=c,transmission_depth=depth,transmission_scatter=(scatter,scatter,scatter),transmission_scatter_anisotropy=.2,thin_walled=False)
    if coat and 'Candy' in name:values.update(coat_color=color(name),coat_affect_color=1.)
    if film:values.update(thin_film_thickness=film,thin_film_IOR=1.8 if section==2 else 1.38)
    if coat:
        shader.append(f'    <input name="coat_normal" type="vector3" nodegraph="NG_{name}" output="{'coat_normal_out' if pattern=='flake' else 'normal_out'}" />')
    for k,v in values.items():shader.append('    '+g.inp(k,v,'boolean' if isinstance(v,bool) else None))
    # Keep convention-compliant graph-driven fibrous specular.
    if spec!=.5:
        val=g.c('specular_weight',spec);g.output('specular_out',val)
        shader=[s for s in shader if 'name="specular"' not in s]
        shader.append(f'    <input name="specular" type="float" nodegraph="NG_{name}" output="specular_out" />')
    return '\n'.join(['<?xml version="1.0"?>','<materialx version="1.39" colorspace="lin_rec709">',f'  <!-- {escape(desc).replace("--","—")} -->',*['  <!-- '+escape(x)+' -->' for x in notes],f'  <nodegraph name="NG_{name}">',*g.nodes,*g.out,'  </nodegraph>',f'  <standard_surface name="SR_{name}" type="surfaceshader">',*shader,'  </standard_surface>',f'  <surfacematerial name="M_{name}" type="material"><input name="surfaceshader" type="surfaceshader" nodename="SR_{name}" /></surfacematerial>','</materialx>',''])

def main():
    sections=[x for x in (ROOT/'VEHICLE_MATERIAL_CATALOG.md').read_text().split('\n## ') if '\n- `' in x][:11]
    count=0
    for i,section in enumerate(sections,1):
        for name,desc in re.findall(r'^- `([^`]+)` — (.+)$',section,re.M):
            folder=DEST/name;folder.mkdir(exist_ok=True)
            (folder/(name+'.mtlx')).write_text(build(name,desc,i));count+=1
    print(f'Generated {count} materials in catalog sections 1–11 at {DEST}')
if __name__=='__main__':main()
