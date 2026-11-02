"""Generate bounded educational lunar transfers from NASA/JPL Horizons vectors.
Requires numpy/scipy. Frames: Earth-centred ICRF, km and seconds, TDB.
"""
import json, urllib.request, urllib.parse, datetime, pathlib
import numpy as np
from scipy.interpolate import CubicHermiteSpline
from scipy.integrate import solve_ivp
from scipy.optimize import brentq, least_squares
ROOT=pathlib.Path(__file__).resolve().parents[2]
MU=398600.435507; MM=4902.800118; MS=132712440041.279419
R=6378.137+200; RM=1737.4+100
START='2026-11-01'; STOP='2026-12-16'
def fetch(body):
    p=dict(format='json',COMMAND=body,CENTER='500@399',MAKE_EPHEM='YES',EPHEM_TYPE='VECTORS',START_TIME=START,STOP_TIME=STOP,STEP_SIZE='6h',OUT_UNITS='KM-S',REF_PLANE='FRAME',VEC_TABLE='2',CSV_FORMAT='YES',VEC_CORR='NONE',TIME_TYPE='TDB')
    url='https://ssd.jpl.nasa.gov/api/horizons.api?'+urllib.parse.urlencode(p)
    raw=json.load(urllib.request.urlopen(url)); result=raw['result']
    rows=[line.split(',') for line in result.split('$$SOE')[1].split('$$EOE')[0].strip().splitlines()]
    jd=np.array([float(r[0]) for r in rows]); state=np.array([[float(v) for v in r[2:8]] for r in rows]); t=(jd-jd[0])*86400
    return CubicHermiteSpline(t,state[:,:3],state[:,3:]),dict(url=url,signature=raw['signature'],header=result.split('$$SOE')[0])
moon,moonSource=fetch('301');sun,sunSource=fetch('10')
def stump(z):
    if abs(z)<1e-8:return .5,1/6
    if z>0:q=np.sqrt(z);return (1-np.cos(q))/z,(q-np.sin(q))/q**3
    q=np.sqrt(-z);return (np.cosh(q)-1)/(-z),(np.sinh(q)-q)/q**3

def lambert(r1,r2,dt):
    a=np.linalg.norm(r1);b=np.linalg.norm(r2);cos=np.dot(r1,r2)/a/b;A=np.sqrt(a*b*(1+cos))
    def y(z):c,s=stump(z);return a+b+A*(z*s-1)/np.sqrt(c)
    def f(z):c,s=stump(z);v=y(z);return (v/c)**1.5*s+A*np.sqrt(v)-np.sqrt(MU)*dt if v>0 else -np.sqrt(MU)*dt
    z=brentq(f,-1,39);v=y(z);g=A*np.sqrt(v/MU);return (r2-(1-v/a)*r1)/g

def solve(day,days):
    t0=day*86400.;duration=days*86400.;end=t0+duration;m=moon(end);mv=moon(end,1)
    normal=np.cross(m,mv);normal/=np.linalg.norm(normal);e=m/np.linalg.norm(m);q=np.cross(normal,e)
    angle=np.deg2rad(170);r0=R*(-np.cos(np.pi-angle)*e-np.sin(np.pi-angle)*q)
    v0=lambert(r0,m,duration)
    # Target a perilune in the lunar orbit plane; the fourth shooting variable
    # moves the encounter point until the radial arrival velocity is zero.
    def rhs(t,y):
        r=y[:3];a=-MU*r/np.linalg.norm(r)**3
        for mu,pos in [(MM,moon(t)),(MS,sun(t))]:
            d=pos-r;a+=mu*(d/np.linalg.norm(d)**3-pos/np.linalg.norm(pos)**3)
        return np.r_[y[3:],a]
    def integrate(v,dense=False):return solve_ivp(rhs,(t0,end),np.r_[r0,v],rtol=2e-9,atol=2e-8,dense_output=dense,max_step=2400)
    def residual(x):
        result=integrate(x[:3]);y=result.y[:,-1];target=RM*(np.cos(x[3])*e+np.sin(x[3])*q)
        return np.r_[(y[:3]-m-target)/1000,np.dot(y[3:]-mv,target/RM)*100]
    fit=least_squares(residual,np.r_[v0,np.pi/2],diff_step=1e-8,max_nfev=220,xtol=1e-9,ftol=1e-9,gtol=1e-9)
    if np.linalg.norm(residual(fit.x))>.05:
        print("residual", residual(fit.x), "fit",fit.x,flush=True);return None
    flight=integrate(fit.x[:3],True);times=np.linspace(t0,end,241);states=flight.sol(times).T;relative=states[:,:3]-moon(times)
    # Reject surface intersections, including between the displayed samples.
    check=flight.sol(np.linspace(t0,end,2401)).T
    if np.min(np.linalg.norm(check[:,:3],axis=1))<6378 or np.min(np.linalg.norm(check[:,:3]-moon(np.linspace(t0,end,2401)),axis=1))<1737.4:return None
    h=np.cross(r0,fit.x[:3]);circular=np.cross(h/np.linalg.norm(h),r0/R)*np.sqrt(MU/R)
    tli=np.linalg.norm(fit.x[:3]-circular)*1000
    arrival=states[-1,3:]-mv;rad=relative[-1]/np.linalg.norm(relative[-1]);tangent=arrival-np.dot(arrival,rad)*rad;tangent/=np.linalg.norm(tangent)
    loi=np.linalg.norm(arrival-tangent*np.sqrt(MM/RM))*1000
    return dict(days=days,tliMS=round(tli,3),loiMS=round(loi,3),arrivalSpeedKmS=float(np.linalg.norm(arrival)),errorKm=float(np.linalg.norm(states[-1,:3]-m-RM*(np.cos(fit.x[3])*e+np.sin(fit.x[3])*q))),path=np.round(states[:,:3],4).tolist(),moonPath=np.round(moon(times),4).tolist(),sunDirection=(sun(t0)/np.linalg.norm(sun(t0))).tolist())
records=[]
for day in range(7):
    date=(datetime.date.fromisoformat(START)+datetime.timedelta(days=day)).isoformat();routes={}
    for id,days in [('fast',2.5),('balanced',3.25),('efficient',4.5)]:
        value=solve(day,days);print(date,id,'ok' if value else 'no solution',flush=True)
        if value:routes[id]=value
    records.append(dict(date=date,routes=routes))
output=dict(model='earth-moon-sun-shooting-v1',timeScale='TDB',frame='Earth-centred ICRF',units='km, s',generatedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),sources=[moonSource,sunSource],records=records)
(ROOT/'src/game/story/moon/transferData.json').write_text(json.dumps(output,separators=(',',':')))
