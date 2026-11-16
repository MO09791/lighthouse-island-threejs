// ============================================================================
// MAIN APPLICATION ENTRY POINT (src/main.js)
// Initializes Renderer (sRGB output + ACES Filmic Tone Mapping + Shadows),
// Scene, Camera, Modules, Resize Handler, and Render Loop.
// ============================================================================

import * as THREE from 'three';
import { createLights } from './lights.js';
import { createMaterialsAndEnv } from './materials.js';
import { createWaterShaderMesh } from './shader.js';
import { buildLighthouseScene } from './scene.js';
import { createAnimator } from './animation.js';
import { setupInteraction } from './interaction.js';
import { setupDemoGUI } from './gui.js';

const canvas = document.getElementById('webgl-canvas');

// ----------------------------------------------------------------------------
// 1. Scene & Atmospheric Fog
// ----------------------------------------------------------------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color('#162447');
scene.fog = new THREE.FogExp2('#162447', 0.016);

// ----------------------------------------------------------------------------
// 2. Perspective Camera
// ----------------------------------------------------------------------------
const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  150
);
camera.position.set(14.5, 8.2, 16.5);

// ----------------------------------------------------------------------------
// 3. WebGLRenderer (Requirement 1: Shadows & Requirement 2: sRGB + Tone Mapping)
// ----------------------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Requirement 2: Compute lighting in linear space and output in sRGB colorSpace,
// using ACESFilmicToneMapping to compress HDR values > 1.0 smoothly without harsh clipping.
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

// Requirement 1: Enable soft percentage-closer shadow mapping
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// ----------------------------------------------------------------------------
// 4. Assemble Modular Scene Components
// ----------------------------------------------------------------------------
const lights = createLights(scene);
const materials = createMaterialsAndEnv(renderer, scene);
const water = createWaterShaderMesh();
scene.add(water.mesh);

const sceneObjects = buildLighthouseScene(scene, materials);

const animator = createAnimator({
  scene,
  sceneObjects,
  lights,
  water,
});

const { controls } = setupInteraction({
  camera,
  canvas,
  interactiveObjects: sceneObjects.interactiveObjects,
  animator,
});

setupDemoGUI({
  renderer,
  scene,
  lights,
  materials,
  water,
  animator,
});

// ----------------------------------------------------------------------------
// 5. Window Resize Handler (Criterion A4)
// ----------------------------------------------------------------------------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// ----------------------------------------------------------------------------
// 6. Main Frame-Rate Independent Render Loop
// ----------------------------------------------------------------------------
function animate() {
  requestAnimationFrame(animate);
  animator.update();
  controls.update();
  renderer.render(scene, camera);
}

animate();
