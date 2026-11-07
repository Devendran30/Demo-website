'use client';

import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { couponsStore, ordersStore, subCategoriesStore, couponState, productPhotos, FREE_DELIVERY_FROM, themeVars, useStoreDetails } from '../demo-data';
import {
  T, Icon, Photo, useStore, useCatalog, useBag, useRoute, useScrolledPast, useAccount, toastStore, wishlistStore, myOrdersStore, sessionStore, showToast,
  navigate, rememberScroll, scrollMemory, navigation, shopHref, inr, useStoreTheme, layoutVars, STORE_CSS,
} from './store-kit';
import { HomePage, ShopPage, ProductPage, DealsPage, WishlistPage } from './catalog-pages';
import { ThemedHomePage } from './theme-homes';
import { BagPage, CheckoutPage, OrderPage, OrdersPage, AboutPage, ContactPage, NotFoundPage } from './account-pages';
import { AuthPage, AuthModal, AccountPage, openAuth } from './auth-pages';

// The storefront. Products, categories, coupons, banners, Instagram posts and orders all come from
// the admin panel (see ../demo-data.ts), so an edit there shows here at once, even in another tab.

// =============================================================================
// Announcement Bar (coupons the admin marked "Show in header")
// =============================================================================

function AnnouncementBar() {
  const coupons = useStore(couponsStore);
  const messages = [
    ...coupons
      .filter((c) => c.showInHeader && couponState(c) === 'Live')
      .map((c) => `Use ${c.code} — ${c.discountType === 'Percentage' ? `${c.discountValue}% off` : `${inr(c.discountValue)} off`} on orders over ${inr(c.minPurchase)}`),
    `Complimentary delivery on orders over ${inr(FREE_DELIVERY_FROM)}`,
    '7-day returns · Thoughtful jewellery care',
  ];
  const run = (hidden: boolean) => (
    <div aria-hidden={hidden} className="flex shrink-0 items-center">
      {messages.map((message, i) => (
        <span key={i} className="flex items-center whitespace-nowrap px-8">
          {message}
          <span className="ml-16 w-1 h-1 rounded-full bg-[var(--st-accent-2)]" />
        </span>
      ))}
    </div>
  );
  return (
    <div className="bg-[var(--st-deep)] text-[#C9D2DD] text-[12px] font-semibold tracking-[0.04em] h-10 overflow-hidden flex items-center group border-b border-white/5">
      <div className="marquee flex group-hover:[animation-play-state:paused]">
        {run(false)}
        {run(true)}
      </div>
    </div>
  );
}

// =============================================================================
// Header (mega menu, live search, mobile drawer)
// =============================================================================

const YEAR = new Date().getFullYear();

const NAV_LINKS = [
  { label: 'Home', href: '#/', page: 'home' },
  { label: 'New In', href: shopHref({ sort: 'newest' }), page: 'new' },
  { label: 'Offers', href: '#/deals', page: 'deals' },
  { label: 'About', href: '#/about', page: 'about' },
  { label: 'Contact Us', href: '#/contact', page: 'contact' },
];

/** The uploaded logo (Admin → Store Details). On dark backgrounds it sits on a white chip so dark logos stay visible. */
function LogoImage({ src, alt, light }: { src: string; alt: string; light: boolean }) {
  return (
    <span className={`inline-flex items-center ${light ? 'bg-white/95 rounded-xl px-2 py-1.5' : ''}`}>
      <img src={src} alt={alt} className="h-9 sm:h-10 w-auto max-w-[150px] object-contain" />
    </span>
  );
}

/** The brand mark beside the wordmark, drawn the way the live theme likes it. */
function Logo({ light = false }: { light?: boolean }) {
  const storeInfo = useStoreDetails();
  const { theme } = useStoreTheme();
  const [first = '', ...rest] = storeInfo.name.trim().split(/\s+/);
  const ink = light ? 'text-white' : 'text-[var(--st-ink)]';
  const image = storeInfo.logoUrl ? <LogoImage src={storeInfo.logoUrl} alt={storeInfo.showNameWithLogo ? '' : storeInfo.name} light={light} /> : null;
  if (image && !storeInfo.showNameWithLogo) return image;
  if (theme.layout === 'boutique') {
    if (image) {
      return (
        <span className="flex items-center gap-3">
          {image}
          <span className={`font-display text-[22px] sm:text-[26px] tracking-[0.06em] uppercase leading-none ${ink}`}>{storeInfo.name}</span>
        </span>
      );
    }
    return (
      <span className={`flex flex-col items-center leading-none ${ink}`}>
        <span className="font-display text-[26px] sm:text-[30px] tracking-[0.08em] uppercase">{first}</span>
        <span className={`mt-1 text-[9.5px] uppercase tracking-[0.5em] ${light ? 'text-white/60' : 'text-[#8A97A8]'}`}>{rest.join(' ')}</span>
      </span>
    );
  }
  if (theme.layout === 'aster') {
    if (image) return <span className="flex items-center gap-3">{image}<span className={`text-[20px] font-light tracking-[-0.04em] lowercase ${ink}`}>{storeInfo.name}</span></span>;
    return <span className={`text-[22px] font-light tracking-[-0.04em] lowercase ${ink}`}>{first}<span className="text-[var(--st-accent)]">.</span>{rest.join('').toLowerCase()}</span>;
  }
  if (theme.layout === 'atelier') {
    return (
      <span className="flex items-center gap-2.5">
        {image ?? (
          <span className="w-10 h-10 shrink-0 rounded-full p-px bg-gradient-to-br from-[var(--st-accent-light)] via-[var(--st-accent-light)]/30 to-[var(--st-accent-light)]">
            <span className="w-full h-full rounded-full bg-[var(--st-ink)] flex items-center justify-center font-display italic text-[20px] font-semibold text-[var(--st-accent-light)]">{first[0]}</span>
          </span>
        )}
        <span className={`font-display text-[21px] sm:text-[23px] font-semibold tracking-[0.01em] whitespace-nowrap ${ink}`}>{storeInfo.name}</span>
      </span>
    );
  }
  if (theme.layout === 'aurora') {
    return (
      <span className="flex items-center gap-2.5">
        {image ?? (
          <span className="relative w-9 h-9 rounded-full bg-[conic-gradient(from_200deg,var(--st-accent),var(--st-accent-2),#F472B6,var(--st-accent))] shadow-[0_8px_20px_-8px_var(--st-accent-2)]">
            <span className="absolute inset-[9px] rounded-full bg-white/90" />
          </span>
        )}
        <span className={`text-[17px] sm:text-[19px] font-bold tracking-[-0.04em] whitespace-nowrap ${ink}`}>{first}<span className="hidden sm:inline">{rest.length ? ` ${rest.join(' ')}` : ''}</span><span className="text-[var(--st-accent-2)]">.</span></span>
      </span>
    );
  }
  if (theme.layout === 'volt') {
    return (
      <span className="flex items-center gap-2.5">
        {image ?? <span className="w-10 h-10 bg-[var(--st-ink)] border-2 border-[var(--st-ink)] shadow-[3px_3px_0_var(--st-accent)] flex items-center justify-center text-[var(--st-accent-light)] text-[22px] font-bold">{first[0]}</span>}
        <span className={`text-[21px] font-bold uppercase tracking-[-0.05em] ${ink}`}>{first}<span className="hidden sm:inline"><span className="text-[var(--st-accent)]">/</span>{rest.join('')}</span></span>
      </span>
    );
  }
  const tile = theme.layout === 'marketplace'
    ? 'rounded-[10px] bg-[var(--st-accent)]'
    : theme.layout === 'lifestyle'
      ? 'rounded-full bg-gradient-to-br from-[var(--st-accent)] to-[var(--st-accent-2)]'
      : 'rounded-[12px] bg-gradient-to-br from-[var(--st-accent)] via-[var(--st-ink-3)] to-[var(--st-ink)] shadow-[0_8px_20px_-8px_color-mix(in_srgb,var(--st-accent)_70%,transparent)] ring-1 ring-white/20';
  return (
    <span className="flex items-center gap-3">
      {image ?? (
        <span className={`relative w-10 h-10 flex items-center justify-center ${tile}`}>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24">
            <path d="M6 4h6a8 8 0 0 1 0 16H6z" fill="none" stroke="white" strokeWidth="2.6" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="2.4" fill="#C9D2DD" />
          </svg>
        </span>
      )}
      <span className={`flex flex-col leading-none transition-colors duration-500 ${ink}`}>
        <span className="text-[20px] font-extrabold tracking-[-0.04em]">{first}</span>
        <span className={`text-[10px] font-semibold uppercase tracking-[0.34em] mt-1 ${light ? 'text-white/60' : 'text-[#8A97A8]'}`}>{rest.join(' ')}</span>
      </span>
    </span>
  );
}

function CountBadge({ count }: { count: number }) {
  if (!count) return null;
  return <span className="absolute top-1 right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[var(--st-accent)] text-white text-[10px] flex items-center justify-center tabular-nums">{count}</span>;
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const { products, colorHex } = useCatalog();
  const [query, setQuery] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matches = words.length
    ? products.filter((p) => {
      const text = `${p.name} ${p.category} ${p.subCategory} ${p.tags.join(' ')} ${p.colors.join(' ')}`.toLowerCase();
      return words.every((w) => text.includes(w));
    }).slice(0, 6)
    : [];

  useEffect(() => {
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = (e: FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(shopHref({ q: query.trim() }));
    onClose();
  };

  return (
    <div className="absolute inset-x-0 top-full bg-white border-b border-[#E3E8EF] shadow-[0_30px_60px_-30px_rgba(14,26,43,0.25)] drop">
      <div className={`${T.shell} py-10`}>
        <form role="search" onSubmit={submit} className="flex items-center gap-4 border-b border-[var(--st-ink)] pb-3">
          <Icon name="search" size={22} stroke={1.3} />
          <input
            ref={input}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search necklaces, earrings, rings…"
            aria-label="Search products"
            className={`flex-1 bg-transparent outline-none ${T.display} text-[30px] sm:text-[40px] placeholder:text-[#A9B4C2]`}
          />
          <button type="button" onClick={onClose} aria-label="Close search" className="w-10 h-10 flex items-center justify-center"><Icon name="close" /></button>
        </form>
        {words.length > 0 && (
          <div className="mt-8">
            {matches.length ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
                  {matches.map((p) => (
                    <a key={p.id} href={`#/product/${p.id}`} onClick={onClose} className="group">
                      <div className="aspect-[4/5] overflow-hidden bg-[#EDF1F6]">
                        <Photo src={productPhotos(p)[0]} alt="" width={300} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
                      </div>
                      <p className="mt-3 text-[13.5px] leading-snug group-hover:text-[var(--st-accent)]">{p.name}</p>
                      <p className="text-[13px] text-[#5B6B80] flex items-center gap-2">{inr(p.price)}{p.colors.slice(0, 3).map((c) => <span key={c} className="w-2.5 h-2.5 rounded-full ring-1 ring-black/10" style={{ backgroundColor: colorHex[c] }} />)}</p>
                    </a>
                  ))}
                </div>
                <button onClick={submit} className="mt-8 text-[11.5px] uppercase tracking-[0.2em] border-b border-[var(--st-ink)]/40 hover:border-[var(--st-ink)] pb-1">See all results for “{query.trim()}”</button>
              </>
            ) : (
              <p className="text-[15px] text-[#5B6B80]">No pieces match “{query.trim()}”. Try a category, like <button onClick={() => setQuery('necklaces')} className="border-b border-current">necklaces</button>.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SiteHeader({ page, params }: { page: string; params: URLSearchParams }) {
  const storeInfo = useStoreDetails();
  const { categories, products } = useCatalog();
  const subCategories = useStore(subCategoriesStore);
  const { count: bagCount } = useBag();
  const wishlist = useStore(wishlistStore);
  const account = useAccount();
  const [menuOpen, setMenuOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(page === 'shop');

  // Keep the page still behind the side menu.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);
  const [megaOpen, setMegaOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { theme, style: look } = useStoreTheme();
  const variant = look.header;
  const activeNav = page === 'shop' && params.get('sort') === 'newest' ? 'new' : page;
  const scrolled = useScrolledPast(40);
  // Default theme: on the home page the header floats over the hero photo until you scroll or open a menu.
  const overlay = variant === 'overlay' && page === 'home' && !scrolled && !megaOpen && !searchOpen;
  // Atelier's header is always midnight, so it uses the light-on-dark controls.
  const onDark = overlay || variant === 'slim';
  const iconLink = `relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors ${onDark ? 'hover:bg-white/10' : 'hover:bg-[#EDF1F6] hover:text-[var(--st-accent)]'}`;
  const navItem = variant === 'centered'
    ? 'px-1 py-2 text-[11.5px] font-medium uppercase tracking-[0.24em] border-b border-transparent hover:border-[var(--st-ink)] transition-colors'
    : theme.layout === 'volt'
      ? 'px-3 py-2 text-[14px] font-bold uppercase tracking-[-0.01em] border-2 border-transparent hover:border-[var(--st-ink)] transition-colors'
      : `px-4 py-2 rounded-full text-[14.5px] ${theme.layout === 'aster' ? 'font-normal' : 'font-semibold'} tracking-[-0.01em] transition-colors ${overlay ? 'hover:bg-white/10' : 'hover:bg-[#EDF1F6]'}`;
  const navActive = variant === 'centered'
    ? 'border-[var(--st-ink)]'
    : theme.layout === 'volt'
      ? 'bg-[var(--st-accent-light)] border-[var(--st-ink)]'
      : overlay ? 'bg-white/15' : 'bg-[var(--st-ink)] text-white hover:bg-[var(--st-ink)]';
  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(shopHref({ q: query.trim() }));
    setQuery('');
  };
  const closeAll = () => {
    setMenuOpen(false);
    setMegaOpen(false);
    setSearchOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-[border-color,color] duration-500 ${variant === 'floating'
        ? 'px-3 sm:px-6 pt-3 text-[var(--st-ink)]'
        : variant === 'slim'
          ? 'text-white'
          : theme.layout === 'volt' ? 'border-b-[3px] border-[var(--st-ink)] text-[var(--st-ink)]' : `border-b ${overlay ? 'border-white/10 text-white' : 'border-[#E3E8EF] text-[var(--st-ink)] shadow-[0_10px_30px_-25px_rgba(14,26,43,0.5)]'}`}`}
      onMouseLeave={() => setMegaOpen(false)}
    >
      {/* Frosted background on its own layer: a backdrop-filter on <header> would trap the fixed side menu inside it. */}
      {variant !== 'floating' && <span aria-hidden="true" className={`absolute inset-0 -z-10 transition-opacity duration-500 ${theme.layout === 'volt' ? 'bg-[var(--st-page)]' : variant === 'slim' ? 'bg-[var(--st-deep)]/95 backdrop-blur-xl border-b border-[var(--st-accent-light)]/25' : 'bg-white/85 backdrop-blur-xl'} ${overlay ? 'opacity-0' : 'opacity-100'}`} />}
      {variant === 'slim' ? (
        // Atelier: a slim midnight bar with champagne engraved-capital links
        <div className={`${T.shell} flex items-center justify-between gap-4 h-[64px]`}>
          <a href="#/" onClick={closeAll} aria-label={`${storeInfo.name} home`} className="shrink-0"><Logo light /></a>
          <nav aria-label="Main" className="hidden lg:flex flex-1 items-center justify-center gap-8">
            <a href="#/" onMouseEnter={() => setMegaOpen(false)} aria-current={activeNav === 'home' ? 'page' : undefined} className={`[font-family:var(--font-cinzel)] text-[11.5px] uppercase tracking-[0.2em] transition-colors ${activeNav === 'home' ? 'font-semibold text-[var(--st-accent-light)]' : 'text-white/75 hover:text-[var(--st-accent-light)]'}`}>Home</a>
            <button onMouseEnter={() => setMegaOpen(true)} onFocus={() => setMegaOpen(true)} onClick={() => { closeAll(); navigate('#/shop'); }} aria-expanded={megaOpen} className={`[font-family:var(--font-cinzel)] text-[11.5px] uppercase tracking-[0.2em] transition-colors ${page === 'shop' && activeNav !== 'new' ? 'font-semibold text-[var(--st-accent-light)]' : 'text-white/75 hover:text-[var(--st-accent-light)]'}`}>Shop</button>
            {NAV_LINKS.filter((link) => link.page !== 'home').map((link) => (
              <a key={link.page} href={link.href} onMouseEnter={() => setMegaOpen(false)} aria-current={activeNav === link.page ? 'page' : undefined} className={`[font-family:var(--font-cinzel)] text-[11.5px] uppercase tracking-[0.2em] transition-colors ${activeNav === link.page ? 'font-semibold text-[var(--st-accent-light)]' : 'text-white/75 hover:text-[var(--st-accent-light)]'}`}>{link.label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-0.5 -mr-2 [&>*]:w-9 [&>*]:h-9">
            <button onClick={() => { setSearchOpen(!searchOpen); setMegaOpen(false); }} aria-label="Search" aria-expanded={searchOpen} className={iconLink}><Icon name="search" size={18} /></button>
            <AccountMenu overlay />
            <a href="#/wishlist" aria-label={`Wishlist, ${wishlist.length} items`} className={`${iconLink} hidden sm:flex`}><Icon name="heart" size={18} /><CountBadge count={wishlist.length} /></a>
            <a href="#/bag" aria-label={`Bag, ${bagCount} items`} className={iconLink}><Icon name="bag" size={18} /><CountBadge count={bagCount} /></a>
            <button onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen} className={`${iconLink} lg:hidden`}><Icon name="menu" size={18} /></button>
          </div>
        </div>
      ) : variant === 'floating' ? (
        // Aurora: a frosted pill that floats over the page, with a gradient "you are here" pill
        <div className="relative mx-auto max-w-[1360px] h-16 rounded-full bg-white/75 backdrop-blur-xl backdrop-saturate-150 border border-white/80 ring-1 ring-[var(--st-ink)]/[0.06] shadow-[0_18px_40px_-24px_rgba(11,18,32,0.45)] flex items-center justify-between gap-3 pl-4 pr-2 sm:pl-6">
          <a href="#/" onClick={closeAll} aria-label={`${storeInfo.name} home`} className="shrink-0"><Logo /></a>
          <nav aria-label="Main" className="hidden lg:flex items-center gap-1">
            <a href="#/" onMouseEnter={() => setMegaOpen(false)} aria-current={activeNav === 'home' ? 'page' : undefined} className={`px-4 py-2 rounded-full text-[14px] font-semibold transition-colors ${activeNav === 'home' ? 'bg-gradient-to-r from-[var(--st-accent)] to-[var(--st-accent-2)] text-white shadow-[0_8px_20px_-10px_var(--st-accent-2)]' : 'text-[var(--st-ink)]/80 hover:bg-[var(--st-ink)]/[0.05]'}`}>Home</a>
            <button onMouseEnter={() => setMegaOpen(true)} onFocus={() => setMegaOpen(true)} onClick={() => { closeAll(); navigate('#/shop'); }} aria-expanded={megaOpen} className={`px-4 py-2 rounded-full text-[14px] font-semibold flex items-center gap-1.5 transition-colors ${page === 'shop' && activeNav !== 'new' ? 'bg-gradient-to-r from-[var(--st-accent)] to-[var(--st-accent-2)] text-white shadow-[0_8px_20px_-10px_var(--st-accent-2)]' : 'text-[var(--st-ink)]/80 hover:bg-[var(--st-ink)]/[0.05]'}`}>
              Shop <span className={`transition-transform duration-300 ${megaOpen ? 'rotate-180' : ''}`}><Icon name="chevron" size={14} stroke={2} /></span>
            </button>
            {NAV_LINKS.filter((link) => link.page !== 'home').map((link) => (
              <a key={link.page} href={link.href} onMouseEnter={() => setMegaOpen(false)} aria-current={activeNav === link.page ? 'page' : undefined} className={`px-4 py-2 rounded-full text-[14px] font-semibold transition-colors ${activeNav === link.page ? 'bg-gradient-to-r from-[var(--st-accent)] to-[var(--st-accent-2)] text-white shadow-[0_8px_20px_-10px_var(--st-accent-2)]' : 'text-[var(--st-ink)]/80 hover:bg-[var(--st-ink)]/[0.05]'}`}>{link.label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-0.5 sm:gap-1">
            <button onClick={() => { setSearchOpen(!searchOpen); setMegaOpen(false); }} aria-label="Search" aria-expanded={searchOpen} className={iconLink}><Icon name="search" /></button>
            <AccountMenu overlay={false} />
            <a href="#/wishlist" aria-label={`Wishlist, ${wishlist.length} items`} className={`${iconLink} hidden sm:flex`}><Icon name="heart" /><CountBadge count={wishlist.length} /></a>
            <a href="#/bag" aria-label={`Bag, ${bagCount} items`} className={iconLink}><Icon name="bag" /><CountBadge count={bagCount} /></a>
            <a href="#/shop" className="hidden xl:inline-flex items-center gap-1.5 ml-2 h-11 px-5 rounded-full bg-[var(--st-ink)] text-white text-[13.5px] font-semibold hover:bg-[var(--st-ink-3)] transition-colors">Shop now <Icon name="arrow" size={15} /></a>
            <button onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen} className={`${iconLink} lg:hidden`}><Icon name="menu" /></button>
          </div>
        </div>
      ) : variant === 'market' ? (
        <>
          {/* Marketplace: a utility strip, a wide search bar and a coloured category bar */}
          <div className="hidden md:block border-b border-[#E3E8EF] bg-[var(--st-page)] text-[12.5px] text-[#5B6B80]">
            <div className={`${T.shell} h-9 flex items-center justify-between`}>
              <span className="flex items-center gap-2"><Icon name="phone" size={14} /> {storeInfo.phone} · {storeInfo.hours}</span>
              <span className="flex items-center gap-5">
                <a href="#/orders" className="hover:text-[var(--st-accent)]">Track order</a>
                <a href="#/help" className="hover:text-[var(--st-accent)]">Help centre</a>
                <span>English · ₹ INR</span>
              </span>
            </div>
          </div>
          <div className={`${T.shell} flex items-center gap-3 sm:gap-8 h-[68px] lg:h-[80px]`}>
            <a href="#/" onClick={closeAll} aria-label={`${storeInfo.name} home`} className="shrink-0"><Logo /></a>
            <form role="search" onSubmit={submitSearch} className="hidden md:flex flex-1 max-w-3xl h-12 rounded-[8px] border-2 border-[var(--st-accent)] overflow-hidden bg-white">
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search for products, brands and more" aria-label="Search products" className="flex-1 min-w-0 px-4 text-[14px] outline-none" />
              <button type="submit" aria-label="Search" className="px-6 bg-[var(--st-accent)] text-white flex items-center gap-2 text-[14px] font-semibold"><Icon name="search" size={18} /> <span className="hidden lg:inline">Search</span></button>
            </form>
            <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
              <button onClick={() => setSearchOpen(!searchOpen)} aria-label="Search" className={`${iconLink} md:hidden`}><Icon name="search" /></button>
              <AccountMenu overlay={false} />
              <a href="#/wishlist" aria-label={`Wishlist, ${wishlist.length} items`} className={iconLink}><Icon name="heart" /><CountBadge count={wishlist.length} /></a>
              <a href="#/bag" aria-label={`Bag, ${bagCount} items`} className="relative ml-1 hidden sm:flex items-center gap-2 h-11 pl-3 pr-4 rounded-[8px] bg-[var(--st-accent-soft)] text-[var(--st-accent)] font-semibold text-[14px]">
                <Icon name="bag" /> Cart{bagCount > 0 && <span className="min-w-[20px] h-5 px-1 rounded-full bg-[var(--st-accent)] text-white text-[11px] flex items-center justify-center">{bagCount}</span>}
              </a>
              <a href="#/bag" aria-label={`Bag, ${bagCount} items`} className={`${iconLink} sm:hidden`}><Icon name="bag" /><CountBadge count={bagCount} /></a>
              <button onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen} className={`${iconLink} lg:hidden -mr-2`}><Icon name="menu" /></button>
            </div>
          </div>
          <nav aria-label="Main" className="hidden lg:block bg-[var(--st-accent)] text-white">
            <div className={`${T.shell} flex items-center h-12`}>
              <button onMouseEnter={() => setMegaOpen(true)} onFocus={() => setMegaOpen(true)} onClick={() => { closeAll(); navigate('#/shop'); }} aria-expanded={megaOpen} className="h-12 px-5 -ml-5 mr-3 bg-black/15 flex items-center gap-2.5 text-[14px] font-semibold">
                <Icon name="menu" size={18} /> All categories <Icon name="chevron" size={14} stroke={2} />
              </button>
              {NAV_LINKS.map((link) => (
                <a key={link.page} href={link.href} onMouseEnter={() => setMegaOpen(false)} aria-current={activeNav === link.page ? 'page' : undefined} className={`h-12 px-4 flex items-center text-[14px] font-medium transition-colors ${activeNav === link.page ? 'bg-white/20' : 'hover:bg-white/10'}`}>{link.label}</a>
              ))}
              <a href="#/deals" className="ml-auto flex items-center gap-2 text-[14px] font-semibold"><Icon name="bolt" size={16} /> Today&apos;s deals</a>
            </div>
          </nav>
        </>
      ) : variant === 'centered' ? (
        <>
          {/* Boutique: search on the left, the wordmark in the middle, a quiet uppercase menu below */}
          <div className={`${T.shell} grid grid-cols-[1fr_auto_1fr] items-center gap-3 h-[76px] lg:h-[96px]`}>
            <div className="flex items-center gap-1 -ml-2">
              <button onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen} className={`${iconLink} lg:hidden`}><Icon name="menu" /></button>
              <button onClick={() => { setSearchOpen(!searchOpen); setMegaOpen(false); }} aria-label="Search" aria-expanded={searchOpen} className={`${iconLink} lg:w-auto lg:px-3 lg:gap-2.5`}>
                <Icon name="search" /><span className="hidden lg:inline text-[11.5px] uppercase tracking-[0.24em]">Search</span>
              </button>
            </div>
            <a href="#/" onClick={closeAll} aria-label={`${storeInfo.name} home`}><Logo /></a>
            <div className="flex items-center justify-end gap-0.5 sm:gap-1 -mr-2">
              <AccountMenu overlay={false} />
              <a href="#/wishlist" aria-label={`Wishlist, ${wishlist.length} items`} className={iconLink}><Icon name="heart" /><CountBadge count={wishlist.length} /></a>
              <a href="#/bag" aria-label={`Bag, ${bagCount} items`} className={iconLink}><Icon name="bag" /><CountBadge count={bagCount} /></a>
            </div>
          </div>
          <nav aria-label="Main" className="hidden lg:flex justify-center gap-10 h-12 items-center border-t border-[#E3E8EF]">
            <a href="#/" onMouseEnter={() => setMegaOpen(false)} aria-current={activeNav === 'home' ? 'page' : undefined} className={`${navItem} ${activeNav === 'home' ? navActive : ''}`}>Home</a>
            <button onMouseEnter={() => setMegaOpen(true)} onFocus={() => setMegaOpen(true)} onClick={() => { closeAll(); navigate('#/shop'); }} aria-expanded={megaOpen} className={`${navItem} ${page === 'shop' && activeNav !== 'new' ? navActive : ''}`}>Shop</button>
            {NAV_LINKS.filter((link) => link.page !== 'home').map((link) => (
              <a key={link.page} href={link.href} onMouseEnter={() => setMegaOpen(false)} aria-current={activeNav === link.page ? 'page' : undefined} className={`${navItem} ${activeNav === link.page ? navActive : ''}`}>{link.label}</a>
            ))}
          </nav>
        </>
      ) : (
      <div className={`${T.shell} flex items-center justify-between gap-3 sm:gap-6 h-[72px] lg:h-[84px]`}>
        <a href="#/" onClick={closeAll} aria-label={`${storeInfo.name} home`} className="shrink-0"><Logo light={overlay} /></a>

        <div className={`flex items-center gap-2 lg:gap-10 ${variant === 'inline' ? 'lg:flex-1 lg:justify-between lg:pl-10' : ''}`}>
          <nav aria-label="Main" className={`hidden lg:flex items-center gap-1 ${variant === 'inline' ? 'lg:flex-1 lg:justify-center' : ''}`}>
            <a href="#/" onMouseEnter={() => setMegaOpen(false)} aria-current={activeNav === 'home' ? 'page' : undefined} className={`${navItem} ${activeNav === 'home' ? navActive : ''}`}>
              Home
            </a>
            <button
              onMouseEnter={() => setMegaOpen(true)}
              onFocus={() => setMegaOpen(true)}
              onClick={() => { closeAll(); navigate('#/shop'); }}
              aria-expanded={megaOpen}
              className={`${navItem} ${page === 'shop' && activeNav !== 'new' ? navActive : ''} flex items-center gap-1.5`}
            >
              Shop <span className={`transition-transform duration-300 ${megaOpen ? 'rotate-180' : ''}`}><Icon name="chevron" size={14} stroke={2} /></span>
            </button>
            {NAV_LINKS.filter((link) => link.page !== 'home').map((link) => (
              <a key={link.page} href={link.href} onMouseEnter={() => setMegaOpen(false)} aria-current={activeNav === link.page ? 'page' : undefined} className={`${navItem} ${activeNav === link.page ? navActive : ''}`}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className={`flex items-center gap-0.5 sm:gap-1 ${variant === 'overlay' ? `lg:pl-8 lg:border-l ${overlay ? 'lg:border-white/20' : 'lg:border-[#E3E8EF]'}` : ''}`}>
            <button onClick={() => { setSearchOpen(!searchOpen); setMegaOpen(false); }} aria-label="Search" aria-expanded={searchOpen} className={iconLink}><Icon name="search" /></button>
            <AccountMenu overlay={overlay} />
            <a href="#/wishlist" aria-label={`Wishlist, ${wishlist.length} items`} className={iconLink}>
              <Icon name="heart" />
              <CountBadge count={wishlist.length} />
            </a>
            <a href="#/bag" aria-label={`Bag, ${bagCount} items`} className={iconLink}>
              <Icon name="bag" />
              <CountBadge count={bagCount} />
            </a>
            <button onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen} className={`${iconLink} lg:hidden -mr-2`}><Icon name="menu" /></button>
          </div>
        </div>
      </div>
      )}

      {/* Mega menu */}
      {megaOpen && !searchOpen && (
        <div className="hidden lg:block absolute inset-x-0 top-full bg-white border-b border-[#E3E8EF] shadow-[0_30px_60px_-30px_rgba(14,26,43,0.25)] drop">
          <div className={`${T.shell} py-12 grid grid-cols-[1fr_340px] gap-16`}>
            <div className="grid grid-cols-4 gap-x-10 gap-y-9">
              {categories.map((c) => (
                <div key={c.id}>
                  <a href={shopHref({ cat: c.slug })} onClick={closeAll} className={`${T.display} text-[19px] leading-none hover:text-[var(--st-accent)] transition-colors`}>{c.name}</a>
                  <ul className="mt-3.5 space-y-2">
                    {subCategories.filter((sc) => sc.status === 'Active' && sc.parentCategory === c.name && products.some((p) => p.subCategory === sc.name)).map((sc) => (
                      <li key={sc.id}><a href={shopHref({ cat: c.slug, sub: sc.name })} onClick={closeAll} className="text-[13.5px] text-[#5B6B80] hover:text-[var(--st-ink)]">{sc.name}</a></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            {categories[0] && (
              <a href={shopHref({ sort: 'newest' })} onClick={closeAll} className="group relative aspect-[4/5] overflow-hidden rounded-[24px] bg-[var(--st-ink-2)] text-white on-dark">
                <Photo src={categories[1]?.image ?? categories[0].image} alt="" width={700} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.05]" />
                <span className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <span className="absolute left-6 bottom-6">
                  <span className="block text-[10.5px] uppercase tracking-[0.26em] text-white/80 mb-2">Just arrived</span>
                  <span className={`${T.display} text-[32px] leading-none`}>The new <em>season</em></span>
                </span>
              </a>
            )}
          </div>
        </div>
      )}

      {searchOpen && <SearchPanel onClose={() => setSearchOpen(false)} />}

      {/* Compact screens use a side menu with the same links as the desktop header */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-[var(--st-deep)]/50 backdrop-blur-sm fade" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
          <nav className="drawer-right absolute right-0 top-0 h-[100dvh] w-[86%] max-w-[360px] bg-white text-[var(--st-ink)] flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.25)]" aria-label="Mobile">
            <div className="shrink-0 flex items-center justify-between px-5 h-[72px] border-b border-[#E3E8EF]">
              <Logo />
              <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="w-10 h-10 rounded-full bg-[var(--st-page)] flex items-center justify-center"><Icon name="close" size={18} /></button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-4 space-y-1">
              {[NAV_LINKS[0], { label: 'Shop', href: '#/shop', page: 'shop' }, ...NAV_LINKS.slice(1)].map((link, i) => {
                const active = link.page === 'shop' ? page === 'shop' && activeNav !== 'new' : activeNav === link.page;
                const row = `rise flex items-center justify-between w-full px-4 h-[52px] rounded-[16px] text-[16px] font-semibold transition-colors ${active ? 'bg-[var(--st-ink)] text-white' : 'hover:bg-[var(--st-page)]'}`;
                if (link.page !== 'shop') {
                  return (
                    <a key={link.page} href={link.href} onClick={closeAll} aria-current={active ? 'page' : undefined} style={{ animationDelay: `${80 + i * 45}ms` }} className={row}>
                      {link.label}
                      <span className={active ? 'text-white/70' : 'text-[#A9B4C2]'}><Icon name="arrow" size={16} /></span>
                    </a>
                  );
                }
                // Shop opens a list of every category, like the desktop mega menu.
                return (
                  <div key="shop" className="rise" style={{ animationDelay: `${80 + i * 45}ms` }}>
                    <button onClick={() => setShopOpen(!shopOpen)} aria-expanded={shopOpen} className={row.replace('rise ', '')}>
                      Shop
                      <span className={`transition-transform duration-300 ${shopOpen ? 'rotate-180' : ''} ${active ? 'text-white/70' : 'text-[#6F7E92]'}`}><Icon name="chevron" size={18} stroke={2} /></span>
                    </button>
                    <div className={`grid transition-[grid-template-rows] duration-400 ease-out ${shopOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                      <div className="overflow-hidden">
                        <div className="mt-1.5 mb-2 ml-3 pl-3 border-l-2 border-[#E3E8EF] space-y-0.5">
                          <a href="#/shop" onClick={closeAll} className="flex items-center gap-3 px-2 py-2 rounded-[14px] hover:bg-[var(--st-page)]">
                            <span className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-[var(--st-accent)] to-[var(--st-ink)] text-white flex items-center justify-center"><Icon name="bag" size={17} /></span>
                            <span className="flex-1 text-[14.5px] font-semibold">All products</span>
                            <span className="text-[12px] font-semibold text-[#8A97A8]">{products.length}</span>
                          </a>
                          {categories.map((c) => (
                            <a key={c.id} href={shopHref({ cat: c.slug })} onClick={closeAll} className="flex items-center gap-3 px-2 py-2 rounded-[14px] hover:bg-[var(--st-page)]">
                              <Photo src={c.image} alt="" width={120} className="w-10 h-10 rounded-[12px] object-cover bg-[#EDF1F6]" />
                              <span className="flex-1 text-[14.5px] font-semibold">{c.name}</span>
                              <span className="text-[12px] font-semibold text-[#8A97A8]">{products.filter((p) => p.category === c.name).length}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Account: sign in / create account, or who you are */}
            <div className="shrink-0 border-t border-[#E3E8EF] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-[var(--st-page)]">
              {account ? (
                <>
                  <a href="#/account" onClick={closeAll} className="flex items-center gap-3 p-2.5 rounded-[18px] bg-white border border-[#E3E8EF]">
                    <span className="relative w-11 h-11 rounded-full bg-gradient-to-br from-[var(--st-accent)] to-[var(--st-accent-2)] text-white text-[14px] font-extrabold flex items-center justify-center">
                      {account.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#22C55E] ring-2 ring-white" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[15px] font-bold truncate">{account.name}</span>
                      <span className="block text-[12.5px] text-[#6F7E92] truncate">{account.email}</span>
                    </span>
                    <span className="text-[#A9B4C2]"><Icon name="arrow" size={16} /></span>
                  </a>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <a href="#/orders" onClick={closeAll} className="h-11 rounded-full bg-white border border-[#E3E8EF] flex items-center justify-center gap-2 text-[14px] font-semibold"><Icon name="box" size={16} /> My orders</a>
                    <button
                      onClick={() => { closeAll(); sessionStore.set(''); showToast('You’ve been signed out', null); navigate('#/', { replace: true }); }}
                      className="h-11 rounded-full bg-[#FDECEC] text-[#D23B3B] flex items-center justify-center gap-2 text-[14px] font-semibold"
                    >
                      <Icon name="logout" size={16} /> Sign out
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="px-1 mb-3 text-[13px] text-[#5B6B80]">Track orders and check out faster.</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => { closeAll(); openAuth('signin'); }} className="h-12 rounded-full bg-white border border-[#CFD8E3] text-[14.5px] font-bold hover:border-[var(--st-ink)] transition-colors">Sign in</button>
                    <button onClick={() => { closeAll(); openAuth('signup'); }} className="h-12 rounded-full bg-gradient-to-r from-[var(--st-accent)] to-[var(--st-accent-2)] text-white text-[14.5px] font-bold shadow-[0_12px_26px_-12px_color-mix(in_srgb,var(--st-accent)_80%,transparent)]">Sign up</button>
                  </div>
                </>
              )}
            </div>
          </nav>
        </div>
      )}

    </header>
  );
}

// =============================================================================
// Account Menu (signed-in name in the header, with live order tracking)
// =============================================================================

const TRACK_STEPS = ['Pending', 'Processing', 'Shipped', 'Delivered'] as const;
const TRACK_LABELS = ['Placed', 'Packing', 'On the way', 'Delivered'];

function AccountMenu({ overlay }: { overlay: boolean }) {
  const account = useAccount();
  const orders = useStore(ordersStore);
  const myIds = useStore(myOrdersStore);
  const wishlist = useStore(wishlistStore);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!account) {
    return (
      <button
        onClick={() => openAuth('signin')}
        aria-label="Sign in or create an account"
        title="Sign in or create an account"
        className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors ${overlay ? 'hover:bg-white/10' : 'hover:bg-[#EDF1F6] hover:text-[var(--st-accent)]'}`}
      >
        <Icon name="user" />
      </button>
    );
  }

  const first = account.name.split(/\s+/)[0];
  const initials = account.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const mine = orders.filter((o) => o.email.toLowerCase() === account.email || myIds.includes(o.id));
  const active = mine.filter((o) => o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled');
  const tracking = active[0];
  const reached = tracking ? TRACK_STEPS.indexOf(tracking.orderStatus as (typeof TRACK_STEPS)[number]) : -1;
  const go = () => setOpen(false);
  const signOut = () => {
    setOpen(false);
    sessionStore.set('');
    showToast('You’ve been signed out', null);
    navigate('#/', { replace: true });
  };

  return (
    <div ref={box} className="sm:relative">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Account menu for ${account.name}`}
        className={`flex items-center gap-2.5 h-9 sm:h-10 pl-0.5 sm:pl-1 pr-0.5 sm:pr-3.5 rounded-full border transition-all ${overlay ? 'border-white/20 bg-white/10 hover:bg-white/15' : 'border-[#E3E8EF] bg-white hover:border-[var(--st-accent)]/40 hover:shadow-[0_8px_20px_-12px_color-mix(in_srgb,var(--st-accent)_60%,transparent)]'}`}
      >
        <span className="relative w-8 h-8 rounded-full bg-gradient-to-br from-[var(--st-accent)] to-[var(--st-accent-2)] text-white text-[12px] font-extrabold flex items-center justify-center">
          {initials}
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#22C55E] ring-2 ring-white" />
        </span>
        <span className="hidden sm:block text-left leading-none">
          <span className={`block text-[10.5px] font-semibold ${overlay ? 'text-white/60' : 'text-[#8A97A8]'}`}>Hello,</span>
          <span className="block text-[13.5px] font-bold mt-0.5 max-w-[90px] truncate">{first}</span>
        </span>
        <span className={`hidden sm:block transition-transform duration-300 ${open ? 'rotate-180' : ''}`}><Icon name="chevron" size={14} stroke={2} /></span>
      </button>

      {open && (
        <div role="menu" className="drop absolute left-3 right-3 top-full mt-2 sm:left-auto sm:right-0 sm:mt-3 sm:w-[360px] max-h-[calc(100vh-130px)] overflow-y-auto rounded-[26px] bg-white text-[var(--st-ink)] ring-1 ring-[var(--st-ink)]/[0.08] shadow-[0_40px_80px_-30px_rgba(14,26,43,0.55)] overflow-hidden">
          {/* Identity */}
          <div className="on-dark relative overflow-hidden bg-gradient-to-br from-[var(--st-ink)] via-[var(--st-ink-2)] to-[var(--st-deep)] text-white p-5">
            <span aria-hidden="true" className="pointer-events-none absolute -top-16 -right-10 w-48 h-48 rounded-full bg-[var(--st-accent)]/40 blur-[60px]" />
            <div className="relative flex items-center gap-3.5">
              <span className="w-14 h-14 rounded-[18px] bg-gradient-to-br from-[var(--st-accent)] to-[var(--st-accent-2)] text-[18px] font-extrabold flex items-center justify-center shadow-[0_10px_24px_-8px_color-mix(in_srgb,var(--st-accent)_80%,transparent)]">{initials}</span>
              <div className="min-w-0">
                <p className="text-[17px] font-extrabold tracking-[-0.02em] truncate">{account.name}</p>
                <p className="text-[12.5px] text-white/60 truncate">{account.email}</p>
              </div>
            </div>
            <div className="relative mt-4 grid grid-cols-3 gap-2">
              {[[mine.length, 'Orders'], [active.length, 'On the way'], [wishlist.length, 'Saved']].map(([value, label]) => (
                <div key={label} className="py-2.5 rounded-[14px] bg-white/10 border border-white/10 text-center">
                  <p className="text-[17px] font-extrabold leading-none">{value}</p>
                  <p className="mt-1 text-[11px] text-white/60">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Live tracking */}
          <div className="p-4 border-b border-[#E3E8EF]">
            <p className="px-1 text-[11.5px] uppercase tracking-[0.14em] font-bold text-[#8A97A8] mb-3">Track your order</p>
            {tracking ? (
              <a href={`#/order/${tracking.id}`} onClick={go} className="block p-3.5 rounded-[18px] bg-[var(--st-page)] hover:bg-[#EDF1F6] transition-colors">
                <div className="flex items-center gap-3">
                  <Photo src={tracking.items[0]?.image ?? ''} alt="" width={120} className="w-11 h-11 rounded-[12px] object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-bold">{tracking.orderNumber}</p>
                    <p className="text-[12px] text-[#6F7E92] truncate">{tracking.items[0]?.name}{tracking.items.length > 1 ? ` +${tracking.items.length - 1} more` : ''}</p>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[var(--st-accent)]/10 text-[var(--st-accent)] whitespace-nowrap">{TRACK_LABELS[Math.max(0, reached)]}</span>
                </div>
                <div className="mt-3.5 grid grid-cols-4 gap-1.5">
                  {TRACK_LABELS.map((label, i) => (
                    <div key={label}>
                      <div className={`h-1.5 rounded-full ${i <= reached ? 'bg-gradient-to-r from-[var(--st-accent)] to-[var(--st-accent-2)]' : 'bg-[#DCE3EC]'}`} />
                      <p className={`mt-1.5 text-[10.5px] font-semibold ${i <= reached ? 'text-[var(--st-ink)]' : 'text-[#A9B4C2]'}`}>{label}</p>
                    </div>
                  ))}
                </div>
                {tracking.shipment?.awb && tracking.shipment.status !== 'Cancelled' && <p className="mt-2 text-[11.5px] text-[#6F7E92]">{tracking.shipment.courier} · AWB {tracking.shipment.awb}</p>}
              </a>
            ) : (
              <div className="p-4 rounded-[18px] bg-[var(--st-page)] text-center">
                <p className="text-[13px] text-[#5B6B80]">No orders on the way right now.</p>
                <a href="#/shop" onClick={go} className="mt-1.5 inline-block text-[13px] font-bold text-[var(--st-accent)] hover:underline">Start shopping →</a>
              </div>
            )}
          </div>

          {/* Links */}
          <nav className="p-2">
            {[
              ['user', 'My account', '#/account'],
              ['box', 'My orders', '#/orders'],
              ['heart', `Wishlist${wishlist.length ? ` (${wishlist.length})` : ''}`, '#/wishlist'],
              ['chat', 'Contact us', '#/contact'],
            ].map(([icon, label, href]) => (
              <a key={href} role="menuitem" href={href} onClick={go} className="flex items-center gap-3.5 px-3 py-2.5 rounded-[14px] hover:bg-[var(--st-page)] transition-colors group">
                <span className="w-9 h-9 rounded-[12px] bg-[#EDF1F6] text-[var(--st-ink)] group-hover:bg-[var(--st-accent)] group-hover:text-white flex items-center justify-center transition-colors"><Icon name={icon} size={16} /></span>
                <span className="flex-1 text-[14.5px] font-semibold">{label}</span>
                <span className="text-[#A9B4C2] group-hover:text-[var(--st-accent)] transition-transform group-hover:translate-x-0.5"><Icon name="arrow" size={15} /></span>
              </a>
            ))}
            <button role="menuitem" onClick={signOut} className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-[14px] hover:bg-[#FDECEC] transition-colors text-left">
              <span className="w-9 h-9 rounded-[12px] bg-[#FDECEC] text-[#D23B3B] flex items-center justify-center"><Icon name="logout" size={16} /></span>
              <span className="text-[14.5px] font-semibold text-[#D23B3B]">Sign out</span>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Footer
// =============================================================================

const SOCIAL_ICONS: Record<string, ReactNode> = {
  instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" /></>,
  facebook: <path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8.5a.5.5 0 0 1 .5-.5Z" />,
  youtube: <><rect x="2.5" y="5.5" width="19" height="13" rx="4" /><path d="m10 9.5 5 2.5-5 2.5Z" fill="currentColor" /></>,
  x: <path d="M4 4l16 16M20 4 4 20" />,
  whatsapp: <><path d="M4 20l1.4-4.2A8 8 0 1 1 8.4 18.7Z" /><path d="M9 9.5c.3 1.8 2.2 3.9 4.5 4.6l1.2-1.2 2 .9c-.3 1.2-1.3 1.8-2.4 1.6-3.2-.6-6-3.4-6.5-6.6-.2-1.1.5-2.1 1.6-2.4l.9 2Z" /></>,
};

/** Round icon links for the social profiles filled in under Admin → Store Details. */
function SocialLinks({ social, whatsapp }: { social: Record<string, string>; whatsapp: string }) {
  const links = [
    ...Object.entries(social).filter(([, url]) => url.trim()).map(([key, url]) => [key, url.trim()]),
    ...(whatsapp.replace(/\D/g, '') ? [['whatsapp', `https://wa.me/${whatsapp.replace(/\D/g, '')}`]] : []),
  ];
  if (!links.length) return null;
  const labels: Record<string, string> = { instagram: 'Instagram', facebook: 'Facebook', youtube: 'YouTube', x: 'X', whatsapp: 'WhatsApp' };
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {links.map(([key, url]) => (
        <a key={key} href={url} target="_blank" rel="noopener noreferrer" aria-label={labels[key]} title={labels[key]} className="w-10 h-10 rounded-full bg-white/[0.08] border border-white/10 text-[#C9D2DD] flex items-center justify-center hover:bg-[var(--st-accent)] hover:text-white hover:border-transparent transition-colors">
          <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{SOCIAL_ICONS[key]}</svg>
        </a>
      ))}
    </div>
  );
}

function SiteFooter() {
  const storeInfo = useStoreDetails();
  const { categories } = useCatalog();
  const heading = 'text-[11.5px] uppercase tracking-[0.2em] font-bold text-[var(--st-accent-light)] mb-5';
  const link = 'block py-1.5 text-[14px] text-[#C9D2DD] hover:text-white transition-colors';
  return (
    <footer className="on-dark relative overflow-hidden bg-[var(--st-deep)] text-[var(--st-page)] mt-12 sm:mt-16">
      <span aria-hidden="true" className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[400px] rounded-full bg-[var(--st-accent)]/20 blur-[120px]" />
      <div className={`${T.shell} relative pt-12 pb-6`}>
        <div className="grid grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr] gap-8">
          <div className="col-span-2 lg:col-span-1">
            <Logo light />
            {storeInfo.tagline && <p className={`${T.display} text-[26px] leading-snug mt-8 max-w-sm text-white`}>{storeInfo.tagline.replace(/\.$/, '')}.</p>}
            {storeInfo.footerAbout && <p className="mt-4 text-[14px] leading-relaxed text-[#9AA7B8] max-w-sm whitespace-pre-line">{storeInfo.footerAbout}</p>}
            <ul className="mt-6 space-y-2.5 text-[13.5px] text-[#C9D2DD] max-w-sm">
              {storeInfo.address && <li className="flex gap-2.5"><span className="mt-0.5 shrink-0 text-[var(--st-accent-light)]"><Icon name="pin" size={16} /></span><span className="leading-relaxed whitespace-pre-line">{storeInfo.address}</span></li>}
              {storeInfo.phone && <li><a href={`tel:${storeInfo.phone.replace(/[^\d+]/g, '')}`} className="flex gap-2.5 hover:text-white"><span className="shrink-0 text-[var(--st-accent-light)]"><Icon name="phone" size={16} /></span>{storeInfo.phone}</a></li>}
              {storeInfo.email && <li><a href={`mailto:${storeInfo.email}`} className="flex gap-2.5 hover:text-white break-all"><span className="shrink-0 text-[var(--st-accent-light)]"><Icon name="mail" size={16} /></span>{storeInfo.email}</a></li>}
              {storeInfo.hours && <li className="flex gap-2.5"><span className="shrink-0 text-[var(--st-accent-light)]"><Icon name="clock" size={16} /></span>{storeInfo.hours}</li>}
            </ul>
            <SocialLinks social={storeInfo.social} whatsapp={storeInfo.whatsapp} />
          </div>
          <nav aria-label="Categories">
            <p className={heading}>Shop</p>
            {categories.map((c) => <a key={c.id} href={shopHref({ cat: c.slug })} className={link}>{c.name}</a>)}
          </nav>
          <nav aria-label="Client care">
            <p className={heading}>Customer care</p>
            <a href="#/contact" className={link}>FAQs &amp; delivery</a>
            <a href="#/orders" className={link}>Track your order</a>
            <a href="#/contact" className={link}>Contact us</a>
            <a href="#/wishlist" className={link}>Wishlist</a>
          </nav>
          <nav aria-label="Company">
            <p className={heading}>Company</p>
            <a href="#/about" className={link}>Our story</a>
            <a href="#/deals" className={link}>Private offers</a>
            <a href="/adminpanel" className={link}>Admin panel ↗</a>
          </nav>
        </div>
        <div className="mt-10 pt-5 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-3 text-[12px] text-[#6F7E92]">
          <p>© {YEAR} {storeInfo.name}.{storeInfo.footerNote && ` ${storeInfo.footerNote}`}</p>
          <p>Designed and Powered by <a href="https://www.rakvih.in" target="_blank" rel="noopener noreferrer" className="font-bold text-[#FACC15] hover:text-[#FDE047] hover:underline underline-offset-2">Rakvih</a></p>
        </div>
      </div>
    </footer>
  );
}

// =============================================================================
// Website Shell
// =============================================================================

function HomeForTheme() {
  const { theme } = useStoreTheme();
  return theme.layout === 'signature' ? <HomePage /> : <ThemedHomePage layout={theme.layout} />;
}

function Toast() {
  const toast = useStore(toastStore);
  return (
    <div aria-live="polite" className="fixed z-50 inset-x-4 bottom-6 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[440px] pointer-events-none">
      {toast && (
        <div key={toast.id} className="rise pointer-events-auto flex items-center gap-4 pl-6 pr-2 py-2 rounded-full bg-[var(--st-ink)] text-white shadow-[0_20px_50px_-15px_rgba(14,26,43,0.6)] ring-1 ring-white/10">
          <span className="flex-1 min-w-0 text-[13.5px] leading-snug py-1.5">{toast.message}</span>
          {toast.action && (
            <a href={toast.action.href} onClick={() => toastStore.set(null)} className="flex-shrink-0 px-4 py-2.5 rounded-full text-[12.5px] font-semibold bg-[var(--st-accent)] hover:bg-[var(--st-accent-2)] transition-colors">{toast.action.label}</a>
          )}
        </div>
      )}
    </div>
  );
}

function usePageTitle(title: string) {
  const { name } = useStoreDetails();
  useEffect(() => {
    const apply = () => { document.title = `${title} | ${name}`; };
    apply();
    // On a fresh load Next writes the layout's static <title> after hydration; set ours again once it has.
    const timer = setTimeout(apply, 600);
    return () => clearTimeout(timer);
  }, [title, name]);
}

export default function JewelleryStoreWebsite() {
  const { path, params } = useRoute();
  const { productById, categoryBySlug } = useCatalog();
  const account = useAccount();
  const orders = useStore(ordersStore);
  const main = useRef<HTMLElement>(null);
  const firstRender = useRef(true);
  const [page = 'home', slug] = path;

  let title = 'Considered Jewellery';
  let content: ReactNode;
  switch (page) {
    case 'home':
      content = <HomeForTheme />;
      break;
    case 'shop':
      title = params.get('q') ? `Search: ${params.get('q')}` : categoryBySlug(params.get('cat') ?? '')?.name ?? 'Shop';
      content = <ShopPage params={params} />;
      break;
    case 'product': {
      const product = productById(slug ?? '');
      title = product?.name ?? 'Not found';
      content = product ? <ProductPage key={product.id} product={product} /> : <NotFoundPage />;
      break;
    }
    case 'deals':
      title = 'Offers';
      content = <DealsPage />;
      break;
    case 'wishlist':
      title = 'Wishlist';
      content = <WishlistPage />;
      break;
    case 'bag':
      title = 'Your Bag';
      content = <BagPage />;
      break;
    case 'checkout':
      title = 'Checkout';
      content = <CheckoutPage />;
      break;
    case 'orders':
      title = 'Your Orders';
      content = <OrdersPage />;
      break;
    case 'order': {
      const order = orders.find((o) => o.id === slug);
      title = order ? `Order ${order.orderNumber}` : 'Not found';
      content = order ? <OrderPage order={order} /> : <NotFoundPage />;
      break;
    }
    case 'login':
    case 'signup':
      title = page === 'login' ? 'Sign in' : 'Create account';
      content = account ? <AccountPage /> : <AuthPage initialTab={page === 'login' ? 'signin' : 'signup'} next={params.get('next') ?? 'account'} />;
      break;
    case 'account':
      title = account ? 'My account' : 'Sign in';
      content = account ? <AccountPage /> : <AuthPage initialTab="signin" next="account" />;
      break;
    case 'about':
      title = 'Our Story';
      content = <AboutPage />;
      break;
    case 'help':
      title = 'Contact Us';
      content = <ContactPage />;
      break;
    case 'contact':
      title = 'Contact';
      content = <ContactPage />;
      break;
    default:
      title = 'Not found';
      content = <NotFoundPage />;
  }
  usePageTitle(title);
  const { theme, style: look } = useStoreTheme();

  // A filter change keeps its place; moving to another page or category resets it.
  const placeKey = `${path.join('/')}|${page === 'shop' ? params.get('cat') ?? '' : ''}`;
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo(0, navigation.byLink ? 0 : scrollMemory.get(window.location.hash) ?? 0);
    navigation.byLink = false;
    main.current?.focus({ preventScroll: true });
  }, [placeKey]);

  return (
    <div
      onClickCapture={(e) => {
        if ((e.target as HTMLElement).closest('a[href^="#/"]')) rememberScroll();
      }}
      data-layout={theme.layout}
      data-shape={look.shape}
      className="store-root min-h-screen flex flex-col bg-[var(--st-page)] text-[var(--st-ink)] antialiased selection:bg-[var(--st-accent)] selection:text-white"
      style={{ ...themeVars(theme.colors), ...layoutVars(look), fontFamily: 'var(--st-font-body), -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', colorScheme: 'light' }}
    >
      <style>{STORE_CSS}</style>
      <a href="#store-main" onClick={(e) => { e.preventDefault(); main.current?.focus(); }} className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:px-4 focus:py-2 focus:bg-[var(--st-ink)] focus:text-white">Skip to content</a>
      <AnnouncementBar />
      <SiteHeader page={page} params={params} />
      <main ref={main} tabIndex={-1} id="store-main" className="flex-1 outline-none overflow-x-clip">{content}</main>
      <SiteFooter />
      <AuthModal />
      <Toast />
    </div>
  );
}
