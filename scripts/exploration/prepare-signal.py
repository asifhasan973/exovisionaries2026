"""Reproduce the bounded LCRNS 3.1 lesson from NASA inputs.

Run with numpy, scipy, numba and spiceypy. Raw sources stay in /tmp.
The exported trajectory is a calculation, not an operational ephemeris.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import hashlib, json, math, subprocess, zipfile, xml.etree.ElementTree as ET
from datetime import datetime, timezone
import numpy as np
from scipy.integrate import solve_ivp
from scipy.special import lpmn
from numba import njit
import spiceypy as spice

ROOT = Path(__file__).resolve().parents[2]
CACHE = Path('/tmp/ztb-lcrns'); CACHE.mkdir(exist_ok=True)
OUT = ROOT / 'apps/web/public/exploration/signal'; OUT.mkdir(parents=True, exist_ok=True)
NAIF = 'https://naif.jpl.nasa.gov/pub/naif/generic_kernels/'
PDS = 'https://pds-geosciences.wustl.edu/grail/grail-l-lgrs-5-rdr-v1/grail_1001/shadr/'
PAPER = 'https://ntrs.nasa.gov/api/citations/20250002698/downloads/LCRNS_Reference_Constellation_White_Paper_03_2025.docx'
SOURCES = [
 ('paper', PAPER), ('gravity-label', PDS+'gggrx_0900c_sha.lbl'),
 ('gravity', PDS+'gggrx_0900c_sha.tab'),
 ('ephemeris', NAIF+'spk/planets/a_old_versions/de421.bsp'),
 ('orientation', NAIF+'pck/moon_pa_de421_1900-2050.bpc'),
 ('frames', NAIF+'fk/satellites/moon_080317.tf'),
 ('leapseconds', NAIF+'lsk/naif0012.tls'),
 ('masses', NAIF+'pck/gm_de431.tpc'),
 ('radii', NAIF+'pck/pck00011.tpc'),
 ('moon-color', 'https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_poles_2k.tif'),
]

def fetch(item):
    key, url = item
    path = CACHE/url.rsplit('/', 1)[-1]
    if not path.exists():
        print('Downloading', key, flush=True)
        temp = path.with_suffix(path.suffix+'.part')
        subprocess.run(['curl','--fail','--location','--silent','--show-error','--retry','2',url,'-o',str(temp)],check=True)
        temp.replace(path)
    return key, path

files = dict(ThreadPoolExecutor(max_workers=6).map(fetch, SOURCES))
for key in ['leapseconds','ephemeris','orientation','frames','masses','radii']:
    spice.furnsh(str(files[key]))
EPOCH = '2027-03-01T00:00:00'
ET0 = spice.str2et(EPOCH)
DURATION = 72*3600
STEP = 30
RADIUS = 1737.4
N = 25

# Table 2 is Cartesian km and km/s in Moon-centered ICRF.
initial = np.array([
 [-198.931445,386.023132,3458.355412,-1.539867,.022243,-.091059],
 [1089.980598,-2260.918271,-18984.562823,.280301,-.004049,.016575],
 [9187.665852,-260.470721,-8543.222759,.273629,.417588,-.313828],
 [6484.019002,14329.883921,-7966.345594,-.258433,.033951,.235264],
 [-5074.242314,14473.022751,-8638.530033,-.229931,-.026926,-.264381],
])
doc = ET.fromstring(zipfile.ZipFile(files['paper']).read('word/document.xml'))
words = [n.text for n in doc.iter() if n.tag.endswith('}t') and n.text]
for value in initial.flat:
    assert any(w.strip() == f'{value:.6f}' for w in words), f'Source state differs: {value}'
assert 'March 01, 2027' in ''.join(words)

rows = files['gravity'].read_text().splitlines()
header = [float(s) for s in rows[0].split(',') if s.strip()]
REF_R, MU = header[:2]
assert abs(REF_R-1738)<1e-8 and abs(MU-4902.79996708864)<1e-8
C = np.zeros((N+1,N+1)); S = C.copy(); C[0,0] = 1
for row in rows[2:]:
    parts = row.split(','); n,m = int(parts[0]),int(parts[1])
    if n>N: break
    factor = math.sqrt((2*n+1)*(1 if m==0 else 2)*math.factorial(n-m)/math.factorial(n+m))
    C[n,m],S[n,m] = float(parts[2])*factor,float(parts[3])*factor

@njit
def gravity(p):
    """Gradient of positive spherical-harmonic potential, no Condon–Shortley phase."""
    x,y,z=p; r=np.sqrt(x*x+y*y+z*z); u=z/r; c=np.sqrt(max(1e-24,1-u*u)); lon=np.arctan2(y,x)
    P=np.zeros((N+1,N+1)); P[0,0]=1
    for m in range(1,N+1): P[m,m]=(2*m-1)*c*P[m-1,m-1]
    for m in range(N): P[m+1,m]=(2*m+1)*u*P[m,m]
    for m in range(N+1):
        for n in range(m+2,N+1): P[n,m]=((2*n-1)*u*P[n-1,m]-(n+m-1)*P[n-2,m])/(n-m)
    ar=1.; ap=0.; al=0.
    for n in range(2,N+1):
        rn=(REF_R/r)**n
        for m in range(n+1):
            co=np.cos(m*lon); si=np.sin(m*lon); h=C[n,m]*co+S[n,m]*si
            dp=((n+m)*P[n-1,m]-n*u*P[n,m])/c if m<n else -n*u/c*P[n,m]
            ar+=(n+1)*rn*P[n,m]*h; ap+=rn*dp*h
            al+=rn*P[n,m]*m*(-C[n,m]*si+S[n,m]*co)/c
    k=MU/r**2; ar*=-k; ap*=k; al*=k
    return np.array([ar*c*np.cos(lon)-ap*u*np.cos(lon)-al*np.sin(lon),ar*c*np.sin(lon)-ap*u*np.sin(lon)+al*np.cos(lon),ar*u+ap*c])

def potential(p):
    # Independent scipy Legendre evaluation for gradient verification.
    r=np.linalg.norm(p); u=p[2]/r; lon=np.arctan2(p[1],p[0]); P=lpmn(N,N,u)[0]
    v=1.
    for n in range(2,N+1):
        for m in range(n+1): v+=(REF_R/r)**n*P[m,n]*(-1)**m*(C[n,m]*np.cos(m*lon)+S[n,m]*np.sin(m*lon))
    return MU/r*v

gravity_error=0.
for p in initial[:,:3]:
    h=.01; numeric=np.array([(potential(p+np.eye(3)[i]*h)-potential(p-np.eye(3)[i]*h))/(2*h) for i in range(3)])
    gravity_error=max(gravity_error,float(np.linalg.norm(numeric-gravity(p))))
assert gravity_error<1e-10, gravity_error

targets=['SUN','VENUS','EARTH','MARS BARYCENTER','JUPITER BARYCENTER','SATURN BARYCENTER']
gms=np.array([spice.bodvrd(t,'GM',1)[1][0] for t in targets])
AU=spice.convrt(1.,'AU','KM'); LIGHT=spice.clight()

def force(t,flat):
    y=flat.reshape(5,6); result=np.zeros_like(y); result[:,:3]=y[:,3:]
    et=ET0+t; rot=spice.pxform('J2000','MOON_PA_DE421',et)
    bodies=[spice.spkpos(name,et,'J2000','NONE','MOON')[0] for name in targets]
    for i in range(5):
        r=y[i,:3]; a=rot.T@gravity(rot@r)
        for body,gm in zip(bodies,gms):
            d=body-r; a+=gm*(d/np.linalg.norm(d)**3-body/np.linalg.norm(body)**3)
        # Spherical SRP. Binary lunar umbra (finite Sun penumbra is not included).
        sun=bodies[0]; away=r-sun; length=np.linalg.norm(away)
        toward=sun-r; k=np.clip(-np.dot(r,toward)/np.dot(toward,toward),0,1)
        shadow=np.linalg.norm(r+k*toward)<RADIUS
        if not shadow: a+=1367/(LIGHT*1000)*1.8/850*(AU/length)**2/1000*away/length
        result[i,3:]=a
    return result.ravel()

print('Propagating five reference relays, DOP853…',flush=True)
fine=solve_ivp(force,[0,DURATION],initial.ravel(),method='DOP853',rtol=2e-12,atol=1e-12,max_step=180,dense_output=True)
assert fine.success
print('Cross-checking with independently stepped RK45…',flush=True)
check=solve_ivp(force,[0,DURATION],initial.ravel(),method='RK45',rtol=3e-11,atol=2e-12,max_step=120,dense_output=True)
assert check.success
times=np.arange(0,DURATION+STEP,STEP,dtype=float)
states=fine.sol(times).T.reshape(-1,5,6)
probe=np.arange(0,DURATION+1,631.)
agreement=float(np.max(np.linalg.norm((fine.sol(probe)-check.sol(probe)).T.reshape(-1,5,6)[:,:,:3],axis=2)))
assert agreement<1., agreement

# Export positions in Moon mean-Earth body-fixed coordinates, with true velocities
# for cubic Hermite interpolation. The gravity field remains principal-axis based.
output=[]
for t,state in zip(times,states):
    et=ET0+t; transform=spice.sxform('J2000','MOON_ME_DE421',et)
    relay=(transform@state.T).T
    earth=transform@spice.spkezr('EARTH',et,'J2000','NONE','MOON')[0]
    sun=transform@spice.spkezr('SUN',et,'J2000','NONE','MOON')[0]
    output.append(np.concatenate([relay.ravel(),earth,sun]))
output=np.array(output)

# Independent SPICE/dense-integrator geometric checks for the browser model.
from scipy.optimize import brentq
sites=[('shackleton',-89.5,0),('cabeus',-85.3,318.5),('malapert',-85.99,2.83),('far',-85,180),('near',0,0)]
reference={'samples':[],'events':{}}
def margins(t,lat,lon):
    et=ET0+t; rot=spice.pxform('J2000','MOON_ME_DE421',et)
    sat=rot@fine.sol(t).reshape(5,6)[1,:3]
    earth=rot@spice.spkpos('EARTH',et,'J2000','NONE','MOON')[0]
    s=RADIUS*np.array([np.cos(lat)*np.cos(lon),np.cos(lat)*np.sin(lon),np.sin(lat)])
    direction=earth-sat; k=np.clip(-np.dot(sat,direction)/np.dot(direction,direction),0,1)
    return np.dot(s,earth-s)/np.linalg.norm(s)/np.linalg.norm(earth-s),np.dot(s,sat-s)/np.linalg.norm(s)/np.linalg.norm(sat-s),np.linalg.norm(sat+k*direction)-RADIUS
for name,lat,lon in sites:
    la,lo=np.radians([lat,lon]); events=[]
    for t in [0.,1234.567,43200.,129601.23,259200.]:
        direct,up,down=margins(t,la,lo)
        reference['samples'].append({'site':name,'time':t,'direct':bool(direct>0),'up':bool(up>0),'down':bool(down>0)})
    prev=margins(0,la,lo)
    for t in np.arange(30.,DURATION+1,30.):
        now=margins(t,la,lo)
        for k in range(3):
            if (now[k]>0)!=(prev[k]>0):
                root=brentq(lambda tt:margins(tt,la,lo)[k],t-30,t,xtol=1e-5)
                before=margins(max(0,root-.1),la,lo); after=margins(min(DURATION,root+.1),la,lo)
                if k==0 or ((before[1]>0 and before[2]>0)!=(after[1]>0 and after[2]>0)):events.append(float(root))
        prev=now
    reference['events'][name]=sorted(set(events))
(OUT/'reference-checks.json').write_text(json.dumps(reference,indent=2)+'\n')

def hermite(a,b,f):
    return (2*f**3-3*f**2+1)*a[...,:3]+(f**3-2*f**2+f)*STEP*a[...,3:]+(-2*f**3+3*f**2)*b[...,:3]+(f**3-f**2)*STEP*b[...,3:]

interp_error=0.
for index in range(0,len(times)-1,13):
    t=times[index]+STEP*.37; et=ET0+t
    truth=(spice.sxform('J2000','MOON_ME_DE421',et)@fine.sol(t).reshape(5,6).T).T
    estimate=hermite(output[index,:30].reshape(5,6),output[index+1,:30].reshape(5,6),.37)
    interp_error=max(interp_error,float(np.max(np.linalg.norm(estimate-truth[:,:3],axis=1))))
assert interp_error<.1, interp_error

# Float64 positions and velocities, little endian, rows: five relays + Earth + Sun.
output.astype('<f8').tofile(OUT/'states.bin')
from PIL import Image
im=Image.open(files['moon-color']).convert('RGB'); im.thumbnail((2048,1024)); im.save(OUT/'moon.webp',quality=88)

manifest={
 'id':'lcrns-3.1-2027-03-01-v1','title':'LCRNS Reference Constellation 3.1',
 'type':'reference-design','epoch':EPOCH+'Z','duration':DURATION,'step':STEP,'count':len(times),
 'frame':'MOON_ME_DE421','integrationFrame':'Moon-centered J2000 / ICRF','gravityFrame':'MOON_PA_DE421',
 'units':'km, km/s, seconds','layout':'Float64 little endian; rows of 42 numbers: SV1..SV5, Earth, Sun; each x,y,z,vx,vy,vz',
 'radius':RADIUS,'earthRadius':6378.1366,'lightSpeed':LIGHT,'initialStates':initial.tolist(),
 'model':{'gravity':'GRGM900C fully normalized, degree/order 25; reference radius 1738 km','mu':MU,
 'ephemeris':'DE421','thirdBodies':targets,'thirdBodyGMs':gms.tolist(),'gmSource':'gm_de431.tpc; declared mass-constant interpretation, not exact original design environment',
 'srp':'1367 W/m² at 1 AU, Cr 1.8, area 1 m², mass 850 kg; binary spherical lunar eclipse; no penumbra or Earth shadow',
 'disabled':['solid tides','atmospheric drag'],'integrator':'SciPy DOP853, rtol 2e-12, atol 1e-12, max step 180 s'},
 'validation':{'gravityGradientErrorKmS2':gravity_error,'crossIntegratorMaxKm':agreement,'crossCheck':'RK45, rtol 3e-11, atol 2e-12, max step 120 s; matched force model, not independent force implementation','hermiteProbeMaxKm':interp_error,'initialStatesMatchSource':True},
 'limits':['Non-final NASA reference design, not live satellites or operational service.','Numerically propagated study; not an exact recreation of the original mission-design software.','Spherical Moon and zero-degree horizon; no local terrain, antenna, RF or station scheduling.','Instantaneous Earth-center direction and distance/c; no processing or moving-endpoint light-time correction.','GM and shadow interpretations are disclosed; matching numerical integrators does not validate real flight accuracy.'],
 'sources':[{'id':key,'url':url,'sha256':hashlib.sha256(files[key].read_bytes()).hexdigest(),'retrieved':datetime.now(timezone.utc).date().isoformat()} for key,url in SOURCES],
 'credits':'NASA GSFC LCRNS: Grant Ryden and Michael Volle. Moon map: NASA GSFC / Arizona State University, NASA SVS CGI Moon Kit.'
}
manifest['artifacts']={name:hashlib.sha256((OUT/name).read_bytes()).hexdigest() for name in ['states.bin','moon.webp']}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps(manifest['validation'],indent=2),flush=True)
print('Exported',sum(p.stat().st_size for p in OUT.iterdir()),'bytes',flush=True)
