# Beacon Cove Lighthouse — Interactive 3D Scene in Three.js

**Course:** Computer Graphics 2026/27 · Final Project  
**University:** South East European University (SEEU), Faculty of Contemporary Sciences and Technologies  
**Professor:** Prof. Dr. Visar Shehu · **Teaching Assistant:** Bejda Maksuti  

---

## 1. How to Run

Starting from a clean clone of the repository:

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite (typically `http://localhost:5173`) in your browser.

---

## 2. Where Each Required Technique Lives in the Code (Criterion A1)

| # | Technique | File & Location | What Is Implemented |
|---|-----------|-----------------|---------------------|
| **1** | **Lighting & Shadows** | [`src/lights.js`](src/lights.js) (lines 14–81)<br>[`src/scene.js`](src/scene.js) (`enableShadows`) | **4 light types:** `HemisphereLight` (sky/sea ambient fill), `DirectionalLight` (setting sun / moon with orthographic shadow camera `±15` frustum, `2048×2048` map, `shadow.bias = -0.0005` & `normalBias = 0.02` to prevent shadow acne), `SpotLight` (rotating lighthouse beacon casting shadows), and `PointLight` (warm pier lantern). |
| **2** | **Colour & Tone Mapping** | [`src/main.js`](src/main.js) (lines 43–46)<br>[`src/materials.js`](src/materials.js) (lines 17–20) | Renderer configured with `outputColorSpace = THREE.SRGBColorSpace` and `ACESFilmicToneMapping` (`toneMappingExposure = 1.15`). Albedo textures use `THREE.SRGBColorSpace`, while normal and roughness maps remain in linear space (`THREE.NoColorSpace`). |
| **3** | **Textures** | [`src/materials.js`](src/materials.js) (lines 14–77) | Colour (`map`), Normal (`normalMap`), and Roughness (`roughnessMap`) textures applied to the cylindrical lighthouse tower (`red_brick`) and wooden pier (`wood_planks`), using `RepeatWrapping`, `generateMipmaps = true`, `LinearMipmapLinearFilter`, and hardware max `anisotropy`. |
| **4** | **PBR Materials & PMREM** | [`src/materials.js`](src/materials.js) (lines 36–128)<br>[`src/scene.js`](src/scene.js) (lines 259–327) | `PMREMGenerator` pre-filters `venice_sunset_1k.hdr` for physically based image-based lighting (`scene.environment`). **4 showcase PBR materials** contrast `metalness` and `roughness`: Polished Copper Dome (`M: 1.0, R: 0.18`), Mirror Chrome Buoy (`M: 1.0, R: 0.06`), Brushed Gold Buoy (`M: 0.95, R: 0.35`), and Glossy Crimson Ceramic Buoy (`M: 0.0, R: 0.12`). |
| **5** | **Custom GLSL Shader** | [`src/shaders/water.vert`](src/shaders/water.vert)<br>[`src/shaders/water.frag`](src/shaders/water.frag)<br>[`src/shader.js`](src/shader.js) | Custom `THREE.ShaderMaterial` on a `160×160` ocean plane. The vertex shader deforms vertex elevation (`modelPosition.y`) with layered sine waves and radial ripples (`uTime`, `uWaveAmplitude`, `uWaveFrequency`, `uWaveSpeed`), passing `vElevation` and `vWorldPosition` as `varyings` to the fragment shader for animated trough-to-crest colour mixing and shoreline foam. |
| **6** | **Animation & Easing** | [`src/animation.js`](src/animation.js) (lines 15–191) | Frame-rate independent animation using `clock.getDelta()` clamped to `<= 0.1s` plus a `visibilitychange` listener that stops/restarts the clock so no jumps occur when switching browser tabs. Implements `easeInOutCubic` for Dusk ⇄ Night transitions and `easeOutCubic` for interactive buoy/boat bounce arcs. |
| **7** | **Interaction & Controls** | [`src/interaction.js`](src/interaction.js) (lines 55–160) | `OrbitControls` with damping and polar angle clamping so the camera stays above water. `Raycaster` converts mouse coordinates to Normalized Device Coordinates (`NDC`) for both **hover** (emissive highlight + `1.06×` scale + HUD readout) and **click** (triggers eased bounce, wave ripple boost, or Dusk/Night transition). |

---

## 3. Key Technical Design Decisions

1. **Tightly Fitted Directional Shadow Camera Frustum & Dual Bias (`src/lights.js`):**  
   A `DirectionalLight` has no natural distance falloff and uses an `OrthographicCamera` box to render its shadow depth map. Initially, a large frustum (`±60` units) made shadows on the lighthouse and pier look pixelated even at `2048×2048`. By tightening the shadow camera frustum to `±15` units (matching the exact radius of the island and buoys) and combining `shadow.bias = -0.0005` with `shadow.normalBias = 0.02`, we maximized shadow texel density and eliminated self-shadowing moiré stripes (shadow acne) on the sloped rocky island without causing peter-panning.

2. **GPU Vertex-Shader Wave Deformation + `#include <tonemapping_fragment>` (`src/shaders/water.vert`, `src/shaders/water.frag`):**  
   Deforming `160×160 = 25,600` ocean vertices in JavaScript on the CPU every frame and re-uploading `position.needsUpdate = true` creates a heavy CPU-to-GPU bottleneck. Moving the multi-wave sine and radial ripple math into `water.vert` keeps geometry static in VRAM and runs in parallel on the GPU at a locked 60 FPS. In addition, appending `#include <tonemapping_fragment>` and `#include <colorspace_fragment>` at the end of `water.frag` ensures our custom `ShaderMaterial` obeys the same `ACESFilmicToneMapping` and `SRGBColorSpace` pipeline as the standard PBR materials.

3. **Two-Layer Protection Against Tab-Focus Animation Jumps (`src/animation.js`):**  
   Browsers pause `requestAnimationFrame` when a tab is hidden, which causes `clock.getDelta()` to return several seconds in a single spike when the user returns. We solved this with a `document.addEventListener('visibilitychange', ...)` handler that stops the `THREE.Clock` while hidden and resets it on return, backed up by `const dt = Math.min(clock.getDelta(), 0.1)` so window dragging or OS sleep never causes objects or the lighthouse beacon to teleport.

---

## 4. Asset Credits & Licences (Criterion A5 / Section 5)

All external textures and environment maps are licensed under **CC0 1.0 Universal (Public Domain)** from [Poly Haven](https://polyhaven.com):

* **Red Brick Texture (`public/textures/red_brick_*_1k.jpg`):**  
  *Author:* Rob Tuytel / Poly Haven · *Source:* [https://polyhaven.com/a/red_brick](https://polyhaven.com/a/red_brick) · *Licence:* CC0 1.0 Public Domain
* **Wood Planks Texture (`public/textures/wood_planks_*_1k.jpg`):**  
  *Author:* Dimitrios Savva & Rico Cilliers / Poly Haven · *Source:* [https://polyhaven.com/a/wood_planks](https://polyhaven.com/a/wood_planks) · *Licence:* CC0 1.0 Public Domain
* **Venice Sunset Equirectangular HDRI (`public/env/venice_sunset_1k.hdr`):**  
  *Author:* Greg Zaal / Poly Haven · *Source:* [https://polyhaven.com/a/venice_sunset](https://polyhaven.com/a/venice_sunset) · *Licence:* CC0 1.0 Public Domain

**Libraries Used:**
* [`three`](https://threejs.org/) (MIT Licence) — 3D WebGL engine, `OrbitControls`, `RGBELoader`, `PMREMGenerator`
* [`lil-gui`](https://lil-gui.georgealways.com/) (MIT Licence) — Live parameter inspection panel
* [`vite`](https://vite.dev/) (MIT Licence) — Development server and bundler

---

## 5. AI-Use Statement Summary

Full details for each module follow the course template in [`AI-USE.md`](AI-USE.md). Key AI mistakes we identified, rejected, and fixed during development include:
1. **Incorrect `SRGBColorSpace` on Normal Maps:** An initial AI snippet set `texture.colorSpace = THREE.SRGBColorSpace` on *all* loaded textures inside a loop, which corrupted the tangent-space normal vectors in `red_brick_nor_gl_1k.jpg` and skewed lighting on the lighthouse tower. We fixed `configureTiledTexture()` in [`src/materials.js`](src/materials.js) so only colour maps use `SRGBColorSpace` while normal and roughness maps stay in linear space (`THREE.NoColorSpace`).
2. **CPU Vertex Loop vs. GLSL Vertex Shader:** Rejected an AI suggestion that iterated over `geometry.attributes.position` in JS every frame; moved all wave displacement into [`src/shaders/water.vert`](src/shaders/water.vert).
3. **Uncapped `clock.getDelta()` Jump on Tab Switch:** Fixed the AI's basic `const dt = clock.getDelta()` loop by adding a `visibilitychange` listener and clamping `dt <= 0.1` in [`src/animation.js`](src/animation.js).
