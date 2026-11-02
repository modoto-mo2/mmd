/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  Eye,
  EyeOff,
  FileCheck2,
  Globe2,
  Layers,
  Maximize2,
  Minimize2,
  RefreshCw,
  RotateCcw,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sun,
  Volume2,
  X,
  ZoomIn,
} from 'lucide-react';
import RescueDioramaCanvas, { LightingPreset } from './components/RescueDioramaCanvas';
import {
  CHAPTERS,
  CRISIS_NEEDS_MATRIX,
  EMERGENCY_AGENCIES,
  ExtractedPhotoAsset,
  JIHADI_GROUPS_PLAN,
  LESSON6_GLOSSARY,
  QUIZ_QUESTIONS as CONFERENCE_QUIZ,
  SAADI_VERSES as DASTAN_RASTAN_PARTS,
  SACRED_TEXTS,
} from './data/conferenceData';
import {
  calculateQuizResult,
  clamp,
  findAgencyByCode,
} from './utils/presentationLogic';

function playSubtlePulseTone(freq = 520) {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.35, ctx.currentTime + 0.14);

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.16);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.17);
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 250);
  } catch {
    // Ignore audio context restrictions
  }
}

export default function App() {
  const [scrollNormalized, setScrollNormalized] = useState(0);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [cameraOverride, setCameraOverride] = useState<[number, number, number] | null>(null);
  const [targetOverride, setTargetOverride] = useState<[number, number, number] | null>(null);
  const [explodedFactor, setExplodedFactor] = useState(0);
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>('tactical-night');
  const [activeEmergencyCode, setActiveEmergencyCode] = useState('تأمین اجتماعی');
  const [isCinemaMode, setIsCinemaMode] = useState(false);
  const [isHudMinimized, setIsHudMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<ExtractedPhotoAsset | null>(null);
  const [selectedJihadiTab, setSelectedJihadiTab] = useState<'dispatched' | 'local'>('dispatched');
  const [selectedCrisisTab, setSelectedCrisisTab] = useState<'problems' | 'needs'>('problems');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [seismicPulseCount, setSeismicPulseCount] = useState(0);
  const [swapWings, setSwapWings] = useState(false);

  // Automatic 3D Supersonic Rocket Intro Act on every refresh (plays & auto-fades inside RescueDioramaCanvas)
  const [introRunId, setIntroRunId] = useState(0);

  // Act 4 Dastan Rastan story part & Act 5 Glossary + Quiz states
  const [activeCoupletIndex, setActiveCoupletIndex] = useState(0);
  const [activeGlossaryIndex, setActiveGlossaryIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);

  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  const handleReplayRocketIntro = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setCameraOverride(null);
    setTargetOverride(null);
    setIsCinemaMode(false);
    setIntroRunId((r) => r + 1);
  };

  useEffect(() => {
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = docHeight > 0 ? clamp(window.scrollY / docHeight, 0, 1) : 0;
      setScrollNormalized(ratio);

      const idx = Math.min(
        CHAPTERS.length - 1,
        Math.max(0, Math.round(ratio * (CHAPTERS.length - 1))),
      );
      setActiveChapterIndex(idx);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lightboxPhoto) {
        setLightboxPhoto(null);
        return;
      }
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        const next = clamp(activeChapterIndex + 1, 0, CHAPTERS.length - 1);
        scrollToChapter(next);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        const prev = clamp(activeChapterIndex - 1, 0, CHAPTERS.length - 1);
        scrollToChapter(prev);
      } else if (e.key.toLowerCase() === 'c') {
        setIsCinemaMode((v) => !v);
      } else if (e.key.toLowerCase() === 'h') {
        setIsHudMinimized((v) => !v);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeChapterIndex, lightboxPhoto]);

  const scrollToChapter = (index: number) => {
    setCameraOverride(null);
    setTargetOverride(null);
    const el = sectionRefs.current[index];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const targetY = (index / (CHAPTERS.length - 1)) * docHeight;
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleSelectEmergencyCode = (code: string) => {
    setActiveEmergencyCode(code);
    if (soundEnabled) {
      playSubtlePulseTone(
        code === 'تأمین اجتماعی' ? 660 : code === 'شخص ثالث' ? 580 : 480,
      );
    }
  };

  const selectedAgency = findAgencyByCode(activeEmergencyCode);
  const wSign = swapWings ? -1 : 1;

  const answeredCount = Object.keys(selectedAnswers).length;
  const quizResult = calculateQuizResult(selectedAnswers);

  return (
    <div
      dir="rtl"
      className="relative min-h-screen text-slate-100 selection:bg-rose-500 selection:text-white overflow-x-hidden"
    >
      {/* 1. Full-Viewport Interactive Three.js 3D Universe + Live 3D DOM Projection */}
      <RescueDioramaCanvas
        scrollNormalized={scrollNormalized}
        activeChapterIndex={activeChapterIndex}
        cameraOverride={cameraOverride}
        targetOverride={targetOverride}
        explodedFactor={explodedFactor}
        lightingPreset={lightingPreset}
        activeEmergencyCode={activeEmergencyCode}
        isCinemaMode={isCinemaMode}
        seismicPulseCount={seismicPulseCount}
        swapWings={swapWings}
        introRunId={introRunId}
      />

      {/* 2. Top Conference Navigation Bar */}
      <header className="fixed top-0 inset-x-0 z-40 bg-[#050814]/85 backdrop-blur-md border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className="font-bold text-xs sm:text-base tracking-tight text-white whitespace-nowrap">
              <span className="sm:hidden">درس ۶: بیمه و حوادث</span>
              <span className="hidden sm:inline">درس ۶: بیمه و مقابله با حوادث</span>
            </span>
            <button
              type="button"
              onClick={handleReplayRocketIntro}
              className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-[11px] sm:text-xs font-medium hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="پخش مجدد تیتراژ ساخته شده توسط محمدرضا درستکار و سامیار رزمجویی"
            >
              <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>تیتراژ</span>
            </button>
          </div>

          <nav
            aria-label="فصل‌های کنفرانس"
            className="hidden lg:flex items-center gap-3 text-xs"
          >
            {[
              '۱. بیمه دانش‌آموزی',
              '۲. بیمه مرکزی و انواع',
              '۳. شخص ثالث و کارگران',
              '۴. داستان راستان و تأمین اجتماعی',
              '۵. واژه‌نامه و آزمون',
            ].map((label, idx) => {
              const isActive = activeChapterIndex === idx && !isCinemaMode;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setIsCinemaMode(false);
                    scrollToChapter(idx);
                  }}
                  className={`py-4 border-b-2 transition-colors font-medium cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'border-rose-500 text-white font-bold'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSwapWings((s) => !s)}
              className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-[11px] sm:text-xs font-medium text-sky-300 bg-slate-900/90 border border-sky-500/40 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
              title="جابجایی بال‌های متنی در فضای سه‌بعدی"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">جابجایی بال‌های سه‌بعدی</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCinemaMode((v) => !v)}
              className={`inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                isCinemaMode
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg'
                  : 'bg-rose-600 text-white hover:bg-rose-500'
              }`}
            >
              {isCinemaMode ? (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span className="sm:hidden">پنل‌ها</span>
                  <span className="hidden sm:inline">نمایش پنل‌های سه‌بعدی</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span className="sm:hidden">سه‌بعدی</span>
                  <span className="hidden sm:inline">نمای خالص سه‌بعدی</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label="تمام‌صفحه برای پرژکتور کنفرانس"
              className="p-1.5 text-slate-300 hover:text-white bg-slate-900 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="w-full h-0.5 bg-slate-900">
          <div
            className="h-full bg-gradient-to-l from-rose-500 via-amber-400 to-sky-400 transition-all duration-150"
            style={{ width: `${Math.round(scrollNormalized * 100)}%` }}
          />
        </div>
      </header>

      {/* =================================================================== */}
      {/* 3. 3D CAMERA-PROJECTED SPATIAL HOLOGRAMS (Move & Orbit with 3D!)     */}
      {/* =================================================================== */}
      <div className="fixed inset-0 z-20 pointer-events-none overflow-hidden">
        {/* ----------------------------------------------------------------- */}
        {/* ACT 00 (INTRO): SIMPLE & CLEAN "CREATED BY" INTRO                 */}
        {/* ----------------------------------------------------------------- */}
        <div
          data-spatial-node="true"
          data-intro-node="true"
          data-world-x="0.0"
          data-world-y="2.75"
          data-world-z="28.5"
          data-rot-y="0"
          className="fixed top-0 left-0 w-[88vw] max-w-[400px] bg-slate-950/80 backdrop-blur-md border border-white/15 rounded-2xl px-5 py-3 shadow-xl text-center"
        >
          <div className="text-xs font-medium text-slate-400 mb-0.5">
            درس ششم: بیمه و مقابله با حوادث
          </div>
          <div className="text-lg sm:text-xl font-bold text-white">
            ساخته شده توسط
          </div>
        </div>

        {/* Intro Right Card: محمدرضا درستکار */}
        <div
          data-spatial-node="true"
          data-intro-node="true"
          data-world-x="4.25"
          data-world-y="0.2"
          data-world-z="28.5"
          data-rot-y="-10"
          className="fixed top-0 left-0 w-[37vw] sm:w-[270px] max-w-[280px] bg-slate-950/85 backdrop-blur-md border border-white/15 rounded-2xl px-2 py-3.5 sm:px-6 sm:py-5 shadow-xl text-center"
        >
          <div className="text-sm sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight whitespace-nowrap">
            محمدرضا درستکار
          </div>
        </div>

        {/* Intro Left Card: سامیار رزمجویی */}
        <div
          data-spatial-node="true"
          data-intro-node="true"
          data-world-x="-4.25"
          data-world-y="0.2"
          data-world-z="28.5"
          data-rot-y="10"
          className="fixed top-0 left-0 w-[37vw] sm:w-[270px] max-w-[280px] bg-slate-950/85 backdrop-blur-md border border-white/15 rounded-2xl px-2 py-3.5 sm:px-6 sm:py-5 shadow-xl text-center"
        >
          <div className="text-sm sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight whitespace-nowrap">
            سامیار رزمجویی
          </div>
        </div>

        {/* 2D Vertical Rocket flying straight from bottom to top in the exact center */}
        <div
          data-intro-rocket="true"
          className="fixed top-0 left-1/2 z-50 pointer-events-none select-none flex flex-col items-center"
          style={{
            transform: 'translate3d(-50%, 110vh, 0px)',
            opacity: 0,
            visibility: 'hidden',
          }}
        >
          <svg
            width="176"
            height="362"
            viewBox="0 0 68 140"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-[74px] h-[152px] sm:w-[176px] sm:h-[362px] drop-shadow-[0_0_28px_rgba(56,189,248,0.75)]"
            aria-hidden="true"
          >
            {/* Outer Engine Flame */}
            <path
              d="M24 94 L34 138 L44 94 Z"
              fill="url(#rocketFlameOuter)"
            />
            {/* Inner Core Flame */}
            <path
              d="M28 94 L34 122 L40 94 Z"
              fill="#FEF08A"
            />
            {/* Left & Right Wings */}
            <path
              d="M21 64 L8 88 L21 86 Z"
              fill="#E11D48"
            />
            <path
              d="M47 64 L60 88 L47 86 Z"
              fill="#E11D48"
            />
            {/* Center Fin */}
            <path
              d="M32 68 L36 68 L36 92 L32 92 Z"
              fill="#F43F5E"
            />
            {/* Main Rocket Body */}
            <path
              d="M34 8 C23 24 21 46 21 86 L47 86 C47 46 45 24 34 8 Z"
              fill="#F8FAFC"
              stroke="#38BDF8"
              strokeWidth="2"
            />
            {/* Nose Cone Tip */}
            <path
              d="M34 8 C28 17 25 26 24 32 L44 32 C43 26 40 17 34 8 Z"
              fill="#E11D48"
            />
            {/* Cockpit Window */}
            <circle
              cx="34"
              cy="48"
              r="7.5"
              fill="#0EA5E9"
              stroke="#E2E8F0"
              strokeWidth="2.5"
            />
            <circle
              cx="31.5"
              cy="45.5"
              r="2.2"
              fill="#E0F2FE"
            />
            {/* Nozzle Base */}
            <rect
              x="25"
              y="86"
              width="18"
              height="7"
              rx="2"
              fill="#334155"
            />
            <defs>
              <linearGradient
                id="rocketFlameOuter"
                x1="34"
                y1="94"
                x2="34"
                y2="138"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="45%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#E11D48" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* ACT 01 SPATIAL NODES (Anchored around Z = +28.0 — Page 26 & 27)   */}
        {/* ----------------------------------------------------------------- */}
        <div
          data-spatial-node="true"
          data-world-x="0.0"
          data-world-y="3.15"
          data-world-z="28.0"
          data-rot-y="0"
          className="fixed top-0 left-0 w-[92vw] max-w-[650px] bg-[#060b19]/85 backdrop-blur-md border border-rose-500/40 border-t-2 border-t-rose-500 rounded-2xl px-3.5 py-2 sm:px-5 sm:py-3.5 shadow-2xl text-center"
        >
          <div className="flex items-center justify-center mb-0.5">
            <span className="text-[10px] sm:text-[11px] font-bold text-amber-300">
              ساخته شده توسط: محمدرضا درستکار و سامیار رزمجویی
            </span>
          </div>
          <h1 className="text-base sm:text-2xl lg:text-3xl font-extrabold text-white">
            {CHAPTERS[0].title}
          </h1>
          <p className="text-[11px] sm:text-sm text-rose-300 mt-0.5">{CHAPTERS[0].subtitle}</p>
        </div>

        {/* Act 01 Right 3D Wing: Insurer vs Insured + Activity 1 (Page 26) */}
        <div
          data-spatial-node="true"
          data-world-x={String(4.7 * wSign)}
          data-world-y="-0.45"
          data-world-z="28.5"
          data-rot-y={String(-18 * wSign)}
          className="fixed top-0 left-0 w-[92vw] sm:w-[88vw] max-w-[375px] bg-[#060b19]/85 backdrop-blur-md border border-slate-700/80 border-t-2 border-t-sky-400 rounded-2xl p-2.5 sm:p-4 shadow-2xl space-y-2 sm:space-y-3"
        >
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#0c1428]/90 border border-sky-500/30 rounded-xl p-2 sm:p-2.5 space-y-0.5 sm:space-y-1">
              <div className="text-[10px] sm:text-[11px] font-bold text-sky-400">۱. «بیمه‌شونده (بیمه‌گذار)»</div>
              <p className="text-[10px] sm:text-[11px] text-slate-200 leading-snug sm:leading-relaxed">
                دانش‌آموز یا فردی که با پرداخت <strong>«حقّ بیمه»</strong>، خود یا دارایی‌اش را در برابر حوادث بیمه می‌کند.
              </p>
            </div>
            <div className="bg-[#0c1428]/90 border border-rose-500/30 rounded-xl p-2 sm:p-2.5 space-y-0.5 sm:space-y-1">
              <div className="text-[10px] sm:text-[11px] font-bold text-rose-400">۲. مؤسسه «بیمه‌گر»</div>
              <p className="text-[10px] sm:text-[11px] text-slate-200 leading-snug sm:leading-relaxed">
                مؤسسه‌ای که در قبال دریافت حقّ بیمه، <strong>تعهد می‌کند خسارت‌های مالی و جانی</strong> حوادث معین را جبران کند.
              </p>
            </div>
          </div>

          <div className="bg-[#0c1428]/90 border border-slate-800 rounded-xl p-2 sm:p-3 space-y-1.5 sm:space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="text-[10px] sm:text-[11px] font-bold text-white">بررسی فعّالیت ۱ (صفحه ۲۶):</span>
              <div className="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedCrisisTab('problems')}
                  className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition-colors cursor-pointer ${
                    selectedCrisisTab === 'problems' ? 'bg-rose-600 text-white' : 'text-slate-400'
                  }`}
                >
                  بیمه دانش‌آموزی
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCrisisTab('needs')}
                  className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition-colors cursor-pointer ${
                    selectedCrisisTab === 'needs' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                  }`}
                >
                  ارکان قرارداد بیمه
                </button>
              </div>
            </div>
            <ul className="space-y-1 text-[10px] sm:text-[11px] text-slate-300 leading-snug">
              {(selectedCrisisTab === 'problems'
                ? CRISIS_NEEDS_MATRIX.problems
                : CRISIS_NEEDS_MATRIX.needs
              ).map((item) => (
                <li key={item} className="flex items-start gap-1.5">
                  <span className="text-rose-400 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Act 01 Left 3D Wing: Extracted Student Insurance Card & Textbook Visuals */}
        <div
          data-spatial-node="true"
          data-world-x={String(-4.7 * wSign)}
          data-world-y="-0.45"
          data-world-z="28.5"
          data-rot-y={String(18 * wSign)}
          className="fixed top-0 left-0 w-[92vw] sm:w-[88vw] max-w-[375px] bg-[#060b19]/85 backdrop-blur-md border border-slate-700/80 border-t-2 border-t-rose-500 rounded-2xl p-2.5 sm:p-4 shadow-2xl space-y-2"
        >
          <div className="flex items-center justify-between text-[11px] sm:text-xs">
            <span className="font-bold text-white">اسناد تصویری کتاب درسی (کلیک برای زوم)</span>
            <span className="text-[10px] sm:text-[11px] text-rose-400">صفحه ۲۶ تا ۲۸</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {CHAPTERS[0].photos.map((photo) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => setLightboxPhoto(photo)}
                className="group bg-[#0c1428] border border-slate-800 hover:border-rose-500 rounded-xl overflow-hidden text-right transition-all cursor-pointer"
              >
                <div className="relative h-14 sm:h-20 w-full overflow-hidden bg-slate-950">
                  <img
                    src={photo.src}
                    alt={photo.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <ZoomIn className="w-3.5 h-3.5 text-white absolute bottom-1 left-1 drop-shadow" />
                </div>
                <div className="p-1 sm:p-1.5">
                  <div className="text-[9px] sm:text-[10px] font-bold text-white line-clamp-1">{photo.title}</div>
                </div>
              </button>
            ))}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-300 leading-snug sm:leading-relaxed">{CHAPTERS[0].lead}</p>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* ACT 02 SPATIAL NODES (Anchored around Z = 0.0 — Page 27)          */}
        {/* ----------------------------------------------------------------- */}
        <div
          data-spatial-node="true"
          data-world-x="0.0"
          data-world-y="3.15"
          data-world-z="0.0"
          data-rot-y="0"
          className="fixed top-0 left-0 w-[92vw] max-w-[650px] bg-[#060b19]/80 backdrop-blur-md border border-amber-500/40 border-t-2 border-t-amber-400 rounded-2xl px-5 py-3.5 shadow-2xl text-center"
        >
          <div className="text-[11px] font-mono font-bold text-amber-400 mb-0.5">
            ACT 02 · {CHAPTERS[1].numberLabel} · نظارت قانونی و طبقه‌بندی بیمه‌ها
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white">
            {CHAPTERS[1].title}
          </h2>
          <p className="text-xs sm:text-sm text-amber-300 mt-0.5">{CHAPTERS[1].subtitle}</p>
        </div>

        {/* Act 02 Right 3D Wing: Central Insurance & Types of Insurance (Page 27) */}
        <div
          data-spatial-node="true"
          data-world-x={String(4.75 * wSign)}
          data-world-y="-0.4"
          data-world-z="0.6"
          data-rot-y={String(-18 * wSign)}
          className="fixed top-0 left-0 w-[88vw] max-w-[375px] bg-[#060b19]/82 backdrop-blur-md border border-slate-700/80 border-t-2 border-t-amber-400 rounded-2xl p-4 shadow-2xl space-y-2.5"
        >
          {SACRED_TEXTS.map((item) => (
            <div
              key={item.id}
              className="bg-[#0c1428]/90 border border-slate-800/90 rounded-xl p-2.5 space-y-1"
            >
              <div className="flex items-center justify-between text-[10px] text-amber-400 font-bold">
                <span>{item.source}</span>
                <span>{item.concept}</span>
              </div>
              <p className="text-xs font-bold text-white leading-relaxed">
                {item.persianTranslation}
              </p>
              <p className="text-[10px] text-slate-400">{item.takeaway}</p>
            </div>
          ))}
        </div>

        {/* Act 02 Left 3D Wing: Central Insurance Building Photo & Mandatory vs Optional */}
        <div
          data-spatial-node="true"
          data-world-x={String(-4.75 * wSign)}
          data-world-y="-0.4"
          data-world-z="0.6"
          data-rot-y={String(18 * wSign)}
          className="fixed top-0 left-0 w-[88vw] max-w-[375px] bg-[#060b19]/82 backdrop-blur-md border border-slate-700/80 border-t-2 border-t-emerald-400 rounded-2xl p-4 shadow-2xl space-y-3"
        >
          <div className="grid grid-cols-4 gap-2">
            {CHAPTERS[1].photos.map((photo) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => setLightboxPhoto(photo)}
                className="group bg-[#0c1428] border border-slate-800 hover:border-amber-400 rounded-lg overflow-hidden transition-all cursor-pointer"
              >
                <div className="relative h-16 w-full overflow-hidden bg-slate-950">
                  <img
                    src={photo.src}
                    alt={photo.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="p-1 text-[9px] font-bold text-slate-200 line-clamp-1">
                  {photo.title}
                </div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#0c1428]/90 border border-slate-800 rounded-xl p-2.5 space-y-1">
              <div className="flex items-center gap-1 text-[10px] font-bold text-rose-400">
                <Scale className="w-3 h-3" />
                <span>بیمه‌های اجباری (قانونی)</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                افراد طبق قانون <strong>موظف به انجام آن هستند</strong>؛ مانند بیمه شخص ثالث خودرو و بیمه کارگران توسط کارفرما.
              </p>
            </div>
            <div className="bg-[#0c1428]/90 border border-slate-800 rounded-xl p-2.5 space-y-1">
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                <ShieldCheck className="w-3 h-3" />
                <span>بیمه‌های اختیاری (داوطلبانه)</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                افراد <strong>داوطلب می‌شوند</strong> برای حوادث احتمالی از آن استفاده کنند؛ مانند بیمه بدنه، عمر و منازل مسکونی.
              </p>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* ACT 03 SPATIAL NODES (Anchored around Z = -28.0 — Page 28)        */}
        {/* ----------------------------------------------------------------- */}
        <div
          data-spatial-node="true"
          data-world-x="0.0"
          data-world-y="3.15"
          data-world-z="-28.0"
          data-rot-y="0"
          className="fixed top-0 left-0 w-[92vw] max-w-[650px] bg-[#060b19]/80 backdrop-blur-md border border-rose-500/40 border-t-2 border-t-rose-500 rounded-2xl px-5 py-3.5 shadow-2xl text-center"
        >
          <div className="text-[11px] font-mono font-bold text-rose-400 mb-0.5">
            ACT 03 · {CHAPTERS[2].numberLabel} · ماده ۵ آیین‌نامه راهنمایی و رانندگی و فعالیت ۲
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white">
            {CHAPTERS[2].title}
          </h2>
          <p className="text-xs sm:text-sm text-rose-300 mt-0.5">{CHAPTERS[2].subtitle}</p>
        </div>

        {/* Act 03 Right 3D Wing: Did You Know (Article 5) + Third-Party Policy & Activity 2 */}
        <div
          data-spatial-node="true"
          data-world-x={String(4.75 * wSign)}
          data-world-y="-0.4"
          data-world-z="-27.4"
          data-rot-y={String(-18 * wSign)}
          className="fixed top-0 left-0 w-[88vw] max-w-[375px] bg-[#060b19]/82 backdrop-blur-md border border-slate-700/80 border-t-2 border-t-rose-500 rounded-2xl p-4 shadow-2xl space-y-2.5"
        >
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#0c1428]/90 border border-rose-500/40 rounded-xl p-2.5">
              <div className="text-[10px] font-bold text-rose-400">آیا می‌دانید؟ (صفحه ۲۸)</div>
              <div className="text-xs font-bold text-white mt-0.5">ماده ۵ راهنمایی و رانندگی</div>
              <p className="text-[10px] text-slate-300 mt-0.5">
                نداشتن بیمه شخص ثالث تخلف و دارای جریمه است و راننده باید پیش از حرکت از سلامت خودرو اطمینان حاصل کند.
              </p>
            </div>
            <div className="bg-[#0c1428]/90 border border-emerald-500/40 rounded-xl p-2.5">
              <div className="text-[10px] font-bold text-emerald-400">بیمه کارگران و درمان</div>
              <div className="text-xs font-bold text-white mt-0.5">حوادث کار و جراحی</div>
              <p className="text-[10px] text-slate-300 mt-0.5">
                کارفرمایان موظف به بیمه کردن کارگران هستند؛ بیمه درمان هزینه‌های جراحی، آزمایشگاه و دارو را می‌دهد.
              </p>
            </div>
          </div>

          <div className="bg-[#0c1428]/90 border border-slate-800 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-bold text-white">بررسی سند و فعّالیت ۲ (ص ۲۸):</span>
              <div className="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedJihadiTab('dispatched')}
                  className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition-colors cursor-pointer ${
                    selectedJihadiTab === 'dispatched' ? 'bg-rose-600 text-white' : 'text-slate-400'
                  }`}
                >
                  سند شخص ثالث
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedJihadiTab('local')}
                  className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition-colors cursor-pointer ${
                    selectedJihadiTab === 'local' ? 'bg-rose-600 text-white' : 'text-slate-400'
                  }`}
                >
                  فعالیت ۲ (قرارداد)
                </button>
              </div>
            </div>
            <ul className="space-y-1 text-[10px] text-slate-300">
              {(selectedJihadiTab === 'dispatched'
                ? JIHADI_GROUPS_PLAN.dispatchedGroup.items
                : JIHADI_GROUPS_PLAN.localSupportGroup.items
              ).map((item) => (
                <li key={item} className="flex items-start gap-1.5">
                  <span className="text-rose-400 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Act 03 Left 3D Wing: Extracted Page 28 Photos (Policy, Workers, Medical Center) */}
        <div
          data-spatial-node="true"
          data-world-x={String(-4.75 * wSign)}
          data-world-y="-0.4"
          data-world-z="-27.4"
          data-rot-y={String(18 * wSign)}
          className="fixed top-0 left-0 w-[88vw] max-w-[375px] bg-[#060b19]/82 backdrop-blur-md border border-slate-700/80 border-t-2 border-t-sky-400 rounded-2xl p-4 shadow-2xl space-y-2.5"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white">اسناد تصویری صفحه ۲۸ (کلیک برای بزرگ‌نمایی)</span>
            <span className="text-[11px] text-sky-400">۴ تصویر مستند</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {CHAPTERS[2].photos.map((photo) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => setLightboxPhoto(photo)}
                className="group bg-[#0c1428] border border-slate-800 hover:border-rose-500 rounded-xl overflow-hidden text-right transition-all cursor-pointer"
              >
                <div className="relative h-20 w-full overflow-hidden bg-slate-950">
                  <img
                    src={photo.src}
                    alt={photo.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <ZoomIn className="w-3.5 h-3.5 text-white absolute bottom-1 left-1" />
                </div>
                <div className="p-1.5 text-[10px] font-bold text-white line-clamp-1">
                  {photo.title}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* ACT 04 SPATIAL NODES (Anchored around Z = -56.0 — Page 29)        */}
        {/* ----------------------------------------------------------------- */}
        <div
          data-spatial-node="true"
          data-world-x="0.0"
          data-world-y="3.15"
          data-world-z="-56.0"
          data-rot-y="0"
          className="fixed top-0 left-0 w-[92vw] max-w-[650px] bg-[#060b19]/80 backdrop-blur-md border border-sky-500/40 border-t-2 border-t-sky-400 rounded-2xl px-5 py-3.5 shadow-2xl text-center"
        >
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className="text-[11px] font-mono font-bold text-sky-400">
              ACT 04 · {CHAPTERS[3].numberLabel} · فعالیت‌های ۳، ۴، ۵ و ۶ کتاب
            </span>
            <button
              type="button"
              onClick={() => setSoundEnabled((s) => !s)}
              className="inline-flex items-center gap-1 text-[11px] text-sky-300 hover:text-white cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{soundEnabled ? 'پالس صوتی فعال' : 'بی‌صدا'}</span>
            </button>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white">
            {CHAPTERS[3].title}
          </h2>
          <p className="text-xs sm:text-sm text-sky-300 mt-0.5">{CHAPTERS[3].subtitle}</p>
        </div>

        {/* Act 04 Right 3D Wing: Interactive Social Security & Insurance Selector (Activities 4-6) */}
        <div
          data-spatial-node="true"
          data-world-x={String(4.75 * wSign)}
          data-world-y="-0.4"
          data-world-z="-55.4"
          data-rot-y={String(-18 * wSign)}
          className="fixed top-0 left-0 w-[88vw] max-w-[375px] bg-[#060b19]/82 backdrop-blur-md border border-slate-700/80 border-t-2 border-t-sky-400 rounded-2xl p-4 shadow-2xl space-y-3"
        >
          <div className="flex items-center justify-between text-xs font-bold text-white">
            <div className="flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5 text-rose-400" />
              <span>کاوشگر تعاملی پوشش‌های بیمه و تأمین اجتماعی:</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {EMERGENCY_AGENCIES.map((agency) => {
              const isSelected = agency.code === activeEmergencyCode;
              return (
                <button
                  key={agency.code}
                  type="button"
                  onClick={() => handleSelectEmergencyCode(agency.code)}
                  className={`py-1.5 px-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-rose-600 border-rose-400 text-white font-extrabold shadow-lg'
                      : 'bg-[#0c1428] border-slate-800 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="text-[11px] font-extrabold truncate">{agency.code}</div>
                </button>
              );
            })}
          </div>

          <div className="bg-[#0c1428]/90 border border-slate-800 rounded-xl p-3 space-y-1.5">
            <div className="text-xs font-extrabold text-white">{selectedAgency.name}</div>
            <div className="text-[10px] text-emerald-400 font-semibold">
              {selectedAgency.responseTimeDesc}
            </div>
            <ul className="space-y-1 text-[10px] text-slate-300">
              {selectedAgency.primaryTasks.map((t) => (
                <li key={t} className="flex items-start gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Act 04 Left 3D Wing: Imam Ali (AS) & Christian Old Man Story (Dastan Rastan — Page 29) */}
        <div
          data-spatial-node="true"
          data-world-x={String(-4.75 * wSign)}
          data-world-y="-0.4"
          data-world-z="-55.4"
          data-rot-y={String(18 * wSign)}
          className="fixed top-0 left-0 w-[88vw] max-w-[375px] bg-[#060b19]/82 backdrop-blur-md border border-slate-700/80 border-t-2 border-t-amber-400 rounded-2xl p-4 shadow-2xl space-y-2.5"
        >
          {CHAPTERS[3].photos[0] && (
            <button
              type="button"
              onClick={() => setLightboxPhoto(CHAPTERS[3].photos[0])}
              className="w-full flex items-center gap-3 bg-[#0c1428] border border-slate-800 hover:border-amber-400 rounded-xl p-2 text-right transition-all cursor-pointer"
            >
              <img
                src={CHAPTERS[3].photos[0].src}
                alt={CHAPTERS[3].photos[0].title}
                referrerPolicy="no-referrer"
                className="w-20 h-16 object-cover rounded-lg shrink-0"
              />
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white">{CHAPTERS[3].photos[0].title}</div>
                <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                  <ZoomIn className="w-3 h-3" /> بزرگ‌نمایی متن اصلی کتاب داستان راستان
                </span>
              </div>
            </button>
          )}

          <div className="space-y-1">
            {DASTAN_RASTAN_PARTS.map((part, idx) => {
              const isSelected = idx === activeCoupletIndex;
              return (
                <button
                  key={part.hemistich1}
                  type="button"
                  onClick={() => setActiveCoupletIndex(idx)}
                  className={`w-full text-right p-2 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-400 text-white'
                      : 'bg-[#0c1428] border-slate-800 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-[11px] font-bold">
                    <span>{part.hemistich1}</span>
                    <span className="text-amber-300">{part.hemistich2}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="bg-[#0c1428]/90 border border-slate-800 rounded-xl p-2.5 space-y-1">
            <p className="text-[11px] text-white leading-relaxed">
              {DASTAN_RASTAN_PARTS[activeCoupletIndex].meaning}
            </p>
            <p className="text-[10px] text-emerald-400 font-semibold">
              {DASTAN_RASTAN_PARTS[activeCoupletIndex].lessonConnection}
            </p>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* ACT 05 SPATIAL NODES (Anchored around Z = -84.0 — Page 30)        */}
        {/* ----------------------------------------------------------------- */}
        <div
          data-spatial-node="true"
          data-world-x="0.0"
          data-world-y="3.15"
          data-world-z="-84.0"
          data-rot-y="0"
          className="fixed top-0 left-0 w-[92vw] max-w-[650px] bg-[#060b19]/80 backdrop-blur-md border border-emerald-500/40 border-t-2 border-t-emerald-400 rounded-2xl px-5 py-3.5 shadow-2xl text-center"
        >
          <div className="text-[11px] font-mono font-bold text-emerald-400 mb-0.5">
            ACT 05 · {CHAPTERS[4].numberLabel} · ۹ واژه کلیدی و آزمون پایانی
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white">
            {CHAPTERS[4].title}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-300 mt-0.5">{CHAPTERS[4].subtitle}</p>
        </div>

        {/* Act 05 Right 3D Wing: Interactive 9 Glossary Terms + Be Kar Bebandim (Page 30) */}
        <div
          data-spatial-node="true"
          data-world-x={String(4.75 * wSign)}
          data-world-y="-0.4"
          data-world-z="-83.4"
          data-rot-y={String(-18 * wSign)}
          className="fixed top-0 left-0 w-[88vw] max-w-[380px] bg-[#060b19]/82 backdrop-blur-md border border-slate-700/80 border-t-2 border-t-amber-400 rounded-2xl p-4 shadow-2xl space-y-2.5"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>واژه‌ها / بیشتر بدانیم (صفحه ۳۰):</span>
            </span>
            {CHAPTERS[4].photos[0] && (
              <button
                type="button"
                onClick={() => setLightboxPhoto(CHAPTERS[4].photos[0])}
                className="text-[10px] font-bold text-sky-400 hover:text-sky-300 inline-flex items-center gap-1 cursor-pointer"
              >
                <ZoomIn className="w-3 h-3" /> تصویر صفحه ۳۰
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-1">
            {LESSON6_GLOSSARY.map((item, idx) => {
              const isSelected = idx === activeGlossaryIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveGlossaryIndex(idx)}
                  className={`px-2 py-1.5 rounded-lg border text-[10px] font-bold truncate transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-300 shadow'
                      : 'bg-[#0c1428] border-slate-800 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {item.term}
                </button>
              );
            })}
          </div>

          <div className="bg-[#0c1428]/90 border border-slate-800 rounded-xl p-3 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-extrabold text-amber-300">
              <span>{LESSON6_GLOSSARY[activeGlossaryIndex].term}</span>
              <span className="text-[10px] text-slate-400">
                {LESSON6_GLOSSARY[activeGlossaryIndex].category}
              </span>
            </div>
            <p className="text-xs text-white leading-relaxed">
              {LESSON6_GLOSSARY[activeGlossaryIndex].definition}
            </p>
          </div>

          <div className="bg-[#0c1428]/90 border border-emerald-500/30 rounded-xl p-2.5 space-y-1">
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
              <Globe2 className="w-3 h-3" />
              <span>به کار ببندیم (صفحه ۳۰):</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed">
              ۱) بازدید از جمعیت هلال احمر یا دعوت از امدادگر به کلاس • ۲) پرس‌وجو درباره <strong>بیمه منازل مسکونی</strong> و توصیه آن به بزرگ‌ترهای خانواده.
            </p>
          </div>
        </div>

        {/* Act 05 Left 3D Wing: Interactive Lesson 6 Conference Quiz */}
        <div
          data-spatial-node="true"
          data-world-x={String(-4.75 * wSign)}
          data-world-y="-0.4"
          data-world-z="-83.4"
          data-rot-y={String(18 * wSign)}
          className="fixed top-0 left-0 w-[88vw] max-w-[375px] bg-[#060b19]/82 backdrop-blur-md border border-slate-700/80 border-t-2 border-t-emerald-400 rounded-2xl p-4 shadow-2xl space-y-2.5"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-white">
              آزمون زنده درس ۶ ({activeQuestionIdx + 1} از {CONFERENCE_QUIZ.length})
            </span>
            <span className="text-[11px] font-bold text-emerald-400">
              امتیاز: {quizResult.correctCount} از {quizResult.totalQuestions}
            </span>
          </div>

          {(() => {
            const q = CONFERENCE_QUIZ[activeQuestionIdx];
            const picked = selectedAnswers[q.id];
            const isAnswered = picked !== undefined;
            return (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-100 leading-relaxed">{q.question}</p>
                <div className="space-y-1.5">
                  {q.options.map((opt, oIdx) => {
                    const isPicked = picked === oIdx;
                    const isRight = q.correctIndex === oIdx;
                    let cls =
                      'bg-[#0c1428] border-slate-800 text-slate-200 hover:border-slate-600';
                    if (isAnswered) {
                      if (isRight) cls = 'bg-emerald-950/80 border-emerald-500 text-emerald-200';
                      else if (isPicked) cls = 'bg-rose-950/80 border-rose-500 text-rose-200';
                    }
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          setSelectedAnswers((prev) => ({ ...prev, [q.id]: oIdx }))
                        }
                        className={`w-full text-right px-3 py-2 rounded-xl border text-[11px] font-medium flex items-center justify-between gap-2 transition-all cursor-pointer ${cls}`}
                      >
                        <span>{opt}</span>
                        {isAnswered && isRight && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1">
                    {CONFERENCE_QUIZ.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveQuestionIdx(idx)}
                        className={`w-6 h-6 rounded-lg text-[11px] font-bold cursor-pointer ${
                          activeQuestionIdx === idx
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                  {answeredCount === CONFERENCE_QUIZ.length && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300">
                      <Award className="w-3.5 h-3.5" /> {quizResult.rankTitle}
                    </span>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* =================================================================== */}
      {/* 4. VIRTUAL 3D SCROLL CORRIDOR ANCHORS (Drives camera flight in Z)    */}
      {/* =================================================================== */}
      <main className="relative z-0 pointer-events-none">
        {CHAPTERS.map((ch, idx) => (
          <section
            key={ch.id}
            id={ch.id}
            ref={(el) => {
              sectionRefs.current[idx] = el;
            }}
            className="h-[115vh] w-full"
            aria-label={ch.title}
          />
        ))}
      </main>

      {/* 5. Bottom 3D Stage & Camera Control Dock */}
      <aside
        aria-label="کنترل‌های صحنه سه‌بعدی"
        className="fixed bottom-3 inset-x-0 z-40 pointer-events-none flex flex-col items-center px-4 gap-2"
      >
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsHudMinimized((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-300 hover:text-white bg-[#050814]/90 backdrop-blur-md border border-slate-800 rounded-lg shadow-lg cursor-pointer"
          >
            <Sliders className="w-3 h-3 text-rose-400" />
            <span>{isHudMinimized ? 'نمایش کنترل‌های سه‌بعدی (H)' : 'مخفی کردن کنترل‌ها (H)'}</span>
            {isHudMinimized ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {cameraOverride && (
            <button
              type="button"
              onClick={() => {
                setCameraOverride(null);
                setTargetOverride(null);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-amber-300 bg-[#050814]/90 border border-amber-500/40 rounded-lg shadow-lg cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>بازگشت به مسیر اسکرول</span>
            </button>
          )}
        </div>

        <div
          className={`bg-[#050814]/90 backdrop-blur-md border border-slate-800/90 rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 shadow-2xl flex flex-wrap items-center justify-center gap-2 sm:gap-5 max-w-[96vw] sm:max-w-4xl transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isHudMinimized
              ? 'translate-y-[135%] opacity-0 pointer-events-none scale-95'
              : 'translate-y-0 opacity-100 pointer-events-auto scale-100'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-rose-500 hidden sm:inline" />
            <span className="text-xs text-slate-400 hidden sm:inline">پرواز به ایستگاه:</span>
            <div className="flex flex-wrap items-center justify-center gap-1">
              {[
                { label: '۱. دانش‌آموزی', fullLabel: '۱. بیمه دانش‌آموزی', idx: 0 },
                { label: '۲. بیمه مرکزی', fullLabel: '۲. بیمه مرکزی', idx: 1 },
                { label: '۳. شخص ثالث', fullLabel: '۳. شخص ثالث و کارگران', idx: 2 },
                { label: '۴. تأمین اجتماعی', fullLabel: '۴. تأمین اجتماعی', idx: 3 },
                { label: '۵. واژه‌ها و آزمون', fullLabel: '۵. واژه‌ها و آزمون', idx: 4 },
              ].map((preset) => {
                const isCurrent = activeChapterIndex === preset.idx;
                return (
                  <button
                    key={preset.fullLabel}
                    type="button"
                    onClick={() => scrollToChapter(preset.idx)}
                    className={`px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                      isCurrent
                        ? 'bg-rose-600 text-white font-bold'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="sm:hidden">{preset.label}</span>
                    <span className="hidden sm:inline">{preset.fullLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden md:block" />

          <div className="hidden md:flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <label htmlFor="exploded-slider" className="text-xs text-slate-300 whitespace-nowrap">
              مقیاس سه‌بعدی:
            </label>
            <input
              id="exploded-slider"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={explodedFactor}
              onChange={(e) => setExplodedFactor(parseFloat(e.target.value))}
              className="w-20 accent-rose-500 cursor-pointer"
            />
          </div>

          <div className="h-4 w-px bg-slate-800 hidden md:block" />

          <div className="hidden md:flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <Sun className="w-3.5 h-3.5 text-amber-400 mr-1" />
            {(
              [
                { id: 'tactical-night', label: 'شب کهکشانی' },
                { id: 'golden-hope', label: 'طلوع طلایی' },
                { id: 'daylight-relief', label: 'آسمان فیروزه‌ای' },
              ] as const
            ).map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setLightingPreset(mode.id)}
                className={`px-2 py-1 text-xs rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  lightingPreset === mode.id
                    ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* 6. Full-Resolution Photo Lightbox Modal */}
      {lightboxPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lightboxPhoto.title}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-[#090d16] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800">
              <div>
                <span className="text-xs text-rose-400 font-semibold">{lightboxPhoto.category}</span>
                <h3 className="text-base font-bold text-white">{lightboxPhoto.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setLightboxPhoto(null)}
                aria-label="بستن تصویر"
                className="p-1.5 text-slate-400 hover:text-white bg-slate-900 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 bg-slate-950 flex items-center justify-center max-h-[70vh] overflow-auto">
              <img
                src={lightboxPhoto.src}
                alt={lightboxPhoto.title}
                referrerPolicy="no-referrer"
                className="max-h-[62vh] w-auto object-contain rounded-lg border border-slate-800"
              />
            </div>
            <div className="px-5 py-3.5 bg-[#090d16] border-t border-slate-800 text-xs sm:text-sm text-slate-300">
              {lightboxPhoto.subtitle}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
