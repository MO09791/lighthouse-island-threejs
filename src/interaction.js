// ============================================================================
// INTERACTION & CAMERA CONTROLS MODULE (src/interaction.js)
// Requirement 7: Raycaster picking (hover and click) with visible feedback,
// plus OrbitControls camera controls.
// ============================================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Walks up the parent hierarchy from a hit child Mesh to find the root
 * interactive Group registered in interactiveObjects.
 */
function findInteractiveRoot(object) {
  let current = object;
  while (current) {
    if (current.userData && current.userData.interactive) {
      return current;
    }
    current = current.parent;
  }
  return null;
}

/**
 * Applies or removes a subtle emissive highlight and scale boost on hover.
 */
function setHoverHighlight(rootGroup, isHovered) {
  if (!rootGroup) return;

  const targetScale = isHovered ? 1.06 : 1.0;
  rootGroup.scale.setScalar(targetScale);

  rootGroup.traverse((child) => {
    if (child.isMesh && child.material && 'emissive' in child.material) {
      // Preserve materials that already glow (lantern glass/bulb)
      if (child.material.emissiveIntensity > 0.5 && isHovered) return;

      if (isHovered) {
        child.userData.prevEmissiveHex = child.material.emissive.getHex();
        child.userData.prevEmissiveIntensity = child.material.emissiveIntensity;
        child.material.emissive.setHex(0x38bdf8);
        child.material.emissiveIntensity = 0.28;
      } else if (child.userData.prevEmissiveHex !== undefined) {
        child.material.emissive.setHex(child.userData.prevEmissiveHex);
        child.material.emissiveIntensity = child.userData.prevEmissiveIntensity;
      }
    }
  });
}

/**
 * Configures OrbitControls and Raycaster hover/click picking.
 */
export function setupInteraction({ camera, canvas, interactiveObjects, animator }) {
  // --------------------------------------------------------------------------
  // 1. Camera Controls (OrbitControls with smooth damping)
  // --------------------------------------------------------------------------
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.target.set(0, 3.2, 0);
  controls.minDistance = 6.0;
  controls.maxDistance = 36.0;
  controls.maxPolarAngle = Math.PI * 0.48; // Prevent camera from going under the ocean
  controls.update();

  // --------------------------------------------------------------------------
  // 2. Raycaster & Normalized Device Coordinates (NDC)
  // --------------------------------------------------------------------------
  const raycaster = new THREE.Raycaster();
  const pointerNDC = new THREE.Vector2();
  const pointerDownPos = new THREE.Vector2();
  let hoveredRoot = null;

  const statusElement = document.getElementById('interaction-status');

  /**
   * Converts mouse pixel coordinates [0..width, 0..height] into WebGL
   * Normalized Device Coordinates (NDC) in [-1..+1, -1..+1].
   * Note: Y is inverted because DOM Y grows downward while NDC Y grows upward.
   */
  function updatePointerNDC(event) {
    const rect = canvas.getBoundingClientRect();
    pointerNDC.x = ((event.clientX - rect.left) / rect.width) * 2.0 - 1.0;
    pointerNDC.y = -((event.clientY - rect.top) / rect.height) * 2.0 + 1.0;
  }

  // Hover picking (pointermove)
  window.addEventListener('pointermove', (event) => {
    updatePointerNDC(event);
    raycaster.setFromCamera(pointerNDC, camera);

    // intersectObjects returns hits sorted ascending by distance (intersects[0] is closest)
    const intersects = raycaster.intersectObjects(interactiveObjects, true);
    const closestHit = intersects.length > 0 ? findInteractiveRoot(intersects[0].object) : null;

    if (closestHit !== hoveredRoot) {
      if (hoveredRoot) {
        setHoverHighlight(hoveredRoot, false);
      }
      hoveredRoot = closestHit;
      if (hoveredRoot) {
        setHoverHighlight(hoveredRoot, true);
        canvas.style.cursor = 'pointer';
        if (statusElement) {
          statusElement.innerHTML = `Hovering: <strong>${hoveredRoot.userData.title}</strong> — Click to interact!`;
        }
      } else {
        canvas.style.cursor = 'grab';
        if (statusElement) {
          statusElement.innerHTML =
            'Hover or click the <strong>Lighthouse</strong>, <strong>3 PBR Buoys</strong>, <strong>Sailboat</strong>, or <strong>Dock Lantern</strong>';
        }
      }
    }
  });

  // Track pointerdown position so dragging the camera doesn't accidentally fire a click
  window.addEventListener('pointerdown', (event) => {
    pointerDownPos.set(event.clientX, event.clientY);
  });

  // Click picking (pointerup)
  window.addEventListener('pointerup', (event) => {
    const dragDistance = Math.hypot(
      event.clientX - pointerDownPos.x,
      event.clientY - pointerDownPos.y
    );
    if (dragDistance > 6) return; // Ignore orbit drags

    updatePointerNDC(event);
    raycaster.setFromCamera(pointerNDC, camera);

    const intersects = raycaster.intersectObjects(interactiveObjects, true);
    if (intersects.length === 0) return;

    // Take the closest intersected object (index 0)
    const clickedRoot = findInteractiveRoot(intersects[0].object);
    if (!clickedRoot) return;

    const { id, hint } = clickedRoot.userData;
    if (id === 'lighthouse') {
      animator.toggleDayNightMode();
    } else if (id === 'lantern') {
      animator.toggleLanternBoost();
    } else {
      animator.triggerObjectBounce(clickedRoot);
    }

    if (statusElement && hint) {
      statusElement.innerHTML = `<strong>Action:</strong> ${hint}`;
    }
  });

  return { controls };
}
