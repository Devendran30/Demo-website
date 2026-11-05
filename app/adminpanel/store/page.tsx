'use client';

import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { couponsStore, ordersStore, subCategoriesStore, couponState, productPhotos, FREE_DELIVERY_FROM } from '../demo-data';
import {
  T, Icon, Photo, useStore, useCatalog, useBag, useRoute, useScrolledPast, useAccount, toastStore, wishlistStore, myOrdersStore, sessionStore, showToast,
  navigate, rememberScroll, scrollMemory, navigation, shopHref, inr, STORE_INFO,
} from './store-kit';
import { HomePage, ShopPage, ProductPage, DealsPage, WishlistPage } from './catalog-pages';
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
    '7-day returns · One-year warranty',
  ];
  const run = (hidden: boolean) => (
    <div aria-hidden={hidden} className="flex shrink-0 items-center">
      {messages.map((message, i) => (
        <span key={i} className="flex items-center whitespace-nowrap px-8">
          {message}
          <span className="ml-16 w-1 h-1 rounded-full bg-[#5A8BFF]" />
        </span>
      ))}
    </div>
  );
  return (
    <div className="bg-[#0B1524] text-[#C9D2DD] text-[12px] font-semibold tracking-[0.04em] h-10 overflow-hidden flex items-center group border-b border-white/5">
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

/** The brand mark: a blue-to-navy tile with a stroked "D" and a silver core, beside the wordmark. */
function Logo({ light = false }: { light?: boolean }) {
  const [first, ...rest] = STORE_INFO.name.split(' ');
  return (
    <span className="flex items-center gap-3">
      <span className="relative w-10 h-10 rounded-[12px] bg-gradient-to-br from-[#2F6BFF] via-[#1D3F8F] to-[#0E1A2B] flex items-center justify-center shadow-[0_8px_20px_-8px_rgba(47,107,255,0.7)] ring-1 ring-white/20">
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24">
          <path d="M6 4h6a8 8 0 0 1 0 16H6z" fill="none" stroke="white" strokeWidth="2.6" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="2.4" fill="#C9D2DD" />
        </svg>
      </span>
      <span className={`flex flex-col leading-none transition-colors duration-500 ${light ? 'text-white' : 'text-[#0E1A2B]'}`}>
        <span className="text-[20px] font-extrabold tracking-[-0.04em]">{first}</span>
        <span className={`text-[10px] font-semibold uppercase tracking-[0.34em] mt-1 ${light ? 'text-white/60' : 'text-[#8A97A8]'}`}>{rest.join(' ')}</span>
      </span>
    </span>
  );
}

function CountBadge({ count }: { count: number }) {
  if (!count) return null;
  return <span className="absolute top-1 right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#2F6BFF] text-white text-[10px] flex items-center justify-center tabular-nums">{count}</span>;
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
        <form role="search" onSubmit={submit} className="flex items-center gap-4 border-b border-[#0E1A2B] pb-3">
          <Icon name="search" size={22} stroke={1.3} />
          <input
            ref={input}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search headphones, cameras, colours…"
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
                      <p className="mt-3 text-[13.5px] leading-snug group-hover:text-[#2F6BFF]">{p.name}</p>
                      <p className="text-[13px] text-[#5B6B80] flex items-center gap-2">{inr(p.price)}{p.colors.slice(0, 3).map((c) => <span key={c} className="w-2.5 h-2.5 rounded-full ring-1 ring-black/10" style={{ backgroundColor: colorHex[c] }} />)}</p>
                    </a>
                  ))}
                </div>
                <button onClick={submit} className="mt-8 text-[11.5px] uppercase tracking-[0.2em] border-b border-[#0E1A2B]/40 hover:border-[#0E1A2B] pb-1">See all results for “{query.trim()}”</button>
              </>
            ) : (
              <p className="text-[15px] text-[#5B6B80]">No pieces match “{query.trim()}”. Try a category, like <button onClick={() => setQuery('audio')} className="border-b border-current">audio</button>.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SiteHeader({ page, params }: { page: string; params: URLSearchParams }) {
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
  const activeNav = page === 'shop' && params.get('sort') === 'newest' ? 'new' : page;
  const scrolled = useScrolledPast(40);
  // On the home page the header floats over the hero photo until you scroll or open a menu.
  const overlay = page === 'home' && !scrolled && !megaOpen && !searchOpen;
  const iconLink = `relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors ${overlay ? 'hover:bg-white/10' : 'hover:bg-[#EDF1F6] hover:text-[#2F6BFF]'}`;
  const navItem = `px-4 py-2 rounded-full text-[14.5px] font-semibold tracking-[-0.01em] transition-colors ${overlay ? 'hover:bg-white/10' : 'hover:bg-[#EDF1F6]'}`;
  const navActive = overlay ? 'bg-white/15' : 'bg-[#0E1A2B] text-white hover:bg-[#0E1A2B]';
  const closeAll = () => {
    setMenuOpen(false);
    setMegaOpen(false);
    setSearchOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-[border-color,color] duration-500 ${overlay ? 'border-white/10 text-white' : 'border-[#E3E8EF] text-[#0E1A2B] shadow-[0_10px_30px_-25px_rgba(14,26,43,0.5)]'}`}
      onMouseLeave={() => setMegaOpen(false)}
    >
      {/* Frosted background on its own layer: a backdrop-filter on <header> would trap the fixed side menu inside it. */}
      <span aria-hidden="true" className={`absolute inset-0 -z-10 transition-opacity duration-500 bg-white/85 backdrop-blur-xl ${overlay ? 'opacity-0' : 'opacity-100'}`} />
      <div className={`${T.shell} flex items-center justify-between gap-3 sm:gap-6 h-[72px] lg:h-[84px]`}>
        <a href="#/" onClick={closeAll} aria-label={`${STORE_INFO.name} home`} className="shrink-0"><Logo light={overlay} /></a>

        <div className="flex items-center gap-2 lg:gap-10">
          <nav aria-label="Main" className="hidden lg:flex items-center gap-1">
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

          <div className={`flex items-center gap-0.5 sm:gap-1 lg:pl-8 lg:border-l ${overlay ? 'lg:border-white/20' : 'lg:border-[#E3E8EF]'}`}>
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

      {/* Mega menu */}
      {megaOpen && !searchOpen && (
        <div className="hidden lg:block absolute inset-x-0 top-full bg-white border-b border-[#E3E8EF] shadow-[0_30px_60px_-30px_rgba(14,26,43,0.25)] drop">
          <div className={`${T.shell} py-12 grid grid-cols-[1fr_340px] gap-16`}>
            <div className="grid grid-cols-4 gap-x-10 gap-y-9">
              {categories.map((c) => (
                <div key={c.id}>
                  <a href={shopHref({ cat: c.slug })} onClick={closeAll} className={`${T.display} text-[19px] leading-none hover:text-[#2F6BFF] transition-colors`}>{c.name}</a>
                  <ul className="mt-3.5 space-y-2">
                    {subCategories.filter((sc) => sc.status === 'Active' && sc.parentCategory === c.name && products.some((p) => p.subCategory === sc.name)).map((sc) => (
                      <li key={sc.id}><a href={shopHref({ cat: c.slug, sub: sc.name })} onClick={closeAll} className="text-[13.5px] text-[#5B6B80] hover:text-[#0E1A2B]">{sc.name}</a></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            {categories[0] && (
              <a href={shopHref({ sort: 'newest' })} onClick={closeAll} className="group relative aspect-[4/5] overflow-hidden rounded-[24px] bg-[#16263D] text-white on-dark">
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

      {/* Phones and tablets: a side menu with the same links as the desktop header */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-[#0B1524]/50 backdrop-blur-sm fade" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
          <nav className="drawer-right absolute right-0 top-0 h-[100dvh] w-[86%] max-w-[360px] bg-white text-[#0E1A2B] flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.25)]" aria-label="Mobile">
            <div className="shrink-0 flex items-center justify-between px-5 h-[72px] border-b border-[#E3E8EF]">
              <Logo />
              <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="w-10 h-10 rounded-full bg-[#F6F8FB] flex items-center justify-center"><Icon name="close" size={18} /></button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-4 space-y-1">
              {[NAV_LINKS[0], { label: 'Shop', href: '#/shop', page: 'shop' }, ...NAV_LINKS.slice(1)].map((link, i) => {
                const active = link.page === 'shop' ? page === 'shop' && activeNav !== 'new' : activeNav === link.page;
                const row = `rise flex items-center justify-between w-full px-4 h-[52px] rounded-[16px] text-[16px] font-semibold transition-colors ${active ? 'bg-[#0E1A2B] text-white' : 'hover:bg-[#F6F8FB]'}`;
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
                          <a href="#/shop" onClick={closeAll} className="flex items-center gap-3 px-2 py-2 rounded-[14px] hover:bg-[#F6F8FB]">
                            <span className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-[#2F6BFF] to-[#0E1A2B] text-white flex items-center justify-center"><Icon name="bag" size={17} /></span>
                            <span className="flex-1 text-[14.5px] font-semibold">All products</span>
                            <span className="text-[12px] font-semibold text-[#8A97A8]">{products.length}</span>
                          </a>
                          {categories.map((c) => (
                            <a key={c.id} href={shopHref({ cat: c.slug })} onClick={closeAll} className="flex items-center gap-3 px-2 py-2 rounded-[14px] hover:bg-[#F6F8FB]">
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
            <div className="shrink-0 border-t border-[#E3E8EF] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-[#F6F8FB]">
              {account ? (
                <>
                  <a href="#/account" onClick={closeAll} className="flex items-center gap-3 p-2.5 rounded-[18px] bg-white border border-[#E3E8EF]">
                    <span className="relative w-11 h-11 rounded-full bg-gradient-to-br from-[#2F6BFF] to-[#5A8BFF] text-white text-[14px] font-extrabold flex items-center justify-center">
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
                    <button onClick={() => { closeAll(); openAuth('signin'); }} className="h-12 rounded-full bg-white border border-[#CFD8E3] text-[14.5px] font-bold hover:border-[#0E1A2B] transition-colors">Sign in</button>
                    <button onClick={() => { closeAll(); openAuth('signup'); }} className="h-12 rounded-full bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white text-[14.5px] font-bold shadow-[0_12px_26px_-12px_rgba(47,107,255,0.8)]">Sign up</button>
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
        className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors ${overlay ? 'hover:bg-white/10' : 'hover:bg-[#EDF1F6] hover:text-[#2F6BFF]'}`}
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
        className={`flex items-center gap-2.5 h-9 sm:h-10 pl-0.5 sm:pl-1 pr-0.5 sm:pr-3.5 rounded-full border transition-all ${overlay ? 'border-white/20 bg-white/10 hover:bg-white/15' : 'border-[#E3E8EF] bg-white hover:border-[#2F6BFF]/40 hover:shadow-[0_8px_20px_-12px_rgba(47,107,255,0.6)]'}`}
      >
        <span className="relative w-8 h-8 rounded-full bg-gradient-to-br from-[#2F6BFF] to-[#5A8BFF] text-white text-[12px] font-extrabold flex items-center justify-center">
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
        <div role="menu" className="drop absolute left-3 right-3 top-full mt-2 sm:left-auto sm:right-0 sm:mt-3 sm:w-[360px] max-h-[calc(100vh-130px)] overflow-y-auto rounded-[26px] bg-white text-[#0E1A2B] ring-1 ring-[#0E1A2B]/[0.08] shadow-[0_40px_80px_-30px_rgba(14,26,43,0.55)] overflow-hidden">
          {/* Identity */}
          <div className="on-dark relative overflow-hidden bg-gradient-to-br from-[#0E1A2B] via-[#13284A] to-[#0B1524] text-white p-5">
            <span aria-hidden="true" className="pointer-events-none absolute -top-16 -right-10 w-48 h-48 rounded-full bg-[#2F6BFF]/40 blur-[60px]" />
            <div className="relative flex items-center gap-3.5">
              <span className="w-14 h-14 rounded-[18px] bg-gradient-to-br from-[#2F6BFF] to-[#5A8BFF] text-[18px] font-extrabold flex items-center justify-center shadow-[0_10px_24px_-8px_rgba(47,107,255,0.8)]">{initials}</span>
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
              <a href={`#/order/${tracking.id}`} onClick={go} className="block p-3.5 rounded-[18px] bg-[#F6F8FB] hover:bg-[#EDF1F6] transition-colors">
                <div className="flex items-center gap-3">
                  <Photo src={tracking.items[0]?.image ?? ''} alt="" width={120} className="w-11 h-11 rounded-[12px] object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-bold">{tracking.orderNumber}</p>
                    <p className="text-[12px] text-[#6F7E92] truncate">{tracking.items[0]?.name}{tracking.items.length > 1 ? ` +${tracking.items.length - 1} more` : ''}</p>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#2F6BFF]/10 text-[#2F6BFF] whitespace-nowrap">{TRACK_LABELS[Math.max(0, reached)]}</span>
                </div>
                <div className="mt-3.5 grid grid-cols-4 gap-1.5">
                  {TRACK_LABELS.map((label, i) => (
                    <div key={label}>
                      <div className={`h-1.5 rounded-full ${i <= reached ? 'bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF]' : 'bg-[#DCE3EC]'}`} />
                      <p className={`mt-1.5 text-[10.5px] font-semibold ${i <= reached ? 'text-[#0E1A2B]' : 'text-[#A9B4C2]'}`}>{label}</p>
                    </div>
                  ))}
                </div>
                {tracking.shipment?.awb && tracking.shipment.status !== 'Cancelled' && <p className="mt-2 text-[11.5px] text-[#6F7E92]">{tracking.shipment.courier} · AWB {tracking.shipment.awb}</p>}
              </a>
            ) : (
              <div className="p-4 rounded-[18px] bg-[#F6F8FB] text-center">
                <p className="text-[13px] text-[#5B6B80]">No orders on the way right now.</p>
                <a href="#/shop" onClick={go} className="mt-1.5 inline-block text-[13px] font-bold text-[#2F6BFF] hover:underline">Start shopping →</a>
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
              <a key={href} role="menuitem" href={href} onClick={go} className="flex items-center gap-3.5 px-3 py-2.5 rounded-[14px] hover:bg-[#F6F8FB] transition-colors group">
                <span className="w-9 h-9 rounded-[12px] bg-[#EDF1F6] text-[#0E1A2B] group-hover:bg-[#2F6BFF] group-hover:text-white flex items-center justify-center transition-colors"><Icon name={icon} size={16} /></span>
                <span className="flex-1 text-[14.5px] font-semibold">{label}</span>
                <span className="text-[#A9B4C2] group-hover:text-[#2F6BFF] transition-transform group-hover:translate-x-0.5"><Icon name="arrow" size={15} /></span>
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

function SiteFooter() {
  const { categories } = useCatalog();
  const heading = 'text-[11.5px] uppercase tracking-[0.2em] font-bold text-[#8FB0FF] mb-5';
  const link = 'block py-1.5 text-[14px] text-[#C9D2DD] hover:text-white transition-colors';
  return (
    <footer className="on-dark relative overflow-hidden bg-[#0B1524] text-[#F6F8FB] mt-12 sm:mt-16">
      <span aria-hidden="true" className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[400px] rounded-full bg-[#2F6BFF]/20 blur-[120px]" />
      <div className={`${T.shell} relative pt-12 pb-6`}>
        <div className="grid grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr] gap-8">
          <div className="col-span-2 lg:col-span-1">
            <Logo light />
            <p className={`${T.display} text-[26px] leading-snug mt-8 max-w-sm text-white`}>{STORE_INFO.tagline}.</p>
            <p className="mt-6 text-[13.5px] text-[#6F7E92] leading-relaxed max-w-xs">{STORE_INFO.address}</p>
            <p className="mt-2 text-[13.5px] text-[#C9D2DD]">{STORE_INFO.email} · {STORE_INFO.phone}</p>
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
          <p>© {YEAR} {STORE_INFO.name}. A demo store: products and prices are samples, and no real payments are processed.</p>
          <p>Designed and Powered by <a href="https://www.rakvih.in" target="_blank" rel="noopener noreferrer" className="font-bold text-[#FACC15] hover:text-[#FDE047] hover:underline underline-offset-2">Rakvih</a></p>
        </div>
      </div>
    </footer>
  );
}

// =============================================================================
// Website Shell
// =============================================================================

function Toast() {
  const toast = useStore(toastStore);
  return (
    <div aria-live="polite" className="fixed z-50 inset-x-4 bottom-6 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[440px] pointer-events-none">
      {toast && (
        <div key={toast.id} className="rise pointer-events-auto flex items-center gap-4 pl-6 pr-2 py-2 rounded-full bg-[#0E1A2B] text-white shadow-[0_20px_50px_-15px_rgba(14,26,43,0.6)] ring-1 ring-white/10">
          <span className="flex-1 min-w-0 text-[13.5px] leading-snug py-1.5">{toast.message}</span>
          {toast.action && (
            <a href={toast.action.href} onClick={() => toastStore.set(null)} className="flex-shrink-0 px-4 py-2.5 rounded-full text-[12.5px] font-semibold bg-[#2F6BFF] hover:bg-[#5A8BFF] transition-colors">{toast.action.label}</a>
          )}
        </div>
      )}
    </div>
  );
}

function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | ${STORE_INFO.name}`;
  }, [title]);
}

export default function ElectronicsStoreWebsite() {
  const { path, params } = useRoute();
  const { productById, categoryBySlug } = useCatalog();
  const account = useAccount();
  const orders = useStore(ordersStore);
  const main = useRef<HTMLElement>(null);
  const firstRender = useRef(true);
  const [page = 'home', slug] = path;

  let title = 'Considered Electronics';
  let content: ReactNode;
  switch (page) {
    case 'home':
      content = <HomePage />;
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
      className="store-root min-h-screen flex flex-col bg-[#F6F8FB] text-[#0E1A2B] antialiased selection:bg-[#2F6BFF] selection:text-white"
      style={{ fontFamily: 'var(--font-manrope), -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', colorScheme: 'light' }}
    >
      <style>{`
        .rise { animation: rise 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
        .rise-1 { animation-delay: 0.12s; } .rise-2 { animation-delay: 0.24s; } .rise-3 { animation-delay: 0.36s; }
        @keyframes rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
        .kenburns { animation: kenburns 9s ease-out both; }
        @keyframes kenburns { from { transform: scale(1.1); } to { transform: scale(1); } }
        .progress { animation: progress 6.5s linear both; }
        @keyframes progress { from { width: 0; } to { width: 100%; } }
        .marquee { animation: marquee 38s linear infinite; }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .fade { animation: fade 0.6s ease both; }
        @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
        .drop { animation: drop 0.35s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
        @keyframes drop { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }
        .drawer { animation: drawer 0.4s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
        @keyframes drawer { from { transform: translateX(-100%); } to { transform: none; } }
        .hero-left { animation: hero-left 1s cubic-bezier(0.16, 1, 0.3, 1) both; }
        @keyframes hero-left { from { opacity: 0; transform: translateX(-48px); } to { opacity: 1; transform: none; } }
        .hero-right { animation: hero-right 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both; }
        @keyframes hero-right { from { opacity: 0; transform: translateX(80px) scale(0.96); } to { opacity: 1; transform: none; } }
        .hero-pop { animation: hero-pop 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) both, float 6s ease-in-out 1.2s infinite; }
        @keyframes hero-pop { from { opacity: 0; transform: translateY(24px) scale(0.85); } to { opacity: 1; transform: none; } }
        .progress-7 { animation: progress 7s linear both; }
        .drift { animation: drift 16s ease-in-out infinite alternate; }
        @keyframes drift { from { transform: translate(0, 0); } to { transform: translate(120px, 60px); } }
        .map-ping { transform-origin: 205px 118px; animation: map-ping 2.4s ease-out infinite; }
        @keyframes map-ping { from { transform: scale(0.6); opacity: 0.6; } to { transform: scale(2.6); opacity: 0; } }
        .float { animation: float 6s ease-in-out infinite; }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .store-root .font-display { font-family: var(--font-manrope), sans-serif; font-weight: 700; letter-spacing: -0.04em; }
        /* Highlighted words in headlines: an electric-blue sweep on light, a blue-to-silver sweep on navy. */
        .store-root em { font-style: normal; background-image: linear-gradient(100deg, #2F6BFF 10%, #6E9BFF 90%); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .store-root .on-dark em { background-image: linear-gradient(100deg, #8FB0FF 0%, #E3E9F2 85%); }
        .drawer-right { animation: drawer-right 0.4s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
        .modal-in { animation: modal-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
        @keyframes modal-in { from { opacity: 0; transform: translateY(24px) scale(0.97); } to { opacity: 1; transform: none; } }
        @keyframes drawer-right { from { transform: translateX(100%); } to { transform: none; } }
        @media (prefers-reduced-motion: reduce) { .rise, .kenburns, .progress, .fade, .drop, .drawer, .drawer-right, .float, .modal-in, .hero-left, .hero-right, .hero-pop, .drift, .progress-7 { animation: none; } .marquee { animation-duration: 120s; } }
      `}</style>
      <a href="#store-main" onClick={(e) => { e.preventDefault(); main.current?.focus(); }} className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:px-4 focus:py-2 focus:bg-[#0E1A2B] focus:text-white">Skip to content</a>
      <AnnouncementBar />
      <SiteHeader page={page} params={params} />
      <main ref={main} tabIndex={-1} id="store-main" className="flex-1 outline-none overflow-x-clip">{content}</main>
      <SiteFooter />
      <AuthModal />
      <Toast />
    </div>
  );
}
