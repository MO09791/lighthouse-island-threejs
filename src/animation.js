// ============================================================================
// ANIMATION MODULE (src/animation.js)
// Requirement 6: Frame-rate independent (delta time), with easing, and no jumps
// when the browser tab loses and regains focus.
// ============================================================================

import * as THREE from 'three';

/**
 * Cubic Ease-In-Out function: smooth acceleration in the first half,
 * smooth deceleration in the second half.
 * Formula: t < 0.5 ? 4*t^3 : 1 - (-2*t + 2)^3 / 2
 * @param {number} t Normalized progress in [0, 1]
 * @returns {number} Eased value in [0, 1]
 */
export function easeInOutCubic(t) {
  return t < 0.5
    ? 4.0 * t * t * t
    : 1.0 - Math.pow(-2.0 * t + 2.0, 3) / 2.0;
}

/**
 * Cubic Ease-Out function: fast initial response that smoothly settles.
 * Formula: 1 - (1 - t)^3
 * @param {number} t Normalized progress in [0, 1]
 * @returns {number} Eased value in [0, 1]
 */
export function easeOutCubic(t) {
  return 1.0 - Math.pow(1.0 - t, 3);
}

/**
 * Creates the animation controller that updates the lighthouse beacon,
 * ocean shader uniforms, floating buoys/boat, and eased interactive transitions.
 */
export function createAnimator({ scene, sceneObjects, lights, water }) {
  const clock = new THREE.Clock();
  let elapsedTime = 0;

  // Store the baseline intensities configured in src/lights.js so editing
  // src/lights.js or dragging GUI sliders always takes effect immediately!
  const state = {
    beaconRotationSpeed: 0.85, // radians per second
    beaconAngle: 0.0,
    isNightTarget: false,
    nightTransitionProgress: 0.0, // 0 = Golden Dusk, 1 = Starry Night (eased)
    isTransitioningDayNight: false,
    lanternBoost: false,
    lanternFlickerEnabled: true,
    baseDockIntensity: lights.dockPointLight.intensity,
  };

  // Capture initial Dusk settings directly from src/lights.js
  const palettes = {
    dusk: {
      bg: scene.background.clone(),
      sunColor: lights.sunLight.color.clone(),
      sunIntensity: lights.sunLight.intensity,
      hemiIntensity: lights.hemisphereLight.intensity,
      envIntensity: 0.85,
      deepWater: water.uniforms.uDeepColor.value.clone(),
      surfaceWater: water.uniforms.uSurfaceColor.value.clone(),
    },
    night: {
      bg: new THREE.Color('#050814'),
      sunColor: new THREE.Color('#60a5fa'),
      sunIntensity: 0.35,
      hemiIntensity: 0.18,
      envIntensity: 0.22,
      deepWater: new THREE.Color('#030d1a'),
      surfaceWater: new THREE.Color('#0b4f6c'),
    },
  };

  // --------------------------------------------------------------------------
  // Tab-Focus Jump Prevention (Requirement 6)
  // When the user switches tabs, requestAnimationFrame pauses while wall-clock
  // time keeps advancing. Stopping/restarting the clock on visibilitychange AND
  // clamping delta to <= 0.1s guarantees zero sudden jumps when returning.
  // --------------------------------------------------------------------------
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clock.stop();
    } else {
      clock.start();
      clock.getDelta(); // Reset internal oldTime to now
    }
  });

  /**
   * Triggers an eased bounce animation on a clicked buoy or boat,
   * plus a temporary ripple boost on the ocean shader.
   */
  function triggerObjectBounce(targetGroup) {
    targetGroup.userData.bounceProgress = 0.0;
    water.uniforms.uRippleBoost.value = 0.85;
  }

  /**
   * Toggles the eased transition between Golden Dusk and Starry Night.
   */
  function toggleDayNightMode() {
    state.isNightTarget = !state.isNightTarget;
    state.isTransitioningDayNight = true;
  }

  /**
   * Toggles the dock PointLight lantern boost when clicked in the 3D scene.
   */
  function toggleLanternBoost() {
    state.lanternBoost = !state.lanternBoost;
    state.baseDockIntensity = state.lanternBoost ? 12.0 : 5.5;
    lights.dockPointLight.intensity = state.baseDockIntensity;
  }

  /**
   * Per-frame update using frame-rate independent delta time.
   */
  function update() {
    // Clamp raw delta to max 0.1s (100ms) so lag spikes or window drags never cause jumps
    const rawDelta = clock.getDelta();
    const dt = Math.min(rawDelta, 0.1);
    elapsedTime += dt;

    // 1. Update Ocean Shader time & smoothly decay interactive ripple boost
    water.uniforms.uTime.value = elapsedTime;
    water.uniforms.uRippleBoost.value = THREE.MathUtils.lerp(
      water.uniforms.uRippleBoost.value,
      0.0,
      1.0 - Math.exp(-2.5 * dt)
    );

    // 2. Rotate the Lighthouse SpotLight target & volumetric light cone (delta-time driven)
    state.beaconAngle += state.beaconRotationSpeed * dt;
    const targetRadius = 16.0;
    lights.beaconTarget.position.x = Math.cos(state.beaconAngle) * targetRadius;
    lights.beaconTarget.position.z = Math.sin(state.beaconAngle) * targetRadius;
    sceneObjects.beamPivot.rotation.y = -state.beaconAngle + Math.PI / 2;

    // Keep volumetric beam cone opacity & lantern glass glow proportional to SpotLight intensity
    const beaconRatio = THREE.MathUtils.clamp(lights.beaconSpotLight.intensity / 18.0, 0.0, 2.0);
    sceneObjects.beamConeMat.opacity = 0.13 * beaconRatio;
    sceneObjects.lanternGlassMat.emissiveIntensity = 0.9 * beaconRatio;

    // 3. Eased Dusk <-> Night Atmosphere Transition (using easeInOutCubic)
    // Only overrides light intensities while actively transitioning, so manual GUI
    // slider edits and src/lights.js changes are never overwritten!
    if (state.isTransitioningDayNight) {
      const transitionSpeed = 0.75; // full transition in ~1.33 seconds
      if (state.isNightTarget && state.nightTransitionProgress < 1.0) {
        state.nightTransitionProgress = Math.min(
          1.0,
          state.nightTransitionProgress + dt * transitionSpeed
        );
      } else if (!state.isNightTarget && state.nightTransitionProgress > 0.0) {
        state.nightTransitionProgress = Math.max(
          0.0,
          state.nightTransitionProgress - dt * transitionSpeed
        );
      } else {
        state.isTransitioningDayNight = false;
      }

      const easedNight = easeInOutCubic(state.nightTransitionProgress);
      scene.background.lerpColors(palettes.dusk.bg, palettes.night.bg, easedNight);
      scene.fog.color.copy(scene.background);
      lights.sunLight.color.lerpColors(palettes.dusk.sunColor, palettes.night.sunColor, easedNight);
      lights.sunLight.intensity = THREE.MathUtils.lerp(
        palettes.dusk.sunIntensity,
        palettes.night.sunIntensity,
        easedNight
      );
      lights.hemisphereLight.intensity = THREE.MathUtils.lerp(
        palettes.dusk.hemiIntensity,
        palettes.night.hemiIntensity,
        easedNight
      );
      scene.environmentIntensity = THREE.MathUtils.lerp(
        palettes.dusk.envIntensity,
        palettes.night.envIntensity,
        easedNight
      );
      water.uniforms.uDeepColor.value.lerpColors(
        palettes.dusk.deepWater,
        palettes.night.deepWater,
        easedNight
      );
      water.uniforms.uSurfaceColor.value.lerpColors(
        palettes.dusk.surfaceWater,
        palettes.night.surfaceWater,
        easedNight
      );
    }

    // 4. Dock Lantern warm flicker around state.baseDockIntensity
    if (state.lanternFlickerEnabled && state.baseDockIntensity > 0.01) {
      const flicker = Math.sin(elapsedTime * 7.0) * 0.25 + Math.cos(elapsedTime * 13.0) * 0.15;
      lights.dockPointLight.intensity = Math.max(0.0, state.baseDockIntensity + flicker);
    } else {
      lights.dockPointLight.intensity = state.baseDockIntensity;
    }

    // Keep dock lantern bulb emissive glow synced with PointLight intensity
    const bulbMat = sceneObjects.lanternPostGroup.userData.bulbMat;
    if (bulbMat) {
      bulbMat.emissiveIntensity = THREE.MathUtils.clamp(
        lights.dockPointLight.intensity * 0.4,
        0.0,
        4.0
      );
    }

    // 5. Animate the 3 PBR Buoys (gentle wave bobbing + eased jump when clicked)
    for (const buoy of sceneObjects.buoys) {
      const phase = buoy.userData.phaseOffset;
      const waveBob = Math.sin(elapsedTime * 1.8 + phase) * 0.14;

      let easedJumpOffset = 0.0;
      if (buoy.userData.bounceProgress < 1.0) {
        buoy.userData.bounceProgress = Math.min(1.0, buoy.userData.bounceProgress + dt * 1.25);
        const t = buoy.userData.bounceProgress;
        // Eased arc using easeOutCubic envelope multiplied by a damped sine wave
        const envelope = 1.0 - easeOutCubic(t);
        easedJumpOffset = Math.sin(t * Math.PI * 3.0) * 1.35 * envelope;
        buoy.rotation.y += dt * 4.5 * envelope;
      }

      buoy.position.y = buoy.userData.baseY + waveBob + easedJumpOffset;
      buoy.rotation.z = Math.sin(elapsedTime * 1.5 + phase) * 0.09;
      buoy.rotation.x = Math.cos(elapsedTime * 1.2 + phase) * 0.07;
    }

    // 6. Animate Moored Sailboat (gentle pitch/roll + eased surge when clicked)
    const boat = sceneObjects.boatGroup;
    let boatSurge = 0.0;
    if (boat.userData.bounceProgress < 1.0) {
      boat.userData.bounceProgress = Math.min(1.0, boat.userData.bounceProgress + dt * 1.1);
      const t = boat.userData.bounceProgress;
      const envelope = 1.0 - easeOutCubic(t);
      boatSurge = Math.sin(t * Math.PI * 2.0) * 0.85 * envelope;
    }
    boat.position.y = boat.userData.baseY + Math.sin(elapsedTime * 1.6) * 0.1 + boatSurge * 0.5;
    boat.rotation.z = Math.sin(elapsedTime * 1.4) * 0.06 + boatSurge * 0.18;
    boat.rotation.x = Math.cos(elapsedTime * 1.1) * 0.05;
  }

  return {
    state,
    palettes,
    update,
    triggerObjectBounce,
    toggleDayNightMode,
    toggleLanternBoost,
  };
}
