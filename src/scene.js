// ============================================================================
// SCENE CONSTRUCTION MODULE (src/scene.js)
// Builds the Lighthouse Island, Wooden Pier, Sailboat, and 3 PBR Signal Buoys.
// Every mesh has castShadow / receiveShadow configured and interactive objects
// carry userData metadata for Raycaster picking.
// ============================================================================

import * as THREE from 'three';

/**
 * Helper to enable shadow casting and receiving on a Mesh or Group.
 */
function enableShadows(object, cast = true, receive = true) {
  object.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = cast;
      child.receiveShadow = receive;
    }
  });
}

/**
 * Builds all 3D objects in the Lighthouse Island scene.
 * @param {THREE.Scene} scene
 * @param {ReturnType<import('./materials.js').createMaterialsAndEnv>} materials
 */
export function buildLighthouseScene(scene, materials) {
  const interactiveObjects = [];

  // --------------------------------------------------------------------------
  // 1. Rocky Island Base & Coastal Outcrops
  // --------------------------------------------------------------------------
  const islandGroup = new THREE.Group();
  islandGroup.name = 'RockyIsland';

  // Main rocky cliff base
  const cliffGeo = new THREE.CylinderGeometry(4.8, 6.4, 2.2, 12);
  const cliffMesh = new THREE.Mesh(cliffGeo, materials.rockMaterial);
  cliffMesh.position.y = 0.6;
  islandGroup.add(cliffMesh);

  // Upper mossy plateau
  const plateauGeo = new THREE.CylinderGeometry(4.3, 4.8, 0.7, 12);
  const plateauMesh = new THREE.Mesh(plateauGeo, materials.mossMaterial);
  plateauMesh.position.y = 1.85;
  islandGroup.add(plateauMesh);

  // Decorative coastal rock boulders around the perimeter
  const boulderConfigs = [
    { pos: [-4.2, 0.7, 2.5], scale: [1.5, 1.1, 1.3], rot: 0.4 },
    { pos: [-3.5, 0.5, -3.4], scale: [1.8, 1.2, 1.4], rot: 1.1 },
    { pos: [3.2, 0.6, -3.8], scale: [1.4, 0.9, 1.5], rot: 2.3 },
    { pos: [-1.8, 1.9, -3.1], scale: [0.9, 0.7, 0.8], rot: 0.8 },
    { pos: [2.4, 1.8, -2.2], scale: [0.75, 0.6, 0.7], rot: 1.7 },
  ];

  const boulderGeo = new THREE.DodecahedronGeometry(1.0, 0);
  for (const cfg of boulderConfigs) {
    const boulder = new THREE.Mesh(boulderGeo, materials.rockMaterial);
    boulder.position.set(...cfg.pos);
    boulder.scale.set(...cfg.scale);
    boulder.rotation.y = cfg.rot;
    islandGroup.add(boulder);
  }

  // Stylized coastal pine trees (cast nice shadows across the island plateau)
  const treePositions = [
    [-2.6, 2.15, 1.4],
    [-2.9, 2.15, -1.2],
    [-1.4, 2.15, -2.5],
  ];
  for (const [tx, ty, tz] of treePositions) {
    const tree = new THREE.Group();
    tree.position.set(tx, ty, tz);

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.18, 0.7, 8),
      materials.woodPierMaterial
    );
    trunk.position.y = 0.35;
    tree.add(trunk);

    const foliage1 = new THREE.Mesh(
      new THREE.ConeGeometry(0.75, 1.4, 7),
      materials.mossMaterial
    );
    foliage1.position.y = 1.15;
    tree.add(foliage1);

    const foliage2 = new THREE.Mesh(
      new THREE.ConeGeometry(0.55, 1.1, 7),
      materials.mossMaterial
    );
    foliage2.position.y = 1.85;
    tree.add(foliage2);

    islandGroup.add(tree);
  }

  enableShadows(islandGroup, true, true);
  scene.add(islandGroup);

  // --------------------------------------------------------------------------
  // 2. The Brick Lighthouse & Copper Dome (Interactive Object)
  // --------------------------------------------------------------------------
  const lighthouseGroup = new THREE.Group();
  lighthouseGroup.name = 'Lighthouse';
  lighthouseGroup.position.set(0, 2.15, 0);

  // Octagonal stone plinth foundation
  const plinthMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(1.75, 1.95, 0.8, 16),
    materials.whiteTrimMaterial
  );
  plinthMesh.position.y = 0.4;
  lighthouseGroup.add(plinthMesh);

  // Main tapered brick tower (Requirement 3: Colour + Normal + Roughness map)
  const towerMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(1.05, 1.55, 5.2, 32, 1),
    materials.lighthouseBrickMaterial
  );
  towerMesh.position.y = 3.4;
  lighthouseGroup.add(towerMesh);

  // White gallery cornice & balcony deck
  const corniceMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(1.38, 1.12, 0.38, 32),
    materials.whiteTrimMaterial
  );
  corniceMesh.position.y = 6.15;
  lighthouseGroup.add(corniceMesh);

  // Wrought-iron gallery railing ring
  const railRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.3, 0.035, 8, 32),
    materials.darkIronMaterial
  );
  railRing.rotation.x = Math.PI / 2;
  railRing.position.y = 6.65;
  lighthouseGroup.add(railRing);

  // Glass lantern room cylinder
  const lanternGlassMat = new THREE.MeshStandardMaterial({
    color: '#fef08a',
    emissive: '#f59e0b',
    emissiveIntensity: 0.9,
    roughness: 0.1,
    metalness: 0.1,
    transparent: true,
    opacity: 0.85,
  });
  const lanternRoomMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.88, 0.88, 1.15, 24),
    lanternGlassMat
  );
  lanternRoomMesh.position.y = 6.85;
  lighthouseGroup.add(lanternRoomMesh);

  // Polished Copper Cupola Dome (Requirement 4: High metalness, low roughness + PMREM)
  const domeMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.96, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.55),
    materials.copperDomeMaterial
  );
  domeMesh.position.y = 7.35;
  lighthouseGroup.add(domeMesh);

  // Copper lightning spire finial on top
  const spireBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 16, 16),
    materials.copperDomeMaterial
  );
  spireBall.position.y = 8.38;
  lighthouseGroup.add(spireBall);

  const spireNeedle = new THREE.Mesh(
    new THREE.ConeGeometry(0.06, 0.55, 12),
    materials.copperDomeMaterial
  );
  spireNeedle.position.y = 8.7;
  lighthouseGroup.add(spireNeedle);

  enableShadows(lighthouseGroup, true, true);

  // Rotating volumetric light-cone visual attached to the lantern room
  const beamPivot = new THREE.Group();
  beamPivot.position.set(0, 6.85, 0);
  const beamConeGeo = new THREE.ConeGeometry(2.6, 18, 24, 1, true);
  beamConeGeo.translate(0, -9, 0);
  beamConeGeo.rotateX(-Math.PI / 2);
  const beamConeMat = new THREE.MeshBasicMaterial({
    color: '#fef08a',
    transparent: true,
    opacity: 0.13,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const beamConeMesh = new THREE.Mesh(beamConeGeo, beamConeMat);
  beamPivot.add(beamConeMesh);
  lighthouseGroup.add(beamPivot);

  lighthouseGroup.userData = {
    interactive: true,
    id: 'lighthouse',
    title: 'Beacon Cove Lighthouse (Brick Texture + Copper PBR Dome)',
    hint: 'Clicked Lighthouse: Easing atmosphere between Golden Dusk and Starry Night!',
    baseY: lighthouseGroup.position.y,
  };
  interactiveObjects.push(lighthouseGroup);
  scene.add(lighthouseGroup);

  // --------------------------------------------------------------------------
  // 3. Textured Wooden Pier & Dock Lantern (Interactive Object)
  // --------------------------------------------------------------------------
  const pierGroup = new THREE.Group();
  pierGroup.name = 'WoodenPier';

  // Main wooden deck planks (Requirement 3: Wood colour + normal map)
  const deckMesh = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.28, 6.2),
    materials.woodPierMaterial
  );
  deckMesh.position.set(3.2, 1.15, 3.0);
  deckMesh.rotation.y = Math.PI / 4;
  pierGroup.add(deckMesh);

  // Pier support pilings in the water
  const pilingPositions = [
    [2.1, 0.3, 1.0],
    [1.1, 0.3, 2.0],
    [3.8, 0.3, 2.7],
    [2.8, 0.3, 3.7],
    [5.1, 0.3, 4.0],
    [4.1, 0.3, 5.0],
  ];
  const pilingGeo = new THREE.CylinderGeometry(0.14, 0.14, 2.1, 12);
  for (const [px, py, pz] of pilingPositions) {
    const piling = new THREE.Mesh(pilingGeo, materials.woodPierMaterial);
    piling.position.set(px, py, pz);
    pierGroup.add(piling);
  }

  enableShadows(pierGroup, true, true);
  scene.add(pierGroup);

  // Dock Lantern Post (Interactive Object)
  const lanternPostGroup = new THREE.Group();
  lanternPostGroup.name = 'DockLantern';
  lanternPostGroup.position.set(4.1, 1.3, 3.8);

  const postPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.08, 1.2, 12),
    materials.darkIronMaterial
  );
  postPole.position.y = 0.6;
  postPole.castShadow = true;
  lanternPostGroup.add(postPole);

  const lanternBulbMat = new THREE.MeshStandardMaterial({
    color: '#ffedd5',
    emissive: '#fb923c',
    emissiveIntensity: 2.2,
    roughness: 0.2,
  });
  const lanternBulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 16, 16),
    lanternBulbMat
  );
  lanternBulb.position.y = 1.15;
  lanternPostGroup.add(lanternBulb);

  const lanternCap = new THREE.Mesh(
    new THREE.ConeGeometry(0.24, 0.18, 12),
    materials.copperDomeMaterial
  );
  lanternCap.position.y = 1.34;
  lanternPostGroup.add(lanternCap);

  lanternPostGroup.userData = {
    interactive: true,
    id: 'lantern',
    title: 'Pier PointLight Lantern (Wrought Iron & Copper)',
    hint: 'Clicked Dock Lantern: Toggled PointLight intensity pulse!',
    baseY: lanternPostGroup.position.y,
    bulbMat: lanternBulbMat,
  };
  interactiveObjects.push(lanternPostGroup);
  scene.add(lanternPostGroup);

  // --------------------------------------------------------------------------
  // 4. Moored Coastal Sailboat (Interactive Object)
  // --------------------------------------------------------------------------
  const boatGroup = new THREE.Group();
  boatGroup.name = 'Sailboat';
  boatGroup.position.set(6.5, 0.18, 2.8);
  boatGroup.rotation.y = -0.5;

  const hullMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 0.55, 2.9),
    materials.woodPierMaterial
  );
  hullMesh.position.y = 0.2;
  boatGroup.add(hullMesh);

  const mastMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.07, 3.1, 10),
    materials.whiteTrimMaterial
  );
  mastMesh.position.set(0, 1.7, 0.1);
  boatGroup.add(mastMesh);

  // Main sail
  const sailGeo = new THREE.BufferGeometry();
  const sailVertices = new Float32Array([
    0, 0.65, 0.05,
    0, 3.05, 0.05,
    0, 0.65, -1.35,
  ]);
  sailGeo.setAttribute('position', new THREE.BufferAttribute(sailVertices, 3));
  sailGeo.computeVertexNormals();
  const mainSail = new THREE.Mesh(sailGeo, materials.sailClothMaterial);
  boatGroup.add(mainSail);

  enableShadows(boatGroup, true, true);
  boatGroup.userData = {
    interactive: true,
    id: 'sailboat',
    title: 'Coastal Sailboat (Textured Wood Hull & Cloth Sail)',
    hint: 'Clicked Sailboat: Eased wave surge & ripple boost triggered!',
    baseY: 0.18,
    bounceProgress: 1.0,
  };
  interactiveObjects.push(boatGroup);
  scene.add(boatGroup);

  // --------------------------------------------------------------------------
  // 5. Three PBR Showcase Signal Buoys (Interactive Objects — Requirement 4 & 7)
  // Designed to clearly demonstrate metalness vs roughness + PMREM reflections
  // --------------------------------------------------------------------------
  const buoySpecs = [
    {
      id: 'buoy-chrome',
      title: 'PBR Buoy #1: Mirror Chrome (metalness: 1.0, roughness: 0.06)',
      hint: 'Clicked Mirror Chrome Buoy: Eased bounce + ocean wave ripple!',
      material: materials.chromeBuoyMaterial,
      ringMaterial: materials.darkIronMaterial,
      position: new THREE.Vector3(-7.5, 0.2, 5.2),
    },
    {
      id: 'buoy-gold',
      title: 'PBR Buoy #2: Brushed Gold (metalness: 0.95, roughness: 0.35)',
      hint: 'Clicked Brushed Gold Buoy: Eased bounce + ocean wave ripple!',
      material: materials.brushedGoldBuoyMaterial,
      ringMaterial: materials.darkIronMaterial,
      position: new THREE.Vector3(0.8, 0.2, 8.8),
    },
    {
      id: 'buoy-ceramic',
      title: 'PBR Buoy #3: Glossy Crimson Ceramic (metalness: 0.0, roughness: 0.12)',
      hint: 'Clicked Glossy Ceramic Buoy: Eased bounce + ocean wave ripple!',
      material: materials.glossyCeramicBuoyMaterial,
      ringMaterial: materials.whiteTrimMaterial,
      position: new THREE.Vector3(-8.2, 0.2, -3.8),
    },
  ];

  const buoys = [];

  for (const spec of buoySpecs) {
    const buoyGroup = new THREE.Group();
    buoyGroup.name = spec.id;
    buoyGroup.position.copy(spec.position);

    // Floating collar torus
    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(0.95, 0.22, 16, 32),
      spec.ringMaterial
    );
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 0.08;
    buoyGroup.add(collar);

    // Large PBR Showcase Sphere (makes PMREM reflections and specular highlights easy to inspect)
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.82, 32, 32),
      spec.material
    );
    sphere.position.y = 0.72;
    buoyGroup.add(sphere);

    // Top beacon finial ring
    const topRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.045, 12, 24),
      spec.material
    );
    topRing.position.y = 1.65;
    buoyGroup.add(topRing);

    enableShadows(buoyGroup, true, true);

    buoyGroup.userData = {
      interactive: true,
      id: spec.id,
      title: spec.title,
      hint: spec.hint,
      baseY: spec.position.y,
      bounceProgress: 1.0, // 1.0 = idle; 0.0 -> 1.0 = active eased bounce animation
      phaseOffset: Math.random() * Math.PI * 2,
    };

    buoys.push(buoyGroup);
    interactiveObjects.push(buoyGroup);
    scene.add(buoyGroup);
  }

  return {
    islandGroup,
    lighthouseGroup,
    beamPivot,
    lanternGlassMat,
    beamConeMat,
    lanternPostGroup,
    boatGroup,
    buoys,
    interactiveObjects,
  };
}
