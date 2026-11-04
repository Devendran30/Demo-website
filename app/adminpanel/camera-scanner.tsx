'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface ScannedProduct {
  name: string;
  image: string;
  code: string;
  price: number;
  stock: number;
}

export interface ScanResult {
  ok: boolean;
  message: string;
  product?: ScannedProduct;
}

type Reader = { name: string; read: (canvas: HTMLCanvasElement) => Promise<string> };

// A code still in view is ignored until it has been gone this long, so holding one label up adds it once.
const REPEAT_COOLDOWN_MS = 2000;
// Pause between attempts on the live video.
const FRAME_DELAY_MS = 80;
// Extra room read around the box, as a share of its size, so the quiet zone around a code isn't cut off.
const GUIDE_MARGIN = 0.08;

/**
 * Reads QR codes and barcodes with the phone or laptop camera and hands each one to `onScan`. It keeps
 * scanning, so several items can be billed in a row. A code that matches a product (`isKnown`) counts at
 * once; any other code must be read twice in a row, since a blurry frame can misread a 1D barcode.
 * The photo button reads a saved image or uses the phone's own camera app, which focuses better.
 */
export function CameraScanner({
  onScan,
  isKnown,
  onClose,
}: {
  onScan: (code: string) => ScanResult;
  isKnown: (code: string) => boolean;
  onClose: () => void;
}) {
  // Each camera start gets its own <video> inside this slot, so a stale start (React runs effects
  // twice in development) never touches the live one.
  const slot = useRef<HTMLDivElement>(null);
  const photo = useRef<HTMLInputElement>(null);
  // Only the part of the picture inside this box is read, so codes elsewhere in view are ignored.
  const guide = useRef<HTMLDivElement>(null);
  const handle = useRef({ onScan, isKnown });
  const reader = useRef<Reader | null>(null);
  const handled = useRef({ code: '', at: 0 });
  // Camera list and the one in use are refs, so finding them doesn't restart the camera.
  const cameras = useRef<MediaDeviceInfo[]>([]);
  const activeCamera = useRef('');
  const [canSwitch, setCanSwitch] = useState(false);
  // Empty means the default (back camera on phones); set when the cashier switches cameras.
  const [deviceId, setDeviceId] = useState('');
  const [problem, setProblem] = useState('');
  const [starting, setStarting] = useState(true);
  const [readingPhoto, setReadingPhoto] = useState(false);
  const [last, setLast] = useState<ScanResult | null>(null);
  const [added, setAdded] = useState<{ item: string; count: number }[]>([]);

  useEffect(() => {
    handle.current = { onScan, isKnown };
  });

  const accept = useCallback((code: string) => {
    const result = handle.current.onScan(code);
    setLast(result);
    feedback(result.ok);
    const item = result.product?.name;
    if (result.ok && item)
      setAdded((list) =>
        list.some((a) => a.item === item)
          ? list.map((a) => (a.item === item ? { ...a, count: a.count + 1 } : a))
          : [...list, { item, count: 1 }]
      );
  }, []);

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const video = document.createElement('video');
    video.className = 'block w-full h-full object-cover';
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    slot.current?.append(video);
    const read = { code: '', count: 0 };
    const boxed = document.createElement('canvas');

    function decoded(code: string) {
      if (cancelled || !code) return;
      if (code !== read.code) {
        read.code = code;
        read.count = 0;
      }
      read.count++;
      if (read.count < 2 && !handle.current.isKnown(code)) return;
      const now = Date.now();
      const stillInView = code === handled.current.code && now - handled.current.at < REPEAT_COOLDOWN_MS;
      handled.current = { code, at: now };
      if (stillInView) return;
      accept(code);
    }

    async function loop() {
      if (cancelled) return;
      if (video.readyState >= 2 && reader.current && guide.current && cropToGuide(video, guide.current, boxed)) {
        decoded(await reader.current.read(boxed));
      }
      if (!cancelled) timer = setTimeout(loop, FRAME_DELAY_MS);
    }

    async function start() {
      // Let a start that's cancelled straight away (development double run) end before opening the camera.
      await Promise.resolve();
      if (cancelled) return;
      setStarting(true);
      setProblem('');
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setProblem('The live camera only works over https:// or on localhost. Use the photo button instead.');
        setStarting(false);
        return;
      }
      try {
        reader.current ??= await createReader();
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            ...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode: { ideal: 'environment' } }),
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        const track = stream.getVideoTracks()[0];
        // Phones that support it keep refocusing, so a label held close stays sharp.
        track?.applyConstraints({ advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet] }).catch(() => {});
        video.srcObject = stream;
        await video.play();
        if (cancelled) return;
        activeCamera.current = track?.getSettings().deviceId ?? '';
        loop();
        // The camera list is only complete once permission has been granted.
        if (!cameras.current.length) {
          cameras.current = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput');
          if (!cancelled) setCanSwitch(cameras.current.length > 1);
        }
      } catch (e) {
        if (!cancelled) setProblem(cameraProblem(e));
      } finally {
        if (!cancelled) setStarting(false);
      }
    }

    start();
    return () => {
      cancelled = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
      video.remove();
    };
  }, [deviceId, accept]);

  function switchCamera() {
    const list = cameras.current;
    const at = list.findIndex((c) => c.deviceId === activeCamera.current);
    setDeviceId(list[(at + 1) % list.length].deviceId);
  }

  async function readPhoto(file: File) {
    setReadingPhoto(true);
    try {
      reader.current ??= await createReader();
      const code = await readImageFile(file, reader.current);
      if (code) accept(code);
      else {
        setLast({ ok: false, message: 'No code found in the photo. Fill the photo with the code and keep it sharp.' });
        feedback(false);
      }
    } catch {
      setLast({ ok: false, message: 'That photo could not be read. Try again.' });
    } finally {
      setReadingPhoto(false);
      if (photo.current) photo.current.value = '';
      // iOS pauses the live preview while the camera app is open.
      slot.current?.querySelector('video')?.play().catch(() => {});
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-[#e5e5ea] rounded-[36px] p-6 sm:p-8 max-w-lg w-full max-h-[calc(100dvh-2rem)] overflow-y-auto shadow-2xl space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-[#1d1d1f]">Scan QR Code</h3>
            <p className="text-[12px] text-[#86868b] font-semibold">Scanned items go straight onto the current bill</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close scanner"
            className="w-8 h-8 flex-shrink-0 rounded-full bg-[#f5f5f7] hover:bg-[#e5e5ea] flex items-center justify-center text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Live Viewfinder */}
        <div className="relative overflow-hidden aspect-[4/3] bg-neutral-900 rounded-[28px]">
          <div ref={slot} className="absolute inset-0" />
          {!problem && (
            <div
              ref={guide}
              aria-hidden="true"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[80%] aspect-square rounded-2xl border-2 border-[#f97316] shadow-[0_0_0_999px_rgba(0,0,0,0.5)] flex items-center justify-center"
            >
              <div className="w-[88%] h-0.5 bg-red-500 shadow-[0_0_8px_red] animate-pulse"></div>
            </div>
          )}
          {starting && !problem && (
            <p className="absolute inset-0 flex items-center justify-center text-white text-[13px] font-bold">Starting camera...</p>
          )}
          {problem && (
            <p role="alert" className="absolute inset-0 flex items-center justify-center p-6 text-center text-white text-[13px] font-bold">
              {problem}
            </p>
          )}
        </div>

        <p
          aria-live="polite"
          className={`px-4 py-2.5 rounded-2xl text-[13px] font-bold break-words ${last ? (last.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600') : 'bg-[#f5f5f7] text-[#6e6e73]'}`}
        >
          {readingPhoto ? 'Reading the photo...' : last ? last.message : 'Hold the QR code inside the box, about 10-20 cm away.'}
        </p>

        {/* Scanned Product Details */}
        {last?.product && (
          <div className="p-3 bg-[#f5f5f7] rounded-2xl flex items-center gap-3 border border-[#e5e5ea]">
            <img
              src={last.product.image}
              alt={last.product.name}
              className="w-14 h-14 rounded-xl object-cover border border-[#e5e5ea] bg-white flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-[#1d1d1f] text-[13px] leading-snug line-clamp-2">{last.product.name}</p>
              <p className="font-mono text-[11px] text-[#86868b] font-semibold truncate">{last.product.code}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[15px] font-black text-[#ea580c]">₹{last.product.price.toLocaleString()}</p>
              <p className="text-[11px] text-[#86868b] font-semibold">Stock: {last.product.stock}</p>
            </div>
          </div>
        )}

        {added.length > 0 && (
          <div className="px-4 py-3 border border-[#e5e5ea] rounded-2xl space-y-1">
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#86868b]">Added to bill</p>
            {added.map((a) => (
              <p key={a.item} className="text-[13px] font-semibold text-[#1d1d1f]">
                {a.item} × {a.count}
              </p>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <label className={`flex-1 min-w-fit text-center px-4 py-3.5 bg-white border border-[#e5e5ea] hover:bg-[#f5f5f7] text-[#1d1d1f] font-extrabold text-[13px] rounded-full cursor-pointer ${readingPhoto ? 'opacity-50' : ''}`}>
            Take / Upload Photo
            <input
              ref={photo}
              type="file"
              accept="image/*"
              capture="environment"
              disabled={readingPhoto}
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) readPhoto(file);
              }}
            />
          </label>
          {canSwitch && (
            <button
              onClick={switchCamera}
              className="flex-1 min-w-fit px-4 py-3.5 bg-white border border-[#e5e5ea] hover:bg-[#f5f5f7] text-[#1d1d1f] font-extrabold text-[13px] rounded-full"
            >
              Switch Camera
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 min-w-fit px-6 py-3.5 bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-extrabold text-[13px] rounded-full shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

type NativeDetector = { detect: (source: HTMLCanvasElement) => Promise<{ rawValue: string }[]> };
type NativeDetectorClass = {
  new (options: { formats: string[] }): NativeDetector;
  getSupportedFormats: () => Promise<string[]>;
};

const nativeFormats = ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e'];

/**
 * The browser's built-in detector where it can read QR codes (Chrome on Mac and Android; far better
 * with blurry cameras and phone screens), otherwise ZXing. `read` returns '' when nothing is found.
 */
async function createReader(): Promise<Reader> {
  const Native = (window as unknown as { BarcodeDetector?: NativeDetectorClass }).BarcodeDetector;
  const supported = Native ? await Native.getSupportedFormats().catch(() => [] as string[]) : [];
  if (Native && supported.includes('qr_code')) {
    const detector = new Native({ formats: nativeFormats.filter((f) => supported.includes(f)) });
    return {
      name: 'Built-in reader',
      read: async (canvas) => {
        try {
          return (await detector.detect(canvas))[0]?.rawValue.trim() ?? '';
        } catch {
          return '';
        }
      },
    };
  }

  const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
    import('@zxing/browser'),
    import('@zxing/library'),
  ]);
  const hints = new Map<number, unknown>([
    [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE, BarcodeFormat.CODE_128, BarcodeFormat.CODE_39, BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E]],
    [DecodeHintType.TRY_HARDER, true],
  ]);
  const zxing = new BrowserMultiFormatReader(hints);
  return {
    name: 'ZXing reader',
    read: async (canvas) => {
      try {
        return zxing.decodeFromCanvas(canvas).getText().trim();
      } catch {
        return '';
      }
    },
  };
}

/**
 * Copies the part of the video frame that's inside the on-screen box onto `canvas`. The video is
 * shown with object-fit: cover, so the box is mapped back from screen to camera pixels.
 * Returns false when there's no picture yet.
 */
function cropToGuide(video: HTMLVideoElement, box: HTMLElement, canvas: HTMLCanvasElement) {
  const { videoWidth, videoHeight } = video;
  const view = video.getBoundingClientRect();
  const area = box.getBoundingClientRect();
  if (!videoWidth || !view.width || !area.width) return false;
  const scale = Math.max(view.width / videoWidth, view.height / videoHeight);
  const offsetX = (view.width - videoWidth * scale) / 2;
  const offsetY = (view.height - videoHeight * scale) / 2;
  const padX = area.width * GUIDE_MARGIN;
  const padY = area.height * GUIDE_MARGIN;
  const left = Math.max(0, (area.left - padX - view.left - offsetX) / scale);
  const top = Math.max(0, (area.top - padY - view.top - offsetY) / scale);
  const right = Math.min(videoWidth, (area.right + padX - view.left - offsetX) / scale);
  const bottom = Math.min(videoHeight, (area.bottom + padY - view.top - offsetY) / scale);
  const width = Math.round(right - left);
  const height = Math.round(bottom - top);
  if (width < 10 || height < 10) return false;
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d', { willReadFrequently: true })!.drawImage(video, left, top, width, height, 0, 0, width, height);
  return true;
}

/** Reads a code from a photo, trying it level and turned a quarter, since phone photos are often sideways. */
async function readImageFile(file: File, reader: Reader) {
  const image = await createImageBitmap(file);
  // Big phone photos are scaled down; 2000 px is plenty for a label and keeps reading quick.
  const scale = Math.min(1, 2000 / Math.max(image.width, image.height));
  const width = Math.round(image.width * scale);
  const height = Math.round(image.height * scale);
  for (const turned of [false, true]) {
    const canvas = document.createElement('canvas');
    canvas.width = turned ? height : width;
    canvas.height = turned ? width : height;
    const context = canvas.getContext('2d', { willReadFrequently: true })!;
    if (turned) {
      context.translate(height, 0);
      context.rotate(Math.PI / 2);
    }
    context.drawImage(image, 0, 0, width, height);
    const code = await reader.read(canvas);
    if (code) return code;
  }
  return '';
}

function cameraProblem(e: unknown) {
  const name = (e as { name?: string })?.name;
  if (name === 'NotAllowedError' || name === 'SecurityError')
    return 'Camera access was blocked. Allow the camera for this site in your browser settings, or use the photo button.';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'No camera was found on this device.';
  if (name === 'NotReadableError') return 'The camera is being used by another app. Close it and try again.';
  return 'The camera could not be started. Close this and try again, or use the photo button.';
}

/** A short vibration on phones and a beep, so the cashier knows the scan went through. */
function feedback(ok: boolean) {
  try {
    navigator.vibrate?.(ok ? 60 : [40, 60, 40]);
    const audio = new AudioContext();
    const tone = audio.createOscillator();
    const volume = audio.createGain();
    tone.frequency.value = ok ? 1250 : 330;
    volume.gain.value = 0.08;
    tone.connect(volume).connect(audio.destination);
    tone.start();
    tone.stop(audio.currentTime + (ok ? 0.08 : 0.2));
    tone.onended = () => audio.close();
  } catch {
    // Sound and vibration are optional.
  }
}
