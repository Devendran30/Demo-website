'use client';

// Pure-JS Code 128B barcode — no external dependencies, renders instantly.
// Code 128B encodes printable ASCII (32–127). Each symbol = 11 modules wide.

const C128_START_B = 104;
const C128_STOP    = 106;

// Code 128 bar patterns (11 modules each), indexed by symbol value.
const C128_PATTERNS: number[] = [
  212222,222122,222221,121223,121322,131222,122213,122312,132212,221213,
  221312,231212,112232,122132,122231,113222,123122,123221,223211,221132,
  221231,213212,223112,312131,311222,321122,321221,312212,322112,322211,
  212123,212321,232121,111323,131123,131321,112313,132113,132311,211313,
  231113,231311,112133,112331,132131,113123,113321,133121,313121,211331,
  231131,213113,213311,213131,311123,311321,331121,312113,312311,332111,
  314111,221411,431111,111224,111422,121124,121421,141122,141221,112214,
  112412,122114,122411,142112,142211,241211,221114,413111,241112,134111,
  111242,121142,121241,114212,124112,124211,411212,421112,421211,212141,
  214121,412121,111143,111341,131141,114113,114311,411113,411311,113141,
  114131,311141,411131,211412,211214,211232,2331112,
];

export function encodeCode128(value: string): { bars: number[]; width: number } {
  const chars = Array.from(value).map((c) => c.charCodeAt(0) - 32);
  const symbols = [C128_START_B, ...chars];
  const check = (C128_START_B + chars.reduce((s, c, i) => s + c * (i + 1), 0)) % 103;
  symbols.push(check, C128_STOP);

  const bars: number[] = [];
  let width = 0;
  for (const sym of symbols) {
    const pat = C128_PATTERNS[sym];
    const digits = String(pat).padStart(sym === C128_STOP ? 7 : 6, '0').split('').map(Number);
    for (const d of digits) { bars.push(d); width += d; }
  }
  // Termination bar (always 2 modules)
  bars.push(2); width += 2;
  return { bars, width };
}

export function ProductBarcode({ value, className = '' }: { value: string; className?: string }) {
  if (!value?.trim()) return null;

  // Sanitise: Code 128B handles printable ASCII only
  const safe = value.replace(/[^\x20-\x7E]/g, '');
  if (!safe) return null;

  const H = 60; // bar height in SVG units
  const { bars, width } = encodeCode128(safe);

  let rects = '';
  let x = 0;
  let dark = true; // first element is always a bar (dark)
  for (const w of bars) {
    if (dark) rects += `<rect x="${x}" y="0" width="${w}" height="${H}"/>`;
    x += w;
    dark = !dark;
  }

  return (
    <svg
      role="img"
      aria-label={`Barcode for ${value}`}
      viewBox={`0 0 ${width} ${H}`}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      className={className}
      dangerouslySetInnerHTML={{ __html: `<rect width="100%" height="100%" fill="white"/><g fill="#111">${rects}</g>` }}
    />
  );
}

