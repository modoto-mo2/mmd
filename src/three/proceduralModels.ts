import * as THREE from 'three';

/**
 * Generates a soft radial glow sprite texture for Three.js Points & volumetric halos.
 */
export function createGlowParticleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(64, 64, 2, 64, 64, 62);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.25, 'rgba(254, 240, 138, 0.9)');
  grad.addColorStop(0.55, 'rgba(244, 63, 94, 0.35)');
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Generates a deep cosmic & aurora gradient backdrop texture for the 3D universe.
 */
export function createCosmicBackdropTexture(
  preset: 'tactical-night' | 'golden-hope' | 'daylight-relief',
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  if (preset === 'golden-hope') {
    grad.addColorStop(0.0, '#040711');
    grad.addColorStop(0.35, '#1e1b4b');
    grad.addColorStop(0.68, '#7c2d12');
    grad.addColorStop(0.9, '#b45309');
    grad.addColorStop(1.0, '#050814');
  } else if (preset === 'daylight-relief') {
    grad.addColorStop(0.0, '#061e36');
    grad.addColorStop(0.45, '#075985');
    grad.addColorStop(0.8, '#0284c7');
    grad.addColorStop(1.0, '#091326');
  } else {
    grad.addColorStop(0.0, '#02040a');
    grad.addColorStop(0.35, '#070d22');
    grad.addColorStop(0.65, '#111636');
    grad.addColorStop(0.88, '#2d0b28');
    grad.addColorStop(1.0, '#040711');
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);

  const washes =
    preset === 'golden-hope'
      ? [
          { x: 260, y: 240, r: 320, c: 'rgba(245, 158, 11, 0.22)' },
          { x: 740, y: 180, r: 300, c: 'rgba(244, 63, 94, 0.16)' },
        ]
      : [
          { x: 240, y: 220, r: 340, c: 'rgba(244, 63, 94, 0.18)' },
          { x: 760, y: 200, r: 340, c: 'rgba(56, 189, 248, 0.16)' },
          { x: 512, y: 140, r: 280, c: 'rgba(139, 92, 246, 0.12)' },
        ];

  washes.forEach((w) => {
    const rg = ctx.createRadialGradient(w.x, w.y, 10, w.x, w.y, w.r);
    rg.addColorStop(0, w.c);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, 1024, 512);
  });

  let seed = 777;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < 360; i++) {
    const x = rand() * 1024;
    const y = rand() * 440;
    const r = 0.4 + rand() * 1.1;
    const a = 0.2 + rand() * 0.65;
    ctx.fillStyle =
      i % 6 === 0
        ? `rgba(253, 230, 138, ${a.toFixed(2)})`
        : i % 8 === 0
          ? `rgba(125, 211, 252, ${a.toFixed(2)})`
          : `rgba(255, 255, 255, ${a.toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Builds a sleek, gallery-grade floating 3D glass-bezel photo frame in 3D space
 * with smooth metallic backing and zero wireframe/debug lines.
 */
export function buildFloatingCurvedPhotoPlate(
  imageUrl: string,
  width: number,
  height: number,
  accentHex: number,
  textureLoader: THREE.TextureLoader,
  maxAnisotropy: number,
): THREE.Group {
  const group = new THREE.Group();

  const frameMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f172a,
    emissive: accentHex,
    emissiveIntensity: 0.35,
    metalness: 0.85,
    roughness: 0.18,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
  });
  const frameMesh = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.14, height + 0.14, 0.06),
    frameMat,
  );
  frameMesh.position.z = -0.04;
  group.add(frameMesh);

  const rimMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width + 0.22, height + 0.22),
    new THREE.MeshBasicMaterial({
      color: accentHex,
      transparent: true,
      opacity: 0.28,
    }),
  );
  rimMesh.position.z = -0.08;
  group.add(rimMesh);

  const photoMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
  });
  textureLoader.load(imageUrl, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = maxAnisotropy;
    photoMat.map = tex;
    photoMat.needsUpdate = true;
  });

  const photoMesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), photoMat);
  photoMesh.position.z = 0.01;
  group.add(photoMesh);

  return group;
}

function createSeismicCoreTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 512, 256);
  grad.addColorStop(0.0, '#881337');
  grad.addColorStop(0.3, '#e11d48');
  grad.addColorStop(0.55, '#f59e0b');
  grad.addColorStop(0.8, '#e11d48');
  grad.addColorStop(1.0, '#4c0519');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  for (let i = 0; i < 18; i++) {
    const y = (i / 18) * 256;
    const rg = ctx.createLinearGradient(0, y - 12, 0, y + 12);
    rg.addColorStop(0, 'rgba(254, 240, 138, 0)');
    rg.addColorStop(0.5, i % 2 === 0 ? 'rgba(254, 240, 138, 0.55)' : 'rgba(244, 63, 94, 0.5)');
    rg.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, y - 12, 512, 24);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ============================================================================
// ACT 1: SMOOTH LIQUID-METAL SEISMIC WAVE SURFACE & MOLTEN GYROSCOPE CORE
// ============================================================================
export interface SeismicWavefieldHandles {
  group: THREE.Group;
  terrainGeo: THREE.BufferGeometry;
  basePositions: Float32Array;
  epicenterCore: THREE.Mesh;
  shockRings: THREE.Mesh[];
  updateWavefield: (elapsed: number, pulseBoost: number) => void;
}

export function buildSeismicWaveTerrain(): SeismicWavefieldHandles {
  const group = new THREE.Group();

  const segs = 64;
  const terrainGeo = new THREE.PlaneGeometry(18, 18, segs, segs);
  terrainGeo.rotateX(-Math.PI / 2);

  const posAttr = terrainGeo.attributes.position as THREE.BufferAttribute;
  const basePositions = new Float32Array(posAttr.array.length);
  basePositions.set(posAttr.array);

  const colors = new Float32Array(posAttr.count * 3);
  terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const waveSurfaceMat = new THREE.MeshPhysicalMaterial({
    vertexColors: true,
    roughness: 0.16,
    metalness: 0.72,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    side: THREE.DoubleSide,
  });
  const surfaceMesh = new THREE.Mesh(terrainGeo, waveSurfaceMat);
  surfaceMesh.position.y = -2.0;
  group.add(surfaceMesh);

  const coreTex = createSeismicCoreTexture();
  const coreMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: coreTex,
    emissive: 0xf43f5e,
    emissiveMap: coreTex,
    emissiveIntensity: 0.85,
    roughness: 0.12,
    metalness: 0.45,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  });
  const epicenterCore = new THREE.Mesh(new THREE.SphereGeometry(1.18, 64, 64), coreMat);
  epicenterCore.position.set(0, 0.55, 0);
  group.add(epicenterCore);

  const gyroMatGold = new THREE.MeshPhysicalMaterial({
    color: 0xfbbf24,
    emissive: 0xd97706,
    emissiveIntensity: 0.45,
    metalness: 0.92,
    roughness: 0.14,
    clearcoat: 1.0,
  });
  const gyroRing1 = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.045, 32, 128), gyroMatGold);
  gyroRing1.rotation.x = Math.PI / 3;
  epicenterCore.add(gyroRing1);

  const gyroMatCyan = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.5,
    metalness: 0.9,
    roughness: 0.14,
    clearcoat: 1.0,
  });
  const gyroRing2 = new THREE.Mesh(new THREE.TorusGeometry(1.92, 0.04, 32, 128), gyroMatCyan);
  gyroRing2.rotation.y = Math.PI / 2.5;
  epicenterCore.add(gyroRing2);

  const shockRings: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const rGeo = new THREE.TorusGeometry(1.75 + i * 0.95, 0.05, 28, 128);
    rGeo.rotateX(Math.PI / 2);
    const rMat = new THREE.MeshPhysicalMaterial({
      color: i % 2 === 0 ? 0xf43f5e : 0xfbbf24,
      emissive: i % 2 === 0 ? 0xe11d48 : 0xd97706,
      emissiveIntensity: 0.75,
      metalness: 0.8,
      roughness: 0.15,
      transparent: true,
      opacity: 0.85,
    });
    const rMesh = new THREE.Mesh(rGeo, rMat);
    rMesh.position.set(0, -0.5, 0);
    group.add(rMesh);
    shockRings.push(rMesh);
  }

  const cLow = new THREE.Color(0x082f49);
  const cMid = new THREE.Color(0xbe123c);
  const cHigh = new THREE.Color(0xfbbf24);
  const tmpColor = new THREE.Color();

  const updateWavefield = (elapsed: number, pulseBoost: number) => {
    const pos = terrainGeo.attributes.position as THREE.BufferAttribute;
    const col = terrainGeo.attributes.color as THREE.BufferAttribute;
    const amp = 1.0 + pulseBoost * 1.5;

    for (let i = 0; i < pos.count; i++) {
      const ix = i * 3;
      const x = basePositions[ix];
      const z = basePositions[ix + 2];
      const dist = Math.hypot(x, z);

      const edgeMask = Math.exp(-(dist * dist) / 56.0);
      const wave1 = Math.sin(dist * 1.35 - elapsed * 4.0) * edgeMask;
      const wave2 =
        Math.cos(x * 0.55 + elapsed * 1.8) * Math.sin(z * 0.55 - elapsed * 1.6) * 0.35 * edgeMask;
      const y = (wave1 * 1.25 + wave2) * amp - (1.0 - edgeMask) * 1.1;

      pos.array[ix + 1] = y;

      const normH = THREE.MathUtils.clamp((y + 1.1) / 2.2, 0, 1);
      if (normH < 0.55) {
        tmpColor.copy(cLow).lerp(cMid, normH / 0.55);
      } else {
        tmpColor.copy(cMid).lerp(cHigh, (normH - 0.55) / 0.45);
      }
      col.array[ix] = tmpColor.r;
      col.array[ix + 1] = tmpColor.g;
      col.array[ix + 2] = tmpColor.b;
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
    terrainGeo.computeVertexNormals();

    epicenterCore.rotation.y = elapsed * 0.65;
    epicenterCore.rotation.x = Math.sin(elapsed * 0.5) * 0.25;
    epicenterCore.scale.setScalar(1.0 + Math.sin(elapsed * 4.0) * 0.05 + pulseBoost * 0.2);

    shockRings.forEach((ring, idx) => {
      const phase = (elapsed * 0.5 + idx * 0.33) % 1;
      const scale = 0.75 + phase * 1.7;
      ring.scale.set(scale, scale, 1);
      ring.position.y = -1.1 + Math.sin(phase * Math.PI) * 1.1;
      (ring.material as THREE.MeshPhysicalMaterial).opacity = Math.sin(phase * Math.PI) * 0.85;
    });
  };

  updateWavefield(0.6, 0);

  return { group, terrainGeo, basePositions, epicenterCore, shockRings, updateWavefield };
}

// ============================================================================
// ACT 2: 24K GOLD SACRED TORUS-KNOT & CELESTIAL ASTROLABE (ZERO WIREFRAMES)
// ============================================================================
export interface GoldenVortexHandles {
  group: THREE.Group;
  torusKnot: THREE.Mesh;
  wireKnot: THREE.Mesh;
  astrolabeRing1: THREE.Mesh;
  astrolabeRing2: THREE.Mesh;
  particleRing: THREE.Points;
}

export function buildGoldenFetratVortex(glowTex: THREE.CanvasTexture): GoldenVortexHandles {
  const group = new THREE.Group();

  const goldCoreMat = new THREE.MeshPhysicalMaterial({
    color: 0xfbbf24,
    emissive: 0x92400e,
    emissiveIntensity: 0.42,
    roughness: 0.12,
    metalness: 0.94,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
  });
  const knotGeo = new THREE.TorusKnotGeometry(1.12, 0.25, 220, 48, 2, 3);
  const torusKnot = new THREE.Mesh(knotGeo, goldCoreMat);
  group.add(torusKnot);

  const innerHeartMat = new THREE.MeshPhysicalMaterial({
    color: 0x10b981,
    emissive: 0x059669,
    emissiveIntensity: 0.8,
    roughness: 0.1,
    metalness: 0.6,
    clearcoat: 1.0,
  });
  const wireKnot = new THREE.Mesh(new THREE.SphereGeometry(0.54, 64, 64), innerHeartMat);
  group.add(wireKnot);

  const auraSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTex,
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  auraSprite.scale.set(6.2, 6.2, 1);
  group.add(auraSprite);

  const ringMat = new THREE.MeshPhysicalMaterial({
    color: 0xfde68a,
    emissive: 0xd97706,
    emissiveIntensity: 0.55,
    roughness: 0.15,
    metalness: 0.92,
    clearcoat: 1.0,
  });
  const astrolabeRing1 = new THREE.Mesh(new THREE.TorusGeometry(2.15, 0.05, 32, 128), ringMat);
  group.add(astrolabeRing1);

  const astrolabeRing2 = new THREE.Mesh(new THREE.TorusGeometry(2.45, 0.04, 32, 128), ringMat);
  astrolabeRing2.rotation.x = Math.PI / 3.2;
  group.add(astrolabeRing2);

  const nodeGeo = new THREE.SphereGeometry(0.1, 32, 32);
  const nodeMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    emissive: 0xfef08a,
    emissiveIntensity: 0.6,
    roughness: 0.1,
    metalness: 0.3,
    clearcoat: 1.0,
  });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const n = new THREE.Mesh(nodeGeo, nodeMat);
    n.position.set(Math.cos(a) * 2.15, Math.sin(a) * 2.15, 0);
    astrolabeRing1.add(n);
  }

  const pCount = 380;
  const pPositions = new Float32Array(pCount * 3);
  let seed = 101;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < pCount; i++) {
    const angle = (i / pCount) * Math.PI * 10;
    const radius = 2.0 + rand() * 2.8;
    pPositions[i * 3] = Math.cos(angle) * radius;
    pPositions[i * 3 + 1] = (rand() - 0.5) * 3.8;
    pPositions[i * 3 + 2] = Math.sin(angle) * radius;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
  const particleRing = new THREE.Points(
    pGeo,
    new THREE.PointsMaterial({
      color: 0xfde047,
      map: glowTex,
      size: 0.32,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  group.add(particleRing);

  return { group, torusKnot, wireKnot, astrolabeRing1, astrolabeRing2, particleRing };
}

// ============================================================================
// ACT 3: MONUMENTAL RUBY-LACQUER RED CRESCENT & PEARL MEDALLION (NO WIREFRAMES)
// ============================================================================
export interface RedCrescentMonumentHandles {
  group: THREE.Group;
  crescentMesh: THREE.Mesh;
  geodesicDome: THREE.Mesh;
  scanRing: THREE.Mesh;
  orbitGroup: THREE.Group;
}

export function buildRedCrescentMonument(): RedCrescentMonumentHandles {
  const group = new THREE.Group();

  const outerR = 1.65;
  const innerR = 1.27;
  const offsetX = 0.52;

  const crescentShape = new THREE.Shape();
  const segments = 128;
  const startAngle = 0.72 * Math.PI;
  const endAngle = 2.28 * Math.PI;

  for (let i = 0; i <= segments; i++) {
    const theta = startAngle + (i / segments) * (endAngle - startAngle);
    const x = Math.cos(theta) * outerR;
    const y = Math.sin(theta) * outerR;
    if (i === 0) crescentShape.moveTo(x, y);
    else crescentShape.lineTo(x, y);
  }

  const innerStart = 2.22 * Math.PI;
  const innerEnd = 0.78 * Math.PI;
  for (let i = 0; i <= segments; i++) {
    const theta = innerStart - (i / segments) * (innerStart - innerEnd);
    const x = offsetX + Math.cos(theta) * innerR;
    const y = Math.sin(theta) * innerR;
    crescentShape.lineTo(x, y);
  }
  crescentShape.closePath();

  const extrudeGeo = new THREE.ExtrudeGeometry(crescentShape, {
    depth: 0.45,
    bevelEnabled: true,
    bevelSegments: 10,
    steps: 2,
    bevelSize: 0.1,
    bevelThickness: 0.1,
    curveSegments: 96,
  });
  extrudeGeo.center();
  extrudeGeo.computeVertexNormals();

  const rubyMat = new THREE.MeshPhysicalMaterial({
    color: 0xe11d48,
    emissive: 0x9f1239,
    emissiveIntensity: 0.55,
    roughness: 0.12,
    metalness: 0.65,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  });
  const crescentMesh = new THREE.Mesh(extrudeGeo, rubyMat);
  crescentMesh.position.y = 0.1;
  group.add(crescentMesh);

  const sanctuaryRingGeo = new THREE.TorusGeometry(2.15, 0.065, 32, 128);
  const sanctuaryRingMat = new THREE.MeshPhysicalMaterial({
    color: 0xf8fafc,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.25,
    roughness: 0.14,
    metalness: 0.85,
    clearcoat: 1.0,
  });
  const geodesicDome = new THREE.Mesh(sanctuaryRingGeo, sanctuaryRingMat);
  geodesicDome.position.y = 0.1;
  group.add(geodesicDome);

  const scanGeo = new THREE.TorusGeometry(2.55, 0.045, 32, 128);
  scanGeo.rotateX(Math.PI / 2);
  const scanRing = new THREE.Mesh(
    scanGeo,
    new THREE.MeshPhysicalMaterial({
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 0.8,
      roughness: 0.15,
      metalness: 0.8,
      clearcoat: 1.0,
    }),
  );
  group.add(scanRing);

  const orbitGroup = new THREE.Group();
  orbitGroup.position.y = 0.1;
  const satColors = [0xfbbf24, 0x38bdf8, 0x10b981];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const satGroup = new THREE.Group();
    const satSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.17, 32, 32),
      new THREE.MeshPhysicalMaterial({
        color: satColors[i],
        emissive: satColors[i],
        emissiveIntensity: 0.7,
        roughness: 0.1,
        metalness: 0.5,
        clearcoat: 1.0,
      }),
    );
    const satHalo = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.022, 20, 64),
      new THREE.MeshBasicMaterial({ color: satColors[i] }),
    );
    satHalo.rotation.x = Math.PI / 2;
    satGroup.add(satSphere, satHalo);
    satGroup.position.set(Math.cos(a) * 2.85, Math.sin(a * 2) * 0.35, Math.sin(a) * 2.85);
    orbitGroup.add(satGroup);
  }
  group.add(orbitGroup);

  return { group, crescentMesh, geodesicDome, scanRing, orbitGroup };
}

function create112EmblemTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0.0, '#0f172a');
  grad.addColorStop(0.25, '#be123c');
  grad.addColorStop(0.5, '#e11d48');
  grad.addColorStop(0.75, '#be123c');
  grad.addColorStop(1.0, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.fillRect(0, 58, 512, 6);
  ctx.fillRect(0, 192, 512, 6);

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 72px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('112', 128, 128);
  ctx.fillText('112', 384, 128);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ============================================================================
// ACT 4: SMOOTH COAXIAL SONIC PULSE RINGS & 112 RESCUE CORE (NO WIREFRAMES)
// ============================================================================
export interface SonicPulseTunnelHandles {
  group: THREE.Group;
  portalRings: THREE.Mesh[];
  coreOctahedron: THREE.Mesh;
  updateTunnel: (elapsed: number, agencyCode: string) => void;
}

export function build112SonicPulseTunnel(): SonicPulseTunnelHandles {
  const group = new THREE.Group();

  const portalRings: THREE.Mesh[] = [];
  const ringCount = 8;
  for (let i = 0; i < ringCount; i++) {
    const radius = 1.85 + i * 0.28;
    const rGeo = new THREE.TorusGeometry(radius, 0.05, 32, 128);
    const rMat = new THREE.MeshPhysicalMaterial({
      color: i % 2 === 0 ? 0xf43f5e : 0x38bdf8,
      emissive: i % 2 === 0 ? 0xe11d48 : 0x0284c7,
      emissiveIntensity: 0.75,
      metalness: 0.85,
      roughness: 0.14,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.88,
    });
    const ring = new THREE.Mesh(rGeo, rMat);
    ring.position.z = 1.2 - i * 0.85;
    group.add(ring);
    portalRings.push(ring);
  }

  const emblemTex = create112EmblemTexture();
  const coreMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: emblemTex,
    emissive: 0xf43f5e,
    emissiveMap: emblemTex,
    emissiveIntensity: 0.7,
    roughness: 0.12,
    metalness: 0.55,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  });
  const coreOctahedron = new THREE.Mesh(new THREE.SphereGeometry(1.18, 64, 64), coreMat);
  group.add(coreOctahedron);

  const c112 = new THREE.Color(0xf43f5e);
  const c115 = new THREE.Color(0x38bdf8);
  const c125 = new THREE.Color(0xf59e0b);
  const c110 = new THREE.Color(0x10b981);

  const updateTunnel = (elapsed: number, agencyCode: string) => {
    const primaryColor =
      agencyCode === '۱۱۲'
        ? c112
        : agencyCode === '۱۱۵'
          ? c115
          : agencyCode === '۱۲۵'
            ? c125
            : c110;

    coreMat.emissive.copy(primaryColor);
    coreOctahedron.rotation.y = elapsed * 0.75;
    coreOctahedron.rotation.x = Math.sin(elapsed * 0.6) * 0.15;

    portalRings.forEach((ring, idx) => {
      const wave = Math.sin(elapsed * 2.8 - idx * 0.55);
      ring.position.z = 1.2 - idx * 0.8 + wave * 0.22;
      ring.rotation.x = Math.sin(elapsed * 0.7 + idx * 0.35) * 0.2;
      ring.rotation.y = Math.cos(elapsed * 0.6 + idx * 0.35) * 0.2;
      const scale = 1.0 + wave * 0.04;
      ring.scale.set(scale, scale, 1);

      const mat = ring.material as THREE.MeshPhysicalMaterial;
      if (idx % 2 === 0) {
        mat.color.copy(primaryColor);
        mat.emissive.copy(primaryColor);
      }
      mat.opacity = 0.55 + (wave * 0.5 + 0.5) * 0.4;
    });
  };

  updateTunnel(0.5, '۱۱۲');

  return { group, portalRings, coreOctahedron, updateTunnel };
}

function createBaniAdamPlanetTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const oceanGrad = ctx.createLinearGradient(0, 0, 0, 512);
  oceanGrad.addColorStop(0.0, '#041028');
  oceanGrad.addColorStop(0.25, '#082f49');
  oceanGrad.addColorStop(0.5, '#0c4a6e');
  oceanGrad.addColorStop(0.75, '#082f49');
  oceanGrad.addColorStop(1.0, '#041028');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, 1024, 512);

  const continents = [
    { x: 580, y: 190, rx: 160, ry: 85, c: 'rgba(16, 185, 129, 0.52)' },
    { x: 540, y: 295, rx: 95, ry: 105, c: 'rgba(16, 185, 129, 0.45)' },
    { x: 260, y: 185, rx: 110, ry: 75, c: 'rgba(20, 184, 166, 0.45)' },
    { x: 325, y: 340, rx: 75, ry: 95, c: 'rgba(16, 185, 129, 0.45)' },
    { x: 790, y: 350, rx: 65, ry: 50, c: 'rgba(56, 189, 248, 0.45)' },
  ];

  continents.forEach((cont) => {
    const rg = ctx.createRadialGradient(cont.x, cont.y, 10, cont.x, cont.y, cont.rx);
    rg.addColorStop(0.0, cont.c);
    rg.addColorStop(0.65, 'rgba(245, 158, 11, 0.25)');
    rg.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.ellipse(cont.x, cont.y, cont.rx, cont.ry, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  let seed = 313;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < 420; i++) {
    const cluster = continents[i % continents.length];
    const angle = rand() * Math.PI * 2;
    const dist = Math.sqrt(rand());
    const x = cluster.x + Math.cos(angle) * dist * cluster.rx * 0.85;
    const y = cluster.y + Math.sin(angle) * dist * cluster.ry * 0.85;
    const r = 1.2 + rand() * 2.8;

    const dotGrad = ctx.createRadialGradient(x, y, 0.2, x, y, r * 2.2);
    dotGrad.addColorStop(0.0, 'rgba(254, 240, 138, 0.95)');
    dotGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.55)');
    dotGrad.addColorStop(1.0, 'rgba(245, 158, 11, 0.0)');
    ctx.fillStyle = dotGrad;
    ctx.beginPath();
    ctx.arc(x, y, r * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ============================================================================
// ACT 5: ILLUMINATED PLANET EARTH OF BANI ADAM & GOLDEN ORBITALS (NO WIREFRAMES)
// ============================================================================
export interface BaniAdamEarthHandles {
  group: THREE.Group;
  pointCloudGlobe: THREE.Points;
  geodesicShell: THREE.Mesh;
  orbitalRing1: THREE.Mesh;
  orbitalRing2: THREE.Mesh;
  orbitalRing3: THREE.Mesh;
}

export function buildBaniAdamConstellationEarth(
  glowTex: THREE.CanvasTexture,
): BaniAdamEarthHandles {
  const group = new THREE.Group();

  const planetTex = createBaniAdamPlanetTexture();
  const planetMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: planetTex,
    emissive: 0xffffff,
    emissiveMap: planetTex,
    emissiveIntensity: 0.65,
    roughness: 0.2,
    metalness: 0.3,
    clearcoat: 0.9,
    clearcoatRoughness: 0.1,
  });
  const geodesicShell = new THREE.Mesh(new THREE.SphereGeometry(1.85, 64, 64), planetMat);
  group.add(geodesicShell);

  const atmoSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTex,
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  atmoSprite.scale.set(6.0, 6.0, 1);
  group.add(atmoSprite);

  const nodeCount = 520;
  const positions = new Float32Array(nodeCount * 3);
  const colors = new Float32Array(nodeCount * 3);
  const radius = 2.02;
  const goldenRatio = (1 + Math.sqrt(5)) / 2;

  const cGold = new THREE.Color(0xfde047);
  const cEmerald = new THREE.Color(0x34d399);
  const cCyan = new THREE.Color(0x38bdf8);

  for (let i = 0; i < nodeCount; i++) {
    const theta = (2 * Math.PI * i) / goldenRatio;
    const phi = Math.acos(1 - (2 * (i + 0.5)) / nodeCount);

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    const c = i % 3 === 0 ? cGold : i % 3 === 1 ? cEmerald : cCyan;
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const pointCloudGlobe = new THREE.Points(
    pGeo,
    new THREE.PointsMaterial({
      size: 0.2,
      map: glowTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  group.add(pointCloudGlobe);

  const ringMatGold = new THREE.MeshPhysicalMaterial({
    color: 0xfbbf24,
    emissive: 0xd97706,
    emissiveIntensity: 0.55,
    metalness: 0.9,
    roughness: 0.14,
    clearcoat: 1.0,
  });
  const ringMatCyan = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.55,
    metalness: 0.9,
    roughness: 0.14,
    clearcoat: 1.0,
  });

  const orbitalRing1 = new THREE.Mesh(new THREE.TorusGeometry(2.45, 0.045, 32, 128), ringMatGold);
  orbitalRing1.rotation.x = Math.PI / 2.4;
  group.add(orbitalRing1);

  const orbitalRing2 = new THREE.Mesh(new THREE.TorusGeometry(2.72, 0.038, 32, 128), ringMatCyan);
  orbitalRing2.rotation.x = -Math.PI / 3.1;
  orbitalRing2.rotation.y = Math.PI / 5;
  group.add(orbitalRing2);

  const orbitalRing3 = new THREE.Mesh(new THREE.TorusGeometry(2.98, 0.032, 32, 128), ringMatGold);
  orbitalRing3.rotation.y = Math.PI / 2.2;
  group.add(orbitalRing3);

  return {
    group,
    pointCloudGlobe,
    geodesicShell,
    orbitalRing1,
    orbitalRing2,
    orbitalRing3,
  };
}

// ============================================================================
// ACT 00 (INTRO): SUPERSONIC 3D AEROSPACE ROCKET & SONIC BOOM SHOCKWAVES
// ============================================================================
export interface SupersonicRocketHandles {
  group: THREE.Group;
  rocketBody: THREE.Group;
  plumeGroup: THREE.Group;
  shockRings: THREE.Mesh[];
  updateRocket: (introProgress: number, elapsed: number) => void;
}

export function buildSupersonic3DRocket(glowTex: THREE.CanvasTexture): SupersonicRocketHandles {
  const group = new THREE.Group();
  const rocketBody = new THREE.Group();
  group.add(rocketBody);

  // 1. Sculpted Aerodynamic Fuselage + Ogive Nose Cone via LatheGeometry (64 radial segments)
  const profilePoints: THREE.Vector2[] = [];
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps; // 0 = tail (y = -2.2), 1 = nose tip (y = +2.8)
    const y = -2.2 + t * 5.0;
    let r = 0.62;
    if (t < 0.12) {
      r = 0.44 + (t / 0.12) * 0.18;
    } else if (t > 0.6) {
      const nt = (t - 0.6) / 0.4;
      r = 0.62 * Math.cos(nt * Math.PI * 0.5);
    } else {
      r = 0.62 + Math.sin((t - 0.12) * Math.PI * 2.0) * 0.035;
    }
    profilePoints.push(new THREE.Vector2(Math.max(0.001, r), y));
  }

  const hullGeo = new THREE.LatheGeometry(profilePoints, 64);
  hullGeo.computeVertexNormals();

  const hullMat = new THREE.MeshPhysicalMaterial({
    color: 0xf8fafc,
    roughness: 0.12,
    metalness: 0.82,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  });
  rocketBody.add(new THREE.Mesh(hullGeo, hullMat));

  // 2. Crimson-Lacquer Nose Tip & Swept Delta Fins
  const crimsonMat = new THREE.MeshPhysicalMaterial({
    color: 0xe11d48,
    emissive: 0x9f1239,
    emissiveIntensity: 0.5,
    roughness: 0.14,
    metalness: 0.72,
    clearcoat: 1.0,
  });
  const noseCap = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.05, 64), crimsonMat);
  noseCap.position.y = 2.4;
  rocketBody.add(noseCap);

  // 3. 24K Gold Structural Rings
  const goldMat = new THREE.MeshPhysicalMaterial({
    color: 0xfbbf24,
    emissive: 0xd97706,
    emissiveIntensity: 0.45,
    roughness: 0.12,
    metalness: 0.94,
    clearcoat: 1.0,
  });
  [-1.4, -0.35, 0.85, 1.72].forEach((ry, idx) => {
    const rad = idx === 3 ? 0.49 : idx === 0 ? 0.58 : 0.65;
    const band = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.042, 24, 96), goldMat);
    band.rotation.x = Math.PI / 2;
    band.position.y = ry;
    rocketBody.add(band);
  });

  // 4. Illuminated Cyan Plasma Cockpit Window + Gold Porthole Frame
  const windowFrame = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.042, 24, 64), goldMat);
  windowFrame.position.set(0, 0.48, 0.6);
  rocketBody.add(windowFrame);

  const windowGlass = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 32, 32),
    new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 1.4,
      roughness: 0.05,
      metalness: 0.2,
      clearcoat: 1.0,
    }),
  );
  windowGlass.scale.set(1, 1, 0.45);
  windowGlass.position.set(0, 0.48, 0.56);
  rocketBody.add(windowGlass);

  // 5. Four Swept Aerodynamic Delta Fins + Gold Booster Pods
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0.45);
  finShape.lineTo(1.05, -0.55);
  finShape.lineTo(0.92, -1.3);
  finShape.lineTo(0, -0.88);
  finShape.closePath();

  const finGeo = new THREE.ExtrudeGeometry(finShape, {
    depth: 0.09,
    bevelEnabled: true,
    bevelSegments: 6,
    steps: 1,
    bevelSize: 0.025,
    bevelThickness: 0.025,
  });
  finGeo.center();

  for (let i = 0; i < 4; i++) {
    const finPivot = new THREE.Group();
    finPivot.rotation.y = (i * Math.PI) / 2 + Math.PI / 4;
    const finMesh = new THREE.Mesh(finGeo, crimsonMat);
    finMesh.position.set(0.84, -1.35, 0);
    finPivot.add(finMesh);

    const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.85, 24), goldMat);
    pod.position.set(1.28, -1.5, 0);
    finPivot.add(pod);

    rocketBody.add(finPivot);
  }

  // 6. Triple Engine Bell Nozzles at Base
  const nozzleMat = new THREE.MeshPhysicalMaterial({
    color: 0x334155,
    emissive: 0x0ea5e9,
    emissiveIntensity: 0.4,
    roughness: 0.18,
    metalness: 0.9,
    clearcoat: 1.0,
  });
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 0.58, 32), nozzleMat);
    nozzle.position.set(Math.cos(a) * 0.24, -2.42, Math.sin(a) * 0.24);
    rocketBody.add(nozzle);
  }

  // 7. Blazing Multi-Layer Afterburner Plasma Plume
  const plumeGroup = new THREE.Group();
  plumeGroup.position.y = -2.68;
  rocketBody.add(plumeGroup);

  const innerPlumeGeo = new THREE.ConeGeometry(0.38, 3.0, 32);
  innerPlumeGeo.rotateX(Math.PI);
  innerPlumeGeo.translate(0, -1.3, 0);
  const innerPlume = new THREE.Mesh(
    innerPlumeGeo,
    new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  plumeGroup.add(innerPlume);

  const outerPlumeGeo = new THREE.ConeGeometry(0.68, 5.2, 32);
  outerPlumeGeo.rotateX(Math.PI);
  outerPlumeGeo.translate(0, -2.3, 0);
  const outerPlume = new THREE.Mesh(
    outerPlumeGeo,
    new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  plumeGroup.add(outerPlume);

  const engineGlowSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTex,
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  engineGlowSprite.scale.set(4.6, 4.6, 1);
  plumeGroup.add(engineGlowSprite);

  // 8. Three Expanding Sonic-Boom Shockwave Rings as Rocket Blasts Between the Two Names
  const shockRings: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const rGeo = new THREE.TorusGeometry(1.15 + i * 0.38, 0.055, 24, 128);
    const rMat = new THREE.MeshBasicMaterial({
      color: i % 2 === 0 ? 0xfbbf24 : 0x38bdf8,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const rMesh = new THREE.Mesh(rGeo, rMat);
    group.add(rMesh);
    shockRings.push(rMesh);
  }

  // Note: Act 1 camera is at (0, 2.2, 39.5) looking at (0, 0.3, 28.0).
  // So in world space around Act 1 (`Z = 28.0`), the rocket starts behind at `Z = 14.0, Y = -0.8`,
  // flies straight between the two creator wings at `Z = 28.5, Y = 0.7`, and zooms past the camera to `Z = 42.5, Y = 2.6`!
  const updateRocket = (introProgress: number, elapsed: number) => {
    if (introProgress >= 1.0) {
      group.visible = false;
      return;
    }
    group.visible = true;

    const flightT = THREE.MathUtils.smoothstep(introProgress, 0.0, 0.92);
    const easeFlight = Math.pow(flightT, 1.25);

    // Ascend and blast forward right through the gap between the two creator wings (X = 0, Z = 23..38, Y = -2.2..+3.2)
    const zPos = THREE.MathUtils.lerp(22.5, 38.2, easeFlight);
    const yPos = THREE.MathUtils.lerp(-2.1, 3.1, easeFlight);
    const xPos = Math.sin(flightT * Math.PI * 2.0) * 0.14 * (1.0 - flightT);

    rocketBody.position.set(xPos, yPos, zPos);
    rocketBody.scale.setScalar(1.08);

    // Dynamic 3/4 heroic aerospace angle so nose cone, cockpit window, delta fins, and plasma plume all shine!
    rocketBody.rotation.x = Math.PI * 0.22;
    rocketBody.rotation.z = -0.16 + Math.sin(elapsed * 3.0) * 0.08;
    rocketBody.rotation.y = elapsed * 1.4;

    const flicker = 0.9 + Math.sin(elapsed * 42.0) * 0.18;
    plumeGroup.scale.set(1.0, flicker, 1.0);

    shockRings.forEach((ring) => {
      (ring.material as THREE.MeshBasicMaterial).opacity = 0;
    });
  };

  return { group, rocketBody, plumeGroup, shockRings, updateRocket };
}

