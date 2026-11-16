# Exam Day Oral Defense & Live Demo Study Guide (`EXAM_STUDY_GUIDE.md`)

Remember **THE ONE RULE** from the grading rubric:
> *"A feature you cannot explain counts as not implemented, whoever or whatever wrote it."*

This guide gives you:
1. Your **90-second script** for **B1 Live Demo (1 point)**.
2. Exact places to show & live-edit for **B2 Explaining the Code (2.5 points)**.
3. Exact answers to every **Typical Demo Question** on Page 3 of the rubric.
4. Ready-to-use answers for **B3 Decision and Reflection (1.5 points)**.

---

## Part 1: B1 Live Demo Script (Under 2 Minutes)

Run `npm run dev` and open the browser. Follow these 5 quick steps (~90 seconds total):

1. **Lighting & Shadows (20s):**  
   Point to the scene and open folder **`1. Lighting & Shadows`** in the top-right GUI:
   - *"My scene uses 4 light types (`src/lights.js`): a `DirectionalLight` for the setting sun casting shadows across the island, a rotating `SpotLight` inside the lighthouse lantern room, a warm `PointLight` on the pier lantern, and a `HemisphereLight` for sky-to-sea ambient fill."*
   - Click **`Show Shadow Frustum`** checkbox in the GUI to show the tight `±15` orthodontic shadow box.
2. **Colour & Tone Mapping (15s):**  
   Open **`2. Colour & Tone Mapping`**:
   - *"We output in `SRGBColorSpace` and use `ACESFilmicToneMapping` (`src/main.js`). If I switch Tone Mapping to `None` or drag Exposure up, bright highlights clip harshly; ACES Filmic smoothly rolls off values > 1."*
3. **Textures & PBR Materials (25s):**  
   Zoom into the **Brick Lighthouse**, **Wooden Pier**, **Copper Dome**, and the **3 Floating Buoys**:
   - *"The lighthouse tower (`red_brick`) and pier (`wood_planks`) use Colour + Normal maps with `RepeatWrapping`, mipmaps, and max anisotropic filtering (`src/materials.js`)."*
   - *"For PBR (`src/materials.js`), I load `venice_sunset_1k.hdr` through `PMREMGenerator` for reflections and contrast 4 materials: the Polished Copper Dome (`metalness: 1, roughness: 0.18`), Mirror Chrome Buoy (`roughness: 0.06`), Brushed Gold Buoy (`roughness: 0.35`), and Glossy Crimson Ceramic Buoy (`metalness: 0, roughness: 0.12`)."*
4. **Custom GLSL Water Shader (15s):**  
   Open **`5. Water GLSL Shader`** and drag `Wave Amplitude`:
   - *"The ocean uses my custom `ShaderMaterial` (`src/shaders/water.vert` & `water.frag`). The vertex shader deforms vertex height `Y` using layered sine waves and radial ripples driven by `uTime`, and passes `vElevation` as a `varying` to the fragment shader to blend deep navy troughs, turquoise crests, and shoreline foam."*
5. **Animation, Easing & Raycaster Interaction (15s):**  
   Hover over the **Buoys** and **Lighthouse** (showing the blue emissive highlight + HUD update), then **click a Buoy** and **click the Lighthouse**:
   - *"Hovering and clicking use `THREE.Raycaster` (`src/interaction.js`). Clicking a buoy triggers an `easeOutCubic` jump and a wave ripple boost; clicking the lighthouse smoothly transitions the scene between Dusk and Night using `easeInOutCubic` (`src/animation.js`), all driven by clamped `delta` time with a `visibilitychange` listener so tab-switching never causes a jump."*

---

## Part 2: B2 Live Code Changes (Where to Edit When Asked)

During **B2**, the professor will ask you to explain 2 code sections (1 you choose, 1 they choose) and make a small live change:

* **Best place for YOU to choose to explain:**  
  Open [`src/shaders/water.vert`](src/shaders/water.vert) and [`src/shaders/water.frag`](src/shaders/water.frag) (or [`src/materials.js`](src/materials.js)). They are short, clean, and heavily commented.
* **If asked: *"Make this material rougher / less metallic"*:**  
  Open [`src/materials.js`](src/materials.js#L85-L115):
  - Line 89 (`copperDomeMaterial`): change `roughness: 0.18` to `roughness: 0.85` and save — the copper dome on top of the lighthouse immediately loses its sharp mirror reflection.
  - Line 97 (`chromeBuoyMaterial`): change `roughness: 0.06` to `0.7` and save.
* **If asked: *"Slow the animation down / speed it up"*:**  
  Open [`src/animation.js`](src/animation.js#L38-L41):
  - Line 39: change `beaconRotationSpeed: 0.85` to `0.2` (slows the rotating lighthouse beam).
  - Or in [`src/shader.js`](src/shader.js#L18-L20): change `uWaveSpeed: { value: 1.4 }` to `0.4` (slows the ocean waves).
* **If asked: *"Make the waves higher"*:**  
  Open [`src/shader.js`](src/shader.js#L18):
  - Line 18: change `uWaveAmplitude: { value: 0.28 }` to `0.65`.

---

## Part 3: Answers to All Typical Demo Questions (Page 3 of Rubric)

### 1. Lighting
* **Q: Why does a directional light need a shadow camera?**  
  **A:** Because a `DirectionalLight` simulates infinitely distant parallel rays (like the sun) and has no position falloff. To render shadows, WebGL must render the scene's depth from the light's point of view into a 2D texture (the shadow map). The `OrthographicCamera` frustum (`left, right, top, bottom, near, far` in `src/lights.js`) defines the exact 3D bounding box of the world that gets captured into that shadow map.
* **Q: What happens when you lower the shadow-map resolution?**  
  **A:** Each pixel (texel) of the shadow map covers a larger area of the 3D scene, so shadow edges become blocky, pixelated, and jagged (aliasing).
* **Q: Why does ambient light alone look flat?**  
  **A:** `AmbientLight` adds the exact same constant colour to every surface regardless of surface normal direction or light direction. Without directional shading ($N \cdot L$) or shadows, there are no highlights or gradients to reveal 3D curvature. (That is why we used a `HemisphereLight` in `src/lights.js`, which interpolates between a sky colour for upward normals and a ground colour for downward normals).

### 2. Colour
* **Q: Why do we compute lighting in linear space and output sRGB?**  
  **A:** Real-world light physics is linear (two photons = twice the energy), so shader math like dot products, reflections, and light addition only works accurately in linear space. However, human eyes are more sensitive to dark tones than bright tones, and monitors expect gamma-encoded **sRGB** signals. So we decode colour textures from sRGB to linear, compute lighting in linear space, and convert the final image back to `SRGBColorSpace` at output (`renderer.outputColorSpace = THREE.SRGBColorSpace` in `src/main.js`).
* **Q: What does tone mapping do with values greater than 1?**  
  **A:** In linear HDR lighting, bright lights and specular highlights easily produce colour values greater than `1.0` (e.g., `2.4` or `18.0`). Without tone mapping, a standard monitor simply clamps everything above `1.0` to pure white (`1.0`), destroying highlight detail and skewing hues. Tone mapping (`ACESFilmicToneMapping` in `src/main.js`) applies an S-curve that smoothly compresses unbounded HDR values `[0, ∞)` into the displayable `[0, 1]` range while preserving contrast and colour saturation.

### 3. Textures
* **Q: Why does the colour map use `SRGBColorSpace` but the normal map does not?**  
  **A:** A colour (albedo) map is painted/photographed to look right on a monitor, so its bytes are encoded with the non-linear sRGB gamma curve and must be tagged `SRGBColorSpace` so Three.js linearizes them before lighting. A normal map (`red_brick_nor_gl_1k.jpg`) does **not** store colours—its `(R, G, B)` channels store mathematical $(X, Y, Z)$ surface normal vectors encoded linearly. Applying sRGB gamma conversion to a normal map corrupts the vector math and points the surface normals in the wrong direction (`src/materials.js`, line 20).
* **Q: What problem do mipmaps solve?**  
  **A:** When a high-resolution texture is viewed far away or scaled down, multiple texture pixels (texels) fall inside a single screen pixel, causing severe shimmering/moiré aliasing ("texture crawling") and slow cache performance. Mipmaps pre-compute a pyramid of successively halved textures ($1024 \rightarrow 512 \rightarrow 256 \dots$) so the GPU samples a pre-filtered level matching the screen footprint (`LinearMipmapLinearFilter`).

### 4. PBR Materials
* **Q: What does roughness change in the specular highlight?**  
  **A:** `roughness` controls microscopic surface unevenness (microfacets). Low roughness (`0.06` on our Chrome Buoy) aligns microfacets so light reflects sharply in a tight, bright, mirror-like specular highlight. High roughness (`0.85` on our Brick/Rock) scatters reflected rays in many directions, making the specular highlight wide, dim, and blurry.
* **Q: Why does a metal look wrong without an environment map?**  
  **A:** In physically based rendering (PBR), pure metals (`metalness = 1.0`) have **zero diffuse reflection** (light that enters a metal is absorbed by free electrons; its diffuse albedo becomes black). Almost 100% of a metal's appearance comes from specular reflection of its surroundings. Without an environment map (`scene.environment` generated via `PMREMGenerator` in `src/materials.js`), a metal has nothing to reflect except point light hotspots and looks pitch black/dark grey.

### 5. Shader
* **Q: What is the difference between a `uniform`, an `attribute`, and a `varying`?**  
  **A:**  
  - **`attribute`**: Per-vertex data stored in the geometry buffer (like `position`, `normal`, `uv`), read only by the **vertex shader**.  
  - **`uniform`**: Global read-only variable sent from JavaScript (`uTime`, `uWaveAmplitude`, `uDeepColor`) that stays constant for all vertices and fragments in a single draw call (accessible in both vertex and fragment shaders).  
  - **`varying`**: Output from the vertex shader (`vElevation`, `vWorldPosition`) that the GPU rasterizer **smoothly interpolates** across each triangle's surface and passes as input into the **fragment shader** for every pixel.
* **Q: Is the deformation in the vertex or the fragment shader, and why?**  
  **A:** In the **vertex shader** (`src/shaders/water.vert`), because only the vertex shader determines the 3D geometric coordinates (`gl_Position`) of the mesh's triangles before rasterization. The fragment shader runs *after* triangles are already projected onto 2D screen pixels, so it can only change pixel colours, not move 3D vertices.

### 6. Animation
* **Q: What happens on a 144 Hz monitor if you do not use delta time?**  
  **A:** `requestAnimationFrame` runs once per monitor refresh. If you increment rotation by a fixed amount per frame (e.g., `angle += 0.01`), a 144 Hz monitor runs the loop 144 times per second instead of 60, making the animation run **$2.4\times$ faster** than on a 60 Hz monitor. Multiplying speed by `delta` time (`state.beaconRotationSpeed * dt` in `src/animation.js`) measures speed in radians per second, so it runs at the exact same real-world speed on every monitor.
* **Q: Which easing did you choose and why?**  
  **A:** We used **`easeInOutCubic`** for the Dusk ⇄ Night transition and **`easeOutCubic`** for the buoy bounce (`src/animation.js`, lines 15–31). Linear motion starts and stops abruptly with infinite acceleration at the endpoints, which feels robotic. `easeInOutCubic` ($4t^3$ then $1 - (-2t+2)^3/2$) accelerates gently from rest and decelerates smoothly at the end, while `easeOutCubic` ($1 - (1-t)^3$) gives an immediate responsive impulse when you click a buoy and smoothly settles back into the water.

### 7. Interaction
* **Q: How do you convert the mouse position to NDC?**  
  **A:** In `src/interaction.js` (lines 80–84):
  ```js
  pointerNDC.x = ((event.clientX - rect.left) / rect.width) * 2.0 - 1.0;
  pointerNDC.y = -((event.clientY - rect.top) / rect.height) * 2.0 + 1.0;
  ```
  We divide pixel coordinates by canvas width/height to get $[0, 1]$, multiply by $2$ and subtract $1$ to map into $[-1, +1]$. We negate `y` because browser DOM `clientY` is $0$ at the top and grows downward, whereas WebGL NDC has $-1$ at the bottom and $+1$ at the top.
* **Q: What does the Raycaster return and how do you take the closest object?**  
  **A:** `raycaster.intersectObjects(interactiveObjects, true)` returns an array of intersection hit objects (`{ distance, point, face, uv, object }`) **already sorted in ascending order by `distance` from the camera**. Therefore, the closest object hit by the ray is always the first element: `intersects[0]` (`src/interaction.js`, line 91 & 127).

---

## Part 4: B3 Decision and Reflection (1.5 Points)

1. **The technical decision that cost you the most effort and how you solved it:**  
   - *"Configuring the `DirectionalLight` shadow camera frustum and eliminating shadow acne on the sloped low-poly island rocks (`src/lights.js`). Initially, the shadow frustum was too wide, making shadows blocky, and the sloped rock faces had striped self-shadowing artifacts (shadow acne). Adding a `CameraHelper` in the GUI let me visually shrink the orthographic frustum to `±15` units around the island and tune `shadow.bias = -0.0005` and `shadow.normalBias = 0.02`, giving sharp shadows with zero acne."*
2. **One thing an AI tool got wrong:**  
   - *"The AI initially wrote a texture-loading helper that applied `texture.colorSpace = THREE.SRGBColorSpace` to all textures, including the brick normal map (`red_brick_nor_gl_1k.jpg`). That gamma-decoded the XYZ normal vectors and made the lighting on the lighthouse tower look inverted/tilted. I fixed `configureTiledTexture()` in `src/materials.js` so only the colour map uses `SRGBColorSpace` while normal and roughness maps stay linear (`THREE.NoColorSpace`)."*
3. **What you would do differently with more time:**  
   - *"I would compute analytical partial derivatives ($\partial y / \partial x$ and $\partial y / \partial z$) of the sine waves inside `water.vert` to perturb the surface normals in `water.frag` so the custom ocean shader also reflects the rotating lighthouse `SpotLight` and `PMREM` sky dynamically, and add a GPU particle system for sea spray crashing against the island rocks."*
