'use client';

import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  ordersStore, placeWebsiteOrder, couponProblem, couponState, productPhotos, FREE_DELIVERY_FROM,
  type Order, type OrderStatus, type WebsiteOrderInput,
} from '../demo-data';
import {
  T, Icon, Photo, Button, PageTitle, EmptyState, QtyStepper, TotalsList, Reveal, SectionHeading,
  useStore, useBag, useCatalog, useAccount, bagStore, promoStore, myOrdersStore, setBagQty, navigate, formatDate, variantLabel, inr, STORE_INFO,
} from './store-kit';
import { Field, openAuth } from './auth-pages';

// =============================================================================
// Bag Page
// =============================================================================

export function BagPage() {
  const { lines, count, subtotal, promo, coupons, totals } = useBag();
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const promoDropped = promo ? couponProblem(promo, subtotal, coupons) : null;
  const offers = coupons.filter((c) => couponState(c) === 'Live');
  const towardsFree = Math.min(100, Math.round(((totals.subtotal - totals.discount) / FREE_DELIVERY_FROM) * 100));

  if (!lines.length) {
    return <EmptyState icon="bag" title="Your bag is empty" text="When you add something beautiful, it will appear here." action={{ label: 'Discover the collection', href: '#/shop' }} />;
  }

  const applyCode = (entered: string) => {
    const value = entered.trim().toUpperCase();
    if (!value) return;
    const problem = couponProblem(value, subtotal, coupons);
    if (problem) return setCodeError(problem);
    setCodeError('');
    setCode('');
    promoStore.set(value);
  };

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
                    <a href={`#/product/${line.product.id}`} className={`block ${T.display} text-[24px] sm:text-[28px] leading-[1.05] hover:text-[#2F6BFF] transition-colors`}>{line.product.name}</a>
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

          <div className="mb-7">
            <p className="text-[13px] text-[#5B6B80] mb-2.5">
              {totals.delivery ? <>Add <span className="text-[#0E1A2B]">{inr(FREE_DELIVERY_FROM - (totals.subtotal - totals.discount))}</span> for complimentary delivery</> : 'Your order ships with complimentary delivery'}
            </p>
            <div className="h-[3px] bg-[#EDF1F6] overflow-hidden"><div className="h-full bg-[#0E1A2B] transition-all duration-700" style={{ width: `${towardsFree}%` }} /></div>
          </div>

          <TotalsList totals={totals} promo={promo} />
          <p className="mt-3 text-[12px] text-[#8A97A8]">Inclusive of all taxes.</p>

          <div className="mt-7 pt-7 border-t border-[#E3E8EF]">
            {promo && !promoDropped ? (
              <div className="flex items-center justify-between gap-3 text-[13.5px]">
                <span className="text-[#0F8A5F] inline-flex items-center gap-2"><Icon name="check" size={16} /> <span className="font-mono">{promo}</span> applied</span>
                <button onClick={() => promoStore.set('')} className="text-[11px] uppercase tracking-[0.2em] text-[#6F7E92] border-b border-current pb-0.5">Remove</button>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); applyCode(code); }}>
                <label htmlFor="promo-code" className="block text-[11px] uppercase tracking-[0.22em] mb-3">Promo code</label>
                <div className="flex gap-2">
                  <input id="promo-code" value={code} onChange={(e) => { setCode(e.target.value); setCodeError(''); }} placeholder="Enter code" autoCapitalize="characters" className="flex-1 min-w-0 h-11 px-5 rounded-full bg-transparent border border-[#CFD8E3] text-[14px] uppercase font-mono placeholder:normal-case placeholder:font-sans placeholder:text-[#8A97A8] outline-none focus:border-[#0E1A2B]" />
                  <Button type="submit" variant="outline" className="!h-11 !px-5">Apply</Button>
                </div>
                {(codeError || promoDropped) && <p role="alert" className="mt-2.5 text-[13px] text-[#D23B3B]">{codeError || promoDropped}</p>}
              </form>
            )}
            {offers.length > 0 && !(promo && !promoDropped) && (
              <div className="mt-6 space-y-2.5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#6F7E92]">Available offers</p>
                {offers.map((offer) => {
                  const shortBy = offer.minPurchase - subtotal;
                  return (
                    <div key={offer.id} className="flex items-center gap-3 p-3.5 rounded-[16px] border border-dashed border-[#CFD8E3]">
                      <span className="text-[#2F6BFF]"><Icon name="tag" size={18} /></span>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-[13px]">{offer.code}</p>
                        <p className="text-[12px] text-[#5B6B80] leading-snug">{offer.description || (offer.discountType === 'Percentage' ? `${offer.discountValue}% off` : `${inr(offer.discountValue)} off`)}</p>
                        {shortBy > 0 && <p className="text-[11.5px] text-[#8A97A8]">Add {inr(shortBy)} more to use</p>}
                      </div>
                      <button disabled={shortBy > 0} onClick={() => applyCode(offer.code)} className="text-[11px] uppercase tracking-[0.2em] border-b border-current pb-0.5 disabled:opacity-35">Apply</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Button href="#/checkout" variant="accent" className="w-full mt-8">Proceed to checkout <Icon name="arrow" size={16} /></Button>
          <a href="#/shop" className="block text-center mt-5 text-[11px] uppercase tracking-[0.2em] text-[#6F7E92] hover:text-[#0E1A2B]">Continue shopping</a>
        </aside>
      </div>
    </div>
  );
}

// =============================================================================
// Checkout Page
// =============================================================================

const BLANK_ADDRESS = { name: '', phone: '', email: '', line: '', city: '', state: '', pin: '' };
const PAYMENTS: { id: WebsiteOrderInput['payment']; note: string }[] = [
  { id: 'UPI', note: 'Any UPI app' },
  { id: 'Card', note: 'Credit or debit card' },
  { id: 'Cash on Delivery', note: 'Pay when it arrives' },
];

function addressProblems(address: typeof BLANK_ADDRESS) {
  const problems: Partial<Record<keyof typeof BLANK_ADDRESS, string>> = {};
  if (address.name.trim().length < 2) problems.name = 'Enter your full name.';
  if (!/^[6-9]\d{9}$/.test(address.phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, ''))) problems.phone = 'Enter a 10-digit mobile number.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email.trim())) problems.email = 'Enter a valid email address.';
  if (address.line.trim().length < 5) problems.line = 'Enter your house number and street.';
  if (address.city.trim().length < 2) problems.city = 'Enter your city.';
  if (address.state.trim().length < 2) problems.state = 'Enter your state.';
  if (!/^[1-9]\d{5}$/.test(address.pin.trim())) problems.pin = 'Enter a 6-digit PIN code.';
  return problems;
}

export function CheckoutPage() {
  const { lines, promo, totals } = useBag();
  const account = useAccount();
  // Members start with their name, email and phone already filled in.
  const [address, setAddress] = useState(() => (account ? { ...BLANK_ADDRESS, name: account.name, email: account.email, phone: account.phone.replace(/^\+91\s?/, '') } : BLANK_ADDRESS));
  const [payment, setPayment] = useState<WebsiteOrderInput['payment']>('UPI');
  const [showProblems, setShowProblems] = useState(false);
  const [placeError, setPlaceError] = useState('');
  const [placing, setPlacing] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const problems = addressProblems(address);

  if (!lines.length) {
    return <EmptyState icon="bag" title="Nothing to check out" text="Your bag is empty, so add a piece first." action={{ label: 'Go to the shop', href: '#/shop' }} />;
  }

  const placeOrder = (e: FormEvent) => {
    e.preventDefault();
    if (Object.keys(problems).length) {
      setShowProblems(true);
      form.current?.querySelector<HTMLInputElement>(`[name="${Object.keys(problems)[0]}"]`)?.focus();
      return;
    }
    setPlacing(true);
    // A short pause so the button can show progress, as a real payment step would.
    setTimeout(() => {
      try {
        const order = placeWebsiteOrder({ lines: lines.map(({ product, size, color, qty }) => ({ product, size, color, qty })), promo, payment, address });
        myOrdersStore.set([order.id, ...myOrdersStore.get()]);
        navigate(`#/order/${order.id}`, { replace: true });
        bagStore.set([]);
        promoStore.set('');
      } catch (error) {
        setPlaceError(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
        setPlacing(false);
      }
    }, 900);
  };

  const field = (name: keyof typeof BLANK_ADDRESS, label: string, options: { autoComplete: string; type?: string; inputMode?: 'tel' | 'numeric' | 'email'; maxLength?: number; className?: string }) => {
    const problem = showProblems ? problems[name] : undefined;
    return (
      <div className={options.className}>
        <label htmlFor={`checkout-${name}`} className="block text-[13px] font-semibold text-[#3A4A5F] mb-2">{label}</label>
        <input
          id={`checkout-${name}`}
          name={name}
          type={options.type ?? 'text'}
          inputMode={options.inputMode}
          maxLength={options.maxLength}
          autoComplete={options.autoComplete}
          value={address[name]}
          onChange={(e) => setAddress({ ...address, [name]: e.target.value })}
          aria-invalid={Boolean(problem)}
          aria-describedby={problem ? `checkout-${name}-problem` : undefined}
          className={`w-full h-12 px-0 bg-transparent border-0 border-b text-[16px] outline-none transition-colors ${problem ? 'border-[#D23B3B]' : 'border-[#CFD8E3] focus:border-[#0E1A2B]'}`}
        />
        {problem && <p id={`checkout-${name}-problem`} className="mt-1.5 text-[12.5px] text-[#D23B3B]">{problem}</p>}
      </div>
    );
  };

  return (
    <div className={T.shell}>
      <PageTitle eyebrow="Secure checkout" title={<>Almost <em>yours</em></>} />
      {!account && (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 p-5 rounded-[20px] bg-white border border-[#E3E8EF]">
          <p className="text-[14.5px] text-[#3A4A5F]"><span className="font-bold text-[#0E1A2B]">Have an account?</span> Sign in for faster checkout and live order tracking.</p>
          <div className="flex gap-2">
            <Button onClick={() => openAuth('signin', 'checkout')} variant="ink" className="!h-11 !px-6">Sign in</Button>
            <Button onClick={() => openAuth('signup', 'checkout')} variant="outline" className="!h-11 !px-6">Create account</Button>
          </div>
        </div>
      )}
      {account && (
        <p className="mb-8 inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#2F6BFF]/10 text-[14px] font-semibold text-[#2F6BFF]">
          <Icon name="check" size={16} /> Signed in as {account.email} — your details are filled in
        </p>
      )}
      <form ref={form} onSubmit={placeOrder} noValidate className="grid lg:grid-cols-[1.45fr_1fr] gap-12 lg:gap-12 items-start">
        <div className="space-y-14">
          <section>
            <h2 className={`${T.display} text-[32px] leading-none mb-8`}><span className="text-[#2F6BFF] mr-3 text-[22px]">01</span>Delivery</h2>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-7">
              {field('name', 'Full name', { autoComplete: 'name', className: 'sm:col-span-2' })}
              {field('phone', 'Mobile number', { autoComplete: 'tel', type: 'tel', inputMode: 'tel' })}
              {field('email', 'Email', { autoComplete: 'email', type: 'email', inputMode: 'email' })}
              {field('line', 'House number and street', { autoComplete: 'street-address', className: 'sm:col-span-2' })}
              {field('city', 'City', { autoComplete: 'address-level2' })}
              {field('state', 'State', { autoComplete: 'address-level1' })}
              {field('pin', 'PIN code', { autoComplete: 'postal-code', inputMode: 'numeric', maxLength: 6 })}
            </div>
          </section>

          <fieldset>
            <legend className={`${T.display} text-[32px] leading-none mb-8`}><span className="text-[#2F6BFF] mr-3 text-[22px]">02</span>Payment</legend>
            <div className="grid sm:grid-cols-3 gap-3">
              {PAYMENTS.map((option) => (
                <label key={option.id} className={`block p-5 rounded-[20px] border cursor-pointer transition-colors ${payment === option.id ? 'border-[#0E1A2B] bg-[#FFFFFF]' : 'border-[#CFD8E3] hover:border-[#0E1A2B]'}`}>
                  <input type="radio" name="payment" value={option.id} checked={payment === option.id} onChange={() => setPayment(option.id)} className="sr-only" />
                  <span className="flex items-center justify-between">
                    <span className="block text-[14.5px]">{option.id}</span>
                    <span className={`w-4 h-4 rounded-full border ${payment === option.id ? 'border-[5px] border-[#0E1A2B]' : 'border-[#A9B4C2]'}`} />
                  </span>
                  <span className="block text-[12.5px] text-[#6F7E92] mt-1">{option.note}</span>
                </label>
              ))}
            </div>
            <p className="mt-4 text-[13px] text-[#6F7E92] flex items-center gap-2"><Icon name="shield" size={16} stroke={1.3} /> Demo store — no payment details are asked for and nothing is charged.</p>
          </fieldset>
        </div>

        <aside className="lg:sticky lg:top-28 bg-[#FFFFFF] border border-[#E3E8EF] rounded-[28px] p-7 sm:p-9 shadow-[0_30px_60px_-40px_rgba(14,26,43,0.25)]">
          <h2 className={`${T.display} text-[32px] leading-none mb-7`}>Your order</h2>
          <ul className="space-y-5 mb-7 pb-7 border-b border-[#E3E8EF]">
            {lines.map((line) => (
              <li key={line.key} className="flex items-center gap-4">
                <span className="relative flex-shrink-0">
                  <Photo src={productPhotos(line.product, line.color)[0]} alt="" width={160} className="w-16 aspect-[4/5] rounded-[12px] object-cover bg-[#EDF1F6]" />
                  <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-[#0E1A2B] text-[#F6F8FB] text-[10.5px] flex items-center justify-center">{line.qty}</span>
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[14px] leading-snug">{line.product.name}</span>
                  {variantLabel(line.size, line.color) && <span className="block text-[12.5px] text-[#6F7E92]">{variantLabel(line.size, line.color)}</span>}
                </span>
                <span className="text-[14px] tabular-nums">{inr(line.product.price * line.qty)}</span>
              </li>
            ))}
          </ul>
          <TotalsList totals={totals} promo={promo} />
          {placeError && <p role="alert" className="mt-5 p-3.5 rounded-[14px] bg-[#FDECEC] text-[#D23B3B] text-[13px]">{placeError}</p>}
          <Button type="submit" variant="accent" disabled={placing} className="w-full mt-8">{placing ? 'Placing your order…' : `Place order · ${inr(totals.total)}`}</Button>
        </aside>
      </form>
    </div>
  );
}

// =============================================================================
// Order Pages (status comes live from the admin panel)
// =============================================================================

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'Pending', label: 'Order placed' },
  { status: 'Processing', label: 'Being prepared' },
  { status: 'Shipped', label: 'On its way' },
  { status: 'Delivered', label: 'Delivered' },
];

export function OrderPage({ order }: { order: Order }) {
  const reached = STEPS.findIndex((s) => s.status === order.orderStatus);
  const cancelled = order.orderStatus === 'Cancelled';
  const arrivesBy = new Date(new Date(order.placedAt).getTime() + 5 * 24 * 60 * 60 * 1000).toISOString();
  return (
    <div className="max-w-[1040px] mx-auto px-5 sm:px-8 pt-8 sm:pt-10">
      <div className="text-center mb-8">
        <div className={`w-16 h-16 mx-auto mb-7 rounded-full border flex items-center justify-center ${cancelled ? 'border-[#D23B3B] text-[#D23B3B]' : 'border-[#0E1A2B]'}`}><Icon name={cancelled ? 'close' : 'check'} size={26} /></div>
        <p className={`${T.eyebrow} mb-4`}>Order {order.orderNumber}</p>
        <h1 className={`${T.display} text-[46px] sm:text-[64px] leading-[1]`}>
          {cancelled ? <>This order was <em>cancelled</em></> : order.orderStatus === 'Delivered' ? <>Delivered. <em>Enjoy.</em></> : <>Thank you, <em>{order.customerName.split(/\s+/)[0]}</em></>}
        </h1>
        <p className="mt-5 text-[16px] text-[#5B6B80]">
          {cancelled ? 'Any payment will be refunded to the original method within 5–7 days.' : order.orderStatus === 'Delivered' ? 'We hope it brings you joy for years to come.' : <>Expected by <span className="text-[#0E1A2B]">{formatDate(arrivesBy)}</span>. A confirmation was sent to {order.email}.</>}
        </p>
      </div>

      {!cancelled && (
        <ol className="grid grid-cols-4 mb-8" aria-label="Order progress">
          {STEPS.map((step, index) => (
            <li key={step.status} className="relative text-center">
              {index > 0 && <span className={`absolute top-[7px] right-1/2 w-full h-px ${index <= reached ? 'bg-[#0E1A2B]' : 'bg-[#CFD8E3]'}`} />}
              <span className={`relative z-10 mx-auto block w-[15px] h-[15px] rounded-full border ${index <= reached ? 'bg-[#0E1A2B] border-[#0E1A2B]' : 'bg-[#F6F8FB] border-[#A9B4C2]'}`} />
              <span className={`block mt-3 text-[10.5px] sm:text-[11.5px] uppercase tracking-[0.16em] leading-tight ${index <= reached ? 'text-[#0E1A2B]' : 'text-[#8A97A8]'}`}>{step.label}</span>
            </li>
          ))}
        </ol>
      )}

      {order.shipment?.awb && order.shipment.status !== 'Cancelled' && !cancelled && (
        <div className="mb-8 p-6 rounded-[24px] border border-[#E3E8EF] bg-[#FFFFFF] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Icon name="truck" size={24} stroke={1.3} />
            <div>
              <p className="text-[14.5px]">{order.shipment.courier} · <span className="font-mono">{order.shipment.awb}</span></p>
              <p className="text-[12.5px] text-[#6F7E92]">Shipment {order.shipment.status.toLowerCase()} · dispatched from {order.shipment.pickup}</p>
            </div>
          </div>
          <span className="text-[11px] uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-full bg-[#EDF1F6]">{order.shipment.status}</span>
        </div>
      )}

      <div className="grid md:grid-cols-[1.45fr_1fr] gap-6 items-start">
        <section className="bg-[#FFFFFF] border border-[#E3E8EF] rounded-[28px] p-7 sm:p-9">
          <h2 className={`${T.display} text-[28px] leading-none mb-7`}>Pieces</h2>
          <ul className="space-y-5 mb-7 pb-7 border-b border-[#E3E8EF]">
            {order.items.map((item, i) => (
              <li key={i} className="flex items-center gap-4">
                <Photo src={item.image} alt="" width={160} className="w-16 aspect-[4/5] rounded-[12px] object-cover bg-[#EDF1F6] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <a href={`#/product/${item.productId}`} className="block text-[14.5px] leading-snug hover:text-[#2F6BFF]">{item.name}</a>
                  <p className="text-[12.5px] text-[#6F7E92]">{[variantLabel(item.size, item.color), `Qty ${item.qty}`].filter(Boolean).join(' · ')}</p>
                </div>
                <span className="text-[14px] tabular-nums">{inr(item.price * item.qty)}</span>
              </li>
            ))}
          </ul>
          <TotalsList totals={order} promo={order.promo} />
        </section>
        <section className="border border-[#E3E8EF] rounded-[28px] p-7 sm:p-9 text-[14.5px] leading-relaxed space-y-7">
          <div>
            <h2 className="text-[12px] uppercase tracking-[0.14em] font-bold text-[#6F7E92] mb-3">Delivering to</h2>
            <p>{order.customerName}</p>
            <p className="break-words text-[#3A4A5F]">{order.shippingAddress}</p>
            <p className="text-[#3A4A5F]">{order.city}{order.state ? `, ${order.state}` : ''} {order.postalCode}</p>
            <p className="mt-2 text-[#6F7E92]">{order.phone}</p>
          </div>
          <div>
            <h2 className="text-[12px] uppercase tracking-[0.14em] font-bold text-[#6F7E92] mb-3">Payment</h2>
            <p>{order.paymentMethod} · <span className={order.paymentStatus === 'Paid' ? 'text-[#0F8A5F]' : 'text-[#2F6BFF]'}>{order.paymentStatus === 'Paid' ? 'Paid' : order.paymentMethod === 'Cash on Delivery' ? 'Pay on delivery' : 'Awaiting confirmation'}</span></p>
          </div>
          <div>
            <h2 className="text-[12px] uppercase tracking-[0.14em] font-bold text-[#6F7E92] mb-3">Placed</h2>
            <p>{formatDate(order.placedAt, true)}</p>
          </div>
        </section>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Button href="#/shop">Continue shopping</Button>
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
      <ul className="divide-y divide-[#E3E8EF] border-y border-[#E3E8EF]">
        {mine.map((order) => (
          <li key={order.id}>
            <a href={`#/order/${order.id}`} className="group flex flex-wrap items-center gap-6 py-7">
              <div className="flex -space-x-4">
                {order.items.slice(0, 3).map((item, i) => <Photo key={i} src={item.image} alt="" width={140} className="w-14 aspect-[4/5] rounded-[12px] object-cover border-2 border-[#F6F8FB] bg-[#EDF1F6]" />)}
              </div>
              <div className="flex-1 min-w-[160px]">
                <p className="font-mono text-[13.5px]">{order.orderNumber}</p>
                <p className="text-[13px] text-[#6F7E92]">{formatDate(order.placedAt)} · {order.itemsCount} {order.itemsCount === 1 ? 'piece' : 'pieces'}</p>
              </div>
              <span className={`text-[10.5px] uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-full ${order.orderStatus === 'Cancelled' ? 'bg-[#FDECEC] text-[#D23B3B]' : order.orderStatus === 'Delivered' ? 'bg-[#E3F4EC] text-[#0F8A5F]' : 'bg-[#EDF1F6]'}`}>{order.orderStatus}</span>
              <p className="text-[16px] tabular-nums">{inr(order.total)}</p>
              <span className="transition-transform group-hover:translate-x-1"><Icon name="arrow" size={18} /></span>
            </a>
          </li>
        ))}
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
  ['Ananya Rao', 'Founder & curator', 'from-[#2F6BFF] to-[#0E1A2B]'],
  ['Vikram Shetty', 'Head of testing', 'from-[#5A8BFF] to-[#16305A]'],
  ['Neha Pillai', 'Customer care lead', 'from-[#9AA7B8] to-[#22344F]'],
  ['Arjun Mehta', 'Operations & delivery', 'from-[#1F55E0] to-[#0B1524]'],
];

export function AboutPage() {
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
          <p className={`${T.eyebrow} mb-4`}>About {STORE_INFO.name}</p>
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
          <div className="hidden sm:block absolute -bottom-8 -left-8 w-[42%] aspect-square rounded-[26px] overflow-hidden ring-8 ring-[#F6F8FB] shadow-[0_30px_60px_-30px_rgba(14,26,43,0.6)] float">
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
            <p className={`${T.display} text-[36px] sm:text-[48px] leading-none bg-gradient-to-b from-[#0E1A2B] to-[#3A5A8F] bg-clip-text text-transparent`}>{value}</p>
            <p className="mt-2.5 text-[13.5px] font-semibold text-[#6F7E92]">{label}</p>
          </div>
        ))}
      </Reveal>

      {/* Story timeline */}
      <section className="pt-12 sm:pt-16">
        <Reveal><SectionHeading eyebrow="Our story" title={<>From a pop-up table to <em>your doorstep</em></>} /></Reveal>
        <div className="relative">
          <span aria-hidden="true" className="absolute left-[19px] md:left-1/2 top-2 bottom-2 w-px bg-gradient-to-b from-[#2F6BFF]/50 via-[#CFD8E3] to-transparent" />
          <ol className="space-y-6 md:space-y-2">
            {TIMELINE.map(([year, title, text], i) => (
              <li key={year} className={`relative md:grid md:grid-cols-2 md:gap-16 ${i % 2 ? '' : ''}`}>
                <span aria-hidden="true" className="absolute left-[12px] md:left-1/2 md:-translate-x-1/2 top-7 w-[15px] h-[15px] rounded-full bg-[#2F6BFF] ring-4 ring-[#F6F8FB] shadow-[0_0_0_6px_rgba(47,107,255,0.15)]" />
                <Reveal from={i % 2 ? 'right' : 'left'} delay={80} className={`pl-12 md:pl-0 ${i % 2 ? 'md:col-start-2' : 'md:text-right'}`}>
                  <div className={`inline-block p-6 sm:p-7 rounded-[24px] bg-white border border-[#E3E8EF] shadow-[0_30px_60px_-50px_rgba(14,26,43,0.6)] max-w-md ${i % 2 ? '' : 'md:ml-auto'} text-left`}>
                    <p className="text-[13px] font-extrabold text-[#2F6BFF]">{year}</p>
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
      <section className="mt-12 sm:mt-16 on-dark relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#0E1A2B] via-[#13284A] to-[#0B1524] text-white p-7 sm:p-12">
        <span aria-hidden="true" className="pointer-events-none absolute -top-32 right-0 w-[520px] h-[420px] rounded-full bg-[#2F6BFF]/30 blur-[120px]" />
        <Reveal className="relative max-w-2xl">
          <p className="text-[12px] uppercase tracking-[0.2em] font-bold text-[#8FB0FF] mb-4">How we choose</p>
          <h2 className={`${T.display} text-[36px] sm:text-[52px] leading-[1.02]`}>Four checks before anything <em>reaches you</em></h2>
        </Reveal>
        <div className="relative mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PROCESS.map(([icon, title, text], i) => (
            <Reveal key={title} from="up" delay={i * 120} className="h-full">
              <div className="h-full p-6 rounded-[24px] bg-white/[0.06] border border-white/10 backdrop-blur-md hover:bg-white/[0.1] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="w-11 h-11 rounded-[14px] bg-[#2F6BFF] flex items-center justify-center shadow-[0_10px_24px_-8px_rgba(47,107,255,0.8)]"><Icon name={icon} size={20} /></span>
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
              <span className="w-12 h-12 rounded-full bg-[#2F6BFF]/10 text-[#2F6BFF] flex items-center justify-center"><Icon name={icon} size={21} /></span>
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
          <span aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 w-[360px] h-[360px] rounded-full bg-[#2F6BFF]/10 blur-[80px]" />
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

const FAQS: [string, string][] = [
  ['How long does delivery take?', 'Most orders arrive in 3 to 5 working days. You will see the expected date on your order page as soon as you place an order, and it updates as your parcel moves.'],
  ['How much does delivery cost?', `Delivery is complimentary on orders of ${inr(FREE_DELIVERY_FROM)} or more. Smaller orders have a flat ₹149 delivery fee.`],
  ['Can I return something?', STORE_INFO.returnPolicy],
  ['Which payment options do you offer?', 'UPI, cards and cash on delivery. Prices already include GST, so there is nothing extra to pay at checkout apart from any delivery fee.'],
  ['How do I track my order?', 'Sign in and tap your name in the top corner — your latest order and its live status are right there. Every order also has its own tracking page with courier details once it ships.'],
  ['Do I need an account to order?', 'No. You can check out as a guest. An account simply fills in your details for you and keeps all your orders in one place.'],
  ['How do I use a promo code?', 'Enter it in your bag before checkout, or tap Apply on one of the available offers. Each code has a minimum order value and dates, and your bag tells you if a code cannot be used.'],
];

const TOPICS = ['An order', 'Product advice', 'Returns & warranty', 'Partnerships', 'Something else'];

const LOCATIONS = [
  ['Bengaluru Studio', 'Flagship · showroom & testing lab', STORE_INFO.address, 'Mon–Sat · 10am–8pm'],
  ['Mumbai Pickup Point', 'Collect orders & quick returns', 'Shop 4, Linking Road, Bandra West, Mumbai 400050', 'Mon–Sat · 11am–7pm'],
  ['Chennai Service Centre', 'Repairs & warranty claims', '18, Cathedral Road, Gopalapuram, Chennai 600086', 'Tue–Sun · 10am–6pm'],
];

export function ContactPage() {
  const { products, categories } = useCatalog();
  const [message, setMessage] = useState({ name: '', email: '', order: '', text: '' });
  const [topic, setTopic] = useState(TOPICS[0]);
  const [sent, setSent] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const digits = STORE_INFO.phone.replace(/\D/g, '');
  const problems = {
    name: message.name.trim().length < 2 ? 'Enter your name.' : '',
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(message.email.trim()) ? '' : 'Enter a valid email address.',
    text: message.text.trim().length < 10 ? 'Tell us a little more (10 characters or more).' : '',
  };

  const channels = [
    ['phone', 'Call us', STORE_INFO.phone, 'Mon–Sat, 10am–7pm', `tel:${digits}`],
    ['mail', 'Email', STORE_INFO.email, 'Replies within 24 hours', `mailto:${STORE_INFO.email}`],
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
              className="group h-full flex flex-col p-6 rounded-[26px] bg-white border border-[#E3E8EF] hover:border-[#2F6BFF]/30 hover:-translate-y-1 hover:shadow-[0_30px_60px_-40px_rgba(14,26,43,0.5)] transition-all duration-500"
            >
              <span className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-[#2F6BFF] to-[#0E1A2B] text-white flex items-center justify-center shadow-[0_12px_24px_-10px_rgba(47,107,255,0.7)]"><Icon name={icon} size={20} /></span>
              <p className="mt-5 text-[13px] font-bold text-[#6F7E92]">{title}</p>
              <p className="mt-1 text-[16.5px] font-bold tracking-[-0.02em] break-words">{value}</p>
              <p className="mt-auto pt-4 text-[13px] text-[#8A97A8] flex items-center justify-between">{note}<span className="text-[#2F6BFF] transition-transform group-hover:translate-x-1"><Icon name="arrow" size={16} /></span></p>
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
                    <button key={t} type="button" role="radio" aria-checked={topic === t} onClick={() => setTopic(t)} className={`px-4 h-10 rounded-full text-[13.5px] font-semibold border transition-all ${topic === t ? 'bg-[#0E1A2B] text-white border-[#0E1A2B]' : 'bg-[#F6F8FB] border-[#E3E8EF] text-[#3A4A5F] hover:border-[#0E1A2B]'}`}>
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
                    className={`w-full px-4 py-3.5 rounded-[14px] border bg-[#F6F8FB] text-[15.5px] outline-none resize-y transition-all focus:bg-white focus:ring-4 ${showErrors && problems.text ? 'border-[#D23B3B] focus:ring-[#D23B3B]/10' : 'border-[#E3E8EF] focus:border-[#2F6BFF] focus:ring-[#2F6BFF]/10'}`}
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
          <section className="on-dark relative overflow-hidden rounded-[28px] bg-[#0E1A2B] text-white">
            <svg aria-hidden="true" viewBox="0 0 400 230" className="w-full h-[230px]">
              <defs>
                <radialGradient id="map-glow" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#2F6BFF" stopOpacity="0.45" /><stop offset="1" stopColor="#2F6BFF" stopOpacity="0" /></radialGradient>
              </defs>
              <rect width="400" height="230" fill="#0E1A2B" />
              {[30, 75, 120, 165, 210].map((y) => <line key={`h${y}`} x1="0" y1={y} x2="400" y2={y} stroke="#22344F" strokeWidth="1" />)}
              {[40, 110, 180, 250, 320, 390].map((x) => <line key={`v${x}`} x1={x} y1="0" x2={x} y2="230" stroke="#22344F" strokeWidth="1" />)}
              <path d="M0 150 C 90 120, 150 175, 230 128 S 340 70, 400 92" stroke="#3A5A8F" strokeWidth="9" fill="none" strokeLinecap="round" />
              <path d="M120 0 C 140 60, 110 120, 170 230" stroke="#2A4268" strokeWidth="6" fill="none" />
              <path d="M260 230 C 250 170, 300 120, 290 0" stroke="#2A4268" strokeWidth="5" fill="none" />
              <circle cx="205" cy="118" r="70" fill="url(#map-glow)" />
              <circle cx="205" cy="118" r="18" fill="#2F6BFF" opacity="0.3" className="map-ping" />
              <circle cx="205" cy="118" r="8" fill="#2F6BFF" stroke="white" strokeWidth="3" />
            </svg>
            <div className="p-6 sm:p-7 border-t border-white/10">
              <p className="text-[12px] uppercase tracking-[0.18em] font-bold text-[#8FB0FF]">Flagship studio</p>
              <p className="mt-2 text-[15px] leading-relaxed text-white/85">{STORE_INFO.address}</p>
              <a href={`https://maps.google.com/?q=${encodeURIComponent(STORE_INFO.address)}`} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-[14px] font-semibold text-white hover:text-[#8FB0FF]">Get directions <Icon name="arrow" size={15} /></a>
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
          {LOCATIONS.map(([name, kind, address, hours], i) => (
            <Reveal key={name} from="up" delay={i * 110} className="h-full">
              <div className="h-full p-7 rounded-[26px] bg-white border border-[#E3E8EF]">
                <span className="w-11 h-11 rounded-full bg-[#2F6BFF]/10 text-[#2F6BFF] flex items-center justify-center"><Icon name="pin" size={19} /></span>
                <h3 className="mt-5 text-[19px] font-bold tracking-[-0.02em]">{name}</h3>
                <p className="text-[13px] font-semibold text-[#2F6BFF]">{kind}</p>
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
              <a href={`https://wa.me/${STORE_INFO.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-[14px] font-semibold text-[#2F6BFF] hover:underline">Message us on WhatsApp →</a>
            </div>
          </div>
        </Reveal>
        <Reveal from="right" delay={100} className="space-y-3">
          {FAQS.map(([question, answer], i) => (
            <details key={question} open={i === 0} className="group rounded-[22px] bg-white border border-[#E3E8EF] open:border-[#2F6BFF]/30 open:shadow-[0_24px_50px_-36px_rgba(14,26,43,0.5)] transition-all">
              <summary className="flex items-center justify-between gap-5 px-6 py-5 cursor-pointer list-none text-[16.5px] font-bold tracking-[-0.015em] [&::-webkit-details-marker]:hidden">
                {question}
                <span className="w-9 h-9 shrink-0 rounded-full bg-[#EDF1F6] group-open:bg-[#2F6BFF] group-open:text-white flex items-center justify-center transition-all duration-300 group-open:rotate-45"><Icon name="plus" size={16} /></span>
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
