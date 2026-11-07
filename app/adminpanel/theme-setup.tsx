'use client';

import { useRef, useState } from 'react';
import {
  useStore, themeSettingsStore, allThemes, BUILT_IN_THEMES, THEME_COLOR_KEYS, THEME_LAYOUTS, type StoreTheme, type ThemeColors, type ThemeLayout,
} from './demo-data';

const MAX_THEME_FILE = 1024 * 1024;

// What each design changes, shown on its card. Screenshots live in public/theme-previews.
const LAYOUT_INFO: Record<ThemeLayout, { label: string; features: string[] }> = {
  signature: { label: 'Signature', features: ['Glass header over a photo hero', 'Bento category tiles', 'Rounded product cards'] },
  marketplace: { label: 'Marketplace', features: ['Search-first header with category bar', 'Category sidebar and slider', 'Flash deal and dense 5-column grids'] },
  lifestyle: { label: 'Lifestyle', features: ['Colour-block collage hero', 'Floating search card', 'Soft cards and pastel promos'] },
  boutique: { label: 'Boutique', features: ['Centred serif wordmark', 'Editorial hero and lookbook rows', 'Frameless cards, sharp edges'] },
  volt: { label: 'Volt', features: ['Giant uppercase type', 'Outlined blocks with offset shadows', 'Stickers and a scrolling ticker'] },
  aster: { label: 'Aster', features: ['Quiet split hero', 'Numbered category index', 'Airy 3-column grid and spec sheet'] },
  atelier: { label: 'Atelier', features: ['Slim glass bar and a giant product stage', 'Two-up showcase tiles and a “latest” shelf', 'Dark spotlight with big spec numbers'] },
  aurora: { label: 'Aurora', features: ['Floating pill navbar over a glowing hero', 'Bento grid with a live deal countdown', 'Glass cards and a moving category ribbon'] },
};
const HEX = /^#[0-9A-Fa-f]{6}$/;

/** Blends two hex colours; `amount` is how much of `to` to mix in (0 to 1). */
function mix(from: string, to: string, amount: number) {
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  return `#${[0, 1, 2].map((i) => Math.round(channel(from, i) + (channel(to, i) - channel(from, i)) * amount).toString(16).padStart(2, '0')).join("").toUpperCase()}`;
}

/** Reads an uploaded theme file. Only `name` and `colors.accent` are required; missing shades are worked out from the accent and ink. */
function parseThemeFile(text: string): StoreTheme {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('This file is not valid JSON. Start from the sample theme file.');
  }
  const raw = (data ?? {}) as { name?: unknown; version?: unknown; tagline?: unknown; layout?: unknown; colors?: Record<string, unknown> };
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (!name) throw new Error('The theme file needs a "name".');
  if (raw.layout !== undefined && !THEME_LAYOUTS.includes(raw.layout as ThemeLayout)) throw new Error(`"layout" must be one of: ${THEME_LAYOUTS.join(', ')}.`);
  const layout = (raw.layout as ThemeLayout | undefined) ?? 'signature';
  const colors = raw.colors ?? {};
  if (!HEX.test(String(colors.accent ?? ''))) throw new Error('The theme file needs "colors.accent" as a hex code like #2F6BFF.');
  const bad = THEME_COLOR_KEYS.filter((key) => colors[key] !== undefined && !HEX.test(String(colors[key])));
  if (bad.length) throw new Error(`These colours aren't 6-digit hex codes: ${bad.join(', ')}.`);
  const given = colors as Partial<ThemeColors>;
  const accent = given.accent!;
  const ink = given.ink ?? BUILT_IN_THEMES[0].colors.ink;
  const merged: ThemeColors = {
    accent,
    accent2: given.accent2 ?? mix(accent, '#FFFFFF', 0.3),
    accentDark: given.accentDark ?? mix(accent, '#000000', 0.18),
    accentLight: given.accentLight ?? mix(accent, '#FFFFFF', 0.5),
    accentSoft: given.accentSoft ?? mix(accent, '#FFFFFF', 0.9),
    accentLine: given.accentLine ?? mix(accent, '#FFFFFF', 0.75),
    ink,
    ink2: given.ink2 ?? mix(ink, '#FFFFFF', 0.07),
    ink3: given.ink3 ?? mix(ink, '#FFFFFF', 0.16),
    deep: given.deep ?? mix(ink, '#000000', 0.3),
    page: given.page ?? BUILT_IN_THEMES[0].colors.page,
  };
  return {
    id: `custom-${Date.now()}`,
    name: name.slice(0, 40),
    version: typeof raw.version === 'string' && raw.version.trim() ? raw.version.trim().slice(0, 12) : '1.0',
    tagline: typeof raw.tagline === 'string' && raw.tagline.trim() ? raw.tagline.trim().slice(0, 60) : `${LAYOUT_INFO[layout].label} design in your colours`,
    layout,
    colors: merged,
    custom: true,
  };
}

function downloadSample() {
  const { colors } = BUILT_IN_THEMES[0];
  const sample = { name: 'My Theme', version: '1.0', tagline: 'Describe the look in a few words', layout: 'boutique', colors };
  const url = URL.createObjectURL(new Blob([JSON.stringify(sample, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'sample-theme.json';
  link.click();
  URL.revokeObjectURL(url);
}

/** A screenshot of the design's home page in a browser frame, like a theme marketplace listing. */
function ThemeShot({ layout, name }: { layout: ThemeLayout; name: string }) {
  return (
    <div className="rounded-xl overflow-hidden border border-[#E3E8EF] bg-white shadow-sm">
      <div aria-hidden="true" className="h-6 px-3 flex items-center gap-1.5 bg-[#F3F6FA] border-b border-[#E3E8EF]">
        <span className="w-2 h-2 rounded-full bg-[#FF5F57]" /><span className="w-2 h-2 rounded-full bg-[#FEBC2E]" /><span className="w-2 h-2 rounded-full bg-[#28C840]" />
        <span className="ml-3 h-3 flex-1 max-w-[180px] rounded-full bg-white" />
      </div>
      <div className="aspect-[16/11] overflow-hidden bg-[#F3F6FA]">
        <img src={`/theme-previews/${layout}.jpg`} alt={`${name} home page`} loading="lazy" className="w-full h-full object-cover object-top transition-transform duration-[2500ms] ease-in-out group-hover:object-bottom" />
      </div>
    </div>
  );
}

const SWATCHES: { key: keyof ThemeColors; label: string }[] = [
  { key: 'accent', label: 'Accent' }, { key: 'accent2', label: 'Glow' }, { key: 'ink', label: 'Ink' }, { key: 'deep', label: 'Deep' }, { key: 'page', label: 'Page' },
];

export function ThemeSetup({ notify }: { notify: (message: string) => void }) {
  const settings = useStore(themeSettingsStore);
  const themes = allThemes(settings);
  const live = themes.find((theme) => theme.id === settings.activeId) ?? BUILT_IN_THEMES[0];
  const fileInput = useRef<HTMLInputElement>(null);
  const [staged, setStaged] = useState<{ fileName: string; theme: StoreTheme } | null>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);

  const readFile = (file: File | undefined) => {
    if (!file) return;
    setError('');
    setStaged(null);
    if (!/\.json$/i.test(file.name)) return setError('Upload a .json theme file.');
    if (file.size > MAX_THEME_FILE) return setError('The theme file is larger than 1 MB.');
    file.text().then(
      (text) => {
        try {
          setStaged({ fileName: file.name, theme: parseThemeFile(text) });
        } catch (reason) {
          setError(reason instanceof Error ? reason.message : 'This theme file could not be read.');
        }
      },
      () => setError('This theme file could not be read.')
    );
  };

  const cancel = () => {
    setStaged(null);
    setError('');
  };
  const install = () => {
    if (!staged) return;
    themeSettingsStore.set({ ...settings, custom: [...settings.custom, staged.theme] });
    notify(`${staged.theme.name} installed. Select it below to put it live.`);
    setStaged(null);
  };
  const activate = (theme: StoreTheme) => {
    if (theme.id === settings.activeId) return;
    themeSettingsStore.set({ ...settings, activeId: theme.id });
    notify(`${theme.name} is now live on the store.`);
  };
  const remove = (theme: StoreTheme) => {
    if (!window.confirm(`Delete ${theme.name}? This can't be undone.`)) return;
    const wasLive = theme.id === settings.activeId;
    themeSettingsStore.set({ activeId: wasLive ? 'default' : settings.activeId, custom: settings.custom.filter((t) => t.id !== theme.id) });
    notify(wasLive ? `${theme.name} deleted. The store is back on the Default Theme.` : `${theme.name} deleted.`);
  };

  return (
    <div className="space-y-6">
      {/* Upload Theme */}
      <section className="bg-white border border-[#E3E8EF] rounded-[24px] shadow-sm p-5 sm:p-8">
        <h2 className="text-xl font-bold tracking-tight text-[#0E1A2B]">Upload Theme</h2>
        <p className="mt-1 text-sm text-[#6F7E92]">Upload your own theme: one of the store designs below, painted in your brand colours.</p>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-[20px] bg-[#F6F8FB] p-4 sm:p-6">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); readFile(e.dataTransfer.files[0]); }}
              className={`h-full min-h-[260px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center px-5 py-8 transition-colors ${dragging ? 'border-[#2F6BFF] bg-[#EAF1FF]' : 'border-[#C9D2DD] bg-white/60'}`}
            >
              {staged ? (
                <>
                  <div className="flex -space-x-2">
                    {SWATCHES.map((s) => <span key={s.key} className="w-9 h-9 rounded-full border-2 border-white shadow-sm" style={{ background: staged.theme.colors[s.key] }} />)}
                  </div>
                  <p className="mt-4 text-[15px] font-bold text-[#0E1A2B]">{staged.theme.name} <span className="text-[#2F6BFF]">· v{staged.theme.version}</span></p>
                  <p className="mt-1 text-[13px] text-[#6F7E92] break-all">{staged.fileName} is ready. Press Save to install it.</p>
                  <button type="button" onClick={() => fileInput.current?.click()} className="mt-5 h-11 px-6 rounded-xl border-2 border-[#2F6BFF] text-[#2F6BFF] text-[14px] font-bold hover:bg-[#EAF1FF]">Choose another file</button>
                </>
              ) : (
                <>
                  <svg aria-hidden="true" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#5B6B80" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16l-4-4-4 4" /><path d="M12 12v9" /><path d="M20.4 18.4A5 5 0 0 0 18 9h-1.3A8 8 0 1 0 3 16.3" /></svg>
                  <p className="mt-4 text-[15px] text-[#3A4A5F]">Select a file or <span className="font-bold text-[#0E1A2B]">Drag &amp; Drop</span> here</p>
                  <p className="mt-1 text-[13px] text-[#6F7E92]">A .json theme file, no more than 1 MB</p>
                  <button type="button" onClick={() => fileInput.current?.click()} className="mt-6 h-11 px-7 rounded-xl border-2 border-[#2F6BFF] text-[#2F6BFF] text-[14px] font-bold hover:bg-[#EAF1FF]">Select File</button>
                </>
              )}
              {error && <p role="alert" className="mt-4 text-[13px] font-semibold text-red-600">{error}</p>}
              <input ref={fileInput} type="file" accept=".json,application/json" className="hidden" onChange={(e) => { readFile(e.target.files?.[0]); e.target.value = ''; }} />
            </div>
          </div>

          <div className="rounded-[20px] bg-[#FFF7EE] p-6 sm:p-8 flex flex-col justify-center">
            <h3 className="text-lg font-bold text-[#2F6BFF]">Instructions</h3>
            <ul className="mt-3 space-y-2.5 text-[14px] leading-relaxed text-[#3A4A5F] list-disc pl-5">
              <li>Upload a theme as a <span className="font-semibold">.json</span> file of up to 1 MB. Start from the sample file below.</li>
              <li>The file needs a <span className="font-mono text-[13px]">name</span> and an <span className="font-mono text-[13px]">accent</span> colour. Any shade you leave out is worked out from your accent and ink colours.</li>
              <li>Pick the design with <span className="font-mono text-[13px]">layout</span>: {THEME_LAYOUTS.map((l, i) => <span key={l}>{i ? ', ' : ''}<span className="font-mono text-[13px]">{l}</span></span>)}. Without it the theme uses the default design.</li>
              <li>Colours are 6-digit hex codes, such as <span className="font-mono text-[13px]">#2F6BFF</span>.</li>
              <li>Installing a theme doesn&apos;t change the store. Select it under Available Themes to put it live.</li>
            </ul>
            <button type="button" onClick={downloadSample} className="mt-5 self-start inline-flex items-center gap-2 text-[13.5px] font-bold text-[#2F6BFF] hover:underline">
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>
              Download sample theme file
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={cancel} disabled={!staged && !error} className="h-12 px-8 rounded-xl bg-[#EDF1F6] text-[#0E1A2B] text-[14px] font-bold hover:bg-[#E3E8EF] disabled:opacity-50">Cancel</button>
          <button type="button" onClick={install} disabled={!staged} className="h-12 px-9 rounded-xl bg-[#2F6BFF] text-white text-[14px] font-bold hover:bg-[#1F55E0] disabled:opacity-50 disabled:cursor-not-allowed">Save</button>
        </div>
      </section>

      {/* Available Themes */}
      <section className="bg-white border border-[#E3E8EF] rounded-[24px] shadow-sm p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#0E1A2B]">Available Themes</h2>
            <p className="mt-1 text-sm text-[#6F7E92]">Select the theme you want to use for your store. It changes at once, even in tabs that are already open.</p>
          </div>
          <a href="/adminpanel/store" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-[#EAF1FF] text-[#1F55E0] text-[13px] font-bold hover:bg-[#DCE7FF]">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: live.colors.accent }} />
            Live: {live.name}
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7" /><path d="M8 7h9v9" /></svg>
          </a>
        </div>

        <div role="radiogroup" aria-label="Store theme" className="mt-6 grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-5">
          {themes.map((theme) => {
            const selected = theme.id === live.id;
            return (
              <div key={theme.id} className="relative">
                <label className={`group block h-full cursor-pointer rounded-[20px] border-2 overflow-hidden transition-all ${selected ? 'border-[#2F6BFF] shadow-[0_12px_32px_-14px_rgba(47,107,255,0.55)]' : 'border-[#E3E8EF] hover:border-[#2F6BFF]/40'}`}>
                  <input type="radio" name="store-theme" checked={selected} onChange={() => activate(theme)} className="sr-only peer" />
                  <div className="px-5 pt-5 pb-4 bg-white peer-focus-visible:bg-[#F5F8FF]">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[17px] font-bold text-[#0E1A2B] truncate">{theme.name}</span>
                          {selected
                            ? <span className="px-2.5 py-0.5 rounded-md bg-emerald-500 text-white text-[11.5px] font-bold">Active</span>
                            : <span className="px-2.5 py-0.5 rounded-md bg-[#EDF1F6] text-[#5B6B80] text-[11.5px] font-bold">Installed</span>}
                          {theme.custom && <span className="px-2.5 py-0.5 rounded-md bg-[#FFF1DC] text-[#A15C00] text-[11.5px] font-bold">Uploaded</span>}
                        </div>
                        <p className="mt-1.5 text-[13.5px] font-bold text-[#2F6BFF]">Version {theme.version}</p>
                        <p className="mt-0.5 text-[12.5px] text-[#6F7E92]">{theme.tagline}</p>
                      </div>
                      {theme.custom && <span className="w-9 shrink-0" />}
                      <span className={`mt-0.5 w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center ${selected ? 'border-[#2F6BFF]' : 'border-[#C9D2DD]'}`}>
                        {selected && <span className="w-3 h-3 rounded-full bg-[#2F6BFF]" />}
                      </span>
                    </div>
                  </div>
                  <div className="px-5 pb-5 pt-4 bg-[#F6F8FB] border-t border-[#EDF1F6]">
                    <ThemeShot layout={theme.layout} name={theme.name} />
                    <ul className="mt-4 space-y-1.5">
                      {LAYOUT_INFO[theme.layout].features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-[12.5px] font-semibold text-[#3A4A5F]">
                          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2F6BFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7" /></svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                      {SWATCHES.map((s) => (
                        <span key={s.key} className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[#5B6B80]">
                          <span className="w-4 h-4 rounded-full border border-black/10" style={{ background: theme.colors[s.key] }} />{s.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </label>
                {theme.custom && (
                  <button type="button" onClick={() => remove(theme)} aria-label={`Delete ${theme.name}`} title="Delete theme" className="absolute top-5 right-14 w-9 h-9 rounded-lg border border-red-300 bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100">
                    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /></svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
