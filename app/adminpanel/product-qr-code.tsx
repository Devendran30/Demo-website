'use client';

import { useEffect, useState } from 'react';

/** A real, scannable QR code holding `value`, which is what the POS scanner looks products up by. */
export function ProductQrCode({ value, className = '' }: { value: string; className?: string }) {
  const [qr, setQr] = useState<{ path: string; size: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    import('@zxing/library').then(({ QRCodeWriter, BarcodeFormat }) => {
      if (cancelled) return;
      // Size 0 gives one cell per module, including the blank border scanners need.
      const matrix = new QRCodeWriter().encode(value, BarcodeFormat.QR_CODE, 0, 0, new Map());
      const size = matrix.getWidth();
      let path = '';
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (matrix.get(x, y)) path += `M${x} ${y}h1v1h-1z`;
        }
      }
      setQr({ path, size });
    });
    return () => {
      cancelled = true;
    };
  }, [value]);

  return (
    <svg
      viewBox={`0 0 ${qr?.size ?? 1} ${qr?.size ?? 1}`}
      role="img"
      aria-label={`QR code for ${value}`}
      shapeRendering="crispEdges"
      className={className}
    >
      <rect width="100%" height="100%" fill="#fff" />
      {qr && <path d={qr.path} fill="#000" />}
    </svg>
  );
}
