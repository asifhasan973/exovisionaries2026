import * as THREE from 'three';
import { createPartMeshByType } from '../scene/RocketMeshes';
import { PARTS } from '../data/parts';

const cache = new Map<string,string>();

/** One small WebGL context renders every shelf thumbnail, then releases it. */
export async function renderPartThumbnails(ids:string[],onReady:(id:string,url:string)=>void,isCancelled:()=>boolean){
 for(const id of ids){const cached=cache.get(id);if(cached)onReady(id,cached);}
 const missing=ids.filter(id=>!cache.has(id)&&PARTS[id]);
 if(!missing.length)return;
 let renderer:THREE.WebGLRenderer;
 try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:'low-power'});}catch{return;}
 renderer.setPixelRatio(1.25);renderer.setSize(120,120);renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.7;
 const scene=new THREE.Scene();scene.add(new THREE.HemisphereLight(0xffffff,0x7e89a0,2.5));
 const key=new THREE.DirectionalLight(0xfff3df,4);key.position.set(-4,8,10);scene.add(key);
 const rim=new THREE.DirectionalLight(0x91b9ed,3);rim.position.set(7,3,-6);scene.add(rim);
 const camera=new THREE.OrthographicCamera(-4,4,4,-4,.1,200);
 try{
  for(const id of missing){
   if(isCancelled())break;
   const model=createPartMeshByType(PARTS[id].meshType);scene.add(model);
   const bounds=new THREE.Box3().setFromObject(model);const size=bounds.getSize(new THREE.Vector3());const center=bounds.getCenter(new THREE.Vector3());
   model.position.sub(center);model.rotation.y=-Math.PI/7;
   const extent=Math.max(size.x,size.y,size.z,1);
   const half=extent*.7;camera.left=-half;camera.right=half;camera.top=half;camera.bottom=-half;camera.position.set(extent*.9,extent*.55,extent*1.4);camera.lookAt(0,0,0);camera.updateProjectionMatrix();
   renderer.render(scene,camera);const url=renderer.domElement.toDataURL('image/png');cache.set(id,url);if(!isCancelled())onReady(id,url);
   scene.remove(model);model.traverse(obj=>{if(obj instanceof THREE.Mesh)obj.geometry.dispose();});
   await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
  }
 }finally{renderer.dispose();renderer.forceContextLoss();}
}
