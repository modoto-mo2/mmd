import { ChevronDown, ChevronUp, Compass, Eye, Layers, RotateCcw, Sun } from 'lucide-react';
import { CHAPTERS } from '../data/conferenceData';
import type { LightingPreset } from './RescueDioramaCanvas';

interface BottomControlDockProps {
  activeChapterIndex: number;
  onSelectCameraPreset: (index: number) => void;
  onResetCameraOverride: () => void;
  hasCameraOverride: boolean;
  explodedFactor: number;
  onChangeExplodedFactor: (val: number) => void;
  lightingPreset: LightingPreset;
  onChangeLightingPreset: (preset: LightingPreset) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isCinemaMode: boolean;
  onToggleCinemaMode: () => void;
}

const CAMERA_SHORT_LABELS = [
  '۱. زلزله',
  '۲. همدلی',
  '۳. هلال احمر',
  '۴. امداد ۱۱۲',
  '۵. بنی‌آدم',
];

export default function BottomControlDock({
  activeChapterIndex,
  onSelectCameraPreset,
  onResetCameraOverride,
  hasCameraOverride,
  explodedFactor,
  onChangeExplodedFactor,
  lightingPreset,
  onChangeLightingPreset,
  isCollapsed,
  onToggleCollapse,
  isCinemaMode,
  onToggleCinemaMode,
}: BottomControlDockProps) {
  return (
    <div
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 w-[96vw] max-w-[1060px] pointer-events-auto"
      role="region"
      aria-label="میز فرمان صحنه سه‌بعدی کنفرانس"
    >
      {/* Top Collapse / Expand Handle + Cinema Mode Toggle */}
      <div className="flex items-center justify-center gap-2 mb-1.5">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-200 bg-[#0b1120] border border-slate-700/80 rounded-lg hover:bg-slate-800 hover:text-white transition-colors whitespace-nowrap shrink-0 shadow-lg"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-rose-400" />
              <span>نمایش میز فرمان سه‌بعدی (H)</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-rose-400" />
              <span>مخفی کردن کنترل‌ها (H)</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onToggleCinemaMode}
          className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 shadow-lg ${
            isCinemaMode
              ? 'bg-rose-600 text-white border-rose-500'
              : 'bg-[#0b1120] text-slate-200 border-slate-700/80 hover:bg-slate-800'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{isCinemaMode ? 'بازگشت به متن کنفرانس' : 'نمای خالص سه‌بعدی (بدون متن)'}</span>
        </button>
      </div>

      {/* Main Dock Panel (Solid dark surface — zero backdrop-filter over WebGL) */}
      {!isCollapsed && (
        <div className="bg-[#0b1120] border border-slate-800 rounded-xl px-3 py-2 shadow-2xl">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
            {/* Camera Viewpoint Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              <span className="inline-flex items-center gap-1 text-xs text-slate-400 pl-1 whitespace-nowrap shrink-0">
                <Compass className="w-3.5 h-3.5 text-rose-400" />
                <span>ایستگاه سه‌بعدی:</span>
              </span>
              <div className="flex items-center gap-1 bg-[#111827] p-1 rounded-lg border border-slate-800/90">
                {CHAPTERS.map((ch, idx) => {
                  const isActive = activeChapterIndex === idx;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => onSelectCameraPreset(idx)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        isActive
                          ? 'bg-rose-600 text-white'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {CAMERA_SHORT_LABELS[idx]}
                    </button>
                  );
                })}
              </div>
              {hasCameraOverride && (
                <button
                  type="button"
                  onClick={onResetCameraOverride}
                  title="هماهنگی مجدد دوربین با اسکرول"
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs text-amber-300 bg-slate-900 border border-amber-500/30 rounded-md hover:bg-slate-800 whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>قفل اسکرول</span>
                </button>
              )}
            </div>

            {/* Exploded View Slider & Lighting Switcher */}
            <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
              {/* Exploded Slider */}
              <div className="flex items-center gap-2">
                <label
                  htmlFor="exploded-slider"
                  className="inline-flex items-center gap-1 text-xs text-slate-300 whitespace-nowrap shrink-0"
                >
                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                  <span>تفکیک لایه‌ها:</span>
                </label>
                <input
                  id="exploded-slider"
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={explodedFactor}
                  onChange={(e) => onChangeExplodedFactor(parseFloat(e.target.value))}
                  className="w-24 accent-rose-500 cursor-pointer"
                  aria-label="اسلایدر تفکیک لایه‌های صحنه سه‌بعدی"
                />
                <span className="text-xs font-mono tabular-nums text-slate-400 w-8 text-left">
                  {Math.round(explodedFactor * 100)}%
                </span>
              </div>

              {/* Lighting Mood Switcher */}
              <div className="flex items-center gap-1 bg-[#111827] p-1 rounded-lg border border-slate-800/90">
                <Sun className="w-3.5 h-3.5 text-amber-400 mx-1 shrink-0" />
                {(
                  [
                    { id: 'tactical-night', label: 'شب عملیاتی' },
                    { id: 'golden-hope', label: 'طلوع همدلی' },
                    { id: 'daylight-relief', label: 'روز امداد' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onChangeLightingPreset(item.id)}
                    className={`px-2 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      lightingPreset === item.id
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
