#!/usr/bin/env python3
"""Rebuild catalog sections 12–20. Run from repository root. UV units and relief are meters.
All colors below are approximate linear Rec.709 appearance targets, not measured OEM values.
"""
from pathlib import Path
import re, json, html
ROOT=Path(__file__).resolve().parents[3]
DEST=ROOT/'material_library/vehicle'
PALETTE={
'Black':(.008,.009,.011),'Charcoal':(.035,.038,.042),'Gray':(.19,.20,.21),'LightGray':(.43,.45,.46),'White':(.75,.75,.73),'Ivory':(.73,.67,.52),'Cream':(.72,.63,.43),'Beige':(.39,.30,.20),'Sand':(.42,.33,.21),'Tan':(.35,.20,.095),'Camel':(.39,.22,.09),'Cognac':(.25,.085,.023),'SaddleBrown':(.20,.075,.028),'DarkBrown':(.055,.022,.012),'Brown':(.13,.062,.028),'Burgundy':(.12,.012,.025),'Red':(.42,.018,.025),'Orange':(.65,.13,.012),'Yellow':(.72,.49,.025),'OliveGreen':(.11,.14,.035),'ForestGreen':(.018,.075,.035),'Green':(.028,.18,.065),'NavyBlue':(.012,.025,.075),'Blue':(.025,.10,.33),'Purple':(.15,.025,.19),'Gold':(.60,.35,.065),'Bronze':(.28,.13,.045),'PaleYellow':(.67,.59,.30)}
def color(n):
 for k in sorted(PALETTE,key=len,reverse=True):
  if n.endswith(k):return PALETTE[k]
 return (.30,.23,.14)
def fmt(v):return ', '.join(f'{x:.7g}' for x in v) if isinstance(v,(tuple,list)) else str(v).lower() if isinstance(v,bool) else f'{v:.8g}'
class G:
 def __init__(self):self.nodes=[];self.types={}
 def n(self,cat,name,t='float',**ins):
  self.types[name]=t; self.nodes.append((cat,name,t,ins));return name
 def input(self,k,v,t=None):
  if isinstance(v,str):return f'<input name="{k}" type="{t or self.types[v]}" nodename="{v}" />'
  if isinstance(v,tuple) and len(v)==2 and v[0]=='ref':raise ValueError(v)
  typ=t or ('vector2' if isinstance(v,(list,tuple)) and len(v)==2 else 'color3' if isinstance(v,(list,tuple)) else 'float')
  return f'<input name="{k}" type="{typ}" value="{fmt(v)}" />'
 def op(self,cat,name,a,b,t='float'):return self.n(cat,name,t,in1=a,in2=b)
 def noise(self,name,freq,octaves=2):
  p=self.op('multiply',name+'_uv','uv',freq,'vector2');return self.n('fractal2d',name,texcoord=p,octaves=('integer',octaves))
 def mix(self,name,a,b,m,t='float'):return self.n('mix',name,t,bg=a,fg=b,mix=m)
 def xml(self,outputs):
  wanted=set(outputs.values());by={n:(c,n,t,i) for c,n,t,i in self.nodes}
  def visit(n):
   for v in by[n][3].values():
    if isinstance(v,str) and v not in wanted:wanted.add(v);visit(v)
  for n in list(wanted):visit(n)
  lines=[]
  for c,n,t,ins in self.nodes:
   if n not in wanted:continue
   text=''
   for k,v in ins.items():
    if isinstance(v,tuple) and len(v)==2 and isinstance(v[0],str):text+=self.input(k,v[1],v[0])
    else:text+=self.input(k,v)
   lines.append(f'    <{c} name="{n}" type="{t}">{text}</{c}>')
  for name,n in outputs.items():lines.append(f'    <output name="{name}_out" type="{self.types[n]}" nodename="{n}" />')
  return '\n'.join(lines)
def build(name,desc,section):
 g=G();g.n('texcoord','uv','vector2');p=color(name);rough=.46;metal=0;spec=.5;sheen=0;coat=0;coatrough=.15;aniso=0;relief=.000025;contrast=.06;freq=(500,500);mode='grain';extra={};opacity=None
 low=(name+' '+desc).lower()
 fiber=any(x in low for x in ['suede','nubuck','microfiber','velour','felt','flock','wool','pile','needle','filter','fiber insulation','aerogel'])
 if section in [14,16] or any(x in name for x in ['headliningKnit','sunshadeTextile','speakerGrille','Canvas','Tarpaulin','aluminizedGlassCloth']): mode='weave';freq=(1000,1000);relief=.000025;rough=.77;spec=.2;sheen=.25;aniso=.25;contrast=.18
 if section==12 or section==13:
  freq=(400,400);mode='leather';relief=.000035;rough=.48;contrast=.05
  if 'Pebbled' in name or 'Coarse' in name:freq=(350,350);relief=.00010;contrast=.10
  if 'Nappa' in name:freq=(650,650);relief=.000018;rough=.54
  if 'Aniline' in name:contrast=.13;rough=.55
  if 'Silicone' in name:rough=.66;relief=.000018
  if 'EmbossedTechnical' in name:mode='weave';freq=(500,500);relief=.000025
 if fiber:
  mode='fiber';freq=(850,120);rough=.93;spec=.18;sheen=.45;aniso=.30;relief=.000018;contrast=.16
 if section==15 and 'CutPile' in name:freq=(650,650);relief=.00006;contrast=.3
 if 'LoopPile' in name:mode='knit';freq=(330,500);relief=.00006;rough=.91;spec=.18;sheen=.4
 if 'Knit' in name:mode='knit';freq=(1000,750)
 if 'seatbelt' in name:freq=(1400,550);rough=.54;aniso=.5
 if 'Thread' in name or 'Yarn' in name:mode='fiber';freq=(1600,90);rough=.58;aniso=.6;relief=.000008
 if 'vinylElectricalTape' in name:mode='grain';rough=.38;freq=(800,800);relief=.000004;sheen=0;spec=.5
 if section==17 or any(x in name for x in ['plywoodBirch','plywoodHardwood','hardwoodFloor','bambooFloor']):
  mode='wood';rough=.48;freq=(300,6);relief=.000045;contrast=.48;coat=.2;coatrough=.35
  species={ 'Walnut':(.16,.065,.023),'Oak':(.39,.235,.095),'Ash':(.52,.38,.20),'Maple':(.59,.42,.22),'Birch':(.57,.39,.17),'Cherry':(.31,.11,.042),'Mahogany':(.20,.046,.019),'Rosewood':(.105,.025,.013),'Ebony':(.022,.013,.009),'Zebrano':(.36,.20,.072),'Bamboo':(.46,.30,.10),'Teak':(.33,.17,.058),'Eucalyptus':(.28,.14,.058)}
  for k,v in species.items():
   if k.lower() in name.lower():p=v;break
  if 'Dyed' in name:p=color(name);contrast=.38
  if 'Gloss' in name:coat=1;coatrough=.07;rough=.31;relief=.000003
  if 'OpenPore' in name:coat=.12;coatrough=.45
  if 'Print' in name:relief=.000003;coat=.35;rough=.35
  if 'Piano' in name:mode='grain';p=PALETTE['Black' if 'Black' in name else 'White'];coat=1;coatrough=.055;relief=.000001;contrast=.005
  if 'cork' in name:mode='bead';freq=(500,500);rough=.95;coat=0;contrast=.4;relief=.00007;p=(.33,.19,.075) if 'Natural' in name else (.075,.035,.016)
 if section==18:
  mode='weave';freq=(250,250);p=(.012,.014,.017);rough=.35;coat=1;coatrough=.075;aniso=.6;relief=.000008;contrast=.7
  if 'Satin' in name:coatrough=.35
  if 'Matte' in name:coatrough=.6;rough=.5
  if 'SpreadTow' in name:freq=(80,80)
  if 'Unidirectional' in name:mode='fiber';freq=(1400,5)
  if 'Forged' in name:mode='fragments';freq=(200,40);aniso=.3
  if 'Tinted' in name:extra['coat_color']=('color3',tuple(min(1,c*1.5+.10) for c in color(name)))
  if 'carbonAramid' in name:extra['hybrid']=True
  if 'aramidComposite' in name:p=(.57,.38,.055);coat=.5;coatrough=.4
  if 'naturalFiber' in name:p=(.33,.22,.105);coat=.25;coatrough=.5;rough=.66
  if any(x in name for x in ['Hemp','Kenaf','sheetMolding','glassFiber']):mode='fragments';freq=(450,60);p=color(name);contrast=.12;rough=.53;coat=.15;coatrough=.4
  if 'glassFiberCompositeNatural' in name:p=(.57,.43,.20);extra.update(subsurface=('float',.25),subsurface_radius=('color3',(.001,.0007,.0003)),subsurface_scale=('float',1))
  if 'Print' in name:coat=.2;aniso=0;relief=.000002
 if section==19:
  rough=.9;spec=.2;sheen=.15
  if 'Foam' in name:mode='cells';freq=(1200,1200);relief=.000022;contrast=.32
  if 'OpenCell' in name:freq=(700,700);relief=.00005
  if 'epp' in name or 'eps' in name:mode='bead';freq=(330,330);relief=.000045;contrast=.12
  if 'IntegralSkin' in name:mode='grain';rough=.55;spec=.5;sheen=0;relief=.000015;contrast=.04
  if any(x in name for x in ['Foil','aluminizedPolymer']):mode='grain';p=(.91,.92,.93);metal=1;rough=.18;spec=.5;sheen=0;relief=.000003;contrast=.02
  if 'Embossed' in name:mode='weave';freq=(600,600);relief=.000025;rough=.24
  if 'aluminizedGlass' in name:mode='weave';p=(.8,.81,.82);metal=1;rough=.32;freq=(800,800);aniso=.4
  if 'aluminizedPolymer' in name:coat=.7;coatrough=.12
  if 'Damping' in name:mode='grain';rough=.49;sheen=0;spec=.5;relief=.000012;contrast=.04
  if 'recycledFiber' in name:p=(.15,.15,.15);contrast=.5
  if 'activatedCarbon' in name:mode='cells';freq=(1100,1100);p=(.035,.035,.034);relief=.000025;contrast=.4
 if section==20:
  if 'Speckled' in name:mode='speckle';freq=(1000,1000);rough=.62;contrast=.65
  if 'Gloss' in name:rough=.12;relief=.000003
  if 'Satin' in name:rough=.45
  if any(x in name for x in ['Steel','Carbide']):metal=1;p=(.29,.30,.31);rough=.48;relief=.000008;freq=(900,900)
  if 'Translucent' in name or 'uhmwPolyethyleneNatural' in name:extra.update(subsurface=('float',.45),subsurface_radius=('color3',(.002,.0015,.001)),subsurface_scale=('float',1));p=(.66,.64,.56)
 if 'Coated' in name or 'coated' in name:rough=.46;sheen=.06;spec=.5;relief*=.4
 # Metric coordinates are never normalized to the object; frequencies are cycles per meter.
 n=g.noise('micro',freq);macro=g.noise('tone_drift',(4,4),2)
 mask=g.op('add','micro_center',g.op('multiply','micro_scale',n,.55),.5)
 if mode in ['leather','cells','bead','speckle']:
  uv=g.op('multiply','cell_uv','uv',freq,'vector2');w=g.n('worleynoise2d','cell_distance',texcoord=uv,jitter=.7,style=('integer',0))
  mask=g.n('smoothstep','cell_profile',**{'in':w,'low':.12 if mode in ['leather','cells'] else .20,'high':.38 if mode in ['leather','cells'] else .67})
  if mode=='bead':mask=g.op('subtract','bead_inverse',1,mask)
 # Irregular raised pebbles are bounded by recessed Voronoi seams, not round pits.
 # A second 0.6 mm pore scale is added to the final height independently below.
 pebbled=mode=='leather' and any(x in name for x in ['Pebbled','Coarse'])
 if pebbled:
  edges=g.n('worleynoise2d','pebble_pair','vector2',texcoord=uv,jitter=.72,style=('integer',0))
  boundary=g.n('dotproduct','pebble_boundary',in1=edges,in2=('vector2',(-1,1)))
  mask=g.n('smoothstep','pebble_crests',**{'in':boundary,'low':.025,'high':.24})
 if mode in ['weave','knit']:
  uv=g.op('multiply','weave_uv','uv',freq,'vector2')
  x=g.n('dotproduct','warp_coord',in1=uv,in2=('vector2',(1,0))); y=g.n('dotproduct','weft_coord',in1=uv,in2=('vector2',(0,1)))
  phase=x
  if 'Twill' in name:phase=g.op('add','diagonal',x,y)
  if 'Herringbone' in name:
   band=g.op('modulo','band',g.n('floor','bands',**{'in':g.op('multiply','band_width',x,.08)}),2)
   yy=g.mix('alternate_slope',y,g.op('multiply','reverse_slope',y,-1),band);phase=g.op('add','chevron',x,yy)
  if mode=='knit':phase=g.op('add','loop_phase',x,g.op('multiply','loop_bend',g.n('sin','loop_wave',**{'in':g.op('multiply','loop_y',y,6.283185)}),.30))
  wave=g.n('sin','warp_wave',**{'in':g.op('multiply','warp_radians',phase,6.283185)})
  weft=g.n('sin','weft_wave',**{'in':g.op('multiply','weft_radians',y,6.283185)})
  mask=g.op('add','woven_center',g.op('multiply','woven_scale',g.op('multiply','woven_product',wave,weft),.5),.5)
  if 'SpacerMesh' in name or 'sunshade' in name or 'speakerGrille' in name:
   openness=g.n('smoothstep','yarn_coverage',**{'in':mask,'low':.18,'high':.40});opacity=g.n('convert','fabric_opacity','color3',**{'in':openness})
 if mode=='wood':
  warp=g.noise('grain_warp',(7,4),2);uv=g.op('add','grain_distorted','uv',g.n('combine2','grain_shift','vector2',in1=g.op('multiply','grain_warp_size',warp,.008),in2=0),'vector2')
  gruv=g.op('multiply','grain_uv',uv,freq,'vector2');grain=g.n('fractal2d','grain',texcoord=gruv,octaves=('integer',3));mask=g.op('add','grain_center',g.op('multiply','grain_scale',grain,.65),.5)
  if 'Burl' in name or 'Birdseye' in name:
   # Organic figure: independent vector warp at 2–10 cm, stretched variable-width
   # growth bands and sparse eyes; no sinusoidal concentric-circle stencil.
   figureuv=g.op('multiply','figure_warp_uv','uv',(13,9),'vector2')
   figurex=g.n('fractal2d','figure_warp_x',texcoord=figureuv,octaves=('integer',2))
   figureyuv=g.op('add','figure_warp_y_uv',figureuv,(37.31,19.73),'vector2')
   figurey=g.n('fractal2d','figure_warp_y',texcoord=figureyuv,octaves=('integer',2))
   warpvec=g.n('combine2','figure_warp_vector','vector2',in1=figurex,in2=figurey)
   warped=g.op('add','figure_frame','uv',g.op('multiply','figure_warp_size',warpvec,.035,'vector2'),'vector2')
   fibuv=g.op('multiply','figure_fiber_uv',warped,(170,18),'vector2')
   fig=g.n('fractal2d','figure_fibers',texcoord=fibuv,octaves=('integer',2))
   figure=g.op('add','figure_center',g.op('multiply','figure_contrast',fig,.75),.5)
   eyesuv=g.op('multiply','eyes_uv',warped,(42,31),'vector2')
   eyes=g.n('worleynoise2d','eyes',texcoord=eyesuv,jitter=.72,style=('integer',0))
   eyeprofile=g.n('smoothstep','eye_profile',**{'in':eyes,'low':.045,'high':.19})
   figure=g.op('multiply','figure_with_eyes',figure,g.mix('eye_darkening',.48,1,eyeprofile))
   mask=g.mix('figured_grain',mask,figure,.85 if 'Burl' in name else .38)
 if mode=='fragments':
  uv=g.op('multiply','fragment_uv','uv',freq,'vector2');mask=g.n('worleynoise2d','fragment_id',texcoord=uv,jitter=.7,style=('integer',1))
 # Small manufacturing/grain contrast, no weathering or use effects.
 lo=tuple(max(.001,c*(1-contrast)) for c in p);hi=tuple(min(.9,c*(1+contrast)) for c in p)
 if 'hybrid' in extra:lo=(.008,.01,.012);hi=(.57,.36,.04);del extra['hybrid']
 pattern=mask
 for token in ['BlackGray','GrayBlue','GrayRed','BeigeBrown','GrayWhite','BlackWhite','BrownBeige','RedBlack','BlueGray','GreenBlack']:
  if token in name:
   match=re.match(r'(Black|Gray|Beige|Brown|Red|Blue|Green)(Gray|Blue|Red|Brown|White|Beige|Black)',token);lo=PALETTE[match[1]];hi=PALETTE[match[2]]
   motifuv=g.op('multiply','motif_uv','uv',(80,80),'vector2');mx=g.n('dotproduct','motif_x',in1=motifuv,in2=('vector2',(1,0)));my=g.n('dotproduct','motif_y',in1=motifuv,in2=('vector2',(0,1)))
   fx=g.n('floor','motif_ix',**{'in':mx});fy=g.n('floor','motif_iy',**{'in':my})
   if 'Plaid' in name:
    bx=g.op('modulo','stripe_x',fx,8);by=g.op('modulo','stripe_y',fy,8);wx=g.n('smoothstep','stripe_mask_x',**{'in':bx,'low':2,'high':3});wy=g.n('smoothstep','stripe_mask_y',**{'in':by,'low':2,'high':3});pattern=g.op('multiply','plaid',wx,wy)
   elif 'Houndstooth' in name:
    # Authentic four-light/four-dark yarns in a 2-over/2-under twill.
    warpcolor=g.n('smoothstep','tooth_warp_color',**{'in':g.op('modulo','tooth_warp_repeat',fx,8),'low':3,'high':4})
    weftcolor=g.n('smoothstep','tooth_weft_color',**{'in':g.op('modulo','tooth_weft_repeat',fy,8),'low':3,'high':4})
    diagonal=g.op('modulo','tooth_diagonal',g.op('add','tooth_sum',fx,fy),4);over=g.n('smoothstep','tooth_over',**{'in':diagonal,'low':1,'high':2})
    pattern=g.mix('houndstooth_yarns',warpcolor,weftcolor,over)
   elif 'Herringbone' in name:
    direction=g.op('modulo','herringbone_bands',g.n('floor','herringbone_band',**{'in':g.op('multiply','herringbone_band_width',mx,.125)}),2)
    diagonal=g.op('add','herringbone_diagonal',mx,g.mix('herringbone_direction',my,g.op('multiply','herringbone_reverse',my,-1),direction))
    pattern=g.n('smoothstep','herringbone_yarns',**{'in':g.op('modulo','herringbone_repeat',diagonal,4),'low':1.5,'high':2.5})
   else:pattern=g.op('modulo','motif',g.op('add','motif_sum',fx,fy),2)
   break
 c=g.mix('base_color',lo,hi,pattern,'color3')
 if mode in ['fiber','fragments'] and 'Multicolor' in name:
  tinted=g.mix('recycled_flecks',(.08,.10,.13),(.31,.20,.15),mask,'color3');c=tinted
 drift=g.op('add','drift_gain',g.op('multiply','drift_amount',macro,.025),1);c=g.op('multiply','body_color',c,drift,'color3')
 height=g.op('multiply','height',g.op('subtract','relief_center',mask,.5),relief)
 if pebbled:
  poreuv=g.op('add','fine_pore_uv',g.op('multiply','fine_pore_frequency','uv',(1700,1700),'vector2'),(13.47,31.21),'vector2')
  pores=g.n('worleynoise2d','fine_pores',texcoord=poreuv,jitter=.7,style=('integer',0))
  pore_profile=g.n('smoothstep','fine_pore_profile',**{'in':pores,'low':.035,'high':.12})
  pore_depth=g.op('multiply','fine_pore_depth',g.op('subtract','fine_pore_center',pore_profile,1),.000006)
  height=g.op('add','pebbled_height',height,pore_depth)
 r=g.op('add','roughness',rough,g.op('multiply','roughness_variation',g.op('subtract','roughness_center',mask,.5),-min(.10,rough*.15)))
 mm=g.op('multiply','uv_mm','uv',1000,'vector2');hm=g.op('multiply','height_mm',height,1000);nt=g.n('heighttonormal','n_tangent','vector3',**{'in':hm,'scale':16,'texcoord':mm});normal=g.n('normalmap','n_world','vector3',**{'in':nt})
 outputs={'base_color':c,'roughness':r,'normal':normal,'metalness':g.n('constant','metalness',value=metal),'specular':g.n('constant','specular',value=spec)}
 if opacity:outputs['opacity']=opacity
 params={'base':('float',1),'specular_IOR':('float',1.5),'sheen':('float',sheen),'sheen_roughness':('float',.7),'specular_anisotropy':('float',aniso),'coat':('float',coat),'coat_roughness':('float',coatrough),**extra}
 shader=''.join(f'<input name="{k}" type="{t}" value="{fmt(v)}" />' for k,(t,v) in params.items())
 for k in outputs:
  target='specular_roughness' if k=='roughness' else k;shader+=f'<input name="{target}" type="{g.types[outputs[k]]}" nodegraph="NG_{name}" output="{k}_out" />'
 escaped=html.escape(desc).replace('--','—')
 xml=f'''<?xml version="1.0"?>
<materialx version="1.39" colorspace="lin_rec709">
  <!-- {escaped} -->
  <!-- Real-world scale: UV 0..1 = 1 meter; height is meters. Recipe: {mode}; feature frequency {freq[0]} × {freq[1]} per meter; relief span {relief:g} m. Coated fiber and wood substrate relief stays beneath the separate smooth dielectric coat. -->
  <nodegraph name="NG_{name}">
{g.xml(outputs)}
  </nodegraph>
  <standard_surface name="SR_{name}" type="surfaceshader">{shader}</standard_surface>
  <surfacematerial name="M_{name}" type="material"><input name="surfaceshader" type="surfaceshader" nodename="SR_{name}" /></surfacematerial>
</materialx>
'''
 return xml,mode

def main():
 section=0;records=[]
 for line in (ROOT/'VEHICLE_MATERIAL_CATALOG.md').read_text().splitlines():
  if line.startswith('## ') and line not in ['## Scope and naming','## Specification conventions','## Material index']:section+=1
  m=re.match(r'- `([^`]+)` — (.*)',line)
  if m and 12<=section<=20:
   name,desc=m.groups();xml,recipe=build(name,desc,section);folder=DEST/name;folder.mkdir(parents=True,exist_ok=True);(folder/(name+'.mtlx')).write_text(xml);records.append({'name':name,'section':section,'recipe':recipe,'description':desc})
 (DEST/'tools/interiors-manifest.json').write_text(json.dumps(records,indent=2)+'\n');print(f'Generated {len(records)} interiors materials')
if __name__=='__main__':main()
