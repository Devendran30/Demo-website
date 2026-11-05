'use client';

// Admin → Admin Security: the Razorpay (test mode) keys and payment methods the storefront checkout uses.

import { useState } from 'react';
import { useStore, ordersStore, paymentGatewayStore, DEFAULT_PAYMENT_GATEWAY, type PaymentGateway } from './demo-data';

const KEY_ID = /^rzp_test_[A-Za-z0-9]{14}$/;
const randomKey = (length: number) => Array.from({ length }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'[Math.floor(Math.random() * 57)]).join('');

const METHODS: { key: keyof PaymentGateway['methods']; label: string; note: string }[] = [
  { key: 'upi', label: 'UPI', note: 'UPI ID and QR' },
  { key: 'card', label: 'Cards', note: 'Visa, Mastercard, RuPay, Amex' },
  { key: 'netbanking', label: 'Net banking', note: 'Major Indian banks' },
  { key: 'cod', label: 'Cash on delivery', note: 'Collected by the courier' },
];

const TEST_DATA = [
  ['UPI · success', 'success@razorpay'],
  ['UPI · failure', 'failure@razorpay'],
  ['Visa · success', '4111 1111 1111 1111'],
  ['Mastercard · success', '5267 3181 8797 5449'],
  ['Card · declined', '4000 0000 0000 0002'],
  ['Expiry / CVV', 'Any future date / any 3 digits'],
  ['Card OTP', 'Any 6 digits (000000 fails)'],
  ['Net banking', 'Choose Success or Failure on the test bank page'],
];

export function RazorpaySettings({ notify }: { notify: (message: string) => void }) {
  const saved = useStore(paymentGatewayStore);
  const orders = useStore(ordersStore);
  const [draft, setDraft] = useState<PaymentGateway>(saved);
  const [showSecret, setShowSecret] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const payments = orders.filter((o) => o.paymentId && o.source === 'Website').slice(0, 5);

  const saveAndVerify = () => {
    const keyId = draft.keyId.trim();
    const keySecret = draft.keySecret.trim();
    if (!KEY_ID.test(keyId)) return setError('The Key ID should look like rzp_test_ followed by 14 letters or numbers.');
    if (keySecret.length < 20) return setError('The Key Secret should be at least 20 characters.');
    if (!Object.values(draft.methods).some(Boolean)) return setError('Turn on at least one payment method.');
    setError('');
    setVerifying(true);
    // Stands in for Razorpay's key check, which a real backend would do with the secret.
    setTimeout(() => {
      const next = { ...draft, keyId, keySecret, merchantName: draft.merchantName.trim() || 'Demo Website', verifiedAt: new Date().toISOString() };
      paymentGatewayStore.set(next);
      setDraft(next);
      setVerifying(false);
      notify('Razorpay test keys verified and saved. Checkout now uses them.');
    }, 1200);
  };

  const generate = () => {
    setDraft({ ...draft, keyId: `rzp_test_${randomKey(14)}`, keySecret: randomKey(24), verifiedAt: '' });
    setError('');
  };

  const input = 'w-full h-12 px-4 rounded-2xl bg-[#F3F6FA] border border-[#E3E8EF] text-[14px] font-semibold text-[#0E1A2B] outline-none focus:bg-white focus:border-[#2F6BFF] focus:ring-4 focus:ring-[#2F6BFF]/10';
  const label = 'block text-[11.5px] font-extrabold uppercase tracking-widest text-[#6F7E92] mb-2 pl-1';

  return (
    <section className="lg:col-span-5 bg-white border border-[#E3E8EF] rounded-[28px] p-7 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="w-14 h-14 rounded-2xl bg-[#0B1524] text-white flex items-center justify-center font-black italic text-[20px] tracking-tight shadow-lg">R<span className="text-[#5A8BFF]">/</span></span>
          <div>
            <h3 className="text-xl font-bold text-[#0E1A2B]">Payment gateway · Razorpay</h3>
            <p className="mt-0.5 text-sm text-[#5B6B80]">The keys and methods the store’s checkout uses. Test mode only: no real money moves.</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11.5px] font-extrabold uppercase tracking-wide ${saved.verifiedAt ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          <span className={`w-2 h-2 rounded-full ${saved.verifiedAt ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          {saved.verifiedAt ? 'Connected · Test mode' : 'Test keys not verified'}
        </span>
      </div>

      <div className="mt-7 grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <div className="space-y-5">
          <div className="inline-flex p-1 rounded-full bg-[#F3F6FA] text-[13px] font-bold">
            <span className="px-4 py-2 rounded-full bg-white text-[#2F6BFF] shadow-sm">Test mode</span>
            <span title="Live keys need a KYC-verified Razorpay account and a backend; not part of this demo." className="px-4 py-2 rounded-full text-[#A9B4C2] cursor-not-allowed">Live mode</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="rzp-key-id" className={label}>Key ID</label>
              <input id="rzp-key-id" value={draft.keyId} onChange={(e) => { setDraft({ ...draft, keyId: e.target.value }); setError(''); }} spellCheck={false} className={`${input} font-mono`} />
            </div>
            <div>
              <label htmlFor="rzp-key-secret" className={label}>Key secret</label>
              <div className="relative">
                <input id="rzp-key-secret" type={showSecret ? 'text' : 'password'} value={draft.keySecret} onChange={(e) => { setDraft({ ...draft, keySecret: e.target.value }); setError(''); }} spellCheck={false} className={`${input} font-mono pr-20`} />
                <button type="button" onClick={() => setShowSecret(!showSecret)} className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full text-[12px] font-bold text-[#2F6BFF] hover:bg-[#EAF1FF]">{showSecret ? 'Hide' : 'Show'}</button>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="rzp-merchant" className={label}>Name shown on checkout</label>
              <input id="rzp-merchant" value={draft.merchantName} onChange={(e) => setDraft({ ...draft, merchantName: e.target.value })} className={input} />
            </div>
          </div>

          <div>
            <p className={label}>Payment methods on checkout</p>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {METHODS.map((m) => {
                const on = draft.methods[m.key];
                return (
                  <button key={m.key} type="button" role="switch" aria-checked={on} onClick={() => setDraft({ ...draft, methods: { ...draft.methods, [m.key]: !on } })}
                    className={`flex items-center justify-between gap-3 p-3.5 rounded-2xl border text-left transition-colors ${on ? 'border-[#2F6BFF]/40 bg-[#F5F8FF]' : 'border-[#E3E8EF] bg-white'}`}>
                    <span>
                      <span className="block text-[14px] font-bold text-[#0E1A2B]">{m.label}</span>
                      <span className="block text-[12px] text-[#6F7E92]">{m.note}</span>
                    </span>
                    <span className={`relative w-11 h-6 shrink-0 rounded-full transition-colors ${on ? 'bg-[#2F6BFF]' : 'bg-[#CFD8E3]'}`}>
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && <p role="alert" className="text-[13px] font-bold text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}
          <div className="flex flex-wrap gap-2.5">
            <button type="button" onClick={saveAndVerify} disabled={verifying} className="h-12 px-6 rounded-full bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white text-[14px] font-extrabold shadow-md disabled:opacity-70 inline-flex items-center gap-2">
              {verifying && <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
              {verifying ? 'Verifying with Razorpay…' : dirty || !saved.verifiedAt ? 'Save & verify keys' : 'Verify again'}
            </button>
            <button type="button" onClick={generate} className="h-12 px-5 rounded-full border border-[#E3E8EF] text-[13.5px] font-bold text-[#0E1A2B] hover:border-[#2F6BFF]">Generate new test keys</button>
            <button type="button" onClick={() => { setDraft(DEFAULT_PAYMENT_GATEWAY); setError(''); }} className="h-12 px-5 rounded-full text-[13.5px] font-bold text-[#5B6B80] hover:text-[#0E1A2B]">Reset</button>
          </div>
          {saved.verifiedAt && <p className="text-[12px] text-[#6F7E92]">Last verified {new Date(saved.verifiedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}{dirty ? ' · you have unsaved changes' : ''}</p>}
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl bg-[#0E1A2B] text-white p-5">
            <p className="text-[11.5px] font-extrabold uppercase tracking-widest text-[#8FB0FF]">Test details for checkout</p>
            <dl className="mt-3 space-y-2 text-[12.5px]">
              {TEST_DATA.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3"><dt className="text-white/60 shrink-0">{k}</dt><dd className="font-mono text-right">{v}</dd></div>
              ))}
            </dl>
          </div>
          <div className="rounded-2xl border border-[#E3E8EF] p-5">
            <p className="text-[11.5px] font-extrabold uppercase tracking-widest text-[#6F7E92]">Recent test payments</p>
            <ul className="mt-3 space-y-2.5">
              {payments.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 text-[12.5px]">
                  <span className="min-w-0">
                    <span className="block font-mono font-bold text-[#0E1A2B] truncate">{o.paymentId}</span>
                    <span className="block text-[#6F7E92] truncate">{o.orderNumber} · {o.paymentDetail ?? o.paymentMethod}</span>
                  </span>
                  <span className="text-right shrink-0">
                    <span className="block font-bold text-[#0E1A2B]">₹{o.total.toLocaleString('en-IN')}</span>
                    <span className={`block font-bold ${o.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>{o.paymentStatus === 'Paid' ? 'Captured' : o.paymentStatus}</span>
                  </span>
                </li>
              ))}
              {!payments.length && <li className="text-[13px] text-[#6F7E92]">No prepaid store orders yet.</li>}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
