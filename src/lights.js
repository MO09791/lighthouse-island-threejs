// ============================================================================
// LIGHTING & SHADOWS MODULE (src/lights.js)
// Requirement 1: At least three light types; shadows configured correctly
// (castShadow / receiveShadow, tight shadow frustum, no shadow acne).
// ============================================================================

import * as THREE from 'three';

/**
 * Creates 4 distinct light types and configures shadow maps without shadow acne.
 * @param {THREE.Scene} scene
 */
export function createLights(scene) {
  // --------------------------------------------------------------------------
  // 1. HemisphereLight (Sky + Sea Bounce Fill)
  // Unlike a flat AmbientLight, HemisphereLight shades upward-facing normals
  // with warm sky tones and downward-facing normals with deep sea-bounce tones.
  // --------------------------------------------------------------------------
  const hemisphereLight = new THREE.HemisphereLight('#ffd1a6', '#102a43', 0.65);
  hemisphereLight.position.set(0, 25, 0);
  scene.add(hemisphereLight);

  // --------------------------------------------------------------------------
  // 2. DirectionalLight (Setting Sun / Rising Moon)
  // Uses an OrthographicCamera frustum to project parallel shadow rays.
  // Keeping the frustum tightly fitted around the island (±15 units) maximizes
  // texel density from the 2048x2048 shadow map.
  // --------------------------------------------------------------------------
  const sunLight = new THREE.DirectionalLight('#ff9e5e', 2.4);
  sunLight.position.set(16, 14, 12);
  sunLight.castShadow = true;

  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 2.0;
  sunLight.shadow.camera.far = 48.0;
  const d = 15;
  sunLight.shadow.camera.left = -d;
  sunLight.shadow.camera.right = d;
  sunLight.shadow.camera.top = d;
  sunLight.shadow.camera.bottom = -d;

  // Prevent shadow acne (self-shadowing moiré stripes on sloped surfaces)
  sunLight.shadow.bias = -0.0005;
  sunLight.shadow.normalBias = 0.02;
  scene.add(sunLight);

  // --------------------------------------------------------------------------
  // 3. SpotLight (Rotating Lighthouse Beacon)
  // Sweeps across the island and water, casting dynamic shadows.
  // --------------------------------------------------------------------------
  const beaconSpotLight = new THREE.SpotLight('#fef08a', 18.0, 45, Math.PI / 6, 0.45, 1.3);
  beaconSpotLight.position.set(0, 8.55, 0);
  beaconSpotLight.castShadow = true;
  beaconSpotLight.shadow.mapSize.width = 1024;
  beaconSpotLight.shadow.mapSize.height = 1024;
  beaconSpotLight.shadow.camera.near = 1.0;
  beaconSpotLight.shadow.camera.far = 40.0;
  beaconSpotLight.shadow.bias = -0.0004;
  beaconSpotLight.shadow.normalBias = 0.02;

  const beaconTarget = new THREE.Object3D();
  beaconTarget.position.set(14, 0.5, 0);
  scene.add(beaconTarget);
  beaconSpotLight.target = beaconTarget;
  scene.add(beaconSpotLight);

  // --------------------------------------------------------------------------
  // 4. PointLight (Warm Dock Lantern on the Wooden Pier)
  // Omni-directional warm glow illuminating the pier planks and moored boat.
  // --------------------------------------------------------------------------
  const dockPointLight = new THREE.PointLight('#fb923c', 5.5, 14, 1.6);
  dockPointLight.position.set(4.1, 2.35, 3.8);
  dockPointLight.castShadow = true;
  dockPointLight.shadow.mapSize.width = 512;
  dockPointLight.shadow.mapSize.height = 512;
  dockPointLight.shadow.bias = -0.0006;
  dockPointLight.shadow.normalBias = 0.02;
  scene.add(dockPointLight);

  return {
    hemisphereLight,
    sunLight,
    beaconSpotLight,
    beaconTarget,
    dockPointLight,
  };
}
