import { useEffect, useState } from 'react';
import type { PreparationSelection } from '@/game/moon/core/design';
import { useLoadingStore } from '@exo/ui';

/** Static cargo artwork is rendered from the selected 3D assembly under loading. */
export function useCargoRoverImage(preparation:PreparationSelection,enabled:boolean){
  const [image,setImage]=useState<string|null>(null);
  useEffect(()=>{
    if(!enabled)return;
    let cancelled=false;
    const loading=useLoadingStore.getState();
    if(!loading.isLoading)void loading.startLoading('custom','Preparing your rover cargo…');
    const task=Promise.all([import('three'),import('@/game/moon/workshop/lander/workshopMeshes')]).then(([THREE,meshes])=>{
      if(cancelled)return;
      const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true,powerPreference:'low-power'});
      const scene=new THREE.Scene(),rover=meshes.buildRoverAssembly(preparation);
      try{
        renderer.setSize(420,340);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
        scene.add(rover,new THREE.HemisphereLight(0xe7eaff,0x302337,2.3));
        const light=new THREE.DirectionalLight(0xfff0da,4);light.position.set(4,6,-5);scene.add(light);
        const box=new THREE.Box3().setFromObject(rover),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3()).length();
        const camera=new THREE.PerspectiveCamera(34,420/340,.1,100);camera.position.copy(center).add(new THREE.Vector3(size*.65,size*.42,-size*.95));camera.lookAt(center);
        renderer.render(scene,camera);if(!cancelled)setImage(renderer.domElement.toDataURL('image/png'));
      }finally{meshes.disposeGroup(scene);renderer.dispose();renderer.forceContextLoss();}
    }).catch(()=>{});
    loading.registerLoaderTask(task);
    return()=>{cancelled=true;};
  },[preparation,enabled]);
  return image;
}
