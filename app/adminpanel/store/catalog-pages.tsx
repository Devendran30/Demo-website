'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ProductBarcode } from '../product-barcode';
import { VideoPlayerModal } from '../video-player';
import {
  bannersStore, instagramStore, subCategoriesStore, subSubCategoriesStore, sizeOptionsStore, videosStore, recordVideoView,
  stockForVariant, productPhotos, percentOff, photoUrl, sizeTotal, colorTotal, variantSizes, variantColors,
  FREE_DELIVERY_FROM,
  type Product, type HeroBanner, type EcommerceVideo, useStoreDetails,
} from '../demo-data';
import {
  T, Icon, Photo, Stars, Button, TextLink, SectionHeading, PageTitle, Price, ProductCard, ProductGrid, EmptyState, QtyStepper, Reveal,
  useStore, useCatalog, wishlistStore, bagStore, addToBag, toggleWishlist, firstAvailable, navigate, shopHref, inr, STANDARD,
} from './store-kit';

// =============================================================================
// Home Page
// =============================================================================

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  mobileImage: string;
  ctaText: string;
  ctaLink: string;
  textColor: string;
}

/**
 * Full-bleed hero: the banner photo fills the whole section edge to edge, with the words laid over it.
 * A dark wash keeps the text readable (from the left on desktop, from the bottom on phones); slides crossfade every 7 seconds.
 */
function Hero({ slides }: { slides: HeroSlide[] }) {
  const { products, colorHex } = useCatalog();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const current = slides.length ? index % slides.length : 0;
  const slide = slides[current];
  const spotlightPool = products.filter((p) => p.isFeatured && p.stock > 0);
  const pick = spotlightPool[current % Math.max(1, spotlightPool.length)] ?? products[0];
  const avgRating = products.length ? products.reduce((sum, p) => sum + p.rating, 0) / products.length : 0;
  const reviews = products.reduce((sum, p) => sum + p.reviews, 0);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), 7000);
    return () => clearInterval(timer);
  }, [paused, slides.length]);

  const go = (delta: number) => setIndex((current + delta + slides.length) % slides.length);
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured collections"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="on-dark relative -mt-[72px] lg:-mt-[84px] overflow-hidden bg-[var(--st-deep)] text-white min-h-[min(100svh,760px)] sm:min-h-[min(100svh,820px)] lg:min-h-[min(100svh,880px)] flex"
    >
      {/* Background photos, edge to edge */}
      <div aria-hidden="true" className="absolute inset-0">
        {slides.map((s, i) => (
          <picture key={s.id}>
            {s.mobileImage && <source media="(max-width: 767px)" srcSet={photoUrl(s.mobileImage, 1000)} />}
            <img
              src={photoUrl(s.image, 2000)}
              alt=""
              loading={i === 0 ? 'eager' : 'lazy'}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${i === current ? 'opacity-100 kenburns' : 'opacity-0'}`}
            />
          </picture>
        ))}
      </div>

      {/* Washes so the words always read: from the bottom on phones, from the left on wider screens */}
      <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[var(--st-deep)] from-15% via-[var(--st-deep)]/55 via-50% to-[var(--st-deep)]/0 sm:hidden" />
      <span aria-hidden="true" className="absolute inset-0 hidden sm:block bg-gradient-to-r from-[var(--st-deep)]/95 via-[var(--st-deep)]/65 to-[var(--st-deep)]/5" />
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[var(--st-deep)]/70 to-transparent" />
      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-32 hidden sm:block bg-gradient-to-t from-[var(--st-deep)]/70 to-transparent" />
      <span aria-hidden="true" className="pointer-events-none absolute -top-40 -left-32 w-[640px] h-[640px] rounded-full bg-[var(--st-accent)]/20 blur-[140px] drift" />

      <div className={`${T.shell} relative w-full flex items-end sm:items-center pt-[120px] lg:pt-[140px] pb-10 sm:pb-16 lg:pb-20`}>
        {/* Words */}
        <div key={slide.id} className="relative z-10 max-w-[640px]">
          <p className="hero-left inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[12.5px] font-semibold" style={{ animationDelay: '0ms' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--st-accent-2)] shadow-[0_0_12px_var(--st-accent-2)]" /> New season · {pad(current + 1)} of {pad(slides.length)}
          </p>
          <h1 className={`hero-left mt-5 sm:mt-6 ${T.display} text-[40px] sm:text-[64px] xl:text-[80px] leading-[1.02] [text-shadow:0_4px_30px_rgba(0,0,0,0.35)]`} style={{ animationDelay: '90ms', color: slide.textColor }}>
            {slide.title}
          </h1>
          {slide.subtitle && <p className="hero-left mt-5 sm:mt-6 text-[16px] sm:text-[18.5px] leading-relaxed text-white/80 max-w-lg" style={{ animationDelay: '180ms' }}>{slide.subtitle}</p>}
          <div className="hero-left mt-7 sm:mt-9 flex flex-wrap gap-3" style={{ animationDelay: '270ms' }}>
            {slide.ctaText && <Button href={slide.ctaLink || '#/shop'} variant="accent">{slide.ctaText} <Icon name="arrow" size={16} /></Button>}
            <Button href="#/shop" variant="ghost">View all products</Button>
          </div>
          <div className="hero-left mt-8 sm:mt-10 flex flex-wrap items-center gap-x-8 gap-y-4" style={{ animationDelay: '360ms' }}>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2.5">
                {products.slice(0, 4).map((p) => (
                  <Photo key={p.id} src={p.image} alt="" width={80} className="w-9 h-9 rounded-full object-cover ring-2 ring-[var(--st-deep)]" />
                ))}
              </div>
              <div className="leading-tight">
                <p className="text-[14px] font-bold"><span className="text-[#F5B000]">★</span> {avgRating.toFixed(1)} rating</p>
                <p className="text-[12px] text-white/60">{reviews.toLocaleString('en-IN')} happy reviews</p>
              </div>
            </div>
            <span className="hidden sm:block w-px h-9 bg-white/20" />
            <p className="hidden sm:flex text-[13px] text-white/75 items-center gap-2"><Icon name="truck" size={18} /> Free delivery over ₹4,999</p>
          </div>

          {/* Slide controls */}
          {slides.length > 1 && (
            <div className="hero-left mt-8 sm:mt-10 flex items-center gap-5" style={{ animationDelay: '450ms' }}>
              <div className="flex items-center gap-2" role="tablist" aria-label="Choose slide">
                {slides.map((s, i) => (
                  <button key={s.id} role="tab" aria-selected={i === current} aria-label={`Show slide ${i + 1}: ${s.title}`} onClick={() => setIndex(i)} className="py-3">
                    <span className={`block h-[3px] rounded-full overflow-hidden transition-all duration-500 ${i === current ? 'w-14 bg-white/25' : 'w-6 bg-white/25 hover:bg-white/45'}`}>
                      {i === current && <span key={`${index}-${paused}`} className={`block h-full bg-gradient-to-r from-[var(--st-accent-2)] to-white ${paused ? 'w-full' : 'progress-7'}`} />}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => go(-1)} aria-label="Previous slide" className="w-10 h-10 rounded-full border border-white/25 bg-white/5 backdrop-blur-md hover:bg-white hover:text-[var(--st-ink)] flex items-center justify-center transition-colors"><Icon name="back" size={16} /></button>
                <button onClick={() => go(1)} aria-label="Next slide" className="w-10 h-10 rounded-full border border-white/25 bg-white/5 backdrop-blur-md hover:bg-white hover:text-[var(--st-ink)] flex items-center justify-center transition-colors"><Icon name="arrow" size={16} /></button>
              </div>
            </div>
          )}
        </div>

        {/* Floating glass cards, desktop only so phones keep the photo clear */}
        {pick && (
          <a
            href={`#/product/${pick.id}`}
            key={`pick-${current}`}
            className="hero-pop hidden lg:flex absolute bottom-20 right-6 xl:right-10 items-center gap-3.5 p-2.5 pr-5 rounded-[22px] bg-white/[0.12] backdrop-blur-2xl border border-white/20 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)] hover:bg-white/20 transition-colors"
            style={{ animationDelay: '500ms' }}
          >
            <Photo src={pick.image} alt="" width={160} className="w-16 h-16 rounded-[16px] object-cover" />
            <span className="min-w-0">
              <span className="block text-[11px] uppercase tracking-[0.14em] font-bold text-[var(--st-accent-light)]">Featured</span>
              <span className="block text-[14px] font-bold truncate max-w-[190px]">{pick.name}</span>
              <span className="flex items-center gap-2 text-[13px] text-white/75">
                {inr(pick.price)}
                {pick.colors.slice(0, 3).map((c) => <span key={c} className="w-2.5 h-2.5 rounded-full ring-1 ring-white/40" style={{ backgroundColor: colorHex[c] }} />)}
              </span>
            </span>
          </a>
        )}
        <div className="hero-pop hidden lg:flex absolute top-[124px] right-6 xl:right-10 items-center gap-3 px-4 py-3 rounded-[18px] bg-white text-[var(--st-ink)] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)]" style={{ animationDelay: '700ms' }}>
          <span className="w-9 h-9 rounded-full bg-[var(--st-accent)]/10 text-[var(--st-accent)] flex items-center justify-center"><Icon name="shield" size={18} /></span>
          <span className="leading-tight">
            <span className="block text-[13px] font-extrabold">1-year warranty</span>
            <span className="block text-[11.5px] text-[#6F7E92]">on every product</span>
          </span>
        </div>
      </div>
    </section>
  );
}

export const bannerSlides = (banners: HeroBanner[]): HeroSlide[] =>
  banners.map((b) => ({ id: b.id, title: b.title, subtitle: b.subtitle, image: b.imageUrl, mobileImage: b.mobileImageUrl, ctaText: b.ctaText, ctaLink: b.ctaLink, textColor: b.textColor }));

export const fallbackSlides = (product?: Product): HeroSlide[] =>
  product ? [{ id: 'static', title: 'Fewer things. Better ones.', subtitle: 'Considered electronics, chosen for how well they work and how long they last.', image: product.image, mobileImage: '', ctaText: 'Shop the collection', ctaLink: '#/shop', textColor: '#ffffff' }] : [];

const PERKS = [
  ['shield', 'Genuine, sealed products'],
  ['bolt', 'Dispatched within 48 hours'],
  ['truck', 'Free delivery over ₹4,999'],
  ['refresh', '7-day easy returns'],
  ['spark', 'One-year warranty on everything'],
  ['card', 'Secure UPI, card & COD'],
  ['chat', 'Real people, 7 days a week'],
];

/** A slow-moving ribbon of store promises under the hero. */
function PerksTicker() {
  const run = (hidden: boolean) => (
    <div aria-hidden={hidden} className="flex shrink-0 items-center">
      {PERKS.map(([icon, text]) => (
        <span key={text} className="flex items-center gap-3 px-8 whitespace-nowrap text-[14px] font-semibold text-[var(--st-ink)]">
          <span className="w-8 h-8 rounded-full bg-[var(--st-accent)]/10 text-[var(--st-accent)] flex items-center justify-center"><Icon name={icon} size={16} /></span>
          {text}
        </span>
      ))}
    </div>
  );
  return (
    <div className="bg-white border-b border-[#E3E8EF] py-4 overflow-hidden group [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
      <div className="marquee flex group-hover:[animation-play-state:paused]">
        {run(false)}
        {run(true)}
      </div>
    </div>
  );
}

/** Time left until midnight, ticking every second once the page is in the browser. */
export function useMidnightCountdown() {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(24, 0, 0, 0);
      setLeft(end.getTime() - now.getTime());
    };
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);
  return left;
}

function DealOfTheDay({ product }: { product: Product }) {
  const left = useMidnightCountdown();
  const parts = left === null ? ['--', '--', '--'] : [left / 3600000, (left / 60000) % 60, (left / 1000) % 60].map((n) => String(Math.floor(n)).padStart(2, '0'));
  const claimed = 52 + (product.reviews % 37);
  return (
    <section className="pt-12 sm:pt-16">
      <div className="relative overflow-hidden rounded-[32px] bg-white border border-[#E3E8EF] shadow-[0_40px_80px_-60px_rgba(14,26,43,0.6)] grid lg:grid-cols-2">
        <Reveal from="left" className="relative min-h-[320px] lg:min-h-[480px] bg-gradient-to-br from-[#EEF3FA] to-[#DCE5F2]">
          <Photo src={productPhotos(product)[0]} alt={product.name} width={1100} className="absolute inset-0 h-full w-full object-cover" />
          <span className="absolute top-5 left-5 px-4 py-2 rounded-full bg-[#D23B3B] text-white text-[12.5px] font-bold shadow-[0_10px_24px_-10px_rgba(210,59,59,0.8)]">−{percentOff(product)}% today only</span>
        </Reveal>
        <Reveal from="right" delay={120} className="p-7 sm:p-12 flex flex-col justify-center">
          <p className={`${T.eyebrow} mb-3 flex items-center gap-2`}><Icon name="bolt" size={15} /> Deal of the day</p>
          <h2 className={`${T.display} text-[34px] sm:text-[46px] leading-[1.04]`}>{product.name}</h2>
          <p className="mt-4 text-[16px] text-[#5B6B80] leading-relaxed">{product.description}</p>
          <div className="mt-6"><Price product={product} large /></div>
          <div className="mt-7">
            <p className="text-[13px] font-bold text-[#3A4A5F] mb-3">Offer ends in</p>
            <div className="flex gap-3" aria-live="off">
              {['Hours', 'Mins', 'Secs'].map((label, i) => (
                <div key={label} className="w-[78px] py-3 rounded-[16px] bg-[var(--st-ink)] text-white text-center">
                  <p className="text-[26px] font-extrabold tabular-nums tracking-[-0.02em] leading-none">{parts[i]}</p>
                  <p className="mt-1.5 text-[11px] font-semibold text-white/55">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-7">
            <div className="flex justify-between text-[13px] font-semibold mb-2"><span className="text-[#D23B3B]">{claimed}% claimed</span><span className="text-[#6F7E92]">Hurry, limited stock</span></div>
            <div className="h-2 rounded-full bg-[#EDF1F6] overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-[var(--st-accent)] to-[#D23B3B]" style={{ width: `${claimed}%` }} /></div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href={`#/product/${product.id}`} variant="accent">Grab the deal <Icon name="arrow" size={16} /></Button>
            <Button href="#/deals" variant="outline">More offers</Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const WHY_US = [
  ['shield', 'Only genuine products', 'Sourced from brands and authorised distributors, sealed in the original box with full warranty.'],
  ['flask', 'Tested before it’s listed', 'Every product spends 30 days with our team before it earns a place in the store.'],
  ['bolt', '48-hour dispatch', 'Orders leave our Bengaluru warehouse within two days, with live tracking to your door.'],
  ['chat', 'Experts, not scripts', 'Real people who use the products answer every question — 7 days a week.'],
];

const STEPS_HOW = [
  ['search', 'Discover', 'Browse a small, carefully chosen range — no endless scrolling.'],
  ['bag', 'Order securely', 'Pay by UPI, card or cash on delivery. Prices include GST.'],
  ['truck', 'Track live', 'Follow your parcel from packing to your door, right from your account.'],
  ['heart', 'Enjoy for years', 'A one-year warranty and 7-day returns, with help whenever you need it.'],
];

export function Carousel({ products, colorHex, categoryOf }: { products: Product[] } & Pick<ReturnType<typeof useCatalog>, 'colorHex' | 'categoryOf'>) {
  const track = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.8, behavior: 'smooth' });
  return (
    <div className="relative">
      <div ref={track} className="flex gap-5 sm:gap-7 overflow-x-auto snap-x snap-mandatory pb-2 -mx-5 px-5 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((product) => (
          <div key={product.id} className="snap-start shrink-0 w-[72%] sm:w-[42%] lg:w-[calc(25%-21px)]">
            <ProductCard product={product} colorHex={colorHex} category={categoryOf(product)} />
          </div>
        ))}
      </div>
      <div className="hidden sm:flex justify-end gap-2 mt-5">
        <button onClick={() => scroll(-1)} aria-label="Scroll back" className="w-12 h-12 rounded-full bg-white border border-[#E3E8EF] hover:bg-[var(--st-ink)] hover:text-white hover:border-[var(--st-ink)] flex items-center justify-center transition-colors"><Icon name="back" size={17} /></button>
        <button onClick={() => scroll(1)} aria-label="Scroll forward" className="w-12 h-12 rounded-full bg-white border border-[#E3E8EF] hover:bg-[var(--st-ink)] hover:text-white hover:border-[var(--st-ink)] flex items-center justify-center transition-colors"><Icon name="arrow" size={17} /></button>
      </div>
    </div>
  );
}

/** Widens the last tiles so the category grid never ends with empty cells (2 columns on phones, 4 on desktop). */
/** Product videos from Admin → Videos. Each play is counted, and the player links to the product. */
function VideoShelf({ videos, heading }: { videos: EcommerceVideo[]; heading: ReactNode }) {
  const { products } = useCatalog();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const playing = videos.find((v) => v.id === playingId);
  const productOf = (video: EcommerceVideo) => products.find((p) => p.name === video.productName);
  const playingProduct = playing && productOf(playing);

  return (
    <>
      {heading}
      <div className={`grid gap-4 sm:gap-5 ${videos.length === 1 ? 'max-w-xl' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
        {videos.map((video, i) => {
          const product = productOf(video);
          return (
            <Reveal key={video.id} delay={i * 110} className="h-full">
              <article className="group h-full flex flex-col rounded-[26px] bg-white border border-[#E3E8EF] overflow-hidden hover:-translate-y-1 hover:shadow-[0_30px_60px_-40px_rgba(14,26,43,0.5)] transition-all duration-500">
                <button
                  type="button"
                  onClick={() => {
                    setPlayingId(video.id);
                    recordVideoView(video.id);
                  }}
                  aria-label={`Play video: ${video.title}`}
                  className="relative block w-full aspect-video bg-[var(--st-deep)] overflow-hidden"
                >
                  <Photo src={video.thumbnail || product?.image || ''} alt="" width={800} className="absolute inset-0 h-full w-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-[1.06]" />
                  <span className="absolute inset-0 bg-gradient-to-t from-[var(--st-deep)]/70 via-transparent to-transparent" />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="w-16 h-16 rounded-full bg-white/90 backdrop-blur-md text-[var(--st-accent)] flex items-center justify-center shadow-[0_16px_32px_-12px_rgba(0,0,0,0.6)] transition-transform duration-500 group-hover:scale-110">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="ml-1"><path d="M7 4.5v15l12.5-7.5L7 4.5Z" /></svg>
                    </span>
                  </span>
                  {video.duration && <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/65 text-white text-[12px] font-bold tabular-nums">{video.duration}</span>}
                </button>
                <div className="flex-1 flex flex-col p-5 sm:p-6">
                  <p className="text-[11px] uppercase tracking-[0.16em] font-bold text-[#6F7E92] truncate">{product?.name ?? video.productName}</p>
                  <h3 className="mt-2 text-[17px] font-bold tracking-[-0.02em] leading-snug">{video.title}</h3>
                  <div className="mt-auto pt-4 flex items-center justify-between gap-3 text-[13px] text-[#6F7E92]">
                    <span className="inline-flex items-center gap-1.5"><Icon name="eye" size={15} />{video.views.toLocaleString('en-IN')} views</span>
                    {product && <a href={`#/product/${product.id}`} className="font-semibold text-[var(--st-accent)] hover:underline">Shop now →</a>}
                  </div>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
      {playing && (
        <VideoPlayerModal video={playing} onClose={() => setPlayingId(null)}>
          {playingProduct ? (
            <>
              <span className="text-[14px] text-white/80">{playingProduct.name} · <strong className="text-white">{inr(playingProduct.price)}</strong></span>
              <a href={`#/product/${playingProduct.id}`} onClick={() => setPlayingId(null)} className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-[var(--st-accent)] hover:bg-[#2459DB] text-white text-[14px] font-semibold">Shop this product <Icon name="arrow" size={16} /></a>
            </>
          ) : (
            <span className="text-[13px] text-white/60">{playing.views.toLocaleString('en-IN')} views</span>
          )}
        </VideoPlayerModal>
      )}
    </>
  );
}

function lastTileSpan(index: number, count: number) {
  if (index === 0) return '';
  const rest = count - 1;
  const fromEnd = count - 1 - index;
  const phone = fromEnd === 0 && rest % 2 === 1 ? 'col-span-2' : '';
  const r = rest % 4;
  const desktop = (r === 3 && fromEnd === 0) || (r === 2 && fromEnd <= 1) ? 'md:col-span-2' : r === 1 && fromEnd === 0 ? 'md:col-span-4' : phone ? 'md:col-span-1' : '';
  return `${phone} ${desktop}`;
}

export const REVIEWS = [
  { name: 'Aarav M.', city: 'Mumbai', productId: 'wireless-nc-headphones-pro', text: 'The noise cancelling is unreal, and the packaging felt like opening a gift. Worth every rupee.' },
  { name: 'Priya S.', city: 'Chennai', productId: 'ergonomic-mechanical-keyboard', text: 'Ordered the TKL at night and it was at my door in two days. Beautifully made — it feels like an heirloom.' },
  { name: 'Ananya R.', city: 'Kolkata', productId: 'ultra-slim-smartwatch-7', text: 'Finally a store that doesn’t drown you in choice. Everything here is simply good, and it shows.' },
];

export function HomePage() {
  const storeInfo = useStoreDetails();
  const { products, categories, colorHex, categoryOf, productById } = useCatalog();
  const banners = useStore(bannersStore).filter((b) => b.isActive && b.imageUrl);
  const posts = useStore(instagramStore);
  const videos = useStore(videosStore);
  const inStock = products.filter((p) => p.stock > 0);
  const [tab, setTab] = useState<'featured' | 'bestsellers' | 'gifts'>('featured');
  const tabs = {
    featured: { label: 'Featured', items: [...products.filter((p) => p.isFeatured)].sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0)) },
    bestsellers: { label: 'Most loved', items: [...inStock].sort((a, b) => b.reviews - a.reviews) },
    gifts: { label: 'Gifts under ₹10,000', items: inStock.filter((p) => p.price < 10000).sort((a, b) => b.rating - a.rating) },
  };
  const newArrivals = products.filter((p) => p.isNewArrival).slice(0, 10);
  const byDiscount = [...inStock].sort((a, b) => percentOff(b) - percentOff(a));
  const spotlight = byDiscount[0];
  const deal = byDiscount[1] ?? byDiscount[0];
  const editorial = ['Cameras & Drones', 'Gaming'].map((name) => categories.find((c) => c.name === name)).filter((c) => c?.image).slice(0, 2);
  const avgRating = products.length ? products.reduce((sum, p) => sum + p.rating, 0) / products.length : 0;
  const reviewCount = products.reduce((sum, p) => sum + p.reviews, 0);
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);
  // Floating spec tags around the product in focus, placed at the image's corners.
  const chipSpots = ['left-[4%] top-[14%]', 'right-[4%] top-[26%]', 'left-[8%] bottom-[16%]', 'right-[6%] bottom-[10%]'];

  return (
    <>
      <Hero slides={banners.length ? bannerSlides(banners) : fallbackSlides(tabs.featured.items[0] ?? products[0])} />
      <PerksTicker />

      {/* Statement */}
      <section className={`${T.shell} pt-12 sm:pt-16 pb-4`}>
        <Reveal from="scale" className="max-w-5xl mx-auto text-center">
          <p className={`${T.eyebrow} mb-5`}>The {storeInfo.name} way</p>
          <p className="text-[28px] sm:text-[46px] font-semibold leading-[1.18] tracking-[-0.035em] text-[var(--st-ink)]">
            We choose <em className="text-[var(--st-accent)]">fewer pieces</em>, and choose them well — sound, screens and smart things made to be <em>used for years</em>, not replaced in months.
          </p>
        </Reveal>
        <Reveal delay={150} className="mt-8 sm:mt-10 grid grid-cols-2 lg:grid-cols-4 border-y border-[#E3E8EF]">
          {[
            [String(products.length), 'Pieces, each one chosen'],
            [`${avgRating.toFixed(1)}★`, `From ${reviewCount.toLocaleString('en-IN')} reviews`],
            ['7 days', 'To change your mind'],
            ['1 year', 'Warranty on everything'],
          ].map(([value, label], i) => (
            <div key={label} className={`py-6 sm:py-7 px-4 text-center ${i % 2 ? 'border-l border-[#E3E8EF]' : ''} ${i === 2 ? 'lg:border-l' : ''} ${i > 1 ? 'border-t lg:border-t-0 border-[#E3E8EF]' : ''}`}>
              <p className={`${T.display} text-[44px] sm:text-[60px] leading-none bg-gradient-to-b from-[var(--st-ink)] to-[#3A5A8F] bg-clip-text text-transparent`}>{value}</p>
              <p className="mt-3 text-[12px] uppercase tracking-[0.16em] font-semibold text-[#6F7E92]">{label}</p>
            </div>
          ))}
        </Reveal>
      </section>

      <div className={T.shell}>
        {/* Categories */}
        <section className="pt-12 sm:pt-16">
          <Reveal><SectionHeading eyebrow="The collection" title={<>Shop by <em>category</em></>} action={{ label: 'View everything', href: '#/shop' }} /></Reveal>
          <Reveal delay={100} className="grid grid-cols-2 md:grid-cols-4 auto-rows-[210px] sm:auto-rows-[270px] lg:auto-rows-[310px] gap-3 sm:gap-4">
            {categories.map((category, index) => {
              const count = products.filter((p) => p.category === category.name).length;
              return (
                <a key={category.id} href={shopHref({ cat: category.slug })} className={`on-dark group relative overflow-hidden rounded-[24px] bg-[var(--st-ink-2)] text-white ${index === 0 ? 'col-span-2 row-span-2' : ''} ${lastTileSpan(index, categories.length)}`}>
                  <Photo src={category.image} alt="" width={index === 0 ? 1200 : 700} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.07]" />
                  <span className="absolute inset-0 bg-gradient-to-t from-[var(--st-deep)]/90 via-[var(--st-deep)]/15 to-transparent" />
                  <span className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500"><Icon name="arrow" size={17} /></span>
                  <span className="absolute left-5 right-5 bottom-5 sm:left-7 sm:bottom-7">
                    <span className="inline-block px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-bold mb-3">{count} {count === 1 ? 'product' : 'products'}</span>
                    <span className={`block ${T.display} ${index === 0 ? 'text-[40px] sm:text-[58px]' : 'text-[22px] sm:text-[27px]'} leading-[1]`}>{category.name}</span>
                    {index === 0 && <span className="hidden sm:block mt-4 text-[15px] text-white/80 max-w-xs">{category.blurb}</span>}
                  </span>
                </a>
              );
            })}
          </Reveal>
        </section>

        {/* The Edit (tabbed) */}
        <section className="pt-12 sm:pt-16">
          <Reveal className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-6 sm:mb-8">
            <div className="max-w-3xl">
              <p className={`${T.eyebrow} mb-4`}>The edit</p>
              <h2 className={`${T.display} text-[38px] sm:text-[54px] leading-[1.02]`}>Pieces we <em>reach for</em> every day</h2>
            </div>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Collections">
              {(Object.keys(tabs) as (keyof typeof tabs)[]).map((key) => (
                <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={`px-5 h-11 rounded-full text-[14px] font-semibold transition-all ${tab === key ? 'bg-[var(--st-ink)] text-white shadow-[0_10px_24px_-12px_rgba(14,26,43,0.7)]' : 'bg-white border border-[#E3E8EF] text-[#5B6B80] hover:border-[var(--st-ink)] hover:text-[var(--st-ink)]'}`}>
                  {tabs[key].label}
                </button>
              ))}
            </div>
          </Reveal>
          <div key={tab} className="fade">
            <ProductGrid products={tabs[tab].items.slice(0, 4)} colorHex={colorHex} categoryOf={categoryOf} />
          </div>
        </section>
      </div>

      <div className={T.shell}>
        {/* Why shop with us */}
        <section className="pt-12 sm:pt-16">
          <Reveal><SectionHeading eyebrow="Why shop with us" title={<>Small store. <em>Big standards.</em></>} /></Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {WHY_US.map(([icon, title, text], i) => (
              <Reveal key={title} from={i % 2 ? 'right' : 'left'} delay={i * 110} className="h-full">
                <div className="group h-full p-7 rounded-[26px] bg-white border border-[#E3E8EF] hover:border-[var(--st-accent)]/30 hover:-translate-y-1 hover:shadow-[0_30px_60px_-40px_rgba(14,26,43,0.5)] transition-all duration-500">
                  <span className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-[var(--st-accent)] to-[var(--st-ink)] text-white flex items-center justify-center shadow-[0_12px_24px_-10px_rgba(47,107,255,0.7)] group-hover:scale-110 transition-transform duration-500"><Icon name={icon} size={21} /></span>
                  <h3 className="mt-6 text-[18px] font-bold tracking-[-0.02em]">{title}</h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-[#5B6B80]">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      </div>

      {/* In focus */}
      {spotlight && (
        <section className="on-dark relative mt-12 sm:mt-16 bg-[var(--st-deep)] text-white overflow-hidden">
          <span aria-hidden="true" className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full bg-[var(--st-accent)]/25 blur-[140px]" />
          <div className={`${T.shell} relative py-12 sm:py-16`}>
            <Reveal className="text-center max-w-3xl mx-auto">
              <p className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--st-accent)]/15 border border-[var(--st-accent)]/30 text-[12.5px] font-bold text-[var(--st-accent-light)] mb-7">In focus · {percentOff(spotlight)}% off this week</p>
              <h2 className={`${T.display} text-[48px] sm:text-[84px] leading-[0.98]`}><em>{spotlight.name}</em></h2>
              <p className="mt-6 text-[17px] leading-relaxed text-[#9AA7B8] max-w-xl mx-auto">{spotlight.description}</p>
            </Reveal>
            <Reveal from="scale" delay={120} className="relative mt-8 max-w-4xl mx-auto">
              <div className="relative aspect-[16/10] rounded-[32px] overflow-hidden bg-[var(--st-ink-2)] shadow-[0_60px_120px_-40px_rgba(0,0,0,0.8)]">
                <Photo src={productPhotos(spotlight)[0]} alt={spotlight.name} width={1600} className="absolute inset-0 h-full w-full object-cover" />
                <span className="absolute inset-0 bg-gradient-to-t from-[var(--st-deep)]/50 to-transparent" />
              </div>
              {spotlight.specs.slice(0, 4).map(([label, value], i) => (
                <span key={label} className={`hidden md:block absolute ${chipSpots[i]} px-5 py-3.5 rounded-[18px] bg-[var(--st-deep)]/65 backdrop-blur-xl border border-white/15 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.7)] float`} style={{ animationDelay: `${i * 0.8}s` }}>
                  <span className="block text-[10.5px] uppercase tracking-[0.16em] font-bold text-[var(--st-accent-light)]">{label}</span>
                  <span className="block text-[17px] font-bold tracking-[-0.02em] leading-tight mt-0.5">{value}</span>
                </span>
              ))}
            </Reveal>
            <Reveal delay={200} className="mt-8 flex flex-col items-center gap-5">
              <p className="flex items-baseline gap-4">
                <span className={`${T.display} text-[44px] leading-none text-white`}>{inr(spotlight.price)}</span>
                {spotlight.mrp && <s className="text-[17px] text-[#6F7E92]">{inr(spotlight.mrp)}</s>}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button href={`#/product/${spotlight.id}`} variant="accent">Discover <Icon name="arrow" size={16} /></Button>
                <Button href="#/deals" variant="ghost">All offers</Button>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      <div className={T.shell}>
        {/* New Arrivals */}
        {newArrivals.length > 0 && (
          <section className="pt-12 sm:pt-16">
            <Reveal><SectionHeading eyebrow="Just arrived" title={<>New <em>arrivals</em></>} action={{ label: 'Browse the shop', href: shopHref({ sort: 'newest' }) }} /></Reveal>
            <Reveal delay={100}><Carousel products={newArrivals} colorHex={colorHex} categoryOf={categoryOf} /></Reveal>
          </section>
        )}

        {deal && <DealOfTheDay product={deal} />}

        {/* Product videos (Admin → Videos) */}
        {videos.length > 0 && (
          <section className="pt-12 sm:pt-16">
            <VideoShelf videos={videos.slice(0, 6)} heading={<Reveal><SectionHeading eyebrow="Watch before you buy" title={<>See it <em>in action</em></>} text="Unboxings, sound tests and close-ups of the pieces we stock." /></Reveal>} />
          </section>
        )}

        {/* Editorial */}
        {editorial.length === 2 && (
          <section className="pt-12 sm:pt-16 grid md:grid-cols-2 gap-4">
            {editorial.map((category, i) => (
              <Reveal key={category!.id} from={i === 0 ? 'left' : 'right'} delay={i * 120}>
                <a href={shopHref({ cat: category!.slug })} className="on-dark group relative block min-h-[480px] sm:min-h-[620px] overflow-hidden rounded-[28px] bg-[var(--st-ink-2)] text-white">
                  <Photo src={category!.image} alt="" width={1100} className="absolute inset-0 h-full w-full object-cover saturate-[0.9] transition-transform duration-[1600ms] ease-out group-hover:scale-[1.05]" />
                  <span className="absolute inset-0 bg-gradient-to-t from-[var(--st-deep)]/95 via-[var(--st-deep)]/20 to-transparent" />
                  <span className="absolute left-8 right-8 bottom-9 sm:left-12 sm:bottom-12">
                    <span className="block text-[12px] uppercase tracking-[0.18em] font-bold text-[var(--st-accent-light)] mb-4">{i === 0 ? 'Capture' : 'Play'}</span>
                    <span className={`block ${T.display} text-[38px] sm:text-[52px] leading-[1] max-w-md`}>{i === 0 ? <>See the world <em>differently.</em></> : <>Your next favourite <em>game night.</em></>}</span>
                    <span className="mt-8 inline-flex"><TextLink light>Explore {category!.name}</TextLink></span>
                  </span>
                </a>
              </Reveal>
            ))}
          </section>
        )}

        {/* How it works */}
        <section className="mt-12 sm:mt-16 on-dark relative overflow-hidden rounded-[32px] bg-[var(--st-deep)] text-white px-6 py-12 sm:px-12 sm:py-16">
          {/* Same deep navy and blue glow as the footer */}
          <span aria-hidden="true" className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[400px] rounded-full bg-[var(--st-accent)]/25 blur-[120px]" />
          <span aria-hidden="true" className="pointer-events-none absolute -bottom-32 -right-24 w-[420px] h-[320px] rounded-full bg-[#9AA7B8]/10 blur-[100px]" />
          <Reveal className="relative text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <p className="text-[12px] uppercase tracking-[0.2em] font-bold text-[var(--st-accent-light)] mb-4">How it works</p>
            <h2 className={`${T.display} text-[38px] sm:text-[54px] leading-[1.02]`}>From click to <em>doorstep</em></h2>
          </Reveal>
          <div className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-6">
            <span aria-hidden="true" className="hidden lg:block absolute top-[44px] left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-[var(--st-accent-2)]/60 to-transparent" />
            {STEPS_HOW.map(([icon, title, text], i) => (
              <Reveal key={title} from="up" delay={i * 130} className="relative text-center px-4">
                <span className="relative mx-auto w-[88px] h-[88px] rounded-full bg-white/[0.08] border border-white/15 backdrop-blur-md shadow-[0_20px_40px_-20px_rgba(47,107,255,0.6)] flex items-center justify-center text-[var(--st-accent-light)]">
                  <Icon name={icon} size={28} stroke={1.6} />
                  <span className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-[var(--st-accent)] text-white text-[12px] font-extrabold flex items-center justify-center shadow-[0_6px_16px_-4px_rgba(47,107,255,0.9)]">{i + 1}</span>
                </span>
                <h3 className="mt-5 text-[18px] font-bold tracking-[-0.02em] text-white">{title}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-white/65 max-w-[250px] mx-auto">{text}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Reviews */}
        <section className="pt-12 sm:pt-16">
          <Reveal><SectionHeading center eyebrow="Kind words" title={<>Loved by <em>our customers</em></>} text={`${avgRating.toFixed(1)} out of 5 across ${reviewCount.toLocaleString('en-IN')} reviews.`} /></Reveal>
          <div className="grid md:grid-cols-3 gap-4 sm:gap-5">
            {REVIEWS.map((review, i) => {
              const product = productById(review.productId);
              return (
                <Reveal key={review.name} from={i === 0 ? 'left' : i === 2 ? 'right' : 'up'} delay={i * 120}>
                  <figure className="h-full flex flex-col justify-between p-6 sm:p-8 rounded-[28px] bg-white border border-[#E3E8EF] shadow-[0_30px_60px_-45px_rgba(14,26,43,0.45)] hover:-translate-y-1 transition-transform duration-500">
                    <div>
                      <p aria-label="5 out of 5 stars" className="text-[#F5B000] tracking-[0.2em] text-[15px]">★★★★★</p>
                      <blockquote className="mt-6 text-[18px] sm:text-[20px] font-medium leading-[1.55] tracking-[-0.015em] text-[var(--st-ink)]">“{review.text}”</blockquote>
                    </div>
                    <figcaption className="mt-6 pt-5 border-t border-[#E3E8EF] flex items-center gap-4">
                      {product && <Photo src={product.image} alt="" width={120} className="w-12 h-12 rounded-full object-cover" />}
                      <span>
                        <span className="block text-[14px]">{review.name} <span className="text-[#8A97A8]">· {review.city}</span></span>
                        {product && <a href={`#/product/${product.id}`} className="block text-[12.5px] text-[#6F7E92] hover:text-[var(--st-accent)]">Bought {product.name}</a>}
                      </span>
                    </figcaption>
                  </figure>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* Instagram */}
        {posts.length > 0 && (
          <section className="pt-12 sm:pt-16">
            <Reveal className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-6">
              <div>
                <p className={`${T.eyebrow} mb-4`}>@demowebsite</p>
                <h2 className={`${T.display} text-[38px] sm:text-[54px] leading-[1.02]`}>Seen on <em>Instagram</em></h2>
              </div>
              <Button href={posts[0].postUrl} variant="outline"><Icon name="instagram" size={16} /> Follow us</Button>
            </Reveal>
            <Reveal delay={100} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {posts.slice(0, 6).map((post, i) => (
                <a key={post.id} href={post.postUrl} target="_blank" rel="noopener noreferrer" className={`group relative overflow-hidden rounded-[22px] bg-[#EDF1F6] ${i % 2 ? 'lg:translate-y-8' : ''} aspect-square`} aria-label={post.caption || 'Instagram post'}>
                  <Photo src={post.imageUrl} alt="" width={500} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.08]" />
                  <span className="absolute inset-0 bg-[var(--st-deep)]/75 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 p-4 text-center text-white">
                    <Icon name="instagram" size={22} />
                    <span className="hidden sm:block text-[12px] leading-snug line-clamp-3">{post.caption}</span>
                  </span>
                </a>
              ))}
            </Reveal>
          </section>
        )}

        {/* Newsletter */}
        <Reveal className="mt-12 sm:mt-16">
          <section className="on-dark relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[var(--st-ink)] via-[var(--st-ink-2)] to-[var(--st-deep)] text-white px-6 py-12 sm:py-14 text-center">
            <span aria-hidden="true" className="pointer-events-none absolute -top-24 right-0 w-[520px] h-[420px] rounded-full bg-[var(--st-accent)]/30 blur-[110px]" />
            <span aria-hidden="true" className="pointer-events-none absolute -bottom-32 left-0 w-[420px] h-[320px] rounded-full bg-[#9AA7B8]/20 blur-[100px]" />
            <p className="relative text-[12px] uppercase tracking-[0.2em] font-bold text-[var(--st-accent-light)] mb-6">The newsletter</p>
            <h2 className={`relative ${T.display} text-[38px] sm:text-[58px] leading-[1.02] max-w-3xl mx-auto`}>New arrivals and private offers, <em>once a week.</em></h2>
            {joined ? (
              <p role="status" className="relative mt-10 inline-flex items-center gap-2 text-[15px] font-semibold text-[#7DE0B5]"><Icon name="check" size={18} /> Thank you — you&apos;re on the list.</p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setJoined(true);
                }}
                className="relative mt-11 max-w-lg mx-auto flex flex-col sm:flex-row gap-3 p-2 sm:bg-white/10 sm:backdrop-blur-md sm:rounded-full sm:border sm:border-white/15"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  aria-label="Email address"
                  className="flex-1 min-w-0 h-12 px-5 bg-white/10 sm:bg-transparent rounded-full border border-white/15 sm:border-0 text-[15px] text-white placeholder:text-white/50 outline-none"
                />
                <Button type="submit" variant="accent">Subscribe</Button>
              </form>
            )}
          </section>
        </Reveal>
      </div>
    </>
  );
}

// =============================================================================
// Shop Page
// =============================================================================

const PRICE_BANDS: Record<string, { label: string; min: number; max: number }> = {
  under5k: { label: 'Under ₹5,000', min: 0, max: 4999 },
  '5to15k': { label: '₹5,000 – ₹15,000', min: 5000, max: 15000 },
  '15to50k': { label: '₹15,000 – ₹50,000', min: 15001, max: 50000 },
  over50k: { label: 'Over ₹50,000', min: 50001, max: Infinity },
};

const SORTS: Record<string, { label: string; compare: (a: Product, b: Product) => number }> = {
  featured: { label: 'Featured', compare: (a, b) => Number(b.isFeatured) - Number(a.isFeatured) },
  newest: { label: 'Newest', compare: (a, b) => Number(b.isNewArrival) - Number(a.isNewArrival) },
  'price-low': { label: 'Price: low to high', compare: (a, b) => a.price - b.price },
  'price-high': { label: 'Price: high to low', compare: (a, b) => b.price - a.price },
  rating: { label: 'Top rated', compare: (a, b) => b.rating - a.rating },
  discount: { label: 'Biggest saving', compare: (a, b) => percentOff(b) - percentOff(a) },
};

export function ShopPage({ params }: { params: URLSearchParams }) {
  const { products, categories, colorHex, categoryOf, categoryBySlug } = useCatalog();
  const subCategories = useStore(subCategoriesStore);
  const subSubCategories = useStore(subSubCategoriesStore);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const category = categoryBySlug(params.get('cat') ?? '');
  const sub = params.get('sub') ?? '';
  const style = params.get('style') ?? '';
  const query = (params.get('q') ?? '').trim().toLowerCase();
  const band = PRICE_BANDS[params.get('price') ?? ''];
  const color = params.get('color') ?? '';
  const size = params.get('size') ?? '';
  const sortKey = SORTS[params.get('sort') ?? ''] ? params.get('sort')! : 'featured';
  const inStockOnly = params.get('stock') === '1';
  const shopHeroImage = category?.image ?? categories.find((item) => item.image)?.image ?? products.find((item) => item.isFeatured)?.image;

  const update = (changes: Record<string, string>) => navigate(shopHref({ ...Object.fromEntries(params), ...changes }), { replace: true });

  const inCategory = products.filter((p) => !category || p.category === category.name);
  const results = inCategory
    .filter((p) => {
      if (sub && p.subCategory !== sub) return false;
      if (style && p.subSubCategory !== style) return false;
      if (band && (p.price < band.min || p.price > band.max)) return false;
      if (color && !(p.colors.includes(color) && colorTotal(p.variantStock, color) >= (inStockOnly ? 1 : 0))) return false;
      if (size && !(p.sizes.includes(size) && sizeTotal(p.variantStock, size) >= (inStockOnly ? 1 : 0))) return false;
      if (inStockOnly && p.stock <= 0) return false;
      if (query) {
        const text = `${p.name} ${p.description} ${p.category} ${p.subCategory} ${p.subSubCategory ?? ''} ${p.tags.join(' ')} ${p.colors.join(' ')} ${p.highlights.join(' ')}`.toLowerCase();
        if (!query.split(/\s+/).every((word) => text.includes(word))) return false;
      }
      return true;
    })
    .sort(SORTS[sortKey].compare);

  const colorsHere = [...new Set(inCategory.flatMap((p) => p.colors))];
  const sizesHere = [...new Set(inCategory.flatMap((p) => p.sizes))];
  const subsHere = category ? subCategories.filter((sc) => sc.status === 'Active' && sc.parentCategory === category.name && inCategory.some((p) => p.subCategory === sc.name)) : [];
  // Third-level categories (Admin → Sub-sub categories) narrow a chosen type further.
  const stylesHere = sub ? subSubCategories.filter((ssc) => ssc.status === 'Active' && ssc.parentSubCategory === sub && inCategory.some((p) => p.subCategory === sub && p.subSubCategory === ssc.name)) : [];
  const hasFilters = Boolean(category || sub || style || query || band || color || size || inStockOnly);

  const filterHeading = 'text-[13px] font-bold text-[var(--st-ink)] mb-4';
  const option = (active: boolean) => `flex w-full items-center justify-between py-1.5 text-[14px] text-left transition-colors ${active ? 'text-[var(--st-ink)] font-medium' : 'text-[#5B6B80] hover:text-[var(--st-ink)]'}`;

  const filters = (
    <div className="space-y-10">
      <div>
        <p className={filterHeading}>Category</p>
        <button onClick={() => update({ cat: '', sub: '', style: '', color: '', size: '' })} aria-pressed={!category} className={option(!category)}>
          <span>All pieces</span><span className="text-[12px] text-[#8A97A8]">{products.length}</span>
        </button>
        {categories.map((c) => (
          <button key={c.id} onClick={() => update({ cat: c.slug, sub: '', style: '', color: '', size: '' })} aria-pressed={category?.id === c.id} className={option(category?.id === c.id)}>
            <span className="flex items-center gap-2">{category?.id === c.id && <span className="w-1 h-1 rounded-full bg-[var(--st-accent)]" />}{c.name}</span>
            <span className="text-[12px] text-[#8A97A8]">{products.filter((p) => p.category === c.name).length}</span>
          </button>
        ))}
      </div>
      {subsHere.length > 1 && (
        <div>
          <p className={filterHeading}>Type</p>
          <div className="flex flex-wrap gap-2">
            {subsHere.map((sc) => (
              <button key={sc.id} onClick={() => update({ sub: sub === sc.name ? '' : sc.name, style: '' })} aria-pressed={sub === sc.name} className={`px-4 h-9 rounded-full border text-[12.5px] transition-colors ${sub === sc.name ? 'border-[var(--st-ink)] bg-[var(--st-ink)] text-[var(--st-page)]' : 'border-[#CFD8E3] hover:border-[var(--st-ink)]'}`}>
                {sc.name}
              </button>
            ))}
          </div>
        </div>
      )}
      {stylesHere.length > 0 && (
        <div>
          <p className={filterHeading}>Style</p>
          <div className="flex flex-wrap gap-2">
            {stylesHere.map((ssc) => (
              <button key={ssc.id} onClick={() => update({ style: style === ssc.name ? '' : ssc.name })} aria-pressed={style === ssc.name} className={`px-4 h-9 rounded-full border text-[12.5px] transition-colors ${style === ssc.name ? 'border-[var(--st-ink)] bg-[var(--st-ink)] text-[var(--st-page)]' : 'border-[#CFD8E3] hover:border-[var(--st-ink)]'}`}>
                {ssc.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <p className={filterHeading}>Price</p>
        {Object.entries(PRICE_BANDS).map(([key, value]) => (
          <button key={key} onClick={() => update({ price: params.get('price') === key ? '' : key })} aria-pressed={params.get('price') === key} className={option(params.get('price') === key)}>
            <span>{value.label}</span>
            {params.get('price') === key && <Icon name="check" size={15} />}
          </button>
        ))}
      </div>
      {colorsHere.length > 0 && (
        <div>
          <p className={filterHeading}>Colour</p>
          <div className="flex flex-wrap gap-3">
            {colorsHere.map((c) => (
              <button key={c} onClick={() => update({ color: color === c ? '' : c })} aria-pressed={color === c} title={c} aria-label={c} className={`w-8 h-8 rounded-full ring-1 ring-offset-[3px] ring-offset-[var(--st-page)] transition-all ${color === c ? 'ring-[var(--st-ink)] ring-2' : 'ring-black/15 hover:ring-[var(--st-ink)]'}`} style={{ backgroundColor: colorHex[c] ?? '#C9D2DD' }} />
            ))}
          </div>
        </div>
      )}
      {sizesHere.length > 0 && (
        <div>
          <p className={filterHeading}>Size</p>
          <div className="flex flex-wrap gap-2">
            {sizesHere.map((s) => (
              <button key={s} onClick={() => update({ size: size === s ? '' : s })} aria-pressed={size === s} className={`px-4 h-9 rounded-full border text-[12.5px] transition-colors ${size === s ? 'border-[var(--st-ink)] bg-[var(--st-ink)] text-[var(--st-page)]' : 'border-[#CFD8E3] hover:border-[var(--st-ink)]'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
      <label className="flex items-center justify-between gap-3 cursor-pointer text-[14px]">
        <span>In stock only</span>
        <input type="checkbox" checked={inStockOnly} onChange={(e) => update({ stock: e.target.checked ? '1' : '' })} className="accent-[var(--st-ink)] w-4 h-4" />
      </label>
      {hasFilters && (
        <button onClick={() => navigate(shopHref(), { replace: true })} className="text-[14px] font-semibold text-[var(--st-accent)] hover:underline">
          Clear all
        </button>
      )}
    </div>
  );

  return (
    <div className={T.shell}>
      <PageTitle
        image={shopHeroImage}
        eyebrow={category ? `${inCategory.length} pieces` : query ? 'Search' : 'The collection'}
        title={query ? <>Results for <em>“{params.get('q')}”</em></> : category ? category.name : <>Everything, <em>considered</em></>}
        text={category?.blurb ?? 'Every piece in one place. Filter by what matters and sort how you like.'}
      />

      <div className="grid lg:grid-cols-[230px_1fr] gap-10 lg:gap-16">
        <aside className="hidden lg:block sticky top-32 self-start max-h-[calc(100vh-9rem)] overflow-y-auto pr-2 [scrollbar-width:thin]" aria-label="Filters">{filters}</aside>

        <div>
          <div className="flex items-center justify-between gap-4 pb-6 mb-8 border-b border-[#E3E8EF]">
            <button onClick={() => setFiltersOpen(true)} className="lg:hidden inline-flex items-center gap-2 px-4 h-10 rounded-full border border-[#E3E8EF] bg-white text-[14px] font-semibold">
              <Icon name="filter" size={17} /> Filters{hasFilters ? ' ·' : ''}
            </button>
            <p aria-live="polite" className="hidden lg:block text-[13px] text-[#6F7E92] tabular-nums">{results.length} {results.length === 1 ? 'piece' : 'pieces'}</p>
            <label className="flex items-center gap-3 text-[13px] text-[#6F7E92]">
              <span className="hidden sm:inline">Sort by</span>
              <select aria-label="Sort by" value={sortKey} onChange={(e) => update({ sort: e.target.value === 'featured' ? '' : e.target.value })} className="bg-transparent text-[var(--st-ink)] text-[13.5px] outline-none cursor-pointer border-b border-[#CFD8E3] py-1 pr-1">
                {Object.entries(SORTS).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
              </select>
            </label>
          </div>

          {results.length > 0 ? (
            <ProductGrid key={`${category?.id ?? 'all'}-${sortKey}`} products={results} colorHex={colorHex} categoryOf={categoryOf} columns={3} />
          ) : (
            <div className="text-center py-12">
              <h2 className={`${T.display} text-[30px] mb-3`}>Nothing matches that</h2>
              <p className="text-[15px] text-[#5B6B80] mb-8">{query ? `We couldn't find “${params.get('q')}” with these filters.` : 'Try removing a filter to see more.'}</p>
              {hasFilters && <Button onClick={() => navigate(shopHref(), { replace: true })}>Clear all filters</Button>}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {filtersOpen && (
        <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Filters">
          <button className="absolute inset-0 bg-black/40" aria-label="Close filters" onClick={() => setFiltersOpen(false)} />
          <div className="drawer absolute left-0 top-0 bottom-0 w-[86%] max-w-sm bg-[var(--st-page)] p-7 overflow-y-auto">
            <div className="flex items-center justify-between mb-10">
              <p className={`${T.display} text-[26px]`}>Filters</p>
              <button onClick={() => setFiltersOpen(false)} aria-label="Close filters" className="w-10 h-10 flex items-center justify-center"><Icon name="close" /></button>
            </div>
            {filters}
            <Button onClick={() => setFiltersOpen(false)} className="w-full mt-10">Show {results.length} pieces</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Product Page
// =============================================================================

export function ProductPage({ product }: { product: Product }) {
  const { products, colorHex, categoryOf } = useCatalog();
  const sizeOptions = useStore(sizeOptionsStore);
  const productVideos = useStore(videosStore).filter((v) => v.productName === product.name);
  const bag = useStore(bagStore);
  const wishlist = useStore(wishlistStore);
  const start = firstAvailable(product);
  const [color, setColor] = useState(start.color);
  const [size, setSize] = useState(start.size);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [qty, setQty] = useState(1);

  const category = categoryOf(product);
  const photos = productPhotos(product, color);
  const shownPhoto = photos[Math.min(photoIndex, photos.length - 1)];
  const variantStock = stockForVariant(product, size, color);
  const inBag = bag.find((line) => line.id === product.id && line.size === size && line.color === color)?.qty ?? 0;
  const available = variantStock - inBag;
  const chosenQty = Math.max(1, Math.min(qty, available));
  const saved = wishlist.includes(product.id);
  const sizeName = (code: string) => sizeOptions.find((s) => s.code === code)?.name ?? code;
  const related = [
    ...products.filter((p) => p.category === product.category && p.id !== product.id),
    ...products.filter((p) => p.category !== product.category && p.stock > 0),
  ].slice(0, 4);

  const chooseColor = (next: string) => {
    setColor(next);
    setPhotoIndex(0);
    setQty(1);
  };

  const accordion = (title: string, children: React.ReactNode, open = false) => (
    <details open={open} className="group border-b border-[#E3E8EF]">
      <summary className="flex items-center justify-between gap-4 py-5 cursor-pointer list-none text-[15px] font-bold tracking-[-0.01em] [&::-webkit-details-marker]:hidden">
        {title}
        <span className="transition-transform duration-300 group-open:rotate-45"><Icon name="plus" size={16} /></span>
      </summary>
      <div className="pb-6">{children}</div>
    </details>
  );

  return (
    <div className={T.shell}>
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-[11.5px] uppercase tracking-[0.18em] text-[#6F7E92] pt-4 pb-5">
        <a href="#/shop" className="hover:text-[var(--st-ink)]">Shop</a>
        <span aria-hidden="true">/</span>
        {category && <><a href={shopHref({ cat: category.slug })} className="hover:text-[var(--st-ink)]">{category.name}</a><span aria-hidden="true">/</span></>}
        <span className="text-[var(--st-ink)] normal-case tracking-normal text-[13px]">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-12 items-start">
        {/* Gallery */}
        <div className="lg:sticky lg:top-28 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
          {photos.length > 1 && (
            <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-visible">
              {photos.map((src, i) => (
                <button key={`${src}-${i}`} onClick={() => setPhotoIndex(i)} aria-label={`Show photo ${i + 1}`} aria-pressed={i === photoIndex} className={`shrink-0 w-16 sm:w-20 aspect-[4/5] rounded-[14px] overflow-hidden bg-[#EDF1F6] transition-opacity ${i === photoIndex ? 'ring-1 ring-[var(--st-ink)] ring-offset-2 ring-offset-[var(--st-page)]' : 'opacity-60 hover:opacity-100'}`}>
                  <Photo src={src} alt="" width={200} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <div className="relative flex-1 aspect-[4/5] overflow-hidden rounded-[28px] bg-[#EDF1F6] ring-1 ring-black/[0.04]">
            <Photo key={shownPhoto} src={shownPhoto} alt={`${product.name}${color !== STANDARD ? ` in ${color}` : ''}`} width={1400} eager className={`fade h-full w-full object-cover ${product.stock <= 0 ? 'opacity-60 grayscale' : ''}`} />
            {product.isNewArrival && product.stock > 0 && <span className="absolute top-5 left-5 px-3.5 py-1.5 rounded-full bg-[#FFFFFF]/90 backdrop-blur-md text-[10.5px] uppercase tracking-[0.2em]">New arrival</span>}
          </div>
        </div>

        {/* Details */}
        <div className="lg:pt-4">
          <p className={`${T.eyebrow} mb-4`}>{product.subCategory || category?.name}</p>
          <h1 className={`${T.display} text-[36px] sm:text-[48px] leading-[1.05]`}>{product.name}</h1>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
            <Stars rating={product.rating} reviews={product.reviews} />
            <span className="text-[12px] text-[#8A97A8] font-mono">{product.sku}</span>
          </div>
          <div className="mt-7"><Price product={product} large /></div>
          <p className="mt-1.5 text-[12.5px] text-[#6F7E92]">Inclusive of all taxes</p>
          {product.description && <p className="mt-7 text-[16px] leading-[1.7] text-[#3A4A5F]">{product.description}</p>}

          {/* Colour */}
          {product.colors.length > 0 && (
            <fieldset className="mt-9">
              <legend className="text-[14px] font-bold mb-4">Colour <span className="font-medium text-[#5B6B80]">· {color}</span></legend>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((c) => {
                  const soldOut = colorTotal(product.variantStock, c) <= 0;
                  return (
                    <button
                      key={c}
                      onClick={() => chooseColor(c)}
                      aria-pressed={color === c}
                      aria-label={`${c}${soldOut ? ', sold out' : ''}`}
                      title={`${c}${soldOut ? ' — sold out' : ''}`}
                      className={`relative w-10 h-10 rounded-full ring-offset-[3px] ring-offset-[var(--st-page)] transition-all ${color === c ? 'ring-2 ring-[var(--st-ink)]' : 'ring-1 ring-black/15 hover:ring-[var(--st-ink)]'}`}
                      style={{ backgroundColor: colorHex[c] ?? '#C9D2DD' }}
                    >
                      {soldOut && <span className="absolute inset-0 flex items-center justify-center"><span className="block w-[130%] h-px bg-[var(--st-ink)]/70 rotate-45" /></span>}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {/* Size */}
          {product.sizes.length > 0 && (
            <fieldset className="mt-8">
              <legend className="text-[14px] font-bold mb-4">Size <span className="font-medium text-[#5B6B80]">· {sizeName(size)}</span></legend>
              <div className="flex flex-wrap gap-2.5">
                {product.sizes.map((s) => {
                  const left = stockForVariant(product, s, color);
                  return (
                    <button
                      key={s}
                      onClick={() => { setSize(s); setQty(1); }}
                      aria-pressed={size === s}
                      title={sizeName(s)}
                      className={`min-w-[68px] h-11 px-5 rounded-full border text-[14px] font-semibold transition-colors ${size === s ? 'border-[var(--st-ink)] bg-[var(--st-ink)] text-white' : left > 0 ? 'border-[#CFD8E3] hover:border-[var(--st-ink)]' : 'border-[#E3E8EF] text-[#A9B4C2] line-through'}`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          <p className={`mt-7 inline-flex items-center gap-2.5 text-[13.5px] ${variantStock <= 0 ? 'text-[#D23B3B]' : variantStock <= 5 ? 'text-[var(--st-accent)]' : 'text-[#0F8A5F]'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {variantStock <= 0 ? 'This option is sold out — try another colour or size' : variantStock <= 5 ? `Only ${variantStock} left in this option` : 'In stock, ready to dispatch'}
          </p>

          <div className="mt-6 flex items-center gap-3">
            {available > 0 && <QtyStepper qty={chosenQty} max={available} onChange={(next) => setQty(Math.max(1, next))} label={product.name} />}
            <Button
              disabled={available <= 0}
              onClick={() => {
                addToBag(product, size, color, chosenQty);
                setQty(1);
              }}
              variant="accent"
              className="flex-1 min-w-0"
            >
              {variantStock <= 0 ? 'Sold out' : available <= 0 ? 'All in your bag' : 'Add to bag'}
            </Button>
            <button
              onClick={() => toggleWishlist(product)}
              aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
              aria-pressed={saved}
              className={`w-[52px] h-[52px] shrink-0 rounded-full border flex items-center justify-center transition-colors ${saved ? 'border-[var(--st-accent)] text-[var(--st-accent)]' : 'border-[#CFD8E3] hover:border-[var(--st-ink)]'}`}
            >
              <Icon name="heart" filled={saved} />
            </button>
          </div>
          {inBag > 0 && (
            <p className="mt-4 text-[13.5px] text-[#5B6B80]">{inBag} in your bag. <a href="#/bag" className="text-[var(--st-ink)] border-b border-[var(--st-ink)]/40">View bag</a></p>
          )}

          <div className="mt-7 border-t border-[#E3E8EF]">
            {product.highlights.length > 0 && accordion('Why you’ll love it', (
              <ul className="space-y-3">
                {product.highlights.map((highlight) => (
                  <li key={highlight} className="flex gap-3 text-[15px] leading-snug text-[#3A4A5F]">
                    <span className="text-[var(--st-accent)] mt-0.5"><Icon name="check" size={16} /></span>
                    {highlight}
                  </li>
                ))}
              </ul>
            ), true)}
            {product.specs.length > 0 && accordion('Specifications', (
              <dl className="divide-y divide-[#E3E8EF]">
                {product.specs.map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-6 py-3 text-[14px]">
                    <dt className="text-[#6F7E92]">{label}</dt>
                    <dd className="text-right">{value}</dd>
                  </div>
                ))}
              </dl>
            ))}
            {accordion('Delivery & returns', (
              <div className="space-y-3 text-[14.5px] leading-relaxed text-[#3A4A5F]">
                <p className="flex gap-3"><Icon name="truck" size={18} stroke={1.3} /> {product.price >= FREE_DELIVERY_FROM ? 'Complimentary delivery' : `Complimentary delivery on orders over ${inr(FREE_DELIVERY_FROM)}`}, in 3–5 working days.</p>
                <p className="flex gap-3"><Icon name="refresh" size={18} stroke={1.3} /> Return unused items in their original box within 7 days.</p>
                <p className="flex gap-3"><Icon name="shield" size={18} stroke={1.3} /> One-year warranty against manufacturing defects.</p>
              </div>
            ))}
          </div>

          {/* Barcode from SKU */}
          {(product.sku || product.barcode) && (
            <div className="mt-6 pt-5 border-t border-[#E3E8EF]">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#8A97A8] mb-2 font-bold">Product Barcode</p>
              <div className="bg-white border border-[#E3E8EF] rounded-2xl px-4 py-3 inline-block shadow-2xs">
                <ProductBarcode value={product.sku || product.barcode} className="w-48 h-14" />
                <p className="text-center text-[11px] font-mono text-[#6F7E92] mt-1 tracking-widest font-bold">{product.sku || product.barcode}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {productVideos.length > 0 && (
        <section className="pt-12 sm:pt-16">
          <VideoShelf videos={productVideos} heading={<SectionHeading eyebrow="Product videos" title={<>See it <em>in action</em></>} />} />
        </section>
      )}

      {related.length > 0 && (
        <section className="pt-12 sm:pt-16">
          <SectionHeading eyebrow="Complete the set" title={<>You may <em>also like</em></>} action={category ? { label: `More ${category.name}`, href: shopHref({ cat: category.slug }) } : undefined} />
          <ProductGrid products={related} colorHex={colorHex} categoryOf={categoryOf} />
        </section>
      )}
    </div>
  );
}

// =============================================================================
// Deals and Wishlist Pages
// =============================================================================

export function DealsPage() {
  const { products, colorHex, categoryOf } = useCatalog();
  const deals = products.filter((p) => p.stock > 0 && percentOff(p) >= 15).sort((a, b) => percentOff(b) - percentOff(a));
  const offerHeroImage = deals[0]?.image ?? products.find((product) => product.isFeatured)?.image ?? products[0]?.image;
  return (
    <div className={T.shell}>
      <PageTitle image={offerHeroImage} eyebrow="Private offers" title={<>The <em>considered</em> saving</>} text="Every piece here is in stock and at least 15% below its list price — biggest savings first." />
      {deals.length ? <ProductGrid products={deals} colorHex={colorHex} categoryOf={categoryOf} /> : <EmptyState icon="tag" title="No offers today" text="Check back soon — new offers arrive every week." action={{ label: 'Browse the shop', href: '#/shop' }} />}
    </div>
  );
}

/** Adds a saved piece to the bag in the chosen size and colour, then takes it off the wishlist. */
function moveToBag(product: Product, size: string, color: string) {
  if (!addToBag(product, size, color)) return false;
  wishlistStore.set(wishlistStore.get().filter((id) => id !== product.id));
  return true;
}

function WishlistCard({ product, colorHex }: { product: Product; colorHex: Record<string, string> }) {
  const [choice, setChoice] = useState(() => firstAvailable(product));
  const sizes = variantSizes(product.sizes);
  const colors = variantColors(product.colors);
  const inStock = stockForVariant(product, choice.size, choice.color) > 0;
  const soldOut = product.stock <= 0;
  const select = 'w-full h-10 pl-3 pr-8 rounded-full border border-[#CFD8E3] bg-white text-[13px] font-semibold text-[var(--st-ink)] outline-none focus:border-[var(--st-accent)] appearance-none bg-no-repeat bg-[right_12px_center] bg-[length:12px] bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%235B6B80%27 stroke-width=%272.5%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E")]';

  return (
    <li className="group flex flex-col bg-white border border-[#E3E8EF] rounded-[24px] overflow-hidden hover:shadow-[0_24px_50px_-30px_rgba(14,26,43,0.35)] transition-shadow">
      <div className="relative">
        <a href={`#/product/${product.id}`} className="block aspect-[4/5] bg-[#EDF1F6] overflow-hidden">
          <Photo src={productPhotos(product, choice.color)[0]} alt={product.name} width={600} className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04] ${soldOut ? 'opacity-60' : ''}`} />
        </a>
        <button onClick={() => toggleWishlist(product)} aria-label={`Remove ${product.name} from wishlist`} className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 backdrop-blur text-[#5B6B80] hover:text-[#D23B3B] flex items-center justify-center shadow-sm">
          <Icon name="close" size={16} />
        </button>
        {soldOut && <span className="absolute left-3 top-3 px-3 py-1 rounded-full bg-[var(--st-ink)] text-white text-[11px] font-bold uppercase tracking-wider">Sold out</span>}
      </div>
      <div className="flex-1 flex flex-col p-5">
        <p className="text-[10.5px] uppercase tracking-[0.2em] text-[#8A97A8]">{product.category}</p>
        <a href={`#/product/${product.id}`} className="mt-1 text-[15.5px] font-bold leading-snug text-[var(--st-ink)] hover:text-[var(--st-accent)] line-clamp-2">{product.name}</a>
        <div className="mt-2"><Price product={product} /></div>
        {!soldOut && (sizes.length > 1 || colors.length > 1) && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {colors.length > 1 && (
              <label className={sizes.length > 1 ? '' : 'col-span-2'}>
                <span className="sr-only">Colour</span>
                <span className="relative block">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ring-1 ring-black/10" style={{ backgroundColor: colorHex[choice.color] }} />
                  <select value={choice.color} onChange={(e) => setChoice({ ...choice, color: e.target.value })} className={`${select} pl-8`}>
                    {colors.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </span>
              </label>
            )}
            {sizes.length > 1 && (
              <label className={colors.length > 1 ? '' : 'col-span-2'}>
                <span className="sr-only">Size</span>
                <select value={choice.size} onChange={(e) => setChoice({ ...choice, size: e.target.value })} className={select}>
                  {sizes.map((sz) => <option key={sz} value={sz}>{sz}{stockForVariant(product, sz, choice.color) > 0 ? '' : ' (sold out)'}</option>)}
                </select>
              </label>
            )}
          </div>
        )}
        <div className="mt-auto pt-4">
          <button
            onClick={() => moveToBag(product, choice.size, choice.color)}
            disabled={!inStock}
            className="w-full h-11 rounded-full bg-gradient-to-r from-[var(--st-accent)] to-[var(--st-accent-2)] text-white text-[13.5px] font-bold shadow-[0_12px_28px_-14px_rgba(47,107,255,0.8)] hover:brightness-110 transition disabled:from-[#CFD8E3] disabled:to-[#CFD8E3] disabled:shadow-none disabled:text-[#5B6B80] flex items-center justify-center gap-2"
          >
            <Icon name="bag" size={16} /> {soldOut ? 'Sold out' : inStock ? 'Move to bag' : 'Not in stock in this option'}
          </button>
        </div>
      </div>
    </li>
  );
}

export function WishlistPage() {
  const { productById, colorHex } = useCatalog();
  const wishlist = useStore(wishlistStore);
  const saved = wishlist.flatMap((id) => productById(id) ?? []);
  const movable = saved.filter((p) => p.stock > 0);
  if (!saved.length) {
    return <EmptyState icon="heart" title="Nothing saved yet" text="Tap the heart on anything you love and it will wait for you here." action={{ label: 'Discover pieces', href: '#/shop' }} />;
  }
  const moveAll = () => {
    let moved = 0;
    for (const product of movable) {
      const { size, color } = firstAvailable(product);
      if (moveToBag(product, size, color)) moved++;
    }
    if (moved) navigate('#/bag');
  };
  return (
    <div className={T.shell}>
      <PageTitle eyebrow="Saved for later" title={<>Your <em>wishlist</em></>} text={`${saved.length} ${saved.length === 1 ? 'piece' : 'pieces'} you have your eye on.`} />
      {movable.length > 1 && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 rounded-[20px] bg-[var(--st-accent-soft)] border border-[var(--st-accent-line)]">
          <p className="text-[14px] text-[#3A4A5F]"><span className="font-bold text-[var(--st-ink)]">Ready to buy?</span> Move everything that’s in stock to your bag in one go.</p>
          <button onClick={moveAll} className="h-11 px-5 rounded-full bg-[var(--st-ink)] text-white text-[13.5px] font-bold hover:bg-[var(--st-ink-3)] flex items-center gap-2"><Icon name="bag" size={16} /> Move all to bag ({movable.length})</button>
        </div>
      )}
      <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {saved.map((product) => <WishlistCard key={product.id} product={product} colorHex={colorHex} />)}
      </ul>
    </div>
  );
}
