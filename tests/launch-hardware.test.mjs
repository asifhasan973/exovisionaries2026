import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createLaunchHardware } from '../src/game/story/launchHardware.ts';
import { quickPreparation } from '../src/game/story/preparation.ts';
import { disposeGroup } from '../src/game/story/workshopMeshes.ts';

test('folded equipment stays inside the closed fairing for every rover size', () => {
  for (const roverId of ['basic-rover','polar-rover','heavy-rover']) {
    const hardware = createLaunchHardware({ ...quickPreparation(), roverId });
    const box = new THREE.Box3().setFromObject(hardware.payload);
    assert.ok(box.min.y >= 8.09 && box.max.y <= 10.26, 'equipment clears the adapter and nose');
    assert.ok(Math.hypot(Math.max(Math.abs(box.min.x),Math.abs(box.max.x)),Math.max(Math.abs(box.min.z),Math.abs(box.max.z))) < 1.02, 'equipment clears the inner shell');
    assert.equal(hardware.payload.children.length, 15, 'packing retains all installed equipment');
    disposeGroup(hardware.root);
  }
});
test('stage and fairing separation leave the payload on the upper stack', () => {
  const hardware = createLaunchHardware(quickPreparation());
  const before = new THREE.Box3().setFromObject(hardware.payload);
  hardware.booster.position.set(-4,-8,0);
  hardware.halves.forEach((half,i) => { half.position.x = i ? -6 : 6; });
  hardware.root.updateMatrixWorld(true);
  assert.ok(new THREE.Box3().setFromObject(hardware.payload).equals(before));
  assert.equal(hardware.platform.children.length, 1, 'platform detail moves with the launch platform');
  disposeGroup(hardware.root);
});
