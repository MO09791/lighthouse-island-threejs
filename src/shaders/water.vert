// ============================================================================
// WATER VERTEX SHADER (src/shaders/water.vert)
// Requirement 5: Vertex deformation using uniforms, passing data via varyings.
// ============================================================================
// - Attributes (position, uv) are per-vertex inputs from BufferGeometry.
// - Uniforms (uTime, uWaveAmplitude, uWaveFrequency, uWaveSpeed, uRippleBoost)
//   stay constant across all vertices for a single draw call.
// - Varyings (vElevation, vUv, vWorldPosition) are interpolated across the
//   triangle surface and sent to the fragment shader.
// ============================================================================

uniform float uTime;
uniform float uWaveAmplitude;
uniform float uWaveFrequency;
uniform float uWaveSpeed;
uniform float uRippleBoost;

varying float vElevation;
varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
  vUv = uv;

  // Start from the local vertex position (plane lies on X-Z after rotation,
  // or we deform along local Z before rotation / local Y on a horizontal grid).
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);

  // Layer 1: Primary directional swell along X and Z
  float wave1 = sin(modelPosition.x * uWaveFrequency + uTime * uWaveSpeed)
              * cos(modelPosition.z * (uWaveFrequency * 0.8) + uTime * (uWaveSpeed * 0.7));

  // Layer 2: Secondary cross-chop at higher frequency
  float wave2 = sin((modelPosition.x * 1.4 - modelPosition.z * 1.1) * uWaveFrequency + uTime * uWaveSpeed * 1.35) * 0.45;

  // Layer 3: Radial ripple expanding outward from the island center (0, 0)
  float distFromCenter = length(modelPosition.xz);
  float radialRipple = sin(distFromCenter * 2.2 - uTime * (uWaveSpeed * 2.2))
                     * exp(-distFromCenter * 0.06)
                     * (0.25 + uRippleBoost);

  // Total vertical elevation applied to world Y coordinate
  float elevation = (wave1 + wave2) * uWaveAmplitude + radialRipple * uWaveAmplitude;
  modelPosition.y += elevation;

  // Pass interpolated values to the fragment shader
  vElevation = elevation;
  vWorldPosition = modelPosition.xyz;

  vec4 viewPosition = viewMatrix * modelPosition;
  gl_Position = projectionMatrix * viewPosition;
}
