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
        <fieldset key={size} className="bg-[#F3F6FA] border border-[#E3E8EF] rounded-[24px] p-5">
          <legend className="px-3 py-1 bg-white border border-[#E3E8EF] rounded-full text-[12px] font-extrabold text-[#0E1A2B] shadow-sm">
            {size === STANDARD ? 'One Size' : size}
            <span className="ml-2 text-[#2F6BFF]">{sizeTotal(variantStock, size)} units</span>
          </legend>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-2">
            {variantColors(colors).map((color) => (
              <label key={color} className="block">
                <span className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-[#6F7E92] mb-1.5 pl-2">
                  {color !== STANDARD && (
                    <span
                      className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: colorHex[color] ?? '#CFD8E3' }}
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
                  className="w-full px-5 py-3 bg-white border border-[#E3E8EF] rounded-full text-[14px] font-bold text-[#0E1A2B] focus:outline-none focus:border-[#2F6BFF] transition-all"
                />
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <div className="flex justify-between items-center px-5 py-3 bg-[#EAF1FF] border border-[#C9D9FF] rounded-full">
        <span className="text-[12px] font-extrabold uppercase tracking-wider text-[#2F6BFF]">Total Stock</span>
        <span className="text-[15px] font-black text-[#0E1A2B]">{stock} units</span>
      </div>
    </div>
  );
}
