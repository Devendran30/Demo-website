'use client';

import { useEffect, useState } from 'react';
import { themeSettingsStore, activeTheme } from '../demo-data';
import type { PaymentGateway, PaymentReceipt } from '../demo-data';
import { Icon, inr } from './store-kit';

export type GatewayMethod = 'Razorpay' | 'Cash on Delivery' | 'UPI' | 'Card' | 'Net Banking' | 'Credit Card';
type RazorpayResult = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
type RazorpayOptions = {
  key: string; amount: number; currency: string; name: string; description: string; order_id: string;
  prefill: { name: string; email: string; contact: string }; theme: { color: string };
  handler: (response: RazorpayResult) => void;
  modal: { ondismiss: () => void };
};
declare global { interface Window { Razorpay?: new (options: RazorpayOptions) => { open: () => void; on: (event: string, cb: (event: { error?: { description?: string } }) => void) => void } } }

function loadCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-razorpay-checkout]');
    const script = existing ?? document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.dataset.razorpayCheckout = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load Razorpay Checkout. Check your connection and try again.'));
    if (!existing) document.body.appendChild(script);
  });
}

export function RazorpayCheckout({ amount, gateway, prefill, onSuccess, onDismiss }: {
  amount: number;
  gateway: PaymentGateway;
  prefill: { name: string; email: string; phone: string };
  onSuccess: (receipt: PaymentReceipt) => void;
  onDismiss: (reason: string) => void;
}) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const open = async () => {
      setBusy(true);
      setError('');
      try {
        const scriptReady = loadCheckout();
        const orderResponse = await fetch('/api/razorpay/order', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, ...prefill }),
        });
        const order = await orderResponse.json();
        if (!orderResponse.ok) throw new Error(order.error || 'Could not create a Razorpay order.');
        await scriptReady;
        if (cancelled || !window.Razorpay) return;
        setBusy(false);
        const checkout = new window.Razorpay({
          key: order.keyId, amount: order.amount, currency: order.currency,
          name: gateway.merchantName || 'Store', description: 'Store checkout', order_id: order.orderId,
          prefill: { name: prefill.name, email: prefill.email, contact: prefill.phone },
          theme: { color: activeTheme(themeSettingsStore.get()).colors.accent },
          modal: { ondismiss: () => onDismiss('Payment window closed. Your order has not been placed.') },
          handler: async (response) => {
            setBusy(true);
            try {
              const verified = await fetch('/api/razorpay/verify', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(response),
              });
              const result = await verified.json();
              if (!verified.ok || !result.verified) throw new Error(result.error || 'Razorpay could not confirm the payment.');
              if (result.amount !== Math.round(amount * 100)) throw new Error('The confirmed payment amount does not match your order total. Contact support before retrying.');
              onSuccess({ paymentId: result.paymentId, gatewayOrderId: result.orderId, detail: `Razorpay · ${result.method || 'payment'}` });
            } catch (reason) {
              onDismiss(reason instanceof Error ? reason.message : 'Payment verification failed.');
            }
          },
        });
        checkout.on('payment.failed', (event) => onDismiss(event.error?.description || 'Payment failed. Please try again.'));
        checkout.open();
      } catch (reason) {
        if (cancelled) return;
        setBusy(false);
        setError(reason instanceof Error ? reason.message : 'Unable to start Razorpay Checkout.');
      }
    };
    void open();
    return () => { cancelled = true; };
  }, [amount, attempt, gateway.merchantName, onDismiss, onSuccess, prefill]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--st-deep)]/70 backdrop-blur-sm p-5" role="dialog" aria-modal="true" aria-label="Razorpay secure payment">
      <div className="w-full max-w-md rounded-[24px] bg-white p-7 shadow-2xl text-center">
        <span className="mx-auto w-14 h-14 rounded-2xl bg-[var(--st-accent-soft)] text-[var(--st-accent)] flex items-center justify-center"><Icon name="lock" size={24} /></span>
        <h2 className="mt-4 text-xl font-extrabold text-[var(--st-ink)]">Secure Razorpay checkout</h2>
        <p className="mt-2 text-sm text-[#6F7E92]">{busy ? 'Connecting securely and preparing your order…' : error || 'Continue in the secure Razorpay window.'}</p>
        <p className="mt-4 text-lg font-bold text-[var(--st-ink)]">{inr(amount)}</p>
        {error && <button type="button" onClick={() => { setError(''); setAttempt((n) => n + 1); }} className="mt-5 w-full h-11 rounded-full bg-[var(--st-accent)] text-white font-bold">Try again</button>}
        {busy && <span className="mx-auto mt-5 block w-6 h-6 rounded-full border-2 border-[var(--st-accent)] border-t-transparent animate-spin" />}
        {error && <button type="button" onClick={() => onDismiss(error)} className="mt-3 text-sm font-semibold text-[#6F7E92]">Close</button>}
      </div>
    </div>
  );
}

export function MethodGlyph({ method, size = 18 }: { method: GatewayMethod; size?: number }) {
  const label = method === 'Razorpay' ? 'RZP' : method === 'Cash on Delivery' ? 'COD' : method === 'Net Banking' ? 'BANK' : method === 'Credit Card' || method === 'Card' ? 'CARD' : 'UPI';
  return <span style={{ fontSize: Math.max(9, size * 0.55) }} className="font-black tracking-tight">{label}</span>;
}

export function BrandMark({ brand }: { brand: string }) {
  return <span className="px-2 py-1 rounded-md bg-white border border-[#E3E8EF] text-[10px] font-black text-[#3A4A5F]">{brand}</span>;
}
