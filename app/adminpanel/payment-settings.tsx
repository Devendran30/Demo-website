'use client';

import { useEffect, useState } from 'react';
import { useStore, ordersStore, paymentGatewayStore } from './demo-data';

const METHODS: { key: keyof ReturnType<typeof paymentGatewayStore.get>['methods']; label: string; note: string }[] = [
  { key: 'razorpay', label: 'Razorpay', note: 'UPI, cards and net banking' },
  { key: 'cod', label: 'Cash on delivery', note: 'Collected by the courier' },
];

export function RazorpaySettings({ notify }: { notify: (message: string) => void }) {
  const saved = useStore(paymentGatewayStore);
  const orders = useStore(ordersStore);
  const [status, setStatus] = useState<{ configured: boolean; keyId: string; mode: string } | null>(null);
  const [merchantName, setMerchantName] = useState(saved.merchantName);
  const payments = orders.filter((o) => o.paymentId && o.source === 'Website').slice(0, 5);

  useEffect(() => {
    try {
      const legacy = JSON.parse(localStorage.getItem('demo.v2.paymentGateway') || 'null');
      if (legacy && typeof legacy === 'object') {
        const current = paymentGatewayStore.get();
        const oldMethods = legacy.methods && typeof legacy.methods === 'object' ? legacy.methods : {};
        paymentGatewayStore.set({ ...current, merchantName: typeof legacy.merchantName === 'string' ? legacy.merchantName : current.merchantName, methods: { razorpay: Boolean(oldMethods.razorpay ?? (oldMethods.upi || oldMethods.card || oldMethods.netbanking)), cod: Boolean(oldMethods.cod ?? true) } });
      }
      localStorage.removeItem('demo.v2.paymentGateway');
    } catch { /* Ignore blocked or malformed legacy browser storage. */ }
    fetch('/api/razorpay/status').then((response) => response.json()).then(setStatus).catch(() => setStatus({ configured: false, keyId: '', mode: 'unconfigured' }));
  }, []);

  const save = () => {
    paymentGatewayStore.set({ ...saved, merchantName: merchantName.trim() || 'Demo Website' });
    notify('Checkout display settings saved.');
  };
  const input = 'w-full h-12 px-4 rounded-2xl bg-[#F3F6FA] border border-[#E3E8EF] text-[14px] font-semibold text-[#0E1A2B] outline-none focus:bg-white focus:border-[#2F6BFF]';
  const label = 'block text-[11.5px] font-extrabold uppercase tracking-widest text-[#6F7E92] mb-2 pl-1';

  return (
    <section className="lg:col-span-5 bg-white border border-[#E3E8EF] rounded-[28px] p-7 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="w-14 h-14 rounded-2xl bg-[#0B1524] text-white flex items-center justify-center font-black italic text-[20px] tracking-tight shadow-lg">R<span className="text-[#5A8BFF]">/</span></span>
          <div><h3 className="text-xl font-bold text-[#0E1A2B]">Payment gateway · Razorpay</h3><p className="mt-0.5 text-sm text-[#5B6B80]">Two choices: Razorpay (UPI, cards and net banking) or cash on delivery.</p></div>
        </div>
        <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11.5px] font-extrabold uppercase tracking-wide ${status?.configured ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          <span className={`w-2 h-2 rounded-full ${status?.configured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          {status ? status.configured ? `Connected · ${status.mode} mode` : 'Environment keys missing' : 'Checking connection…'}
        </span>
      </div>

      <div className="mt-7 grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <div className="space-y-5">
          <div className="rounded-2xl bg-[#F5F8FF] border border-[#DCE7FF] p-4 text-[13px] text-[#3A4A5F]">
            <p className="font-bold text-[#0E1A2B]">Server environment</p>
            <p className="mt-1">{status?.configured ? <>Key ID: <span className="font-mono">{status.keyId}</span></> : 'Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.local, then restart the dev server.'}</p>
            <p className="mt-1 text-[12px] text-[#6F7E92]">The secret stays on the server and is never saved in browser storage.</p>
          </div>
          <div>
            <label htmlFor="rzp-merchant" className={label}>Name shown on checkout</label>
            <input id="rzp-merchant" value={merchantName} onChange={(e) => setMerchantName(e.target.value)} className={input} />
          </div>
          <div>
            <p className={label}>Checkout options</p>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {METHODS.map((method) => {
                const enabled = saved.methods[method.key];
                return <button key={method.key} type="button" role="switch" aria-checked={enabled} onClick={() => paymentGatewayStore.set({ ...saved, methods: { ...saved.methods, [method.key]: !enabled } })}
                  className={`flex items-center justify-between gap-3 p-3.5 rounded-2xl border text-left ${enabled ? 'border-[#2F6BFF]/40 bg-[#F5F8FF]' : 'border-[#E3E8EF] bg-white'}`}>
                  <span><span className="block text-[13.5px] font-bold text-[#0E1A2B]">{method.label}</span><span className="block text-[11.5px] text-[#6F7E92]">{method.note}</span></span>
                  <span className={`w-10 h-6 rounded-full p-1 ${enabled ? 'bg-[#2F6BFF]' : 'bg-[#CFD8E3]'}`}><span className={`block w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-4' : ''}`} /></span>
                </button>;
              })}
            </div>
          </div>
          <button type="button" onClick={save} className="h-12 px-6 rounded-full bg-[#2F6BFF] text-white text-[13.5px] font-bold hover:bg-[#1F55E0]">Save display settings</button>
        </div>
        <div className="rounded-2xl border border-[#E3E8EF] p-5">
          <p className="text-[11.5px] font-extrabold uppercase tracking-widest text-[#6F7E92]">Recent store payments</p>
          <ul className="mt-3 space-y-2.5">
            {payments.map((order) => <li key={order.id} className="flex items-center justify-between gap-3 text-[12.5px]">
              <span className="min-w-0"><span className="block font-mono font-bold text-[#0E1A2B] truncate">{order.paymentId}</span><span className="block text-[#6F7E92] truncate">{order.orderNumber} · {order.paymentDetail ?? order.paymentMethod}</span></span>
              <span className="text-right shrink-0"><span className="block font-bold text-[#0E1A2B]">₹{order.total.toLocaleString('en-IN')}</span><span className="block font-bold text-emerald-600">{order.paymentStatus === 'Paid' ? 'Captured' : order.paymentStatus}</span></span>
            </li>)}
            {!payments.length && <li className="text-[13px] text-[#6F7E92]">No prepaid store orders yet.</li>}
          </ul>
        </div>
      </div>
    </section>
  );
}
