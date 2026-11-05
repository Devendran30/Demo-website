'use client';

// Full-screen player for product videos, shared by Admin → Videos and the storefront.

import { useEffect, useState, type ReactNode } from 'react';
import { playableVideo, type EcommerceVideo } from './demo-data';

export function VideoPlayerModal({ video, onClose, children }: { video: EcommerceVideo; onClose: () => void; children?: ReactNode }) {
  const { kind, src } = playableVideo(video.videoUrl);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={video.title} onClick={onClose}>
      <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 mb-3 text-white">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-white/60 truncate">{video.productName}</p>
            <h3 className="text-[17px] sm:text-[20px] font-bold leading-snug">{video.title}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Close video" className="shrink-0 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl">
          {kind === 'youtube' ? (
            <iframe src={src} title={video.title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen className="absolute inset-0 w-full h-full" />
          ) : failed ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-white">
              <p className="text-[16px] font-bold">This video can&apos;t be played.</p>
              <p className="text-[13px] text-white/60 max-w-sm">The link may be broken or not a video file. Use a direct .mp4 link or a YouTube link in Admin → Videos.</p>
            </div>
          ) : (
            <video src={src} poster={video.thumbnail || undefined} controls autoPlay playsInline onError={() => setFailed(true)} className="absolute inset-0 w-full h-full object-contain" />
          )}
        </div>
        {children && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-white">{children}</div>}
      </div>
    </div>
  );
}
