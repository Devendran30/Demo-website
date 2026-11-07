'use client';

import { useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
  ordersStore, placeWebsiteOrder, couponProblem, couponState, productPhotos, FREE_DELIVERY_FROM, paymentGatewayStore,
  type Order, type OrderStatus, type WebsiteOrderInput, type PaymentReceipt, useStoreDetails, type StoreDetails,
} from '../demo-data';
import {
  T, Icon, Photo, Button, PageTitle, EmptyState, QtyStepper, TotalsList, Reveal, SectionHeading,
  useStore, useBag, useCatalog, useAccount, bagStore, promoStore, myOrdersStore, setBagQty, navigate, formatDate, variantLabel, inr,
} from './store-kit';
import { Field } from './auth-pages';
import { RazorpayCheckout, MethodGlyph } from './razorpay-standard-checkout';

// =============================================================================
// Bag Page
// =============================================================================

/** The ways a shopper can pay, shown under the bag summary and in the footer of checkout. */
function PaymentMarks() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      <span className="inline-flex h-7 px-2.5 rounded-md bg-[#F1F4F9] text-[var(--st-ink)] text-[11px] font-black items-center gap-1"><MethodGlyph method="Razorpay" size={13} /> Razorpay</span>
      <span className="inline-flex h-7 px-2.5 rounded-md bg-[#F1F4F9] text-[var(--st-ink)] text-[11px] font-black items-center">COD</span>
    </div>
  );
}

export function BagPage() {
  const { lines, count, coupons, totals } = useBag();
  const offers = coupons.filter((c) => couponState(c) === 'Live');
  const towardsFree = Math.min(100, Math.round(((totals.subtotal - totals.discount) / FREE_DELIVERY_FROM) * 100));

  if (!lines.length) {
    return <EmptyState icon="bag" title="Your bag is empty" text="When you add something beautiful, it will appear here." action={{ label: 'Discover the collection', href: '#/shop' }} />;
  }

  return (
    <div className={T.shell}>
      <PageTitle eyebrow="Your bag" title={<>{count} {count === 1 ? 'piece' : 'pieces'}, <em>beautifully chosen</em></>} />
      <div className="grid lg:grid-cols-[1.55fr_1fr] gap-12 lg:gap-12 items-start">
        <ul className="divide-y divide-[#E3E8EF] border-y border-[#E3E8EF]">
          {lines.map((line) => (
            <li key={line.key} className="py-7 flex gap-5 sm:gap-7">
              <a href={`#/product/${line.product.id}`} className="flex-shrink-0 w-24 sm:w-32 aspect-[4/5] rounded-[18px] overflow-hidden bg-[#EDF1F6]">
                <Photo src={productPhotos(line.product, line.color)[0]} alt={line.product.name} width={320} className="h-full w-full object-cover" />
              </a>
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[10.5px] uppercase tracking-[0.22em] text-[#8A97A8] mb-1.5">{line.product.category}</p>
                    <a href={`#/product/${line.product.id}`} className={`block ${T.display} text-[24px] sm:text-[28px] leading-[1.05] hover:text-[var(--st-accent)] transition-colors`}>{line.product.name}</a>
                    {variantLabel(line.size, line.color) && <p className="text-[13.5px] text-[#5B6B80] mt-2">{variantLabel(line.size, line.color)}</p>}
                    <p className="text-[13px] text-[#8A97A8] mt-1">{inr(line.product.price)} each{line.available <= 5 ? ` · only ${line.available} left` : ''}</p>
                  </div>
                  <p className="text-[16px] tabular-nums whitespace-nowrap">{inr(line.product.price * line.qty)}</p>
                </div>
                <div className="mt-auto pt-5 flex items-center justify-between gap-3">
                  <QtyStepper qty={line.qty} max={line.available} onChange={(next) => setBagQty(line.key, next)} label={line.product.name} />
                  <button onClick={() => setBagQty(line.key, 0)} className="text-[13px] font-semibold text-[#6F7E92] hover:text-[#D23B3B]">Remove</button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="lg:sticky lg:top-28 bg-[#FFFFFF] border border-[#E3E8EF] rounded-[28px] p-7 sm:p-9 shadow-[0_30px_60px_-40px_rgba(14,26,43,0.25)]">
          <h2 className={`${T.display} text-[32px] leading-none mb-7`}>Summary</h2>

          <div className="mb-7 p-4 rounded-[18px] bg-[var(--st-page)]">
            <p className="text-[13px] text-[#5B6B80] mb-2.5 flex items-center gap-2">
              <span className="text-[var(--st-accent)]"><Icon name="truck" size={17} /></span>
              {totals.delivery ? <span>Add <span className="font-bold text-[var(--st-ink)]">{inr(FREE_DELIVERY_FROM - (totals.subtotal - totals.discount))}</span> for complimentary delivery</span> : 'Your order ships with complimentary delivery'}
            </p>
            <div className="h-1.5 rounded-full bg-[#E3E8EF] overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-[var(--st-accent)] to-[var(--st-accent-2)] transition-all duration-700" style={{ width: `${towardsFree}%` }} /></div>
          </div>

          <TotalsList totals={totals} promo={totals.discount ? promoStore.get() : ''} />
          <p className="mt-3 text-[12px] text-[#8A97A8]">Inclusive of all taxes.</p>

          {offers.length > 0 && (
            <p className="mt-6 flex items-center gap-2.5 p-3.5 rounded-[16px] border border-dashed border-[var(--st-accent-line)] bg-[var(--st-accent-soft)] text-[13px] text-[#3A4A5F]">
              <span className="text-[var(--st-accent)]"><Icon name="tag" size={18} /></span>
              <span>{offers.length} {offers.length === 1 ? 'offer is' : 'offers are'} available — apply your promo code at checkout.</span>
            </p>
          )}

          <Button href="#/checkout" variant="accent" className="w-full mt-7">Proceed to checkout <Icon name="arrow" size={16} /></Button>
          <a href="#/shop" className="block text-center mt-5 text-[11px] uppercase tracking-[0.2em] text-[#6F7E92] hover:text-[var(--st-ink)]">Continue shopping</a>
          <div className="mt-7 pt-6 border-t border-[#E3E8EF]">
            <p className="mb-3 text-center text-[11.5px] text-[#8A97A8] flex items-center justify-center gap-1.5"><Icon name="lock" size={13} /> Secure payments by Razorpay</p>
            <PaymentMarks />
          </div>
        </aside>
      </div>
    </div>
  );
}

// =============================================================================
// Checkout Page
// =============================================================================

const BLANK_ADDRESS = { name: '', phone: '', email: '', house: '', area: '', city: '', state: '', pin: '' };
type Address = typeof BLANK_ADDRESS;
type Payment = WebsiteOrderInput['payment'];

const INDIAN_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

const PAYMENT_OPTIONS: { id: Payment; title: string; note: string; key: 'razorpay' | 'cod'; badge?: string }[] = [
  { id: 'Razorpay', title: 'Razorpay', note: 'UPI, cards and net banking in one secure checkout', key: 'razorpay', badge: 'Secure' },
  { id: 'Cash on Delivery', title: 'Cash on delivery', note: 'Pay when your order arrives', key: 'cod' },
];

function addressProblems(address: Address) {
  const problems: Partial<Record<keyof Address, string>> = {};
  if (address.name.trim().length < 2) problems.name = 'Enter your full name.';
  if (!/^[6-9]\d{9}$/.test(address.phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, ''))) problems.phone = 'Enter a 10-digit mobile number.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email.trim())) problems.email = 'Enter a valid email address.';
  if (!address.house.trim()) problems.house = 'Enter your flat or house number.';
  if (address.area.trim().length < 3) problems.area = 'Enter your street or area.';
  if (address.city.trim().length < 2) problems.city = 'Enter your city.';
  if (address.state.trim().length < 2) problems.state = 'Enter your state.';
  if (!/^[1-9]\d{5}$/.test(address.pin.trim())) problems.pin = 'Enter a 6-digit PIN code.';
  return problems;
}

type Located =
  | { status: 'idle' }
  | { status: 'locating' }
  | { status: 'found'; lat: number; lon: number; accuracy: number; label: string }
  | { status: 'error'; message: string };

const STEPS_BAR = ['Bag', 'Details', 'Payment', 'Done'];

function CheckoutSteps({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-2 sm:gap-3" aria-label="Checkout progress">
      {STEPS_BAR.map((label, i) => (
        <li key={label} className="flex items-center gap-2 sm:gap-3">
          <span className={`flex items-center gap-2 text-[12.5px] sm:text-[13px] font-bold ${i <= current ? 'text-[var(--st-ink)]' : 'text-[#A9B4C2]'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${i < current ? 'bg-[var(--st-accent)] text-white' : i === current ? 'bg-[var(--st-ink)] text-white ring-4 ring-[var(--st-accent)]/15' : 'bg-[#E3E8EF] text-[#8A97A8]'}`}>
              {i < current ? <Icon name="check" size={13} stroke={2.6} /> : i + 1}
            </span>
            <span className={i === current ? '' : 'hidden sm:inline'}>{label}</span>
          </span>
          {i < STEPS_BAR.length - 1 && <span className={`w-5 sm:w-10 h-[2px] rounded-full ${i < current ? 'bg-[var(--st-accent)]' : 'bg-[#E3E8EF]'}`} />}
        </li>
      ))}
    </ol>
  );
}

function Card({ step, title, aside, children }: { step: string; title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="bg-white border border-[#E3E8EF] rounded-[28px] p-6 sm:p-8 shadow-[0_24px_50px_-40px_rgba(14,26,43,0.3)]">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="flex items-center gap-3 text-[20px] sm:text-[22px] font-extrabold tracking-tight text-[var(--st-ink)]">
          <span className="w-8 h-8 rounded-full bg-[var(--st-accent-soft)] text-[var(--st-accent)] text-[13px] font-extrabold flex items-center justify-center">{step}</span>
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function PromoBox() {
  const { subtotal, promo, coupons } = useBag();
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [showOffers, setShowOffers] = useState(false);
  const promoDropped = promo ? couponProblem(promo, subtotal, coupons) : null;
  const offers = coupons.filter((c) => couponState(c) === 'Live');

  const applyCode = (entered: string) => {
    const value = entered.trim().toUpperCase();
    if (!value) return;
    const problem = couponProblem(value, subtotal, coupons);
    if (problem) return setCodeError(problem);
    setCodeError('');
    setCode('');
    setShowOffers(false);
    promoStore.set(value);
  };

  if (promo && !promoDropped) {
    return (
      <div className="flex items-center justify-between gap-3 p-3.5 rounded-[16px] bg-[#E3F4EC] text-[13.5px]">
        <span className="text-[#0F8A5F] inline-flex items-center gap-2 font-semibold"><Icon name="check" size={16} /> <span className="font-mono">{promo}</span> applied</span>
        <button type="button" onClick={() => promoStore.set('')} className="text-[12px] font-bold text-[#0F8A5F] hover:underline">Remove</button>
      </div>
    );
  }
  return (
    <div>
      <div className="flex gap-2">
        <label htmlFor="promo-code" className="sr-only">Promo code</label>
        <input id="promo-code" value={code} onChange={(e) => { setCode(e.target.value); setCodeError(''); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyCode(code); } }} placeholder="Promo code" autoCapitalize="characters"
          className="flex-1 min-w-0 h-11 px-4 rounded-[14px] bg-[var(--st-page)] border border-[#E3E8EF] text-[14px] uppercase font-mono placeholder:normal-case placeholder:font-sans placeholder:text-[#8A97A8] outline-none focus:border-[var(--st-accent)] focus:bg-white" />
        <button type="button" onClick={() => applyCode(code)} className="h-11 px-5 rounded-[14px] bg-[var(--st-ink)] text-white text-[13px] font-bold hover:bg-[var(--st-ink-3)]">Apply</button>
      </div>
      {(codeError || promoDropped) && <p role="alert" className="mt-2 text-[12.5px] text-[#D23B3B]">{codeError || promoDropped}</p>}
      {offers.length > 0 && (
        <>
          <button type="button" onClick={() => setShowOffers(!showOffers)} aria-expanded={showOffers} className="mt-3 text-[12.5px] font-bold text-[var(--st-accent)] flex items-center gap-1.5">
            <Icon name="tag" size={14} /> {showOffers ? 'Hide offers' : `View ${offers.length} available ${offers.length === 1 ? 'offer' : 'offers'}`}
          </button>
          {showOffers && (
            <div className="mt-3 space-y-2">
              {offers.map((offer) => {
                const shortBy = offer.minPurchase - subtotal;
                return (
                  <div key={offer.id} className="flex items-center gap-3 p-3 rounded-[14px] border border-dashed border-[var(--st-accent-line)] bg-[var(--st-accent-soft)]">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[13px] font-bold text-[var(--st-accent-dark)]">{offer.code}</p>
                      <p className="text-[12px] text-[#5B6B80] leading-snug">{offer.description || (offer.discountType === 'Percentage' ? `${offer.discountValue}% off` : `${inr(offer.discountValue)} off`)}</p>
                      {shortBy > 0 && <p className="text-[11.5px] text-[#8A97A8]">Add {inr(shortBy)} more to use</p>}
                    </div>
                    <button type="button" disabled={shortBy > 0} onClick={() => applyCode(offer.code)} className="px-3 py-1.5 rounded-full bg-white border border-[var(--st-accent-line)] text-[12px] font-bold text-[var(--st-accent-dark)] disabled:opacity-40">Apply</button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function CheckoutPage() {
  const { lines, promo, totals } = useBag();
  const account = useAccount();
  const gateway = useStore(paymentGatewayStore);
  const options = PAYMENT_OPTIONS.filter((o) => gateway.methods[o.key]);
  const available = options.length ? options : PAYMENT_OPTIONS.filter((o) => o.id === 'Cash on Delivery');
  // Members start with their name, email and phone already filled in.
  const [address, setAddress] = useState<Address>(() => (account ? { ...BLANK_ADDRESS, name: account.name, email: account.email, phone: account.phone.replace(/^\+91\s?/, '') } : BLANK_ADDRESS));
  const [paymentChoice, setPayment] = useState<Payment>('Razorpay');
  const payment = available.some((o) => o.id === paymentChoice) ? paymentChoice : available[0].id;
  const [showProblems, setShowProblems] = useState(false);
  const [placeError, setPlaceError] = useState('');
  const [placing, setPlacing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [located, setLocated] = useState<Located>({ status: 'idle' });
  const [pinLookup, setPinLookup] = useState('');
  const form = useRef<HTMLFormElement>(null);
  const touchedAddressFields = useRef(new Set<keyof Address>());
  const problems = addressProblems(address);

  if (!lines.length) {
    return <EmptyState icon="bag" title="Nothing to check out" text="Your bag is empty, so add a piece first." action={{ label: 'Go to the shop', href: '#/shop' }} />;
  }

  const update = (name: keyof Address, value: string) => {
    touchedAddressFields.current.add(name);
    setAddress((prev) => ({ ...prev, [name]: value }));
  };

  // Fills city and state from an Indian PIN code (India Post data), leaving anything already typed alone.
  const lookUpPin = async (pin: string) => {
    if (!/^[1-9]\d{5}$/.test(pin)) return;
    setPinLookup('Finding your city…');
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      const office = data?.[0]?.PostOffice?.[0];
      if (!office) { setPinLookup(''); return; }
      setAddress((prev) => ({
        ...prev,
        city: touchedAddressFields.current.has('city') ? prev.city : office.District || prev.city,
        state: touchedAddressFields.current.has('state') ? prev.state : office.State || prev.state,
      }));
      setPinLookup(`${office.District}, ${office.State}`);
    } catch {
      setPinLookup('');
    }
  };

  const useMyLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocated({ status: 'error', message: 'This browser can’t share your location. Please type your address.' });
      return;
    }
    setLocated({ status: 'locating' });
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const lat = coords.latitude;
        const lon = coords.longitude;
        const accuracy = coords.accuracy;
        try {
          // Nominatim supplies street/building detail. BigDataCloud fills city,
          // state and postcode when OSM has sparse locality components.
          const [osmResult, cityResult] = await Promise.allSettled([
            fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&layer=address&lat=${lat}&lon=${lon}`, { headers: { 'Accept-Language': 'en' } })
              .then((response) => response.ok ? response.json() : Promise.reject(new Error('Address lookup failed'))),
            fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`)
              .then((response) => response.ok ? response.json() : Promise.reject(new Error('City lookup failed'))),
          ]);
          const osm = osmResult.status === 'fulfilled' ? osmResult.value : null;
          const cityData = cityResult.status === 'fulfilled' ? cityResult.value : null;
          if (!osm && !cityData) throw new Error('Address lookup unavailable');
          const a = osm?.address ?? {};
          const street = a.road || a.pedestrian || a.residential || a.street || a.path || a.footway || '';
          const locality = a.neighbourhood || a.suburb || a.quarter || a.hamlet || a.locality || a.village || cityData?.locality || '';
          const area = [street, locality].filter(Boolean).filter((value, index, values) => values.indexOf(value) === index).join(', ');
          const city = a.city || a.town || a.municipality || cityData?.city || a.village || cityData?.locality || '';
          const state = a.state || a.region || cityData?.principalSubdivision || '';
          const pin = String(a.postcode || cityData?.postcode || '').replace(/\D/g, '').slice(0, 6);
          const house = [a.house_number, a.building || a.apartment || a.unit].filter(Boolean).join(', ');
          const displayName = osm?.display_name || [locality, city, state].filter(Boolean).join(', ');
          setAddress((prev) => ({
            ...prev,
            house: touchedAddressFields.current.has('house') ? prev.house : house,
            area: touchedAddressFields.current.has('area') ? prev.area : area,
            city: touchedAddressFields.current.has('city') ? prev.city : city,
            state: touchedAddressFields.current.has('state') ? prev.state : state,
            pin: touchedAddressFields.current.has('pin') ? prev.pin : /^[1-9]\d{5}$/.test(pin) ? pin : '',
          }));
          setLocated({ status: 'found', lat, lon, accuracy, label: [locality || street || city, city, state].filter(Boolean).filter((value, index, values) => values.indexOf(value) === index).join(', ') || displayName || 'Your location' });
        } catch {
          setLocated({ status: 'found', lat, lon, accuracy, label: `${lat.toFixed(4)}, ${lon.toFixed(4)}` });
        }
      },
      (err) => setLocated({
        status: 'error',
        message: err.code === err.PERMISSION_DENIED
          ? 'Location access is blocked. Allow it for this site in your browser settings, or type your address below.'
          : err.code === err.TIMEOUT ? 'Finding your location took too long. Try again, or type your address below.' : 'We couldn’t find your location. Please type your address below.',
      }),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  };

  const orderAddress = () => ({
    name: address.name, phone: address.phone, email: address.email, city: address.city, state: address.state, pin: address.pin,
    line: [address.house.trim(), address.area.trim()].filter(Boolean).join(', '),
  });

  const place = (receipt?: PaymentReceipt) => {
    setPlacing(true);
    // A short pause for cash on delivery so the button can show progress.
    setTimeout(() => {
      try {
        const order = placeWebsiteOrder({ lines: lines.map(({ product, size, color, qty }) => ({ product, size, color, qty })), promo, payment, address: orderAddress(), receipt });
        myOrdersStore.set([order.id, ...myOrdersStore.get()]);
        navigate(`#/order/${order.id}`, { replace: true });
        bagStore.set([]);
        promoStore.set('');
      } catch (error) {
        setPlaceError(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
        setPlacing(false);
      }
    }, receipt ? 0 : 900);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setPlaceError('');
    if (Object.keys(problems).length) {
      setShowProblems(true);
      form.current?.querySelector<HTMLInputElement>(`[name="${Object.keys(problems)[0]}"]`)?.focus();
      return;
    }
    const short = lines.find((line) => line.qty > line.available);
    if (short) return setPlaceError(`Only ${short.available} of ${short.product.name} left. Update your bag to continue.`);
    if (payment === 'Cash on Delivery') place();
    else setPaying(true);
  };

  const field = (name: keyof Address, label: string, options: { autoComplete: string; type?: string; inputMode?: 'tel' | 'numeric' | 'email'; maxLength?: number; className?: string; placeholder?: string; prefix?: string; list?: string; onBlur?: () => void; hint?: string }) => {
    const problem = showProblems ? problems[name] : undefined;
    return (
      <div className={options.className}>
        <label htmlFor={`checkout-${name}`} className="block text-[12.5px] font-bold text-[#3A4A5F] mb-2">{label}</label>
        <div className={`flex items-center h-[52px] rounded-[16px] border bg-[var(--st-page)] transition-all focus-within:bg-white focus-within:ring-4 ${problem ? 'border-[#D23B3B] focus-within:ring-[#D23B3B]/10' : 'border-[#E3E8EF] focus-within:border-[var(--st-accent)] focus-within:ring-[var(--st-accent)]/10'}`}>
          {options.prefix && <span className="pl-4 pr-1 text-[15px] font-semibold text-[#6F7E92]">{options.prefix}</span>}
          <input
            id={`checkout-${name}`}
            name={name}
            type={options.type ?? 'text'}
            inputMode={options.inputMode}
            maxLength={options.maxLength}
            autoComplete={options.autoComplete}
            placeholder={options.placeholder}
            list={options.list}
            value={address[name]}
            onChange={(e) => update(name, e.target.value)}
            onBlur={options.onBlur}
            aria-invalid={Boolean(problem)}
            aria-describedby={problem ? `checkout-${name}-problem` : undefined}
            className={`w-full h-full ${options.prefix ? 'pl-1' : 'pl-4'} pr-4 bg-transparent text-[15px] font-medium text-[var(--st-ink)] outline-none placeholder:text-[#A9B4C2]`}
          />
        </div>
        {problem ? <p id={`checkout-${name}-problem`} className="mt-1.5 text-[12.5px] text-[#D23B3B]">{problem}</p> : options.hint ? <p className="mt-1.5 text-[12px] text-[#0F8A5F]">{options.hint}</p> : null}
      </div>
    );
  };

  const payLabel = payment === 'Cash on Delivery' ? `Place order · ${inr(totals.total)}` : `Pay ${inr(totals.total)} securely`;

  return (
    <div className={T.shell}>
      <header className="pt-10 sm:pt-14 pb-8 flex flex-wrap items-end justify-between gap-6">
        <div>
          <a href="#/bag" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#6F7E92] hover:text-[var(--st-ink)]"><Icon name="back" size={15} /> Back to bag</a>
          <h1 className={`mt-3 ${T.display} text-[40px] sm:text-[56px] leading-[1]`}>Secure <em>checkout</em></h1>
        </div>
        <CheckoutSteps current={paying ? 2 : 1} />
      </header>

      {account && (
        <p className="mb-6 inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[var(--st-accent)]/10 text-[14px] font-semibold text-[var(--st-accent)]">
          <Icon name="check" size={16} /> Signed in as {account.email} — your details are filled in
        </p>
      )}

      <form ref={form} onSubmit={submit} noValidate className="grid lg:grid-cols-[1.5fr_1fr] gap-6 lg:gap-8 items-start">
        <div className="space-y-6 min-w-0">
          <Card step="1" title="Contact details">
            <div className="grid sm:grid-cols-2 gap-x-5 gap-y-5">
              {field('name', 'Full name', { autoComplete: 'name', className: 'sm:col-span-2', placeholder: 'As it should appear on the parcel' })}
              {field('phone', 'Mobile number', { autoComplete: 'tel-national', type: 'tel', inputMode: 'tel', prefix: '+91', maxLength: 14, placeholder: '00000 00000' })}
              {field('email', 'Email', { autoComplete: 'email', type: 'email', inputMode: 'email', placeholder: 'For your receipt and updates' })}
            </div>
          </Card>

          <Card step="2" title="Delivery address">
            {/* Live location */}
            <div className={`mb-6 rounded-[22px] border overflow-hidden transition-colors ${located.status === 'found' ? 'border-[#B7E3CF]' : located.status === 'error' ? 'border-[#F3C4C4]' : 'border-[var(--st-accent-line)]'}`}>
              <div className={`flex flex-wrap items-center gap-4 p-4 sm:p-5 ${located.status === 'found' ? 'bg-[#F0FAF5]' : located.status === 'error' ? 'bg-[#FFF6F6]' : 'bg-gradient-to-r from-[var(--st-accent-soft)] to-[var(--st-accent-soft)]'}`}>
                <span className={`relative w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center text-white ${located.status === 'found' ? 'bg-[#0F8A5F]' : located.status === 'error' ? 'bg-[#D23B3B]' : 'bg-gradient-to-br from-[var(--st-accent)] to-[var(--st-accent-dark)] shadow-[0_10px_24px_-10px_rgba(47,107,255,0.8)]'}`}>
                  {located.status === 'locating' && <span className="absolute inset-0 rounded-2xl bg-[var(--st-accent)] animate-ping opacity-40" />}
                  <Icon name={located.status === 'found' ? 'check' : 'pin'} size={22} stroke={1.9} />
                </span>
                <div className="flex-1 min-w-[180px]">
                  <p className="text-[15px] font-extrabold text-[var(--st-ink)]">
                    {located.status === 'locating' ? 'Finding you…' : located.status === 'found' ? 'Location found' : located.status === 'error' ? 'Couldn’t get your location' : 'Use my current location'}
                  </p>
                  <p className="text-[13px] text-[#5B6B80] leading-snug">
                    {located.status === 'locating' ? 'Allow location access if your browser asks.'
                      : located.status === 'found' ? <>{located.label} · GPS accuracy about {Math.round(located.accuracy)} m. Check the address fields below; map data may not include your flat or house number.</>
                      : located.status === 'error' ? located.message
                      : 'We’ll fill in your street, city, state and PIN code.'}
                  </p>
                </div>
                <button type="button" onClick={useMyLocation} disabled={located.status === 'locating'}
                  className={`h-11 px-5 rounded-full text-[13.5px] font-bold flex items-center gap-2 transition-all disabled:opacity-60 ${located.status === 'idle' ? 'bg-[var(--st-accent)] text-white hover:bg-[var(--st-accent-dark)] shadow-[0_10px_24px_-12px_rgba(47,107,255,0.9)]' : 'bg-white border border-[#CFD8E3] text-[var(--st-ink)] hover:border-[var(--st-ink)]'}`}>
                  {located.status === 'locating' ? <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <Icon name="pin" size={16} />}
                  {located.status === 'idle' ? 'Detect location' : located.status === 'locating' ? 'Locating' : 'Detect again'}
                </button>
              </div>
              {located.status === 'found' && (
                <div className="relative h-40 sm:h-48 bg-[#EDF1F6]">
                  <iframe
                    title="Map of your location"
                    loading="lazy"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${located.lon - 0.004},${located.lat - 0.0025},${located.lon + 0.004},${located.lat + 0.0025}&layer=mapnik&marker=${located.lat},${located.lon}`}
                    className="absolute inset-0 w-full h-full border-0 pointer-events-none"
                  />
                  <span className="absolute left-3 bottom-3 px-2.5 py-1 rounded-full bg-white/95 text-[11px] font-bold text-[var(--st-ink)] shadow">📍 ±{Math.round(located.accuracy)} m · {located.lat.toFixed(5)}, {located.lon.toFixed(5)}</span>
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-x-5 gap-y-5">
              {field('house', 'Flat, house no., building', { autoComplete: 'address-line1', placeholder: 'e.g. Flat 302, Prestige Lakeside' })}
              {field('area', 'Street, area, landmark', { autoComplete: 'address-line2', placeholder: 'e.g. 100 Feet Road, Indiranagar' })}
              {field('pin', 'PIN code', { autoComplete: 'postal-code', inputMode: 'numeric', maxLength: 6, placeholder: '6 digits', onBlur: () => lookUpPin(address.pin.trim()), hint: pinLookup })}
              {field('city', 'City', { autoComplete: 'address-level2' })}
              {field('state', 'State', { autoComplete: 'address-level1', list: 'checkout-states', className: 'sm:col-span-2' })}
              <datalist id="checkout-states">{INDIAN_STATES.map((s) => <option key={s} value={s} />)}</datalist>
            </div>
          </Card>

          <Card step="3" title="Payment" aside={<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF9E8] border border-[#F5E1A4] text-[11px] font-extrabold uppercase tracking-wider text-[#6B4E00]">Razorpay · Test mode</span>}>
            <div role="radiogroup" aria-label="Payment method" className="space-y-3">
              {available.map((option) => {
                const selected = payment === option.id;
                return (
                  <label key={option.id} className={`flex items-center gap-4 p-4 sm:p-5 rounded-[20px] border cursor-pointer transition-all ${selected ? 'border-[var(--st-accent)] bg-[var(--st-accent-soft)] ring-4 ring-[var(--st-accent)]/10' : 'border-[#E3E8EF] hover:border-[#A9B4C2]'}`}>
                    <input type="radio" name="payment" value={option.id} checked={selected} onChange={() => setPayment(option.id)} className="sr-only" />
                    <span className={`w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center ${selected ? 'bg-[var(--st-accent)] text-white' : 'bg-[#F1F4F9] text-[#3A4A5F]'}`}><MethodGlyph method={option.id} size={20} /></span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-2 text-[15px] font-bold text-[var(--st-ink)]">{option.title}{option.badge && <span className="px-2 py-0.5 rounded-full bg-[#E3F4EC] text-[#0F8A5F] text-[10.5px] font-extrabold uppercase tracking-wide">{option.badge}</span>}</span>
                      <span className="block text-[12.5px] text-[#6F7E92] mt-0.5">{option.note}</span>
                    </span>
                    <span className={`w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center ${selected ? 'border-[var(--st-accent)]' : 'border-[#CFD8E3]'}`}>{selected && <span className="w-2.5 h-2.5 rounded-full bg-[var(--st-accent)]" />}</span>
                  </label>
                );
              })}
            </div>
            <p className="mt-5 text-[12.5px] text-[#6F7E92] flex items-start gap-2"><span className="mt-px"><Icon name="shield" size={15} stroke={1.5} /></span> Choose Razorpay to pay by UPI, card or net banking in one secure window, or choose cash on delivery. Test mode does not charge real money.</p>
          </Card>
        </div>

        <aside className="lg:sticky lg:top-28 bg-white border border-[#E3E8EF] rounded-[28px] overflow-hidden shadow-[0_30px_60px_-40px_rgba(14,26,43,0.3)]">
          <div className="p-6 sm:p-8">
            <h2 className="flex items-center justify-between text-[20px] font-extrabold tracking-tight text-[var(--st-ink)]">Order summary <a href="#/bag" className="text-[12.5px] font-bold text-[var(--st-accent)] hover:underline">Edit bag</a></h2>
            <ul className="mt-6 space-y-4 pb-6 border-b border-[#E3E8EF]">
              {lines.map((line) => (
                <li key={line.key} className="flex items-center gap-4">
                  <span className="relative flex-shrink-0">
                    <Photo src={productPhotos(line.product, line.color)[0]} alt="" width={160} className="w-16 aspect-[4/5] rounded-[14px] object-cover bg-[#EDF1F6]" />
                    <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-[var(--st-accent)] text-white text-[10.5px] font-bold flex items-center justify-center ring-2 ring-white">{line.qty}</span>
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[14px] font-semibold leading-snug text-[var(--st-ink)] line-clamp-2">{line.product.name}</span>
                    {variantLabel(line.size, line.color) && <span className="block text-[12.5px] text-[#6F7E92]">{variantLabel(line.size, line.color)}</span>}
                  </span>
                  <span className="text-[14px] font-semibold tabular-nums">{inr(line.product.price * line.qty)}</span>
                </li>
              ))}
            </ul>
            <div className="py-6 border-b border-[#E3E8EF]"><PromoBox /></div>
            <div className="pt-6"><TotalsList totals={totals} promo={promo} /></div>
            {totals.discount > 0 && <p className="mt-4 px-3.5 py-2.5 rounded-[14px] bg-[#E3F4EC] text-[13px] font-semibold text-[#0F8A5F]">You’re saving {inr(totals.discount)} on this order 🎉</p>}
            {placeError && <p role="alert" className="mt-5 p-3.5 rounded-[14px] bg-[#FDECEC] text-[#D23B3B] text-[13px]">{placeError}</p>}
            <button type="submit" disabled={placing || paying} className="mt-6 w-full h-14 rounded-full bg-gradient-to-r from-[var(--st-accent)] to-[var(--st-accent-2)] text-white text-[15.5px] font-extrabold shadow-[0_14px_34px_-12px_rgba(47,107,255,0.65)] hover:brightness-110 transition disabled:opacity-70 flex items-center justify-center gap-2">
              {placing ? <><span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Placing your order…</> : <><Icon name="lock" size={16} /> {payLabel}</>}
            </button>
          </div>
          <div className="px-6 sm:px-8 py-5 bg-[var(--st-page)] border-t border-[#E3E8EF] grid grid-cols-3 gap-2 text-center text-[11px] font-semibold text-[#5B6B80]">
            <span className="flex flex-col items-center gap-1.5"><span className="text-[var(--st-accent)]"><Icon name="shield" size={18} /></span>Secure payment</span>
            <span className="flex flex-col items-center gap-1.5"><span className="text-[var(--st-accent)]"><Icon name="refresh" size={18} /></span>7-day returns</span>
            <span className="flex flex-col items-center gap-1.5"><span className="text-[var(--st-accent)]"><Icon name="truck" size={18} /></span>Ships in 48 hrs</span>
          </div>
        </aside>
      </form>

      {paying && (
        <RazorpayCheckout
          amount={totals.total}
          gateway={gateway}
          prefill={{ name: address.name, email: address.email, phone: address.phone }}
          onSuccess={(receipt) => { setPaying(false); place(receipt); }}
          onDismiss={(reason) => { setPaying(false); setPlaceError(reason); }}
        />
      )}
    </div>
  );
}

// =============================================================================
// Order Pages (status comes live from the admin panel)
// =============================================================================

const STEPS: { status: OrderStatus; label: string; icon: string }[] = [
  { status: 'Pending', label: 'Order placed', icon: 'check' },
  { status: 'Processing', label: 'Being packed', icon: 'box' },
  { status: 'Shipped', label: 'On its way', icon: 'truck' },
  { status: 'Delivered', label: 'Delivered', icon: 'gift' },
];

const STATUS_STYLE: Record<OrderStatus, string> = {
  Pending: 'bg-[var(--st-accent-soft)] text-[var(--st-accent-dark)]',
  Processing: 'bg-[#FFF4E0] text-[#A15C00]',
  Shipped: 'bg-[#EEE9FF] text-[#5B3FD6]',
  Delivered: 'bg-[#E3F4EC] text-[#0F8A5F]',
  Cancelled: 'bg-[#FDECEC] text-[#D23B3B]',
};

function CopyChip({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button type="button" onClick={() => { navigator.clipboard?.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {}); }}
      aria-label={`Copy ${label}`} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 font-mono text-[12.5px] transition-colors">
      {value} <span className="font-sans text-[11px] font-bold text-white/70">{copied ? 'Copied ✓' : 'Copy'}</span>
    </button>
  );
}

export function OrderPage({ order }: { order: Order }) {
  const storeInfo = useStoreDetails();
  const reached = STEPS.findIndex((s) => s.status === order.orderStatus);
  const cancelled = order.orderStatus === 'Cancelled';
  const delivered = order.orderStatus === 'Delivered';
  const arrivesBy = new Date(new Date(order.placedAt).getTime() + 5 * 24 * 60 * 60 * 1000).toISOString();
  const paid = order.paymentStatus === 'Paid';
  const firstName = order.customerName.split(/\s+/)[0];
  const methodGlyph = order.paymentMethod === 'Credit Card' ? 'Card' : order.paymentMethod;

  return (
    <div className="max-w-[1100px] mx-auto px-5 sm:px-8 pt-8 sm:pt-10">
      {/* Confirmation hero */}
      <section className={`on-dark relative overflow-hidden rounded-[32px] text-white px-6 py-10 sm:px-12 sm:py-14 ${cancelled ? 'bg-gradient-to-br from-[#3A1620] to-[var(--st-ink)]' : 'bg-gradient-to-br from-[var(--st-ink)] via-[var(--st-ink-2)] to-[#1F3A66]'}`}>
        <span aria-hidden="true" className="absolute -top-32 -right-24 w-96 h-96 rounded-full bg-[var(--st-accent)]/30 blur-[100px]" />
        <span aria-hidden="true" className="absolute -bottom-40 -left-20 w-96 h-96 rounded-full bg-[var(--st-accent-2)]/15 blur-[100px]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-7">
          <span className={`hero-pop w-20 h-20 shrink-0 rounded-full flex items-center justify-center shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] ${cancelled ? 'bg-[#D23B3B]' : 'bg-gradient-to-br from-[var(--st-accent)] to-[var(--st-accent-2)] ring-8 ring-white/10'}`}>
            <Icon name={cancelled ? 'close' : delivered ? 'gift' : 'check'} size={36} stroke={2.2} />
          </span>
          <div className="min-w-0">
            <p className="text-[12px] uppercase tracking-[0.24em] font-bold text-[var(--st-accent-light)]">{cancelled ? 'Order cancelled' : delivered ? 'Delivered' : 'Order confirmed'}</p>
            <h1 className={`mt-2 ${T.display} text-[38px] sm:text-[54px] leading-[1.02]`}>
              {cancelled ? <>This order was <em>cancelled</em></> : delivered ? <>Delivered. <em>Enjoy, {firstName}.</em></> : <>Thank you, <em>{firstName}!</em></>}
            </h1>
            <p className="mt-3 text-[15.5px] text-white/75 max-w-xl">
              {cancelled ? 'Any payment will be refunded to the original method within 5–7 working days.' : delivered ? 'We hope it brings you joy for years to come.' : <>Your order is confirmed and will arrive by <span className="font-bold text-white">{formatDate(arrivesBy)}</span>. A receipt was sent to {order.email}.</>}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <CopyChip value={order.orderNumber} label="order number" />
              <span className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-[12.5px] font-semibold">{formatDate(order.placedAt, true)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tracker */}
      {!cancelled && (
        <section className="mt-6 bg-white border border-[#E3E8EF] rounded-[28px] px-5 py-7 sm:px-10">
          <ol className="grid grid-cols-4" aria-label="Order progress">
            {STEPS.map((step, index) => {
              const done = index <= reached;
              return (
                <li key={step.status} className="relative text-center" aria-current={index === reached ? 'step' : undefined}>
                  {index > 0 && <span className={`absolute top-[19px] sm:top-[21px] right-1/2 w-full h-[3px] rounded-full ${done ? 'bg-gradient-to-r from-[var(--st-accent)] to-[var(--st-accent-2)]' : 'bg-[#E3E8EF]'}`} />}
                  <span className={`relative z-10 mx-auto w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all ${done ? 'bg-[var(--st-accent)] text-white shadow-[0_10px_24px_-10px_rgba(47,107,255,0.9)]' : 'bg-[#F1F4F9] text-[#A9B4C2]'} ${index === reached ? 'ring-[6px] ring-[var(--st-accent)]/15' : ''}`}>
                    <Icon name={step.icon} size={19} stroke={1.9} />
                  </span>
                  <span className={`block mt-3 px-1 text-[10.5px] sm:text-[13px] font-bold leading-tight ${done ? 'text-[var(--st-ink)]' : 'text-[#A9B4C2]'}`}>{step.label}</span>
                </li>
              );
            })}
          </ol>
          {order.shipment?.awb && order.shipment.status !== 'Cancelled' && (
            <div className="mt-7 p-4 sm:p-5 rounded-[20px] bg-[var(--st-page)] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="w-11 h-11 rounded-2xl bg-white text-[var(--st-accent)] flex items-center justify-center border border-[#E3E8EF]"><Icon name="truck" size={21} /></span>
                <div>
                  <p className="text-[14.5px] font-bold text-[var(--st-ink)]">{order.shipment.courier} · <span className="font-mono font-semibold">{order.shipment.awb}</span></p>
                  <p className="text-[12.5px] text-[#6F7E92]">Dispatched from {order.shipment.pickup}</p>
                </div>
              </div>
              <span className="text-[11.5px] font-extrabold uppercase tracking-wider px-3.5 py-1.5 rounded-full bg-[var(--st-accent-soft)] text-[var(--st-accent-dark)]">{order.shipment.status}</span>
            </div>
          )}
        </section>
      )}

      <div className="mt-6 grid md:grid-cols-[1.45fr_1fr] gap-6 items-start">
        <section className="bg-white border border-[#E3E8EF] rounded-[28px] p-6 sm:p-8">
          <h2 className="flex items-center justify-between text-[19px] font-extrabold tracking-tight text-[var(--st-ink)]">Items <span className="text-[13px] font-semibold text-[#6F7E92]">{order.itemsCount} {order.itemsCount === 1 ? 'piece' : 'pieces'}</span></h2>
          <ul className="mt-6 space-y-4 pb-6 border-b border-[#E3E8EF]">
            {order.items.map((item, i) => (
              <li key={i} className="flex items-center gap-4">
                <Photo src={item.image} alt="" width={160} className="w-16 aspect-[4/5] rounded-[14px] object-cover bg-[#EDF1F6] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <a href={`#/product/${item.productId}`} className="block text-[14.5px] font-semibold leading-snug hover:text-[var(--st-accent)]">{item.name}</a>
                  <p className="text-[12.5px] text-[#6F7E92]">{[variantLabel(item.size, item.color), `Qty ${item.qty}`].filter(Boolean).join(' · ')}</p>
                </div>
                <span className="text-[14px] font-semibold tabular-nums">{inr(item.price * item.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="pt-6"><TotalsList totals={order} promo={order.promo} /></div>
        </section>

        <div className="space-y-6">
          <section className="bg-white border border-[#E3E8EF] rounded-[28px] p-6 sm:p-7">
            <h2 className="flex items-center gap-2.5 text-[12px] uppercase tracking-[0.16em] font-extrabold text-[#6F7E92]"><span className="text-[var(--st-accent)]"><Icon name="pin" size={16} /></span>Delivering to</h2>
            <p className="mt-3 text-[15px] font-bold text-[var(--st-ink)]">{order.customerName}</p>
            <p className="mt-1 text-[14px] leading-relaxed break-words text-[#3A4A5F]">{order.shippingAddress}<br />{order.city}{order.state ? `, ${order.state}` : ''} {order.postalCode}</p>
            <p className="mt-2 text-[13.5px] text-[#6F7E92]">{order.phone}</p>
          </section>

          <section className="bg-white border border-[#E3E8EF] rounded-[28px] p-6 sm:p-7">
            <h2 className="flex items-center gap-2.5 text-[12px] uppercase tracking-[0.16em] font-extrabold text-[#6F7E92]"><span className="text-[var(--st-accent)]"><Icon name="card" size={16} /></span>Payment</h2>
            <div className="mt-4 flex items-center gap-3.5">
              <span className="w-11 h-11 rounded-2xl bg-[#F1F4F9] text-[var(--st-ink)] flex items-center justify-center"><MethodGlyph method={methodGlyph} size={20} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] font-bold text-[var(--st-ink)] truncate">{order.paymentDetail ?? order.paymentMethod}</p>
                <p className={`text-[12.5px] font-bold ${cancelled && paid ? 'text-[#A15C00]' : paid ? 'text-[#0F8A5F]' : 'text-[var(--st-accent)]'}`}>
                  {cancelled && paid ? 'Refund initiated' : paid ? `Paid ${inr(order.total)}` : order.paymentMethod === 'Cash on Delivery' ? `Pay ${inr(order.total)} on delivery` : 'Awaiting confirmation'}
                </p>
              </div>
            </div>
            {order.paymentId && (
              <div className="mt-4 p-3.5 rounded-[16px] bg-[var(--st-page)] text-[12.5px] space-y-1.5">
                <p className="flex justify-between gap-3"><span className="text-[#6F7E92]">Payment ID</span><span className="font-mono text-[var(--st-ink)] truncate">{order.paymentId}</span></p>
                {order.gatewayOrderId && <p className="flex justify-between gap-3"><span className="text-[#6F7E92]">Razorpay order</span><span className="font-mono text-[var(--st-ink)] truncate">{order.gatewayOrderId}</span></p>}
                <p className="flex justify-between gap-3"><span className="text-[#6F7E92]">Processed by</span><span className="font-bold italic text-[var(--st-ink)]">Razorpay</span></p>
              </div>
            )}
          </section>

          <section className="rounded-[28px] p-6 sm:p-7 bg-gradient-to-br from-[var(--st-accent-soft)] to-[var(--st-page)] border border-[var(--st-accent-line)]">
            <p className="text-[15px] font-extrabold text-[var(--st-ink)]">Need help with this order?</p>
            <p className="mt-1 text-[13.5px] text-[#5B6B80]">Our team replies within the hour, 7 days a week.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href="#/contact" className="h-10 px-4 rounded-full bg-white border border-[#CFD8E3] text-[13px] font-bold inline-flex items-center gap-2 hover:border-[var(--st-ink)]"><Icon name="chat" size={15} /> Contact us</a>
              <a href={`tel:${storeInfo.phone.replace(/\s/g, '')}`} className="h-10 px-4 rounded-full bg-white border border-[#CFD8E3] text-[13px] font-bold inline-flex items-center gap-2 hover:border-[var(--st-ink)]"><Icon name="phone" size={15} /> Call</a>
            </div>
          </section>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href="#/shop" variant="accent">Continue shopping <Icon name="arrow" size={16} /></Button>
        <Button href="#/orders" variant="outline">All your orders</Button>
      </div>
    </div>
  );
}

export function OrdersPage() {
  const myIds = useStore(myOrdersStore);
  const orders = useStore(ordersStore);
  const account = useAccount();
  // Orders placed on this device, plus every order a signed-in member placed anywhere.
  const mine = orders.filter((o) => myIds.includes(o.id) || (account && o.email.toLowerCase() === account.email));
  if (!mine.length) {
    return <EmptyState icon="box" title="No orders yet" text="Orders you place on this device will be listed here, with live delivery updates." action={{ label: 'Start shopping', href: '#/shop' }} />;
  }
  return (
    <div className="max-w-[1040px] mx-auto px-5 sm:px-8">
      <PageTitle eyebrow="Your account" title={<>Your <em>orders</em></>} />
      <ul className="space-y-4">
        {mine.map((order) => {
          const reached = STEPS.findIndex((s) => s.status === order.orderStatus);
          return (
            <li key={order.id}>
              <a href={`#/order/${order.id}`} className="group block bg-white border border-[#E3E8EF] rounded-[24px] p-5 sm:p-6 hover:border-[var(--st-accent)]/50 hover:shadow-[0_24px_50px_-30px_rgba(47,107,255,0.45)] transition-all">
                <div className="flex flex-wrap items-center gap-5">
                  <div className="flex -space-x-4">
                    {order.items.slice(0, 3).map((item, i) => <Photo key={i} src={item.image} alt="" width={140} className="w-14 aspect-[4/5] rounded-[14px] object-cover border-2 border-white bg-[#EDF1F6]" />)}
                  </div>
                  <div className="flex-1 min-w-[160px]">
                    <p className="font-mono text-[14px] font-bold text-[var(--st-ink)]">{order.orderNumber}</p>
                    <p className="text-[13px] text-[#6F7E92]">{formatDate(order.placedAt)} · {order.itemsCount} {order.itemsCount === 1 ? 'piece' : 'pieces'} · {order.paymentMethod}</p>
                  </div>
                  <span className={`text-[11px] font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-full ${STATUS_STYLE[order.orderStatus]}`}>{order.orderStatus}</span>
                  <p className="text-[17px] font-extrabold tabular-nums">{inr(order.total)}</p>
                  <span className="w-9 h-9 rounded-full bg-[#F1F4F9] flex items-center justify-center transition-all group-hover:bg-[var(--st-accent)] group-hover:text-white"><Icon name="arrow" size={16} /></span>
                </div>
                {order.orderStatus !== 'Cancelled' && (
                  <div className="mt-5 grid grid-cols-4 gap-1.5" aria-hidden="true">
                    {STEPS.map((step, i) => <span key={step.status} className={`h-1.5 rounded-full ${i <= reached ? 'bg-gradient-to-r from-[var(--st-accent)] to-[var(--st-accent-2)]' : 'bg-[#EDF1F6]'}`} />)}
                  </div>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// =============================================================================
// About, Help, Contact and Not Found Pages
// =============================================================================

const TIMELINE = [
  ['2019', 'A weekend pop-up', 'Two friends, one table in Indiranagar and twelve gadgets they genuinely loved. It sold out by Sunday.'],
  ['2021', 'The online store', 'We moved online with a promise: a small range, honest prices and real people answering every message.'],
  ['2023', 'Our Bengaluru studio', 'A testing lab, a showroom and a warehouse under one roof — and dispatch within 48 hours.'],
  ['2026', 'Members & beyond', 'Live order tracking, a members programme and delivery to every PIN code in India.'],
];

const PROCESS = [
  ['search', 'Research', 'We read the reviews, the teardown reports and the fine print before a sample is ever ordered.'],
  ['flask', '30-day test', 'Our team uses each product every day for a month — at work, on trips and at home.'],
  ['wrench', 'Built to last', 'We check repairability, battery health and how long the maker supports updates.'],
  ['tag', 'Fair price', 'Only then do we negotiate a price we’d be happy to pay ourselves, GST included.'],
];

const TEAM = [
  ['Ananya Rao', 'Founder & curator', 'from-[var(--st-accent)] to-[var(--st-ink)]'],
  ['Vikram Shetty', 'Head of testing', 'from-[var(--st-accent-2)] to-[#16305A]'],
  ['Neha Pillai', 'Customer care lead', 'from-[#9AA7B8] to-[var(--st-ink-3)]'],
  ['Arjun Mehta', 'Operations & delivery', 'from-[var(--st-accent-dark)] to-[var(--st-deep)]'],
];

export function AboutPage() {
  const storeInfo = useStoreDetails();
  const { products, categories } = useCatalog();
  const reviews = products.reduce((sum, p) => sum + p.reviews, 0);
  const avg = products.length ? products.reduce((sum, p) => sum + p.rating, 0) / products.length : 0;
  const hero = categories.find((c) => c.name === 'Computing')?.image ?? categories[0]?.image ?? '';
  const second = categories.find((c) => c.name === 'Audio')?.image ?? hero;

  return (
    <div className={T.shell}>
      {/* Intro */}
      <section className="grid lg:grid-cols-[1fr_1.05fr] gap-10 lg:gap-14 items-center pt-8 sm:pt-12">
        <Reveal from="left">
          <p className={`${T.eyebrow} mb-4`}>About {storeInfo.name}</p>
          <h1 className={`${T.display} text-[46px] sm:text-[72px] leading-[0.98]`}>Fewer things. <em>Better ones.</em></h1>
          <p className="mt-6 text-[17px] leading-[1.75] text-[#3A4A5F] max-w-xl">A good gadget should disappear into your day. It should work the first time, last for years and never need an explanation. That is the only kind we want to sell.</p>
          <p className="mt-4 text-[17px] leading-[1.75] text-[#3A4A5F] max-w-xl">So we keep our range small, test everything ourselves, price it plainly and stand behind every product we ship.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="#/shop" variant="accent">Explore the collection <Icon name="arrow" size={16} /></Button>
            <Button href="#/contact" variant="outline">Talk to us</Button>
          </div>
        </Reveal>
        <Reveal from="right" delay={120} className="relative">
          <div className="relative aspect-[5/4] rounded-[32px] overflow-hidden bg-[#EDF1F6] shadow-[0_50px_100px_-50px_rgba(14,26,43,0.6)]">
            <Photo src={hero} alt="" width={1200} eager className="h-full w-full object-cover" />
          </div>
          <div className="hidden sm:block absolute -bottom-8 -left-8 w-[42%] aspect-square rounded-[26px] overflow-hidden ring-8 ring-[var(--st-page)] shadow-[0_30px_60px_-30px_rgba(14,26,43,0.6)] float">
            <Photo src={second} alt="" width={500} className="h-full w-full object-cover" />
          </div>
          <div className="absolute -top-5 right-5 px-5 py-4 rounded-[20px] bg-white shadow-[0_30px_60px_-25px_rgba(14,26,43,0.5)] float" style={{ animationDelay: '1s' }}>
            <p className="text-[26px] font-extrabold tracking-[-0.03em] leading-none"><span className="text-[#F5B000]">★</span> {avg.toFixed(1)}</p>
            <p className="text-[12px] font-semibold text-[#6F7E92] mt-1">{reviews.toLocaleString('en-IN')} reviews</p>
          </div>
        </Reveal>
      </section>

      {/* Numbers */}
      <Reveal from="up" className="mt-16 sm:mt-20 grid grid-cols-2 lg:grid-cols-4 rounded-[28px] bg-white border border-[#E3E8EF] overflow-hidden">
        {[
          ['2019', 'Founded in Bengaluru'],
          [String(products.length), 'Products, each one tested'],
          ['48 hrs', 'Average dispatch time'],
          ['19,000+', 'PIN codes we deliver to'],
        ].map(([value, label], i) => (
          <div key={label} className={`p-7 sm:p-8 ${i % 2 ? 'border-l border-[#E3E8EF]' : ''} ${i === 2 ? 'lg:border-l' : ''} ${i > 1 ? 'border-t lg:border-t-0 border-[#E3E8EF]' : ''}`}>
            <p className={`${T.display} text-[36px] sm:text-[48px] leading-none bg-gradient-to-b from-[var(--st-ink)] to-[#3A5A8F] bg-clip-text text-transparent`}>{value}</p>
            <p className="mt-2.5 text-[13.5px] font-semibold text-[#6F7E92]">{label}</p>
          </div>
        ))}
      </Reveal>

      {/* Story timeline */}
      <section className="pt-12 sm:pt-16">
        <Reveal><SectionHeading eyebrow="Our story" title={<>From a pop-up table to <em>your doorstep</em></>} /></Reveal>
        <div className="relative">
          <span aria-hidden="true" className="absolute left-[19px] md:left-1/2 top-2 bottom-2 w-px bg-gradient-to-b from-[var(--st-accent)]/50 via-[#CFD8E3] to-transparent" />
          <ol className="space-y-6 md:space-y-2">
            {TIMELINE.map(([year, title, text], i) => (
              <li key={year} className={`relative md:grid md:grid-cols-2 md:gap-16 ${i % 2 ? '' : ''}`}>
                <span aria-hidden="true" className="absolute left-[12px] md:left-1/2 md:-translate-x-1/2 top-7 w-[15px] h-[15px] rounded-full bg-[var(--st-accent)] ring-4 ring-[var(--st-page)] shadow-[0_0_0_6px_rgba(47,107,255,0.15)]" />
                <Reveal from={i % 2 ? 'right' : 'left'} delay={80} className={`pl-12 md:pl-0 ${i % 2 ? 'md:col-start-2' : 'md:text-right'}`}>
                  <div className={`inline-block p-6 sm:p-7 rounded-[24px] bg-white border border-[#E3E8EF] shadow-[0_30px_60px_-50px_rgba(14,26,43,0.6)] max-w-md ${i % 2 ? '' : 'md:ml-auto'} text-left`}>
                    <p className="text-[13px] font-extrabold text-[var(--st-accent)]">{year}</p>
                    <h3 className="mt-1 text-[20px] font-bold tracking-[-0.02em]">{title}</h3>
                    <p className="mt-2 text-[14.5px] leading-relaxed text-[#5B6B80]">{text}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* How we choose */}
      <section className="mt-12 sm:mt-16 on-dark relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[var(--st-ink)] via-[var(--st-ink-2)] to-[var(--st-deep)] text-white p-7 sm:p-12">
        <span aria-hidden="true" className="pointer-events-none absolute -top-32 right-0 w-[520px] h-[420px] rounded-full bg-[var(--st-accent)]/30 blur-[120px]" />
        <Reveal className="relative max-w-2xl">
          <p className="text-[12px] uppercase tracking-[0.2em] font-bold text-[var(--st-accent-light)] mb-4">How we choose</p>
          <h2 className={`${T.display} text-[36px] sm:text-[52px] leading-[1.02]`}>Four checks before anything <em>reaches you</em></h2>
        </Reveal>
        <div className="relative mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PROCESS.map(([icon, title, text], i) => (
            <Reveal key={title} from="up" delay={i * 120} className="h-full">
              <div className="h-full p-6 rounded-[24px] bg-white/[0.06] border border-white/10 backdrop-blur-md hover:bg-white/[0.1] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="w-11 h-11 rounded-[14px] bg-[var(--st-accent)] flex items-center justify-center shadow-[0_10px_24px_-8px_rgba(47,107,255,0.8)]"><Icon name={icon} size={20} /></span>
                  <span className="text-[32px] font-extrabold text-white/10 leading-none">0{i + 1}</span>
                </div>
                <h3 className="mt-6 text-[18px] font-bold tracking-[-0.02em]">{title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-white/65">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="pt-12 sm:pt-16 grid md:grid-cols-3 gap-4">
        {[
          ['spark', 'Chosen, not stacked', 'Every product earns its place. If we would not use it ourselves, it does not go on the shelf.'],
          ['tag', 'Plain pricing', 'One price, taxes included, with the saving shown clearly. No surprises at checkout.'],
          ['leaf', 'Kinder packaging', 'Plastic-free boxes, recycled paper fill — and we take your old gadgets back for recycling.'],
        ].map(([icon, title, text], i) => (
          <Reveal key={title} from={i === 0 ? 'left' : i === 2 ? 'right' : 'up'} delay={i * 100} className="h-full">
            <div className="h-full p-7 sm:p-8 rounded-[26px] bg-white border border-[#E3E8EF]">
              <span className="w-12 h-12 rounded-full bg-[var(--st-accent)]/10 text-[var(--st-accent)] flex items-center justify-center"><Icon name={icon} size={21} /></span>
              <h3 className="mt-5 text-[20px] font-bold tracking-[-0.02em]">{title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[#5B6B80]">{text}</p>
            </div>
          </Reveal>
        ))}
      </section>

      {/* Team */}
      <section className="pt-12 sm:pt-16">
        <Reveal><SectionHeading eyebrow="The people" title={<>The team <em>behind the shelf</em></>} /></Reveal>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {TEAM.map(([name, role, gradient], i) => (
            <Reveal key={name} from="up" delay={i * 110}>
              <div className="group p-6 rounded-[26px] bg-white border border-[#E3E8EF] text-center hover:-translate-y-1 hover:shadow-[0_30px_60px_-40px_rgba(14,26,43,0.5)] transition-all duration-500">
                <span className={`mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br ${gradient} text-white text-[24px] sm:text-[28px] font-extrabold flex items-center justify-center ring-4 ring-[#EDF1F6] group-hover:scale-105 transition-transform duration-500`}>
                  {name.split(' ').map((w) => w[0]).join('')}
                </span>
                <h3 className="mt-5 text-[16.5px] font-bold tracking-[-0.02em]">{name}</h3>
                <p className="text-[13.5px] text-[#6F7E92]">{role}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <Reveal from="scale" className="mt-12 sm:mt-16">
        <div className="relative overflow-hidden rounded-[32px] bg-white border border-[#E3E8EF] p-8 sm:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <span aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 w-[360px] h-[360px] rounded-full bg-[var(--st-accent)]/10 blur-[80px]" />
          <div className="relative">
            <h2 className={`${T.display} text-[32px] sm:text-[44px] leading-[1.05]`}>Find your next <em>favourite thing</em></h2>
            <p className="mt-3 text-[16px] text-[#5B6B80]">{products.length} products, each one chosen with care.</p>
          </div>
          <Button href="#/shop" variant="accent" className="relative">Shop the collection <Icon name="arrow" size={16} /></Button>
        </div>
      </Reveal>
    </div>
  );
}

const faqs = (storeInfo: StoreDetails): [string, string][] => [
  ['How long does delivery take?', 'Most orders arrive in 3 to 5 working days. You will see the expected date on your order page as soon as you place an order, and it updates as your parcel moves.'],
  ['How much does delivery cost?', `Delivery is complimentary on orders of ${inr(FREE_DELIVERY_FROM)} or more. Smaller orders have a flat ₹149 delivery fee.`],
  ['Can I return something?', storeInfo.returnPolicy],
  ['Which payment options do you offer?', 'Razorpay supports UPI, cards and net banking in one secure checkout, or choose cash on delivery. Prices already include GST, so there is nothing extra to pay at checkout apart from any delivery fee.'],
  ['How do I track my order?', 'Sign in and tap your name in the top corner — your latest order and its live status are right there. Every order also has its own tracking page with courier details once it ships.'],
  ['Do I need an account to order?', 'No. You can check out as a guest. An account simply fills in your details for you and keeps all your orders in one place.'],
  ['How do I use a promo code?', 'Enter it in your bag before checkout, or tap Apply on one of the available offers. Each code has a minimum order value and dates, and your bag tells you if a code cannot be used.'],
];

const TOPICS = ['An order', 'Product advice', 'Returns & warranty', 'Partnerships', 'Something else'];

const locations = (storeInfo: StoreDetails) => [
  ['Bengaluru Studio', 'Flagship · showroom & testing lab', storeInfo.address, 'Mon–Sat · 10am–8pm'],
  ['Mumbai Pickup Point', 'Collect orders & quick returns', 'Shop 4, Linking Road, Bandra West, Mumbai 400050', 'Mon–Sat · 11am–7pm'],
  ['Chennai Service Centre', 'Repairs & warranty claims', '18, Cathedral Road, Gopalapuram, Chennai 600086', 'Tue–Sun · 10am–6pm'],
];

export function ContactPage() {
  const storeInfo = useStoreDetails();
  const { products, categories } = useCatalog();
  const [message, setMessage] = useState({ name: '', email: '', order: '', text: '' });
  const [topic, setTopic] = useState(TOPICS[0]);
  const [sent, setSent] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const digits = storeInfo.phone.replace(/\D/g, '');
  const problems = {
    name: message.name.trim().length < 2 ? 'Enter your name.' : '',
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(message.email.trim()) ? '' : 'Enter a valid email address.',
    text: message.text.trim().length < 10 ? 'Tell us a little more (10 characters or more).' : '',
  };

  const channels = [
    ['phone', 'Call us', storeInfo.phone, 'Mon–Sat, 10am–7pm', `tel:${digits}`],
    ['mail', 'Email', storeInfo.email, 'Replies within 24 hours', `mailto:${storeInfo.email}`],
    ['chat', 'WhatsApp', 'Chat with an expert', 'Usually replies in minutes', `https://wa.me/${digits}`],
    ['pin', 'Visit the studio', 'Indiranagar, Bengaluru', 'Mon–Sat, 10am–8pm', '#contact-locations'],
  ];
  const contactHeroImage = categories.find((category) => category.name === 'Computing' && category.image)?.image
    ?? categories.find((category) => category.image)?.image
    ?? products.find((product) => product.isFeatured)?.image
    ?? products[0]?.image;

  return (
    <div className={T.shell}>
      <PageTitle image={contactHeroImage} eyebrow="Contact" title={<>We&apos;re here to <em>help</em></>} text="Questions about a product, an order or anything else — real people reply, usually within a few hours." />

      {/* Channels */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {channels.map(([icon, title, value, note, href], i) => (
          <Reveal key={title} from={i < 2 ? 'left' : 'right'} delay={i * 90} className="h-full">
            <a
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="group h-full flex flex-col p-6 rounded-[26px] bg-white border border-[#E3E8EF] hover:border-[var(--st-accent)]/30 hover:-translate-y-1 hover:shadow-[0_30px_60px_-40px_rgba(14,26,43,0.5)] transition-all duration-500"
            >
              <span className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-[var(--st-accent)] to-[var(--st-ink)] text-white flex items-center justify-center shadow-[0_12px_24px_-10px_rgba(47,107,255,0.7)]"><Icon name={icon} size={20} /></span>
              <p className="mt-5 text-[13px] font-bold text-[#6F7E92]">{title}</p>
              <p className="mt-1 text-[16.5px] font-bold tracking-[-0.02em] break-words">{value}</p>
              <p className="mt-auto pt-4 text-[13px] text-[#8A97A8] flex items-center justify-between">{note}<span className="text-[var(--st-accent)] transition-transform group-hover:translate-x-1"><Icon name="arrow" size={16} /></span></p>
            </a>
          </Reveal>
        ))}
      </div>

      {/* Form + studio */}
      <div className="mt-6 grid lg:grid-cols-[1.35fr_1fr] gap-6 items-start">
        <Reveal from="left">
          <section className="rounded-[28px] bg-white border border-[#E3E8EF] p-6 sm:p-10">
            {sent ? (
              <div role="status" className="text-center py-10">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#E3F4EC] text-[#0F8A5F] flex items-center justify-center"><Icon name="check" size={28} /></div>
                <h2 className={`${T.display} text-[32px] leading-tight`}>Thank you, {message.name.trim().split(/\s+/)[0]}.</h2>
                <p className="mt-3 text-[15px] text-[#5B6B80] max-w-sm mx-auto">We&apos;ve received your message about “{topic.toLowerCase()}”. This is a demo store, so nothing was actually sent.</p>
                <Button onClick={() => { setSent(false); setMessage({ name: '', email: '', order: '', text: '' }); setShowErrors(false); }} variant="outline" className="mt-7">Send another message</Button>
              </div>
            ) : (
              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  if (Object.values(problems).some(Boolean)) return setShowErrors(true);
                  setSent(true);
                }}
                className="space-y-6"
              >
                <div>
                  <h2 className={`${T.display} text-[28px]`}>Send us a message</h2>
                  <p className="mt-1.5 text-[14.5px] text-[#5B6B80]">What can we help you with?</p>
                </div>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Topic">
                  {TOPICS.map((t) => (
                    <button key={t} type="button" role="radio" aria-checked={topic === t} onClick={() => setTopic(t)} className={`px-4 h-10 rounded-full text-[13.5px] font-semibold border transition-all ${topic === t ? 'bg-[var(--st-ink)] text-white border-[var(--st-ink)]' : 'bg-[var(--st-page)] border-[#E3E8EF] text-[#3A4A5F] hover:border-[var(--st-ink)]'}`}>
                      {t}
                    </button>
                  ))}
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field id="contact-name" label="Your name" icon="user" autoComplete="name" value={message.name} onChange={(v) => setMessage({ ...message, name: v })} error={showErrors ? problems.name : undefined} />
                  <Field id="contact-email" label="Email" icon="mail" type="email" inputMode="email" autoComplete="email" value={message.email} onChange={(v) => setMessage({ ...message, email: v })} error={showErrors ? problems.email : undefined} />
                </div>
                {topic === 'An order' && (
                  <Field id="contact-order" label="Order number (optional)" icon="box" placeholder="e.g. ORD-98215" value={message.order} onChange={(v) => setMessage({ ...message, order: v.toUpperCase() })} />
                )}
                <div>
                  <label htmlFor="contact-message" className="block text-[13px] font-semibold text-[#3A4A5F] mb-2">Message</label>
                  <textarea
                    id="contact-message"
                    rows={5}
                    value={message.text}
                    onChange={(e) => setMessage({ ...message, text: e.target.value })}
                    placeholder="Tell us what's on your mind…"
                    className={`w-full px-4 py-3.5 rounded-[14px] border bg-[var(--st-page)] text-[15.5px] outline-none resize-y transition-all focus:bg-white focus:ring-4 ${showErrors && problems.text ? 'border-[#D23B3B] focus:ring-[#D23B3B]/10' : 'border-[#E3E8EF] focus:border-[var(--st-accent)] focus:ring-[var(--st-accent)]/10'}`}
                  />
                  {showErrors && problems.text && <p className="mt-1.5 text-[12.5px] font-medium text-[#D23B3B]">{problems.text}</p>}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p className="text-[13px] text-[#8A97A8] flex items-center gap-2"><Icon name="clock" size={16} /> Average reply time: 3 hours</p>
                  <Button type="submit" variant="accent">Send message <Icon name="arrow" size={16} /></Button>
                </div>
              </form>
            )}
          </section>
        </Reveal>

        <Reveal from="right" delay={120} className="space-y-6">
          {/* Stylised map */}
          <section className="on-dark relative overflow-hidden rounded-[28px] bg-[var(--st-ink)] text-white">
            <svg aria-hidden="true" viewBox="0 0 400 230" className="w-full h-[230px]">
              <defs>
                <radialGradient id="map-glow" cx="50%" cy="50%" r="50%"><stop offset="0" style={{ stopColor: 'var(--st-accent)' }} stopOpacity="0.45" /><stop offset="1" style={{ stopColor: 'var(--st-accent)' }} stopOpacity="0" /></radialGradient>
              </defs>
              <rect width="400" height="230" style={{ fill: 'var(--st-ink)' }} />
              {[30, 75, 120, 165, 210].map((y) => <line key={`h${y}`} x1="0" y1={y} x2="400" y2={y} style={{ stroke: 'var(--st-ink-3)' }} strokeWidth="1" />)}
              {[40, 110, 180, 250, 320, 390].map((x) => <line key={`v${x}`} x1={x} y1="0" x2={x} y2="230" style={{ stroke: 'var(--st-ink-3)' }} strokeWidth="1" />)}
              <path d="M0 150 C 90 120, 150 175, 230 128 S 340 70, 400 92" style={{ stroke: 'var(--st-accent)' }} strokeOpacity="0.4" strokeWidth="9" fill="none" strokeLinecap="round" />
              <path d="M120 0 C 140 60, 110 120, 170 230" style={{ stroke: 'var(--st-ink-3)' }} strokeWidth="6" fill="none" />
              <path d="M260 230 C 250 170, 300 120, 290 0" style={{ stroke: 'var(--st-ink-3)' }} strokeWidth="5" fill="none" />
              <circle cx="205" cy="118" r="70" fill="url(#map-glow)" />
              <circle cx="205" cy="118" r="18" style={{ fill: 'var(--st-accent)' }} opacity="0.3" className="map-ping" />
              <circle cx="205" cy="118" r="8" style={{ fill: 'var(--st-accent)' }} stroke="white" strokeWidth="3" />
            </svg>
            <div className="p-6 sm:p-7 border-t border-white/10">
              <p className="text-[12px] uppercase tracking-[0.18em] font-bold text-[var(--st-accent-light)]">Flagship studio</p>
              <p className="mt-2 text-[15px] leading-relaxed text-white/85">{storeInfo.address}</p>
              <a href={`https://maps.google.com/?q=${encodeURIComponent(storeInfo.address)}`} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-[14px] font-semibold text-white hover:text-[var(--st-accent-light)]">Get directions <Icon name="arrow" size={15} /></a>
            </div>
          </section>

          {/* Hours */}
          <section className="rounded-[28px] bg-white border border-[#E3E8EF] p-6 sm:p-7">
            <h2 className="text-[17px] font-bold flex items-center gap-2"><Icon name="clock" size={18} /> Support hours</h2>
            <dl className="mt-4 divide-y divide-[#E3E8EF] text-[14.5px]">
              {[['Monday – Friday', '9am – 9pm'], ['Saturday', '10am – 7pm'], ['Sunday', '10am – 5pm (chat only)']].map(([day, hours]) => (
                <div key={day} className="flex justify-between gap-4 py-3"><dt className="text-[#5B6B80]">{day}</dt><dd className="font-semibold text-right">{hours}</dd></div>
              ))}
            </dl>
          </section>
        </Reveal>
      </div>

      {/* Locations */}
      <section id="contact-locations" className="pt-12 sm:pt-16 scroll-mt-28">
        <Reveal><SectionHeading eyebrow="Find us" title={<>Visit, collect or <em>get it fixed</em></>} /></Reveal>
        <div className="grid md:grid-cols-3 gap-4">
          {locations(storeInfo).map(([name, kind, address, hours], i) => (
            <Reveal key={name} from="up" delay={i * 110} className="h-full">
              <div className="h-full p-7 rounded-[26px] bg-white border border-[#E3E8EF]">
                <span className="w-11 h-11 rounded-full bg-[var(--st-accent)]/10 text-[var(--st-accent)] flex items-center justify-center"><Icon name="pin" size={19} /></span>
                <h3 className="mt-5 text-[19px] font-bold tracking-[-0.02em]">{name}</h3>
                <p className="text-[13px] font-semibold text-[var(--st-accent)]">{kind}</p>
                <p className="mt-3 text-[14.5px] leading-relaxed text-[#5B6B80]">{address}</p>
                <p className="mt-4 pt-4 border-t border-[#E3E8EF] text-[13.5px] font-semibold flex items-center gap-2"><Icon name="clock" size={15} /> {hours}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="pt-12 sm:pt-16 scroll-mt-28 grid lg:grid-cols-[0.8fr_1.2fr] gap-8 lg:gap-14 items-start">
        <Reveal from="left" className="lg:sticky lg:top-28">
          <p className={`${T.eyebrow} mb-4`}>FAQs</p>
          <h2 className={`${T.display} text-[38px] sm:text-[52px] leading-[1.02]`}>Questions, <em>answered</em></h2>
          <p className="mt-4 text-[16px] leading-relaxed text-[#5B6B80]">Delivery, returns, warranty and payment — the answers most people need. Still curious? Send us a message above.</p>
          <div className="mt-7 p-5 rounded-[22px] bg-white border border-[#E3E8EF] flex items-center gap-4">
            <span className="w-12 h-12 shrink-0 rounded-full bg-[#E3F4EC] text-[#0F8A5F] flex items-center justify-center"><Icon name="chat" size={20} /></span>
            <div>
              <p className="text-[15px] font-bold">Prefer to chat?</p>
              <a href={`https://wa.me/${storeInfo.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-[14px] font-semibold text-[var(--st-accent)] hover:underline">Message us on WhatsApp →</a>
            </div>
          </div>
        </Reveal>
        <Reveal from="right" delay={100} className="space-y-3">
          {faqs(storeInfo).map(([question, answer], i) => (
            <details key={question} open={i === 0} className="group rounded-[22px] bg-white border border-[#E3E8EF] open:border-[var(--st-accent)]/30 open:shadow-[0_24px_50px_-36px_rgba(14,26,43,0.5)] transition-all">
              <summary className="flex items-center justify-between gap-5 px-6 py-5 cursor-pointer list-none text-[16.5px] font-bold tracking-[-0.015em] [&::-webkit-details-marker]:hidden">
                {question}
                <span className="w-9 h-9 shrink-0 rounded-full bg-[#EDF1F6] group-open:bg-[var(--st-accent)] group-open:text-white flex items-center justify-center transition-all duration-300 group-open:rotate-45"><Icon name="plus" size={16} /></span>
              </summary>
              <p className="px-6 pb-6 -mt-1 text-[15px] leading-relaxed text-[#5B6B80]">{answer}</p>
            </details>
          ))}
        </Reveal>
      </section>
    </div>
  );
}

export function NotFoundPage() {
  return <EmptyState icon="search" title="We can’t find that page" text="It may have moved, or the link might be mistyped." action={{ label: 'Back to the shop', href: '#/shop' }} />;
}
