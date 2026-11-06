#!/usr/bin/env python3
"""Generate catalog families 9–16. Values are art-directed linear Rec.709.

1 UV unit = 1 metre. Surface heights are metres; htn uses documented millimetre
conversion. Optical depths are metres. No component layouts or geometry baked in.
"""
from pathlib import Path
import re
import xml.etree.ElementTree as E

ROOT = Path(__file__).resolve().parents[3]
DEST = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'ARCHITECTURAL_MATERIALS.md'
if not SOURCE.exists():
    SOURCE = Path(__file__).with_name('catalog-source.md')

PALETTE = {
    'purewhite': (.78,.78,.78), 'warmwhite':(.76,.71,.62), 'offwhite':(.70,.68,.62),
    'white':(.73,.73,.71),'ivory':(.72,.66,.53),'cream':(.71,.63,.48),
    'lightgray':(.49,.49,.48),'silvergray':(.43,.45,.46),'mediumgray':(.29,.29,.28),
    'darkgray':(.08,.085,.09),'bluegray':(.24,.30,.35),'gray':(.32,.33,.33),
    'charcoal':(.045,.049,.052),'black':(.012,.013,.015), 'beige':(.48,.37,.25),
    'taupe':(.30,.25,.21),'tan':(.47,.32,.18),'darkbrown':(.085,.04,.02),
    'weatheredbrown':(.18,.13,.095),'brown':(.20,.105,.055),'bronzebrown':(.18,.105,.047),
    'darkbronze':(.13,.08,.035),'bronze':(.36,.22,.085),'champagne':(.62,.49,.30),
    'rosegold':(.76,.46,.34),'gold':(.77,.52,.13),'yellow':(.66,.46,.035),
    'ochre':(.43,.25,.055),'terracotta':(.43,.14,.065),'burgundy':(.18,.018,.037),
    'rust':(.35,.09,.035),'red':(.45,.025,.019),'orange':(.67,.17,.025),
    'navyblue':(.017,.035,.085),'navy':(.017,.035,.085),'darkblue':(.012,.03,.09),
    'blue':(.045,.15,.30),'bluegreen':(.055,.24,.23),'forestgreen':(.025,.095,.05),
    'emerald':(.02,.22,.10),'sagegreen':(.22,.29,.19),'green':(.08,.23,.10),
    'amber':(.63,.31,.055),'natural':(.46,.34,.19),'bleached':(.67,.58,.39),
    'silver':(.76,.78,.80), 'blonde':(.74,.60,.32),
}

def color(name, desc):
    label=desc.split(';')[0].split(' with ')[0]
    text=re.sub('[^a-z]','',label.lower())
    # Catalog labels before semicolon take precedence over material class names.
    for key in sorted(PALETTE,key=len,reverse=True):
        if key in text: return PALETTE[key]
    text=name.lower()
    for key in sorted(PALETTE,key=len,reverse=True):
        if key in text: return PALETTE[key]
    return (.45,.43,.38)

def fmt(v):
    if isinstance(v,bool): return str(v).lower()
    if isinstance(v,(tuple,list)): return ', '.join(fmt(x) for x in v)
    if isinstance(v,float): return format(v,'.8g')
    return str(v)

class Graph:
    def __init__(self, parent,name):
        self.g=E.SubElement(parent,'nodegraph',name='NG_'+name)
        self.k=0
    def n(self,cat,t='float',name=None,**inputs):
        self.k+=1; name=name or f'{cat}_{self.k}'
        node=E.SubElement(self.g,cat,name=name,type=t)
        for key,(typ,val) in inputs.items():
            a={'name':key,'type':typ}
            if isinstance(val,str):
                a['nodename']=val.split('.')[0]
                if '.' in val:a['output']=val.split('.')[1]
            else:a['value']=fmt(val)
            E.SubElement(node,'input',a)
        return name
    def const(self,v,t='float',name=None):return self.n('constant',t,name,value=(t,v))
    def op(self,cat,a,b,t='float',bt=None,name=None):return self.n(cat,t,name,in1=(t,a),in2=(bt or t,b))
    def unary(self,cat,v,t='float'):return self.n(cat,t,**{'in':(t,v)})
    def mix(self,a,b,m,t='float',name=None):return self.n('mix',t,name,bg=(t,a),fg=(t,b),mix=('float',m))
    def uv(self,f,off):
        p=self.op('multiply','uv',f,'vector2', 'vector2' if isinstance(f,tuple) else 'float')
        return self.op('add',p,off,'vector2')
    def noise(self,f,off=(3.71,9.17),octaves=1):
        p=self.uv(f,off)
        return self.n('fractal2d',texcoord=('vector2',p),octaves=('integer',octaves))
    def mask(self,x,lo,hi):return self.n('smoothstep',**{'in':('float',x),'low':('float',lo),'high':('float',hi)})
    def clamp(self,x,lo=0.,hi=1.,name=None):return self.n('clamp',name=name,**{'in':('float',x),'low':('float',lo),'high':('float',hi)})
    def remap(self,x):return self.clamp(self.op('add',self.op('multiply',x,.8),.5))
    def cell(self,f,style=0):return self.n('worleynoise2d',texcoord=('vector2',self.uv(f,(5.81,17.37))),jitter=('float',.85),style=('integer',style))
    def out(self,name,t,src):E.SubElement(self.g,'output',name='out_'+name,type=t,nodename=src)


def write(family,name,desc):
    low=name.lower(); d=desc.lower(); idx=FAMILIES.index(family)
    c=color(name,desc); metal=0.; rough=.5; amp=.00001; freq=(120.,120.); contrast=.03
    spec=.5; extras={}; mode='smooth'; note=''; aniso=0.
    if idx==0: # Transparent substrate-free media; closed coat shells in consumer.
        c=(1.,1.,1.); rough=.07; amp=.0000002
        if 'matte' in low:rough=.56; amp=.000002
        if 'satin' in low or 'oil' in low:rough=.32; amp=.000001
        tint=(1.,1.,1.)
        if 'amber' in low:tint=(.95,.71,.32)
        elif 'varnish' in low:tint=(.99,.91,.70)
        elif 'blonde' in low:tint=(.99,.94,.78)
        elif 'oil' in low:tint=(.99,.97,.91)
        extras={'base':0.,'transmission':1.,'transmission_color':tint,'transmission_depth':.001,'specular_IOR':1.48}
        if 'epoxy' in low:extras['specular_IOR']=1.55
        if 'wax' in low:
            rough=.45;extras.update(transmission_scatter=(.12,.12,.12),transmission_scatter_anisotropy=.2)
            if 'whiteliming' in low:extras.update(base=.65,transmission=.35);c=(.7,.7,.68)
        note='Substrate-free coating medium. Apply to a closed coating shell or layer over a separately assigned substrate; no substrate darkening or pore coverage is baked in. Absorption depth 1 mm is a reference distance, not assigned film geometry.'
    elif idx==1: # Bare conductors and exposed oxides.
        metal=1.;rough=.35;freq=(150.,150.);amp=.000002;contrast=.035
        conductor={'stainlesssteel':(.58,.61,.64),'aluminum':(.91,.92,.93),'brass':(.75,.57,.24),'bronze':(.58,.36,.15),'copper':(.95,.64,.54),'nickel':(.66,.61,.53),'chrome':(.55,.56,.57),'goldplating':(.96,.76,.30),'titanium':(.54,.52,.49),'tin':(.76,.74,.70),'zinc':(.62,.66,.70),'lead':(.46,.45,.43),'castiron':(.09,.095,.10),'steel':(.28,.30,.32),'silver':(.95,.93,.88)}
        for key,value in sorted(conductor.items(),key=lambda x:-len(x[0])):
            if low.startswith(key):c=value;break
        if low.startswith('steelgalvanized'):
            c=(.62,.66,.70) # Exposed zinc coating, not the hidden carbon-steel substrate.
            if 'matte' in low:rough=.65;contrast=.045;amp=.000004
        if 'polished' in low:rough=.065;amp=.0000003;contrast=.008
        if 'brushed' in low:rough=.29;freq=(3.,440.);amp=.000009;aniso=.75
        if 'satin' in low:rough=.42;amp=.000004
        if 'rolling' in d or 'machining' in d:freq=(8.,250.);aniso=.4
        if 'spangled' in low:mode='spangle';freq=(80.,80.);amp=.000002;contrast=.17
        if 'beadblasted' in low:mode='granular';freq=(500.,500.);amp=.000012;rough=.65
        if any(x in low for x in ('rust','patina','verdigris','weathered','blackened','aged','tarnish','millscale')):
            mode='oxide';contrast=.24;rough=.72;amp=.000035;freq=(180.,180.)
            c=color(name,desc)
            if 'rustorange' in low:c=(.42,.12,.025)
            if 'rustdarkbrown' in low:c=(.12,.04,.015)
            if 'weatheringrust' in low:c=(.27,.075,.022)
            if 'green' in low or 'verdigris' in low:c=(.06,.27,.20)
            metal=.05 if ('rust' in low or 'patina' in low or 'verdigris' in low) else .4
            if 'blackened' in low or 'millscale' in low:c=(.015,.02,.026)
            note='Continuous oxide grains at 320 per m add 90 micrometre crowns; fine 600 per m pits cut 50 micrometres. Oxide coverage modulates conductor weight; dielectric oxide and remaining bare metal are an energy-weighted standard_surface approximation, not a spectral layered conductor.'
    elif idx==2: # Binder covers metal except anodized/PVD and visible flakes.
        rough=.38;amp=.000006;contrast=.015;freq=(260.,260.)
        if 'matte' in low:rough=.78;amp=.000016
        if 'gloss' in low:rough=.12;amp=.000002
        if 'anodized' in low or 'pvd' in low:
            metal=1.;rough=.32;freq=(3.,380.);amp=.000004;aniso=.6
            extras={'coat':.65,'coat_roughness':.22,'coat_IOR':1.6}
            note='Colored conductor under a dielectric coat approximates the anodic/PVD layer; no measured spectral or interference calibration.'
        if low=='aluminumanodizednatural':c=(.82,.84,.86)
        if 'metallic' in low:
            mode='flake';metal=0.;extras={'coat':1.,'coat_roughness':.32};contrast=.12;freq=(850.,850.)
            note='Sparse metallic flakes share a dielectric binder through a spatial conductor mask; subpixel sparkle and flake orientations require renderer support.'
        if 'enamel' in low:rough=.09;amp=.0000007;extras={'coat':1.,'coat_roughness':.065,'coat_IOR':1.52}
    elif idx==3:
        rough=.018;amp=.00000005;c=(1.,1.,1.);contrast=0.
        extras={'base':0.,'transmission':1.,'transmission_color':(.92,.98,.94),'transmission_depth':.1,'specular_IOR':1.52}
        note='Closed geometry supplies optical path length. transmission_color is reference transmittance at transmission_depth in metres, not opacity. Rendering of volume scattering, films and multibounce refraction depends on renderer support.'
        if 'lowiron' in low:extras['transmission_color']=(.993,.998,.995)
        # Reference transmittances preserve optical density; do not normalize RGB by hue.
        absorption={
            'glasstintedgreen':(.42,.76,.46),'glasstintedblue':(.36,.58,.82),
            'glasstintedgray':(.62,.62,.62),'glasstintedbronze':(.68,.43,.22),
            'glasstinteddarkgray':(.24,.24,.24),'glasstintedamber':(.88,.52,.15),
            'solarfilmneutralgray':(.42,.42,.42),
            'glasselectrochromicdarkblue':(.025,.07,.20),
        }
        if low in absorption:
            extras['transmission_color']=absorption[low];extras['transmission_depth']=.01
        if low=='glasselectrochromicclear':extras['transmission_color']=(.92,.95,.98)
        if 'reflective' in low:extras.update(transmission=.55,specular=1.);extras['specular_color']=color(name,desc)
        if 'lowemissivity' in low:extras['specular_color']=(.94,.97,1.) if 'blue' in low else (.98,.99,1.)
        if any(x in low for x in ('etched','sandblasted','frosted','milk','opal','translucent')):
            rough=.4 if 'etched' in low else .62;amp=.0000015;extras['transmission_extra_roughness']=.3
            extras['transmission_scatter']=(.35,.35,.35);extras['transmission_scatter_anisotropy']=.55
            if 'milk' in low or 'opal' in low:
                rough=.06;c=(.72,.71,.68);extras.update(base=1.,transmission=.35)
                extras['transmission_scatter']=(.8,.8,.8);extras['transmission_depth']=.008
                note+=' Mixed diffuse/transmission is an explicit milky appearance fallback because the preview ignores native volume scattering; retained transmission_scatter is for capable renderers. This is a surface approximation, not a volumetric solution.'
                if 'warm' in low:
                    c=(.74,.67,.52);extras['transmission_color']=(.98,.9,.72);extras['transmission']=.28
            elif 'frostedwhite' in low or 'privacyfilmtranslucent' in low:
                c=(.69,.69,.68);extras.update(base=1.,transmission=.45)
                if 'privacyfilm' in low:rough=.12
                note+=' Diffuse reflection plus transmission approximates the milky scattering appearance in preview renderers that ignore native volume scattering.'
        if any(x in low for x in ('reeded','textured','antique','seeded')):
            freq=(8.,90.) if 'reeded' in low else (35.,35.);amp=.000018;mode='smooth'
        if 'seeded' in low:mode='bubbles';freq=(650.,650.);amp=.000004;note+=' Trapped bubbles are represented as sparse optical roughness/normal inclusions, not explicit volume geometry.'
        if 'backpainted' in low:
            c=color(name,desc);extras={'coat':1.,'coat_roughness':.018,'coat_IOR':1.52};rough=.35
            note='Opaque color under a clear dielectric coat approximates back-painted glass. Actual separation and rear-face paint require layered geometry.'
        if 'ceramicfrit' in low:c=color(name,desc);extras={};rough=.5;amp=.000005
        if low.startswith('mirror'):
            c=color(name,desc);extras={'coat':.5,'coat_roughness':.018};rough=.012;metal=1.
            if low=='mirrorsilver':c=(.95,.94,.91)
            if low=='mirrorgray':c=(.40,.41,.41)
            if low=='mirrorsmokedblack':c=(.12,.12,.12)
            if 'antiqued' in low:mode='oxide';contrast=.65;freq=(100.,100.);metal=.85;rough=.1
            note='Opaque conductor reflection approximates the backing; physical glass/backing separation is supplied by the consumer.'
        if 'dichroic' in low:extras.update(thin_film_thickness=420.,thin_film_IOR=1.8);note+=' Thin-film thickness is 420 nm; spectral transmission interference may be unsupported by preview renderers.'
        if 'film' in low:extras['thin_walled']=True
    elif idx==4:
        rough=.78;amp=.00002;freq=(270.,270.);contrast=.04
        if 'granul' in low:mode='granular';amp=.00009;freq=(600.,600.);rough=.94;contrast=.25
        if 'bitumenblack' in low:rough=.48;freq=(8.,40.);amp=.000035
        if any(x in low for x in ('tpo','pvc','liquid','silicone')):rough=.48;amp=.000012
        if 'foil' in low:metal=1.;c=(.80,.82,.84);rough=.35;freq=(25.,45.);amp=.00012
        if any(x in low for x in ('wrap','nonwoven','barrierblack','breather')):mode='fiber';freq=(80.,360.);amp=.00002;rough=.9;contrast=.08
        if 'translucent' in low:extras={'base':.1,'transmission':.9,'transmission_color':(.97,.97,.96),'transmission_depth':.001,'thin_walled':True,'transmission_extra_roughness':.25};rough=.25
    elif idx==5:
        rough=.55;amp=.000008;contrast=.035;freq=(210.,210.)
        if 'linoleum' in low:mode='marbled';freq=(7.,30.);contrast=.15;amp=.00001;rough=.54
        if 'rubber' in low:rough=.83;amp=.00002
        if 'cork' in low:mode='granular';freq=(250.,250.);contrast=.3;amp=.00007;c=(.38,.22,.105)
        if 'speckl' in d or 'fleck' in d:mode='fleck';contrast=.30;freq=(650.,650.)
        if 'epoxy' in low or 'polyurethane' in low:rough=.23;amp=.000001
        if 'gloss' in low:rough=.10;amp=.0000005
        if 'matte' in low:rough=.58
        if 'satin' in low:rough=.36
        if 'flake' in low:mode='fleck';freq=(220.,220.);contrast=.45
        if 'resinboundaggregate' in low:
            mode='granular';freq=(320.,320.);amp=.00012;rough=.72;contrast=.38;extras={'coat':.5,'coat_roughness':.16}
            note='Mineral grain relief has a separate smooth dielectric binder response; binder coat coverage follows the inter-grain mask.'
        if 'antislip' in low or 'grit' in d:mode='granular';freq=(430.,430.);rough=.85;amp=.000065
        if 'retroreflective' in low:
            rough=.5;mode='granular';freq=(900.,900.);amp=.000006
            note='Glass-bead surface and diffuse binder proxy only. standard_surface has no true retroreflective lobe; directional return requires the consuming renderer to replace this shader with a retroreflective model.'
        if 'photoluminescent' in low:
            c=(.52,.70,.40);rough=.86;extras={'emission':.05,'emission_color':(.10,.64,.055)}
            note='Emission 0.05 is an art-directed initial afterglow preview. The consuming application must animate emission after excitation; this file does not simulate excitation or decay time.'
        if 'metallic' in low:mode='flake';extras={'coat':1.,'coat_roughness':.2};metal=0.;contrast=.15
    elif idx==6:
        rough=.92;spec=.2;mode='fiber';freq=(140.,400.);amp=.000055;contrast=.12;extras={'sheen':.35,'sheen_color':tuple(min(1.,x*1.3+.04) for x in c),'sheen_roughness':.8}
        if 'looppile' in low or 'boucle' in low:mode='loops';freq=(400.,400.);amp=.00009;extras['sheen']=.4
        if 'cutpile' in low:freq=(260.,380.);amp=.00007
        if 'lowpile' in low:amp=.000035;rough=.83
        if 'heathered' in low:contrast=.48
        if 'outdoor' in low or 'sisal' in low:mode='weave';freq=(180.,240.);amp=.000045;rough=.88
        if 'felt' in low:freq=(220.,450.);amp=.000025;contrast=.09
        if 'pet' in low:contrast=.16
        if 'coir' in low:freq=(80.,290.);amp=.00013;c=(.22,.12,.035)
        note='Surface-scale fiber and sheen model; actual pile silhouettes and self-shadowing require geometry. Fine fibers are intended for closeup/detail views and may need filtering at distance.'
    elif idx==7:
        rough=.85;spec=.2;mode='weave';freq=(380.,430.);amp=.000025;contrast=.07;extras={'sheen':.28,'sheen_color':tuple(min(1.,x*1.4+.03) for x in c),'sheen_roughness':.75}
        if 'linen' in low:freq=(280.,350.);amp=.000035;contrast=.14
        if 'canvas' in low:freq=(210.,250.);amp=.00005
        if 'velvet' in low:
            mode='fiber';freq=(18.,420.);amp=.000015;rough=.96;aniso=.65;extras.update(sheen=.85,sheen_roughness=.55)
        if 'boucle' in low:mode='loops';freq=(400.,400.);amp=.00009;contrast=.16
        if 'twill' in low:mode='twill';freq=(300.,380.);amp=.000035
        if 'silk' in low or 'satin' in low:
            freq=(450.,600.);amp=.000004;rough=.35;aniso=.7;spec=.4;extras.update(sheen=.65,sheen_roughness=.35)
        if 'sheer' in low or 'solarscreen' in low:
            extras.update(transmission=.6,transmission_color=c,transmission_extra_roughness=.5,thin_walled=True);rough=.75
            note='Fine yarn coverage drives opacity; thin-wall transmission approximates diffuse fiber transmission. Requires two-sided thin textile support.'
        if 'rattan' in low or 'seagrass' in low or 'raffia' in low:
            mode='fiber';freq=(6.,400.);amp=.000028;rough=.65;extras['sheen']=.15
        note+=' Surface-scale yarn/nap only; no folds, furniture or woven product arrangement. Silk/velvet anisotropic sheen is an approximation.'

    doc=E.Element('materialx',version='1.39',colorspace='lin_rec709')
    E.SubElement(doc,'comment') if False else None
    doc.append(E.Comment(' Catalog: '+desc+' '))
    doc.append(E.Comment(' Art-directed linear Rec.709; 1 UV = 1 m; height in m. '+note+' '))
    g=Graph(doc,name);g.n('texcoord','vector2',name='uv',index=('integer',0))
    macro=g.noise((3.1,4.3),(11.37,29.17),3)
    n=g.noise(freq)
    mask=g.remap(n)
    h=g.op('multiply',n,amp)
    if mode in ('granular','loops','bubbles'):
        dist=g.cell(freq)
        dome=g.op('subtract',1.,g.mask(dist,.05,.48 if mode!='bubbles' else .13))
        if mode=='bubbles':
            random=g.cell((40.,40.),1);presence=g.mask(random,.92,.99);dome=g.op('multiply',dome,presence)
        h=g.op('multiply',dome,amp);mask=dome
    elif mode in ('spangle','fleck','flake'):
        rand=g.cell(freq,1)
        mask=rand if mode=='spangle' else g.mask(rand,.7 if mode=='fleck' else .88,.95)
        # Cellular colors are discontinuous; height stays continuous.
    elif mode in ('weave','twill'):
        coords='uv'
        if mode=='twill':coords=g.n('rotate2d','vector2',**{'in':('vector2','uv'),'amount':('float',35.)})
        sep=g.n('separate2','multioutput',**{'in':('vector2',coords)})
        a=g.unary('sin',g.op('multiply',sep+'.outx',freq[0]*6.283185307))
        b=g.unary('sin',g.op('multiply',sep+'.outy',freq[1]*6.283185307))
        weave=g.op('add',g.op('multiply',a,.5),g.op('multiply',b,.5))
        h=g.op('add',g.op('multiply',weave,amp),g.op('multiply',n,amp*.22));mask=g.remap(weave)
    elif mode=='fiber':
        cross=g.noise((freq[1]*.8,freq[0]*1.2),(31.7,4.9))
        fiber=g.op('add',g.op('multiply',n,.7),g.op('multiply',cross,.3))
        h=g.op('multiply',fiber,amp);mask=g.remap(fiber)
    elif mode=='oxide':
        # Oxide grains 1.7–3.3 mm across, continuous 90 um crowns and 50 um pits.
        # Smooth thresholds keep slopes under about 15 degrees including base layers.
        grain_dist=g.cell((320.,320.))
        grain=g.op('subtract',1.,g.mask(grain_dist,.08,.52))
        pits=g.mask(g.noise((600.,600.),(21.31,8.91)),.24,.65)
        grain_h=g.op('subtract',g.op('multiply',grain,.00009),g.op('multiply',pits,.00005))
        h=g.op('add',h,grain_h)
        mask=g.clamp(g.op('add',g.op('multiply',g.remap(macro),.8),g.op('multiply',grain,.2)))
    elif mode=='marbled':
        mask=g.remap(g.op('add',n,g.op('multiply',macro,.4)))
    # Macro drift is pigment only; avoid baking ambient occlusion into the color.
    drift=g.op('add',1.,g.op('multiply',macro,contrast*.28))
    tint=g.mix(tuple(x*(1.-contrast) for x in c),tuple(min(1.,x*(1.+contrast)) for x in c),mask,'color3')
    if mode=='fleck':
        chip_id=g.cell((freq[0]*.93,freq[1]*.93),1)
        chip_color=g.mix((.018,.02,.022),(.73,.71,.65),g.mask(chip_id,.48,.52),'color3')
        tint=g.mix(c,chip_color,mask,'color3')
    col=g.op('multiply',tint,drift,'color3','float',name='base_color')
    r=g.clamp(g.op('add',rough,g.op('multiply',g.op('subtract',mask,.5),-min(.12,rough*.14))),.005,1.,name='roughness')
    m=g.const(metal,name='metalness')
    if mode=='oxide':
        # Remaining metallic regions reflect more clearly than deposited oxide.
        m=g.mix(max(0.,metal*.1),min(1.,metal+.2),mask,name='oxide_metalness')
        r=g.mix(min(.92,rough+.10),max(.05,rough-.25),mask,name='oxide_roughness')
    if mode=='flake':m=g.op('multiply',mask,.85,name='flake_metalness')
    h=g.op('add',h,g.op('multiply',macro,amp*.25),name='height')
    uvmm=g.op('multiply','uv',1000.,'vector2','float',name='uv_mm')
    hmm=g.op('multiply',h,1000.,name='height_mm')
    normal=g.n('heighttonormal','vector3',name='n_tangent',**{'in':('float',hmm),'scale':('float',16.),'texcoord':('vector2',uvmm)})
    normal=g.n('normalmap','vector3',name='n_world',**{'in':('vector3',normal)})
    for key,t,node in [('base_color','color3',col),('roughness','float',r),('metalness','float',m),('normal','vector3',normal)]:g.out(key,t,node)
    if 'resinboundaggregate' in low:
        binder=g.op('subtract',1.,mask);g.out('binder_coat','float',binder)
    if spec!=.5:
        sp=g.const(spec,name='specular_weight');g.out('specular','float',sp)
    if 'sheer' in low or 'solarscreen' in low:
        coverage=g.mix(.4,.98,mask);cov=g.n('convert','color3',**{'in':('float',coverage)});g.out('opacity','color3',cov)
    # Remove nodes not consumed by a final output (e.g. alternative recipe branches).
    nodes={x.get('name'):x for x in g.g if x.tag!='output'}
    needed=set()
    def use(x):
        if x in needed:return
        needed.add(x)
        for inp in nodes[x]:
            if inp.get('nodename'):use(inp.get('nodename'))
    for o in g.g.findall('output'):use(o.get('nodename'))
    for key,node in nodes.items():
        if key not in needed:g.g.remove(node)
    shader=E.SubElement(doc,'standard_surface',name='SR_'+name,type='surfaceshader')
    def value(key,val):
        t='boolean' if isinstance(val,bool) else 'color3' if isinstance(val,tuple) else 'float'
        E.SubElement(shader,'input',name=key,type=t,value=fmt(val))
    for key,t,out in [('base_color','color3','base_color'),('specular_roughness','float','roughness'),('metalness','float','metalness'),('normal','vector3','normal')]:
        E.SubElement(shader,'input',name=key,type=t,nodegraph='NG_'+name,output='out_'+out)
    if spec!=.5:E.SubElement(shader,'input',name='specular',type='float',nodegraph='NG_'+name,output='out_specular')
    elif 'specular' not in extras:value('specular',spec)
    if aniso:value('specular_anisotropy',aniso)
    if 'specular_IOR' not in extras:value('specular_IOR',1.5)
    for key,val in extras.items():
        if key=='coat' and 'resinboundaggregate' in low:
            E.SubElement(shader,'input',name='coat',type='float',nodegraph='NG_'+name,output='out_binder_coat')
        else:value(key,val)
    if 'coat' in extras:E.SubElement(shader,'input',name='coat_normal',type='vector3',nodegraph='NG_'+name,output='out_normal')
    if 'sheer' in low or 'solarscreen' in low:E.SubElement(shader,'input',name='opacity',type='color3',nodegraph='NG_'+name,output='out_opacity')
    # Material identifier is exactly the lower camel case catalog identifier.
    mat=E.SubElement(doc,'surfacematerial',name=name,type='material')
    E.SubElement(mat,'input',name='surfaceshader',type='surfaceshader',nodename='SR_'+name)
    folder=DEST/re.sub('[^a-z0-9]+','-',family.lower()).strip('-');folder.mkdir(parents=True,exist_ok=True)
    doc.insert(2,E.Comment(f' Recipe {mode}: feature frequencies {freq[0]:g}, {freq[1]:g} per m; relief amplitude {amp:g} m; macro drift about 0.25 m. '+ ('Subpixel detail requires filtering at distance. ' if max(freq)>300 else '') ))
    E.indent(doc,space='  ')
    E.ElementTree(doc).write(folder/(name+'.mtlx'),encoding='utf-8',xml_declaration=True)

text=SOURCE.read_text()
sections=re.split(r'^## ',text,flags=re.M)[1:]
allfamilies=[]
for sec in sections:
    title=sec.splitlines()[0]
    rows=re.findall(r'^\|\s*`([^`]+)`\s*\|\s*(.*?)\s*\|\s*$',sec,re.M)
    if rows:allfamilies.append((title,rows))
FAMILIES=[title for title,rows in allfamilies[8:16]]
if __name__=='__main__':
    count=0
    for title,rows in allfamilies[8:16]:
        for name,desc in rows:write(title,name,desc);count+=1
        print(f'{title}: {len(rows)}')
    print(f'Generated {count} materials')
