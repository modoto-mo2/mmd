import { CHAPTERS, EMERGENCY_AGENCIES, QUIZ_QUESTIONS, type CameraWaypoint, type EmergencyAgency } from '../data/conferenceData';

export interface InterpolatedSceneState {
  activeChapterIndex: number;
  chapterProgress: number;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  fov: number;
  seismicIntensity: number;
  helicoptersAltitude: number;
  unityOrbScale: number;
}

export const INTRO_DURATION_SECONDS = 1.8;

export type SpatialNodeRole = 'header' | 'right' | 'left';

export interface WallPortalTransform {
  offsetX: number;
  offsetY: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  scaleMultiplier: number;
  opacity: number;
}

export interface IntroTimelineState {
  introNodeAlpha: number;
  chapterNodeAlpha: number;
  rocketY: number;
  rocketOpacity: number;
  rocketVisible: boolean;
}

export interface CompactStackLayout {
  scale: number;
  centerYs: number[];
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * clamp(t, 0, 1);
}

export function smoothstep(t: number): number {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

/**
 * Determines which wall portal a spatial card belongs to based on its 3D world X coordinate.
 */
export function getSpatialNodeRole(worldX: number): SpatialNodeRole {
  if (Math.abs(worldX) < 0.1) return 'header';
  return worldX > 0 ? 'right' : 'left';
}

/**
 * Computes 3D wall-portal entry and exit offsets for the 3 Intro Cards ("ساخته شده توسط",
 * "محمدرضا درستکار", "سامیار رزمجویی") so they burst in from the ceiling/side walls and
 * fly back out through the walls in the rocket's wake instead of fading in place.
 */
export function computeIntroWallPortalTransform(
  role: SpatialNodeRole,
  introProgress: number,
  viewportWidth: number,
  viewportHeight: number,
): WallPortalTransform {
  const p = clamp(introProgress, 0, 1);

  // Phase 1: Burst in from the outer walls/ceiling [0.00 .. 0.24]
  if (p < 0.24) {
    const rawT = clamp(p / 0.24, 0, 1);
    // Ease-out back for energetic wall entry; starts at 0.18 at p=0 so cards are already entering at frame 0
    const entryProgress = clamp(0.18 + 0.82 * (1 - Math.pow(1 - rawT, 2.5)), 0, 1);
    const wallFactor = 1 - entryProgress;
    const opacity = clamp(0.35 + rawT * 1.4, 0, 1);
    const scaleMultiplier = 0.78 + 0.22 * entryProgress;

    if (role === 'header') {
      return {
        offsetX: 0,
        offsetY: -wallFactor * (viewportHeight * 0.36 + 150),
        rotX: -wallFactor * 46,
        rotY: 0,
        rotZ: 0,
        scaleMultiplier,
        opacity,
      };
    }
    const dir = role === 'right' ? 1 : -1;
    return {
      offsetX: dir * wallFactor * (viewportWidth * 0.54 + 190),
      offsetY: wallFactor * (viewportHeight * 0.08 + 24),
      rotX: wallFactor * 14,
      rotY: -dir * wallFactor * 58,
      rotZ: dir * wallFactor * 8,
      scaleMultiplier,
      opacity,
    };
  }

  // Phase 2: Hold steady in center while the 2D rocket blasts between the wings [0.24 .. 0.72]
  if (p <= 0.72) {
    return {
      offsetX: 0,
      offsetY: 0,
      rotX: 0,
      rotY: 0,
      rotZ: 0,
      scaleMultiplier: 1,
      opacity: 1,
    };
  }

  // Phase 3: Launch outward through the upper/side walls in the rocket's wake [0.72 .. 1.00]
  if (p >= 1.0) {
    const dir = role === 'right' ? 1 : role === 'left' ? -1 : 0;
    return {
      offsetX: dir * (viewportWidth * 0.62 + 240),
      offsetY: -(viewportHeight * 0.42 + 180),
      rotX: 40,
      rotY: -dir * 62,
      rotZ: -dir * 10,
      scaleMultiplier: 0.74,
      opacity: 0,
    };
  }

  const rawExit = clamp((p - 0.72) / 0.28, 0, 1);
  const exitCurve = Math.pow(rawExit, 1.55);
  // Keep opacity high while flying toward the wall; only fade at the very edge
  const opacity = rawExit < 0.68 ? 1.0 : clamp((1.0 - rawExit) / 0.32, 0, 1);
  const scaleMultiplier = 1 - exitCurve * 0.24;

  if (role === 'header') {
    return {
      offsetX: 0,
      offsetY: -exitCurve * (viewportHeight * 0.44 + 190),
      rotX: exitCurve * 44,
      rotY: 0,
      rotZ: 0,
      scaleMultiplier,
      opacity,
    };
  }

  const dir = role === 'right' ? 1 : -1;
  return {
    offsetX: dir * exitCurve * (viewportWidth * 0.58 + 230),
    offsetY: -exitCurve * (viewportHeight * 0.16 + 48),
    rotX: exitCurve * 16,
    rotY: -dir * exitCurve * 62,
    rotZ: -dir * exitCurve * 10,
    scaleMultiplier,
    opacity,
  };
}

/**
 * Computes 3D wall-portal entry/exit offsets for chapter cards given a normalized presence [0..1].
 * At presence = 1, all offsets and rotations are 0 so the settled responsive layout is preserved.
 * At presence < 1, cards fly in/out from the ceiling (header), right wall (right wing), or left wall (left wing)
 * while staying visibly opaque during flight instead of fading in place.
 */
export function computeWallPortalTransform(
  role: SpatialNodeRole,
  presence: number,
  viewportWidth: number,
  viewportHeight: number,
): WallPortalTransform {
  const p = clamp(presence, 0, 1);
  if (p <= 0.005) {
    const dir = role === 'right' ? 1 : role === 'left' ? -1 : 0;
    return {
      offsetX: dir * (viewportWidth * 0.68 + 240),
      offsetY: role === 'header' ? -(viewportHeight * 0.45 + 180) : viewportHeight * 0.12 + 32,
      rotX: role === 'header' ? -48 : 16,
      rotY: -dir * 64,
      rotZ: dir * 9,
      scaleMultiplier: 0.72,
      opacity: 0,
    };
  }

  if (p >= 0.999) {
    return {
      offsetX: 0,
      offsetY: 0,
      rotX: 0,
      rotY: 0,
      rotZ: 0,
      scaleMultiplier: 1,
      opacity: 1,
    };
  }

  const eased = 1 - Math.pow(1 - p, 2.5);
  const wallFactor = 1 - eased;
  // Portal visibility curve: card becomes solid early in flight from the wall and stays solid until hitting the wall on exit
  const opacity = clamp(p * 2.85, 0, 1);
  const scaleMultiplier = 0.74 + 0.26 * eased;

  if (role === 'header') {
    return {
      offsetX: 0,
      offsetY: -wallFactor * (viewportHeight * 0.44 + 170),
      rotX: -wallFactor * 46,
      rotY: 0,
      rotZ: 0,
      scaleMultiplier,
      opacity,
    };
  }

  const dir = role === 'right' ? 1 : -1;
  const verticalBias = role === 'right' ? 0.08 : 0.15;
  return {
    offsetX: dir * wallFactor * (viewportWidth * 0.66 + 220),
    offsetY: wallFactor * (viewportHeight * verticalBias + 28),
    rotX: wallFactor * 15,
    rotY: -dir * wallFactor * 62,
    rotZ: dir * wallFactor * 9,
    scaleMultiplier,
    opacity,
  };
}

/**
 * Advances normalized intro progress [0..1] over INTRO_DURATION_SECONDS (1.8s).
 */
export function advanceIntroProgress(currentProgress: number, dtSeconds: number): number {
  if (dtSeconds <= 0) return clamp(currentProgress, 0, 1);
  return clamp(currentProgress + dtSeconds / INTRO_DURATION_SECONDS, 0, 1);
}

/**
 * Computes opacity and vertical 2D rocket position for the 1.8-second opening intro.
 */
export function computeIntroTimelineState(
  introProgress: number,
  viewportHeight: number,
): IntroTimelineState {
  const p = clamp(introProgress, 0, 1);

  const introNodeAlpha =
    p < 0.78 ? 1.0 : p >= 1.0 ? 0.0 : clamp((1.0 - p) / 0.22, 0, 1);
  const chapterNodeAlpha = p <= 0.74 ? 0.0 : p >= 1.0 ? 1.0 : clamp((p - 0.74) / 0.26, 0, 1);

  if (p >= 0.92) {
    return {
      introNodeAlpha,
      chapterNodeAlpha,
      rocketY: -380,
      rocketOpacity: 0,
      rocketVisible: false,
    };
  }

  const flightT = clamp(p / 0.88, 0, 1);
  const startY = viewportHeight + 40;
  const endY = -380;
  const rocketY = lerp(startY, endY, flightT);

  const fadeIn = clamp(p / 0.05, 0, 1);
  const fadeOut = clamp((0.92 - p) / 0.12, 0, 1);
  const rocketOpacity = Math.min(fadeIn, fadeOut);

  return {
    introNodeAlpha,
    chapterNodeAlpha,
    rocketY,
    rocketOpacity,
    rocketVisible: rocketOpacity > 0.01,
  };
}

/**
 * Computes non-overlapping vertical center Y coordinates and a uniform scale factor
 * for a chapter's 3 spatial cards (Header, Wing A, Wing B) on compact/mobile viewports.
 */
export function computeCompactStackPositions(
  cardHeights: number[],
  viewportHeight: number,
  topSafePx = 60,
  bottomSafePx = 72,
  gapPx = 8,
): CompactStackLayout {
  const availH = Math.max(180, viewportHeight - topSafePx - bottomSafePx);
  const count = cardHeights.length;
  if (count === 0) {
    return { scale: 1, centerYs: [] };
  }

  const rawHeightSum = cardHeights.reduce((acc, h) => acc + Math.max(40, h), 0);
  const totalGaps = Math.max(0, count - 1) * gapPx;
  const maxContentH = Math.max(100, availH - totalGaps);
  const scale = clamp(Math.min(0.95, maxContentH / Math.max(1, rawHeightSum)), 0.52, 0.95);

  const scaledTotalH = rawHeightSum * scale + totalGaps;
  let cursorY = topSafePx + Math.max(0, (availH - scaledTotalH) * 0.5);

  const centerYs: number[] = [];
  for (let i = 0; i < count; i++) {
    const h = Math.max(40, cardHeights[i]) * scale;
    centerYs.push(cursorY + h * 0.5);
    cursorY += h + gapPx;
  }

  return { scale, centerYs };
}

/**
 * Computes interpolated 3D camera and diorama animation parameters from a normalized scroll progress [0..1].
 */
export function computeSceneStateFromScroll(scrollNormalized: number): InterpolatedSceneState {
  const clampedScroll = clamp(scrollNormalized, 0, 1);
  const maxIndex = CHAPTERS.length - 1;
  const scaled = clampedScroll * maxIndex;
  const lowerIdx = Math.min(Math.floor(scaled), maxIndex);
  const upperIdx = Math.min(lowerIdx + 1, maxIndex);
  const localT = smoothstep(scaled - lowerIdx);

  const activeChapterIndex = Math.round(scaled);
  const wpA: CameraWaypoint = CHAPTERS[lowerIdx].camera;
  const wpB: CameraWaypoint = CHAPTERS[upperIdx].camera;

  const cameraPosition: [number, number, number] = [
    lerp(wpA.position[0], wpB.position[0], localT),
    lerp(wpA.position[1], wpB.position[1], localT),
    lerp(wpA.position[2], wpB.position[2], localT),
  ];

  const cameraTarget: [number, number, number] = [
    lerp(wpA.target[0], wpB.target[0], localT),
    lerp(wpA.target[1], wpB.target[1], localT),
    lerp(wpA.target[2], wpB.target[2], localT),
  ];

  const fov = lerp(wpA.fov, wpB.fov, localT);

  // Seismic intensity peaks in Chapter 1 (index 0) and subsides as relief arrives
  const seismicIntensity = activeChapterIndex === 0 ? 1.0 : activeChapterIndex === 1 ? 0.35 : 0.15;

  // Helicopter altitude lowers during Camp & Dispatch chapters for close inspection
  const helicoptersAltitude = activeChapterIndex === 2 ? 3.8 : activeChapterIndex === 3 ? 4.4 : 5.5;

  // Unity orb expands during Sacred Duty (Chapter 2) and Bani Adam Finale (Chapter 5)
  const unityOrbScale = activeChapterIndex === 1 || activeChapterIndex === 4 ? 1.25 : 0.75;

  return {
    activeChapterIndex,
    chapterProgress: localT,
    cameraPosition,
    cameraTarget,
    fov,
    seismicIntensity,
    helicoptersAltitude,
    unityOrbScale,
  };
}

/**
 * Looks up an emergency agency by its dial code or name.
 */
export function findAgencyByCode(code: string): EmergencyAgency {
  const found = EMERGENCY_AGENCIES.find((a) => a.code === code);
  return found ?? EMERGENCY_AGENCIES[0];
}

/**
 * Evaluates a user's selected answers for the conference quiz.
 */
export function calculateQuizResult(selectedAnswers: Record<string, number>): {
  correctCount: number;
  totalQuestions: number;
  percentage: number;
  isComplete: boolean;
  rankTitle: string;
} {
  const totalQuestions = QUIZ_QUESTIONS.length;
  let correctCount = 0;
  let answeredCount = 0;

  for (const q of QUIZ_QUESTIONS) {
    if (typeof selectedAnswers[q.id] === 'number') {
      answeredCount += 1;
      if (selectedAnswers[q.id] === q.correctIndex) {
        correctCount += 1;
      }
    }
  }

  const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const isComplete = answeredCount === totalQuestions;

  let rankTitle = 'پژوهشگر تازه‌وارد بیمه';
  if (percentage === 100) {
    rankTitle = 'فرمانده ارشد بیمه و مدیریت حوادث';
  } else if (percentage >= 75) {
    rankTitle = 'کارشناس خبره بیمه و تأمین اجتماعی';
  } else if (percentage >= 50) {
    rankTitle = 'همیار آگاه بیمه و ایمنی';
  }

  return {
    correctCount,
    totalQuestions,
    percentage,
    isComplete,
    rankTitle,
  };
}
