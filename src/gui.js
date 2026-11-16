// ============================================================================
// DEBUG & DEMO GUI MODULE (src/gui.js)
// Uses lil-gui to let you demonstrate all 7 rubric techniques in under 2 minutes.
// ============================================================================

import * as THREE from 'three';
import GUI from 'lil-gui';

export function setupDemoGUI({ renderer, scene, lights, materials, water, animator }) {
  const gui = new GUI({ title: 'Demo Inspector (7 Techniques)' });

  // --------------------------------------------------------------------------
  // 1. Lighting & Shadows Folder
  // --------------------------------------------------------------------------
  const lightFolder = gui.addFolder('1. Lighting & Shadows');

  lightFolder
    .add(lights.sunLight, 'intensity', 0, 6, 0.1)
    .name('Sun Directional')
    .listen()
    .onChange((val) => {
      animator.state.isTransitioningDayNight = false;
      animator.palettes.dusk.sunIntensity = val;
    });

  lightFolder
    .add(lights.beaconSpotLight, 'intensity', 0, 40, 0.5)
    .name('Beacon SpotLight')
    .listen();

  lightFolder
    .add(animator.state, 'baseDockIntensity', 0, 20, 0.5)
    .name('Pier PointLight')
    .listen()
    .onChange((val) => {
      lights.dockPointLight.intensity = val;
    });

  lightFolder
    .add(lights.hemisphereLight, 'intensity', 0, 2.5, 0.05)
    .name('Hemisphere Fill')
    .listen()
    .onChange((val) => {
      animator.state.isTransitioningDayNight = false;
      animator.palettes.dusk.hemiIntensity = val;
    });

  // Shadow Camera Helper + Live Frustum & Resolution Controls
  const shadowCameraHelper = new THREE.CameraHelper(lights.sunLight.shadow.camera);
  shadowCameraHelper.visible = false;
  scene.add(shadowCameraHelper);

  lightFolder.add(shadowCameraHelper, 'visible').name('Show Shadow Frustum');

  const shadowParams = {
    frustumSize: 15,
    mapSize: lights.sunLight.shadow.mapSize.width,
  };

  lightFolder
    .add(shadowParams, 'frustumSize', 5, 45, 1)
    .name('Shadow Frustum (±d)')
    .onChange((d) => {
      const cam = lights.sunLight.shadow.camera;
      cam.left = -d;
      cam.right = d;
      cam.top = d;
      cam.bottom = -d;
      cam.updateProjectionMatrix();
      shadowCameraHelper.update();
    });

  lightFolder
    .add(shadowParams, 'mapSize', { '2048 (Sharp)': 2048, '1024 (Medium)': 1024, '512 (Soft)': 512, '256 (Blocky/Demo)': 256 })
    .name('Shadow Map Res')
    .onChange((res) => {
      lights.sunLight.shadow.mapSize.set(Number(res), Number(res));
      if (lights.sunLight.shadow.map) {
        lights.sunLight.shadow.map.dispose();
        lights.sunLight.shadow.map = null;
      }
    });

  // --------------------------------------------------------------------------
  // 2. Colour & Tone Mapping Folder
  // --------------------------------------------------------------------------
  const colorFolder = gui.addFolder('2. Colour & Tone Mapping');
  colorFolder.add(renderer, 'toneMappingExposure', 0.2, 2.5, 0.05).name('Exposure');
  const toneMapOptions = {
    'ACES Filmic': THREE.ACESFilmicToneMapping,
    'Reinhard': THREE.ReinhardToneMapping,
    'Linear': THREE.LinearToneMapping,
    'None (Clamped >1)': THREE.NoToneMapping,
  };
  colorFolder.add(renderer, 'toneMapping', toneMapOptions).name('Tone Mapping');

  // --------------------------------------------------------------------------
  // 3 & 4. Textures & PBR Materials Folder
  // --------------------------------------------------------------------------
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
  pbrFolder
    .add(scene, 'environmentIntensity', 0.0, 2.0, 0.05)
    .name('PMREM Env Intensity')
    .listen()
    .onChange((val) => {
      animator.state.isTransitioningDayNight = false;
      animator.palettes.dusk.envIntensity = val;
    });

  // --------------------------------------------------------------------------
  // 5. Custom Water Shader Folder
  // --------------------------------------------------------------------------
  const shaderFolder = gui.addFolder('5. Water GLSL Shader');
  shaderFolder.add(water.uniforms.uWaveAmplitude, 'value', 0.02, 0.75, 0.01).name('Wave Amplitude');
  shaderFolder.add(water.uniforms.uWaveFrequency, 'value', 0.1, 1.0, 0.02).name('Wave Frequency');
  shaderFolder.add(water.uniforms.uWaveSpeed, 'value', 0.2, 3.5, 0.05).name('Wave Speed');

  // --------------------------------------------------------------------------
  // 6. Animation & Easing Folder
  // --------------------------------------------------------------------------
  const animFolder = gui.addFolder('6. Animation & Easing');
  animFolder.add(animator.state, 'beaconRotationSpeed', 0.0, 3.0, 0.05).name('Beacon Speed (rad/s)');
  animFolder
    .add({ toggleMode: () => animator.toggleDayNightMode() }, 'toggleMode')
    .name('Ease Dusk ⇄ Night');

  return gui;
}
