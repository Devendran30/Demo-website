'use client';

import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { STANDARD, buildVariantStock, variantColors, variantSizes, type Product, type VariantStock } from './demo-data';

// The KaavuStyles admin layout, in this admin's own colours and font, for the
// Add Product and Inventory screens.

export const K = {
  page: 'text-[#1d1d1f]',
  serif: 'font-bold tracking-tight',
  card: 'bg-white border border-[#e5e5ea] rounded-[24px] shadow-sm p-5 sm:p-8 space-y-5',
  label: 'block text-[11px] font-extrabold uppercase tracking-wider text-[#86868b] mb-1.5',
  input: 'w-full border border-[#e5e5ea] rounded-xl px-3 py-2.5 text-[13px] font-semibold text-[#1d1d1f] bg-[#f5f5f7] outline-none focus:bg-white focus:border-[#ea580c] focus:ring-4 focus:ring-[#ea580c]/10 transition-all',
  muted: 'text-[#86868b]',
  link: 'text-[#ea580c] hover:underline',
  chip: (selected: boolean, tone: 'accent' | 'soft' | 'dark') =>
    `px-3 py-1.5 text-[12px] font-semibold border rounded-lg transition-colors ${selected
      ? tone === 'accent' ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white border-transparent font-semibold'
        : tone === 'soft' ? 'bg-[#fff2e8] text-[#ea580c] border-[#ea580c] font-semibold'
          : 'bg-[#1d1d1f] text-white border-[#1d1d1f] font-semibold'
      : 'bg-[#f5f5f7] border-[#e5e5ea] text-[#1d1d1f] hover:border-[#ea580c]'}`,
  button: 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white shadow-sm hover:shadow-md transition-colors disabled:opacity-50',
};

export function KaavuChevron({ open = false, className = '' }: { open?: boolean; className?: string }) {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''} ${className}`}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/** A collapsible group, like Kaavu's "Photos for {color}" panels. */
export function KaavuDetails({ title, meta, swatch, children, defaultOpen = false }: { title: string; meta?: string; swatch?: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group/photos rounded-xl border border-[#e5e5ea] overflow-hidden">
      <summary className="flex items-center gap-3 p-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden bg-[#f9f9fb]">
        {swatch && <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: swatch }} />}
        <span className="flex-1 font-medium text-[#1d1d1f] text-sm">{title}</span>
        {meta && <span className="text-xs text-[#86868b]">{meta}</span>}
        <KaavuChevron className="group-open/photos:rotate-180" />
      </summary>
      <div className="p-3 sm:p-4">{children}</div>
    </details>
  );
}

/** One box per size with a stock quantity for each colour — Kaavu's VariantStockFields. */
export function KaavuStockFields({
  sizes, colors, values, onChange, disabled = false, colorHex = {},
}: {
  sizes: string[]; colors: string[]; values: VariantStock; onChange: (values: VariantStock) => void; disabled?: boolean; colorHex?: Record<string, string>;
}) {
  const { variantStock } = buildVariantStock(sizes, colors, values);
  return (
    <div className="space-y-4">
      {variantSizes(sizes).map((size) => (
        <fieldset key={size} className="rounded-xl border border-[#e5e5ea] p-4">
          <legend className="px-2 text-sm font-semibold text-[#1d1d1f]">{size === STANDARD ? 'No size / General' : size}</legend>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {variantColors(colors).map((color) => (
              <label key={color} className="text-xs text-[#1d1d1f]">
                <span className="mb-2 font-medium flex items-center gap-1.5">
                  {color !== STANDARD && <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: colorHex[color] ?? '#d2d2d7' }} />}
                  {color === STANDARD ? 'Stock quantity' : color}
                </span>
                <input
                  type="number"
                  required
                  min="0"
                  step="1"
                  disabled={disabled}
                  aria-label={`Stock for ${size}, ${color}`}
                  value={variantStock[size][color]}
                  onChange={(event) => {
                    const qty = event.target.value === '' ? 0 : Number(event.target.value);
                    if (Number.isSafeInteger(qty) && qty >= 0) onChange({ ...values, [size]: { ...values[size], [color]: qty } });
                  }}
                  className="w-full rounded-lg border border-[#e5e5ea] bg-white p-3 text-base outline-none focus:border-[#ea580c]"
                />
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

const MAX_FILE = 1024 * 1024;

/**
 * Kaavu's photo uploader: upload requirements, a grid of photos (the first is the cover) and a dashed
 * tile to add more. Photos are kept as data URLs in this browser, so each file is limited to 1 MB.
 */
export function KaavuImageUploader({ images, onChange, label }: { images: string[]; onChange: (images: string[]) => void; label: string }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [urlMode, setUrlMode] = useState(false);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const all = Array.from(files);
    const tooBig = all.filter((f) => f.size > MAX_FILE).map((f) => f.name);
    const ok = all.filter((f) => f.size <= MAX_FILE);
    setError(tooBig.length ? `Over 1 MB, not added: ${tooBig.join(', ')}` : '');
    if (!ok.length) return;
    setBusy(true);
    Promise.all(ok.map((file) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    })))
      .then((added) => onChange([...images, ...added]))
      .catch(() => setError('Could not read that photo. Please try another.'))
      .finally(() => setBusy(false));
  };

  const addUrl = () => {
    const value = url.trim();
    if (!value) return;
    if (!/^https?:\/\//.test(value)) return setError('Enter a full image link starting with http:// or https://');
    onChange([...images, value]);
    setUrl('');
    setError('');
  };

  return (
    <div className="space-y-3 min-w-0" role="group" aria-label={label}>
      <div className="flex flex-wrap justify-between items-center gap-2">
        <p className="text-xs font-semibold text-[#1d1d1f]">{label}</p>
        <button type="button" onClick={() => setUrlMode(!urlMode)} className="text-xs text-[#ea580c] hover:underline">
          {urlMode ? 'Upload from device' : 'Paste image URL'}
        </button>
      </div>
      <div className="rounded-xl border-2 border-[#ea580c] bg-[#f9f9fb] p-3 sm:p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-[#ea580c]">Image upload requirements</p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#1d1d1f]">
          <span className="rounded-md border border-[#ea580c]/50 bg-white px-3 py-2">Original file: <strong>1 MB max</strong></span>
          <span className="rounded-md border border-[#ea580c]/50 bg-white px-3 py-2">Dimensions: <strong>Any size or proportions</strong></span>
        </div>
      </div>
      <input ref={fileInput} type="file" accept="image/*" multiple className="hidden" aria-label={label} onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
      {urlMode && (
        <div className="flex flex-col sm:flex-row gap-2">
          <input type="url" aria-label={`Image URL for ${label}`} placeholder="https://example.com/photo.jpg" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }} className="min-w-0 flex-1 rounded-lg border border-[#e5e5ea] bg-white p-3 text-base sm:text-sm outline-none focus:border-[#ea580c]" />
          <button type="button" disabled={!url.trim()} onClick={addUrl} className={`rounded-lg px-4 py-3 text-xs font-semibold ${K.button}`}>Add photo</button>
        </div>
      )}
      <div className="rounded-xl border border-[#e5e5ea] bg-[#f9f9fb] p-3 sm:p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {images.map((src, index) => (
            <div key={`${index}-${src.slice(-24)}`} className="relative aspect-square min-w-0 rounded-lg overflow-hidden border border-[#e5e5ea] bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`${label}, photo ${index + 1}`} className="absolute inset-0 h-full w-full object-cover" />
              <button type="button" aria-label={`Remove photo ${index + 1} from ${label}`} onClick={() => onChange(images.filter((_, i) => i !== index))} className="absolute top-2 right-2 z-10 inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/95 text-[#ea580c] shadow-sm hover:bg-[#ea580c] hover:text-white">✕</button>
              {index === 0 ? (
                <span className="absolute left-2 top-2 bg-[#1d1d1f]/80 px-2 py-1 rounded text-[9px] uppercase tracking-wider text-white">Cover</span>
              ) : (
                <button type="button" onClick={() => onChange([src, ...images.filter((_, i) => i !== index)])} className="absolute left-2 bottom-2 bg-white/90 px-2 py-1 rounded text-[9px] uppercase tracking-wider text-[#1d1d1f] hover:bg-white">Make cover</button>
              )}
            </div>
          ))}
          <button
            type="button"
            disabled={busy}
            onClick={() => fileInput.current?.click()}
            className={`rounded-lg border-2 border-dashed border-[#ea580c]/40 bg-white/60 hover:bg-[#ea580c]/5 hover:border-[#ea580c] transition-colors flex flex-col items-center justify-center gap-2 text-center p-4 disabled:cursor-wait ${images.length ? 'aspect-square' : 'col-span-2 sm:col-span-3 lg:col-span-5 min-h-[160px]'}`}
          >
            <span className="text-[#ea580c] text-2xl leading-none">{images.length ? '+' : '⇪'}</span>
            <span className="text-xs font-semibold text-[#1d1d1f]">{busy ? 'Adding photos…' : images.length ? 'Add photo' : 'Choose photos from device'}</span>
            {!images.length && <span className="max-w-xs text-xs text-[#86868b]">You can select several at once.</span>}
          </button>
        </div>
        {images.length > 0 && <p className="mt-3 text-[11px] text-[#86868b]">{images.length} photo{images.length === 1 ? '' : 's'} · Use + to upload more photos.</p>}
      </div>
      {error && <p role="alert" className="rounded-lg border border-[#ea580c]/40 bg-[#ea580c]/5 p-3 text-sm font-medium text-[#ea580c]">{error}</p>}
    </div>
  );
}

/** A product row that opens to its stock boxes — Kaavu's Inventory page row. */
export function KaavuInventoryRow({
  product, colorHex, onSave, onEdit,
}: {
  product: Product; colorHex: Record<string, string>; onSave: (values: VariantStock) => void; onEdit: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<VariantStock>(product.variantStock);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState('');
  const pill = product.stock === 0 ? 'bg-rose-50 text-rose-700' : product.stock <= 5 ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800';
  const cover = product.image || product.images[0];

  return (
    <div className="bg-white rounded-xl border border-[#e5e5ea] overflow-hidden shadow-sm">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="w-full text-left p-4 sm:p-5 flex items-center gap-3 sm:gap-4 hover:bg-[#f9f9fb]/60 transition-colors">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="w-12 h-16 shrink-0 rounded-lg object-cover bg-[#f5f5f7]" />
        ) : (
          <span className="w-12 h-16 shrink-0 rounded-lg bg-[#f5f5f7]" />
        )}
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="font-medium text-[#1d1d1f] line-clamp-2 sm:line-clamp-1 text-sm sm:text-base">{product.name}</span>
            <KaavuChevron open={open} />
          </span>
          <span className="block text-xs text-[#86868b] mt-1 truncate">
            {product.category} · {product.sizes.length ? `${product.sizes.length} size${product.sizes.length === 1 ? '' : 's'}` : 'General stock'}
            {product.colors.length > 0 && ` · ${product.colors.length} colour${product.colors.length === 1 ? '' : 's'}`}
          </span>
        </span>
        <span className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap ${pill}`}>{product.stock} in stock</span>
      </button>

      {open && (
        <div className="border-t border-[#e5e5ea] bg-[#f9f9fb]/50 p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-[10px] text-[#86868b]">ID: {product.id} · SKU: {product.sku}</p>
            <button type="button" onClick={onEdit} className="text-xs text-[#ea580c] hover:underline">Edit product details →</button>
          </div>
          <KaavuStockFields
            sizes={product.sizes}
            colors={product.colors}
            values={dirty ? draft : product.variantStock}
            colorHex={colorHex}
            onChange={(values) => { setDraft(values); setDirty(true); setMessage(''); }}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!dirty}
              onClick={() => { onSave(draft); setDirty(false); setMessage('Stock saved.'); }}
              className={`rounded-lg px-5 py-2.5 text-xs font-semibold ${K.button}`}
            >
              Save stock
            </button>
            {dirty && (
              <button type="button" onClick={() => { setDirty(false); setMessage(''); }} className="text-xs text-[#86868b] hover:text-[#1d1d1f]">Cancel</button>
            )}
            {message && <span role="status" className="text-xs text-emerald-700">{message}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
