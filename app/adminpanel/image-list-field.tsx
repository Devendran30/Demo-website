'use client';

import { useRef, useState } from 'react';

/** A row of photos: paste an image URL or pick files from the device. The first photo is the cover. */
export function ImageListField({
  images,
  onChange,
  label,
  showCover = true,
}: {
  images: string[];
  onChange: (images: string[]) => void;
  label: string;
  showCover?: boolean;
}) {
  const [url, setUrl] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const addUrl = () => {
    const value = url.trim();
    if (!value || images.includes(value)) return;
    onChange([...images, value]);
    setUrl('');
  };

  // Files become data URLs, so the demo can show them without uploading anywhere.
  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    Promise.all(
      Array.from(files).map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          })
      )
    ).then((added) => onChange([...images, ...added]));
  };

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((src, idx) => (
            <div key={`${idx}-${src.slice(-24)}`} className="relative group">
              <img src={src} alt={`${label} ${idx + 1}`} className="w-20 h-20 rounded-2xl object-cover border border-[#E3E8EF] bg-white shadow-sm" />
              {showCover && idx === 0 && (
                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-[#2F6BFF] text-white rounded-md text-[9px] font-black uppercase">Cover</span>
              )}
              {showCover && idx > 0 && (
                <button
                  type="button"
                  onClick={() => onChange([src, ...images.filter((_, i) => i !== idx)])}
                  title="Make cover photo"
                  className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-white/90 text-[#0E1A2B] rounded-md text-[9px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Cover
                </button>
              )}
              <button
                type="button"
                onClick={() => onChange(images.filter((_, i) => i !== idx))}
                aria-label={`Remove photo ${idx + 1}`}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-[#E3E8EF] text-red-500 text-[11px] font-black shadow-sm hover:bg-red-50"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addUrl();
            }
          }}
          placeholder="https://images.unsplash.com/photo-..."
          aria-label={`${label} URL`}
          className="flex-1 px-6 py-3.5 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full text-[14px] text-[#0E1A2B] focus:outline-none focus:bg-white focus:border-[#2F6BFF] transition-all font-semibold"
        />
        <button
          type="button"
          onClick={addUrl}
          className="px-5 py-3 bg-[#F3F6FA] hover:bg-[#EAF1FF] text-[#2F6BFF] border border-[#E3E8EF] rounded-full text-[13px] font-extrabold transition-all"
        >
          Add URL
        </button>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="px-5 py-3 bg-white hover:bg-[#F3F6FA] text-[#0E1A2B] border border-[#E3E8EF] rounded-full text-[13px] font-extrabold transition-all"
        >
          Upload Photos
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}
