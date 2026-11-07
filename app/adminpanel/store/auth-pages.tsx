'use client';

import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { ordersStore, shopperAccountsStore, registerShopper, verifyShopper, createStore, PHOTO_URLS, type ShopperAccount } from '../demo-data';
import {
  T, Icon, Photo, Button, useStore, useAccount, sessionStore, wishlistStore, myOrdersStore, navigate, showToast, formatDate, inr,
} from './store-kit';

// =============================================================================
// Sign-in Popup State (the profile icon opens it; checkout can too)
// =============================================================================

type AuthTab = 'signin' | 'signup';

const authUiStore = createStore<{ tab: AuthTab; next: string } | null>(null, null);

/** Opens the sign-in popup on a tab; `next` is a page to go to afterwards, e.g. 'checkout'. */
export function openAuth(tab: AuthTab = 'signin', next = '') {
  authUiStore.set({ tab, next });
}

const closeAuth = () => authUiStore.set(null);

/** Signs the shopper in on this device and greets them. */
function completeSignIn(account: ShopperAccount, isNew: boolean, next: string) {
  sessionStore.set(account.email);
  closeAuth();
  showToast(isNew ? `Welcome, ${account.name.split(/\s+/)[0]} — your account is ready` : `Welcome back, ${account.name.split(/\s+/)[0]}`, null);
  if (next) navigate(`#/${next}`, { replace: true });
}

// =============================================================================
// Fields
// =============================================================================

export function Field({
  id, label, icon, type = 'text', value, onChange, error, autoComplete, placeholder, trailing, inputMode, autoFocus,
}: {
  id: string; label: string; icon: string; type?: string; value: string; onChange: (v: string) => void; error?: string;
  autoComplete?: string; placeholder?: string; trailing?: ReactNode; inputMode?: 'email' | 'tel'; autoFocus?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[13px] font-semibold text-[#3A4A5F] mb-2">{label}</label>
      <div className={`flex items-center gap-3 h-[52px] px-4 rounded-[14px] border bg-[var(--st-page)] transition-all focus-within:bg-white focus-within:ring-4 ${error ? 'border-[#D23B3B] focus-within:ring-[#D23B3B]/10' : 'border-[#E3E8EF] focus-within:border-[var(--st-accent)] focus-within:ring-[var(--st-accent)]/10'}`}>
        <span className="text-[#8A97A8]"><Icon name={icon} size={18} /></span>
        <input
          id={id}
          name={id}
          type={type}
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          autoFocus={autoFocus}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="flex-1 min-w-0 bg-transparent outline-none text-[15.5px] text-[var(--st-ink)] placeholder:text-[#A9B4C2]"
        />
        {trailing}
      </div>
      {error && <p id={`${id}-error`} className="mt-1.5 text-[12.5px] font-medium text-[#D23B3B]">{error}</p>}
    </div>
  );
}

function PasswordField({ id, label, value, onChange, error, autoComplete }: { id: string; label: string; value: string; onChange: (v: string) => void; error?: string; autoComplete: string }) {
  const [shown, setShown] = useState(false);
  return (
    <Field
      id={id}
      label={label}
      icon="lock"
      type={shown ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      error={error}
      autoComplete={autoComplete}
      placeholder="••••••••"
      trailing={
        <button type="button" onClick={() => setShown(!shown)} aria-label={shown ? 'Hide password' : 'Show password'} className="text-[#8A97A8] hover:text-[var(--st-ink)] transition-colors">
          <Icon name={shown ? 'eyeOff' : 'eye'} size={18} />
        </button>
      }
    />
  );
}

// =============================================================================
// Sign In and Create Account Forms
// =============================================================================

function SignInForm({ idPrefix, next, onSwitch }: { idPrefix: string; next: string; onSwitch: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || !password) {
      setError('Enter your email address and password.');
      return;
    }
    setBusy(true);
    setTimeout(() => {
      const account = verifyShopper(email, password);
      if (!account) {
        setBusy(false);
        setError('That email and password don’t match an account.');
        return;
      }
      completeSignIn(account, false, next);
    }, 500);
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Field id={`${idPrefix}-email`} label="Email address" icon="mail" type="email" inputMode="email" autoComplete="email" placeholder="demo.you@example.com" value={email} onChange={(v) => { setEmail(v); setError(''); }} autoFocus />
      <PasswordField id={`${idPrefix}-password`} label="Password" autoComplete="current-password" value={password} onChange={(v) => { setPassword(v); setError(''); }} />
      <div className="flex justify-end -mt-2">
        <button type="button" onClick={() => showToast('A reset link would be emailed to you — this is a demo', null)} className="text-[13.5px] font-semibold text-[var(--st-accent)] hover:underline">
          Forgot password?
        </button>
      </div>
      {error && <p role="alert" className="px-4 py-3 rounded-[12px] bg-[#FDECEC] text-[13.5px] font-medium text-[#D23B3B]">{error}</p>}
      <Button type="submit" variant="accent" disabled={busy} className="w-full">{busy ? 'Signing in…' : <>Sign in <Icon name="arrow" size={16} /></>}</Button>
      <button
        type="button"
        onClick={() => { setEmail('demo.shopper@example.com'); setPassword('demo1234'); setError(''); }}
        className="w-full px-4 py-3 rounded-[14px] border border-dashed border-[#CFD8E3] bg-[var(--st-page)] hover:border-[var(--st-accent)] text-left transition-colors group"
      >
        <span className="block text-[11.5px] uppercase tracking-[0.14em] font-bold text-[#6F7E92] group-hover:text-[var(--st-accent)]">Demo account — tap to fill</span>
        <span className="block mt-0.5 text-[13.5px] text-[#3A4A5F]">demo.shopper@example.com · demo1234</span>
      </button>
      <p className="text-center text-[14px] text-[#5B6B80]">
        New here? <button type="button" onClick={onSwitch} className="font-bold text-[var(--st-ink)] hover:text-[var(--st-accent)]">Create an account</button>
      </p>
    </form>
  );
}

function passwordScore(password: string) {
  return [password.length >= 8, /[A-Z]/.test(password) && /[a-z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
}

function SignUpForm({ idPrefix, next, onSwitch }: { idPrefix: string; next: string; onSwitch: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [agreed, setAgreed] = useState(true);
  const [showErrors, setShowErrors] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const score = passwordScore(form.password);

  const problems: Partial<Record<keyof typeof form | 'agreed', string>> = {};
  if (form.name.trim().length < 2) problems.name = 'Enter your full name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) problems.email = 'Enter a valid email address.';
  if (form.phone.trim() && !/^[6-9]\d{9}$/.test(form.phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, ''))) problems.phone = 'Enter a 10-digit mobile number, or leave it empty.';
  if (form.password.length < 8) problems.password = 'Use at least 8 characters.';
  if (!agreed) problems.agreed = 'Please accept the terms to continue.';
  const shown = (key: keyof typeof problems) => (showErrors ? problems[key] : undefined);
  const set = (key: keyof typeof form) => (value: string) => {
    setForm({ ...form, [key]: value });
    setError('');
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (Object.keys(problems).length) {
      setShowErrors(true);
      return;
    }
    setBusy(true);
    setTimeout(() => {
      try {
        completeSignIn(registerShopper(form), true, next);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
        setBusy(false);
      }
    }, 600);
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Field id={`${idPrefix}-name`} label="Full name" icon="user" autoComplete="name" placeholder="e.g. Riya Kapoor" value={form.name} onChange={set('name')} error={shown('name')} autoFocus />
      <Field id={`${idPrefix}-email`} label="Email address" icon="mail" type="email" inputMode="email" autoComplete="email" placeholder="demo.you@example.com" value={form.email} onChange={set('email')} error={shown('email')} />
      <Field id={`${idPrefix}-phone`} label="Mobile number (optional)" icon="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="00000 00000" value={form.phone} onChange={set('phone')} error={shown('phone')} />
      <div>
        <PasswordField id={`${idPrefix}-password`} label="Password" autoComplete="new-password" value={form.password} onChange={set('password')} error={shown('password')} />
        {form.password && (
          <div className="mt-2.5 flex items-center gap-3">
            <div className="flex-1 grid grid-cols-4 gap-1.5" aria-hidden="true">
              {[1, 2, 3, 4].map((bar) => (
                <span key={bar} className={`h-1.5 rounded-full transition-colors ${bar <= score ? (score <= 1 ? 'bg-[#D23B3B]' : score === 2 ? 'bg-[#F5B000]' : 'bg-[#0F8A5F]') : 'bg-[#E3E8EF]'}`} />
              ))}
            </div>
            <span className="text-[12px] font-semibold text-[#5B6B80] w-16 text-right">{['Too short', 'Weak', 'Fair', 'Good', 'Strong'][score]}</span>
          </div>
        )}
      </div>
      <div>
        <label className="flex items-start gap-3 cursor-pointer text-[13.5px] text-[#3A4A5F] leading-relaxed">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 w-4 h-4 accent-[var(--st-accent)]" />
          <span>I agree to the terms and privacy policy.</span>
        </label>
        {shown('agreed') && <p className="mt-1.5 text-[12.5px] font-medium text-[#D23B3B]">{problems.agreed}</p>}
      </div>
      {error && <p role="alert" className="px-4 py-3 rounded-[12px] bg-[#FDECEC] text-[13.5px] font-medium text-[#D23B3B]">{error}</p>}
      <Button type="submit" variant="accent" disabled={busy} className="w-full">{busy ? 'Creating your account…' : <>Create account <Icon name="arrow" size={16} /></>}</Button>
      <p className="text-center text-[14px] text-[#5B6B80]">
        Already a member? <button type="button" onClick={onSwitch} className="font-bold text-[var(--st-ink)] hover:text-[var(--st-accent)]">Sign in</button>
      </p>
    </form>
  );
}

/** "Sign in | Create account" side by side as tabs, with the matching form underneath. */
function AuthForms({ initialTab, next, idPrefix }: { initialTab: AuthTab; next: string; idPrefix: string }) {
  const [tab, setTab] = useState<AuthTab>(initialTab);
  return (
    <div>
      <div className="grid grid-cols-2 p-1.5 rounded-full bg-[#EDF1F6]" role="tablist" aria-label="Account">
        {([['signin', 'Sign in'], ['signup', 'Create account']] as const).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`h-11 rounded-full text-[14.5px] font-bold transition-all duration-300 ${tab === key ? 'bg-white text-[var(--st-ink)] shadow-[0_6px_16px_-8px_rgba(14,26,43,0.4)]' : 'text-[#6F7E92] hover:text-[var(--st-ink)]'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div key={tab} className="fade mt-7">
        <h2 className={`${T.display} text-[30px] leading-[1.1]`}>{tab === 'signin' ? <>Welcome <em>back</em></> : <>Join <em>the club</em></>}</h2>
        <p className="mt-2 mb-7 text-[14.5px] text-[#5B6B80]">{tab === 'signin' ? 'Sign in to track orders and check out faster.' : 'Create an account in under a minute.'}</p>
        {tab === 'signin'
          ? <SignInForm idPrefix={`${idPrefix}-in`} next={next} onSwitch={() => setTab('signup')} />
          : <SignUpForm idPrefix={`${idPrefix}-up`} next={next} onSwitch={() => setTab('signin')} />}
      </div>
    </div>
  );
}

function BrandPanel({ compact = false }: { compact?: boolean }) {
  return (
    <aside className={`on-dark relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[var(--st-ink)] via-[var(--st-ink-2)] to-[var(--st-deep)] text-white ${compact ? 'p-9' : 'p-10 rounded-[32px] min-h-[620px]'}`}>
      <span aria-hidden="true" className="pointer-events-none absolute -top-24 -right-20 w-[420px] h-[420px] rounded-full bg-[var(--st-accent)]/35 blur-[110px]" />
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-24 w-[380px] h-[320px] rounded-full bg-[#9AA7B8]/20 blur-[100px]" />
      <div className="relative">
        <p className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-[12px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--st-accent-2)] shadow-[0_0_10px_var(--st-accent-2)]" /> Members get more
        </p>
        <h2 className={`${T.display} mt-6 ${compact ? 'text-[34px]' : 'text-[44px]'} leading-[1.04] max-w-sm`}>Your gadgets, <em>beautifully organised.</em></h2>
        <ul className="mt-7 space-y-3.5 max-w-sm">
          {[
            ['box', 'Track every order live'],
            ['heart', 'Keep your wishlist across visits'],
            ['card', 'Faster checkout, details pre-filled'],
            ['tag', 'Members-only offers first'],
          ].map(([icon, text]) => (
            <li key={text} className="flex items-center gap-3.5 text-[14px] text-white/85">
              <span className="w-9 h-9 shrink-0 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-[var(--st-accent-light)]"><Icon name={icon} size={16} /></span>
              {text}
            </li>
          ))}
        </ul>
      </div>
      <div className={`relative ${compact ? 'h-[170px]' : 'h-[220px]'} mt-8`}>
        {PHOTO_URLS.slice(0, 3).map((src, i) => (
          <div
            key={src}
            className={`absolute rounded-[20px] overflow-hidden ring-1 ring-white/15 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)] float ${['left-0 bottom-0 w-[44%] h-[85%] -rotate-3', 'left-[30%] bottom-4 w-[40%] h-[95%] rotate-2 z-10', 'right-0 bottom-1 w-[36%] h-[78%] rotate-6'][i]}`}
            style={{ animationDelay: `${i * 0.9}s` }}
          >
            <Photo src={src} alt="" width={400} className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
    </aside>
  );
}

/** The popup the profile icon opens: brand panel beside the Sign in / Create account tabs. */
export function AuthModal() {
  const ui = useStore(authUiStore);
  const account = useAccount();
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ui) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeAuth();
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [ui]);

  if (!ui || account) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-6" role="dialog" aria-modal="true" aria-label="Sign in or create an account">
      <button aria-label="Close" onClick={closeAuth} className="absolute inset-0 bg-[var(--st-deep)]/60 backdrop-blur-md fade" />
      <div ref={dialog} className="modal-in relative w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-[960px] overflow-hidden sm:rounded-[32px] bg-white shadow-[0_60px_120px_-30px_rgba(0,0,0,0.6)] grid lg:grid-cols-[0.92fr_1fr]">
        <BrandPanel compact />
        <div className="relative overflow-y-auto px-6 py-8 sm:px-11 sm:py-10">
          <button onClick={closeAuth} aria-label="Close" className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[var(--st-page)] hover:bg-[#EDF1F6] flex items-center justify-center"><Icon name="close" size={18} /></button>
          <div className="mt-6 sm:mt-2">
            <AuthForms key={`${ui.tab}-${ui.next}`} initialTab={ui.tab} next={ui.next} idPrefix="modal" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Full-page version for links such as #/login, #/signup and #/account while signed out. */
export function AuthPage({ initialTab, next }: { initialTab: AuthTab; next: string }) {
  return (
    <div className={`${T.shell} pt-6 sm:pt-8`}>
      <div className="grid lg:grid-cols-[1.05fr_1fr] gap-6 items-stretch">
        <BrandPanel />
        <section className="flex items-center justify-center rounded-[32px] bg-white border border-[#E3E8EF] shadow-[0_40px_80px_-60px_rgba(14,26,43,0.5)] px-6 py-10 sm:px-12 sm:py-12">
          <div className="w-full max-w-[440px]">
            <AuthForms key={`${initialTab}-${next}`} initialTab={initialTab} next={next} idPrefix="page" />
          </div>
        </section>
      </div>
    </div>
  );
}

// =============================================================================
// My Account
// =============================================================================

export function AccountPage() {
  const account = useAccount();
  const orders = useStore(ordersStore);
  const accounts = useStore(shopperAccountsStore);
  const myIds = useStore(myOrdersStore);
  const wishlist = useStore(wishlistStore);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ name: '', phone: '' });

  if (!account) return null;
  const mine = orders.filter((o) => o.email.toLowerCase() === account.email || myIds.includes(o.id));
  const spent = mine.filter((o) => o.orderStatus !== 'Cancelled').reduce((sum, o) => sum + o.total, 0);
  const active = mine.filter((o) => o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled').length;
  const initials = account.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  const signOut = () => {
    sessionStore.set('');
    showToast('You’ve been signed out', null);
    navigate('#/', { replace: true });
  };

  const saveProfile = () => {
    if (draft.name.trim().length < 2) return;
    shopperAccountsStore.set(accounts.map((a) => (a.id === account.id ? { ...a, name: draft.name.trim(), phone: draft.phone.trim() } : a)));
    setEditing(false);
    showToast('Profile updated', null);
  };

  const card = 'rounded-[28px] bg-white border border-[#E3E8EF] p-6 sm:p-8';

  return (
    <div className={`${T.shell} pt-6 sm:pt-8`}>
      {/* Welcome banner */}
      <section className="on-dark relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[var(--st-ink)] via-[var(--st-ink-2)] to-[var(--st-deep)] text-white p-7 sm:p-10">
        <span aria-hidden="true" className="pointer-events-none absolute -top-24 right-0 w-[460px] h-[360px] rounded-full bg-[var(--st-accent)]/30 blur-[110px]" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-5">
            <span className="w-16 h-16 sm:w-20 sm:h-20 rounded-[22px] bg-gradient-to-br from-[var(--st-accent)] to-[var(--st-accent-2)] flex items-center justify-center text-[24px] sm:text-[28px] font-extrabold shadow-[0_14px_34px_-12px_rgba(47,107,255,0.8)]">{initials}</span>
            <div>
              <p className="text-[13px] font-semibold text-[var(--st-accent-light)]">Member since {formatDate(account.createdAt).split(', ').slice(1).join(', ')}</p>
              <h1 className={`${T.display} text-[32px] sm:text-[44px] leading-[1.05] mt-1`}>Hello, <em>{account.name.split(/\s+/)[0]}</em></h1>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {[
              [String(mine.length), 'Orders'],
              [String(active), 'On the way'],
              [inr(spent), 'Spent'],
            ].map(([value, label]) => (
              <div key={label} className="px-4 sm:px-6 py-4 rounded-[20px] bg-white/10 border border-white/10 backdrop-blur-md text-center">
                <p className="text-[18px] sm:text-[22px] font-extrabold tracking-[-0.02em]">{value}</p>
                <p className="text-[11.5px] font-semibold text-white/60 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-6 grid lg:grid-cols-[1.6fr_1fr] gap-6 items-start">
        {/* Orders */}
        <section className={card}>
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className={`${T.display} text-[26px]`}>Your orders</h2>
            <a href="#/shop" className="text-[14px] font-semibold text-[var(--st-accent)] hover:underline">Continue shopping</a>
          </div>
          {mine.length ? (
            <ul className="divide-y divide-[#E3E8EF]">
              {mine.map((order) => (
                <li key={order.id}>
                  <a href={`#/order/${order.id}`} className="group flex flex-wrap items-center gap-4 py-4">
                    <div className="flex -space-x-3">
                      {order.items.slice(0, 3).map((item, i) => <Photo key={i} src={item.image} alt="" width={120} className="w-12 h-12 rounded-[12px] object-cover border-2 border-white bg-[#EDF1F6]" />)}
                    </div>
                    <div className="flex-1 min-w-[150px]">
                      <p className="text-[14.5px] font-bold">{order.orderNumber}</p>
                      <p className="text-[13px] text-[#6F7E92]">{formatDate(order.placedAt)} · {order.itemsCount} {order.itemsCount === 1 ? 'item' : 'items'}</p>
                    </div>
                    <span className={`text-[12px] font-bold px-3 py-1.5 rounded-full ${order.orderStatus === 'Cancelled' ? 'bg-[#FDECEC] text-[#D23B3B]' : order.orderStatus === 'Delivered' ? 'bg-[#E3F4EC] text-[#0F8A5F]' : 'bg-[var(--st-accent)]/10 text-[var(--st-accent)]'}`}>{order.orderStatus}</span>
                    <p className="text-[15px] font-bold tabular-nums">{inr(order.total)}</p>
                    <span className="text-[#8A97A8] transition-transform group-hover:translate-x-1"><Icon name="arrow" size={17} /></span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-10">
              <p className="text-[15px] text-[#5B6B80]">No orders yet — your first one will appear here with live tracking.</p>
              <Button href="#/shop" variant="accent" className="mt-5">Start shopping</Button>
            </div>
          )}
        </section>

        <div className="space-y-6">
          {/* Profile */}
          <section className={card}>
            <div className="flex items-center justify-between gap-4 mb-5">
              <h2 className={`${T.display} text-[22px]`}>Profile</h2>
              {!editing && (
                <button onClick={() => { setDraft({ name: account.name, phone: account.phone }); setEditing(true); }} className="text-[14px] font-semibold text-[var(--st-accent)] hover:underline">Edit</button>
              )}
            </div>
            {editing ? (
              <div className="space-y-4">
                <Field id="acc-name" label="Full name" icon="user" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
                <Field id="acc-phone" label="Mobile" icon="phone" type="tel" value={draft.phone} onChange={(v) => setDraft({ ...draft, phone: v })} />
                <div className="flex gap-3">
                  <Button onClick={saveProfile} variant="accent" className="flex-1 !h-12">Save</Button>
                  <Button onClick={() => setEditing(false)} variant="outline" className="!h-12">Cancel</Button>
                </div>
              </div>
            ) : (
              <dl className="space-y-4 text-[14.5px]">
                {[
                  ['user', 'Name', account.name],
                  ['mail', 'Email', account.email],
                  ['phone', 'Mobile', account.phone || 'Not added'],
                ].map(([icon, label, value]) => (
                  <div key={label} className="flex items-center gap-3.5">
                    <span className="w-10 h-10 shrink-0 rounded-full bg-[#EDF1F6] text-[var(--st-accent)] flex items-center justify-center"><Icon name={icon} size={17} /></span>
                    <div className="min-w-0">
                      <dt className="text-[12px] font-semibold text-[#8A97A8]">{label}</dt>
                      <dd className="font-semibold truncate">{value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            )}
          </section>

          {/* Shortcuts */}
          <section className={`${card} !p-3`}>
            {[
              ['heart', 'Wishlist', `${wishlist.length} saved`, '#/wishlist'],
              ['tag', 'Offers for you', 'Members-only savings', '#/deals'],
              ['chat', 'Contact us', 'We reply within a day', '#/contact'],
            ].map(([icon, title, sub, href]) => (
              <a key={title} href={href} className="flex items-center gap-4 p-4 rounded-[20px] hover:bg-[var(--st-page)] transition-colors group">
                <span className="w-11 h-11 shrink-0 rounded-[14px] bg-[var(--st-ink)] text-white flex items-center justify-center"><Icon name={icon} size={18} /></span>
                <span className="flex-1">
                  <span className="block text-[15px] font-bold">{title}</span>
                  <span className="block text-[13px] text-[#6F7E92]">{sub}</span>
                </span>
                <span className="text-[#8A97A8] transition-transform group-hover:translate-x-1"><Icon name="arrow" size={17} /></span>
              </a>
            ))}
            <button onClick={signOut} className="w-full flex items-center gap-4 p-4 rounded-[20px] hover:bg-[#FDECEC] transition-colors text-left">
              <span className="w-11 h-11 shrink-0 rounded-[14px] bg-[#FDECEC] text-[#D23B3B] flex items-center justify-center"><Icon name="logout" size={18} /></span>
              <span className="text-[15px] font-bold text-[#D23B3B]">Sign out</span>
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
