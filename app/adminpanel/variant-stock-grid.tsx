'use client';

import { STANDARD, buildVariantStock, sizeTotal, variantColors, variantSizes, type VariantStock } from './demo-data';

/** One card per size with a quantity box for each color; the totals update as you type. */
export function VariantStockGrid({
  sizes,
  colors,
  values,
  onChange,
  colorHex = {},
}: {
  sizes: string[];
  colors: string[];
  values: VariantStock;
  onChange: (values: VariantStock) => void;
  colorHex?: Record<string, string>;
}) {
  const { variantStock, stock } = buildVariantStock(sizes, colors, values);

  return (
    <div className="space-y-4">
      {variantSizes(sizes).map((size) => (
        <fieldset key={size} className="bg-[#f5f5f7] border border-[#e5e5ea] rounded-[24px] p-5">
          <legend className="px-3 py-1 bg-white border border-[#e5e5ea] rounded-full text-[12px] font-extrabold text-[#1d1d1f] shadow-sm">
            {size === STANDARD ? 'One Size' : size}
            <span className="ml-2 text-[#ea580c]">{sizeTotal(variantStock, size)} units</span>
          </legend>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-2">
            {variantColors(colors).map((color) => (
              <label key={color} className="block">
                <span className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-[#86868b] mb-1.5 pl-2">
                  {color !== STANDARD && (
                    <span
                      className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: colorHex[color] ?? '#d2d2d7' }}
                    />
                  )}
                  <span className="truncate">{color === STANDARD ? 'Stock Quantity' : color}</span>
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  aria-label={`Stock for ${size}, ${color}`}
                  value={variantStock[size][color]}
                  onChange={(e) => {
                    const qty = e.target.value === '' ? 0 : Number(e.target.value);
                    if (!Number.isSafeInteger(qty) || qty < 0) return;
                    onChange({ ...values, [size]: { ...values[size], [color]: qty } });
                  }}
                  className="w-full px-5 py-3 bg-white border border-[#e5e5ea] rounded-full text-[14px] font-bold text-[#1d1d1f] focus:outline-none focus:border-[#ea580c] transition-all"
                />
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <div className="flex justify-between items-center px-5 py-3 bg-[#fff2e8] border border-orange-200 rounded-full">
        <span className="text-[12px] font-extrabold uppercase tracking-wider text-[#ea580c]">Total Stock</span>
        <span className="text-[15px] font-black text-[#1d1d1f]">{stock} units</span>
      </div>
    </div>
  );
}
