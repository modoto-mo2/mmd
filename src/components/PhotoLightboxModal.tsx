import { X, ZoomIn } from 'lucide-react';
import type { ExtractedPhotoAsset } from '../data/conferenceData';

interface PhotoLightboxModalProps {
  photo: ExtractedPhotoAsset | null;
  onClose: () => void;
}

export default function PhotoLightboxModal({ photo, onClose }: PhotoLightboxModalProps) {
  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lightbox-photo-title"
      onClick={onClose}
    >
      <div
        className="bg-[#0b1120] border border-slate-700 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-xs text-rose-400 font-semibold">
              <ZoomIn className="w-3.5 h-3.5" />
              <span>{photo.category}</span>
            </div>
            <h2 id="lightbox-photo-title" className="text-lg font-extrabold text-white">
              {photo.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="بستن تصویر"
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-[#060911] p-6 flex items-center justify-center max-h-[68vh] overflow-hidden">
          <img
            src={photo.src}
            alt={photo.title}
            referrerPolicy="no-referrer"
            className="max-h-[62vh] w-auto object-contain rounded-xl border border-slate-800 shadow-2xl"
          />
        </div>

        <div className="px-6 py-4 bg-[#111827] border-t border-slate-800">
          <p className="text-sm text-slate-200 leading-relaxed">{photo.subtitle}</p>
        </div>
      </div>
    </div>
  );
}
