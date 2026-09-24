import { customSizeType } from '@/lib/types/neon';
import React from 'react';

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
  if (preset.length === 0) {
    return (
      <div className="text-center text-sm text-neutral-500 py-8 border border-dashed border-neutral-300 rounded-xl">
        No size available. Please customize your neon sign.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 max-h-[280px] overflow-y-auto pt-2 pr-1">
      {preset.map((size) => {
        const price = multiColor ? size.multicolor : size.price;
        const originalPrice = price ? Math.round(price * 1.3) : undefined;
        const isSelected = selectedSize._id === size._id;

        return (
          <button
            key={size._id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSizeSelect(size)}
            className={`group relative flex flex-col gap-2 rounded-xl border p-3 text-left transition-colors
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 focus-visible:ring-offset-1
              ${isSelected
                ? 'border-fuchsia-500 bg-fuchsia-500/5 shadow-[0_0_0_1px_rgba(217,70,239,0.15),0_0_16px_-4px_rgba(217,70,239,0.5)]'
                : 'border-neutral-200 hover:border-fuchsia-300 hover:bg-fuchsia-500/[0.02]'
              }`}
          >
            {size.isPopular && (
              <span className="absolute -top-2.5 right-5 rounded-full bg-fuchsia-500 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white shadow-sm">
                Popular
              </span>
            )}

            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-neutral-900">
                  {size.name}
                </div>
                <div className="text-xs text-neutral-500">
                  {size.width}&quot; W &times; {size.height}&quot; H
                </div>
              </div>

              <span
                className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full border-2 transition-colors
                  ${isSelected ? 'border-fuchsia-500 bg-fuchsia-500' : 'border-neutral-300 bg-transparent'}`}
              />
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-neutral-900">
                ₹{price?.toLocaleString('en-IN')}
              </span>
              {originalPrice && (
                <span className="text-xs text-neutral-400 line-through">
                  ₹{originalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};