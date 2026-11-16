// ============================================================================
// CUSTOM SHADER MODULE (src/shader.js)
// Requirement 5: Custom ShaderMaterial with vertex deformation & animated colour
// ============================================================================

import * as THREE from 'three';
import waterVertexShader from './shaders/water.vert?raw';
import waterFragmentShader from './shaders/water.frag?raw';

/**
 * Creates the animated ocean mesh powered by our custom GLSL ShaderMaterial.
 * @returns {{ mesh: THREE.Mesh, material: THREE.ShaderMaterial, uniforms: Record<string, THREE.IUniform> }}
 */
export function createWaterShaderMesh() {
  const uniforms = {
    uTime: { value: 0.0 },
    // LIVE-DEMO TIP: Change uWaveAmplitude (e.g. 0.28 -> 0.65) or uWaveSpeed (1.4 -> 0.5)
    uWaveAmplitude: { value: 0.28 },
    uWaveFrequency: { value: 0.42 },
    uWaveSpeed: { value: 1.4 },
    uRippleBoost: { value: 0.0 },
    uDeepColor: { value: new THREE.Color('#092540') },
    uSurfaceColor: { value: new THREE.Color('#137a8b') },
    uFoamColor: { value: new THREE.Color('#e0f7fa') },
  };

  const material = new THREE.ShaderMaterial({
    vertexShader: waterVertexShader,
    fragmentShader: waterFragmentShader,
    uniforms,
    transparent: true,
    side: THREE.DoubleSide,
  });

  // High subdivision (160x160 segments) so the vertex shader has plenty of
  // vertices to displace smoothly without jagged faceted edges.
  const geometry = new THREE.PlaneGeometry(90, 90, 160, 160);
  geometry.rotateX(-Math.PI / 2);

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = 0.0;
  mesh.name = 'OceanWater';

  return { mesh, material, uniforms };
}
