'use client';

import { useRef, useState, type ReactNode } from 'react';
import { storeDetailsStore, useStoreDetails, DEFAULT_STORE_DETAILS, type StoreDetails } from './demo-data';

const MAX_LOGO_FILE = 2 * 1024 * 1024;

/** Shrinks a raster logo to at most 600×240 so it fits comfortably in browser storage. SVGs are kept as they are. */
function readLogo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('This file could not be read.'));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (file.type === 'image/svg+xml') return resolve(dataUrl);
      const img = new Image();
      img.onerror = () => reject(new Error('This file is not an image we can read.'));
      img.onload = () => {
        const scale = Math.min(1, 600 / img.width, 240 / img.height);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

const URL_RE = /^https?:\/\/\S+$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function problemsIn(d: StoreDetails) {
  const problems: Partial<Record<string, string>> = {};
  if (!d.name.trim()) problems.name = 'Enter the store name.';
  if (d.email.trim() && !EMAIL_RE.test(d.email.trim())) problems.email = 'Enter a valid email address.';
  if (d.phone.trim() && !/^[\d+\s()-]{6,}$/.test(d.phone.trim())) problems.phone = 'Use digits, spaces, + and - only.';
  if (d.whatsapp.trim() && d.whatsapp.replace(/\D/g, '').length < 8) problems.whatsapp = 'Enter the full number with country code.';
  (Object.keys(d.social) as (keyof StoreDetails['social'])[]).forEach((key) => {
    if (d.social[key].trim() && !URL_RE.test(d.social[key].trim())) problems[key] = 'Start the link with https://';
  });
  if (d.logoUrl && !d.logoUrl.startsWith('data:image/') && !URL_RE.test(d.logoUrl)) problems.logoUrl = 'Paste an image link starting with https://';
  return problems;
}

const input = 'w-full px-4 py-3 bg-[#F3F6FA] border border-[#E3E8EF] rounded-xl text-[14px] font-semibold text-[#0E1A2B] outline-none focus:bg-white focus:border-[#2F6BFF] focus:ring-4 focus:ring-[#2F6BFF]/10 transition-all';
const label = 'block text-[11.5px] font-extrabold uppercase tracking-wider text-[#6F7E92] mb-1.5';

function Field({ id, title, hint, error, children }: { id: string; title: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className={label}>{title}</label>
      {children}
      {error ? <p className="mt-1.5 text-[12px] font-semibold text-red-600">{error}</p> : hint && <p className="mt-1.5 text-[12px] text-[#6F7E92]">{hint}</p>}
    </div>
  );
}

function Section({ title, text, children }: { title: string; text: string; children: ReactNode }) {
  return (
    <section className="bg-white border border-[#E3E8EF] rounded-[24px] shadow-sm p-5 sm:p-7">
      <h2 className="text-lg font-bold tracking-tight text-[#0E1A2B]">{title}</h2>
      <p className="mt-0.5 text-[13px] text-[#6F7E92]">{text}</p>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

/** How the logo and name will look, using the default theme's mark when no logo is uploaded. */
function LogoPreview({ d, dark }: { d: StoreDetails; dark: boolean }) {
  const [first = '', ...rest] = d.name.trim().split(/\s+/);
  const text = dark ? 'text-white' : 'text-[#0E1A2B]';
  return (
    <span className="flex items-center gap-3 min-w-0">
      {d.logoUrl ? (
        <span className={`shrink-0 inline-flex items-center ${dark ? 'bg-white/95 rounded-xl px-2 py-1.5' : ''}`}>
          <img src={d.logoUrl} alt="" className="h-9 w-auto max-w-[140px] object-contain" />
        </span>
      ) : (
        <span className="shrink-0 w-10 h-10 rounded-[12px] bg-gradient-to-br from-[#2F6BFF] to-[#0E1A2B] flex items-center justify-center">
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24"><path d="M6 4h6a8 8 0 0 1 0 16H6z" fill="none" stroke="white" strokeWidth="2.6" strokeLinejoin="round" /><circle cx="12" cy="12" r="2.4" fill="#C9D2DD" /></svg>
        </span>
      )}
      {(!d.logoUrl || d.showNameWithLogo) && (
        <span className={`flex flex-col leading-none min-w-0 ${text}`}>
          <span className="text-[19px] font-extrabold tracking-[-0.04em] truncate">{first || 'Store'}</span>
          {rest.length > 0 && <span className={`text-[9.5px] font-semibold uppercase tracking-[0.3em] mt-1 truncate ${dark ? 'text-white/60' : 'text-[#8A97A8]'}`}>{rest.join(' ')}</span>}
        </span>
      )}
    </span>
  );
}

export function StoreDetailsSettings({ notify }: { notify: (message: string) => void }) {
  const saved = useStoreDetails();
  const [draft, setDraft] = useState<StoreDetails>(saved);
  const [logoError, setLogoError] = useState('');
  const [logoLink, setLogoLink] = useState(saved.logoUrl.startsWith('data:') ? '' : saved.logoUrl);
  const [tried, setTried] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const problems = problemsIn(draft);
  const show = (key: string) => (tried ? problems[key] : undefined);
  const changed = JSON.stringify(draft) !== JSON.stringify(saved);
  const set = (patch: Partial<StoreDetails>) => setDraft((d) => ({ ...d, ...patch }));
  const setSocial = (key: keyof StoreDetails['social'], value: string) => setDraft((d) => ({ ...d, social: { ...d.social, [key]: value } }));

  const pickLogo = (file: File | undefined) => {
    if (!file) return;
    setLogoError('');
    if (!file.type.startsWith('image/')) return setLogoError('Choose an image file: PNG, JPG, WebP or SVG.');
    if (file.size > MAX_LOGO_FILE) return setLogoError('The logo is larger than 2 MB.');
    readLogo(file).then((url) => { set({ logoUrl: url }); setLogoLink(''); }, (reason: Error) => setLogoError(reason.message));
  };

  const save = () => {
    setTried(true);
    if (Object.keys(problems).length) return notify('Fix the highlighted fields first.');
    const clean: StoreDetails = {
      ...draft,
      name: draft.name.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      whatsapp: draft.whatsapp.trim(),
      social: Object.fromEntries(Object.entries(draft.social).map(([k, v]) => [k, v.trim()])) as StoreDetails['social'],
    };
    try {
      storeDetailsStore.set(clean);
      setDraft(clean);
      notify('Store details saved. The website shows them now.');
    } catch {
      notify('Could not save: the logo may be too large for browser storage.');
    }
  };
  const discard = () => { setDraft(saved); setTried(false); setLogoError(''); };
  const reset = () => {
    if (!window.confirm('Put the name, logo, contact details and footer text back to the defaults?')) return;
    storeDetailsStore.set(DEFAULT_STORE_DETAILS);
    setDraft(DEFAULT_STORE_DETAILS);
    setLogoLink('');
    setTried(false);
    notify('Store details reset to the defaults.');
  };

  const actions = (
    <div className="flex flex-wrap items-center gap-2.5">
      <button type="button" onClick={reset} className="h-11 px-5 rounded-full text-[13px] font-bold text-[#6F7E92] hover:text-red-600">Reset to defaults</button>
      <button type="button" onClick={discard} disabled={!changed} className="h-11 px-6 rounded-full bg-[#EDF1F6] text-[#0E1A2B] text-[13.5px] font-bold hover:bg-[#E3E8EF] disabled:opacity-50">Discard</button>
      <button type="button" onClick={save} disabled={!changed} className="h-11 px-7 rounded-full bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white text-[13.5px] font-bold shadow-md disabled:opacity-50 disabled:shadow-none">Save changes</button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E3E8EF] rounded-[24px] shadow-sm p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#0E1A2B]">Logo, contact details &amp; footer</h2>
          <p className="mt-1 text-sm text-[#6F7E92]">Shown in the website header and footer, the contact page, invoices and shipping labels.{changed && <span className="ml-2 font-bold text-amber-600">Unsaved changes</span>}</p>
        </div>
        {actions}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          <Section title="Logo & store name" text="Upload a logo, or keep the built-in mark. Transparent PNG or SVG looks best.">
            <Field id="sd-name" title="Store name" hint="The first word is shown large, the rest small beneath it." error={show('name')}>
              <input id="sd-name" value={draft.name} onChange={(e) => set({ name: e.target.value })} className={input} />
            </Field>
            <div>
              <p className={label}>Logo</p>
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                <div className="w-full sm:w-56 h-28 shrink-0 rounded-2xl border-2 border-dashed border-[#CFD8E3] bg-[repeating-conic-gradient(#F3F6FA_0%_25%,#FFFFFF_0%_50%)] bg-[length:16px_16px] flex items-center justify-center p-3">
                  {draft.logoUrl ? <img src={draft.logoUrl} alt="Logo preview" className="max-h-full max-w-full object-contain" /> : <span className="text-[12.5px] font-semibold text-[#8A97A8]">Built-in mark</span>}
                </div>
                <div className="space-y-2.5 min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => fileInput.current?.click()} className="h-10 px-5 rounded-full bg-[#2F6BFF] text-white text-[13px] font-bold hover:bg-[#1F55E0]">{draft.logoUrl ? 'Replace logo' : 'Upload logo'}</button>
                    {draft.logoUrl && <button type="button" onClick={() => { set({ logoUrl: '' }); setLogoLink(''); }} className="h-10 px-5 rounded-full border border-[#E3E8EF] text-[13px] font-bold text-red-600 hover:bg-red-50">Remove</button>}
                    <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(e) => { pickLogo(e.target.files?.[0]); e.target.value = ''; }} />
                  </div>
                  <div className="flex gap-2">
                    <input value={logoLink} onChange={(e) => setLogoLink(e.target.value)} placeholder="…or paste an image link (https://…)" aria-label="Logo image link" className={`${input} py-2.5`} />
                    <button type="button" onClick={() => set({ logoUrl: logoLink.trim() })} disabled={!logoLink.trim()} className="shrink-0 h-[42px] px-4 rounded-xl border border-[#E3E8EF] text-[13px] font-bold text-[#2F6BFF] hover:bg-[#EAF1FF] disabled:opacity-50">Use link</button>
                  </div>
                  {(logoError || show('logoUrl')) && <p className="text-[12px] font-semibold text-red-600">{logoError || show('logoUrl')}</p>}
                  <p className="text-[12px] text-[#6F7E92]">PNG, JPG, WebP or SVG, up to 2 MB. Large images are scaled down automatically.</p>
                </div>
              </div>
            </div>
            <label className={`flex items-center justify-between gap-4 rounded-2xl border border-[#E3E8EF] px-4 py-3 ${draft.logoUrl ? 'cursor-pointer' : 'opacity-50'}`}>
              <span><span className="block text-[14px] font-bold text-[#0E1A2B]">Show the store name next to the logo</span><span className="block text-[12px] text-[#6F7E92]">Turn off if your logo already includes the name.</span></span>
              <input type="checkbox" disabled={!draft.logoUrl} checked={draft.showNameWithLogo} onChange={(e) => set({ showNameWithLogo: e.target.checked })} className="w-5 h-5 accent-[#2F6BFF]" />
            </label>
          </Section>

          <Section title="Contact details" text="Shown in the footer and on the contact page; the address and phone also print on invoices.">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field id="sd-phone" title="Phone" error={show('phone')}>
                <input id="sd-phone" type="tel" value={draft.phone} onChange={(e) => set({ phone: e.target.value })} className={input} />
              </Field>
              <Field id="sd-email" title="Email" error={show('email')}>
                <input id="sd-email" type="email" value={draft.email} onChange={(e) => set({ email: e.target.value })} className={input} />
              </Field>
              <Field id="sd-whatsapp" title="WhatsApp number" hint="With country code. Leave empty to hide the WhatsApp button." error={show('whatsapp')}>
                <input id="sd-whatsapp" type="tel" value={draft.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} className={input} />
              </Field>
              <Field id="sd-hours" title="Opening hours">
                <input id="sd-hours" value={draft.hours} onChange={(e) => set({ hours: e.target.value })} placeholder="Mon–Sun, 9am–9pm" className={input} />
              </Field>
            </div>
            <Field id="sd-address" title="Address">
              <textarea id="sd-address" rows={2} value={draft.address} onChange={(e) => set({ address: e.target.value })} className={`${input} resize-none`} />
            </Field>
          </Section>

          <Section title="Footer text" text="The words in the website footer. Leave a field empty to hide it.">
            <Field id="sd-tagline" title="Footer headline" hint="The large line under the logo.">
              <input id="sd-tagline" value={draft.tagline} onChange={(e) => set({ tagline: e.target.value })} className={input} />
            </Field>
            <Field id="sd-about" title="Footer description" hint={`${draft.footerAbout.length}/300`}>
              <textarea id="sd-about" rows={3} maxLength={300} value={draft.footerAbout} onChange={(e) => set({ footerAbout: e.target.value })} className={`${input} resize-none`} />
            </Field>
            <Field id="sd-note" title="Bottom line" hint={`Shown after “© ${new Date().getFullYear()} ${draft.name.trim() || 'Store'}.”`}>
              <input id="sd-note" value={draft.footerNote} onChange={(e) => set({ footerNote: e.target.value })} className={input} />
            </Field>
          </Section>

          <Section title="Social links" text="Each filled link adds an icon to the footer.">
            <div className="grid sm:grid-cols-2 gap-4">
              {([['instagram', 'Instagram'], ['facebook', 'Facebook'], ['youtube', 'YouTube'], ['x', 'X (Twitter)']] as const).map(([key, name]) => (
                <Field key={key} id={`sd-${key}`} title={name} error={show(key)}>
                  <input id={`sd-${key}`} type="url" value={draft.social[key]} onChange={(e) => setSocial(key, e.target.value)} placeholder={`https://${key === 'x' ? 'x' : key}.com/yourstore`} className={input} />
                </Field>
              ))}
            </div>
          </Section>

          <Section title="Return policy" text="Printed on invoices, and answers the returns question in the contact page FAQ.">
            <Field id="sd-returns" title="Return policy">
              <textarea id="sd-returns" rows={3} value={draft.returnPolicy} onChange={(e) => set({ returnPolicy: e.target.value })} className={`${input} resize-none`} />
            </Field>
          </Section>
        </div>

        {/* Live preview of the header and footer with the unsaved changes */}
        <aside className="xl:sticky xl:top-6 space-y-4 min-w-0">
          <p className="text-[11.5px] font-extrabold uppercase tracking-wider text-[#6F7E92]">Live preview</p>
          <div className="rounded-[20px] overflow-hidden border border-[#E3E8EF] shadow-sm bg-white">
            <div className="h-14 px-4 flex items-center justify-between border-b border-[#EDF1F6]">
              <LogoPreview d={draft} dark={false} />
              <span className="flex gap-2 shrink-0">{[0, 1, 2].map((i) => <span key={i} className="w-6 h-6 rounded-full bg-[#F3F6FA]" />)}</span>
            </div>
            <div className="bg-[#0B1524] text-white p-5 space-y-3">
              <LogoPreview d={draft} dark />
              {draft.tagline && <p className="text-[17px] font-bold leading-snug">{draft.tagline.replace(/\.$/, '')}.</p>}
              {draft.footerAbout && <p className="text-[12.5px] leading-relaxed text-[#9AA7B8] whitespace-pre-line">{draft.footerAbout}</p>}
              <ul className="space-y-1.5 text-[12.5px] text-[#C9D2DD]">
                {draft.address && <li className="whitespace-pre-line">📍 {draft.address}</li>}
                {draft.phone && <li>📞 {draft.phone}</li>}
                {draft.email && <li className="break-all">✉️ {draft.email}</li>}
                {draft.hours && <li>🕘 {draft.hours}</li>}
              </ul>
              {(Object.values(draft.social).some((v) => v.trim()) || draft.whatsapp.trim()) && (
                <div className="flex gap-1.5">
                  {[...Object.entries(draft.social).filter(([, v]) => v.trim()).map(([k]) => k), ...(draft.whatsapp.trim() ? ['whatsapp'] : [])].map((k) => (
                    <span key={k} className="h-7 px-2.5 rounded-full bg-white/10 text-[10.5px] font-bold uppercase flex items-center">{k === 'x' ? 'X' : k}</span>
                  ))}
                </div>
              )}
              <p className="pt-3 border-t border-white/10 text-[11px] text-[#6F7E92]">© {new Date().getFullYear()} {draft.name.trim() || 'Store'}.{draft.footerNote && ` ${draft.footerNote}`}</p>
            </div>
          </div>
          <a href="/adminpanel/store" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[13px] font-bold text-[#2F6BFF] hover:underline">Open the website ↗</a>
        </aside>
      </div>

      <div className="flex justify-end">{actions}</div>
    </div>
  );
}
