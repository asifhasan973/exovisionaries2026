"""Prepare the bounded south-polar reference map from published instrument products.
Requires numpy, Pillow, scipy. Downloads cached outside the repository.
"""
from pathlib import Path
import urllib.request, json, hashlib, math
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
CACHE=Path('/tmp/exovisionaries-exploration');CACHE.mkdir(exist_ok=True)
OUT=ROOT/'apps/web/public/exploration';OUT.mkdir(exist_ok=True)
def fetch(url):
 p=CACHE/url.rsplit('/',1)[-1]
 if not p.exists():
  print('Downloading',url,flush=True);urllib.request.urlretrieve(url,p)
 return p
base='https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/cylindrical/img/'
label=fetch(base+'ldem_16.lbl');demfile=fetch(base+'ldem_16.img')
dem=np.fromfile(demfile,dtype='<i2').reshape(2880,5760)*.5
url='https://luna1.diviner.ucla.edu/~jpierre/diviner/level4_polar/additional_maps/polar_south_80_summer_max-float.tif'
tempfile=fetch(url);image=Image.open(tempfile)
print('Temperature georeferencing', {k:image.tag_v2.get(k) for k in [33550,33922,34736]},flush=True)
temp=np.array(image);tags=dict(image.tag_v2)
# GeoTIFF ties map (0,0) to projected coordinates. Infer scale from explicit tags only.
scale=tags[33550];tie=tags[33922]
print('temperature',temp.shape,'range',np.nanmin(temp),np.nanmax(temp),flush=True)
N=420;extent=310000.;axis=(np.arange(N)+.5)/N*2*extent-extent
x,y=np.meshgrid(axis,-axis)
rho=np.hypot(x,y);lat=-90+np.degrees(2*np.arctan(rho/(2*1737400)))
# South stereographic: x=sin(lon), y=cos(lon).
lon=np.degrees(np.arctan2(x,y))%360
from scipy.ndimage import map_coordinates
z=map_coordinates(dem,[(90-lat)*16-.5,lon*16-.5],order=1,mode='nearest')
# GeoTIFF projection metadata is retained for inspection; coordinates in this product
# use normalized radius units if tie/scale are fractional, otherwise metres.
normalized=abs(scale[0])<.001
xx=x/1737400 if normalized else x;yy=y/1737400 if normalized else y
col=(xx-tie[3])/scale[0]+tie[0]-.5;row=(tie[4]-yy)/scale[1]+tie[1]-.5
valid=(row>=0)&(row<temp.shape[0]-1)&(col>=0)&(col<temp.shape[1]-1)
t=map_coordinates(temp,[row,col],order=0,mode='constant',cval=np.nan)
t=np.where(valid&(t>0)&(t<450),t,np.nan)
# Stereographic map scale increases with latitude distance from pole.
spacing=2*extent/N;gy,gx=np.gradient(z,spacing);factor=1+(rho/(2*1737400))**2
slope=np.degrees(np.arctan(np.hypot(gx,gy)*factor))
manifest={'projection':'South polar stereographic, sphere R=1737400 m, central meridian 0 E; x east, y toward 0 E','extentM':extent,'size':N,'terrainSource':base+'ldem_16.lbl','temperatureSource':url,'terrainProduct':'LDEM_16 V3.1','terrainPeriod':'2009-07-13 to 2016-11-29','terrainResolution':'16 pixels/degree (~1.895 km north–south); interpolated coarse overview','thermalProduct':'polar_south_80_summer_max','thermalPeriod':'2009-07-05 to 2019-02-17; summer maximum bolometric brightness temperature','thermalReference':'https://doi.org/10.1029/2019JE006028','slopeBaselineM':round(spacing*2),'sources':[{'url':base+'ldem_16.img','sha256':hashlib.sha256(demfile.read_bytes()).hexdigest()},{'url':url,'sha256':hashlib.sha256(tempfile.read_bytes()).hexdigest()}],'thermalGeoTiffTags':{str(k):str(v) for k,v in tags.items() if k in [33550,33922,34735,34737,42113]}}
for name,values,lo,hi,colors in [('elevation',z,-7000,3000,[(34,27,60),(155,130,187)]),('temperature',t,40,340,[(34,46,110),(247,164,90)]),('slope',slope,0,25,[(25,72,68),(235,205,134)])]:
 f=np.clip((values-lo)/(hi-lo),0,1);a,b=np.array(colors);rgb=np.nan_to_num(a+(b-a)*f[...,None],nan=18).astype('uint8');Image.fromarray(rgb).save(OUT/(name+'.webp'),quality=85)
# Numeric grid compressed by rounding; NaN is null, never zero.
def clean(a,d):return [[None if not math.isfinite(float(v)) else round(float(v),d) for v in row] for row in a]
presets={}
for id,plat,plon in [('shackleton',-89.5,0),('cabeus',-85.3,318.5),('malapert',-85.99,2.83)]:
 pr=2*1737400*math.tan(math.radians(90+plat)/2);px=pr*math.sin(math.radians(plon));py=pr*math.cos(math.radians(plon))
 c=round((px-tie[3])/scale[0]-.5);r=round((tie[4]-py)/scale[1]-.5)
 height=float(map_coordinates(dem,[[(90-plat)*16-.5],[(plon%360)*16-.5]],order=1,mode='nearest')[0])
 iy=int((1-py/extent)*N/2);ix=int((px/extent+1)*N/2)
 tv=float(temp[r,c]);presets[id]={'lat':plat,'lon':plon,'elevation':round(height),'temperature':round(tv,1) if math.isfinite(tv) and tv>0 else None,'slope':round(float(slope[iy,ix]),1),'thermalPixel':[r,c]}
print('Native preset reference checks',presets,flush=True)
(OUT/'atlas.json').write_text(json.dumps({'presets':presets,'metadata':manifest,'elevation':clean(z,0),'temperature':clean(t,1),'slope':clean(slope,1)},separators=(',',':')))
print('Written Atlas',len((OUT/'atlas.json').read_bytes()),'bytes',flush=True)

import subprocess
geometryfile=CACHE/'mooninfo_2026.json'
if not geometryfile.exists():subprocess.run(['curl','--fail','--silent','--show-error','https://svs.gsfc.nasa.gov/vis/a000000/a005500/a005587/mooninfo_2026.json','-o',str(geometryfile)],check=True)
moon=json.loads(geometryfile.read_text());start=next(i for i,v in enumerate(moon) if v['time']=='08 Nov 2026 00:00 UT')
(OUT/'geometry.json').write_text(json.dumps([{'hour':j,'distance':v['distance'],'lon':v['subearth']['lon'],'lat':v['subearth']['lat']} for j,v in enumerate(moon[start:start+25])]))
