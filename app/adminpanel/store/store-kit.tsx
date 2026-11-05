'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import {
  createStore, useStore, productsStore, categoriesStore, colorOptionsStore, couponsStore, shopperAccountsStore,
  stockForVariant, variantColors, variantSizes, productPhotos, percentOff, photoUrl, inr, calculateTotals,
  STORE_INFO, STANDARD,
  type Product, type CategoryItem,
} from '../demo-data';

export { inr, STORE_INFO, STANDARD };

// =============================================================================
// Design Tokens (light luxe: ivory paper, ink type, a whisper of burnt orange)
// =============================================================================

export const T = {
  page: 'bg-[#F6F8FB]',
  ink: 'text-[#0E1A2B]',
  muted: 'text-[#5B6B80]',
  faint: 'text-[#8A97A8]',
  line: 'border-[#E3E8EF]',
  sand: 'bg-[#EDF1F6]',
  paper: 'bg-[#FFFFFF]',
  // Headline style (weight, tight tracking) lives in the page's <style>, so it wins over size utilities' defaults.
  display: 'font-display',
  eyebrow: 'text-[11.5px] uppercase tracking-[0.26em] font-semibold text-[#6F7E92]',
  shell: 'max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12',
};

// =============================================================================
// Shopper State (bag, wishlist, promo and this device's orders survive a refresh)
// =============================================================================

export interface BagLine {
  key: string;
  id: string;
  size: string;
  color: string;
  qty: number;
}

export const bagStore = createStore<BagLine[]>('store.v2.bag', [], Array.isArray);
export const wishlistStore = createStore<string[]>('store.wishlist', [], Array.isArray);
export const promoStore = createStore<string>('store.v2.promo', '', (v) => typeof v === 'string');
export const myOrdersStore = createStore<string[]>('store.v2.myOrders', [], Array.isArray);
/** The signed-in shopper's email on this device ('' when signed out). */
export const sessionStore = createStore<string>('store.v3.session', '', (v) => typeof v === 'string');

export function useAccount() {
  const email = useStore(sessionStore);
  const accounts = useStore(shopperAccountsStore);
  return email ? accounts.find((a) => a.email === email) ?? null : null;
}

export const toastStore = createStore<{ message: string; id: number; action?: { label: string; href: string } } | null>(null, null);

export { useStore };

let toastTimer: ReturnType<typeof setTimeout> | undefined;

/** Shows a short message; pass `null` as the action for a message without a button (the default is "View bag"). */
export function showToast(message: string, action: { label: string; href: string } | null = { label: 'View bag', href: '#/bag' }) {
  clearTimeout(toastTimer);
  toastStore.set({ message, id: Date.now(), action: action ?? undefined });
  toastTimer = setTimeout(() => toastStore.set(null), 3400);
}

const lineKey = (id: string, size: string, color: string) => `${id}|${size}|${color}`;

export const variantLabel = (size: string, color: string) =>
  [size !== STANDARD && size, color !== STANDARD && color].filter(Boolean).join(' · ');

export function addToBag(product: Product, size: string, color: string, qty = 1) {
  const bag = bagStore.get();
  const key = lineKey(product.id, size, color);
  const inBag = bag.find((line) => line.key === key)?.qty ?? 0;
  const available = stockForVariant(product, size, color);
  const adding = Math.min(qty, available - inBag);
  const label = variantLabel(size, color);
  if (adding <= 0) {
    showToast(available > 0 ? `All ${available} available${label ? ` in ${label}` : ''} are in your bag` : `${product.name}${label ? ` (${label})` : ''} is sold out`);
    return false;
  }
  bagStore.set(inBag ? bag.map((line) => (line.key === key ? { ...line, qty: line.qty + adding } : line)) : [...bag, { key, id: product.id, size, color, qty: adding }]);
  showToast(`${product.name}${label ? ` · ${label}` : ''} added to your bag`);
  return true;
}

export function setBagQty(key: string, qty: number) {
  const bag = bagStore.get();
  bagStore.set(qty > 0 ? bag.map((line) => (line.key === key ? { ...line, qty } : line)) : bag.filter((line) => line.key !== key));
}

export function toggleWishlist(product: Product) {
  const list = wishlistStore.get();
  const saved = list.includes(product.id);
  wishlistStore.set(saved ? list.filter((id) => id !== product.id) : [...list, product.id]);
  showToast(saved ? `Removed from your wishlist` : `${product.name} saved to your wishlist`, saved ? null : { label: 'View', href: '#/wishlist' });
}

/** The first size and color that is in stock, or the first option when everything is sold out. */
export function firstAvailable(product: Product) {
  for (const color of variantColors(product.colors)) {
    for (const size of variantSizes(product.sizes)) {
      if (stockForVariant(product, size, color) > 0) return { size, color };
    }
  }
  return { size: variantSizes(product.sizes)[0], color: variantColors(product.colors)[0] };
}

/** Products with only one option can go straight into the bag; others need a choice first. */
export const hasChoices = (product: Product) => product.sizes.length > 1 || product.colors.length > 1;

// =============================================================================
// Catalog Hooks (live from the admin panel)
// =============================================================================

export function useCatalog() {
  const allProducts = useStore(productsStore);
  const allCategories = useStore(categoriesStore);
  const colors = useStore(colorOptionsStore);
  return useMemo(() => {
    const categories = allCategories.filter((c) => c.status === 'Active');
    const activeNames = new Set(categories.map((c) => c.name));
    const products = allProducts.filter((p) => activeNames.has(p.category));
    const colorHex: Record<string, string> = Object.fromEntries(colors.map((c) => [c.name, c.hex]));
    return {
      products,
      categories,
      colorHex,
      productById: (id: string) => products.find((p) => p.id === id),
      categoryOf: (product: Product) => categories.find((c) => c.name === product.category),
      categoryBySlug: (slug: string) => categories.find((c) => c.slug === slug),
    };
  }, [allProducts, allCategories, colors]);
}

/** Bag lines joined with their products, each capped at what is in stock for its size and color. */
export function useBag() {
  const bag = useStore(bagStore);
  const promo = useStore(promoStore);
  const coupons = useStore(couponsStore);
  const { productById } = useCatalog();
  const lines = bag.flatMap((line) => {
    const product = productById(line.id);
    if (!product) return [];
    const available = stockForVariant(product, line.size, line.color);
    return available > 0 ? [{ ...line, product, qty: Math.min(line.qty, available), available }] : [];
  });
  const count = lines.reduce((sum, line) => sum + line.qty, 0);
  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.qty, 0);
  return { lines, count, subtotal, promo, coupons, totals: calculateTotals(subtotal, promo, coupons) };
}

// =============================================================================
// Hash Routing (every page lives in this folder, and Back / Forward / refresh still work)
// =============================================================================

const routeListeners = new Set<() => void>();

const subscribeToHash = (listener: () => void) => {
  routeListeners.add(listener);
  window.addEventListener('hashchange', listener);
  return () => {
    routeListeners.delete(listener);
    window.removeEventListener('hashchange', listener);
  };
};

// Where to put the page after a route change: top for a link, the old spot for Back / Forward.
export const scrollMemory = new Map<string, number>();
export const navigation = { byLink: false };

export function rememberScroll() {
  scrollMemory.set(window.location.hash, window.scrollY);
  navigation.byLink = true;
}

export function navigate(hash: string, { replace = false } = {}) {
  if (!replace) rememberScroll();
  if (replace) window.location.replace(hash);
  else window.location.hash = hash;
  // hashchange fires a moment later; waiting for it would make typed text and ticked boxes flicker back.
  routeListeners.forEach((listener) => listener());
}

export function useRoute() {
  const hash = useSyncExternalStore(subscribeToHash, () => window.location.hash, () => '');
  return useMemo(() => {
    const [path, query = ''] = hash.replace(/^#\/?/, '').split('?');
    return { path: path.split('/').filter(Boolean), params: new URLSearchParams(query) };
  }, [hash]);
}

export function shopHref(params: Record<string, string> = {}) {
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value)).toString();
  return `#/shop${query ? `?${query}` : ''}`;
}

export function formatDate(iso: string, withTime = false) {
  return new Date(iso).toLocaleDateString('en-IN', withTime
    ? { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }
    : { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
}

// =============================================================================
// Building Blocks
// =============================================================================

const ICONS: Record<string, ReactNode> = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  bag: <><path d="M5.5 8h13l1 13h-15l1-13Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></>,
  heart: <path d="M12 20s-7.5-4.6-9.2-9.1C1.6 7.6 3.8 4.5 7 4.5c2 0 3.6 1 5 3 1.4-2 3-3 5-3 3.2 0 5.4 3.1 4.2 6.4C19.5 15.4 12 20 12 20Z" />,
  box: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  menu: <path d="M4 8h16M4 16h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  back: <path d="M19 12H5m5-5-5 5 5 5" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  truck: <><path d="M2 6h12v11H2zM14 10h4l4 4v3h-8z" /><circle cx="7" cy="18.5" r="1.8" /><circle cx="18" cy="18.5" r="1.8" /></>,
  shield: <><path d="M12 3 5 6v6c0 4.4 3 7.6 7 9 4-1.4 7-4.6 7-9V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
  refresh: <><path d="M4 11a8 8 0 0 1 14-4.5L20 9" /><path d="M20 4v5h-5M20 13a8 8 0 0 1-14 4.5L4 15" /><path d="M4 20v-5h5" /></>,
  card: <><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M2.5 10h19" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  tag: <><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" /><circle cx="7.5" cy="7.5" r="1.2" /></>,
  instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.6" /></>,
  eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="m3 3 18 18" /><path d="M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7c1.6 0 3.1-.4 4.4-1.1" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
  logout: <><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="m10 17-5-5 5-5M5 12h11" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m4 7 8 6 8-6" /></>,
  lock: <><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></>,
  phone: <path d="M5 3.5h3.5l1.8 4.6-2.3 1.4a11 11 0 0 0 6.5 6.5l1.4-2.3 4.6 1.8V19a2 2 0 0 1-2 2A17 17 0 0 1 3 5.5a2 2 0 0 1 2-2Z" />,
  pin: <><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  chat: <path d="M4 18.5V6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H8l-4 3.5Z" />,
  leaf: <><path d="M5 19c0-8 5-13 15-14-1 10-6 15-14 15" /><path d="M5 19 13 11" /></>,
  spark: <path d="M12 3v4m0 10v4M3 12h4m10 0h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />,
  flask: <><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3" /><path d="M7.5 14h9" /></>,
  wrench: <path d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3l7.5-7.5a4 4 0 0 0-2-2Z" />,
  bolt: <path d="M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z" />,
  gift: <><rect x="3" y="8" width="18" height="4" /><path d="M5 12v9h14v-9M12 8v13M12 8S10.5 3 8 3.8C6 4.5 7 8 12 8Zm0 0s1.5-5 4-4.2C18 4.5 17 8 12 8Z" /></>,
};

export function Icon({ name, size = 20, filled = false, stroke = 1.5 }: { name: string; size?: number; filled?: boolean; stroke?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
      {ICONS[name]}
    </svg>
  );
}

export function Photo({ src, alt, width = 900, eager = false, className = '' }: { src: string; alt: string; width?: number; eager?: boolean; className?: string }) {
  const [failedSrc, setFailedSrc] = useState('');
  if (!src || failedSrc === src) return <div role="img" aria-label={alt} className={`bg-gradient-to-br from-[#EDF1F6] to-[#D5DEE8] ${className}`} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={photoUrl(src, width)} alt={alt} loading={eager ? 'eager' : 'lazy'} onError={() => setFailedSrc(src)} className={className} />
  );
}

export function Stars({ rating, reviews }: { rating: number; reviews?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] text-[#5B6B80]" aria-label={`Rated ${rating} out of 5${reviews ? ` from ${reviews} reviews` : ''}`}>
      <span aria-hidden="true" className="tracking-[0.12em] text-[#F5B000]">{'★★★★★'.slice(0, Math.round(rating))}<span className="text-[#CFD8E3]">{'★★★★★'.slice(Math.round(rating))}</span></span>
      <span className="font-medium text-[#0E1A2B]">{rating.toFixed(1)}</span>
      {reviews !== undefined && reviews > 0 && <span>({reviews.toLocaleString('en-IN')})</span>}
    </span>
  );
}

type ButtonVariant = 'ink' | 'light' | 'outline' | 'accent' | 'ghost';

export function Button({ href, onClick, children, variant = 'ink', disabled = false, type = 'button', className = '' }: { href?: string; onClick?: (e: MouseEvent) => void; children: ReactNode; variant?: ButtonVariant; disabled?: boolean; type?: 'button' | 'submit'; className?: string }) {
  const looks: Record<ButtonVariant, string> = {
    ink: 'bg-[#0E1A2B] text-white hover:bg-[#22344F] shadow-[0_12px_30px_-14px_rgba(14,26,43,0.7)]',
    light: 'bg-white text-[#0E1A2B] hover:bg-[#EDF1F6] shadow-[0_12px_30px_-14px_rgba(0,0,0,0.5)]',
    outline: 'border border-[#CFD8E3] text-[#0E1A2B] hover:border-[#0E1A2B] bg-white/60',
    accent: 'bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white hover:brightness-110 shadow-[0_14px_34px_-12px_rgba(47,107,255,0.65)]',
    ghost: 'border border-white/30 text-white bg-white/5 backdrop-blur-md hover:bg-white hover:text-[#0E1A2B]',
  };
  const classes = `inline-flex items-center justify-center gap-2.5 px-8 h-[52px] rounded-full text-[14px] font-semibold tracking-[-0.005em] transition-all duration-300 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F6BFF] ${disabled ? 'bg-[#E3E8EF] text-[#8A97A8] cursor-not-allowed' : looks[variant]} ${className}`;
  if (href && !disabled) return <a href={href} className={classes}>{children}</a>;
  return <button type={type} disabled={disabled} onClick={onClick} className={classes}>{children}</button>;
}

/** An underlined arrow link. Without `href` it renders as a span, for use inside a larger link. */
export function TextLink({ href, children, light = false }: { href?: string; children: ReactNode; light?: boolean }) {
  const inner = (
    <>
      <span className={`border-b pb-1 transition-colors ${light ? 'border-white/50 group-hover:border-white' : 'border-[#0E1A2B]/30 group-hover:border-[#0E1A2B]'}`}>{children}</span>
      <span className="transition-transform duration-300 group-hover:translate-x-1"><Icon name="arrow" size={15} /></span>
    </>
  );
  const classes = `group inline-flex items-center gap-2 text-[14px] font-semibold ${light ? 'text-white' : 'text-[#0E1A2B]'}`;
  return href ? <a href={href} className={classes}>{inner}</a> : <span className={classes}>{inner}</span>;
}

type RevealFrom = 'up' | 'down' | 'left' | 'right' | 'scale';
const REVEAL_START: Record<RevealFrom, string> = {
  up: 'translate-y-10',
  down: '-translate-y-10',
  left: '-translate-x-14',
  right: 'translate-x-14',
  scale: 'scale-[0.93]',
};

/** Slides its children in (from below, a side, or growing) the first time they scroll into view. */
export function Reveal({ children, className = '', delay = 0, from = 'up' }: { children: ReactNode; className?: string; delay?: number; from?: RevealFrom }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -6% 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-[opacity,transform] duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${shown ? 'opacity-100 translate-x-0 translate-y-0 scale-100' : `opacity-0 ${REVEAL_START[from]}`} ${className}`}
    >
      {children}
    </div>
  );
}

const subscribeToScroll = (listener: () => void) => {
  window.addEventListener('scroll', listener, { passive: true });
  return () => window.removeEventListener('scroll', listener);
};

/** True once the page has scrolled past `offset` pixels. */
export function useScrolledPast(offset: number) {
  return useSyncExternalStore(subscribeToScroll, () => window.scrollY > offset, () => false);
}

export function SectionHeading({ eyebrow, title, text, action, center = false }: { eyebrow: string; title: ReactNode; text?: string; action?: { label: string; href: string }; center?: boolean }) {
  return (
    <div className={`flex flex-col gap-5 mb-6 sm:mb-8 ${center ? 'items-center text-center' : 'sm:flex-row sm:items-end sm:justify-between'}`}>
      <div className={center ? 'max-w-2xl' : 'max-w-2xl'}>
        <p className={`${T.eyebrow} mb-4`}>{eyebrow}</p>
        <h2 className={`${T.display} text-[38px] sm:text-[54px] leading-[1.02]`}>{title}</h2>
        {text && <p className="mt-4 text-[16px] leading-relaxed text-[#5B6B80]">{text}</p>}
      </div>
      {action && <TextLink href={action.href}>{action.label}</TextLink>}
    </div>
  );
}

export function PageTitle({ eyebrow, title, text, image }: { eyebrow: string; title: ReactNode; text?: string; image?: string }) {
  if (image) {
    return (
      <header className="on-dark relative mt-6 mb-6 sm:mb-8 h-[340px] sm:h-[420px] rounded-[28px] overflow-hidden bg-[#16263D] text-white">
        <Photo src={image} alt="" width={1800} eager className="absolute inset-0 h-full w-full object-cover kenburns" />
        <span className="absolute inset-0 bg-gradient-to-t from-[#0B1524]/90 via-[#0B1524]/35 to-[#0B1524]/10" />
        <div className="absolute left-7 right-7 bottom-8 sm:left-12 sm:bottom-12">
          <p className="rise text-[11.5px] uppercase tracking-[0.3em] text-white/80 mb-4">{eyebrow}</p>
          <h1 className={`rise rise-1 ${T.display} text-[44px] sm:text-[72px] leading-[0.98]`}>{title}</h1>
          {text && <p className="rise rise-2 mt-4 text-[16px] text-white/85 max-w-xl">{text}</p>}
        </div>
      </header>
    );
  }
  return (
    <header className="pt-14 sm:pt-20 pb-10 sm:pb-14 border-b border-[#E3E8EF] mb-6 sm:mb-8">
      <p className={`rise ${T.eyebrow} mb-5`}>{eyebrow}</p>
      <h1 className={`rise rise-1 ${T.display} text-[44px] sm:text-[68px] leading-[1]`}>{title}</h1>
      {text && <p className="rise rise-2 mt-6 text-[16.5px] leading-relaxed text-[#5B6B80] max-w-2xl">{text}</p>}
    </header>
  );
}

export function Swatches({ product, colorHex, max = 5 }: { product: Product; colorHex: Record<string, string>; max?: number }) {
  if (!product.colors.length) return null;
  return (
    <span className="flex items-center gap-1.5" aria-label={`Colors: ${product.colors.join(', ')}`}>
      {product.colors.slice(0, max).map((color) => (
        <span key={color} title={color} className="w-3.5 h-3.5 rounded-full ring-1 ring-black/10 ring-offset-1 ring-offset-[#F6F8FB]" style={{ backgroundColor: colorHex[color] ?? '#C9D2DD' }} />
      ))}
      {product.colors.length > max && <span className="text-[11px] text-[#8A97A8]">+{product.colors.length - max}</span>}
    </span>
  );
}

export function Price({ product, large = false }: { product: Product; large?: boolean }) {
  const off = percentOff(product);
  return (
    <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
      <span className={large ? 'text-[30px] font-bold tracking-[-0.03em]' : 'text-[15.5px] font-bold tracking-[-0.01em]'}>{inr(product.price)}</span>
      {off > 0 && product.mrp && (
        <>
          <s className={`${large ? 'text-[15px]' : 'text-[12.5px]'} text-[#8A97A8]`}>{inr(product.mrp)}</s>
          <span className={`${large ? 'text-[12.5px] px-2.5 py-1' : 'text-[11px] px-2 py-0.5'} rounded-full bg-[#2F6BFF]/10 text-[#2F6BFF] font-bold`}>{off}% off</span>
        </>
      )}
    </p>
  );
}

export function ProductCard({ product, colorHex, category }: { product: Product; colorHex: Record<string, string>; category?: CategoryItem }) {
  const wishlist = useStore(wishlistStore);
  const saved = wishlist.includes(product.id);
  const soldOut = product.stock <= 0;
  const photos = productPhotos(product);
  const alternate = photos[1] ?? Object.values(product.colorImages).flat().find((src) => src !== photos[0]);
  const off = percentOff(product);
  const badge = soldOut ? 'Sold out' : off >= 20 ? `−${off}%` : product.isNewArrival ? 'New' : product.tags.includes('Bestseller') ? 'Bestseller' : '';
  const lowStock = !soldOut && product.stock <= 5;
  const quickAdd = () => {
    if (hasChoices(product)) return navigate(`#/product/${product.id}`);
    const { size, color } = firstAvailable(product);
    addToBag(product, size, color);
  };

  return (
    <article className="group relative flex flex-col h-full rounded-[26px] bg-white p-2.5 ring-1 ring-[#0E1A2B]/[0.06] shadow-[0_1px_2px_rgba(14,26,43,0.04)] transition-all duration-500 ease-out hover:-translate-y-1.5 hover:ring-[#2F6BFF]/25 hover:shadow-[0_36px_70px_-34px_rgba(14,26,43,0.45)]">
      {/* Photo stage */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-gradient-to-b from-[#F3F6FA] to-[#E4EAF3]">
        <a href={`#/product/${product.id}`} aria-label={product.name} className="block h-full">
          <Photo src={photos[0]} alt="" width={700} className={`absolute inset-0 h-full w-full object-cover transition-all duration-[1100ms] ease-out group-hover:scale-[1.06] ${alternate ? 'group-hover:opacity-0' : ''} ${soldOut ? 'opacity-45 grayscale' : ''}`} />
          {alternate && <Photo src={alternate} alt="" width={700} className="absolute inset-0 h-full w-full object-cover opacity-0 scale-[1.06] transition-opacity duration-[1100ms] group-hover:opacity-100" />}
          <span className="absolute inset-0 bg-gradient-to-t from-[#0B1524]/45 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </a>

        {badge && (
          <span className={`absolute top-3 left-3 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-[0.02em] pointer-events-none backdrop-blur-md ${soldOut ? 'bg-[#0E1A2B]/90 text-white' : off >= 20 ? 'bg-[#2F6BFF] text-white shadow-[0_8px_20px_-8px_rgba(47,107,255,0.8)]' : 'bg-white/90 text-[#0E1A2B]'}`}>
            {badge}
          </span>
        )}
        <button
          onClick={() => toggleWishlist(product)}
          aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={saved}
          className={`absolute top-3 right-3 w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all duration-300 hover:scale-110 ${saved ? 'bg-[#2F6BFF] text-white' : 'bg-white/90 text-[#0E1A2B]'}`}
        >
          <Icon name="heart" size={17} filled={saved} />
        </button>

        <a
          href={`#/product/${product.id}`}
          className="absolute left-1/2 bottom-4 -translate-x-1/2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100 transition-all duration-500 inline-flex items-center gap-2 px-4 h-10 rounded-full bg-white/15 backdrop-blur-xl border border-white/30 text-white text-[13px] font-semibold whitespace-nowrap"
        >
          <Icon name="eye" size={16} /> View details
        </a>
      </div>

      {/* Details */}
      <div className="flex flex-col flex-1 px-2 pt-4 pb-1.5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] uppercase tracking-[0.14em] font-bold text-[#8A97A8] truncate">{category?.name ?? product.category}</p>
          <span className="flex items-center gap-1 text-[12px] font-semibold text-[#0E1A2B] shrink-0" aria-label={`Rated ${product.rating.toFixed(1)} out of 5`}>
            <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="#F5B000"><path d="m12 2.8 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5L2.6 9.6l6.5-.9L12 2.8Z" /></svg>
            {product.rating.toFixed(1)}
            {product.reviews > 0 && <span className="text-[#8A97A8] font-medium">({product.reviews >= 1000 ? `${(product.reviews / 1000).toFixed(1)}k` : product.reviews})</span>}
          </span>
        </div>
        <a href={`#/product/${product.id}`} className="mt-2 text-[16px] font-bold leading-[1.3] tracking-[-0.02em] text-[#0E1A2B] hover:text-[#2F6BFF] transition-colors line-clamp-2 min-h-[42px]">{product.name}</a>
        <div className="mt-2.5 flex items-center gap-2 min-h-[18px]">
          <Swatches product={product} colorHex={colorHex} max={4} />
          {product.colors.length > 0 && <span className="text-[12px] text-[#8A97A8]">{product.colors.length} {product.colors.length === 1 ? 'colour' : 'colours'}</span>}
          {product.sizes.length > 0 && <span className="text-[12px] text-[#8A97A8]">· {product.sizes.length} sizes</span>}
        </div>
        <div className="mt-auto pt-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <Price product={product} />
            {lowStock && <p className="mt-1 text-[11.5px] font-semibold text-[#D23B3B]">Only {product.stock} left</p>}
          </div>
          {soldOut ? (
            <span className="shrink-0 px-3 h-10 rounded-full bg-[#EDF1F6] text-[#8A97A8] text-[12px] font-bold flex items-center">Sold out</span>
          ) : (
            <button
              onClick={quickAdd}
              aria-label={hasChoices(product) ? `Choose options for ${product.name}` : `Add ${product.name} to bag`}
              title={hasChoices(product) ? 'Choose options' : 'Add to bag'}
              className="shrink-0 w-11 h-11 rounded-full bg-[#0E1A2B] text-white flex items-center justify-center transition-all duration-300 hover:bg-[#2F6BFF] hover:shadow-[0_12px_26px_-10px_rgba(47,107,255,0.8)] hover:rotate-90 active:scale-95"
            >
              <Icon name={hasChoices(product) ? 'arrow' : 'plus'} size={18} stroke={2} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, colorHex, categoryOf, columns = 4 }: { products: Product[]; colorHex: Record<string, string>; categoryOf: (p: Product) => CategoryItem | undefined; columns?: 3 | 4 }) {
  return (
    <div className={`grid grid-cols-2 ${columns === 4 ? 'lg:grid-cols-4' : 'xl:grid-cols-3'} gap-3 sm:gap-5`}>
      {products.map((product, i) => (
        <Reveal key={product.id} from="up" delay={(i % columns) * 90} className="h-full">
          <ProductCard product={product} colorHex={colorHex} category={categoryOf(product)} />
        </Reveal>
      ))}
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: string; title: string; text: string; action: { label: string; href: string } }) {
  return (
    <div className="max-w-md mx-auto text-center py-14">
      <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-[#EDF1F6] flex items-center justify-center text-[#0E1A2B]"><Icon name={icon} size={26} stroke={1.3} /></div>
      <h1 className={`${T.display} text-[34px] leading-tight mb-3`}>{title}</h1>
      <p className="text-[15px] text-[#5B6B80] mb-9 leading-relaxed">{text}</p>
      <Button href={action.href}>{action.label}</Button>
    </div>
  );
}

export function QtyStepper({ qty, max, onChange, label }: { qty: number; max: number; onChange: (qty: number) => void; label: string }) {
  const step = 'w-11 h-11 rounded-full flex items-center justify-center hover:bg-[#EDF1F6] transition-colors disabled:opacity-30 disabled:hover:bg-transparent';
  return (
    <div role="group" aria-label={`Quantity of ${label}`} className="inline-flex items-center border border-[#CFD8E3] rounded-full p-0.5">
      <button onClick={() => onChange(qty - 1)} aria-label="Decrease quantity" className={step}><Icon name="minus" size={14} /></button>
      <span aria-live="polite" className="w-9 text-center text-[14px] tabular-nums">{qty}</span>
      <button onClick={() => onChange(qty + 1)} disabled={qty >= max} aria-label="Increase quantity" className={step}><Icon name="plus" size={14} /></button>
    </div>
  );
}

export function TotalsList({ totals, promo }: { totals: { subtotal: number; discount: number; delivery: number; total: number }; promo: string }) {
  const row = 'flex justify-between gap-4 text-[14px] text-[#5B6B80]';
  return (
    <dl className="space-y-3.5">
      <div className={row}><dt>Subtotal</dt><dd className="tabular-nums text-[#0E1A2B]">{inr(totals.subtotal)}</dd></div>
      {totals.discount > 0 && <div className={row}><dt>Promo <span className="font-mono text-[12.5px]">{promo}</span></dt><dd className="tabular-nums text-[#0F8A5F]">−{inr(totals.discount)}</dd></div>}
      <div className={row}><dt>Delivery</dt><dd className={`tabular-nums ${totals.delivery ? 'text-[#0E1A2B]' : 'text-[#0F8A5F]'}`}>{totals.delivery ? inr(totals.delivery) : 'Complimentary'}</dd></div>
      <div className="flex justify-between gap-4 pt-5 mt-2 border-t border-[#E3E8EF]">
        <dt className="text-[17px] font-bold">Total</dt>
        <dd className="text-[22px] font-extrabold tracking-[-0.02em] tabular-nums">{inr(totals.total)}</dd>
      </div>
    </dl>
  );
}
