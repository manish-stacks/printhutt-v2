import { customSizeType } from '@/lib/types/neon';
import React from 'react';
import { FiCheck } from 'react-icons/fi';

interface SizePresetsProps {
  selectedSize: customSizeType;
  onSizeSelect: (size: customSizeType) => void;
  preset: customSizeType[];
  multiColor?: boolean;
}

export const SizePresets: React.FC<SizePresetsProps> = ({
  preset,
  selectedSize,
  onSizeSelect,
  multiColor = false,
}) => {
  return (
    <div
      className="grid grid-cols-2 gap-3 sm:gap-4
                 max-h-[320px] sm:max-h-[360px] overflow-y-auto
                 pt-3 pb-1 px-0.5
                 scrollbar-thin"
    >
      {preset.length > 0 ? (
        preset.map((size) => {
          const isActive = selectedSize._id === size._id;
          return (
            <button
              key={size._id}
              onClick={() => onSizeSelect(size)}
              className={`relative p-2 sm:p-2 rounded-xl border-2 transition-all text-left
                ${isActive
                  ? 'border-pink-500 bg-pink-50 shadow-md shadow-pink-100'
                  : 'border-gray-200 bg-white hover:border-pink-300 hover:bg-pink-50/40'}`}
            >
              {/* selected check */}
              {isActive && (
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center shadow">
                  <FiCheck size={12} strokeWidth={3} />
                </span>
              )}

              {/* popular badge */}
              {size.isPopular && (
                <div
                  className="absolute -top-2.5 right-1 -translate-x-1/2
                             bg-gradient-to-r from-pink-500 to-rose-500
                             text-white text-[9px] sm:text-[10px] font-bold
                             tracking-wider uppercase
                             px-2 py-0.5 rounded-full shadow-md
                             whitespace-nowrap"
                >
                  ⭐ Popular
                </div>
              )}

              <div className="flex flex-col gap-2">
                {/* name */}
                <div
                  className={`font-semibold text-sm sm:text-base
                    ${isActive ? 'text-pink-700' : 'text-gray-900'}
                    pr-6 leading-tight`}
                >
                  {size.name}
                </div>

                {/* dimensions */}
                <div className="flex items-center gap-2 text-[11px] sm:text-xs text-gray-500">
                  <span className="bg-gray-100 px-1.5 py-0.5 rounded">
                    {size.width}&quot; W
                  </span>
                  <span className="bg-gray-100 px-1.5 py-0.5 rounded">
                    {size.height}&quot; H
                  </span>
                </div>

                {/* price */}
                <div
                  className={`text-base sm:text-lg font-bold mt-1
                    ${isActive ? 'text-pink-600' : 'text-gray-900'}`}
                >
                  ₹{size.price?.toLocaleString('en-IN')} <span className="text-xs text-gray-500 text-ellipsis line-through">₹{(size.price + (size.price * 0.3)).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </button>
          );
        })
      ) : (
        <div
          className="col-span-2 text-center text-gray-600 py-8 px-4
                     bg-gradient-to-br from-rose-50 to-pink-50
                     border-2 border-dashed border-rose-200
                     rounded-xl"
        >
          <p className="text-sm font-medium">No size available</p>
          <p className="text-xs text-gray-500 mt-1">
            Please customize your neon sign
          </p>
        </div>
      )}
    </div>
  );
};