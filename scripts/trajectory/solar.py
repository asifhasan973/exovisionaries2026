import concurrent.futures,json,urllib.request,urllib.parse,pathlib
bodies=[('Mercury','199'),('Venus','299'),('Earth','399'),('Mars','499'),('Jupiter','599'),('Saturn','699'),('Uranus','799'),('Neptune','899')]
def get(body):
 name,id=body;p=dict(format='json',COMMAND=id,CENTER='500@10',EPHEM_TYPE='VECTORS',START_TIME='2026-11-01',STOP_TIME='2026-11-08',STEP_SIZE='1d',OUT_UNITS='KM-S',REF_PLANE='ECLIPTIC',VEC_TABLE='2',CSV_FORMAT='YES',VEC_CORR='NONE',TIME_TYPE='TDB');url='https://ssd.jpl.nasa.gov/api/horizons.api?'+urllib.parse.urlencode(p);raw=json.load(urllib.request.urlopen(url));rows=[l.split(',') for l in raw['result'].split('$$SOE')[1].split('$$EOE')[0].strip().splitlines()];return dict(name=name,positions=[[float(x) for x in r[2:5]] for r in rows[:7]],source=url)
import time
data=[]
for body in bodies:
 for attempt in range(4):
  try:data.append(get(body));print(body[0],flush=True);break
  except Exception:
   if attempt==3:raise
   time.sleep(2)

pathlib.Path('src/game/story/moon/solarData.json').write_text(json.dumps(data,separators=(',',':')))
