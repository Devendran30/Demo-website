'use client';

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { bannersStore, instagramStore, percentOff, productPhotos, type Product, type ThemeLayout, useStoreDetails, } from '../demo-data';
import { T, Icon, Photo, Button, TextLink, ProductCard, useStore, useCatalog, navigate, shopHref, inr } from './store-kit';
import { bannerSlides, fallbackSlides, useMidnightCountdown, Carousel, REVIEWS } from './catalog-pages';

// Home pages for the themes in Admin → Theme Setup. Each one is laid out differently; the default
// theme keeps the original HomePage in catalog-pages.tsx.

export function ThemedHomePage({ layout }: { layout: ThemeLayout }) {
  if (layout === 'marketplace') return <MarketplaceHome />;
  if (layout === 'lifestyle') return <LifestyleHome />;
  if (layout === 'boutique') return <BoutiqueHome />;
  if (layout === 'volt') return <VoltHome />;
  if (layout === 'atelier') return <AtelierHome />;
  if (layout === 'aurora') return <AuroraHome />;
  return <AsterHome />;
}

/** The lists every home page draws from. */
function useHomeData() {
  const catalog = useCatalog();
  const { products } = catalog;
  const banners = useStore(bannersStore).filter((b) => b.isActive && b.imageUrl);
  const posts = useStore(instagramStore);
  const inStock = products.filter((p) => p.stock > 0);
  const featured = [...products.filter((p) => p.isFeatured)].sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0));
  const slides = banners.length ? bannerSlides(banners) : fallbackSlides(featured[0] ?? products[0]);
  return {
    ...catalog,
    slides,
    posts,
    inStock,
    featured: featured.length ? featured : inStock,
    bestsellers: [...inStock].sort((a, b) => b.reviews - a.reviews),
    topRated: [...inStock].sort((a, b) => b.rating - a.rating),
    newArrivals: products.filter((p) => p.isNewArrival),
    byDiscount: [...inStock].sort((a, b) => percentOff(b) - percentOff(a)),
    countIn: (name: string) => products.filter((p) => p.category === name).length,
    avgRating: products.length ? products.reduce((sum, p) => sum + p.rating, 0) / products.length : 0,
  };
}

function useSlideIndex(count: number, ms = 6000) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (count < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), ms);
    return () => clearInterval(timer);
  }, [count, ms]);
  return [count ? index % count : 0, setIndex] as const;
}

const pad = (n: number) => String(n).padStart(2, '0');

function Countdown({ className }: { className: string }) {
  const left = useMidnightCountdown();
  const parts = left === null ? ['--', '--', '--'] : [left / 3600000, (left / 60000) % 60, (left / 1000) % 60].map((n) => pad(Math.floor(n)));
  return (
    <span className="flex items-center gap-1" aria-label="Time left today">
      {parts.map((part, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className={className}>{part}</span>
          {i < 2 && <span aria-hidden="true">:</span>}
        </span>
      ))}
    </span>
  );
}

function Grid({ products, className }: { products: Product[]; className: string }) {
  const { colorHex, categoryOf } = useCatalog();
  return (
    <div className={`grid ${className}`}>
      {products.map((product) => <ProductCard key={product.id} product={product} colorHex={colorHex} category={categoryOf(product)} />)}
    </div>
  );
}

// =============================================================================
// Marketplace: category sidebar, slider, flash deal, dense grids
// =============================================================================

function MarketHeading({ title, href, icon }: { title: string; href?: string; icon?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 mb-3 sm:mb-4">
      <h2 className="flex items-center gap-2 text-[18px] sm:text-[21px] font-bold tracking-[-0.02em] text-[var(--st-ink)]">{icon && <span className="text-[var(--st-accent)]"><Icon name={icon} size={20} /></span>}{title}</h2>
      {href && <a href={href} className="shrink-0 flex items-center gap-1 text-[13.5px] font-semibold text-[var(--st-accent)] hover:underline">View all <Icon name="arrow" size={14} /></a>}
    </div>
  );
}

function MarketplaceHome() {
  const d = useHomeData();
  const [slide, setSlide] = useSlideIndex(d.slides.length, 5000);
  const current = d.slides[slide];
  const promos = [d.categories[1], d.categories[3]].filter(Boolean);
  const banners = [d.categories[4], d.categories[5]].filter(Boolean);
  const box = 'bg-white rounded-[10px] border border-[#E3E8EF]';

  return (
    <div className={`${T.shell} pt-4 sm:pt-6 pb-4 space-y-5 sm:space-y-7`}>
      {/* Categories, slider and promos */}
      <section className="grid lg:grid-cols-[250px_1fr_270px] gap-4">
        <nav aria-label="Categories" className={`${box} hidden lg:block py-2`}>
          <p className="px-4 pt-2 pb-2.5 text-[12px] font-bold uppercase tracking-[0.08em] text-[#8A97A8]">Categories</p>
          {d.categories.map((c) => (
            <a key={c.id} href={shopHref({ cat: c.slug })} className="group flex items-center gap-3 px-4 py-2 text-[14px] text-[var(--st-ink)] hover:bg-[var(--st-accent-soft)] hover:text-[var(--st-accent)]">
              <Photo src={c.image} alt="" width={80} className="w-8 h-8 rounded-[6px] object-cover" />
              <span className="flex-1 truncate">{c.name}</span>
              <span className="text-[#A9B4C2] -rotate-90 group-hover:text-[var(--st-accent)]"><Icon name="chevron" size={14} stroke={2} /></span>
            </a>
          ))}
        </nav>
        {current && (
          <div className="on-dark relative min-h-[230px] sm:min-h-[340px] lg:min-h-[400px] rounded-[10px] overflow-hidden bg-[var(--st-ink-2)] text-white">
            {d.slides.map((s, i) => (
              <Photo key={s.id} src={s.image} alt="" width={1400} eager={i === 0} className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${i === slide ? 'opacity-100' : 'opacity-0'}`} />
            ))}
            <span className="absolute inset-0 bg-gradient-to-r from-[var(--st-deep)]/85 via-[var(--st-deep)]/40 to-transparent" />
            <div key={current.id} className="fade relative h-full flex flex-col justify-center p-6 sm:p-10 max-w-md">
              <span className="self-start px-2.5 py-1 rounded-[4px] bg-[var(--st-accent)] text-[11.5px] font-bold uppercase tracking-wide">Big sale</span>
              <h1 className="mt-4 text-[28px] sm:text-[44px] font-extrabold leading-[1.05] tracking-[-0.03em]">{current.title}</h1>
              <p className="mt-3 text-[14px] sm:text-[15px] text-white/80">{current.subtitle}</p>
              <a href={current.ctaLink} className="mt-6 self-start h-11 px-6 rounded-[8px] bg-white text-[var(--st-ink)] text-[14px] font-semibold flex items-center gap-2 hover:bg-[var(--st-accent)] hover:text-white">{current.ctaText} <Icon name="arrow" size={15} /></a>
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {d.slides.map((s, i) => <button key={s.id} onClick={() => setSlide(i)} aria-label={`Slide ${i + 1}`} className={`h-2 rounded-full transition-all ${i === slide ? 'w-6 bg-white' : 'w-2 bg-white/50'}`} />)}
            </div>
          </div>
        )}
        <div className="hidden lg:grid grid-rows-2 gap-4">
          {promos.map((c, i) => (
            <a key={c.id} href={shopHref({ cat: c.slug })} className="on-dark group relative overflow-hidden rounded-[10px] bg-[var(--st-ink-2)] text-white">
              <Photo src={c.image} alt="" width={600} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <span className="absolute inset-0 bg-gradient-to-t from-[var(--st-deep)]/85 to-transparent" />
              <span className="absolute left-4 right-4 bottom-4">
                <span className="text-[12px] font-bold text-[var(--st-accent-light)]">{i ? 'New arrivals' : 'Up to 25% off'}</span>
                <span className="block text-[19px] font-bold leading-tight">{c.name}</span>
                <span className="mt-1 inline-flex items-center gap-1 text-[12.5px] text-white/80">Shop now <Icon name="arrow" size={13} /></span>
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* Promises */}
      <section className={`${box} grid grid-cols-2 lg:grid-cols-4`}>
        {[['truck', 'Free delivery', `On orders over ${inr(4999)}`], ['refresh', 'Easy returns', 'Within 7 days'], ['shield', '1-year warranty', 'On every product'], ['card', 'Secure payment', 'UPI, cards & COD']].map(([icon, title, text], i) => (
          <div key={title} className={`flex items-center gap-3 p-4 sm:p-5 ${i % 2 ? 'border-l' : ''} ${i > 1 ? 'border-t lg:border-t-0' : ''} ${i === 2 ? 'lg:border-l' : ''} border-[#E3E8EF]`}>
            <span className="shrink-0 w-11 h-11 rounded-full bg-[var(--st-accent-soft)] text-[var(--st-accent)] flex items-center justify-center"><Icon name={icon} size={20} /></span>
            <span className="min-w-0"><span className="block text-[14px] font-semibold text-[var(--st-ink)]">{title}</span><span className="block text-[12.5px] leading-snug text-[#6F7E92]">{text}</span></span>
          </div>
        ))}
      </section>

      {/* Flash deal */}
      {d.byDiscount.length > 0 && (
        <section className={`${box} overflow-hidden`}>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 sm:px-5 py-3.5 bg-gradient-to-r from-[var(--st-accent)] to-[var(--st-accent-2)] text-white">
            <h2 className="flex items-center gap-2 text-[19px] sm:text-[21px] font-extrabold tracking-[-0.02em]"><Icon name="bolt" size={20} /> Flash Deal</h2>
            <span className="flex items-center gap-2 text-[13px] font-medium">Ends in <Countdown className="min-w-[30px] px-1.5 py-1 rounded-[4px] bg-white text-[var(--st-accent)] text-[14px] font-bold text-center tabular-nums" /></span>
            <a href="#/deals" className="ml-auto text-[13.5px] font-semibold hover:underline">View all ›</a>
          </div>
          <Grid products={d.byDiscount.slice(0, 6)} className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-3 sm:p-4" />
        </section>
      )}

      {/* Top categories */}
      <section className={`${box} p-4 sm:p-6`}>
        <MarketHeading title="Top categories" href="#/shop" />
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-x-3 gap-y-5 sm:gap-6">
          {d.categories.map((c) => (
            <a key={c.id} href={shopHref({ cat: c.slug })} className="group flex flex-col items-center gap-2 text-center">
              <span className="w-16 h-16 sm:w-24 sm:h-24 rounded-full overflow-hidden ring-1 ring-[#E3E8EF] group-hover:ring-2 group-hover:ring-[var(--st-accent)] transition-all">
                <Photo src={c.image} alt="" width={200} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
              </span>
              <span className="text-[12px] sm:text-[13.5px] font-medium leading-tight text-[var(--st-ink)] group-hover:text-[var(--st-accent)]">{c.name}</span>
            </a>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section>
        <MarketHeading title="Featured products" icon="spark" href="#/shop" />
        <Grid products={d.featured.slice(0, 10)} className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3" />
      </section>

      {/* Banners */}
      {banners.length === 2 && (
        <section className="grid sm:grid-cols-2 gap-4">
          {banners.map((c, i) => (
            <a key={c.id} href={shopHref({ cat: c.slug })} className="on-dark group relative h-[170px] sm:h-[210px] overflow-hidden rounded-[10px] bg-[var(--st-ink-2)] text-white">
              <Photo src={c.image} alt="" width={900} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <span className="absolute inset-0 bg-gradient-to-r from-[var(--st-deep)]/90 via-[var(--st-deep)]/40 to-transparent" />
              <span className="absolute left-6 top-1/2 -translate-y-1/2 max-w-[60%]">
                <span className="text-[12px] font-bold uppercase tracking-wide text-[var(--st-accent-light)]">{i ? 'Weekend special' : 'Limited offer'}</span>
                <span className="block mt-1 text-[24px] sm:text-[28px] font-extrabold leading-tight">{c.name}</span>
                <span className="mt-3 inline-flex h-9 px-4 rounded-[6px] bg-[var(--st-accent)] text-[13px] font-semibold items-center">Shop now</span>
              </span>
            </a>
          ))}
        </section>
      )}

      {/* Three lists */}
      <section className="grid md:grid-cols-3 gap-4">
        {([['Best sellers', d.bestsellers, shopHref({ sort: 'featured' })], ['Top rated', d.topRated, shopHref({ sort: 'rating' })], ['New arrivals', d.newArrivals, shopHref({ sort: 'newest' })]] as const).map(([title, list, href]) => (
          <div key={title} className={`${box} p-4 sm:p-5`}>
            <MarketHeading title={title} href={href} />
            <ul className="space-y-3">
              {list.slice(0, 4).map((p) => (
                <li key={p.id}>
                  <a href={`#/product/${p.id}`} className="group flex items-center gap-3">
                    <Photo src={productPhotos(p)[0]} alt="" width={160} className="w-16 h-16 shrink-0 rounded-[6px] object-cover border border-[#EDF1F6]" />
                    <span className="min-w-0">
                      <span className="block text-[13.5px] leading-snug text-[var(--st-ink)] line-clamp-2 group-hover:text-[var(--st-accent)]">{p.name}</span>
                      <span className="block mt-0.5 text-[12px] text-[#6F7E92]"><span className="text-[#F5B000]">★</span> {p.rating.toFixed(1)}</span>
                      <span className="block text-[14px] font-bold text-[var(--st-accent)]">{inr(p.price)}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* More */}
      <section>
        <MarketHeading title="Just for you" href="#/shop" />
        <Grid products={d.bestsellers.slice(0, 10)} className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3" />
      </section>
    </div>
  );
}

// =============================================================================
// Lifestyle: colour-block collage hero, search card, rounded tiles, pastel promos
// =============================================================================

function LifeHeading({ eyebrow, title, action }: { eyebrow: string; title: ReactNode; action?: { label: string; href: string } }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6 sm:mb-8">
      <div>
        <p className="text-[13px] font-semibold text-[var(--st-accent)] mb-1.5">{eyebrow}</p>
        <h2 className="font-display text-[28px] sm:text-[40px] leading-[1.08]">{title}</h2>
      </div>
      {action && <a href={action.href} className="shrink-0 h-10 px-4 rounded-full bg-white shadow-[0_6px_18px_-10px_rgba(34,26,61,0.5)] text-[13.5px] font-semibold flex items-center gap-1.5 hover:text-[var(--st-accent)]">{action.label} <Icon name="arrow" size={14} /></a>}
    </div>
  );
}

function LifestyleHome() {
  const storeInfo = useStoreDetails();
  const d = useHomeData();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('');
  const [tab, setTab] = useState<'featured' | 'bestsellers' | 'new'>('featured');
  const tabs = { featured: ['Featured', d.featured], bestsellers: ['Bestsellers', d.bestsellers], new: ['New in', d.newArrivals.length ? d.newArrivals : d.inStock] } as const;
  const collage = [d.categories[0], d.categories[1], d.categories[4]].filter(Boolean);
  const promos = d.byDiscount.slice(0, 3);
  const pastels = ['bg-[var(--st-accent-soft)]', 'bg-[#FFF1DC]', 'bg-[#E3F6EE]'];
  const search = (e: FormEvent) => {
    e.preventDefault();
    navigate(shopHref({ q: query.trim(), cat }));
  };

  return (
    <>
      <section className="on-dark relative overflow-hidden bg-gradient-to-br from-[var(--st-accent)] via-[var(--st-accent)] to-[var(--st-accent-2)] text-white">
        <span aria-hidden="true" className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white/10" />
        <span aria-hidden="true" className="absolute bottom-10 right-[45%] w-40 h-40 rounded-full bg-white/10" />
        <div className={`${T.shell} relative grid lg:grid-cols-2 gap-10 items-center pt-10 pb-24 sm:pt-16 sm:pb-32`}>
          <div>
            <span className="rise inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 text-[13px] font-semibold"><Icon name="spark" size={15} /> New season drop</span>
            <h1 className="rise rise-1 font-display mt-5 text-[42px] sm:text-[66px] leading-[1.02]">Shop smart,<br />live <span className="text-[#FFE27A]">bright.</span></h1>
            <p className="rise rise-2 mt-5 text-[16px] sm:text-[17px] text-white/85 max-w-md">{storeInfo.tagline}. Gadgets that make every day a little more fun.</p>
            <div className="rise rise-3 mt-8 flex flex-wrap gap-3">
              <Button href="#/shop" variant="light">Start shopping <Icon name="arrow" size={16} /></Button>
              <Button href="#/deals" variant="ghost">See offers</Button>
            </div>
            <div className="mt-8 flex items-center gap-3 text-[13px] text-white/85">
              <span className="flex -space-x-3">{d.featured.slice(0, 3).map((p) => <Photo key={p.id} src={p.image} alt="" width={80} className="w-9 h-9 rounded-full object-cover ring-2 ring-white" />)}</span>
              <span><span className="font-bold text-white">★ {d.avgRating.toFixed(1)}</span> from happy shoppers across India</span>
            </div>
          </div>
          <div className="relative hidden sm:block h-[400px] lg:h-[440px]">
            {collage.map((c, i) => (
              <a key={c.id} href={shopHref({ cat: c.slug })} className={`absolute overflow-hidden rounded-[32px] border-4 border-white/80 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.5)] transition-transform duration-500 hover:rotate-0 hover:scale-[1.03] ${['left-0 top-8 w-[48%] h-[78%] -rotate-[5deg]', 'right-0 top-0 w-[46%] h-[56%] rotate-[4deg]', 'right-[8%] bottom-0 w-[40%] h-[38%] -rotate-[3deg]'][i]}`}>
                <Photo src={c.image} alt={c.name} width={600} className="h-full w-full object-cover" />
              </a>
            ))}
            <span className="float absolute left-[36%] bottom-[6%] px-4 py-3 rounded-[18px] bg-white text-[var(--st-ink)] shadow-xl">
              <span className="block text-[11px] font-semibold text-[#6F7E92]">Deals from</span>
              <span className="block text-[20px] font-bold">{inr(Math.min(...d.inStock.map((p) => p.price)))}</span>
            </span>
          </div>
        </div>
      </section>

      <div className={`${T.shell} relative -mt-14 sm:-mt-16 z-10`}>
        <form role="search" onSubmit={search} className="bg-white rounded-[26px] shadow-[0_30px_60px_-30px_rgba(34,26,61,0.55)] p-3 sm:p-4 flex flex-col sm:flex-row gap-3">
          <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category" className="h-12 px-4 rounded-full bg-[var(--st-accent-soft)] text-[14px] font-semibold text-[var(--st-ink)] outline-none sm:w-56">
            <option value="">All categories</option>
            {d.categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
          </select>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="What are you looking for today?" aria-label="Search products" className="flex-1 min-w-0 h-12 px-5 rounded-full border border-[#E3E8EF] text-[14.5px] outline-none focus:border-[var(--st-accent)]" />
          <button type="submit" className="h-12 px-7 rounded-full bg-gradient-to-r from-[var(--st-accent)] to-[var(--st-accent-2)] text-white text-[14.5px] font-semibold flex items-center justify-center gap-2"><Icon name="search" size={18} /> Search</button>
        </form>
      </div>

      <div className={`${T.shell} space-y-14 sm:space-y-20 pt-14 sm:pt-16`}>
        <section>
          <LifeHeading eyebrow="Explore" title="Most visited categories" action={{ label: 'All categories', href: '#/shop' }} />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {d.categories.slice(0, 6).map((c) => (
              <a key={c.id} href={shopHref({ cat: c.slug })} className="on-dark group relative aspect-[4/5] overflow-hidden rounded-[24px] bg-[var(--st-ink-2)] text-white">
                <Photo src={c.image} alt="" width={500} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <span className="absolute inset-0 bg-gradient-to-t from-[var(--st-deep)]/80 via-transparent to-transparent" />
                <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/90 text-[var(--st-ink)] text-[11px] font-bold">{d.countIn(c.name)}</span>
                <span className="absolute left-4 right-4 bottom-4 text-[16px] font-semibold leading-tight">{c.name}</span>
              </a>
            ))}
          </div>
        </section>

        <section>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-6 sm:mb-8">
            <div>
              <p className="text-[13px] font-semibold text-[var(--st-accent)] mb-1.5">Trending now</p>
              <h2 className="font-display text-[28px] sm:text-[40px] leading-[1.08]">Picked for <em>you</em></h2>
            </div>
            <div className="flex gap-2 p-1.5 rounded-full bg-white shadow-sm self-start" role="tablist" aria-label="Collections">
              {(Object.keys(tabs) as (keyof typeof tabs)[]).map((key) => (
                <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={`h-10 px-5 rounded-full text-[13.5px] font-semibold transition-all ${tab === key ? 'bg-gradient-to-r from-[var(--st-accent)] to-[var(--st-accent-2)] text-white' : 'text-[#5B6B80] hover:text-[var(--st-ink)]'}`}>{tabs[key][0]}</button>
              ))}
            </div>
          </div>
          <div key={tab} className="fade"><Grid products={tabs[tab][1].slice(0, 8)} className="grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5" /></div>
        </section>

        {promos.length === 3 && (
          <section className="grid md:grid-cols-3 gap-4">
            {promos.map((p, i) => (
              <a key={p.id} href={`#/product/${p.id}`} className={`group flex items-center gap-4 overflow-hidden rounded-[28px] p-6 min-h-[180px] ${pastels[i]}`}>
                <span className="flex-1 min-w-0">
                  <span className="block text-[12.5px] font-bold text-[var(--st-accent)]">Save {percentOff(p)}%</span>
                  <span className="block mt-1 text-[19px] font-bold leading-tight text-[var(--st-ink)] line-clamp-2">{p.name}</span>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--st-ink)]">Shop now <Icon name="arrow" size={14} /></span>
                </span>
                <Photo src={productPhotos(p)[0]} alt="" width={300} className="w-28 h-28 shrink-0 rounded-[22px] object-cover rotate-6 shadow-lg transition-transform duration-500 group-hover:rotate-0 group-hover:scale-105" />
              </a>
            ))}
          </section>
        )}

        <section>
          <LifeHeading eyebrow="Fresh picks" title="Just for you" action={{ label: 'Shop all', href: '#/shop' }} />
          <Carousel products={d.bestsellers.slice(0, 10)} colorHex={d.colorHex} categoryOf={d.categoryOf} />
        </section>

        <section className="on-dark relative overflow-hidden rounded-[36px] bg-[var(--st-ink)] text-white p-7 sm:p-12 grid lg:grid-cols-3 gap-6 items-center">
          <span aria-hidden="true" className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-[var(--st-accent-2)]/30 blur-3xl" />
          <div className="relative">
            <p className="text-[13px] font-semibold text-[var(--st-accent-light)] mb-2">Happy shoppers</p>
            <h2 className="font-display text-[30px] sm:text-[40px] leading-[1.08]">Loved by <em>thousands</em></h2>
          </div>
          {REVIEWS.slice(0, 2).map((r) => (
            <figure key={r.name} className="relative rounded-[24px] bg-white/10 border border-white/10 p-6">
              <p className="text-[#FFE27A] tracking-[0.2em]">★★★★★</p>
              <blockquote className="mt-3 text-[15.5px] leading-relaxed text-white/90">“{r.text}”</blockquote>
              <figcaption className="mt-4 text-[13px] font-semibold">{r.name} <span className="font-normal text-white/60">· {r.city}</span></figcaption>
            </figure>
          ))}
        </section>
      </div>
    </>
  );
}

// =============================================================================
// Boutique: editorial photo hero, centred serif type, triptych, lookbook rows
// =============================================================================

function BoutiqueHome() {
  const storeInfo = useStoreDetails();
  const d = useHomeData();
  const [slide, setSlide] = useSlideIndex(d.slides.length, 7000);
  const current = d.slides[slide];
  const lookbook = [d.categories[3], d.categories[4]].filter(Boolean);
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);
  const link = 'text-[11.5px] uppercase tracking-[0.3em] border-b pb-1.5 transition-opacity hover:opacity-60';

  return (
    <>
      {current && (
        <section className="on-dark relative h-[78vh] min-h-[520px] max-h-[860px] overflow-hidden bg-[var(--st-ink-2)] text-white">
          {d.slides.map((s, i) => (
            <Photo key={s.id} src={s.image} alt="" width={1800} eager={i === 0} className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1400ms] ${i === slide ? 'opacity-100 kenburns' : 'opacity-0'}`} />
          ))}
          <span className="absolute inset-0 bg-gradient-to-t from-[var(--st-deep)]/70 via-[var(--st-deep)]/20 to-[var(--st-deep)]/10" />
          <div key={current.id} className="relative h-full flex flex-col items-center justify-end text-center px-6 pb-20 sm:pb-24">
            <p className="rise text-[11px] uppercase tracking-[0.45em] text-white/85">The new collection</p>
            <h1 className="rise rise-1 font-display mt-5 text-[46px] sm:text-[88px] leading-[1] max-w-4xl">{current.title}</h1>
            <p className="rise rise-2 mt-5 text-[15.5px] text-white/85 max-w-lg">{current.subtitle}</p>
            <a href={current.ctaLink} className={`rise rise-3 mt-9 ${link} border-white`}>{current.ctaText}</a>
          </div>
          {d.slides.length > 1 && (
            <div className="absolute bottom-6 right-6 sm:right-10 flex items-center gap-4 text-[12px] tracking-[0.2em]">
              <button onClick={() => setSlide((slide - 1 + d.slides.length) % d.slides.length)} aria-label="Previous slide" className="w-9 h-9 flex items-center justify-center"><Icon name="back" size={16} /></button>
              <span className="tabular-nums">{pad(slide + 1)} / {pad(d.slides.length)}</span>
              <button onClick={() => setSlide((slide + 1) % d.slides.length)} aria-label="Next slide" className="w-9 h-9 flex items-center justify-center"><Icon name="arrow" size={16} /></button>
            </div>
          )}
        </section>
      )}

      <section className={`${T.shell} py-16 sm:py-24 text-center`}>
        <p className={T.eyebrow}>Maison {storeInfo.name}</p>
        <p className="mt-6 font-display text-[26px] sm:text-[42px] leading-[1.3] max-w-4xl mx-auto text-[var(--st-ink)]">Objects of sound, sight and play — <em>chosen slowly</em>, made to be kept for years.</p>
      </section>

      <section className={T.shell}>
        <div className="grid sm:grid-cols-3 gap-10 sm:gap-6">
          {d.categories.slice(0, 3).map((c) => (
            <a key={c.id} href={shopHref({ cat: c.slug })} className="group block text-center">
              <div className="aspect-[3/4] overflow-hidden bg-[var(--st-accent-soft)]">
                <Photo src={c.image} alt="" width={800} className="h-full w-full object-cover transition-transform duration-[1600ms] ease-out group-hover:scale-[1.06]" />
              </div>
              <p className="mt-6 text-[11px] uppercase tracking-[0.35em] text-[#8A97A8]">{c.name}</p>
              <p className="mt-2 font-display text-[22px] text-[var(--st-ink)]">{c.blurb}</p>
            </a>
          ))}
        </div>
      </section>

      <section className={`${T.shell} pt-20 sm:pt-28`}>
        <div className="text-center mb-10 sm:mb-14">
          <p className={T.eyebrow}>The selection</p>
          <h2 className="font-display mt-3 text-[38px] sm:text-[58px] leading-[1.05]">Pieces of the <em>moment</em></h2>
        </div>
        <Grid products={d.featured.slice(0, 8)} className="grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-12" />
        <div className="mt-14 text-center"><Button href="#/shop" variant="outline">View all pieces</Button></div>
      </section>

      <div className="mt-20 sm:mt-28">
        {lookbook.map((c, i) => (
          <section key={c.id} className="grid lg:grid-cols-2 bg-[var(--st-accent-soft)]">
            <div className={`relative min-h-[380px] lg:min-h-[620px] ${i % 2 ? 'lg:order-2' : ''}`}>
              <Photo src={c.image} alt="" width={1200} className="absolute inset-0 h-full w-full object-cover" />
            </div>
            <div className="flex flex-col justify-center px-8 py-14 sm:px-16 lg:px-24">
              <p className={T.eyebrow}>Lookbook · {pad(i + 1)}</p>
              <h2 className="font-display mt-4 text-[38px] sm:text-[54px] leading-[1.05]">{i ? <>Evenings, <em>played well</em></> : <>The art of <em>capture</em></>}</h2>
              <p className="mt-5 text-[16px] leading-relaxed text-[#5B6B80] max-w-md">{c.blurb}. {i ? 'Consoles and controllers that look as good on the shelf as they feel in your hands.' : 'Cameras and drones for the moments you will want to keep, in the detail they deserve.'}</p>
              <a href={shopHref({ cat: c.slug })} className={`mt-9 self-start ${link} border-[var(--st-ink)] text-[var(--st-ink)]`}>Discover {c.name}</a>
            </div>
          </section>
        ))}
      </div>

      {d.posts.length > 0 && (
        <section className="pt-20 sm:pt-28">
          <p className={`${T.eyebrow} text-center`}>@demowebsite</p>
          <h2 className="font-display mt-3 mb-10 text-center text-[32px] sm:text-[46px]">Seen in <em>real life</em></h2>
          <div className="grid grid-cols-3 lg:grid-cols-6">
            {d.posts.slice(0, 6).map((post) => (
              <a key={post.id} href={post.postUrl} target="_blank" rel="noopener noreferrer" aria-label={post.caption || 'Instagram post'} className="group aspect-square overflow-hidden bg-[var(--st-accent-soft)]">
                <Photo src={post.imageUrl} alt="" width={500} className="h-full w-full object-cover transition-opacity duration-500 group-hover:opacity-75" />
              </a>
            ))}
          </div>
        </section>
      )}

      <section className={`${T.shell} py-20 sm:py-28 text-center`}>
        <h2 className="font-display text-[32px] sm:text-[48px]">Join the <em>private list</em></h2>
        <p className="mt-4 text-[15.5px] text-[#5B6B80]">First look at new pieces and invitations to private sales.</p>
        {joined ? (
          <p role="status" className="mt-10 text-[14px] uppercase tracking-[0.2em] text-[var(--st-accent)]">Thank you — you&apos;re on the list</p>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); setJoined(true); }} className="mt-10 max-w-md mx-auto flex items-center border-b border-[var(--st-ink)]">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email address" aria-label="Email address" className="flex-1 min-w-0 h-12 bg-transparent text-[15px] outline-none" />
            <button type="submit" className="text-[11.5px] uppercase tracking-[0.3em]">Subscribe</button>
          </form>
        )}
      </section>
    </>
  );
}

// =============================================================================
// Volt: giant type, outlined blocks, offset shadows, stickers and a ticker
// =============================================================================

function VoltHeading({ kicker, title, href }: { kicker: string; title: ReactNode; href?: string }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-7 pb-4 border-b-[3px] border-[var(--st-ink)]">
      <h2 className="font-display text-[34px] sm:text-[60px] leading-[0.9]"><span className="mr-3 align-top text-[16px] sm:text-[22px] text-[var(--st-accent)]">{kicker}</span>{title}</h2>
      {href && <a href={href} className="shrink-0 h-11 px-4 flex items-center gap-2 bg-white border-2 border-[var(--st-ink)] shadow-[3px_3px_0_var(--st-ink)] text-[13px] font-bold uppercase hover:bg-[var(--st-accent-light)]">See all <Icon name="arrow" size={15} stroke={2} /></a>}
    </div>
  );
}

const VOLT_TICKER = ['Free delivery over ₹4,999', '48h dispatch', '7-day returns', '1-year warranty', 'Genuine gear only', 'UPI · Cards · COD'];

function VoltHome() {
  const storeInfo = useStoreDetails();
  const d = useHomeData();
  const hero = d.featured[0];
  const deal = d.byDiscount[0];
  const maxOff = deal ? percentOff(deal) : 0;
  const left = useMidnightCountdown();
  const clock = left === null ? '--:--:--' : [left / 3600000, (left / 60000) % 60, (left / 1000) % 60].map((n) => pad(Math.floor(n))).join(':');
  const tick = (hidden: boolean) => (
    <div aria-hidden={hidden} className="flex shrink-0 items-center">
      {VOLT_TICKER.map((text) => <span key={text} className="flex items-center gap-6 px-6 whitespace-nowrap text-[22px] sm:text-[30px] font-bold uppercase tracking-[-0.03em]">{text}<span className="text-[var(--st-accent)]">✦</span></span>)}
    </div>
  );

  return (
    <>
      <section className="border-b-[3px] border-[var(--st-ink)] overflow-hidden">
        <div className={`${T.shell} grid lg:grid-cols-[1.15fr_1fr] gap-12 lg:gap-16 items-center py-10 sm:py-16`}>
          <div>
            <span className="inline-block -rotate-2 px-3 py-1.5 bg-[var(--st-accent-light)] border-2 border-[var(--st-ink)] shadow-[3px_3px_0_var(--st-ink)] text-[13px] font-bold uppercase">⚡ Drop 03 is live</span>
            <h1 className="font-display mt-6 text-[58px] sm:text-[104px] leading-[0.92]">Gear that<br /><em>goes hard.</em></h1>
            <p className="mt-6 text-[17px] sm:text-[18px] font-medium max-w-md">{storeInfo.tagline}. No filler, no fluff — just kit that works.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button href="#/shop" variant="accent">Shop the drop <Icon name="arrow" size={16} /></Button>
              <Button href="#/deals" variant="light">Deals</Button>
            </div>
            <div className="mt-10 grid grid-cols-3 max-w-md border-2 border-[var(--st-ink)] bg-white">
              {[[String(d.products.length), 'Products'], [`${d.avgRating.toFixed(1)}★`, 'Avg rating'], ['48H', 'Dispatch']].map(([value, label], i) => (
                <div key={label} className={`p-3 sm:p-4 ${i ? 'border-l-2 border-[var(--st-ink)]' : ''}`}>
                  <p className="text-[24px] sm:text-[30px] font-bold leading-none tracking-[-0.04em]">{value}</p>
                  <p className="mt-1 text-[11px] font-bold uppercase text-[#6F7E92]">{label}</p>
                </div>
              ))}
            </div>
          </div>
          {hero && (
            <a href={`#/product/${hero.id}`} className="relative block mx-3 sm:mx-6 lg:mx-0">
              <div className="relative aspect-square border-[3px] border-[var(--st-ink)] shadow-[12px_12px_0_var(--st-ink)] bg-[var(--st-accent)] overflow-hidden">
                <Photo src={productPhotos(hero)[0]} alt={hero.name} width={1100} eager className="h-full w-full object-cover" />
              </div>
              {maxOff > 0 && (
                <span className="absolute -top-6 -left-4 w-28 h-28 rounded-full bg-[var(--st-accent-light)] border-2 border-[var(--st-ink)] shadow-[4px_4px_0_var(--st-ink)] -rotate-12 flex flex-col items-center justify-center text-center font-bold uppercase leading-[1]">
                  <span className="text-[12px]">Up to</span><span className="text-[30px] tracking-[-0.05em]">{maxOff}%</span><span className="text-[12px]">off</span>
                </span>
              )}
              <span className="absolute -bottom-5 right-4 sm:right-8 max-w-[80%] px-4 py-2.5 bg-white border-2 border-[var(--st-ink)] shadow-[4px_4px_0_var(--st-ink)] font-bold uppercase text-[14px] sm:text-[16px] truncate">{hero.name} — {inr(hero.price)}</span>
            </a>
          )}
        </div>
      </section>

      <div className="bg-[var(--st-ink)] text-[var(--st-accent-light)] border-b-[3px] border-[var(--st-ink)] overflow-hidden py-4">
        <div className="marquee-fast flex w-max">{tick(false)}{tick(true)}</div>
      </div>

      <div className={`${T.shell} space-y-16 sm:space-y-24 py-14 sm:py-20`}>
        <section>
          <VoltHeading kicker="01" title="Pick your lane" href="#/shop" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {d.categories.map((c, i) => (
              <a key={c.id} href={shopHref({ cat: c.slug })} className="group flex flex-col justify-between gap-6 min-h-[150px] sm:min-h-[190px] p-4 sm:p-5 bg-white border-2 border-[var(--st-ink)] shadow-[5px_5px_0_var(--st-ink)] transition-all duration-200 hover:bg-[var(--st-accent-light)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_var(--st-ink)]">
                <span className="flex items-start justify-between gap-3">
                  <span className="text-[13px] font-bold">{pad(i + 1)}</span>
                  <Photo src={c.image} alt="" width={200} className="w-14 h-14 sm:w-20 sm:h-20 object-cover border-2 border-[var(--st-ink)]" />
                </span>
                <span className="font-display text-[21px] sm:text-[30px] leading-[0.95]">{c.name} →</span>
              </a>
            ))}
            <a href="#/shop" className="flex flex-col justify-between gap-6 min-h-[150px] sm:min-h-[190px] p-4 sm:p-5 bg-[var(--st-ink)] text-[var(--st-accent-light)] border-2 border-[var(--st-ink)] shadow-[5px_5px_0_var(--st-accent)]">
              <span className="text-[13px] font-bold">{pad(d.categories.length + 1)}</span>
              <span className="font-display text-[21px] sm:text-[30px] leading-[0.95]">All gear ({d.products.length}) →</span>
            </a>
          </div>
        </section>

        <section>
          <VoltHeading kicker="02" title="Hot right now" href={shopHref({ sort: 'rating' })} />
          <Grid products={d.bestsellers.slice(0, 8)} className="grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-7" />
        </section>

        {deal && (
          <section className="on-dark grid lg:grid-cols-2 border-[3px] border-[var(--st-ink)] bg-[var(--st-ink)] text-white shadow-[10px_10px_0_var(--st-accent)]">
            <div className="p-7 sm:p-12 flex flex-col justify-center">
              <p className="text-[13px] font-bold uppercase text-[var(--st-accent-light)]">Deal of the day · ends in <span className="tabular-nums">{clock}</span></p>
              <p className="font-display mt-4 text-[110px] sm:text-[170px] leading-[0.8] text-[var(--st-accent)]">-{percentOff(deal)}%</p>
              <h3 className="font-display mt-5 text-[28px] sm:text-[40px] leading-[0.95]">{deal.name}</h3>
              <p className="mt-4 text-[18px] font-bold">{inr(deal.price)} {deal.mrp && <s className="ml-2 text-[15px] font-medium text-white/50">{inr(deal.mrp)}</s>}</p>
              <div className="mt-8"><Button href={`#/product/${deal.id}`} variant="accent">Grab it <Icon name="arrow" size={16} /></Button></div>
            </div>
            <div className="relative min-h-[300px] border-t-[3px] lg:border-t-0 lg:border-l-[3px] border-[var(--st-accent-light)]">
              <Photo src={productPhotos(deal)[0]} alt={deal.name} width={1100} className="absolute inset-0 h-full w-full object-cover" />
            </div>
          </section>
        )}

        {d.newArrivals.length > 0 && (
          <section>
            <VoltHeading kicker="03" title="Fresh drops" href={shopHref({ sort: 'newest' })} />
            <Carousel products={d.newArrivals.slice(0, 10)} colorHex={d.colorHex} categoryOf={d.categoryOf} />
          </section>
        )}

        <section>
          <VoltHeading kicker="04" title="Word on the street" />
          <div className="grid md:grid-cols-3 gap-6">
            {REVIEWS.map((r, i) => (
              <figure key={r.name} className={`p-6 bg-white border-2 border-[var(--st-ink)] shadow-[6px_6px_0_var(--st-ink)] ${['-rotate-1', 'rotate-1', '-rotate-[0.5deg]'][i % 3]}`}>
                <p className="text-[var(--st-accent)] tracking-[0.15em] text-[18px]">★★★★★</p>
                <blockquote className="mt-3 text-[17px] font-bold leading-snug">“{r.text}”</blockquote>
                <figcaption className="mt-5 text-[12.5px] font-bold uppercase">{r.name} · {r.city}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

// =============================================================================
// Aster: quiet split hero, an index of categories, airy grid, a spec sheet
// =============================================================================

const PRINCIPLES = [
  ['Chosen slowly', 'Every piece is used for a month before it earns a place here.'],
  ['Built to last', 'A one-year warranty on everything, and parts and repairs after that.'],
  ['Here to help', 'Real people answer every message, seven days a week.'],
];

function AsterHome() {
  const d = useHomeData();
  const spot = d.featured.find((p) => p.specs.length >= 3) ?? d.featured[0];
  const hero = d.featured[1] ?? d.featured[0];

  return (
    <div className={T.shell}>
      <section className="grid lg:grid-cols-[1fr_1.05fr] gap-10 lg:gap-20 items-center pt-8 sm:pt-14 pb-16 sm:pb-24 border-b border-[#E3E8EF]">
        <div className="order-2 lg:order-1">
          <p className="rise text-[13px] text-[#8A97A8]">New season — {d.products.length} considered objects</p>
          <h1 className="rise rise-1 font-display mt-6 text-[56px] sm:text-[96px] leading-[0.95]">Less, but <em>better.</em></h1>
          <p className="rise rise-2 mt-8 text-[17px] leading-relaxed text-[#5B6B80] max-w-md">Electronics stripped back to what matters: good materials, honest specs and nothing you&apos;ll throw away next year.</p>
          <div className="rise rise-3 mt-10 flex flex-wrap items-center gap-8">
            <Button href="#/shop" variant="ink">Browse the collection</Button>
            <TextLink href="#/about">Our approach</TextLink>
          </div>
        </div>
        {hero && (
          <a href={`#/product/${hero.id}`} className="order-1 lg:order-2 group relative block aspect-[5/4] lg:aspect-[4/5] overflow-hidden bg-[var(--st-accent-soft)]">
            <Photo src={productPhotos(hero)[0]} alt={hero.name} width={1200} eager className="h-full w-full object-cover transition-transform duration-[1600ms] group-hover:scale-[1.03]" />
            <span className="absolute left-4 bottom-4 px-4 py-3 bg-white/90 backdrop-blur text-[13.5px] text-[var(--st-ink)]">{hero.name} · {inr(hero.price)}</span>
          </a>
        )}
      </section>

      <section className="py-16 sm:py-24 grid lg:grid-cols-[280px_1fr] gap-8 lg:gap-10">
        <div>
          <p className="text-[13px] text-[#8A97A8]">Index</p>
          <h2 className="font-display mt-3 text-[38px] sm:text-[50px] leading-none">Categories</h2>
        </div>
        <ul className="border-t border-[#E3E8EF]">
          {d.categories.map((c, i) => (
            <li key={c.id}>
              <a href={shopHref({ cat: c.slug })} className="group grid grid-cols-[36px_1fr_auto] sm:grid-cols-[56px_1fr_auto_90px] items-center gap-4 py-5 border-b border-[#E3E8EF]">
                <span className="text-[13px] text-[#A9B4C2] tabular-nums">{pad(i + 1)}</span>
                <span className="text-[22px] sm:text-[32px] font-light tracking-[-0.035em] transition-all duration-300 group-hover:translate-x-2 group-hover:text-[var(--st-accent)]">{c.name}</span>
                <Photo src={c.image} alt="" width={160} className="hidden sm:block w-20 h-14 object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="text-right text-[13px] text-[#8A97A8]">{d.countIn(c.name)} {d.countIn(c.name) === 1 ? 'item' : 'items'}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="pb-16 sm:pb-24">
        <div className="flex items-end justify-between gap-4 mb-10">
          <h2 className="font-display text-[38px] sm:text-[50px] leading-none">Selected <em>pieces</em></h2>
          <TextLink href="#/shop">View all</TextLink>
        </div>
        <Grid products={d.featured.slice(0, 6)} className="grid-cols-2 lg:grid-cols-3 gap-x-4 sm:gap-x-8 gap-y-12 sm:gap-y-16" />
      </section>

      {spot && (
        <section className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center py-16 sm:py-24 border-t border-[#E3E8EF]">
          <div className="aspect-square overflow-hidden bg-[var(--st-accent-soft)]">
            <Photo src={productPhotos(spot)[0]} alt={spot.name} width={1100} className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="text-[13px] text-[#8A97A8]">In detail</p>
            <h2 className="font-display mt-4 text-[40px] sm:text-[60px] leading-[1]">{spot.name}</h2>
            <p className="mt-6 text-[16px] leading-relaxed text-[#5B6B80]">{spot.description}</p>
            <dl className="mt-10 border-t border-[#E3E8EF]">
              {spot.specs.slice(0, 5).map(([label, value]) => (
                <div key={label} className="flex justify-between gap-6 py-4 border-b border-[#E3E8EF] text-[14.5px]">
                  <dt className="text-[#8A97A8]">{label}</dt>
                  <dd className="text-right text-[var(--st-ink)]">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-10 flex flex-wrap items-center gap-6">
              <span className="text-[26px] font-light tracking-[-0.03em]">{inr(spot.price)}</span>
              <Button href={`#/product/${spot.id}`} variant="ink">View product</Button>
            </div>
          </div>
        </section>
      )}

      <section className="grid sm:grid-cols-3 border-t border-[#E3E8EF]">
        {PRINCIPLES.map(([title, text], i) => (
          <div key={title} className={`py-10 sm:py-14 ${i ? 'sm:border-l border-t sm:border-t-0 border-[#E3E8EF] sm:pl-8' : 'sm:pr-8'}`}>
            <p className="text-[13px] text-[#A9B4C2] tabular-nums">{pad(i + 1)}</p>
            <h3 className="mt-4 text-[22px] font-light tracking-[-0.03em]">{title}</h3>
            <p className="mt-3 text-[14.5px] leading-relaxed text-[#5B6B80]">{text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

// =============================================================================
// Atelier: a flagship-store product stage, two-up showcase tiles, a "latest" shelf and a dark spotlight
// =============================================================================

/** Atelier headlines: the first sentence in ink, the second in grey. */
function AtelierHeading({ lead, rest }: { lead: string; rest: string }) {
  return <h2 className="font-display text-[30px] sm:text-[48px] leading-[1.08] max-w-4xl">{lead} <em>{rest}</em></h2>;
}

function AtelierHome() {
  const d = useHomeData();
  const storeInfo = useStoreDetails();
  const hero = d.featured[0];
  const tiles = d.featured.slice(1, 5);
  const shelf = (d.newArrivals.length ? d.newArrivals : d.inStock).slice(0, 8);
  const spot = d.featured.find((p) => p.specs.length >= 4 && p.id !== hero?.id) ?? d.featured[0];
  const buy = 'inline-flex items-center h-10 px-5 rounded-full bg-[var(--st-accent)] text-white text-[15px] font-medium transition-colors hover:bg-[var(--st-accent-dark)]';
  const more = 'inline-flex items-center text-[15px] sm:text-[17px] hover:underline underline-offset-4';
  const blurb = (p: Product) => p.highlights[0] ?? p.description;

  return (
    <>
      {hero && (
        <section className="pt-10 sm:pt-16 text-center">
          <div className={T.shell}>
            <p className="rise text-[15px] sm:text-[17px] font-semibold text-[#BF4800]">New</p>
            <h1 className="rise rise-1 font-display mt-2 text-[42px] sm:text-[80px] leading-[1.02] max-w-5xl mx-auto">{hero.name}</h1>
            <p className="rise rise-2 mt-4 text-[19px] sm:text-[26px] leading-snug text-[#6E6E73] max-w-2xl mx-auto">{blurb(hero)}</p>
            <div className="rise rise-3 mt-6 flex items-center justify-center gap-6">
              <a href={`#/product/${hero.id}`} className={buy}>Buy</a>
              <a href={`#/product/${hero.id}`} className={`${more} text-[var(--st-accent)]`}>Learn more ›</a>
            </div>
            <p className="mt-3 text-[14px] text-[#86868B]">From {inr(hero.price)}{hero.mrp && hero.mrp > hero.price ? ` · save ${inr(hero.mrp - hero.price)}` : ''}</p>
          </div>
          <div className="mt-10 sm:mt-14 px-3 sm:px-6">
            <a href={`#/product/${hero.id}`} aria-label={hero.name} className="group relative block mx-auto max-w-[1600px] aspect-[4/3] sm:aspect-[21/9] rounded-[28px] sm:rounded-[40px] overflow-hidden bg-gradient-to-b from-white to-[#E8E8ED]">
              <Photo src={productPhotos(hero)[0]} alt="" width={1800} eager className="absolute inset-0 h-full w-full object-cover transition-transform duration-[2000ms] ease-out group-hover:scale-[1.03]" />
            </a>
          </div>
        </section>
      )}

      {tiles.length > 0 && (
        <section className="px-3 sm:px-6 pt-3 sm:pt-4">
          <div className="mx-auto max-w-[1600px] grid md:grid-cols-2 gap-3 sm:gap-4">
            {tiles.map((p, i) => {
              const dark = i === 1 || i === 2;
              return (
                <a key={p.id} href={`#/product/${p.id}`} className={`group relative overflow-hidden rounded-[28px] sm:rounded-[36px] min-h-[540px] sm:min-h-[640px] flex flex-col items-center text-center pt-12 sm:pt-14 ${dark ? 'on-dark bg-black text-white' : 'bg-white text-[var(--st-ink)]'}`}>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#86868B]">{p.subCategory || p.category}</p>
                  <h2 className="font-display mt-3 px-6 text-[32px] sm:text-[44px] leading-[1.05] max-w-lg">{p.name}</h2>
                  <p className={`mt-3 px-8 text-[16px] sm:text-[19px] leading-snug max-w-md ${dark ? 'text-white/65' : 'text-[#6E6E73]'}`}>{blurb(p)}</p>
                  <span className="mt-5 flex items-center gap-5">
                    <span className={buy}>Buy</span>
                    <span className={`${more} ${dark ? 'text-[var(--st-accent-light)]' : 'text-[var(--st-accent)]'}`}>Learn more ›</span>
                  </span>
                  <span className="absolute inset-x-6 sm:inset-x-10 bottom-0 top-[55%] rounded-t-[24px] overflow-hidden">
                    <Photo src={productPhotos(p)[0]} alt="" width={1000} className="h-full w-full object-cover transition-transform duration-[1600ms] ease-out group-hover:scale-[1.05]" />
                  </span>
                </a>
              );
            })}
          </div>
        </section>
      )}

      <section className={`${T.shell} pt-16 sm:pt-24`}>
        <AtelierHeading lead="Shop by category." rest="The best way to find what you love." />
        <div className="mt-8 -mx-5 px-5 sm:mx-0 sm:px-0 flex gap-4 sm:gap-6 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {d.categories.map((c) => (
            <a key={c.id} href={shopHref({ cat: c.slug })} className="group shrink-0 w-[112px] sm:w-[128px] text-center">
              <span className="block w-full aspect-square rounded-[26px] overflow-hidden bg-white shadow-[0_10px_30px_-20px_rgba(0,0,0,0.35)]">
                <Photo src={c.image} alt="" width={300} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
              </span>
              <span className="mt-3 block text-[14px] font-semibold leading-tight text-[var(--st-ink)]">{c.name}</span>
              <span className="mt-0.5 block text-[12px] text-[#86868B]">{d.countIn(c.name)} {d.countIn(c.name) === 1 ? 'product' : 'products'}</span>
            </a>
          ))}
        </div>
      </section>

      {shelf.length > 0 && (
        <section className={`${T.shell} pt-14 sm:pt-20`}>
          <AtelierHeading lead="The latest." rest="Take a look at what’s new right now." />
          <div className="mt-8 -mx-5 px-5 sm:mx-0 sm:px-0 flex gap-5 overflow-x-auto snap-x snap-mandatory pb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {shelf.map((p) => (
              <a key={p.id} href={`#/product/${p.id}`} className="group snap-start shrink-0 w-[80%] sm:w-[360px] h-[470px] sm:h-[500px] rounded-[28px] bg-white overflow-hidden flex flex-col shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-500 hover:scale-[1.015] hover:shadow-[0_30px_60px_-30px_rgba(0,0,0,0.3)]">
                <span className="block p-7 pb-0">
                  <span className="block text-[12px] font-semibold uppercase tracking-[0.14em] text-[#BF4800]">{p.isNewArrival ? 'New' : p.category}</span>
                  <span className="mt-2 block font-display text-[26px] leading-[1.1] text-[var(--st-ink)]">{p.name}</span>
                  <span className="mt-2 block text-[15px] text-[#6E6E73]">From {inr(p.price)}</span>
                </span>
                <span className="relative mt-auto block h-[56%]">
                  <Photo src={productPhotos(p)[0]} alt="" width={700} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      <section className={`${T.shell} pt-10 sm:pt-14`}>
        <AtelierHeading lead="All the favourites." rest="Chosen again and again by our customers." />
        <div className="mt-8"><Grid products={d.bestsellers.slice(0, 8)} className="grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5" /></div>
      </section>

      <section className={`${T.shell} pt-16 sm:pt-24`}>
        <AtelierHeading lead={`The ${storeInfo.name} difference.`} rest="Even more reasons to shop with us." />
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {([
            ['truck', 'Free delivery', `On every order over ${inr(4999)}, packed with care and tracked to your door.`],
            ['refresh', '7-day returns', 'Changed your mind? Send it back in its box within a week.'],
            ['shield', 'One-year warranty', 'Every product is covered against manufacturing defects.'],
            ['chat', 'Talk to a specialist', 'Real people who use the products answer every question.'],
          ] as const).map(([icon, title, text]) => (
            <div key={title} className="flex flex-col min-h-[230px] rounded-[28px] bg-white p-7 transition-transform duration-500 hover:scale-[1.02]">
              <span className="text-[var(--st-accent)]"><Icon name={icon} size={30} stroke={1.5} /></span>
              <h3 className="mt-auto pt-10 font-display text-[22px] leading-tight text-[var(--st-ink)]">{title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[#6E6E73]">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {spot && (
        <section className="on-dark mt-16 sm:mt-24 bg-black text-white">
          <div className={`${T.shell} py-16 sm:py-24 text-center`}>
            <p className="text-[15px] sm:text-[17px] font-semibold text-[var(--st-accent-light)]">Spotlight</p>
            <h2 className="font-display mt-2 text-[40px] sm:text-[72px] leading-[1.02] max-w-4xl mx-auto">{spot.name}</h2>
            <p className="mt-4 text-[18px] sm:text-[22px] leading-snug text-white/60 max-w-2xl mx-auto">{spot.description}</p>
            <div className="relative mt-10 sm:mt-14 mx-auto max-w-4xl aspect-[16/10] rounded-[28px] sm:rounded-[36px] overflow-hidden bg-[#111]">
              <Photo src={productPhotos(spot)[0]} alt={spot.name} width={1400} className="absolute inset-0 h-full w-full object-cover" />
            </div>
            <dl className="mt-12 sm:mt-16 grid grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-6 max-w-5xl mx-auto">
              {spot.specs.slice(0, 4).map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[14px] text-white/50">{label}</dt>
                  <dd className="mt-2 font-display text-[26px] sm:text-[38px] leading-none bg-gradient-to-b from-white to-white/55 bg-clip-text text-transparent">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-12 flex items-center justify-center gap-6">
              <a href={`#/product/${spot.id}`} className={buy}>Buy</a>
              <a href={`#/product/${spot.id}`} className={`${more} text-[var(--st-accent-light)]`}>Learn more ›</a>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

// =============================================================================
// Aurora: a glowing gradient hero under a floating navbar, a bento grid and glass cards
// =============================================================================

function AuroraHeading({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-7 sm:mb-9">
      <div>
        <span className="inline-flex items-center gap-2 text-[12.5px] font-bold uppercase tracking-[0.16em] text-[var(--st-accent)]">
          <span className="w-6 h-[2px] rounded-full bg-gradient-to-r from-[var(--st-accent)] to-[var(--st-accent-2)]" />{eyebrow}
        </span>
        <h2 className="font-display mt-3 text-[32px] sm:text-[48px] leading-[1.04]">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function AuroraHome() {
  const d = useHomeData();
  const storeInfo = useStoreDetails();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'trending' | 'fresh' | 'deals'>('trending');
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);
  const tabs = { trending: ['Trending', d.bestsellers], fresh: ['New in', d.newArrivals.length ? d.newArrivals : d.inStock], deals: ['Best deals', d.byDiscount] } as const;
  const [big, side, third] = [d.categories[0], d.categories[1], d.categories[4] ?? d.categories[2]];
  const trio = d.featured.slice(0, 3);
  const star = d.bestsellers[0];
  const deal = d.byDiscount[0];
  const glass = 'bg-white/70 backdrop-blur-xl border border-white ring-1 ring-[var(--st-ink)]/[0.05] shadow-[0_24px_60px_-40px_rgba(11,18,32,0.5)]';
  const search = (e: FormEvent) => {
    e.preventDefault();
    navigate(shopHref({ q: query.trim() }));
  };
  const chips = (hidden: boolean) => (
    <div aria-hidden={hidden} className="flex shrink-0 items-center gap-3 pr-3">
      {d.categories.map((c) => (
        <a key={c.id} href={shopHref({ cat: c.slug })} tabIndex={hidden ? -1 : undefined} className={`flex items-center gap-2.5 h-14 pl-2 pr-5 rounded-full whitespace-nowrap transition-shadow hover:ring-[var(--st-accent)]/40 ${glass}`}>
          <Photo src={c.image} alt="" width={120} className="w-10 h-10 rounded-full object-cover" />
          <span className="text-[14px] font-semibold text-[var(--st-ink)]">{c.name}</span>
          <span className="text-[12px] font-semibold text-[#8A97A8]">{d.countIn(c.name)}</span>
        </a>
      ))}
    </div>
  );

  return (
    <>
      <section className="relative overflow-hidden -mt-[76px] pt-[124px] sm:pt-[150px] pb-14 sm:pb-20">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <span className="aurora-a absolute -top-48 left-[4%] w-[640px] h-[640px] rounded-full bg-[var(--st-accent)]/30 blur-[120px]" />
          <span className="aurora-b absolute top-0 right-[2%] w-[580px] h-[580px] rounded-full bg-[var(--st-accent-2)]/30 blur-[120px]" />
          <span className="aurora-c absolute -bottom-56 left-[32%] w-[540px] h-[540px] rounded-full bg-[#F472B6]/20 blur-[120px]" />
          <span className="absolute inset-0 bg-[radial-gradient(rgba(11,18,32,0.07)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_75%)]" />
        </div>
        <div className={`${T.shell} relative text-center`}>
          <a href={shopHref({ sort: 'newest' })} className={`rise inline-flex items-center gap-2 h-9 pl-1.5 pr-4 rounded-full text-[13px] font-semibold text-[var(--st-ink)] ${glass}`}>
            <span className="h-6 px-2.5 rounded-full bg-gradient-to-r from-[var(--st-accent)] to-[var(--st-accent-2)] text-white text-[11px] font-bold flex items-center">NEW</span>
            {d.newArrivals.length} fresh arrivals this week <Icon name="arrow" size={14} />
          </a>
          <h1 className="rise rise-1 font-display mt-7 text-[44px] sm:text-[86px] leading-[0.98] max-w-5xl mx-auto">Tech that makes <em>every day</em> brighter.</h1>
          <p className="rise rise-2 mt-6 text-[17px] sm:text-[20px] leading-relaxed text-[#4B5568] max-w-2xl mx-auto">{storeInfo.tagline}. Hand-picked, tested and delivered fast.</p>
          <form onSubmit={search} role="search" className={`rise rise-3 mt-9 mx-auto max-w-xl flex items-center gap-2 p-2 rounded-full ${glass}`}>
            <span className="pl-3 text-[#8A97A8]"><Icon name="search" size={19} /></span>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search headphones, watches, cameras…" aria-label="Search products" className="flex-1 min-w-0 h-11 bg-transparent outline-none text-[15px] text-[var(--st-ink)] placeholder:text-[#8A97A8]" />
            <button type="submit" className="h-11 px-6 rounded-full bg-gradient-to-r from-[var(--st-accent)] to-[var(--st-accent-2)] text-white text-[14px] font-semibold shadow-[0_10px_24px_-12px_var(--st-accent-2)] hover:brightness-110">Search</button>
          </form>
          <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[13.5px] font-medium text-[#4B5568]">
            <span><span className="text-[#F5B000]">★</span> {d.avgRating.toFixed(1)} from happy shoppers</span>
            <span className="flex items-center gap-1.5"><Icon name="truck" size={15} /> Free delivery over {inr(4999)}</span>
            <span className="flex items-center gap-1.5"><Icon name="refresh" size={15} /> 7-day returns</span>
          </div>
        </div>
        {trio.length === 3 && (
          <div className="relative mt-14 sm:mt-16 flex justify-center items-end gap-3 sm:gap-6 px-4">
            {trio.map((p, i) => (
              <a key={p.id} href={`#/product/${p.id}`} className={`group w-[31%] max-w-[290px] rounded-[26px] p-2 sm:p-2.5 transition-transform duration-500 hover:-translate-y-2 ${glass} ${i === 1 ? 'sm:-translate-y-8 z-10' : i === 0 ? 'sm:-rotate-[4deg]' : 'sm:rotate-[4deg]'}`}>
                <span className="block aspect-[4/5] rounded-[20px] overflow-hidden bg-[var(--st-accent-soft)]">
                  <Photo src={productPhotos(p)[0]} alt="" width={600} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </span>
                <span className="hidden sm:flex items-center justify-between gap-2 px-2 pt-3 pb-1.5">
                  <span className="text-[14px] font-semibold text-[var(--st-ink)] truncate">{p.name}</span>
                  <span className="shrink-0 text-[14px] font-bold text-[var(--st-accent)]">{inr(p.price)}</span>
                </span>
              </a>
            ))}
          </div>
        )}
      </section>

      <div className="relative overflow-hidden py-2 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
        <div className="marquee flex w-max hover:[animation-play-state:paused]">{chips(false)}{chips(true)}</div>
      </div>

      <section className={`${T.shell} pt-14 sm:pt-20`}>
        <AuroraHeading eyebrow="Explore" title={<>Everything, <em>beautifully organised</em></>} />
        <div className="grid grid-cols-2 lg:grid-cols-4 lg:grid-rows-[250px_250px_250px] gap-3 sm:gap-4">
          {big && (
            <a href={shopHref({ cat: big.slug })} className="on-dark group relative col-span-2 lg:row-span-2 min-h-[320px] overflow-hidden rounded-[32px] bg-[var(--st-ink-2)] text-white">
              <Photo src={big.image} alt="" width={1200} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.05]" />
              <span className="absolute inset-0 bg-gradient-to-t from-[var(--st-deep)]/85 via-[var(--st-deep)]/10 to-transparent" />
              <span className="absolute left-6 right-6 bottom-6 sm:left-8 sm:bottom-8">
                <span className="inline-flex h-8 px-3 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[12px] font-bold items-center">{d.countIn(big.name)} {d.countIn(big.name) === 1 ? 'product' : 'products'}</span>
                <span className="mt-3 block font-display text-[34px] sm:text-[52px] leading-[1]">{big.name}</span>
                <span className="mt-2 block text-[15px] text-white/75 max-w-sm">{big.blurb}</span>
              </span>
            </a>
          )}
          <div className="relative overflow-hidden rounded-[32px] p-6 flex flex-col justify-between min-h-[200px] bg-gradient-to-br from-[var(--st-accent)] to-[var(--st-accent-2)] text-white">
            <span aria-hidden="true" className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/20 blur-2xl" />
            <span className="relative text-[13px] font-semibold text-white/80">Customer rating</span>
            <span className="relative">
              <span className="block font-display text-[56px] sm:text-[64px] leading-none">{d.avgRating.toFixed(1)}</span>
              <span className="block mt-1 text-[#FDE68A] tracking-[0.15em]">★★★★★</span>
              <span className="block mt-1 text-[13px] text-white/80">Loved across India</span>
            </span>
          </div>
          {side && (
            <a href={shopHref({ cat: side.slug })} className="on-dark group relative min-h-[200px] overflow-hidden rounded-[32px] bg-[var(--st-ink-2)] text-white">
              <Photo src={side.image} alt="" width={600} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <span className="absolute inset-0 bg-gradient-to-t from-[var(--st-deep)]/80 to-transparent" />
              <span className="absolute left-5 bottom-5 font-display text-[22px] sm:text-[26px] leading-none">{side.name}</span>
            </a>
          )}
          {deal && (
            <a href={`#/product/${deal.id}`} className={`group col-span-2 relative overflow-hidden rounded-[32px] p-5 sm:p-6 flex items-center gap-5 ${glass}`}>
              <span className="relative w-[38%] sm:w-[42%] self-stretch min-h-[150px] rounded-[22px] overflow-hidden bg-[var(--st-accent-soft)] shrink-0">
                <Photo src={productPhotos(deal)[0]} alt="" width={600} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <span className="absolute top-2.5 left-2.5 h-7 px-2.5 rounded-full bg-[#F43F5E] text-white text-[12px] font-bold flex items-center">−{percentOff(deal)}%</span>
              </span>
              <span className="min-w-0">
                <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-[var(--st-accent)]">Deal of the day</span>
                <span className="mt-1.5 block font-display text-[20px] sm:text-[26px] leading-tight text-[var(--st-ink)] line-clamp-2">{deal.name}</span>
                <span className="mt-1.5 block text-[15px] font-bold text-[var(--st-ink)]">{inr(deal.price)} {deal.mrp && <s className="ml-1 text-[13px] font-medium text-[#8A97A8]">{inr(deal.mrp)}</s>}</span>
                <span className="mt-3 flex items-center gap-2 text-[12px] font-semibold text-[#4B5568]">Ends in <Countdown className="min-w-[30px] h-8 px-1.5 rounded-lg bg-[var(--st-ink)] text-white text-[13px] font-bold flex items-center justify-center tabular-nums" /></span>
              </span>
            </a>
          )}
          <div className={`relative overflow-hidden rounded-[32px] p-6 flex flex-col justify-between min-h-[200px] ${glass}`}>
            <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--st-accent)] to-[var(--st-accent-2)] text-white flex items-center justify-center shadow-[0_12px_24px_-12px_var(--st-accent-2)]"><Icon name="truck" size={22} /></span>
            <span>
              <span className="block font-display text-[22px] leading-tight text-[var(--st-ink)]">Free delivery</span>
              <span className="block mt-1 text-[13.5px] text-[#4B5568]">On orders over {inr(4999)}, dispatched in 48 hours.</span>
            </span>
          </div>
          {third && (
            <a href={shopHref({ cat: third.slug })} className="on-dark group relative min-h-[200px] overflow-hidden rounded-[32px] bg-[var(--st-ink-2)] text-white">
              <Photo src={third.image} alt="" width={600} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <span className="absolute inset-0 bg-gradient-to-t from-[var(--st-deep)]/80 to-transparent" />
              <span className="absolute left-5 bottom-5 font-display text-[22px] sm:text-[26px] leading-none">{third.name}</span>
            </a>
          )}
          {star && (
            <a href={`#/product/${star.id}`} className="on-dark group col-span-2 relative overflow-hidden rounded-[32px] bg-[var(--st-ink)] text-white p-6 flex items-center gap-5 min-h-[200px]">
              <span aria-hidden="true" className="absolute -left-10 -bottom-16 w-56 h-56 rounded-full bg-[var(--st-accent-2)]/40 blur-3xl" />
              <span className="relative min-w-0 flex-1">
                <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-[var(--st-accent-light)]">Bestseller</span>
                <span className="mt-1.5 block font-display text-[22px] sm:text-[28px] leading-tight line-clamp-2">{star.name}</span>
                <span className="mt-2 block text-[14px] text-white/70">{star.reviews.toLocaleString('en-IN')} reviews · {inr(star.price)}</span>
              </span>
              <span className="relative w-[34%] max-w-[180px] aspect-square rounded-[22px] overflow-hidden shrink-0">
                <Photo src={productPhotos(star)[0]} alt="" width={500} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
              </span>
            </a>
          )}
        </div>
      </section>

      <section className={`${T.shell} pt-14 sm:pt-20`}>
        <AuroraHeading eyebrow="Shop the edit" title={<>Picked for <em>you</em></>}>
          <div role="tablist" aria-label="Collections" className={`flex gap-1 p-1.5 rounded-full self-start sm:self-auto ${glass}`}>
            {(Object.keys(tabs) as (keyof typeof tabs)[]).map((key) => (
              <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={`h-10 px-5 rounded-full text-[13.5px] font-semibold transition-all ${tab === key ? 'bg-gradient-to-r from-[var(--st-accent)] to-[var(--st-accent-2)] text-white shadow-[0_8px_20px_-10px_var(--st-accent-2)]' : 'text-[#4B5568] hover:text-[var(--st-ink)]'}`}>{tabs[key][0]}</button>
            ))}
          </div>
        </AuroraHeading>
        <div key={tab} className="fade"><Grid products={tabs[tab][1].slice(0, 8)} className="grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5" /></div>
      </section>

      <section className={`${T.shell} pt-14 sm:pt-20`}>
        <AuroraHeading eyebrow="Loved by customers" title={<>Real people, <em>real reviews</em></>} />
        <div className="columns-1 md:columns-3 gap-4">
          {REVIEWS.map((r, i) => (
            <figure key={r.name} className={`mb-4 break-inside-avoid rounded-[28px] p-6 sm:p-7 ${glass}`}>
              <p className="text-[#F5B000] tracking-[0.15em]">★★★★★</p>
              <blockquote className={`mt-3 leading-relaxed text-[var(--st-ink)] ${i === 1 ? 'text-[19px] sm:text-[21px] font-semibold' : 'text-[16px]'}`}>“{r.text}”</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--st-accent)] to-[var(--st-accent-2)] text-white text-[13px] font-bold flex items-center justify-center">{r.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2)}</span>
                <span className="text-[14px] font-semibold text-[var(--st-ink)]">{r.name} <span className="font-normal text-[#8A97A8]">· {r.city}</span></span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className={`${T.shell} pt-10 sm:pt-14`}>
        <div className="rounded-[36px] p-[1.5px] bg-gradient-to-r from-[var(--st-accent)] via-[#F472B6] to-[var(--st-accent-2)]">
          <div className="on-dark relative overflow-hidden rounded-[34.5px] bg-[var(--st-ink)] text-white px-6 py-14 sm:py-16 text-center">
            <span aria-hidden="true" className="aurora-a absolute -top-24 left-[10%] w-[360px] h-[360px] rounded-full bg-[var(--st-accent)]/35 blur-[100px]" />
            <span aria-hidden="true" className="aurora-b absolute -bottom-24 right-[8%] w-[360px] h-[360px] rounded-full bg-[var(--st-accent-2)]/40 blur-[100px]" />
            <p className="relative text-[12.5px] font-bold uppercase tracking-[0.16em] text-[var(--st-accent-light)]">The newsletter</p>
            <h2 className="relative font-display mt-4 text-[34px] sm:text-[56px] leading-[1.02] max-w-3xl mx-auto">Be the first to <em>know</em>.</h2>
            <p className="relative mt-4 text-[16px] text-white/70">New drops, restocks and members-only prices, once a week.</p>
            {joined ? (
              <p role="status" className="relative mt-9 inline-flex items-center gap-2 text-[15px] font-semibold text-[#7DE0B5]"><Icon name="check" size={18} /> You&apos;re on the list.</p>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setJoined(true); }} className="relative mt-9 max-w-md mx-auto flex flex-col sm:flex-row gap-2 sm:p-1.5 sm:rounded-full sm:bg-white/10 sm:backdrop-blur-md sm:border sm:border-white/15">
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email address" aria-label="Email address" className="flex-1 min-w-0 h-12 px-5 rounded-full bg-white/10 sm:bg-transparent border border-white/15 sm:border-0 text-[15px] text-white placeholder:text-white/50 outline-none" />
                <button type="submit" className="h-12 px-7 rounded-full bg-gradient-to-r from-[var(--st-accent)] to-[var(--st-accent-2)] text-white text-[14px] font-semibold">Subscribe</button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
