import React, { useRef, useEffect } from 'react'
import { BiChevronDown } from 'react-icons/bi'
import { CustomizationButton, fontsName } from '../CustomizationButton';

interface FontPickerProps {
  selectedFont: string;
  onFontChange: (font: string) => void;
}

export const FontPicker = ({ selectedFont, onFontChange }: FontPickerProps) => {
  const [open, setOpen] = React.useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selectFont = fontsName.find(item => item.font === selectedFont);

  // close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!selectFont) return null;

  return (
    <div className="space-y-2" ref={wrapperRef}>
      {/* header */}
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg sm:text-xl font-semibold tracking-wide text-gray-900">
          CHOOSE FONT
        </h3>
        <span className="text-[10px] sm:text-xs text-gray-400 font-medium">
          {fontsName.length}+ styles
        </span>
      </div>
      <p className="text-gray-500 text-xs hidden sm:block">
        Pick from over 50 typefaces.
      </p>

      {/* trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={`group relative w-full p-3 sm:p-4 rounded-xl border-2 transition-all flex items-center justify-between
          ${open
            ? 'border-pink-500 bg-pink-50 shadow-sm'
            : 'border-gray-200 hover:border-pink-300 hover:bg-pink-50/30 bg-white'}`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold hidden sm:block">
            Font:
          </span>
          <div
            style={{ fontFamily: selectFont.font }}
            className="font-medium text-lg sm:text-xl text-gray-900 truncate"
          >
            {selectFont.name}
          </div>
        </div>

        <BiChevronDown
          className={`text-gray-500 group-hover:text-pink-500 transition-transform flex-shrink-0 ml-2 ${open ? 'rotate-180' : ''}`}
          size={22}
        />
      </button>

      {/* dropdown panel */}
      {open && (
        <div className="relative animate-slideDown">
          <div className="bg-white border-2 border-gray-100 rounded-xl shadow-lg p-2 sm:p-3 max-h-[300px] overflow-y-auto">
            <CustomizationButton
              selectedFont={selectedFont}
              handleFontChange={(f: string) => {
                onFontChange(f);
                setOpen(false);
              }}
            />
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.18s ease-out;
        }
      `}</style>
    </div>
  );
};