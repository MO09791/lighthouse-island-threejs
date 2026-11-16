// ============================================================================
// DEBUG & DEMO GUI MODULE (src/gui.js)
// Uses lil-gui to let you demonstrate all 7 rubric techniques in under 2 minutes.
// ============================================================================

import * as THREE from 'three';
import GUI from 'lil-gui';

export function setupDemoGUI({ renderer, scene, lights, materials, water, animator }) {
  const gui = new GUI({ title: 'Demo Inspector (7 Techniques)' });

  // 1. Lighting & Shadows Folder
  const lightFolder = gui.addFolder('1. Lighting & Shadows');
  lightFolder.add(lights.sunLight, 'intensity', 0, 5, 0.1).name('Sun Directional');
  lightFolder.add(lights.beaconSpotLight, 'intensity', 0, 35, 0.5).name('Beacon SpotLight');
  lightFolder.add(lights.dockPointLight, 'intensity', 0, 15, 0.5).name('Pier PointLight');
  lightFolder.add(lights.hemisphereLight, 'intensity', 0, 2, 0.05).name('Hemisphere Fill');

  // Optional Shadow Camera Helper toggle (great for answering the Shadow Camera exam question!)
  const shadowCameraHelper = new THREE.CameraHelper(lights.sunLight.shadow.camera);
  shadowCameraHelper.visible = false;
  scene.add(shadowCameraHelper);
  lightFolder.add(shadowCameraHelper, 'visible').name('Show Shadow Frustum');

  // 2. Colour & Tone Mapping Folder
  const colorFolder = gui.addFolder('2. Colour & Tone Mapping');
  colorFolder.add(renderer, 'toneMappingExposure', 0.2, 2.5, 0.05).name('Exposure');
  const toneMapOptions = {
    'ACES Filmic': THREE.ACESFilmicToneMapping,
    'Reinhard': THREE.ReinhardToneMapping,
    'Linear': THREE.LinearToneMapping,
    'None (Clamped >1)': THREE.NoToneMapping,
  };
  colorFolder.add(renderer, 'toneMapping', toneMapOptions).name('Tone Mapping');

  // 3 & 4. Textures & PBR Materials Folder
  const pbrFolder = gui.addFolder('3 & 4. Textures & PBR');
  const normalScaleProxy = { scale: 1.2 };
  pbrFolder
    .add(normalScaleProxy, 'scale', 0.0, 2.5, 0.05)
    .name('Brick Normal Scale')
    .onChange((val) => {
      materials.lighthouseBrickMaterial.normalScale.set(val, val);
    });
  pbrFolder.add(materials.copperDomeMaterial, 'roughness', 0.0, 1.0, 0.02).name('Copper Roughness');
  pbrFolder.add(materials.copperDomeMaterial, 'metalness', 0.0, 1.0, 0.02).name('Copper Metalness');
  pbrFolder.add(materials.chromeBuoyMaterial, 'roughness', 0.0, 1.0, 0.02).name('Chrome Buoy Rough');
  pbrFolder.add(scene, 'environmentIntensity', 0.0, 2.0, 0.05).name('PMREM Env Intensity');

  // 5. Custom Water Shader Folder
  const shaderFolder = gui.addFolder('5. Water GLSL Shader');
  shaderFolder.add(water.uniforms.uWaveAmplitude, 'value', 0.02, 0.75, 0.01).name('Wave Amplitude');
  shaderFolder.add(water.uniforms.uWaveFrequency, 'value', 0.1, 1.0, 0.02).name('Wave Frequency');
  shaderFolder.add(water.uniforms.uWaveSpeed, 'value', 0.2, 3.5, 0.05).name('Wave Speed');

  // 6. Animation & Easing Folder
  const animFolder = gui.addFolder('6. Animation & Easing');
  animFolder.add(animator.state, 'beaconRotationSpeed', 0.0, 3.0, 0.05).name('Beacon Speed (rad/s)');
  animFolder
    .add({ toggleMode: () => animator.toggleDayNightMode() }, 'toggleMode')
    .name('Ease Dusk ⇄ Night');

  return gui;
}
