import { useSyncExternalStore } from 'react';
import type { CSSProperties } from 'react';
import { PHOTOS, SEED_PRODUCTS } from './catalog-seed';

// Everything the admin panel and the storefront share. Each list is saved in the browser, so an
// edit in the admin shows up on the website (even in another open tab) and survives a refresh.

// =============================================================================
// Variants
// =============================================================================

/** Stock per size, then per color: `{ '45mm': { 'Midnight Black': 3 } }`. */
export type VariantStock = Record<string, Record<string, number>>;

/** Stands in for the size or color of a product that has none, so it still gets one stock cell. */
export const STANDARD = 'Standard';

export const variantSizes = (sizes: string[]) => (sizes.length ? sizes : [STANDARD]);
export const variantColors = (colors: string[]) => (colors.length ? colors : [STANDARD]);

/** Keeps only the cells for the chosen sizes and colors (missing ones count as 0) and totals them. */
export function buildVariantStock(sizes: string[], colors: string[], values: VariantStock) {
  const variantStock: VariantStock = {};
  let stock = 0;
  for (const size of variantSizes(sizes)) {
    variantStock[size] = {};
    for (const color of variantColors(colors)) {
      const qty = values[size]?.[color] ?? 0;
      variantStock[size][color] = qty;
      stock += qty;
    }
  }
  return { variantStock, stock };
}

export const sizeTotal = (variantStock: VariantStock, size: string) =>
  Object.values(variantStock[size] ?? {}).reduce((sum, qty) => sum + qty, 0);

export const colorTotal = (variantStock: VariantStock, color: string) =>
  Object.values(variantStock).reduce((sum, byColor) => sum + (byColor[color] ?? 0), 0);

export const stockForVariant = (product: Product, size: string, color: string) => product.variantStock[size]?.[color] ?? 0;

/** Spreads a total evenly over every size and color, the first cells taking any remainder. */
function splitStock(stock: number, sizes: string[], colors: string[]): VariantStock {
  const cells = variantSizes(sizes).flatMap((size) => variantColors(colors).map((color) => [size, color] as const));
  const result: VariantStock = {};
  cells.forEach(([size, color], i) => {
    result[size] ??= {};
    result[size][color] = Math.floor(stock / cells.length) + (i < stock % cells.length ? 1 : 0);
  });
  return result;
}

// =============================================================================
// Types
// =============================================================================

export interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  barcode: string;
  category: string;
  subCategory: string;
  subSubCategory?: string;
  price: number;
  mrp?: number;
  stock: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  image: string;
  images: string[];
  sizes: string[];
  colors: string[];
  variantStock: VariantStock;
  colorImages: Record<string, string[]>;
  tags: string[];
  isNewArrival: boolean;
  isFeatured: boolean;
  rating: number;
  reviews: number;
  highlights: string[];
  specs: [string, string][];
  /** Shown on the website. Off hides the product from the store; it stays in the admin and POS. Missing means live. */
  isLive?: boolean;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  icon: string;
  image: string;
  blurb: string;
  status: 'Active' | 'Inactive';
}

export interface SubCategoryItem {
  id: string;
  name: string;
  parentCategory: string;
  status: 'Active' | 'Inactive';
}

export interface SubSubCategoryItem {
  id: string;
  name: string;
  parentSubCategory: string;
  parentCategory: string;
  status: 'Active' | 'Inactive';
}

export interface SizeOption {
  id: string;
  name: string;
  code: string;
}

export interface ColorOption {
  id: string;
  name: string;
  hex: string;
}

export interface TagOption {
  id: string;
  name: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'Percentage' | 'Fixed';
  discountValue: number;
  maxDiscount?: number;
  minPurchase: number;
  usageLimit?: number;
  validFrom: string;
  /** Empty means the coupon never expires. */
  validTill: string;
  usageCount: number;
  showInHeader: boolean;
  status: 'Active' | 'Expired';
}

export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
export const ORDER_STATUSES: OrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export interface OrderLine {
  productId: string;
  name: string;
  sku: string;
  size: string;
  color: string;
  qty: number;
  price: number;
  image: string;
}

export interface Shipment {
  courier: string;
  awb: string;
  pickup: string;
  weightKg: number;
  dimensions: string;
  status: 'Created' | 'In Transit' | 'Delivered' | 'Cancelled';
  createdAt: string;
  /** Shiprocket's own ids and status text (e.g. "PICKUP SCHEDULED"); courier and AWB stay empty until it assigns them. */
  srOrderId?: number;
  srShipmentId?: number;
  remoteStatus?: string;
  deliveryState?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
  shippingAddress: string;
  city: string;
  state: string;
  postalCode: string;
  date: string;
  placedAt: string;
  subtotal: number;
  discount: number;
  delivery: number;
  promo: string;
  total: number;
  itemsCount: number;
  items: OrderLine[];
  paymentMethod: 'Credit Card' | 'UPI' | 'Net Banking' | 'Razorpay' | 'Cash on Delivery';
  paymentId?: string;
  /** What the shopper paid with, e.g. "UPI · meera@okaxis" or "Visa •••• 1111". */
  paymentDetail?: string;
  /** The Razorpay order the payment was made against (test mode). */
  gatewayOrderId?: string;
  paymentStatus: 'Paid' | 'Pending' | 'Failed';
  orderStatus: OrderStatus;
  source: 'Website' | 'Admin';
  shipment?: Shipment;
  emails: { kind: 'Status update' | 'Invoice'; at: string }[];
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  registeredDate: string;
}

export interface HeroBanner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  mobileImageUrl: string;
  ctaText: string;
  ctaLink: string;
  isActive: boolean;
  textAlign: 'left' | 'center' | 'right';
  textColor: string;
}

export interface InstagramPost {
  id: string;
  postUrl: string;
  imageUrl: string;
  caption: string;
}

/** A storefront shopper who signed up. Demo only: the password is kept as plain text in this browser. */
export interface ShopperAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  createdAt: string;
}

export interface AdminAccount {
  email: string;
  password: string;
}

// =============================================================================
// Browser-Saved Stores
// =============================================================================

export interface Store<T> {
  get: () => T;
  serverValue: () => T;
  set: (next: T) => void;
  reset: () => void;
  subscribe: (listener: () => void) => () => void;
}

const DEMO_SEED_CONTACTS: Record<string, { name: string; email: string; phone: string; shippingAddress?: string }> = {
  'ord-106': { name: 'Demo Customer 01', email: 'demo.customer01@example.com', phone: '+91 00000 00001', shippingAddress: 'Demo House 01, Demo Layout' },
  'ord-105': { name: 'Demo Customer 02', email: 'demo.customer02@example.com', phone: '+91 00000 00002', shippingAddress: 'Demo House 02, Demo Layout' },
  'ord-101': { name: 'Demo Customer 03', email: 'demo.customer03@example.com', phone: '+91 00000 00003', shippingAddress: 'Demo House 03, Demo Layout' },
  'ord-102': { name: 'Demo Customer 04', email: 'demo.customer04@example.com', phone: '+91 00000 00004', shippingAddress: 'Demo House 04, Demo Layout' },
  'ord-103': { name: 'Demo Customer 05', email: 'demo.customer05@example.com', phone: '+91 00000 00005', shippingAddress: 'Demo House 05, Demo Layout' },
  'ord-104': { name: 'Demo Customer 06', email: 'demo.customer06@example.com', phone: '+91 00000 00006', shippingAddress: 'Demo House 06, Demo Layout' },
  'cus-7': { name: 'Demo Customer 01', email: 'demo.customer01@example.com', phone: '+91 00000 00001' },
  'cus-1': { name: 'Demo Customer 02', email: 'demo.customer02@example.com', phone: '+91 00000 00002' },
  'cus-2': { name: 'Demo Customer 03', email: 'demo.customer03@example.com', phone: '+91 00000 00003' },
  'cus-3': { name: 'Demo Customer 04', email: 'demo.customer04@example.com', phone: '+91 00000 00004' },
  'cus-4': { name: 'Demo Customer 05', email: 'demo.customer05@example.com', phone: '+91 00000 00005' },
  'cus-5': { name: 'Demo Customer 06', email: 'demo.customer06@example.com', phone: '+91 00000 00006' },
  'cus-6': { name: 'Demo Customer 07', email: 'demo.customer07@example.com', phone: '+91 00000 00007' },
  'acc-1': { name: 'Demo Shopper', email: 'demo.shopper@example.com', phone: '' },
};

function normalizeStoredDemoContacts(key: string, value: unknown): unknown {
  if (Array.isArray(value) && ['demo.v2.orders', 'demo.v2.customers', 'demo.v2.shoppers'].includes(key)) {
    return value.map((item) => {
      if (!item || typeof item !== 'object' || typeof item.id !== 'string') return item;
      const replacement = DEMO_SEED_CONTACTS[item.id];
      if (!replacement) return item;
      const { name, ...contact } = replacement;
      return key === 'demo.v2.orders' ? { ...item, ...contact, customerName: name } : { ...item, ...replacement };
    });
  }
  if (key === 'demo.v2.admin' && value && typeof value === 'object' && (value as { email?: string }).email === 'shop@admin.com') {
    return { ...(value as object), email: 'demo.admin@example.com' };
  }
  return value;
}

/** A value kept in localStorage (when `key` is set) that every component using it re-renders on. */
export function createStore<T>(key: string | null, initial: T, isValid: (value: unknown) => boolean = () => true): Store<T> {
  let value = initial;
  let loaded = false;
  const listeners = new Set<() => void>();

  const load = () => {
    if (loaded || !key || typeof window === 'undefined') return;
    loaded = true;
    try {
      const saved = JSON.parse(window.localStorage.getItem(key) ?? 'null');
      const normalized = saved === null ? saved : normalizeStoredDemoContacts(key, saved);
      if (normalized !== null && isValid(normalized)) {
        value = normalized;
        if (JSON.stringify(saved) !== JSON.stringify(normalized)) window.localStorage.setItem(key, JSON.stringify(normalized));
      }
    } catch {
      // Blocked or damaged storage just means starting from the sample data.
    }
  };

  const set = (next: T) => {
    load();
    value = next;
    try {
      if (key) window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Full or blocked storage: the change still applies until the page is closed.
    }
    listeners.forEach((listener) => listener());
  };

  return {
    get: () => {
      load();
      return value;
    },
    serverValue: () => initial,
    set,
    reset: () => set(initial),
    subscribe: (listener) => {
      listeners.add(listener);
      // Keeps the admin and the website in step when both are open in different tabs.
      const onStorage = (event: StorageEvent) => {
        if (event.key !== key) return;
        loaded = false;
        value = initial;
        load();
        listener();
      };
      window.addEventListener('storage', onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener('storage', onStorage);
      };
    },
  };
}

export function useStore<T>(store: Store<T>) {
  return useSyncExternalStore(store.subscribe, store.get, store.serverValue);
}

// =============================================================================
// Helpers
// =============================================================================

// The shop's own details, printed on invoices and shown in the storefront footer.
export const STORE_INFO = {
  name: 'Demo Jewellery',
  tagline: 'Hand-finished jewellery, made for every day and every occasion',
  email: 'demo.support@example.com',
  phone: '+91 00000 00000',
  address: '3rd Floor, 100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038',
  gstin: '29ABCDE1234F1Z5',
  returnPolicy: 'Unused jewellery in its original packaging can be returned within 7 days of delivery. Please keep each piece away from water, perfume and harsh chemicals.',
};

// The store's name, logo, contact details and footer text, edited in Admin → Store Details.
// STORE_INFO above is the default; components read the live copy with useStoreDetails().
export interface StoreDetails {
  name: string;
  tagline: string;
  footerAbout: string;
  footerNote: string;
  logoUrl: string;
  showNameWithLogo: boolean;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  hours: string;
  gstin: string;
  returnPolicy: string;
  social: { instagram: string; facebook: string; youtube: string; x: string };
}
export const DEFAULT_STORE_DETAILS: StoreDetails = {
  ...STORE_INFO,
  footerAbout: 'Thoughtfully selected necklaces, earrings, rings and bracelets, finished with care and made to be treasured.',
  footerNote: 'A demo store: products and prices are samples, and no real payments are processed.',
  logoUrl: '',
  showNameWithLogo: true,
  whatsapp: STORE_INFO.phone,
  hours: 'Mon–Sun, 9am–9pm',
  social: { instagram: 'https://instagram.com/demojewellery', facebook: '', youtube: '', x: '' },
};

export const FREE_DELIVERY_FROM = 4999;
export const DELIVERY_FEE = 149;

export const inr = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

/** Today as YYYY-MM-DD in the viewer's own time zone. */
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export const stockStatus = (stock: number): Product['status'] =>
  stock > 10 ? 'In Stock' : stock > 0 ? 'Low Stock' : 'Out of Stock';

/** Unsplash photos are resized to `width`; uploaded (data URL) and other photos are used as they are. */
export function photoUrl(src: string, width = 800) {
  if (!src.startsWith('https://images.unsplash.com/')) return src;
  const url = new URL(src);
  url.searchParams.set('w', String(width));
  return url.toString();
}

/** The chosen color's own photos when it has any, otherwise the product's main photos. */
export const productPhotos = (product: Product, color?: string) => {
  const own = color ? product.colorImages[color] ?? [] : [];
  return own.length ? own : product.images.length ? product.images : [product.image];
};

export const percentOff = (product: Product) =>
  product.mrp && product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

/** What a coupon is doing today: only 'Live' coupons can be used at checkout. */
export function couponState(coupon: Coupon, on = localDate()): 'Live' | 'Paused' | 'Scheduled' | 'Ended' | 'Used up' {
  if (coupon.status !== 'Active') return 'Paused';
  if (coupon.validFrom && on < coupon.validFrom) return 'Scheduled';
  if (coupon.validTill && on > coupon.validTill) return 'Ended';
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return 'Used up';
  return 'Live';
}

/** Why a code can't be used on this subtotal, or null when it can. */
export function couponProblem(code: string, subtotal: number, coupons: Coupon[]) {
  const coupon = coupons.find((c) => c.code === code.trim().toUpperCase());
  if (!coupon) return 'That code is not valid.';
  const state = couponState(coupon);
  if (state === 'Scheduled') return `${coupon.code} starts on ${coupon.validFrom}.`;
  if (state === 'Ended' || state === 'Paused') return `${coupon.code} has expired.`;
  if (state === 'Used up') return `${coupon.code} has been fully redeemed.`;
  if (subtotal < coupon.minPurchase) return `${coupon.code} needs a bag of at least ${inr(coupon.minPurchase)}.`;
  return null;
}

export function couponDiscount(coupon: Coupon, subtotal: number) {
  const raw = coupon.discountType === 'Percentage' ? Math.round((subtotal * coupon.discountValue) / 100) : coupon.discountValue;
  return Math.min(subtotal, coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw);
}

export function calculateTotals(subtotal: number, promo: string, coupons: Coupon[]) {
  const coupon = coupons.find((c) => c.code === promo);
  const discount = coupon && !couponProblem(coupon.code, subtotal, coupons) ? couponDiscount(coupon, subtotal) : 0;
  const afterDiscount = subtotal - discount;
  const delivery = subtotal === 0 || afterDiscount >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
  return { subtotal, discount, delivery, total: afterDiscount + delivery };
}

const randomId = (length: number) =>
  Array.from({ length }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'[Math.floor(Math.random() * 54)]).join('');

export const fakePaymentId = () => `pay_${randomId(14)}`;
export const fakeAwb = () => String(Math.floor(1e12 + Math.random() * 9e12));
/** A unique id such as `cus-mh3k2x9a`, for things created in the admin or the website. */
export const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}${randomId(3)}`;

function nextOrderNumber(orders: Order[]) {
  const highest = Math.max(98210, ...orders.map((o) => Number(o.orderNumber.replace(/\D/g, '')) || 0));
  return `ORD-${highest + 1}`;
}

/** Applies `delta` to each line's size and color stock (negative to sell, positive to restock). */
function adjustStock(products: Product[], lines: { productId: string; size: string; color: string; qty: number }[], delta: 1 | -1) {
  return products.map((product) => {
    const mine = lines.filter((line) => line.productId === product.id);
    if (!mine.length) return product;
    const variantStock: VariantStock = Object.fromEntries(Object.entries(product.variantStock).map(([size, byColor]) => [size, { ...byColor }]));
    for (const line of mine) {
      variantStock[line.size] ??= {};
      variantStock[line.size][line.color] = Math.max(0, (variantStock[line.size][line.color] ?? 0) + delta * line.qty);
    }
    const stock = Object.values(variantStock).reduce((sum, byColor) => sum + Object.values(byColor).reduce((s, q) => s + q, 0), 0);
    return { ...product, variantStock, stock, status: stockStatus(stock) };
  });
}

export interface WebsiteOrderInput {
  lines: { product: Product; size: string; color: string; qty: number }[];
  promo: string;
  payment: 'Razorpay' | 'Cash on Delivery';
  address: { name: string; phone: string; email: string; line: string; city: string; state: string; pin: string };
  /** The successful Razorpay (test mode) payment, for prepaid orders. */
  receipt?: PaymentReceipt;
}

export interface PaymentReceipt {
  paymentId: string;
  gatewayOrderId: string;
  detail: string;
}

/**
 * Places a storefront order the way a real checkout would: checks and takes the exact size and color
 * from stock, counts the coupon as used, adds or updates the customer, and files the order for the admin.
 */
export function placeWebsiteOrder({ lines, promo, payment, address, receipt }: WebsiteOrderInput): Order {
  if (payment !== 'Cash on Delivery' && !receipt) throw new Error('Payment has not been verified by Razorpay.');
  const products = productsStore.get();
  for (const line of lines) {
    const current = products.find((p) => p.id === line.product.id);
    if (!current) throw new Error(`${line.product.name} is no longer available.`);
    if (stockForVariant(current, line.size, line.color) < line.qty) {
      throw new Error(`Only ${stockForVariant(current, line.size, line.color)} of ${current.name} (${[line.size, line.color].filter((v) => v !== STANDARD).join(', ') || 'this option'}) left.`);
    }
  }

  const coupons = couponsStore.get();
  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.qty, 0);
  const totals = calculateTotals(subtotal, promo, coupons);
  const now = new Date();
  const orders = ordersStore.get();
  const email = address.email.trim().toLowerCase();
  const order: Order = {
    id: `web-${now.getTime().toString(36)}`,
    orderNumber: nextOrderNumber(orders),
    customerName: address.name.trim(),
    email,
    phone: address.phone.trim(),
    shippingAddress: address.line.trim(),
    city: address.city.trim(),
    state: address.state.trim(),
    postalCode: address.pin.trim(),
    date: localDate(now),
    placedAt: now.toISOString(),
    ...totals,
    promo: totals.discount ? promo : '',
    itemsCount: lines.reduce((sum, line) => sum + line.qty, 0),
    items: lines.map(({ product, size, color, qty }) => ({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      size,
      color,
      qty,
      price: product.price,
      image: productPhotos(product, color)[0],
    })),
    paymentMethod: payment,
    paymentId: payment === 'Cash on Delivery' ? undefined : receipt?.paymentId,
    paymentDetail: receipt?.detail,
    gatewayOrderId: receipt?.gatewayOrderId,
    paymentStatus: payment === 'Cash on Delivery' ? 'Pending' : 'Paid',
    orderStatus: 'Pending',
    source: 'Website',
    emails: [{ kind: 'Invoice', at: now.toISOString() }],
  };

  productsStore.set(adjustStock(products, order.items, -1));
  if (order.promo) couponsStore.set(coupons.map((c) => (c.code === order.promo ? { ...c, usageCount: c.usageCount + 1 } : c)));
  const customers = customersStore.get();
  const known = customers.find((c) => c.email.toLowerCase() === email);
  customersStore.set(
    known
      ? customers.map((c) => (c.id === known.id ? { ...c, name: order.customerName, phone: order.phone || c.phone } : c))
      : [{ id: `cus-${now.getTime()}`, name: order.customerName, email, phone: order.phone, registeredDate: order.date }, ...customers]
  );
  ordersStore.set([order, ...orders]);
  return order;
}

/** Creates a shopper account and registers them as a customer the admin can see. Throws if the email is taken. */
export function registerShopper(input: { name: string; email: string; phone: string; password: string }): ShopperAccount {
  const email = input.email.trim().toLowerCase();
  const accounts = shopperAccountsStore.get();
  if (accounts.some((a) => a.email === email)) throw new Error('An account with this email already exists. Sign in instead.');
  const now = new Date();
  const account: ShopperAccount = { id: uid('acc'), name: input.name.trim(), email, phone: input.phone.trim(), password: input.password, createdAt: now.toISOString() };
  shopperAccountsStore.set([account, ...accounts]);
  const customers = customersStore.get();
  const known = customers.find((c) => c.email.toLowerCase() === email);
  customersStore.set(
    known
      ? customers.map((c) => (c.id === known.id ? { ...c, name: account.name, phone: account.phone || c.phone } : c))
      : [{ id: uid('cus'), name: account.name, email, phone: account.phone, registeredDate: localDate(now) }, ...customers]
  );
  return account;
}

export function verifyShopper(email: string, password: string) {
  return shopperAccountsStore.get().find((a) => a.email === email.trim().toLowerCase() && a.password === password) ?? null;
}

/** Puts a cancelled order's items back on the shelf. */
export function restockOrder(order: Order) {
  productsStore.set(adjustStock(productsStore.get(), order.items, 1));
}

export type StockLine = { productId: string; size: string; color: string; qty: number };

/**
 * Takes an in-store (POS) sale off the shelf, from whichever sizes and colors still have stock,
 * so the website shows the same numbers. Throws without changing anything if there isn't enough.
 */
export function sellInStore(items: { productId: string; qty: number }[]): StockLine[] {
  const products = productsStore.get();
  const lines: StockLine[] = [];
  for (const { productId, qty } of items) {
    const product = products.find((p) => p.id === productId);
    if (!product) throw new Error('A product in this bill no longer exists.');
    let left = qty;
    for (const [size, byColor] of Object.entries(product.variantStock)) {
      for (const [color, have] of Object.entries(byColor)) {
        const take = Math.min(left, have);
        if (take > 0) {
          lines.push({ productId, size, color, qty: take });
          left -= take;
        }
      }
    }
    if (left > 0) throw new Error(`Only ${qty - left} of ${product.name} left in stock.`);
  }
  productsStore.set(adjustStock(products, lines, -1));
  return lines;
}

/** Puts returned items back on the shelf (POS returns and exchanges). */
export function returnToStock(lines: StockLine[]) {
  productsStore.set(adjustStock(productsStore.get(), lines, 1));
}

// =============================================================================
// Sample Data
// =============================================================================

const U = (id: string, width = 800) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=${width}`;
const UM = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=85&w=900&h=1200`;

/** A few hero product shots, used for decorative collages on the storefront. */
export const PHOTO_URLS = [U(PHOTOS.layeredNecklaces, 600), U(PHOTOS.roseGoldDrops, 600), U(PHOTOS.solitaire, 600)];

const SEED_SIZES: SizeOption[] = [
  { id: 'sz-1', name: 'Ring Size 6', code: '6' },
  { id: 'sz-2', name: 'Ring Size 7', code: '7' },
  { id: 'sz-3', name: 'Ring Size 8', code: '8' },
  { id: 'sz-4', name: 'Bangle Size 2.4', code: '2.4' },
  { id: 'sz-5', name: 'Bangle Size 2.6', code: '2.6' },
  { id: 'sz-6', name: 'Bangle Size 2.8', code: '2.8' },
];

const SEED_COLORS: ColorOption[] = [
  { id: 'col-1', name: 'Yellow Gold', hex: '#C9A44C' },
  { id: 'col-2', name: 'Rose Gold', hex: '#B76E79' },
  { id: 'col-3', name: 'Silver', hex: '#C7C7CC' },
  { id: 'col-4', name: 'Antique Gold', hex: '#927443' },
  { id: 'col-5', name: 'White Gold', hex: '#E6E4DF' },
  { id: 'col-6', name: 'Pearl', hex: '#F3EBDD' },
  { id: 'col-7', name: 'Emerald', hex: '#28745B' },
  { id: 'col-8', name: 'Ruby', hex: '#9B263B' },
];

const SEED_TAGS: TagOption[] = [
  { id: 'tag-1', name: 'Bestseller' },
  { id: 'tag-2', name: 'New Launch' },
  { id: 'tag-3', name: 'Premium' },
  { id: 'tag-4', name: 'Handcrafted' },
  { id: 'tag-5', name: 'Gifting' },
  { id: 'tag-6', name: 'Bridal' },
];

const SEED_CATEGORIES: CategoryItem[] = [
  { id: 'c-1', name: 'Necklaces', slug: 'necklaces', icon: '📿', image: U(PHOTOS.layeredNecklaces), blurb: 'Delicate chains, statement pendants and heirloom-inspired designs', status: 'Active' },
  { id: 'c-2', name: 'Earrings', slug: 'earrings', icon: '✨', image: U(PHOTOS.goldHoops), blurb: 'Everyday studs, graceful drops and festive jhumkas', status: 'Active' },
  { id: 'c-4', name: 'Rings', slug: 'rings', icon: '💍', image: U(PHOTOS.stackedRings), blurb: 'Solitaire, halo and keepsake rings in considered sizes', status: 'Active' },
  { id: 'c-5', name: 'Bracelets & Bangles', slug: 'bracelets', icon: '◉', image: U(PHOTOS.handsStacked), blurb: 'Polished cuffs, delicate links and traditional bangles', status: 'Active' },
  { id: 'c-6', name: 'Bridal & Occasion', slug: 'bridal', icon: '✿', image: U(PHOTOS.templeNecklace), blurb: 'Jewellery for celebrations, ceremonies and gifting', status: 'Active' },
];

const SEED_SUB_CATEGORIES: SubCategoryItem[] = [
  ['Chains & Pendants', 'Necklaces'], ['Statement Necklaces', 'Necklaces'],
  ['Stud Earrings', 'Earrings'], ['Drops & Jhumkas', 'Earrings'],
  ['Solitaire Rings', 'Rings'], ['Statement Rings', 'Rings'],
  ['Bracelets', 'Bracelets & Bangles'], ['Bangles', 'Bracelets & Bangles'],
  ['Bridal Sets', 'Bridal & Occasion'], ['Festive Jewellery', 'Bridal & Occasion'],
].map(([name, parentCategory], i) => ({ id: `sc-${i + 1}`, name, parentCategory, status: 'Active' as const }));

const SEED_SUB_SUB_CATEGORIES: SubSubCategoryItem[] = [
  { id: 'ssc-1', name: 'Temple & Heritage', parentSubCategory: 'Statement Necklaces', parentCategory: 'Necklaces', status: 'Active' },
  { id: 'ssc-2', name: 'Pearl & Kundan', parentSubCategory: 'Stud Earrings', parentCategory: 'Earrings', status: 'Active' },
  { id: 'ssc-3', name: 'Halo & Solitaire', parentSubCategory: 'Solitaire Rings', parentCategory: 'Rings', status: 'Active' },
  { id: 'ssc-4', name: 'Traditional Sets', parentSubCategory: 'Bridal Sets', parentCategory: 'Bridal & Occasion', status: 'Active' },
];

// Sample jewellery products; the size and colour variants remain managed through the same admin controls.
const ADMIN_PRODUCTS: Product[] = [
  {
    id: 'wireless-nc-headphones-pro', name: 'Mehr Pearl Strand Necklace', description: 'A single strand of lustrous pearls finished with a slim gold clasp, made to be worn every day.', sku: 'MEH-NK-01', barcode: '8901234567890', category: 'Necklaces', subCategory: 'Chains & Pendants', price: 24999, mrp: 29999, stock: 45, status: 'In Stock', image: U(PHOTOS.pearlNecklace), images: [U(PHOTOS.pearlNecklace), U(PHOTOS.pearlPendant)], sizes: [], colors: ['Pearl', 'Yellow Gold'], variantStock: { [STANDARD]: { Pearl: 30, 'Yellow Gold': 15 } }, colorImages: {}, tags: ['Bestseller', 'Premium'], isNewArrival: false, isFeatured: true, rating: 4.8, reviews: 1284, highlights: ['Hand-knotted freshwater pearls', 'Lightweight for all-day wear', 'Slim gold box clasp', 'Presented in a keepsake box'], specs: [['Style', 'Pearl strand'], ['Pearl', 'Freshwater, 7–8 mm'], ['Length', '18 in'], ['Care', 'Wipe with a soft cloth']],
  },
  {
    id: 'ultra-slim-smartwatch-7', name: 'Nila Sapphire Drop Earrings', description: 'Deep blue sapphire-hued stones framed in sparkling halos, made for evenings and celebrations.', sku: 'MIR-ER-02', barcode: '8901234567891', category: 'Earrings', subCategory: 'Drops & Jhumkas', price: 9499, mrp: 12999, stock: 18, status: 'In Stock', image: U(PHOTOS.sapphireEarrings), images: [U(PHOTOS.sapphireEarrings)], sizes: [], colors: ['White Gold', 'Yellow Gold'], variantStock: { [STANDARD]: { 'White Gold': 10, 'Yellow Gold': 8 } }, colorImages: {}, tags: ['Bestseller', 'Gifting'], isNewArrival: true, isFeatured: true, rating: 4.7, reviews: 612, highlights: ['Sapphire-hued centre stones', 'Hypoallergenic posts', 'Secure push-back fastening', 'Gift-ready presentation'], specs: [['Style', 'Statement drop'], ['Stone', 'Lab-created sapphire'], ['Closure', 'Push back'], ['Pair', 'Sold as a pair']],
  },
  {
    id: 'ergonomic-mechanical-keyboard-rgb', name: 'Gulab Pink Stone Ring', description: 'A soft pink oval stone held in a fine gold setting on a comfortable polished band.', sku: 'GUL-RG-03', barcode: '8901234567892', category: 'Rings', subCategory: 'Statement Rings', price: 11999, mrp: 14999, stock: 12, status: 'In Stock', image: U(PHOTOS.pinkStoneRing), images: [U(PHOTOS.pinkStoneRing), U(PHOTOS.gemRings)], sizes: ['6', '7', '8'], colors: ['Yellow Gold', 'Rose Gold'], variantStock: { '6': { 'Yellow Gold': 2, 'Rose Gold': 2 }, '7': { 'Yellow Gold': 2, 'Rose Gold': 2 }, '8': { 'Yellow Gold': 2, 'Rose Gold': 2 } }, colorImages: {}, tags: ['Premium', 'Gifting'], isNewArrival: false, isFeatured: true, rating: 4.6, reviews: 402, highlights: ['Pink oval centre stone', 'Comfort-fit band', 'Available in sizes 6, 7 and 8', 'Polished keepsake box'], specs: [['Style', 'Cocktail ring'], ['Finish', 'Gold tone'], ['Stone', 'Pink quartz'], ['Care', 'Store separately']],
  },
  {
    id: 'minimalist-matte-leather-backpack', name: 'Ira Textured Gold Bangles', description: 'A polished pair of bangles with subtle engraved texture and a secure clasp.', sku: 'IRA-BG-04', barcode: '8901234567893', category: 'Bracelets & Bangles', subCategory: 'Bangles', price: 8999, mrp: 11999, stock: 0, status: 'Out of Stock', image: U(PHOTOS.bangles), images: [U(PHOTOS.bangles)], sizes: ['2.4', '2.6', '2.8'], colors: ['Yellow Gold'], variantStock: { '2.4': { 'Yellow Gold': 0 }, '2.6': { 'Yellow Gold': 0 }, '2.8': { 'Yellow Gold': 0 } }, colorImages: {}, tags: ['Gifting'], isNewArrival: false, isFeatured: false, rating: 4.5, reviews: 318, highlights: ['Matching pair', 'Textured polished finish', 'Traditional sizes', 'Keepsake pouch included'], specs: [['Style', 'Bangle pair'], ['Finish', 'Gold tone'], ['Sizes', '2.4, 2.6 and 2.8'], ['Closure', 'Hinged clasp']],
  },
];

const CATEGORY_NAMES: Record<string, string> = {
  necklaces: 'Necklaces',
  earrings: 'Earrings',
  rings: 'Rings',
  bracelets: 'Bracelets & Bangles',
  bridal: 'Bridal & Occasion',
};

// Jewellery variants use ring and bangle sizes plus wearable metal finishes.
const SEED_META: Record<string, { sku: string; sub: string; subSub?: string; sizes?: string[]; colors?: string[] }> = {
  'studio-one-headphones': { sku: 'HER-NK-05', sub: 'Statement Necklaces', colors: ['Yellow Gold', 'Rose Gold'] },
  'pulse-buds-pro': { sku: 'MIR-ER-06', sub: 'Drops & Jhumkas', colors: ['Rose Gold', 'Yellow Gold'] },
  'wave-capsule-speaker': { sku: 'ZIY-BR-07', sub: 'Bridal Sets', subSub: 'Traditional Sets', colors: ['Yellow Gold', 'Antique Gold'] },
  'resonance-bookshelf-pair': { sku: 'SAA-BR-08', sub: 'Bracelets', colors: ['Yellow Gold', 'Rose Gold'] },
  'orbit-smartwatch': { sku: 'AUR-RG-09', sub: 'Solitaire Rings', subSub: 'Halo & Solitaire', sizes: ['6', '7', '8'], colors: ['Yellow Gold', 'Rose Gold'] },
  'vital-active-watch': { sku: 'MEH-ER-10', sub: 'Stud Earrings', colors: ['Yellow Gold', 'Rose Gold'] },
  'nova-classic-watch': { sku: 'TAR-NK-11', sub: 'Chains & Pendants', colors: ['Silver', 'White Gold'] },
  'phantom-gaming-mouse': { sku: 'KAV-ER-12', sub: 'Stud Earrings', subSub: 'Pearl & Kundan', colors: ['Yellow Gold', 'Pearl'] },
  'vista-27-monitor': { sku: 'RUH-NK-13', sub: 'Chains & Pendants', colors: ['Rose Gold'] },
  'volt-gan-charger': { sku: 'LEE-BR-14', sub: 'Bracelets', colors: ['White Gold'] },
  'alpha-m-camera': { sku: 'NOO-RG-15', sub: 'Solitaire Rings', subSub: 'Halo & Solitaire', sizes: ['6', '7', '8'], colors: ['White Gold'] },
  'retro-compact-camera': { sku: 'ANI-BR-16', sub: 'Bracelets', colors: ['Yellow Gold', 'Rose Gold'] },
};

const STORE_PRODUCTS: Product[] = SEED_PRODUCTS.filter((seed) => SEED_META[seed.id]).map((seed, index) => {
  const meta = SEED_META[seed.id];
  const sizes = meta.sizes ?? [];
  const colors = meta.colors ?? [];
  const tags = [
    ...(seed.badge === 'Bestseller' ? ['Bestseller'] : []),
    ...(seed.badge === 'New' ? ['New Launch'] : []),
    ...(seed.price >= 50000 ? ['Premium'] : []),
    ...(seed.price <= 7000 ? ['Gifting'] : []),
  ];
  return {
    id: seed.id,
    name: seed.name,
    description: seed.tagline,
    sku: meta.sku,
    barcode: `890${String(4100000000 + index * 7919).padStart(10, '0')}`,
    category: CATEGORY_NAMES[seed.category],
    subCategory: meta.sub,
    subSubCategory: meta.subSub,
    price: seed.price,
    mrp: seed.mrp,
    stock: seed.stock,
    status: stockStatus(seed.stock),
    image: U(seed.photo),
    images: [seed.photo, ...(seed.gallery ?? [])].map((id) => U(id)),
    sizes,
    colors,
    variantStock: splitStock(seed.stock, sizes, colors),
    colorImages: {},
    tags,
    isNewArrival: seed.badge === 'New',
    isFeatured: seed.badge === 'Bestseller',
    rating: seed.rating,
    reviews: seed.reviews,
    highlights: seed.highlights,
    specs: seed.specs,
  };
});

const SEED_PRODUCTS_ALL: Product[] = [...ADMIN_PRODUCTS, ...STORE_PRODUCTS];

const line = (product: Product, size: string, color: string, qty = 1): OrderLine => ({
  productId: product.id,
  name: product.name,
  sku: product.sku,
  size,
  color,
  qty,
  price: product.price,
  image: productPhotos(product, color)[0],
});

const [HEADPHONES, SMARTWATCH, KEYBOARD, BACKPACK] = ADMIN_PRODUCTS;
const BUDS = STORE_PRODUCTS.find((p) => p.id === 'pulse-buds-pro')!;

const order = (o: Omit<Order, 'subtotal' | 'discount' | 'delivery' | 'promo' | 'total' | 'itemsCount' | 'placedAt' | 'emails'> & { time: string }): Order => {
  const subtotal = o.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const { time, ...rest } = o;
  return {
    ...rest,
    placedAt: `${o.date}T${time}:00+05:30`,
    subtotal,
    discount: 0,
    delivery: subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE,
    promo: '',
    total: subtotal + (subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE),
    itemsCount: o.items.reduce((sum, item) => sum + item.qty, 0),
    emails: [],
  };
};

const SEED_ORDERS: Order[] = [
  order({ id: 'ord-106', orderNumber: 'ORD-98216', customerName: 'Demo Customer 01', email: 'demo.customer01@example.com', phone: '+91 00000 00001', shippingAddress: 'Demo House 01, Demo Layout', city: 'Bengaluru', state: 'Karnataka', postalCode: '560066', date: '2026-11-03', time: '19:42', items: [line(BUDS, STANDARD, 'Rose Gold')], paymentMethod: 'Credit Card', paymentStatus: 'Pending', orderStatus: 'Pending', source: 'Website' }),
  order({ id: 'ord-105', orderNumber: 'ORD-98215', customerName: 'Demo Customer 02', email: 'demo.customer02@example.com', phone: '+91 00000 00002', shippingAddress: 'Demo House 02, Demo Layout', city: 'Bengaluru', state: 'Karnataka', postalCode: '560038', date: '2026-11-02', time: '11:05', items: [line(KEYBOARD, '7', 'Yellow Gold')], paymentMethod: 'UPI', paymentId: 'pay_QX81mK2vLr7T', paymentStatus: 'Paid', orderStatus: 'Pending', source: 'Website' }),
  order({ id: 'ord-101', orderNumber: 'ORD-98214', customerName: 'Demo Customer 03', email: 'demo.customer03@example.com', phone: '+91 00000 00003', shippingAddress: 'Demo House 03, Demo Layout', city: 'Mumbai', state: 'Maharashtra', postalCode: '400050', date: '2026-11-01', time: '16:20', items: [line(HEADPHONES, STANDARD, 'Pearl')], paymentMethod: 'UPI', paymentId: 'pay_QX7a9Hc3Np2D', paymentStatus: 'Paid', orderStatus: 'Processing', source: 'Website' }),
  order({ id: 'ord-102', orderNumber: 'ORD-98213', customerName: 'Demo Customer 04', email: 'demo.customer04@example.com', phone: '+91 00000 00004', shippingAddress: 'Demo House 04, Demo Layout', city: 'Chennai', state: 'Tamil Nadu', postalCode: '600017', date: '2026-10-31', time: '10:12', items: [line(HEADPHONES, STANDARD, 'Pearl'), line(KEYBOARD, '8', 'Rose Gold')], paymentMethod: 'Credit Card', paymentId: 'pay_QX5tY4bWm8Kc', paymentStatus: 'Paid', orderStatus: 'Shipped', source: 'Website', shipment: { courier: 'Delhivery', awb: '1490223655213', pickup: 'Bengaluru Warehouse', weightKg: 1.4, dimensions: '30 × 25 × 12 cm', status: 'In Transit', createdAt: '2026-11-01T09:30:00+05:30', srOrderId: 734120558, srShipmentId: 731998204, remoteStatus: 'IN TRANSIT', deliveryState: 'Tamil Nadu' } }),
  order({ id: 'ord-103', orderNumber: 'ORD-98212', customerName: 'Demo Customer 05', email: 'demo.customer05@example.com', phone: '+91 00000 00005', shippingAddress: 'Demo House 05, Demo Layout', city: 'Pune', state: 'Maharashtra', postalCode: '411005', date: '2026-10-30', time: '13:48', items: [line(BACKPACK, '2.6', 'Yellow Gold')], paymentMethod: 'Cash on Delivery', paymentStatus: 'Pending', orderStatus: 'Processing', source: 'Website' }),
  order({ id: 'ord-104', orderNumber: 'ORD-98211', customerName: 'Demo Customer 06', email: 'demo.customer06@example.com', phone: '+91 00000 00006', shippingAddress: 'Demo House 06, Demo Layout', city: 'Kolkata', state: 'West Bengal', postalCode: '700045', date: '2026-10-28', time: '18:30', items: [line(SMARTWATCH, STANDARD, 'White Gold')], paymentMethod: 'Net Banking', paymentId: 'pay_QX2pR6dZs1Ve', paymentStatus: 'Paid', orderStatus: 'Delivered', source: 'Website', shipment: { courier: 'Blue Dart', awb: '7730091846521', pickup: 'Bengaluru Warehouse', weightKg: 0.6, dimensions: '18 × 12 × 9 cm', status: 'Delivered', createdAt: '2026-10-29T10:00:00+05:30', srOrderId: 733870412, srShipmentId: 731745690, remoteStatus: 'DELIVERED', deliveryState: 'West Bengal' } }),
];

const SEED_CUSTOMERS: Customer[] = [
  { id: 'cus-7', name: 'Demo Customer 01', email: 'demo.customer01@example.com', phone: '+91 00000 00001', registeredDate: '2026-11-03' },
  { id: 'cus-1', name: 'Demo Customer 02', email: 'demo.customer02@example.com', phone: '+91 00000 00002', registeredDate: '2026-10-20' },
  { id: 'cus-2', name: 'Demo Customer 03', email: 'demo.customer03@example.com', phone: '+91 00000 00003', registeredDate: '2026-09-14' },
  { id: 'cus-3', name: 'Demo Customer 04', email: 'demo.customer04@example.com', phone: '+91 00000 00004', registeredDate: '2026-08-02' },
  { id: 'cus-4', name: 'Demo Customer 05', email: 'demo.customer05@example.com', phone: '+91 00000 00005', registeredDate: '2026-10-11' },
  { id: 'cus-5', name: 'Demo Customer 06', email: 'demo.customer06@example.com', phone: '+91 00000 00006', registeredDate: '2026-07-23' },
  { id: 'cus-6', name: 'Demo Customer 07', email: 'demo.customer07@example.com', phone: '', registeredDate: '2026-10-25' },
];

const SEED_COUPONS: Coupon[] = [
  { id: 'cp-1', code: 'MEGAFEST20', description: 'Festive Jewellery Edit — 20% off selected pieces', discountType: 'Percentage', discountValue: 20, maxDiscount: 3000, minPurchase: 1999, usageLimit: 500, validFrom: '2026-10-01', validTill: '2026-12-31', usageCount: 142, showInHeader: true, status: 'Active' },
  { id: 'cp-2', code: 'WELCOME500', description: 'Flat ₹500 off on your first order', discountType: 'Fixed', discountValue: 500, minPurchase: 2500, validFrom: '2026-01-01', validTill: '2027-03-31', usageCount: 389, showInHeader: true, status: 'Active' },
  { id: 'cp-3', code: 'EARLYBIRD', description: 'Early bird offer on new launches', discountType: 'Percentage', discountValue: 15, maxDiscount: 1500, minPurchase: 999, usageLimit: 100, validFrom: '2026-07-15', validTill: '2026-08-15', usageCount: 65, showInHeader: false, status: 'Expired' },
];

const SEED_BANNERS: HeroBanner[] = [
  { id: 'bn-1', title: 'Made to be treasured.', subtitle: 'Hand-finished gold jewellery for every day and every occasion.', imageUrl: U(PHOTOS.necklaceModel, 1800), mobileImageUrl: UM(PHOTOS.necklaceModel), ctaText: 'Explore Necklaces', ctaLink: '#/shop?cat=necklaces', isActive: true, textAlign: 'left', textColor: '#ffffff' },
  { id: 'bn-2', title: 'A little light, always.', subtitle: 'Sculpted hoops and handcrafted earrings with thoughtful detail.', imageUrl: U(PHOTOS.twistedHoops, 1800), mobileImageUrl: UM(PHOTOS.twistedHoops), ctaText: 'Shop Earrings', ctaLink: '#/shop?cat=earrings', isActive: true, textAlign: 'center', textColor: '#ffffff' },
  { id: 'bn-3', title: 'Mark the moment.', subtitle: 'Rings and keepsakes designed for the stories you carry.', imageUrl: U(PHOTOS.weddingBands, 1800), mobileImageUrl: UM(PHOTOS.weddingBands), ctaText: 'Discover Rings', ctaLink: '#/shop?cat=rings', isActive: true, textAlign: 'right', textColor: '#ffffff' },
  { id: 'bn-4', title: 'For every celebration.', subtitle: 'Heirloom-inspired pieces for your most memorable days.', imageUrl: U(PHOTOS.templeNecklace, 1800), mobileImageUrl: UM(PHOTOS.templeNecklace), ctaText: 'Explore Bridal', ctaLink: '#/shop?cat=bridal', isActive: false, textAlign: 'left', textColor: '#ffffff' },
];

const SEED_INSTAGRAM: InstagramPost[] = [
  { id: 'ig-1', postUrl: 'https://instagram.com/demojewellery', imageUrl: U(PHOTOS.necklaceEditorial, 600), caption: 'A little heritage, made for today. #DemoJewellery' },
  { id: 'ig-2', postUrl: 'https://instagram.com/demojewellery', imageUrl: U(PHOTOS.hoopsBox, 600), caption: 'Gold hoops for all your lovely little moments. #Jewellery' },
  { id: 'ig-3', postUrl: 'https://instagram.com/demojewellery', imageUrl: U(PHOTOS.ringTray, 600), caption: 'A keepsake made to last. #Rings' },
  { id: 'ig-4', postUrl: 'https://instagram.com/demojewellery', imageUrl: U(PHOTOS.sapphireBands, 600), caption: 'Something blue, forever. #Bridal' },
  { id: 'ig-5', postUrl: 'https://instagram.com/demojewellery', imageUrl: U(PHOTOS.hoopsStone, 600), caption: 'Everyday gold, styled simply. #Earrings' },
  { id: 'ig-6', postUrl: 'https://instagram.com/demojewellery', imageUrl: U(PHOTOS.gemRings, 600), caption: 'Colour that catches the light. #Rings' },
];

// =============================================================================
// Shared Stores
// =============================================================================

// Keep account and payment settings stable while the jewellery demo catalog starts fresh.
const KEY = (name: string) => `demo.v2.${name}`;
const SAMPLE_KEY = (name: string) => `demo.v3.${name}`;
// The catalog moved to v4 when every piece got its own photos, so earlier saved samples are replaced.
const CATALOG_KEY = (name: string) => `demo.v4.${name}`;

export const productsStore = createStore(CATALOG_KEY('products'), SEED_PRODUCTS_ALL, Array.isArray);
export const categoriesStore = createStore(CATALOG_KEY('categories'), SEED_CATEGORIES, Array.isArray);
export const subCategoriesStore = createStore(CATALOG_KEY('subCategories'), SEED_SUB_CATEGORIES, Array.isArray);
export const subSubCategoriesStore = createStore(CATALOG_KEY('subSubCategories'), SEED_SUB_SUB_CATEGORIES, Array.isArray);
export const sizeOptionsStore = createStore(CATALOG_KEY('sizes'), SEED_SIZES, Array.isArray);
export const colorOptionsStore = createStore(CATALOG_KEY('colors'), SEED_COLORS, Array.isArray);
export const tagOptionsStore = createStore(CATALOG_KEY('tags'), SEED_TAGS, Array.isArray);
export const couponsStore = createStore(CATALOG_KEY('coupons'), SEED_COUPONS, Array.isArray);
export const ordersStore = createStore(CATALOG_KEY('orders'), SEED_ORDERS, Array.isArray);
export const customersStore = createStore(CATALOG_KEY('customers'), SEED_CUSTOMERS, Array.isArray);
export const bannersStore = createStore(CATALOG_KEY('banners'), SEED_BANNERS, Array.isArray);
export const instagramStore = createStore(CATALOG_KEY('instagram'), SEED_INSTAGRAM, Array.isArray);
// Product videos made in Admin → Videos and shown on the storefront (same storage key as before).
export interface EcommerceVideo {
  id: string;
  title: string;
  productName: string;
  duration: string;
  views: number;
  thumbnail: string;
  videoUrl: string;
  dateAdded: string;
}

/** A small, freely licensed clip that reliably plays; used for the sample videos. */
export const DEMO_VIDEO_URL = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
// The original sample link no longer serves video, so saved demo data falls back to the working clip.
const DEAD_SAMPLE_VIDEO = 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4';

export const videosStore = createStore<EcommerceVideo[]>('demo.admin.videos.v4', [
  {
    id: 'vid-1',
    title: 'Ziya Polki Choker: Craft & Detail',
    productName: 'Ziya Polki Choker Set',
    duration: '01:45',
    views: 12450,
    thumbnail: U(PHOTOS.templeNecklace, 400),
    videoUrl: DEMO_VIDEO_URL,
    dateAdded: '2026-08-20',
  },
  {
    id: 'vid-2',
    title: 'Rose Gold Care Guide',
    productName: 'Mira Rose Gold Drop Earrings',
    duration: '00:58',
    views: 8930,
    thumbnail: U(PHOTOS.roseGoldDrops, 400),
    videoUrl: DEMO_VIDEO_URL,
    dateAdded: '2026-08-18',
  },
  {
    id: 'vid-3',
    title: 'How We Set Every Solitaire',
    productName: 'Aurelia Solitaire Ring',
    duration: '02:15',
    views: 24100,
    thumbnail: U(PHOTOS.solitaire, 400),
    videoUrl: DEMO_VIDEO_URL,
    dateAdded: '2026-08-10',
  },
], Array.isArray);

/** The link to actually play: a YouTube embed, or the file URL (with the dead sample link swapped out). */
export function playableVideo(url: string): { kind: 'youtube' | 'file'; src: string } {
  const trimmed = url.trim();
  const youtube = trimmed.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
  if (youtube) return { kind: 'youtube', src: `https://www.youtube.com/embed/${youtube[1]}?autoplay=1&rel=0` };
  return { kind: 'file', src: !trimmed || trimmed === DEAD_SAMPLE_VIDEO ? DEMO_VIDEO_URL : trimmed };
}

/** Counts a play from the storefront, so Admin → Videos shows real view numbers. */
export function recordVideoView(id: string) {
  videosStore.set(videosStore.get().map((v) => (v.id === id ? { ...v, views: v.views + 1 } : v)));
}

export const shopperAccountsStore = createStore<ShopperAccount[]>(KEY('shoppers'), [
  { id: 'acc-1', name: 'Demo Shopper', email: 'demo.shopper@example.com', phone: '', password: 'demo1234', createdAt: '2026-10-20T10:00:00+05:30' },
], Array.isArray);
export const adminAccountStore = createStore<AdminAccount>(
  KEY('admin'),
  { email: 'demo.admin@example.com', password: 'shop123' },
  (v) => typeof v === 'object' && v !== null && typeof (v as AdminAccount).email === 'string' && typeof (v as AdminAccount).password === 'string'
);

// Razorpay in test mode: the keys and payment methods set in Admin Security, used by the store's checkout.
export interface PaymentGateway {
  keyId: string;
  merchantName: string;
  methods: { razorpay: boolean; cod: boolean };
  verifiedAt: string;
}
export const DEFAULT_PAYMENT_GATEWAY: PaymentGateway = {
  keyId: '',
  merchantName: 'Demo Jewellery',
  methods: { razorpay: true, cod: true },
  verifiedAt: '',
};
export const paymentGatewayStore = createStore<PaymentGateway>(
  KEY('paymentGateway.v3'),
  DEFAULT_PAYMENT_GATEWAY,
  (v) => typeof v === 'object' && v !== null && typeof (v as PaymentGateway).keyId === 'string' && typeof (v as PaymentGateway).methods === 'object'
);

// Storefront themes: the admin's Theme Setup picks one. A theme is a whole design (header, home page,
// product cards, type and shapes, see store/store-kit.tsx) plus the colours it is painted in.
export type ThemeLayout = 'signature' | 'marketplace' | 'lifestyle' | 'boutique' | 'volt' | 'aster' | 'atelier' | 'aurora';
export const THEME_LAYOUTS: ThemeLayout[] = ['signature', 'marketplace', 'lifestyle', 'boutique', 'volt', 'aster', 'atelier', 'aurora'];
export interface ThemeColors {
  accent: string; // buttons, links, prices
  accent2: string; // the lighter end of gradients
  accentDark: string; // hover states
  accentLight: string; // highlights on dark sections
  accentSoft: string; // tinted backgrounds
  accentLine: string; // tinted borders
  ink: string; // text and dark sections
  ink2: string; // dark section layers
  ink3: string; // dark section borders
  deep: string; // announcement bar, footer, overlays
  page: string; // page background
}
export interface StoreTheme {
  id: string;
  name: string;
  version: string;
  tagline: string;
  layout: ThemeLayout;
  colors: ThemeColors;
  custom?: boolean;
}
export const THEME_COLOR_KEYS: (keyof ThemeColors)[] = ['accent', 'accent2', 'accentDark', 'accentLight', 'accentSoft', 'accentLine', 'ink', 'ink2', 'ink3', 'deep', 'page'];

export const BUILT_IN_THEMES: StoreTheme[] = [
  {
    id: 'default', name: 'Default Theme', version: '3.0', layout: 'signature',
    tagline: 'A polished photo hero, bento collections and soft product cards',
    colors: { accent: '#A47A22', accent2: '#D9B865', accentDark: '#86631A', accentLight: '#E9D29A', accentSoft: '#F3EBDA', accentLine: '#E2D3B0', ink: '#0F2A24', ink2: '#16372F', ink3: '#24493F', deep: '#081A15', page: '#F6F2EA' },
  },
  {
    id: 'marketplace', name: 'Theme Marketplace', version: '3.1', layout: 'marketplace',
    tagline: 'Big search bar, category sidebar, flash deals and dense grids',
    colors: { accent: '#F2611D', accent2: '#FF8A3D', accentDark: '#D44E0E', accentLight: '#FFC29B', accentSoft: '#FFF1E8', accentLine: '#FFD8C2', ink: '#1B2230', ink2: '#252E3F', ink3: '#364257', deep: '#131925', page: '#F2F4F7' },
  },
  {
    id: 'lifestyle', name: 'Lifestyle Theme', version: '1.8', layout: 'lifestyle',
    tagline: 'Colourful collage hero, rounded tiles and playful cards',
    colors: { accent: '#7B5CFA', accent2: '#FF6FB5', accentDark: '#6243E0', accentLight: '#CDBEFF', accentSoft: '#F2EEFF', accentLine: '#DCD2FF', ink: '#221A3D', ink2: '#2E2450', ink3: '#41366A', deep: '#170F2E', page: '#FAF8FF' },
  },
  {
    id: 'boutique', name: 'Boutique Theme', version: '1.5', layout: 'boutique',
    tagline: 'Centred logo, serif headlines, sharp edges and a lookbook',
    colors: { accent: '#8C6A43', accent2: '#B8956A', accentDark: '#6F5233', accentLight: '#E2C9A6', accentSoft: '#F3ECE2', accentLine: '#E4D6C3', ink: '#1C1A17', ink2: '#272420', ink3: '#3A352F', deep: '#12110F', page: '#F8F5F0' },
  },
  {
    id: 'volt', name: 'Volt Theme', version: '1.2', layout: 'volt',
    tagline: 'Loud type, thick outlines, offset shadows and stickers',
    colors: { accent: '#FF4D00', accent2: '#FF7A2E', accentDark: '#D93F00', accentLight: '#D4FF3A', accentSoft: '#FFE9DC', accentLine: '#FFC9AD', ink: '#111111', ink2: '#1C1C1C', ink3: '#2E2E2E', deep: '#0A0A0A', page: '#F2EFE6' },
  },
  {
    id: 'aster', name: 'Aster Theme', version: '1.0', layout: 'aster',
    tagline: 'Quiet Nordic minimal: thin lines, light type, lots of air',
    colors: { accent: '#3F6B5A', accent2: '#6F9C89', accentDark: '#2F5446', accentLight: '#B5D3C6', accentSoft: '#EDF3F0', accentLine: '#D3E2DB', ink: '#1F2421', ink2: '#2A302C', ink3: '#3B433E', deep: '#151917', page: '#FAFAF8' },
  },
  {
    id: 'atelier', name: 'Atelier Theme', version: '2.0', layout: 'atelier',
    tagline: 'Midnight sapphire and champagne: a night-boutique home with art-deco patterns',
    colors: { accent: '#2B4A9B', accent2: '#5A79CF', accentDark: '#1D3577', accentLight: '#E3CC9C', accentSoft: '#EEF1F8', accentLine: '#D6DDEE', ink: '#0B1532', ink2: '#121E45', ink3: '#1C2C5E', deep: '#060B1F', page: '#F8F6F1' },
  },
  {
    id: 'aurora', name: 'Aurora Theme', version: '1.0', layout: 'aurora',
    tagline: 'Aurora-glow hero, floating navbar, bento grid and glass cards',
    colors: { accent: '#0EA5A4', accent2: '#6366F1', accentDark: '#0B8584', accentLight: '#7DE3E1', accentSoft: '#E6F8F8', accentLine: '#BDEDEC', ink: '#0B1220', ink2: '#141C30', ink3: '#232C45', deep: '#070B16', page: '#F6F8FC' },
  },
];

export const isThemeColors = (value: unknown): value is ThemeColors =>
  typeof value === 'object' && value !== null && THEME_COLOR_KEYS.every((key) => /^#[0-9A-Fa-f]{6}$/.test(String((value as Record<string, unknown>)[key])));

export const themeSettingsStore = createStore<{ activeId: string; custom: StoreTheme[] }>(
  SAMPLE_KEY('themes'),
  { activeId: 'default', custom: [] },
  (v) => typeof v === 'object' && v !== null && typeof (v as { activeId: unknown }).activeId === 'string' && Array.isArray((v as { custom: unknown }).custom)
);

export const allThemes = (settings: { custom: StoreTheme[] }) => [
  ...BUILT_IN_THEMES,
  // Themes uploaded before layouts existed use the default design.
  ...settings.custom.filter((theme) => isThemeColors(theme.colors)).map((theme) => ({ ...theme, layout: THEME_LAYOUTS.includes(theme.layout) ? theme.layout : 'signature' as ThemeLayout })),
];
export const activeTheme = (settings: { activeId: string; custom: StoreTheme[] }) =>
  allThemes(settings).find((theme) => theme.id === settings.activeId) ?? BUILT_IN_THEMES[0];

/** The CSS variables the storefront's classes read (bg-[var(--st-accent)] and friends). */
export const themeVars = (colors: ThemeColors) => ({
  '--st-accent': colors.accent, '--st-accent-2': colors.accent2, '--st-accent-dark': colors.accentDark,
  '--st-accent-light': colors.accentLight, '--st-accent-soft': colors.accentSoft, '--st-accent-line': colors.accentLine,
  '--st-ink': colors.ink, '--st-ink-2': colors.ink2, '--st-ink-3': colors.ink3, '--st-deep': colors.deep, '--st-page': colors.page,
}) as CSSProperties;

export const storeDetailsStore = createStore<StoreDetails>(
  SAMPLE_KEY('storeDetails'),
  DEFAULT_STORE_DETAILS,
  (v) => typeof v === 'object' && v !== null && typeof (v as StoreDetails).name === 'string'
);

/** The live store details, with defaults for anything saved before a field existed. */
export function useStoreDetails(): StoreDetails {
  const saved = useStore(storeDetailsStore);
  const social = { ...DEFAULT_STORE_DETAILS.social, ...saved.social };
  // Keep existing demo browser data on the neutral demo identity too.
  return {
    ...DEFAULT_STORE_DETAILS,
    ...saved,
    name: saved.name === 'Aaranya Jewels' ? DEFAULT_STORE_DETAILS.name : saved.name,
    social: {
      ...social,
      instagram: social.instagram === 'https://instagram.com/aaranyajewels' ? DEFAULT_STORE_DETAILS.social.instagram : social.instagram,
    },
  };
}

const SHARED_STORES = [
  productsStore, categoriesStore, subCategoriesStore, subSubCategoriesStore, sizeOptionsStore, colorOptionsStore,
  tagOptionsStore, couponsStore, ordersStore, customersStore, bannersStore, instagramStore, adminAccountStore, shopperAccountsStore, videosStore, paymentGatewayStore,
  themeSettingsStore, storeDetailsStore,
];

/** Puts every shared list back to the sample data, for both the admin and the website. */
export function resetDemoData() {
  SHARED_STORES.forEach((store) => (store as Store<unknown>).reset());
}
