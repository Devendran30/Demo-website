'use client';

// A stand-in for Razorpay's Standard Checkout in test mode: UPI (ID or QR), cards with an OTP step,
// and net banking with the bank's test page. Nothing is charged; it only returns a receipt.

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { fakeGatewayOrderId, fakePaymentId, type PaymentGateway, type PaymentReceipt } from '../demo-data';
import { ProductQrCode } from '../product-qr-code';
import { Icon, inr } from './store-kit';

export type GatewayMethod = 'UPI' | 'Card' | 'Net Banking';
type Step = 'form' | 'upi-wait' | 'otp' | 'bank' | 'processing' | 'success' | 'failed';
type Outcome = { ok: boolean; detail: string; reason?: string };

const BANKS = [
  ['SBI', 'State Bank of India', '#1A4D9C'],
  ['HDFC', 'HDFC Bank', '#004C8F'],
  ['ICICI', 'ICICI Bank', '#B02A30'],
  ['AXIS', 'Axis Bank', '#97144D'],
  ['KOTAK', 'Kotak Mahindra Bank', '#ED1C24'],
  ['YES', 'Yes Bank', '#0060AA'],
] as const;

const UPI_HANDLES = ['@okaxis', '@ybl', '@paytm', '@oksbi'];
const TEST_CARDS = [
  { number: '4111 1111 1111 1111', note: 'Visa · succeeds' },
  { number: '5267 3181 8797 5449', note: 'Mastercard · succeeds' },
  { number: '4000 0000 0000 0002', note: 'Declined by bank' },
];

export function cardBrand(digits: string) {
  if (/^3[47]/.test(digits)) return 'Amex';
  if (/^4/.test(digits)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
  if (/^(60|65|81|82|508)/.test(digits)) return 'RuPay';
  return '';
}

// Luhn check, which every real card number passes.
function luhn(digits: string) {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2) d = d * 2 > 9 ? d * 2 - 9 : d * 2;
    sum += d;
  }
  return digits.length >= 12 && sum % 10 === 0;
}

const maskPhone = (phone: string) => {
  const d = phone.replace(/\D/g, '').slice(-10);
  return d.length === 10 ? `+91 ${d.slice(0, 2)}•••••${d.slice(7)}` : 'your registered mobile';
};

export function RazorpayCheckout({ amount, method: initialMethod, gateway, prefill, onSuccess, onDismiss }: {
  amount: number;
  method: GatewayMethod;
  gateway: PaymentGateway;
  prefill: { name: string; email: string; phone: string };
  onSuccess: (receipt: PaymentReceipt) => void;
  onDismiss: (reason: string) => void;
}) {
  const methods = ([['UPI', gateway.methods.upi], ['Card', gateway.methods.card], ['Net Banking', gateway.methods.netbanking]] as const)
    .filter(([, on]) => on).map(([m]) => m as GatewayMethod);
  const [method, setMethod] = useState<GatewayMethod>(methods.includes(initialMethod) ? initialMethod : methods[0] ?? 'UPI');
  const [step, setStep] = useState<Step>('form');
  const [failure, setFailure] = useState('');
  const [orderId] = useState(fakeGatewayOrderId);
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);

  // UPI
  const [vpa, setVpa] = useState('');
  const [upiMode, setUpiMode] = useState<'id' | 'qr'>('id');
  const [upiCountdown, setUpiCountdown] = useState(0);
  // Card
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: prefill.name });
  const [otp, setOtp] = useState('');
  const [resendIn, setResendIn] = useState(0);
  // Net banking
  const [bank, setBank] = useState('');
  const [error, setError] = useState('');
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const finish = (result: Outcome) => {
    setStep('processing');
    setTimeout(() => {
      if (!result.ok) {
        setFailure(result.reason ?? 'The payment could not be completed.');
        setStep('failed');
        return;
      }
      const done = { paymentId: fakePaymentId(), gatewayOrderId: orderId, detail: result.detail };
      setReceipt(done);
      setStep('success');
      setTimeout(() => onSuccess(done), 1600);
    }, 1300);
  };

  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; };
  }, []);

  // The UPI request "waits" for the shopper's app, then resolves.
  useEffect(() => {
    if (step !== 'upi-wait' || !outcome) return;
    const t = setTimeout(() => (upiCountdown <= 1 ? finish(outcome) : setUpiCountdown(upiCountdown - 1)), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, upiCountdown]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const digits = card.number.replace(/\D/g, '');
  const brand = cardBrand(digits);

  const pay = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (method === 'UPI') {
      if (upiMode === 'qr') {
        setOutcome({ ok: true, detail: 'UPI · QR scan' });
        setUpiCountdown(4);
        setStep('upi-wait');
        return;
      }
      const id = vpa.trim().toLowerCase();
      if (!/^[a-z0-9._-]{2,}@[a-z][a-z0-9]{1,}$/.test(id)) return setError('Enter a valid UPI ID, like name@okaxis.');
      setOutcome(id === 'failure@razorpay'
        ? { ok: false, detail: `UPI · ${id}`, reason: 'The payment request was declined in the UPI app.' }
        : { ok: true, detail: `UPI · ${id}` });
      setUpiCountdown(6);
      setStep('upi-wait');
      return;
    }
    if (method === 'Card') {
      const [mm, yy] = card.expiry.split('/').map((v) => Number(v));
      const now = new Date();
      const expired = !mm || mm > 12 || !yy || 2000 + yy < now.getFullYear() || (2000 + yy === now.getFullYear() && mm < now.getMonth() + 1);
      if (!luhn(digits)) return setError('That card number doesn’t look right. Check the 16 digits.');
      if (expired) return setError('Enter a valid expiry date in the future (MM/YY).');
      if (!new RegExp(`^\\d{${brand === 'Amex' ? 4 : 3}}$`).test(card.cvv)) return setError(`Enter the ${brand === 'Amex' ? '4' : '3'}-digit CVV.`);
      if (card.name.trim().length < 2) return setError('Enter the name printed on the card.');
      const detail = `${brand || 'Card'} •••• ${digits.slice(-4)}`;
      if (digits === '4000000000000002') { finish({ ok: false, detail, reason: 'Your bank declined this card. Try another card or pay with UPI.' }); return; }
      setOutcome({ ok: true, detail });
      setOtp('');
      setResendIn(30);
      setStep('otp');
      return;
    }
    if (!bank) return setError('Choose your bank to continue.');
    setStep('bank');
  };

  const submitOtp = (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) return setError('Enter the 6-digit OTP.');
    setError('');
    const detail = outcome?.detail ?? 'Card';
    finish(otp === '000000' ? { ok: false, detail, reason: 'The OTP was incorrect, so the bank stopped the payment.' } : { ok: true, detail });
  };

  const bankResult = (ok: boolean) => {
    const name = BANKS.find(([code]) => code === bank)?.[1] ?? bank;
    finish(ok ? { ok: true, detail: `Net Banking · ${name}` } : { ok: false, detail: name, reason: `${name} reported the payment as failed.` });
  };

  const close = () => {
    if (step === 'success' || step === 'processing') return;
    if (step === 'form' && !confirmClose) { setConfirmClose(true); return; }
    onDismiss('Payment cancelled. Your order has not been placed.');
  };

  const retry = () => { setFailure(''); setError(''); setStep('form'); };
  const busy = step === 'processing' || step === 'success';

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-[#0B1524]/70 backdrop-blur-sm sm:p-6 fade" role="dialog" aria-modal="true" aria-label="Razorpay secure payment">
      <div className="modal-in relative w-full sm:max-w-[820px] max-h-[100dvh] sm:max-h-[92vh] flex flex-col sm:flex-row overflow-hidden rounded-t-[28px] sm:rounded-[28px] bg-white shadow-[0_40px_120px_-30px_rgba(0,0,0,0.6)]">
        {/* Merchant panel */}
        <aside className="relative sm:w-[290px] shrink-0 overflow-hidden bg-gradient-to-br from-[#2F6BFF] via-[#1F55E0] to-[#13233A] text-white px-6 py-5 sm:p-8 flex sm:flex-col gap-4 sm:gap-0 items-center sm:items-stretch">
          <span aria-hidden="true" className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
          <span aria-hidden="true" className="absolute -bottom-28 -left-20 w-72 h-72 rounded-full bg-[#5A8BFF]/30 blur-3xl" />
          <div className="relative flex items-center gap-3 min-w-0 flex-1 sm:flex-none">
            <span className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white text-[#1F55E0] flex items-center justify-center font-black text-[20px] shadow-lg shrink-0">{gateway.merchantName.trim().charAt(0).toUpperCase() || 'D'}</span>
            <div className="min-w-0">
              <p className="font-bold text-[15px] truncate">{gateway.merchantName || 'Demo Website'}</p>
              <p className="text-[11.5px] text-white/70 font-mono truncate">{orderId}</p>
            </div>
          </div>
          <div className="relative sm:mt-10 text-right sm:text-left">
            <p className="hidden sm:block text-[11px] uppercase tracking-[0.2em] text-white/60 font-bold">Amount payable</p>
            <p className="text-[24px] sm:text-[34px] font-extrabold tracking-tight tabular-nums leading-tight">{inr(amount)}</p>
          </div>
          <div className="relative hidden sm:block mt-8 space-y-2.5 text-[13px] text-white/80">
            <p className="flex items-center gap-2.5"><Icon name="phone" size={15} /> {prefill.phone ? `+91 ${prefill.phone.replace(/\D/g, '').slice(-10)}` : '—'}</p>
            <p className="flex items-center gap-2.5 break-all"><Icon name="mail" size={15} /> {prefill.email || '—'}</p>
          </div>
          <div className="relative hidden sm:block mt-auto pt-10">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FACC15] text-[#422006] text-[10.5px] font-extrabold uppercase tracking-wider">● Test mode</span>
            <p className="mt-3 text-[11px] text-white/60 leading-relaxed">No real money moves. Key <span className="font-mono text-white/80">{gateway.keyId}</span></p>
          </div>
        </aside>

        {/* Payment panel */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          <div className="flex items-center justify-between gap-3 px-6 sm:px-8 pt-5 sm:pt-7">
            <div className="flex items-center gap-2">
              <span className="sm:hidden inline-flex px-2 py-0.5 rounded-full bg-[#FACC15] text-[#422006] text-[10px] font-extrabold uppercase tracking-wider">Test</span>
              <p className="text-[15px] font-bold text-[#0E1A2B]">{step === 'otp' ? 'Verify with OTP' : step === 'bank' ? 'Bank test page' : step === 'upi-wait' ? 'Approve on your UPI app' : 'Payment options'}</p>
            </div>
            {!busy && (
              <button type="button" onClick={close} aria-label="Close payment" className="w-9 h-9 rounded-full hover:bg-[#EDF1F6] text-[#5B6B80] flex items-center justify-center"><Icon name="close" size={18} /></button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-6 sm:px-8 pt-4 pb-6">
            {confirmClose && step === 'form' && (
              <div className="mb-4 p-4 rounded-2xl bg-[#FFF7E6] border border-[#F5D48A] text-[13.5px] text-[#5C3B00]">
                <p className="font-bold">Cancel this payment?</p>
                <p className="mt-0.5">Your order won’t be placed if you leave now.</p>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => onDismiss('Payment cancelled. Your order has not been placed.')} className="px-4 py-2 rounded-full bg-[#0E1A2B] text-white text-[12.5px] font-bold">Yes, cancel</button>
                  <button type="button" onClick={() => setConfirmClose(false)} className="px-4 py-2 rounded-full border border-[#CFD8E3] text-[12.5px] font-bold">Continue paying</button>
                </div>
              </div>
            )}

            {step === 'form' && (
              <form onSubmit={pay} noValidate>
                {methods.length > 1 && (
                  <div role="tablist" aria-label="Payment method" className="grid gap-1.5 p-1.5 rounded-2xl bg-[#F1F4F9]" style={{ gridTemplateColumns: `repeat(${methods.length}, minmax(0, 1fr))` }}>
                    {methods.map((m) => (
                      <button key={m} type="button" role="tab" aria-selected={method === m} onClick={() => { setMethod(m); setError(''); }}
                        className={`h-11 rounded-xl text-[13.5px] font-bold flex items-center justify-center gap-2 transition-all ${method === m ? 'bg-white text-[#1F55E0] shadow-[0_6px_16px_-8px_rgba(14,26,43,0.35)]' : 'text-[#5B6B80] hover:text-[#0E1A2B]'}`}>
                        <MethodGlyph method={m} /> {m === 'Net Banking' ? 'Netbanking' : m}
                      </button>
                    ))}
                  </div>
                )}

                {method === 'UPI' && (
                  <div className="mt-6">
                    <div className="flex gap-2 text-[12.5px] font-bold">
                      {(['id', 'qr'] as const).map((mode) => (
                        <button key={mode} type="button" onClick={() => { setUpiMode(mode); setError(''); }} className={`px-3.5 py-1.5 rounded-full border transition-colors ${upiMode === mode ? 'border-[#2F6BFF] bg-[#EAF1FF] text-[#1F55E0]' : 'border-[#E3E8EF] text-[#5B6B80]'}`}>
                          {mode === 'id' ? 'Pay with UPI ID' : 'Scan QR code'}
                        </button>
                      ))}
                    </div>
                    {upiMode === 'id' ? (
                      <>
                        <label htmlFor="rzp-vpa" className="block mt-5 text-[12.5px] font-bold text-[#3A4A5F]">UPI ID</label>
                        <input id="rzp-vpa" autoFocus value={vpa} onChange={(e) => { setVpa(e.target.value); setError(''); }} placeholder="yourname@okaxis" autoCapitalize="none" autoComplete="off" spellCheck={false}
                          className="mt-2 w-full h-12 px-4 rounded-xl border border-[#CFD8E3] text-[15px] font-semibold text-[#0E1A2B] outline-none focus:border-[#2F6BFF] focus:ring-4 focus:ring-[#2F6BFF]/10" />
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {UPI_HANDLES.map((h) => (
                            <button key={h} type="button" onClick={() => setVpa((v) => `${v.split('@')[0] || prefill.name.split(/\s+/)[0]?.toLowerCase() || 'name'}${h}`)} className="px-2.5 py-1 rounded-full bg-[#F1F4F9] text-[12px] font-semibold text-[#5B6B80] hover:bg-[#EAF1FF] hover:text-[#1F55E0]">{h}</button>
                          ))}
                        </div>
                        <TestHint>
                          Use <Fill onClick={() => setVpa('success@razorpay')}>success@razorpay</Fill> to approve or <Fill onClick={() => setVpa('failure@razorpay')}>failure@razorpay</Fill> to see a failed payment.
                        </TestHint>
                      </>
                    ) : (
                      <div className="mt-5 flex flex-col sm:flex-row items-center gap-5 p-5 rounded-2xl border border-[#E3E8EF]">
                        <div className="relative w-40 h-40 shrink-0 p-2.5 rounded-2xl bg-white border border-[#E3E8EF]">
                          {/* A test reference, not a payable UPI link, so a real app can't send money to it. */}
                          <ProductQrCode value={`RAZORPAY-TEST|${orderId}|${amount}`} className="w-full h-full" />
                        </div>
                        <div className="text-center sm:text-left">
                          <p className="text-[15px] font-bold text-[#0E1A2B]">Scan with any UPI app</p>
                          <p className="mt-1 text-[13px] text-[#5B6B80]">Google Pay, PhonePe, Paytm, BHIM and more.</p>
                          <p className="mt-3 text-[12px] text-[#8A6100] bg-[#FFF7E6] px-3 py-2 rounded-xl">Test mode: this QR isn’t payable. Press Pay to simulate a scan.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {method === 'Card' && (
                  <div className="mt-6 space-y-4">
                    <div>
                      <label htmlFor="rzp-card" className="block text-[12.5px] font-bold text-[#3A4A5F]">Card number</label>
                      <div className="relative mt-2">
                        <input id="rzp-card" autoFocus inputMode="numeric" autoComplete="cc-number" value={card.number} placeholder="1234 5678 9012 3456"
                          onChange={(e) => { const d = e.target.value.replace(/\D/g, '').slice(0, 16); setCard({ ...card, number: d.replace(/(\d{4})(?=\d)/g, '$1 ') }); setError(''); }}
                          className="w-full h-12 pl-4 pr-24 rounded-xl border border-[#CFD8E3] text-[15px] font-semibold tracking-[0.06em] text-[#0E1A2B] tabular-nums outline-none focus:border-[#2F6BFF] focus:ring-4 focus:ring-[#2F6BFF]/10" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2"><BrandMark brand={brand} /></span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="rzp-exp" className="block text-[12.5px] font-bold text-[#3A4A5F]">Expiry</label>
                        <input id="rzp-exp" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" value={card.expiry}
                          onChange={(e) => { const d = e.target.value.replace(/\D/g, '').slice(0, 4); setCard({ ...card, expiry: d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d }); setError(''); }}
                          className="mt-2 w-full h-12 px-4 rounded-xl border border-[#CFD8E3] text-[15px] font-semibold text-[#0E1A2B] tabular-nums outline-none focus:border-[#2F6BFF] focus:ring-4 focus:ring-[#2F6BFF]/10" />
                      </div>
                      <div>
                        <label htmlFor="rzp-cvv" className="block text-[12.5px] font-bold text-[#3A4A5F]">CVV</label>
                        <input id="rzp-cvv" type="password" inputMode="numeric" autoComplete="cc-csc" placeholder={brand === 'Amex' ? '••••' : '•••'} value={card.cvv}
                          onChange={(e) => { setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, brand === 'Amex' ? 4 : 3) }); setError(''); }}
                          className="mt-2 w-full h-12 px-4 rounded-xl border border-[#CFD8E3] text-[15px] font-semibold text-[#0E1A2B] tabular-nums outline-none focus:border-[#2F6BFF] focus:ring-4 focus:ring-[#2F6BFF]/10" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="rzp-name" className="block text-[12.5px] font-bold text-[#3A4A5F]">Name on card</label>
                      <input id="rzp-name" autoComplete="cc-name" value={card.name} onChange={(e) => { setCard({ ...card, name: e.target.value }); setError(''); }}
                        className="mt-2 w-full h-12 px-4 rounded-xl border border-[#CFD8E3] text-[15px] font-semibold text-[#0E1A2B] outline-none focus:border-[#2F6BFF] focus:ring-4 focus:ring-[#2F6BFF]/10" />
                    </div>
                    <TestHint>
                      Test cards (any future expiry, any CVV):
                      <span className="mt-1.5 flex flex-wrap gap-1.5">
                        {TEST_CARDS.map((c) => <Fill key={c.number} onClick={() => setCard({ ...card, number: c.number, expiry: card.expiry || '12/30', cvv: card.cvv || '123' })}>{c.number.slice(-4)} · {c.note}</Fill>)}
                      </span>
                    </TestHint>
                  </div>
                )}

                {method === 'Net Banking' && (
                  <div className="mt-6">
                    <p className="text-[12.5px] font-bold text-[#3A4A5F]">Popular banks</p>
                    <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {BANKS.map(([code, name, color]) => (
                        <button key={code} type="button" onClick={() => { setBank(code); setError(''); }} aria-pressed={bank === code}
                          className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${bank === code ? 'border-[#2F6BFF] bg-[#EAF1FF] ring-4 ring-[#2F6BFF]/10' : 'border-[#E3E8EF] hover:border-[#A9B4C2]'}`}>
                          <span className="w-9 h-9 rounded-xl text-white text-[10px] font-black flex items-center justify-center shrink-0" style={{ backgroundColor: color }}>{code.slice(0, 4)}</span>
                          <span className="text-[12.5px] font-bold text-[#0E1A2B] leading-tight">{name}</span>
                        </button>
                      ))}
                    </div>
                    <TestHint>You’ll see the bank’s test page next, where you can choose Success or Failure.</TestHint>
                  </div>
                )}

                {error && <p role="alert" className="mt-4 text-[13px] font-semibold text-[#D23B3B]">{error}</p>}
                <button type="submit" className="mt-6 w-full h-[52px] rounded-2xl bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white text-[15px] font-extrabold shadow-[0_14px_34px_-12px_rgba(47,107,255,0.65)] hover:brightness-110 transition flex items-center justify-center gap-2">
                  <Icon name="lock" size={16} /> Pay {inr(amount)}
                </button>
              </form>
            )}

            {step === 'upi-wait' && (
              <div className="py-6 text-center">
                <div className="relative mx-auto w-28 h-28">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="44" fill="none" stroke="#EDF1F6" strokeWidth="6" />
                    <circle cx="50" cy="50" r="44" fill="none" stroke="#2F6BFF" strokeWidth="6" strokeLinecap="round" strokeDasharray={276} strokeDashoffset={276 * (1 - upiCountdown / 6)} className="transition-[stroke-dashoffset] duration-1000 ease-linear" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[#1F55E0]"><MethodGlyph method="UPI" size={34} /></span>
                </div>
                <p className="mt-6 text-[18px] font-extrabold text-[#0E1A2B]">Open your UPI app to approve</p>
                <p className="mt-1.5 text-[13.5px] text-[#5B6B80]">{upiMode === 'qr' ? 'Waiting for the scan to be confirmed…' : <>A collect request for {inr(amount)} was sent to <span className="font-bold text-[#0E1A2B]">{vpa.trim().toLowerCase()}</span>.</>}</p>
                <p className="mt-4 text-[12px] text-[#8A97A8]">Test mode approves automatically in {upiCountdown}s</p>
                <button type="button" onClick={retry} className="mt-5 text-[13px] font-bold text-[#5B6B80] hover:text-[#0E1A2B] underline underline-offset-4">Cancel and change method</button>
              </div>
            )}

            {step === 'otp' && (
              <form onSubmit={submitOtp} noValidate className="py-2">
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#F6F8FB] border border-[#E3E8EF]">
                  <BrandMark brand={brand} />
                  <div className="text-[13px]">
                    <p className="font-bold text-[#0E1A2B]">{outcome?.detail}</p>
                    <p className="text-[#5B6B80]">{inr(amount)} to {gateway.merchantName}</p>
                  </div>
                </div>
                <label htmlFor="rzp-otp" className="block mt-6 text-[15px] font-extrabold text-[#0E1A2B]">Enter the OTP</label>
                <p className="mt-1 text-[13px] text-[#5B6B80]">Sent by your bank to {maskPhone(prefill.phone)}.</p>
                <input id="rzp-otp" autoFocus inputMode="numeric" autoComplete="one-time-code" value={otp} maxLength={6}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                  className="mt-4 w-full h-14 rounded-2xl border border-[#CFD8E3] text-center text-[26px] font-extrabold tracking-[0.6em] pl-[0.6em] text-[#0E1A2B] tabular-nums outline-none focus:border-[#2F6BFF] focus:ring-4 focus:ring-[#2F6BFF]/10" placeholder="••••••" />
                <div className="mt-3 flex items-center justify-between text-[12.5px]">
                  <button type="button" disabled={resendIn > 0} onClick={() => setResendIn(30)} className="font-bold text-[#2F6BFF] disabled:text-[#A9B4C2]">{resendIn > 0 ? `Resend OTP in ${resendIn}s` : 'Resend OTP'}</button>
                  <button type="button" onClick={retry} className="font-semibold text-[#5B6B80] hover:text-[#0E1A2B]">Use another card</button>
                </div>
                <TestHint>Any 6 digits work, for example <Fill onClick={() => setOtp('123456')}>123456</Fill>. Enter 000000 to see a failed OTP.</TestHint>
                {error && <p role="alert" className="mt-4 text-[13px] font-semibold text-[#D23B3B]">{error}</p>}
                <button type="submit" className="mt-6 w-full h-[52px] rounded-2xl bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white text-[15px] font-extrabold shadow-[0_14px_34px_-12px_rgba(47,107,255,0.65)] hover:brightness-110 transition">Verify & pay {inr(amount)}</button>
              </form>
            )}

            {step === 'bank' && (
              <div className="py-2">
                <div className="rounded-2xl border border-[#E3E8EF] overflow-hidden">
                  <div className="px-5 py-4 text-white flex items-center gap-3" style={{ backgroundColor: BANKS.find(([c]) => c === bank)?.[2] }}>
                    <span className="w-9 h-9 rounded-xl bg-white/20 text-[10px] font-black flex items-center justify-center">{bank.slice(0, 4)}</span>
                    <div>
                      <p className="font-bold text-[14.5px]">{BANKS.find(([c]) => c === bank)?.[1]}</p>
                      <p className="text-[11.5px] text-white/75">Razorpay test bank page</p>
                    </div>
                  </div>
                  <div className="p-5 text-[13.5px] text-[#3A4A5F] space-y-1.5">
                    <p className="flex justify-between"><span>Merchant</span><span className="font-bold text-[#0E1A2B]">{gateway.merchantName}</span></p>
                    <p className="flex justify-between"><span>Amount</span><span className="font-bold text-[#0E1A2B] tabular-nums">{inr(amount)}</span></p>
                    <p className="flex justify-between"><span>Reference</span><span className="font-mono text-[12px]">{orderId}</span></p>
                  </div>
                </div>
                <p className="mt-5 text-[13px] text-[#5B6B80]">This is a test payment. Choose how the bank should respond:</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => bankResult(true)} className="h-12 rounded-2xl bg-[#0F8A5F] hover:bg-[#0C7550] text-white font-extrabold text-[14px]">Success</button>
                  <button type="button" onClick={() => bankResult(false)} className="h-12 rounded-2xl bg-[#D23B3B] hover:bg-[#B92F2F] text-white font-extrabold text-[14px]">Failure</button>
                </div>
                <button type="button" onClick={retry} className="mt-4 text-[13px] font-semibold text-[#5B6B80] hover:text-[#0E1A2B]">← Choose another bank</button>
              </div>
            )}

            {step === 'processing' && (
              <div className="py-14 text-center" aria-live="polite">
                <span className="mx-auto block w-14 h-14 rounded-full border-[5px] border-[#EAF1FF] border-t-[#2F6BFF] animate-spin" />
                <p className="mt-6 text-[17px] font-extrabold text-[#0E1A2B]">Processing your payment…</p>
                <p className="mt-1 text-[13px] text-[#5B6B80]">Please don’t close this window or press back.</p>
              </div>
            )}

            {step === 'success' && receipt && (
              <div className="py-10 text-center" aria-live="polite">
                <span className="mx-auto w-20 h-20 rounded-full bg-[#0F8A5F] text-white flex items-center justify-center shadow-[0_18px_40px_-14px_rgba(15,138,95,0.7)] hero-pop"><Icon name="check" size={38} stroke={2.4} /></span>
                <p className="mt-6 text-[20px] font-extrabold text-[#0E1A2B]">Payment successful</p>
                <p className="mt-1 text-[13.5px] text-[#5B6B80]">{inr(amount)} paid with {receipt.detail}</p>
                <p className="mt-4 inline-block px-3 py-1.5 rounded-full bg-[#F1F4F9] font-mono text-[12px] text-[#3A4A5F]">{receipt.paymentId}</p>
                <p className="mt-5 text-[12.5px] text-[#8A97A8]">Placing your order…</p>
              </div>
            )}

            {step === 'failed' && (
              <div className="py-10 text-center" aria-live="assertive">
                <span className="mx-auto w-20 h-20 rounded-full bg-[#FDECEC] text-[#D23B3B] flex items-center justify-center"><Icon name="close" size={36} stroke={2.2} /></span>
                <p className="mt-6 text-[20px] font-extrabold text-[#0E1A2B]">Payment failed</p>
                <p className="mt-1.5 text-[13.5px] text-[#5B6B80] max-w-sm mx-auto">{failure} No money was taken.</p>
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                  <button type="button" onClick={retry} className="px-6 h-12 rounded-2xl bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white font-extrabold text-[14px]">Try again</button>
                  <button type="button" onClick={() => onDismiss('The payment failed, so your order was not placed. You can try again.')} className="px-6 h-12 rounded-2xl border border-[#CFD8E3] font-bold text-[14px] text-[#0E1A2B]">Back to checkout</button>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 sm:px-8 py-3.5 border-t border-[#EDF1F6] flex items-center justify-between gap-3 text-[11.5px] text-[#8A97A8]">
            <span className="flex items-center gap-1.5"><Icon name="shield" size={14} /> 256-bit encrypted</span>
            <span>Secured by <span className="font-extrabold text-[#0E1A2B] italic tracking-tight">Razorpay</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TestHint({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 p-3.5 rounded-2xl bg-[#FFF9E8] border border-[#F5E1A4] text-[12.5px] leading-relaxed text-[#6B4E00]">
      <span className="mr-1.5 inline-flex px-1.5 py-px rounded bg-[#FACC15] text-[#422006] text-[10px] font-extrabold uppercase tracking-wider align-[1px]">Test</span>
      {children}
    </div>
  );
}

function Fill({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="px-2 py-0.5 rounded-md bg-white border border-[#F0D48A] font-mono text-[12px] font-bold text-[#5C3B00] hover:border-[#C79A1E]">{children}</button>;
}

export function MethodGlyph({ method, size = 18 }: { method: GatewayMethod | 'Cash on Delivery'; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  // The UPI mark: two arrowheads pointing forward.
  if (method === 'UPI') return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M5 3.5 12.5 12 5 20.5z" /><path d="M11.5 3.5 19 12l-7.5 8.5z" opacity="0.55" /></svg>;
  if (method === 'Card') return <svg {...common}><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M2.5 10h19M6 15h4" /></svg>;
  if (method === 'Net Banking') return <svg {...common}><path d="M3 10l9-6 9 6" /><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18" /></svg>;
  return <svg {...common}><rect x="2.5" y="6" width="19" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6 9v.01M18 15v.01" /></svg>;
}

export function BrandMark({ brand }: { brand: string }) {
  if (brand === 'Visa') return <span className="inline-flex h-7 px-2 rounded-md bg-[#1A1F71] text-white text-[12px] font-black italic tracking-tight items-center">VISA</span>;
  if (brand === 'Mastercard') return (
    <span className="inline-flex h-7 px-1.5 rounded-md bg-[#0E1A2B] items-center" aria-label="Mastercard">
      <span className="w-4 h-4 rounded-full bg-[#EB001B]" /><span className="-ml-1.5 w-4 h-4 rounded-full bg-[#F79E1B] mix-blend-screen" />
    </span>
  );
  if (brand === 'RuPay') return <span className="inline-flex h-7 px-2 rounded-md bg-white border border-[#E3E8EF] text-[11.5px] font-black italic items-center"><span className="text-[#097A44]">Ru</span><span className="text-[#F26F21]">Pay</span></span>;
  if (brand === 'Amex') return <span className="inline-flex h-7 px-2 rounded-md bg-[#2E77BB] text-white text-[10.5px] font-black items-center">AMEX</span>;
  return <span className="inline-flex h-7 w-10 rounded-md bg-[#EDF1F6] text-[#8A97A8] items-center justify-center"><MethodGlyph method="Card" size={16} /></span>;
}
