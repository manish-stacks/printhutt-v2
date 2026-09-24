import { previewImages } from '@/app/product/customize-neon-sign/_data/preview-images';
import React from 'react';

interface PreviewGalleryProps {
  selectedPreview: number;
  onPreviewChange: (id: number) => void;
}

export const PreviewGallery: React.FC<PreviewGalleryProps> = ({
  selectedPreview,
  onPreviewChange,
}) => {
  return (
    <div
      className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2
                 w-[calc(100%-1.5rem)] sm:w-auto sm:max-w-[90%]
                 bg-black/60 backdrop-blur-md
                 p-1.5 sm:p-2 rounded-xl
                 shadow-xl border border-white/10
                 z-10"
    >
      {/* label */}
      <p className="text-[10px] uppercase tracking-wider text-white/60 font-semibold px-2 pt-1 pb-1 hidden sm:block">
        Background
      </p>

      <div
        className="flex gap-2 overflow-x-auto px-1 pb-1
                   scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent
                   snap-x snap-mandatory"
        style={{ scrollbarWidth: 'thin' }}
      >
        {previewImages.map((image) => {
          const isActive = selectedPreview === image.id;
          return (
            <button
              key={image.id}
              onClick={() => onPreviewChange(image.id)}
              aria-label={`Select ${image.alt} background`}
              className="relative group flex-shrink-0 snap-start"
            >
              <div
                className={`w-14 h-14 sm:w-20 sm:h-20 rounded-lg overflow-hidden
                  transition-all duration-200
                  ${isActive
                    ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-black/60 scale-105'
                    : 'opacity-60 hover:opacity-100 hover:scale-105'}`}
              >
                <img
                  src={image.url}
                  alt={image.alt}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* active pill — mobile pe chhota */}
              {isActive && (
                <span
                  className="absolute -top-1 -right-1 sm:top-1.5 sm:right-1.5
                             bg-blue-500 text-white
                             text-[8px] sm:text-[10px] font-semibold
                             w-3 h-3 sm:w-auto sm:h-auto sm:px-1.5 sm:py-0.5
                             rounded-full flex items-center justify-center
                             shadow"
                >
                  <span className="hidden sm:inline">Active</span>
                  <span className="sm:hidden">✓</span>
                </span>
              )}

              {/* tooltip — desktop only */}
              <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                           bg-black/90 text-white text-xs px-2 py-1 rounded
                           whitespace-nowrap pointer-events-none
                           opacity-0 group-hover:opacity-100 transition-opacity
                           hidden sm:block"
              >
                {image.alt}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};