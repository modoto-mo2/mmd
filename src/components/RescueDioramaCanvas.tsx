import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  build112SonicPulseTunnel,
  buildBaniAdamConstellationEarth,
  buildFloatingCurvedPhotoPlate,
  buildGoldenFetratVortex,
  buildRedCrescentMonument,
  buildSeismicWaveTerrain,
  buildSupersonic3DRocket,
  createCosmicBackdropTexture,
  createGlowParticleTexture,
} from '../three/proceduralModels';
import { CHAPTERS } from '../data/conferenceData';
import {
  CENTRAL_INSURANCE_JPG,
  DASTAN_RASTAN_JPG,
  GLOSSARY_JPG,
  MEDICAL_CENTER_JPG,
  STUDENT_CARD_JPG,
  THIRD_PARTY_POLICY_JPG,
  WORKERS_INSURANCE_JPG,
} from '../data/lesson6Photos';
import {
  advanceIntroProgress,
  computeCompactStackPositions,
  computeIntroTimelineState,
  computeIntroWallPortalTransform,
  computeSceneStateFromScroll,
  computeWallPortalTransform,
  getSpatialNodeRole,
} from '../utils/presentationLogic';

export type LightingPreset = 'tactical-night' | 'golden-hope' | 'daylight-relief';

export interface RescueDioramaProps {
  scrollNormalized: number;
  activeChapterIndex: number;
  cameraOverride: [number, number, number] | null;
  targetOverride: [number, number, number] | null;
  explodedFactor: number;
  lightingPreset: LightingPreset;
  activeEmergencyCode: string;
  isCinemaMode?: boolean;
  seismicPulseCount?: number;
  swapWings?: boolean;
  introRunId?: number;
}

const _lookAtVec = new THREE.Vector3();
const _projVec = new THREE.Vector3();
const _camSpaceVec = new THREE.Vector3();

// Central 3D Corridor Coordinates for the 5 Acts (Camera flies straight through them;
// 3D-projected holographic text wings float in 3D space around each sculpture!)
export const ACT_POSITIONS: [number, number, number][] = [
  [0.0, -0.3, 28.0], // Act 1: Seismic Wavefield & Tectonic Core
  [0.0, 0.1, 0.0], // Act 2: Golden Fetrat Torus-Knot & Particle Galaxy
  [0.0, 0.1, -28.0], // Act 3: Monumental 3D Red Crescent & Geodesic Radar Dome
  [0.0, 0.1, -56.0], // Act 4: 112 Sonic Pulse Hexagonal Tunnel
  [0.0, 0.1, -84.0], // Act 5: 900-Node Fibonacci Constellation Earth of Bani Adam
];

export default function RescueDioramaCanvas({
  scrollNormalized,
  activeChapterIndex,
  cameraOverride,
  targetOverride,
  explodedFactor,
  lightingPreset,
  activeEmergencyCode,
  isCinemaMode = false,
  seismicPulseCount = 0,
  swapWings = false,
  introRunId = 0,
}: RescueDioramaProps) {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const triggerRenderRef = useRef<(() => void) | null>(null);
  const startSoftwareIntroRef = useRef<(() => void) | null>(null);

  const stateRef = useRef({
    scrollNormalized,
    activeChapterIndex,
    cameraOverride,
    targetOverride,
    explodedFactor,
    lightingPreset,
    activeEmergencyCode,
    isCinemaMode,
    introProgress: 0.0,
    seismicPulseBoost: 0,
    userAzimuthOffset: 0,
    userElevationOffset: 0,
    pointerParallaxX: 0,
    pointerParallaxY: 0,
  });

  useEffect(() => {
    stateRef.current.scrollNormalized = scrollNormalized;
    stateRef.current.activeChapterIndex = activeChapterIndex;
    stateRef.current.cameraOverride = cameraOverride;
    stateRef.current.targetOverride = targetOverride;
    stateRef.current.explodedFactor = explodedFactor;
    stateRef.current.lightingPreset = lightingPreset;
    stateRef.current.activeEmergencyCode = activeEmergencyCode;
    stateRef.current.isCinemaMode = isCinemaMode;
    if (scrollNormalized > 0.04) {
      stateRef.current.introProgress = 1.0;
    }
    triggerRenderRef.current?.();
  }, [
    scrollNormalized,
    activeChapterIndex,
    cameraOverride,
    targetOverride,
    explodedFactor,
    lightingPreset,
    activeEmergencyCode,
    isCinemaMode,
    swapWings,
  ]);

  useEffect(() => {
    stateRef.current.introProgress = 0.0;
    startSoftwareIntroRef.current?.();
    triggerRenderRef.current?.();
  }, [introRunId]);

  useEffect(() => {
    if (seismicPulseCount > 0) {
      stateRef.current.seismicPulseBoost = 1.0;
      triggerRenderRef.current?.();
    }
  }, [seismicPulseCount]);

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050814, 0.016);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    pmremGenerator.dispose();

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const textureLoader = new THREE.TextureLoader();
    const glowTex = createGlowParticleTexture();

    const skyTextures: Record<LightingPreset, THREE.CanvasTexture> = {
      'tactical-night': createCosmicBackdropTexture('tactical-night'),
      'golden-hope': createCosmicBackdropTexture('golden-hope'),
      'daylight-relief': createCosmicBackdropTexture('daylight-relief'),
    };
    scene.background = skyTextures['tactical-night'];

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      200,
    );
    const initialWp = CHAPTERS[0].camera;
    camera.position.set(...initialWp.position);
    _lookAtVec.set(...initialWp.target);
    camera.lookAt(_lookAtVec);

    // Studio & Neon Rim Lighting
    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x1e1b4b, 1.15);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1d6, 2.6);
    keyLight.position.set(14, 24, 20);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xf43f5e, 1.8);
    rimLight.position.set(-16, 12, -16);
    scene.add(rimLight);

    // =========================================================================
    // S-CURVE 3D LUMINOUS PARTICLE STREAM CONNECTING ALL 5 ACTS (NO SOLID LINES)
    // =========================================================================
    const splinePoints = [
      new THREE.Vector3(0.0, -2.2, 34.0),
      new THREE.Vector3(0.0, -1.9, 28.0),
      new THREE.Vector3(2.2, -1.8, 14.0),
      new THREE.Vector3(0.0, -1.8, 0.0),
      new THREE.Vector3(-2.2, -1.8, -14.0),
      new THREE.Vector3(0.0, -1.8, -28.0),
      new THREE.Vector3(2.2, -1.8, -42.0),
      new THREE.Vector3(0.0, -1.8, -56.0),
      new THREE.Vector3(-2.2, -1.8, -70.0),
      new THREE.Vector3(0.0, -1.8, -84.0),
      new THREE.Vector3(0.0, -2.2, -92.0),
    ];
    const splineCurve = new THREE.CatmullRomCurve3(splinePoints);
    const streamCount = 260;
    const streamPos = new Float32Array(streamCount * 3);
    for (let i = 0; i < streamCount; i++) {
      const pt = splineCurve.getPoint(i / (streamCount - 1));
      streamPos[i * 3] = pt.x + Math.sin(i * 1.7) * 0.35;
      streamPos[i * 3 + 1] = pt.y + Math.cos(i * 1.3) * 0.15;
      streamPos[i * 3 + 2] = pt.z;
    }
    const streamGeo = new THREE.BufferGeometry();
    streamGeo.setAttribute('position', new THREE.BufferAttribute(streamPos, 3));
    const streamPoints = new THREE.Points(
      streamGeo,
      new THREE.PointsMaterial({
        color: 0x38bdf8,
        map: glowTex,
        size: 0.38,
        transparent: true,
        opacity: 0.65,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    scene.add(streamPoints);

    // =========================================================================
    // ACT 1 (Z = +28): REAL-TIME 3D SEISMIC WAVEFIELD & HOLOGRAMS
    // =========================================================================
    const act1Group = new THREE.Group();
    act1Group.position.set(...ACT_POSITIONS[0]);
    scene.add(act1Group);

    const seismicWave = buildSeismicWaveTerrain();
    act1Group.add(seismicWave.group);

    const plateEq = buildFloatingCurvedPhotoPlate(
      STUDENT_CARD_JPG,
      2.2,
      1.65,
      0xf43f5e,
      textureLoader,
      maxAniso,
    );
    plateEq.position.set(-2.35, 1.9, -1.6);
    plateEq.rotation.y = 0.28;
    act1Group.add(plateEq);

    const plateFlood = buildFloatingCurvedPhotoPlate(
      CENTRAL_INSURANCE_JPG,
      1.65,
      2.35,
      0x38bdf8,
      textureLoader,
      maxAniso,
    );
    plateFlood.position.set(2.35, 1.9, -1.6);
    plateFlood.rotation.y = -0.28;
    act1Group.add(plateFlood);

    // =========================================================================
    // ACT 2 (Z = 0): GOLDEN TORUS-KNOT & CENTRAL INSURANCE GALAXY VORTEX
    // =========================================================================
    const act2Group = new THREE.Group();
    act2Group.position.set(...ACT_POSITIONS[1]);
    scene.add(act2Group);

    const goldenVortex = buildGoldenFetratVortex(glowTex);
    act2Group.add(goldenVortex.group);

    const plateMaidah = buildFloatingCurvedPhotoPlate(
      CENTRAL_INSURANCE_JPG,
      1.75,
      2.35,
      0xf59e0b,
      textureLoader,
      maxAniso,
    );
    plateMaidah.position.set(-2.6, 1.3, -1.8);
    plateMaidah.rotation.y = 0.25;
    act2Group.add(plateMaidah);

    const plateCovid = buildFloatingCurvedPhotoPlate(
      MEDICAL_CENTER_JPG,
      2.15,
      1.6,
      0x38bdf8,
      textureLoader,
      maxAniso,
    );
    plateCovid.position.set(2.6, 1.3, -1.8);
    plateCovid.rotation.y = -0.25;
    act2Group.add(plateCovid);

    // =========================================================================
    // ACT 3 (Z = -28): MONUMENTAL 3D SHIELD & THIRD-PARTY / WORKERS INSURANCE
    // =========================================================================
    const act3Group = new THREE.Group();
    act3Group.position.set(...ACT_POSITIONS[2]);
    scene.add(act3Group);

    const rcMonument = buildRedCrescentMonument();
    act3Group.add(rcMonument.group);

    const plateHeli = buildFloatingCurvedPhotoPlate(
      THIRD_PARTY_POLICY_JPG,
      1.95,
      2.15,
      0xe11d48,
      textureLoader,
      maxAniso,
    );
    plateHeli.position.set(-2.6, 1.6, -1.8);
    plateHeli.rotation.y = 0.28;
    act3Group.add(plateHeli);

    const plateYouth = buildFloatingCurvedPhotoPlate(
      WORKERS_INSURANCE_JPG,
      2.35,
      1.35,
      0xe11d48,
      textureLoader,
      maxAniso,
    );
    plateYouth.position.set(2.6, 1.6, -1.8);
    plateYouth.rotation.y = -0.28;
    act3Group.add(plateYouth);

    // =========================================================================
    // ACT 4 (Z = -56): SOCIAL SECURITY SONIC PULSE TUNNEL & DASTAN RASTAN
    // =========================================================================
    const act4Group = new THREE.Group();
    act4Group.position.set(...ACT_POSITIONS[3]);
    scene.add(act4Group);

    const sonicTunnel = build112SonicPulseTunnel();
    act4Group.add(sonicTunnel.group);

    const plate112 = buildFloatingCurvedPhotoPlate(
      DASTAN_RASTAN_JPG,
      2.45,
      1.65,
      0x38bdf8,
      textureLoader,
      maxAniso,
    );
    plate112.position.set(0.0, 1.5, -2.4);
    act4Group.add(plate112);

    // =========================================================================
    // ACT 5 (Z = -84): 900-NODE CONSTELLATION EARTH & LESSON 6 GLOSSARY
    // =========================================================================
    const act5Group = new THREE.Group();
    act5Group.position.set(...ACT_POSITIONS[4]);
    scene.add(act5Group);

    const baniAdamEarth = buildBaniAdamConstellationEarth(glowTex);
    act5Group.add(baniAdamEarth.group);

    const plateGlossary = buildFloatingCurvedPhotoPlate(
      GLOSSARY_JPG,
      2.35,
      1.8,
      0x10b981,
      textureLoader,
      maxAniso,
    );
    plateGlossary.position.set(0.0, 1.65, -2.5);
    act5Group.add(plateGlossary);

    // =========================================================================
    // ACT 00 (INTRO): HIDE 3D ROCKET (USING 2D VERTICAL ROCKET IN EXACT CENTER)
    // =========================================================================
    const supersonicRocket = buildSupersonic3DRocket(glowTex);
    supersonicRocket.group.visible = false;

    // =========================================================================
    // AMBIENT 3D COSMIC STARFIELD PARTICLES ALONG THE ENTIRE CORRIDOR
    // =========================================================================
    const cosmicCount = 700;
    const cosmicPos = new Float32Array(cosmicCount * 3);
    let seed = 333;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < cosmicCount; i++) {
      cosmicPos[i * 3] = (rand() - 0.5) * 32;
      cosmicPos[i * 3 + 1] = (rand() - 0.3) * 18;
      cosmicPos[i * 3 + 2] = 38 - rand() * 135;
    }
    const cosmicGeo = new THREE.BufferGeometry();
    cosmicGeo.setAttribute('position', new THREE.BufferAttribute(cosmicPos, 3));
    const cosmicPoints = new THREE.Points(
      cosmicGeo,
      new THREE.PointsMaterial({
        color: 0xbae6fd,
        map: glowTex,
        size: 0.24,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    scene.add(cosmicPoints);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let lastTimeSec = performance.now() * 0.001;
    let elapsed = 0.8;
    let frameId = 0;
    let isDisposed = false;
    let currentSkyPreset: LightingPreset = 'tactical-night';
    const nodePresenceMap = new Map<HTMLElement, number>();
    const nodeLastScreenMap = new Map<
      HTMLElement,
      { screenX: number; screenY: number; scale: number; depthZ: number }
    >();

    /**
     * Projects all DOM elements marked with `data-spatial-node` from their 3D world
     * coordinates `(data-world-x, data-world-y, data-world-z)` directly through the
     * live Three.js `camera` matrix, and drives their 3D wall-portal entry/exit trajectories
     * so cards burst in from the ceiling/side walls and fly back out into the walls!
     */
    function updateSpatialDomNodes(dt: number) {
      const st = stateRef.current;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const isCompact = vw < 1024;
      const nodes = document.querySelectorAll<HTMLElement>('[data-spatial-node]');
      const introTimeline = computeIntroTimelineState(st.introProgress, vh);

      // Precompute non-overlapping vertical stack layout per chapter on mobile/compact viewports
      const compactNodeLayout = new Map<
        HTMLElement,
        { centerY: number; stackScale: number }
      >();

      if (isCompact) {
        const chapterGroups: HTMLElement[][] = [[], [], [], [], []];
        nodes.forEach((el) => {
          if (el.dataset.introNode === 'true') return;
          const wz = parseFloat(el.dataset.worldZ || '0');
          let bestIdx = 0;
          let bestDist = Infinity;
          for (let i = 0; i < ACT_POSITIONS.length; i++) {
            const d = Math.abs(wz - ACT_POSITIONS[i][2]);
            if (d < bestDist) {
              bestDist = d;
              bestIdx = i;
            }
          }
          chapterGroups[bestIdx].push(el);
        });

        for (let i = 0; i < chapterGroups.length; i++) {
          const grp = chapterGroups[i];
          if (grp.length === 0) continue;
          // Sort: Header (worldX ~ 0) first, then Right Wing (worldX > 0), then Left Wing (worldX < 0)
          grp.sort((a, b) => {
            const ax = parseFloat(a.dataset.worldX || '0');
            const bx = parseFloat(b.dataset.worldX || '0');
            const rank = (x: number) => (Math.abs(x) < 0.1 ? 0 : x > 0 ? 1 : 2);
            return rank(ax) - rank(bx);
          });

          const heights = grp.map((el) => el.offsetHeight || 160);
          const layout = computeCompactStackPositions(heights, vh, 58, 72, 8);
          grp.forEach((el, slotIdx) => {
            compactNodeLayout.set(el, {
              centerY: layout.centerYs[slotIdx] ?? vh * 0.5,
              stackScale: layout.scale,
            });
          });
        }
      }

      nodes.forEach((el) => {
        const isIntroNode = el.dataset.introNode === 'true';
        const baseWx = parseFloat(el.dataset.worldX || '0');
        const role = getSpatialNodeRole(baseWx);

        // Gentle movement on the two creator wings as the rocket glides between them
        const rocketShock = isIntroNode
          ? Math.exp(-Math.pow((st.introProgress - 0.44) / 0.16, 2))
          : 0;
        const shockOffsetX = Math.sign(baseWx) * rocketShock * 0.18;

        const wx = (baseWx + shockOffsetX) * (isCompact ? 0.35 : 1.0);
        const wy = parseFloat(el.dataset.worldY || '0');
        const wz = parseFloat(el.dataset.worldZ || '0');
        const baseRotY = parseFloat(el.dataset.rotY || '0') * (isCompact ? 0.18 : 1.0);
        const baseRotX = parseFloat(el.dataset.rotX || '0');

        _projVec.set(wx, wy, wz);
        _camSpaceVec.copy(_projVec).applyMatrix4(camera.matrixWorldInverse);
        const depthZ = -_camSpaceVec.z; // positive distance in front of camera

        if (isIntroNode) {
          if (depthZ <= 2.2 || depthZ >= 34.0) {
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
            el.style.visibility = 'hidden';
            return;
          }

          _projVec.project(camera);
          let screenX = (_projVec.x * 0.5 + 0.5) * vw;
          let screenY = (-_projVec.y * 0.5 + 0.5) * vh;
          const rawScale = 11.5 / depthZ;
          let scale = THREE.MathUtils.clamp(rawScale, 0.28, 1.38);

          if (isCompact) {
            scale = 0.96;
            if (role === 'header') {
              screenX = vw * 0.5;
              screenY = vh * 0.22;
            } else if (role === 'right') {
              screenX = vw * 0.79 + shockOffsetX * 8.0;
              screenY = vh * 0.48;
            } else {
              screenX = vw * 0.21 + shockOffsetX * 8.0;
              screenY = vh * 0.48;
            }
          }

          const introPortal = computeIntroWallPortalTransform(role, st.introProgress, vw, vh);
          const finalOpacity = introPortal.opacity * introTimeline.introNodeAlpha;

          if (finalOpacity <= 0.01) {
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
            el.style.visibility = 'hidden';
            return;
          }

          const finalX = screenX + introPortal.offsetX;
          const finalY = screenY + introPortal.offsetY;
          const finalScale = scale * introPortal.scaleMultiplier;
          const dynamicRotY =
            baseRotY +
            introPortal.rotY -
            st.userAzimuthOffset * (isCompact ? 14.0 : 38.0) +
            st.pointerParallaxX * (isCompact ? -3.0 : -7.5);
          const dynamicRotX =
            baseRotX +
            introPortal.rotX +
            st.userElevationOffset * (isCompact ? 10.0 : 26.0) +
            st.pointerParallaxY * (isCompact ? 2.5 : 5.5);
          const dynamicRotZ = introPortal.rotZ;

          el.style.visibility = 'visible';
          el.style.opacity = finalOpacity.toFixed(3);
          el.style.pointerEvents = finalOpacity > 0.45 ? 'auto' : 'none';
          el.style.zIndex = '45';
          el.style.transform = `translate3d(${finalX.toFixed(1)}px, ${finalY.toFixed(1)}px, 0px) translate(-50%, -50%) perspective(1200px) rotateY(${dynamicRotY.toFixed(2)}deg) rotateX(${dynamicRotX.toFixed(2)}deg) rotateZ(${dynamicRotZ.toFixed(2)}deg) scale(${finalScale.toFixed(3)})`;
          return;
        }

        // Chapter Spatial Nodes: Compute targetPresence in [0..1]
        const inCorridor = !st.isCinemaMode && depthZ > 2.2 && depthZ < 34.0;
        let depthPresence = 0;
        if (inCorridor) {
          if (depthZ < 8.2) {
            depthPresence = THREE.MathUtils.clamp((depthZ - 3.2) / 5.0, 0, 1);
          } else if (depthZ > 14.8) {
            depthPresence = THREE.MathUtils.clamp(1.0 - (depthZ - 14.8) / 11.5, 0, 1);
          } else {
            depthPresence = 1.0;
          }
        }
        const targetPresence = depthPresence * introTimeline.chapterNodeAlpha;
        const prevPresence = nodePresenceMap.get(el) ?? targetPresence;

        // Role-staggered spring damping so Header, Right Wing, and Left Wing cascade naturally from the walls
        const dampLambda = role === 'header' ? 9.5 : role === 'right' ? 8.0 : 6.8;
        let currentPresence =
          dt <= 0
            ? targetPresence
            : THREE.MathUtils.damp(prevPresence, targetPresence, dampLambda, dt);
        if (Math.abs(currentPresence - targetPresence) < 0.002) {
          currentPresence = targetPresence;
        }
        nodePresenceMap.set(el, currentPresence);

        if (currentPresence <= 0.005) {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
          el.style.visibility = 'hidden';
          return;
        }

        // Project settled 3D / responsive anchor coordinates (or reuse last valid anchor while exiting to walls)
        let screenX: number;
        let screenY: number;
        let scale: number;
        const safeDepthZ = THREE.MathUtils.clamp(depthZ, 4.5, 28.0);

        if (depthZ > 2.2 && depthZ < 34.0) {
          _projVec.project(camera);
          screenX = (_projVec.x * 0.5 + 0.5) * vw;
          screenY = (-_projVec.y * 0.5 + 0.5) * vh;
          const rawScale = 11.5 / safeDepthZ;
          scale = THREE.MathUtils.clamp(rawScale, 0.28, 1.38);

          if (isCompact) {
            const compactInfo = compactNodeLayout.get(el);
            if (compactInfo) {
              const depthFactor = THREE.MathUtils.clamp(11.5 / safeDepthZ, 0.88, 1.0);
              scale = compactInfo.stackScale * depthFactor;
              screenX = vw * 0.5 + st.pointerParallaxX * 3.0;
              screenY = compactInfo.centerY;
            }
          }
          nodeLastScreenMap.set(el, { screenX, screenY, scale, depthZ: safeDepthZ });
        } else {
          const cached = nodeLastScreenMap.get(el);
          screenX = cached ? cached.screenX : vw * 0.5;
          screenY = cached ? cached.screenY : vh * 0.5;
          scale = cached ? cached.scale : 0.85;
        }

        const wallPortal = computeWallPortalTransform(role, currentPresence, vw, vh);
        const finalX = screenX + wallPortal.offsetX;
        const finalY = screenY + wallPortal.offsetY;
        const finalScale = scale * wallPortal.scaleMultiplier;
        const finalOpacity = wallPortal.opacity;

        // Dynamic 3D tilt coupled to wall-portal swing + camera orbit + mouse parallax!
        const dynamicRotY =
          baseRotY +
          wallPortal.rotY -
          st.userAzimuthOffset * (isCompact ? 14.0 : 38.0) +
          st.pointerParallaxX * (isCompact ? -3.0 : -7.5);
        const dynamicRotX =
          baseRotX +
          wallPortal.rotX +
          st.userElevationOffset * (isCompact ? 10.0 : 26.0) +
          st.pointerParallaxY * (isCompact ? 2.5 : 5.5);
        const dynamicRotZ = wallPortal.rotZ;

        el.style.visibility = finalOpacity > 0.02 ? 'visible' : 'hidden';
        el.style.opacity = finalOpacity.toFixed(3);
        el.style.pointerEvents = currentPresence > 0.65 ? 'auto' : 'none';
        el.style.zIndex = String(Math.max(10, Math.round(90 - safeDepthZ)));
        el.style.transform = `translate3d(${finalX.toFixed(1)}px, ${finalY.toFixed(1)}px, 0px) translate(-50%, -50%) perspective(1200px) rotateY(${dynamicRotY.toFixed(2)}deg) rotateX(${dynamicRotX.toFixed(2)}deg) rotateZ(${dynamicRotZ.toFixed(2)}deg) scale(${finalScale.toFixed(3)})`;
      });

      // Animate 2D vertical rocket straight from bottom to top in the exact horizontal center in 1.8s
      const rocketEl = document.querySelector<HTMLElement>('[data-intro-rocket="true"]');
      if (rocketEl) {
        if (!introTimeline.rocketVisible) {
          rocketEl.style.opacity = '0';
          rocketEl.style.visibility = 'hidden';
        } else {
          rocketEl.style.visibility = 'visible';
          rocketEl.style.opacity = introTimeline.rocketOpacity.toFixed(3);
          rocketEl.style.transform = `translate3d(-50%, ${introTimeline.rocketY.toFixed(1)}px, 0px)`;
        }
      }
    }

    function renderFrame(dt: number) {
      if (isDisposed) return;
      elapsed += dt;
      const st = stateRef.current;

      if (st.introProgress < 1.0 && dt > 0) {
        st.introProgress = advanceIntroProgress(st.introProgress, dt);
      }
      st.seismicPulseBoost = Math.max(0, st.seismicPulseBoost - dt * 1.4);

      const scrollState = computeSceneStateFromScroll(st.scrollNormalized);
      const basePos = st.cameraOverride ?? scrollState.cameraPosition;
      const baseTarget = st.targetOverride ?? scrollState.cameraTarget;

      const dx = basePos[0] - baseTarget[0];
      const dz = basePos[2] - baseTarget[2];
      const dist = Math.hypot(dx, dz);
      const baseAngle = Math.atan2(dz, dx) + st.userAzimuthOffset + st.pointerParallaxX * 0.08;

      const desiredCamX = baseTarget[0] + Math.cos(baseAngle) * dist;
      const desiredCamZ = baseTarget[2] + Math.sin(baseAngle) * dist;
      const desiredCamY =
        basePos[1] + st.userElevationOffset * 5.0 + st.pointerParallaxY * 0.45;

      if (isSoftwareGl) {
        camera.position.set(desiredCamX, desiredCamY, desiredCamZ);
        _lookAtVec.set(baseTarget[0], baseTarget[1], baseTarget[2]);
      } else {
        const dampLambda = 6.0;
        camera.position.x = THREE.MathUtils.damp(camera.position.x, desiredCamX, dampLambda, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, desiredCamY, dampLambda, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, desiredCamZ, dampLambda, dt);

        _lookAtVec.x = THREE.MathUtils.damp(_lookAtVec.x, baseTarget[0], dampLambda, dt);
        _lookAtVec.y = THREE.MathUtils.damp(_lookAtVec.y, baseTarget[1], dampLambda, dt);
        _lookAtVec.z = THREE.MathUtils.damp(_lookAtVec.z, baseTarget[2], dampLambda, dt);
      }
      camera.lookAt(_lookAtVec);
      camera.updateMatrixWorld();

      // Update all 3D-projected spatial DOM text holograms in lockstep with the Three.js camera!
      updateSpatialDomNodes(dt);

      // Exploded-view scale/layer expansion + smooth distance-based isolation
      const exp = st.explodedFactor;
      const expScale = 1.0 + exp * 0.35;
      const introReveal = THREE.MathUtils.clamp((st.introProgress - 0.72) / 0.28, 0, 1);
      const actGroups = [act1Group, act2Group, act3Group, act4Group, act5Group];
      actGroups.forEach((grp, idx) => {
        const distZ = Math.abs(ACT_POSITIONS[idx][2] - _lookAtVec.z);
        const prox =
          THREE.MathUtils.clamp(1.0 - Math.max(0, distZ - 10.0) / 14.0, 0, 1) *
          (idx === 0 ? introReveal : 1.0);
        grp.visible = prox > 0.02;
        grp.scale.setScalar(expScale * (0.25 + prox * 0.75));
      });

      // Act 1: Real-Time 3D Seismic Wavefield displacement
      seismicWave.updateWavefield(elapsed, st.seismicPulseBoost);
      plateEq.position.y = 1.9 + Math.sin(elapsed * 1.8) * 0.12;
      plateFlood.position.y = 1.9 + Math.cos(elapsed * 1.6) * 0.12;

      // Act 2: Golden Sacred Torus-Knot & Particle Galaxy rotation
      goldenVortex.torusKnot.rotation.y = elapsed * 0.55;
      goldenVortex.torusKnot.rotation.x = elapsed * 0.35;
      goldenVortex.wireKnot.rotation.y = -elapsed * 0.45;
      goldenVortex.astrolabeRing1.rotation.z = elapsed * 0.4;
      goldenVortex.astrolabeRing2.rotation.y = -elapsed * 0.6;
      goldenVortex.particleRing.rotation.y = elapsed * 0.25;

      // Act 3: Monumental 3D Red Crescent & Holographic Radar Dome
      rcMonument.crescentMesh.rotation.y = Math.sin(elapsed * 0.85) * 0.45;
      rcMonument.crescentMesh.position.y = 0.2 + Math.sin(elapsed * 2.0) * 0.15;
      rcMonument.geodesicDome.rotation.y = elapsed * 0.22;
      rcMonument.scanRing.position.y = 0.2 + Math.sin(elapsed * 1.8) * 2.2;
      rcMonument.orbitGroup.rotation.y = -elapsed * 0.9;

      // Act 4: 112 Sonic Pulse Tunnel reactive to selected agency code
      sonicTunnel.updateTunnel(elapsed, st.activeEmergencyCode);

      // Act 5: 900-Node Fibonacci Constellation Earth of Bani Adam
      baniAdamEarth.pointCloudGlobe.rotation.y = elapsed * 0.32;
      baniAdamEarth.geodesicShell.rotation.y = elapsed * 0.32;
      baniAdamEarth.orbitalRing1.rotation.z = elapsed * 0.45;
      baniAdamEarth.orbitalRing2.rotation.y = -elapsed * 0.5;
      baniAdamEarth.orbitalRing3.rotation.x = elapsed * 0.38;

      if (st.lightingPreset !== currentSkyPreset) {
        currentSkyPreset = st.lightingPreset;
        scene.background = skyTextures[currentSkyPreset];
      }

      if (st.lightingPreset === 'golden-hope') {
        keyLight.color.setHex(0xfde68a);
        keyLight.intensity = 2.8;
        rimLight.color.setHex(0xf59e0b);
      } else if (st.lightingPreset === 'daylight-relief') {
        keyLight.color.setHex(0xffffff);
        keyLight.intensity = 3.0;
        rimLight.color.setHex(0x38bdf8);
      } else {
        keyLight.color.setHex(0xfff1d6);
        keyLight.intensity = 2.6;
        rimLight.color.setHex(0xf43f5e);
      }

      renderer.render(scene, camera);
    }

    // Pointer drag orbit + subtle live 3D parallax so moving the mouse tilts both the 3D scene AND the 3D text holograms!
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    const onPointerDown = (e: PointerEvent) => {
      // Allow dragging anywhere except interactive buttons/inputs
      const target = e.target as HTMLElement | null;
      if (target && target.closest('button, input, a, [data-no-drag]')) return;
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const onPointerMove = (e: PointerEvent) => {
      const nx = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      const ny = (e.clientY / Math.max(1, window.innerHeight)) * 2 - 1;
      stateRef.current.pointerParallaxX = nx;
      stateRef.current.pointerParallaxY = ny;

      if (isDragging) {
        const dx = e.clientX - prevX;
        const dy = e.clientY - prevY;
        prevX = e.clientX;
        prevY = e.clientY;
        stateRef.current.userAzimuthOffset = THREE.MathUtils.clamp(
          stateRef.current.userAzimuthOffset + dx * 0.0045,
          -0.45,
          0.45,
        );
        stateRef.current.userElevationOffset = THREE.MathUtils.clamp(
          stateRef.current.userElevationOffset + dy * 0.0035,
          -0.3,
          0.35,
        );
      }
      if (isSoftwareGl) renderFrame(0.04);
    };
    const onPointerUp = () => {
      isDragging = false;
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      if (isSoftwareGl) renderFrame(0.016);
    };
    window.addEventListener('resize', onResize);

    triggerRenderRef.current = () => {
      renderFrame(0.0);
    };

    let swTimer = 0;
    const stepSoftwareIntro = () => {
      window.clearTimeout(swTimer);
      if (isDisposed || stateRef.current.introProgress >= 1.0) return;
      swTimer = window.setTimeout(() => {
        if (isDisposed) return;
        renderFrame(0.24);
        if (stateRef.current.introProgress < 1.0) {
          stepSoftwareIntro();
        } else {
          // Ensure final settled frame snaps cleanly once intro reaches 1.0 in software GL
          renderFrame(0.0);
        }
      }, 200);
    };

    startSoftwareIntroRef.current = () => {
      if (isSoftwareGl) {
        stepSoftwareIntro();
      }
    };

    (window as unknown as { __setIntroProgress?: (p: number) => void }).__setIntroProgress = (
      p: number,
    ) => {
      window.clearTimeout(swTimer);
      stateRef.current.introProgress = p;
      renderFrame(0.0);
    };

    // Initial render
    stateRef.current.introProgress = isSoftwareGl ? 0.2 : 0.0;
    renderFrame(0.0);

    function animate() {
      if (isDisposed) return;
      const nowSec = performance.now() * 0.001;
      const dt = Math.min(nowSec - lastTimeSec, 0.1);
      lastTimeSec = nowSec;
      renderFrame(dt);
      frameId = requestAnimationFrame(animate);
    }

    if (!isSoftwareGl) {
      frameId = requestAnimationFrame(animate);
    } else {
      stepSoftwareIntro();
    }

    return () => {
      isDisposed = true;
      triggerRenderRef.current = null;
      startSoftwareIntroRef.current = null;
      window.clearTimeout(swTimer);
      cancelAnimationFrame(frameId);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={canvasMountRef}
      data-testid="rescue-diorama-canvas"
      className="fixed inset-0 z-0 overflow-hidden bg-[#030712] cursor-grab active:cursor-grabbing"
      aria-label="صحنه سه‌بعدی تعاملی همدلی و همیاری در حوادث"
    />
  );
}
