import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INTRO_DURATION_SECONDS,
  advanceIntroProgress,
  clamp,
  computeCompactStackPositions,
  computeIntroTimelineState,
  computeIntroWallPortalTransform,
  computeSceneStateFromScroll,
  computeWallPortalTransform,
  findAgencyByCode,
  getSpatialNodeRole,
  lerp,
  calculateQuizResult,
} from './presentationLogic';
import { CHAPTERS, QUIZ_QUESTIONS } from '../data/conferenceData';

test('clamp constrains values within bounds', () => {
  assert.equal(clamp(-0.5, 0, 1), 0);
  assert.equal(clamp(1.5, 0, 1), 1);
  assert.equal(clamp(0.4, 0, 1), 0.4);
});

test('lerp interpolates accurately between start and end', () => {
  assert.equal(lerp(10, 20, 0), 10);
  assert.equal(lerp(10, 20, 0.5), 15);
  assert.equal(lerp(10, 20, 1), 20);
});

test('INTRO_DURATION_SECONDS is 1.8s and advanceIntroProgress finishes in 1.8 seconds', () => {
  assert.equal(INTRO_DURATION_SECONDS, 1.8);
  const half = advanceIntroProgress(0, 0.9);
  assert.ok(Math.abs(half - 0.5) < 1e-6);
  const full = advanceIntroProgress(half, 0.9);
  assert.equal(full, 1);
});

test('computeIntroTimelineState launches rocket from bottom to top and fades out intro nodes by p=1', () => {
  const start = computeIntroTimelineState(0.05, 900);
  const mid = computeIntroTimelineState(0.44, 900);
  const end = computeIntroTimelineState(1.0, 900);

  assert.equal(start.introNodeAlpha, 1);
  assert.equal(start.rocketVisible, true);
  assert.ok(mid.rocketY < start.rocketY, 'Rocket moves upward (smaller Y) as intro progresses');
  assert.equal(end.introNodeAlpha, 0);
  assert.equal(end.chapterNodeAlpha, 1);
  assert.equal(end.rocketVisible, false);
});

test('computeIntroWallPortalTransform flies intro cards in from walls/ceiling and out through walls', () => {
  assert.equal(getSpatialNodeRole(0), 'header');
  assert.equal(getSpatialNodeRole(4.25), 'right');
  assert.equal(getSpatialNodeRole(-4.25), 'left');

  const entryHeader = computeIntroWallPortalTransform('header', 0.05, 390, 844);
  const entryRight = computeIntroWallPortalTransform('right', 0.05, 390, 844);
  const entryLeft = computeIntroWallPortalTransform('left', 0.05, 390, 844);
  assert.ok(entryHeader.offsetY < -80, 'Header enters from top ceiling');
  assert.ok(entryRight.offsetX > 100, 'Right wing enters from right wall');
  assert.ok(entryLeft.offsetX < -100, 'Left wing enters from left wall');

  const settled = computeIntroWallPortalTransform('right', 0.5, 390, 844);
  assert.equal(settled.offsetX, 0);
  assert.equal(settled.offsetY, 0);
  assert.equal(settled.opacity, 1);

  const exitingRight = computeIntroWallPortalTransform('right', 0.88, 390, 844);
  const exitingLeft = computeIntroWallPortalTransform('left', 0.88, 390, 844);
  assert.ok(exitingRight.offsetX > 120, 'Right wing flies out through right wall');
  assert.ok(exitingLeft.offsetX < -120, 'Left wing flies out through left wall');
});

test('computeWallPortalTransform flies chapter cards from ceiling/side walls and settles to zero offset at presence=1', () => {
  const midHeader = computeWallPortalTransform('header', 0.45, 390, 844);
  const midRight = computeWallPortalTransform('right', 0.45, 390, 844);
  const midLeft = computeWallPortalTransform('left', 0.45, 390, 844);

  assert.ok(midHeader.offsetY < -70, 'Header flies in from top ceiling');
  assert.ok(midRight.offsetX > 80, 'Right wing flies in from right wall');
  assert.ok(midLeft.offsetX < -80, 'Left wing flies in from left wall');
  assert.equal(midRight.opacity, 1, 'Card is already fully opaque while flying in from the wall');

  const settled = computeWallPortalTransform('left', 1.0, 390, 844);
  assert.equal(settled.offsetX, 0);
  assert.equal(settled.offsetY, 0);
  assert.equal(settled.rotX, 0);
  assert.equal(settled.rotY, 0);
  assert.equal(settled.scaleMultiplier, 1);
  assert.equal(settled.opacity, 1);
});

test('computeCompactStackPositions stacks 3 mobile cards with zero vertical overlap', () => {
  const heights = [90, 260, 250];
  const layout = computeCompactStackPositions(heights, 844, 58, 72, 8);
  assert.equal(layout.centerYs.length, 3);

  const bounds = heights.map((h, i) => {
    const half = (h * layout.scale) / 2;
    return {
      top: layout.centerYs[i] - half,
      bottom: layout.centerYs[i] + half,
    };
  });

  assert.ok(bounds[0].top >= 57.9, 'First card stays below top navbar');
  assert.ok(bounds[0].bottom < bounds[1].top, 'First and second card do not overlap');
  assert.ok(bounds[1].bottom < bounds[2].top, 'Second and third card do not overlap');
  assert.ok(bounds[2].bottom <= 844 - 72 + 0.1, 'Third card stays above bottom control dock');
});

test('computeSceneStateFromScroll maps start and end scroll to first and last chapter waypoints', () => {
  const startState = computeSceneStateFromScroll(0);
  assert.equal(startState.activeChapterIndex, 0);
  assert.deepEqual(startState.cameraPosition, CHAPTERS[0].camera.position);

  const endState = computeSceneStateFromScroll(1);
  assert.equal(endState.activeChapterIndex, CHAPTERS.length - 1);
  assert.deepEqual(endState.cameraPosition, CHAPTERS[CHAPTERS.length - 1].camera.position);
});

test('findAgencyByCode returns Social Security and Third-Party insurance and falls back gracefully', () => {
  const socialSec = findAgencyByCode('تأمین اجتماعی');
  assert.equal(socialSec.code, 'تأمین اجتماعی');
  assert.ok(socialSec.name.includes('تأمین اجتماعی'));

  const thirdParty = findAgencyByCode('شخص ثالث');
  assert.equal(thirdParty.code, 'شخص ثالث');
});

test('calculateQuizResult computes score and rank accurately', () => {
  const allCorrect: Record<string, number> = {};
  for (const q of QUIZ_QUESTIONS) {
    allCorrect[q.id] = q.correctIndex;
  }
  const res = calculateQuizResult(allCorrect);
  assert.equal(res.isComplete, true);
  assert.equal(res.percentage, 100);
  assert.equal(res.correctCount, QUIZ_QUESTIONS.length);
  assert.ok(res.rankTitle.includes('فرمانده'));
});
