// ============================================================================
// MATERIALS, TEXTURES & ENVIRONMENT MAP MODULE (src/materials.js)
// Requirements 2, 3, and 4:
// - Correct colorSpace (SRGBColorSpace for colour maps; Linear/NoColorSpace for normal/roughness)
// - Colour map + Normal map with RepeatWrapping, mipmaps, and anisotropy
// - Distinct PBR materials varying metalness & roughness + PMREM environment map
// ============================================================================

import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

/**
 * Helper to configure texture wrapping, mipmaps, and anisotropic filtering.
 */
function configureTiledTexture(texture, repeatX, repeatY, maxAnisotropy, isColorMap = false) {
  // Requirement 2: Colour (albedo) textures store sRGB-encoded pixel values and must
  // be tagged with SRGBColorSpace so WebGL converts them to linear space before lighting.
  // Normal and roughness maps store mathematical vectors/scalars and MUST remain linear (NoColorSpace).
  texture.colorSpace = isColorMap ? THREE.SRGBColorSpace : THREE.NoColorSpace;

  // Requirement 3: Suitable wrapping and filtering (mipmaps + anisotropy)
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = maxAnisotropy;
}

/**
 * Loads textures, configures the PMREM environment map, and creates all PBR materials.
 * @param {THREE.WebGLRenderer} renderer
 * @param {THREE.Scene} scene
 */
export function createMaterialsAndEnv(renderer, scene) {
  const textureLoader = new THREE.TextureLoader();
  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

  // --------------------------------------------------------------------------
  // 1. Environment Map via PMREMGenerator (Requirement 4)
  // Pre-filtered Mipmapped Radiance Environment Map gives PBR metals & glossy
  // surfaces physically accurate reflections across all roughness levels.
  // --------------------------------------------------------------------------
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  const rgbeLoader = new RGBELoader();
  rgbeLoader.load('/env/venice_sunset_1k.hdr', (hdrTexture) => {
    const envMap = pmremGenerator.fromEquirectangular(hdrTexture).texture;
    scene.environment = envMap;
    scene.environmentIntensity = 0.85;
    hdrTexture.dispose();
    pmremGenerator.dispose();
  });

  // --------------------------------------------------------------------------
  // 2. Textured PBR Material #1: Lighthouse Brick Wall (Colour + Normal + Roughness)
  // --------------------------------------------------------------------------
  const brickColorMap = textureLoader.load('/textures/red_brick_diff_1k.jpg');
  const brickNormalMap = textureLoader.load('/textures/red_brick_nor_gl_1k.jpg');
  const brickRoughnessMap = textureLoader.load('/textures/red_brick_rough_1k.jpg');

  configureTiledTexture(brickColorMap, 3, 4, maxAnisotropy, true);
  configureTiledTexture(brickNormalMap, 3, 4, maxAnisotropy, false);
  configureTiledTexture(brickRoughnessMap, 3, 4, maxAnisotropy, false);

  const lighthouseBrickMaterial = new THREE.MeshStandardMaterial({
    name: 'LighthouseBrickPBR',
    map: brickColorMap,
    normalMap: brickNormalMap,
    normalScale: new THREE.Vector2(1.2, 1.2),
    roughnessMap: brickRoughnessMap,
    // LIVE-DEMO TIP: Change roughness or normalScale here to show texture/PBR control
    roughness: 0.85,
    metalness: 0.0,
  });

  // --------------------------------------------------------------------------
  // 3. Textured PBR Material #2: Wooden Pier Planks (Colour + Normal)
  // --------------------------------------------------------------------------
  const woodColorMap = textureLoader.load('/textures/wood_planks_diff_1k.jpg');
  const woodNormalMap = textureLoader.load('/textures/wood_planks_nor_gl_1k.jpg');

  configureTiledTexture(woodColorMap, 2, 6, maxAnisotropy, true);
  configureTiledTexture(woodNormalMap, 2, 6, maxAnisotropy, false);

  const woodPierMaterial = new THREE.MeshStandardMaterial({
    name: 'WoodPierPBR',
    map: woodColorMap,
    normalMap: woodNormalMap,
    normalScale: new THREE.Vector2(1.0, 1.0),
    roughness: 0.78,
    metalness: 0.0,
  });

  // --------------------------------------------------------------------------
  // 4. Distinct PBR Materials Contrasting Metalness & Roughness (Requirement 4)
  // --------------------------------------------------------------------------

  // PBR Material A: Polished Copper Lantern Dome (High metalness, low roughness)
  // LIVE-DEMO TIP: Try changing roughness from 0.18 to 0.85 to show blurry specular highlights!
  const copperDomeMaterial = new THREE.MeshStandardMaterial({
    name: 'PolishedCopperPBR',
    color: new THREE.Color('#d97745'),
    metalness: 1.0,
    roughness: 0.18,
  });

  // PBR Material B: Mirror Chrome Buoy (Pure metal, near-zero roughness mirror reflection)
  const chromeBuoyMaterial = new THREE.MeshStandardMaterial({
    name: 'MirrorChromePBR',
    color: new THREE.Color('#e2e8f0'),
    metalness: 1.0,
    roughness: 0.06,
  });

  // PBR Material C: Brushed Gold Buoy (Metallic with medium-rough microfacet scatter)
  const brushedGoldBuoyMaterial = new THREE.MeshStandardMaterial({
    name: 'BrushedGoldPBR',
    color: new THREE.Color('#fbbf24'),
    metalness: 0.95,
    roughness: 0.35,
  });

  // PBR Material D: Glossy Crimson Ceramic Buoy (Dielectric non-metal, very smooth)
  const glossyCeramicBuoyMaterial = new THREE.MeshStandardMaterial({
    name: 'GlossyCeramicPBR',
    color: new THREE.Color('#ef4444'),
    metalness: 0.0,
    roughness: 0.12,
  });

  // Supporting Scene Materials (Island Rocks, Foliage, Whitewashed Trim, Boat Sail)
  const rockMaterial = new THREE.MeshStandardMaterial({
    name: 'CoastalRockPBR',
    color: new THREE.Color('#475569'),
    roughness: 0.92,
    metalness: 0.04,
    flatShading: true,
  });

  const mossMaterial = new THREE.MeshStandardMaterial({
    name: 'IslandMossPBR',
    color: new THREE.Color('#3f6212'),
    roughness: 0.88,
    metalness: 0.0,
    flatShading: true,
  });

  const whiteTrimMaterial = new THREE.MeshStandardMaterial({
    name: 'WhitewashedStonePBR',
    color: new THREE.Color('#f1f5f9'),
    roughness: 0.55,
    metalness: 0.05,
  });

  const darkIronMaterial = new THREE.MeshStandardMaterial({
    name: 'WroughtIronPBR',
    color: new THREE.Color('#1e293b'),
    roughness: 0.4,
    metalness: 0.85,
  });

  const sailClothMaterial = new THREE.MeshStandardMaterial({
    name: 'SailClothPBR',
    color: new THREE.Color('#fef3c7'),
    roughness: 0.7,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  return {
    lighthouseBrickMaterial,
    woodPierMaterial,
    copperDomeMaterial,
    chromeBuoyMaterial,
    brushedGoldBuoyMaterial,
    glossyCeramicBuoyMaterial,
    rockMaterial,
    mossMaterial,
    whiteTrimMaterial,
    darkIronMaterial,
    sailClothMaterial,
  };
}
