// ============================================================================
// WATER FRAGMENT SHADER (src/shaders/water.frag)
// Requirement 5: Animated colour driven by uniforms and interpolated varyings.
// ============================================================================

uniform float uTime;
uniform float uWaveAmplitude;
uniform vec3 uDeepColor;
uniform vec3 uSurfaceColor;
uniform vec3 uFoamColor;

varying float vElevation;
varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
  // Normalize wave elevation from [-uWaveAmplitude, +uWaveAmplitude] into [0.0, 1.0]
  float safeAmp = max(uWaveAmplitude, 0.001);
  float heightFactor = clamp((vElevation + safeAmp) / (2.0 * safeAmp), 0.0, 1.0);

  // Smoothly blend between deep ocean trough colour and turquoise crest colour
  vec3 waterColor = mix(uDeepColor, uSurfaceColor, smoothstep(0.15, 0.85, heightFactor));

  // Animated shoreline ring & wave-crest foam shimmer using uTime
  float distFromIsland = length(vWorldPosition.xz);
  float shoreWave = sin(distFromIsland * 3.5 - uTime * 2.8) * 0.5 + 0.5;
  float shoreFoamMask = smoothstep(7.8, 5.2, distFromIsland) * smoothstep(3.2, 5.0, distFromIsland) * shoreWave;

  // Crest highlight on the highest peaks plus subtle time-based caustic pulse
  float crestSimmer = 0.5 + 0.5 * sin(vWorldPosition.x * 1.8 + vWorldPosition.z * 1.8 + uTime * 3.0);
  float crestFoamMask = smoothstep(0.68, 0.96, heightFactor) * (0.65 + 0.35 * crestSimmer);

  float totalFoam = clamp(shoreFoamMask * 0.65 + crestFoamMask * 0.55, 0.0, 1.0);
  vec3 finalColor = mix(waterColor, uFoamColor, totalFoam);

  // Subtle distance fade at the outer edge of the water disc so it blends into the horizon
  float edgeFade = 1.0 - smoothstep(34.0, 44.0, distFromIsland);
  finalColor = mix(uDeepColor * 0.65, finalColor, edgeFade);

  gl_FragColor = vec4(finalColor, 0.94);

  // Convert linear shader colour output to display colorSpace and apply Three.js tone mapping
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
