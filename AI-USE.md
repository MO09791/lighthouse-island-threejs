# AI-Use Statement (`AI-USE.md`)

**Course:** Computer Graphics 2026/27 · Final Project  
**Project:** Beacon Cove Lighthouse (Interactive 3D Scene in `three.js`)

This document follows the five-line template from Section 4 of the Final Project Grading Rubric for each important part of the project.

---

## 1. Custom Ocean Wave Shader (`src/shaders/water.vert`, `src/shaders/water.frag`, `src/shader.js`)

| Field | Details |
|---|---|
| **Tools** | Antigravity AI Assistant, ChatGPT. |
| **What for** | First draft of the multi-wave GLSL vertex shader (`water.vert`), fragment shader colour mixing (`water.frag`), and explanation of `uniforms` vs `varyings`. |
| **What I verified** | Tested changing `uWaveAmplitude`, `uWaveFrequency`, and `uWaveSpeed` in `lil-gui` and confirmed that `vElevation` interpolates smoothly across triangles into the fragment shader. |
| **What I changed or rejected** | Rejected an initial AI suggestion that updated `PlaneGeometry` vertex positions on the CPU every frame using `positionAttribute.needsUpdate = true`; moved all wave and radial ripple displacement onto the GPU in `water.vert` and added `#include <tonemapping_fragment>` and `#include <colorspace_fragment>` in `water.frag` so the water matches the scene's ACES Filmic tone mapping. |
| **What I learned** | Why vertex deformation belongs in the vertex shader (parallel GPU execution without CPU-to-GPU buffer uploads) and how `varying` variables are barycentrically interpolated across fragments by the rasterizer. |

---

## 2. Textures, Colour Space & PBR Environment Map (`src/materials.js`)

| Field | Details |
|---|---|
| **Tools** | Antigravity AI Assistant. |
| **What for** | Setting up `TextureLoader` helper for the brick lighthouse and wooden pier textures, plus `RGBELoader` and `PMREMGenerator` for the HDR environment map. |
| **What I verified** | Inspected specular highlights on the Copper Dome (`roughness: 0.18, metalness: 1.0`) and the three PBR buoys (`Chrome`, `Brushed Gold`, `Ceramic`) with and without `scene.environment`, and checked brick normal-map relief under the rotating `SpotLight`. |
| **What I changed or rejected** | Fixed an AI mistake where a helper function applied `texture.colorSpace = THREE.SRGBColorSpace` to every texture indiscriminately. Applying `SRGBColorSpace` to `red_brick_nor_gl_1k.jpg` gamma-decoded the XYZ normal vectors `(0.5, 0.5, 1.0)` and made the brick lighting look tilted and wrong. I added an `isColorMap` parameter so only colour/albedo textures use `SRGBColorSpace` while normal and roughness maps remain in `THREE.NoColorSpace` (linear). |
| **What I learned** | Why lighting math must happen in linear space, why colour maps are stored in sRGB while normal/roughness maps store linear mathematical data, and why metallic PBR surfaces look black without an environment map (`PMREM`) since metals have no diffuse reflection and only reflect their surroundings. |

---

## 3. Lighting & Shadow Configuration (`src/lights.js`)

| Field | Details |
|---|---|
| **Tools** | Antigravity AI Assistant. |
| **What for** | Configuring the four light types (`HemisphereLight`, `DirectionalLight`, `SpotLight`, `PointLight`) and tuning shadow parameters. |
| **What I verified** | Enabled `THREE.CameraHelper(lights.sunLight.shadow.camera)` in `src/gui.js` to visually inspect the orthodontic shadow frustum bounds (`±15` units) and checked sloped island rocks for shadow acne. |
| **What I changed or rejected** | The initial AI code left the `DirectionalLight` shadow camera at default bounds (`±5`, cutting off shadows for the outer buoys) and later suggested `±80` (which made shadows blurry). I resized the frustum to `left/right/top/bottom = ±15` and tuned `shadow.bias = -0.0005` and `shadow.normalBias = 0.02` to eliminate shadow acne without detaching shadows from object bases. |
| **What I learned** | Why a `DirectionalLight` needs an orthographic shadow camera box to define which part of the world is rendered into the `2048×2048` shadow depth texture, and how shadow-map resolution and frustum size jointly determine shadow sharpness. |

---

## 4. Frame-Rate Independent Animation, Easing & Tab-Focus Handling (`src/animation.js`)

| Field | Details |
|---|---|
| **Tools** | Antigravity AI Assistant. |
| **What for** | Implementing `easeInOutCubic` and `easeOutCubic` transitions for the Dusk ⇄ Night mode and buoy bounce animations using delta time. |
| **What I verified** | Tested switching to another browser tab for 15 seconds and returning to confirm that the rotating lighthouse beam and bobbing buoys resume smoothly from their exact position without jumping. |
| **What I changed or rejected** | An initial AI loop used `const dt = clock.getDelta()` directly, which caused a massive `dt` spike (15+ seconds) after returning from an inactive tab, making the lighthouse beam and eased transitions jump instantaneously. I added a `document.addEventListener('visibilitychange', ...)` handler that stops/restarts `THREE.Clock` and clamped `dt = Math.min(rawDelta, 0.1)`. |
| **What I learned** | How `requestAnimationFrame` pauses in background tabs while wall-clock time keeps running, why multiplying velocities by `dt` guarantees identical speed on 60 Hz and 144 Hz monitors, and how cubic easing shapes acceleration and deceleration. |

---

## 5. Raycaster Interaction & Camera Controls (`src/interaction.js`)

| Field | Details |
|---|---|
| **Tools** | Antigravity AI Assistant. |
| **What for** | Setting up `OrbitControls` and `THREE.Raycaster` for hover and click picking on nested `THREE.Group` hierarchies. |
| **What I verified** | Verified that hovering and clicking any child mesh of the Lighthouse, Sailboat, Dock Lantern, or 3 PBR Buoys accurately resolves its parent interactive group and triggers visual feedback. |
| **What I changed or rejected** | The first AI draft checked `pointerup` without comparing against `pointerdown` coordinates, so orbiting the camera with the mouse while the cursor ended over the lighthouse accidentally triggered Day/Night mode. I added a drag-distance threshold (`dragDistance > 6` pixels ignored) and wrote `findInteractiveRoot()` to climb `.parent` pointers from child meshes to the tagged group. |
| **What I learned** | How mouse pixel coordinates are converted to WebGL Normalized Device Coordinates (`NDC` in `[-1, +1]`), why the Y axis must be inverted, and how `raycaster.intersectObjects()` returns intersections sorted by distance from closest (`index 0`) to farthest. |
