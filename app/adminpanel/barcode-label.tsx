'use client';

// One label layout shared by the on-screen preview, the print sheet and the
// downloaded PDF, so all three always match the chosen label dimensions.

import type { CSSProperties } from 'react';
import { encodeCode128 } from './product-barcode';

export type LabelData = { store: string; name: string; code: string; left: string; right: string };
type Font = 'regular' | 'bold' | 'mono';
type LabelText = { text: string; x: number; y: number; size: number; font: Font; align: 'left' | 'center' | 'right'; spacing: number };
type LabelLayout = { width: number; height: number; texts: LabelText[]; bars: { x: number; y: number; w: number; h: number }[]; rule: { x1: number; x2: number; y: number } };

const PT_PER_MM = 72 / 25.4;
const CSS_FONT: Record<Font, string> = { regular: 'Helvetica, Arial, sans-serif', bold: 'Helvetica, Arial, sans-serif', mono: 'Courier, "Courier New", monospace' };

// PDF base fonts only cover Latin-1, so keep label text printable ASCII.
const ascii = (value: string) => value.replace(/₹/g, 'Rs.').replace(/[^\x20-\x7E]/g, '').trim();

let measureCtx: CanvasRenderingContext2D | null | undefined;
function measure(text: string, size: number, font: Font, spacing = 0) {
  if (font === 'mono') return text.length * (size * 0.6 + spacing);
  if (measureCtx === undefined) measureCtx = typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d');
  if (!measureCtx) return text.length * size * (font === 'bold' ? 0.6 : 0.55);
  // Arial shares Helvetica's metrics, which is what the PDF viewer uses.
  measureCtx.font = `${font === 'bold' ? 'bold ' : ''}${size}px Arial, Helvetica, sans-serif`;
  return measureCtx.measureText(text).width;
}

function fit(text: string, size: number, font: Font, maxWidth: number, spacing = 0) {
  if (measure(text, size, font, spacing) <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && measure(`${cut}...`, size, font, spacing) > maxWidth) cut = cut.slice(0, -1);
  return `${cut.trimEnd()}...`;
}

export function layoutLabel(widthMm: number, heightMm: number, data: LabelData): LabelLayout {
  const width = widthMm * PT_PER_MM;
  const height = heightMm * PT_PER_MM;
  const padX = Math.max(1.5 * PT_PER_MM, width * 0.05);
  const padY = Math.max(1.2 * PT_PER_MM, height * 0.05);
  const inner = width - padX * 2;

  // Sizes are tuned for a 25 mm tall label and scale with the label height,
  // capped by the width so narrow labels don't get oversized text.
  const natural = 8 + 1.5 + 7 + 2.5 + 24 + 1.5 + 6 + 2 + 1.5 + 6.5;
  const k = Math.min((height - padY * 2) / natural, width / 130, 2.2);
  const storeFs = 8 * k, nameFs = 7 * k, codeFs = 6 * k, footFs = 6.5 * k, barH = 24 * k;
  const codeSpacing = 0.8 * k;

  const texts: LabelText[] = [];
  let y = (height - natural * k) / 2;

  y += storeFs;
  texts.push({ text: fit(ascii(data.store).toUpperCase(), storeFs, 'bold', inner), x: width / 2, y, size: storeFs, font: 'bold', align: 'center', spacing: 0 });
  y += 1.5 * k + nameFs;
  texts.push({ text: fit(ascii(data.name), nameFs, 'bold', inner), x: width / 2, y, size: nameFs, font: 'bold', align: 'center', spacing: 0 });
  y += 2.5 * k;

  const code = ascii(data.code) || '0';
  const { bars: modules, width: moduleCount } = encodeCode128(code);
  const moduleW = inner / moduleCount;
  const bars: LabelLayout['bars'] = [];
  let x = padX;
  modules.forEach((m, i) => {
    if (i % 2 === 0) bars.push({ x, y, w: m * moduleW, h: barH });
    x += m * moduleW;
  });
  y += barH + 1.5 * k + codeFs;
  texts.push({ text: fit(code, codeFs, 'mono', inner, codeSpacing), x: width / 2, y, size: codeFs, font: 'mono', align: 'center', spacing: codeSpacing });

  y += 2 * k;
  const rule = { x1: padX, x2: width - padX, y };
  y += 1.5 * k + footFs;
  const right = ascii(data.right);
  const rightW = measure(right, footFs, 'bold');
  texts.push({ text: fit(ascii(data.left), footFs, 'bold', inner - rightW - 4 * k), x: padX, y, size: footFs, font: 'bold', align: 'left', spacing: 0 });
  texts.push({ text: right, x: width - padX, y, size: footFs, font: 'bold', align: 'right', spacing: 0 });

  return { width, height, texts, bars, rule };
}

export function BarcodeLabel({ widthMm, heightMm, data, className, style }: { widthMm: number; heightMm: number; data: LabelData; className?: string; style?: CSSProperties }) {
  const l = layoutLabel(widthMm, heightMm, data);
  return (
    <svg viewBox={`0 0 ${l.width} ${l.height}`} className={className} style={style} role="img" aria-label={`Barcode label for ${data.name}`}>
      <rect width={l.width} height={l.height} fill="#fff" />
      <g fill="#111" shapeRendering="crispEdges">
        {l.bars.map((b, i) => <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} />)}
      </g>
      <line x1={l.rule.x1} x2={l.rule.x2} y1={l.rule.y} y2={l.rule.y} stroke="#888" strokeWidth={0.4} strokeDasharray="1.5 1" />
      {l.texts.map((t, i) => (
        <text
          key={i}
          x={t.align === 'center' ? t.x + t.spacing / 2 : t.x}
          y={t.y}
          fontSize={t.size}
          fontFamily={CSS_FONT[t.font]}
          fontWeight={t.font === 'regular' ? 400 : 700}
          letterSpacing={t.spacing || undefined}
          textAnchor={t.align === 'center' ? 'middle' : t.align === 'right' ? 'end' : 'start'}
          fill="#111"
        >
          {t.text}
        </text>
      ))}
    </svg>
  );
}

const PDF_FONT: Record<Font, string> = { regular: 'F1', bold: 'F2', mono: 'F3' };
const pdfNum = (n: number) => (Math.round(n * 100) / 100).toString();
const pdfStr = (s: string) => s.replace(/[\\()]/g, (c) => `\\${c}`);

function pdfPage(l: LabelLayout) {
  const flip = (y: number) => l.height - y;
  const ops = ['1 1 1 rg', `0 0 ${pdfNum(l.width)} ${pdfNum(l.height)} re f`, '0.067 0.067 0.067 rg'];
  for (const b of l.bars) ops.push(`${pdfNum(b.x)} ${pdfNum(flip(b.y + b.h))} ${pdfNum(b.w)} ${pdfNum(b.h)} re`);
  ops.push('f');
  ops.push(`0.53 0.53 0.53 RG 0.4 w [1.5 1] 0 d ${pdfNum(l.rule.x1)} ${pdfNum(flip(l.rule.y))} m ${pdfNum(l.rule.x2)} ${pdfNum(flip(l.rule.y))} l S [] 0 d`);
  for (const t of l.texts) {
    const w = measure(t.text, t.size, t.font, t.spacing) - t.spacing;
    const x = t.align === 'center' ? t.x - w / 2 : t.align === 'right' ? t.x - w : t.x;
    ops.push(`BT /${PDF_FONT[t.font]} ${pdfNum(t.size)} Tf ${pdfNum(t.spacing)} Tc ${pdfNum(x)} ${pdfNum(flip(t.y))} Td (${pdfStr(t.text)}) Tj ET`);
  }
  return ops.join('\n');
}

// Builds a vector PDF with one page per label, sized exactly to the label.
export function buildLabelsPdf(widthMm: number, heightMm: number, data: LabelData, copies: number) {
  const layout = layoutLabel(widthMm, heightMm, data);
  const content = pdfPage(layout);
  const objects: string[] = [];
  const add = (body: string) => objects.push(body);

  add('<< /Type /Catalog /Pages 2 0 R >>');
  add(''); // Pages, filled in once the page ids are known
  add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  add('<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>');
  const contentId = add(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  const pageIds: number[] = [];
  for (let i = 0; i < copies; i++) {
    pageIds.push(add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pdfNum(layout.width)} ${pdfNum(layout.height)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${contentId} 0 R >>`));
  }
  objects[1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

  let pdf = '%PDF-1.4\n';
  const offsets = objects.map((body, i) => {
    const offset = pdf.length;
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
    return offset;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: 'application/pdf' });
}

export function downloadLabelsPdf(widthMm: number, heightMm: number, data: LabelData, copies: number) {
  const url = URL.createObjectURL(buildLabelsPdf(widthMm, heightMm, data, copies));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${ascii(data.code).replace(/[^\w-]+/g, '-') || 'barcode'}-labels-${widthMm}x${heightMm}mm.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
