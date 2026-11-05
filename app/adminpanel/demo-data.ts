import { useSyncExternalStore } from 'react';
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
  paymentMethod: 'Credit Card' | 'UPI' | 'Net Banking' | 'Cash on Delivery';
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
      if (saved !== null && isValid(saved)) value = saved;
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
  name: 'Demo Website',
  tagline: 'Considered electronics, delivered across India',
  email: 'care@demowebsite.in',
  phone: '+91 80 4567 8900',
  address: '3rd Floor, 100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038',
  gstin: '29ABCDE1234F1Z5',
  returnPolicy: 'Unused items in their original box can be returned within 7 days of delivery. Every gadget carries a one-year warranty against manufacturing defects.',
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
  payment: 'UPI' | 'Card' | 'Net Banking' | 'Cash on Delivery';
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
    paymentMethod: payment === 'Card' ? 'Credit Card' : payment,
    paymentId: payment === 'Cash on Delivery' ? undefined : receipt?.paymentId ?? fakePaymentId(),
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
const BACKPACK_PHOTO = '1553062407-98eeb64c6a62';

/** A few hero product shots, used for decorative collages on the storefront. */
export const PHOTO_URLS = [U(PHOTOS.headphonesStudio, 600), U(PHOTOS.watchBlack, 600), U(PHOTOS.cameraMirrorless, 600)];

const SEED_SIZES: SizeOption[] = [
  { id: 'sz-1', name: '41 mm Case', code: '41mm' },
  { id: 'sz-2', name: '45 mm Case', code: '45mm' },
  { id: 'sz-3', name: 'Full Size Layout', code: 'Full Size' },
  { id: 'sz-4', name: 'Tenkeyless Layout', code: 'TKL' },
  { id: 'sz-5', name: '15-inch Laptop', code: '15 inch' },
  { id: 'sz-6', name: '17-inch Laptop', code: '17 inch' },
];

const SEED_COLORS: ColorOption[] = [
  { id: 'col-1', name: 'Midnight Black', hex: '#1d1d1f' },
  { id: 'col-2', name: 'Silver Mist', hex: '#c7c7cc' },
  { id: 'col-3', name: 'Starlight', hex: '#efe4d2' },
  { id: 'col-4', name: 'Space Grey', hex: '#6e6e73' },
  { id: 'col-5', name: 'Arctic White', hex: '#f5f5f7' },
  { id: 'col-6', name: 'Tan Brown', hex: '#a0522d' },
  { id: 'col-7', name: 'Ocean Blue', hex: '#2563eb' },
  { id: 'col-8', name: 'Sunset Orange', hex: '#f97316' },
];

const SEED_TAGS: TagOption[] = [
  { id: 'tag-1', name: 'Bestseller' },
  { id: 'tag-2', name: 'New Launch' },
  { id: 'tag-3', name: 'Premium' },
  { id: 'tag-4', name: 'Work From Home' },
  { id: 'tag-5', name: 'Gifting' },
  { id: 'tag-6', name: 'Fitness' },
];

const SEED_CATEGORIES: CategoryItem[] = [
  { id: 'c-1', name: 'Audio', slug: 'audio', icon: '🎧', image: U(PHOTOS.headphonesStudio), blurb: 'Headphones, earbuds and speakers', status: 'Active' },
  { id: 'c-2', name: 'Wearables', slug: 'wearables', icon: '⌚', image: U(PHOTOS.watchBlack), blurb: 'Watches that keep up', status: 'Active' },
  { id: 'c-4', name: 'Computing', slug: 'computing', icon: '⌨️', image: U(PHOTOS.mouseDark), blurb: 'Keyboards, mice, displays and chargers', status: 'Active' },
  { id: 'c-5', name: 'Cameras & Drones', slug: 'cameras', icon: '📷', image: U(PHOTOS.droneRiver), blurb: 'From the ground and the air', status: 'Active' },
  { id: 'c-6', name: 'Gaming', slug: 'gaming', icon: '🎮', image: U(PHOTOS.controller), blurb: 'Consoles, pads and VR', status: 'Active' },
  { id: 'c-7', name: 'Smart Home', slug: 'smart-home', icon: '🏠', image: U(PHOTOS.smartSpeaker), blurb: 'A home that listens', status: 'Active' },
  { id: 'c-8', name: 'Bags & Accessories', slug: 'bags', icon: '🎒', image: U(BACKPACK_PHOTO), blurb: 'Carry your kit in style', status: 'Active' },
];

const SEED_SUB_CATEGORIES: SubCategoryItem[] = [
  ['Headphones', 'Audio'], ['Earbuds', 'Audio'], ['Speakers', 'Audio'],
  ['Smartwatches', 'Wearables'], ['Fitness Bands', 'Wearables'],
  ['Keyboards & Mice', 'Computing'], ['Monitors', 'Computing'], ['Chargers & Power', 'Computing'],
  ['Cameras', 'Cameras & Drones'], ['Drones', 'Cameras & Drones'],
  ['Consoles & Controllers', 'Gaming'], ['VR', 'Gaming'],
  ['Smart Speakers', 'Smart Home'], ['Security', 'Smart Home'],
  ['Backpacks', 'Bags & Accessories'],
].map(([name, parentCategory], i) => ({ id: `sc-${i + 1}`, name, parentCategory, status: 'Active' as const }));

const SEED_SUB_SUB_CATEGORIES: SubSubCategoryItem[] = [
  { id: 'ssc-1', name: 'Over-Ear Headphones', parentSubCategory: 'Headphones', parentCategory: 'Audio', status: 'Active' },
  { id: 'ssc-2', name: 'In-Ear TWS Earbuds', parentSubCategory: 'Earbuds', parentCategory: 'Audio', status: 'Active' },
  { id: 'ssc-3', name: 'Mechanical RGB Keyboards', parentSubCategory: 'Keyboards & Mice', parentCategory: 'Computing', status: 'Active' },
  { id: 'ssc-4', name: 'Waterproof Laptop Backpacks', parentSubCategory: 'Backpacks', parentCategory: 'Bags & Accessories', status: 'Active' },
];

// The admin's own four products, with their hand-set stock per size and color.
const ADMIN_PRODUCTS: Product[] = [
  {
    id: 'wireless-nc-headphones-pro',
    name: 'Wireless Noise-Cancelling Headphones Pro',
    description: 'Over-ear wireless headphones with adaptive noise cancelling, 40-hour battery life and plush memory-foam cushions.',
    sku: 'WNC-HP-01',
    barcode: '8901234567890',
    category: 'Audio',
    subCategory: 'Headphones',
    subSubCategory: 'Over-Ear Headphones',
    price: 14999,
    mrp: 19999,
    stock: 45,
    status: 'In Stock',
    image: U(PHOTOS.headphonesYellow),
    images: [U(PHOTOS.headphonesYellow), U(PHOTOS.headphonesStudio)],
    sizes: [],
    colors: ['Midnight Black', 'Silver Mist'],
    variantStock: { [STANDARD]: { 'Midnight Black': 30, 'Silver Mist': 15 } },
    colorImages: { 'Silver Mist': [U(PHOTOS.headphonesStudio)] },
    tags: ['Bestseller', 'Premium'],
    isNewArrival: false,
    isFeatured: true,
    rating: 4.8,
    reviews: 1284,
    highlights: ['Adaptive hybrid noise cancelling', '40 hours of playback, 10 minutes charge for 5 hours', 'Connects to two devices at once', 'Folds flat into a hard travel case'],
    specs: [['Driver', '40 mm dynamic'], ['Bluetooth', '5.3 multipoint'], ['Battery', '40 hours'], ['Weight', '254 g']],
  },
  {
    id: 'ultra-slim-smartwatch-7',
    name: 'Ultra Slim Smartwatch Series 7',
    description: 'Always-on AMOLED smartwatch with heart-rate, SpO2 and sleep tracking, 5 ATM water resistance and 7-day battery.',
    sku: 'SMRT-WT-07',
    barcode: '8909876543211',
    category: 'Wearables',
    subCategory: 'Smartwatches',
    price: 21999,
    mrp: 24999,
    stock: 8,
    status: 'Low Stock',
    image: U(PHOTOS.watchWhite),
    images: [U(PHOTOS.watchWhite)],
    sizes: ['41mm', '45mm'],
    colors: ['Midnight Black', 'Starlight'],
    variantStock: { '41mm': { 'Midnight Black': 3, Starlight: 2 }, '45mm': { 'Midnight Black': 3, Starlight: 0 } },
    colorImages: { 'Midnight Black': [U(PHOTOS.watchBlack)] },
    tags: ['New Launch', 'Fitness'],
    isNewArrival: true,
    isFeatured: true,
    rating: 4.6,
    reviews: 742,
    highlights: ['Always-on AMOLED display', 'Heart rate, SpO2 and sleep tracking', 'Swim-proof to 50 metres', 'Up to 7 days per charge'],
    specs: [['Display', '1.9" AMOLED'], ['Water resistance', '5 ATM'], ['Battery', 'Up to 7 days'], ['Sensors', 'HR, SpO2, GPS']],
  },
  {
    id: 'ergonomic-mechanical-keyboard',
    name: 'Ergonomic Mechanical Keyboard RGB',
    description: 'Hot-swappable mechanical keyboard with tactile switches, per-key RGB lighting and a detachable wrist rest.',
    sku: 'MEC-KB-99',
    barcode: '8904561237894',
    category: 'Computing',
    subCategory: 'Keyboards & Mice',
    subSubCategory: 'Mechanical RGB Keyboards',
    price: 7499,
    mrp: 8999,
    stock: 62,
    status: 'In Stock',
    image: U(PHOTOS.keyboard),
    images: [U(PHOTOS.keyboard)],
    sizes: ['Full Size', 'TKL'],
    colors: ['Space Grey', 'Arctic White'],
    variantStock: { 'Full Size': { 'Space Grey': 25, 'Arctic White': 12 }, TKL: { 'Space Grey': 15, 'Arctic White': 10 } },
    colorImages: {},
    tags: ['Work From Home', 'Bestseller'],
    isNewArrival: false,
    isFeatured: false,
    rating: 4.9,
    reviews: 2210,
    highlights: ['Hot-swappable tactile switches', 'Per-key RGB lighting', 'Detachable magnetic wrist rest', 'Works over USB-C or Bluetooth'],
    specs: [['Switches', 'Tactile, hot-swap'], ['Connection', 'USB-C, Bluetooth 5.1'], ['Battery', '200 hours'], ['Keycaps', 'Double-shot PBT']],
  },
  {
    id: 'minimalist-leather-backpack',
    name: 'Minimalist Matte Leather Backpack',
    description: 'Water-resistant matte leather backpack with a padded laptop sleeve, hidden anti-theft pocket and USB charging port.',
    sku: 'LTHR-BP-04',
    barcode: '8907894561230',
    category: 'Bags & Accessories',
    subCategory: 'Backpacks',
    subSubCategory: 'Waterproof Laptop Backpacks',
    price: 4999,
    mrp: 6499,
    stock: 0,
    status: 'Out of Stock',
    image: U(BACKPACK_PHOTO),
    images: [U(BACKPACK_PHOTO)],
    sizes: ['15 inch', '17 inch'],
    colors: ['Midnight Black', 'Tan Brown'],
    variantStock: { '15 inch': { 'Midnight Black': 0, 'Tan Brown': 0 }, '17 inch': { 'Midnight Black': 0, 'Tan Brown': 0 } },
    colorImages: {},
    tags: ['Gifting'],
    isNewArrival: false,
    isFeatured: false,
    rating: 4.5,
    reviews: 318,
    highlights: ['Water-resistant matte leather', 'Padded sleeve for laptops up to 17"', 'Hidden anti-theft back pocket', 'Built-in USB charging port'],
    specs: [['Material', 'Matte PU leather'], ['Capacity', '22 litres'], ['Laptop sleeve', 'Up to 17"'], ['Weight', '980 g']],
  },
];

const CATEGORY_NAMES: Record<string, string> = {
  audio: 'Audio',
  wearables: 'Wearables',
  computing: 'Computing',
  cameras: 'Cameras & Drones',
  gaming: 'Gaming',
  'smart-home': 'Smart Home',
};

// Where each storefront product sits in the admin, and the options it comes in. The store sells gadgets
// only, so the seed's phones, tablets and laptops are left out by not being listed here.
const SEED_META: Record<string, { sku: string; sub: string; subSub?: string; sizes?: string[]; colors?: string[] }> = {
  'studio-one-headphones': { sku: 'STU-HP-02', sub: 'Headphones', subSub: 'Over-Ear Headphones', colors: ['Midnight Black', 'Silver Mist'] },
  'pulse-buds-pro': { sku: 'PLS-EB-03', sub: 'Earbuds', subSub: 'In-Ear TWS Earbuds', colors: ['Midnight Black', 'Arctic White'] },
  'wave-capsule-speaker': { sku: 'WAV-SP-04', sub: 'Speakers', colors: ['Midnight Black', 'Ocean Blue', 'Sunset Orange'] },
  'resonance-bookshelf-pair': { sku: 'RES-SP-05', sub: 'Speakers', colors: ['Tan Brown', 'Midnight Black'] },
  'orbit-smartwatch': { sku: 'ORB-WT-06', sub: 'Smartwatches', sizes: ['41mm', '45mm'], colors: ['Midnight Black', 'Silver Mist'] },
  'vital-active-watch': { sku: 'VTL-WT-08', sub: 'Fitness Bands', sizes: ['41mm', '45mm'], colors: ['Ocean Blue', 'Sunset Orange'] },
  'phantom-gaming-mouse': { sku: 'PHM-MS-17', sub: 'Keyboards & Mice', colors: ['Midnight Black', 'Arctic White'] },
  'vista-27-monitor': { sku: 'VST-MN-18', sub: 'Monitors' },
  'volt-gan-charger': { sku: 'VLT-CH-19', sub: 'Chargers & Power', colors: ['Arctic White', 'Midnight Black'] },
  'alpha-m-camera': { sku: 'ALM-CM-20', sub: 'Cameras' },
  'retro-compact-camera': { sku: 'RTR-CM-21', sub: 'Cameras', colors: ['Silver Mist', 'Midnight Black'] },
  'instasnap-camera': { sku: 'INS-CM-22', sub: 'Cameras', colors: ['Ocean Blue', 'Arctic White', 'Sunset Orange'] },
  'skyhawk-drone': { sku: 'SKH-DR-23', sub: 'Drones' },
  'nimbus-mini-drone': { sku: 'NMB-DR-24', sub: 'Drones' },
  'arena-pad-controller': { sku: 'ARN-GC-25', sub: 'Consoles & Controllers', colors: ['Midnight Black', 'Arctic White'] },
  'arena-console': { sku: 'ARN-CS-26', sub: 'Consoles & Controllers' },
  'immerse-vr-headset': { sku: 'IMR-VR-27', sub: 'VR' },
  'hearth-smart-speaker': { sku: 'HRT-SS-28', sub: 'Smart Speakers', colors: ['Arctic White', 'Space Grey'] },
  'keyless-smart-lock': { sku: 'KYL-LK-29', sub: 'Security' },
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
    images: [U(seed.photo)],
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
  order({ id: 'ord-106', orderNumber: 'ORD-98216', customerName: 'Kavya Reddy', email: 'kavya.r@example.com', phone: '+91 99860 11223', shippingAddress: 'Flat 302, Prestige Lakeside, Whitefield', city: 'Bengaluru', state: 'Karnataka', postalCode: '560066', date: '2026-11-03', time: '19:42', items: [line(BUDS, STANDARD, 'Arctic White')], paymentMethod: 'Credit Card', paymentStatus: 'Pending', orderStatus: 'Pending', source: 'Website' }),
  order({ id: 'ord-105', orderNumber: 'ORD-98215', customerName: 'Meera Iyer', email: 'meera.iyer@example.com', phone: '+91 98450 12345', shippingAddress: '22, 3rd Cross, Indiranagar 1st Stage', city: 'Bengaluru', state: 'Karnataka', postalCode: '560038', date: '2026-11-02', time: '11:05', items: [line(KEYBOARD, 'Full Size', 'Space Grey')], paymentMethod: 'UPI', paymentId: 'pay_QX81mK2vLr7T', paymentStatus: 'Paid', orderStatus: 'Pending', source: 'Website' }),
  order({ id: 'ord-101', orderNumber: 'ORD-98214', customerName: 'Aarav Mehta', email: 'aarav.m@example.com', phone: '+91 99001 23456', shippingAddress: '14, Palm Grove Apartments, Bandra West', city: 'Mumbai', state: 'Maharashtra', postalCode: '400050', date: '2026-11-01', time: '16:20', items: [line(HEADPHONES, STANDARD, 'Midnight Black')], paymentMethod: 'UPI', paymentId: 'pay_QX7a9Hc3Np2D', paymentStatus: 'Paid', orderStatus: 'Processing', source: 'Website' }),
  order({ id: 'ord-102', orderNumber: 'ORD-98213', customerName: 'Priya Sundaram', email: 'priya.s@example.com', phone: '+91 94440 56789', shippingAddress: '8, Lakshmi Street, T. Nagar', city: 'Chennai', state: 'Tamil Nadu', postalCode: '600017', date: '2026-10-31', time: '10:12', items: [line(HEADPHONES, STANDARD, 'Silver Mist'), line(KEYBOARD, 'TKL', 'Arctic White')], paymentMethod: 'Credit Card', paymentId: 'pay_QX5tY4bWm8Kc', paymentStatus: 'Paid', orderStatus: 'Shipped', source: 'Website', shipment: { courier: 'Delhivery', awb: '1490223655213', pickup: 'Bengaluru Warehouse', weightKg: 1.4, dimensions: '30 × 25 × 12 cm', status: 'In Transit', createdAt: '2026-11-01T09:30:00+05:30', srOrderId: 734120558, srShipmentId: 731998204, remoteStatus: 'IN TRANSIT', deliveryState: 'Tamil Nadu' } }),
  order({ id: 'ord-103', orderNumber: 'ORD-98212', customerName: 'Vikram Joshi', email: 'v.joshi@example.com', phone: '+91 98220 34567', shippingAddress: '5B, Shivaji Nagar, FC Road', city: 'Pune', state: 'Maharashtra', postalCode: '411005', date: '2026-10-30', time: '13:48', items: [line(BACKPACK, '15 inch', 'Tan Brown')], paymentMethod: 'Cash on Delivery', paymentStatus: 'Pending', orderStatus: 'Processing', source: 'Website' }),
  order({ id: 'ord-104', orderNumber: 'ORD-98211', customerName: 'Ananya Roy', email: 'ananya.roy@example.com', phone: '+91 98300 45678', shippingAddress: '41, Lake Gardens, Southern Avenue', city: 'Kolkata', state: 'West Bengal', postalCode: '700045', date: '2026-10-28', time: '18:30', items: [line(SMARTWATCH, '45mm', 'Midnight Black')], paymentMethod: 'Net Banking', paymentId: 'pay_QX2pR6dZs1Ve', paymentStatus: 'Paid', orderStatus: 'Delivered', source: 'Website', shipment: { courier: 'Blue Dart', awb: '7730091846521', pickup: 'Bengaluru Warehouse', weightKg: 0.6, dimensions: '18 × 12 × 9 cm', status: 'Delivered', createdAt: '2026-10-29T10:00:00+05:30', srOrderId: 733870412, srShipmentId: 731745690, remoteStatus: 'DELIVERED', deliveryState: 'West Bengal' } }),
];

const SEED_CUSTOMERS: Customer[] = [
  { id: 'cus-7', name: 'Kavya Reddy', email: 'kavya.r@example.com', phone: '+91 99860 11223', registeredDate: '2026-11-03' },
  { id: 'cus-1', name: 'Meera Iyer', email: 'meera.iyer@example.com', phone: '+91 98450 12345', registeredDate: '2026-10-20' },
  { id: 'cus-2', name: 'Aarav Mehta', email: 'aarav.m@example.com', phone: '+91 99001 23456', registeredDate: '2026-09-14' },
  { id: 'cus-3', name: 'Priya Sundaram', email: 'priya.s@example.com', phone: '+91 94440 56789', registeredDate: '2026-08-02' },
  { id: 'cus-4', name: 'Vikram Joshi', email: 'v.joshi@example.com', phone: '+91 98220 34567', registeredDate: '2026-10-11' },
  { id: 'cus-5', name: 'Ananya Roy', email: 'ananya.roy@example.com', phone: '+91 98300 45678', registeredDate: '2026-07-23' },
  { id: 'cus-6', name: 'Rohan Kapoor', email: 'rohan.k@example.com', phone: '', registeredDate: '2026-10-25' },
];

const SEED_COUPONS: Coupon[] = [
  { id: 'cp-1', code: 'MEGAFEST20', description: 'Mega Festive Sale — 20% off on all gadgets', discountType: 'Percentage', discountValue: 20, maxDiscount: 3000, minPurchase: 1999, usageLimit: 500, validFrom: '2026-10-01', validTill: '2026-12-31', usageCount: 142, showInHeader: true, status: 'Active' },
  { id: 'cp-2', code: 'WELCOME500', description: 'Flat ₹500 off on your first order', discountType: 'Fixed', discountValue: 500, minPurchase: 2500, validFrom: '2026-01-01', validTill: '2027-03-31', usageCount: 389, showInHeader: true, status: 'Active' },
  { id: 'cp-3', code: 'EARLYBIRD', description: 'Early bird offer on new launches', discountType: 'Percentage', discountValue: 15, maxDiscount: 1500, minPurchase: 999, usageLimit: 100, validFrom: '2026-07-15', validTill: '2026-08-15', usageCount: 65, showInHeader: false, status: 'Expired' },
];

const SEED_BANNERS: HeroBanner[] = [
  { id: 'bn-1', title: 'Sound, refined.', subtitle: 'Adaptive noise cancelling and a 40-hour battery. Now from ₹14,999.', imageUrl: U(PHOTOS.headphonesStudio, 1800), mobileImageUrl: '', ctaText: 'Shop Audio', ctaLink: '#/shop?cat=audio', isActive: true, textAlign: 'left', textColor: '#ffffff' },
  { id: 'bn-2', title: 'Made for the desk.', subtitle: 'Mechanical keyboards in Full Size and TKL, built to last a decade.', imageUrl: U(PHOTOS.keyboard, 1800), mobileImageUrl: '', ctaText: 'Explore Computing', ctaLink: '#/shop?cat=computing', isActive: true, textAlign: 'center', textColor: '#ffffff' },
  { id: 'bn-3', title: 'Time, well kept.', subtitle: 'Smartwatches in 41mm and 45mm, with a week of battery.', imageUrl: U(PHOTOS.watchBlack, 1800), mobileImageUrl: '', ctaText: 'Shop Wearables', ctaLink: '#/shop?cat=wearables', isActive: true, textAlign: 'right', textColor: '#ffffff' },
  { id: 'bn-4', title: 'Above it all.', subtitle: '4K drones that fold into your palm.', imageUrl: U(PHOTOS.droneRiver, 1800), mobileImageUrl: '', ctaText: 'Shop Drones', ctaLink: '#/shop?cat=cameras', isActive: false, textAlign: 'left', textColor: '#ffffff' },
];

const SEED_INSTAGRAM: InstagramPost[] = [
  { id: 'ig-1', postUrl: 'https://instagram.com/p/demo-headphones', imageUrl: U(PHOTOS.headphonesYellow, 600), caption: 'Silence the noise, keep the music. #Headphones' },
  { id: 'ig-2', postUrl: 'https://instagram.com/p/demo-smartwatch', imageUrl: U(PHOTOS.watchColor, 600), caption: 'Your day, on your wrist. #Smartwatch' },
  { id: 'ig-3', postUrl: 'https://instagram.com/p/demo-keyboard', imageUrl: U(PHOTOS.keyboard, 600), caption: 'Desk setup goals ⌨️ #MechanicalKeyboard #WFH' },
  { id: 'ig-4', postUrl: 'https://instagram.com/p/demo-drone', imageUrl: U(PHOTOS.droneRiver, 600), caption: 'Sunday views from 120 metres up. #Drone' },
  { id: 'ig-5', postUrl: 'https://instagram.com/p/demo-instant', imageUrl: U(PHOTOS.cameraInstant, 600), caption: 'Print the moment. #InstantCamera' },
  { id: 'ig-6', postUrl: 'https://instagram.com/p/demo-gaming', imageUrl: U(PHOTOS.controller, 600), caption: 'Game night, sorted. 🎮 #Gaming' },
];

// =============================================================================
// Shared Stores
// =============================================================================

// Bump the version when the sample data changes shape, so browsers load the new samples.
const KEY = (name: string) => `demo.v2.${name}`;

export const productsStore = createStore(KEY('products'), SEED_PRODUCTS_ALL, Array.isArray);
export const categoriesStore = createStore(KEY('categories'), SEED_CATEGORIES, Array.isArray);
export const subCategoriesStore = createStore(KEY('subCategories'), SEED_SUB_CATEGORIES, Array.isArray);
export const subSubCategoriesStore = createStore(KEY('subSubCategories'), SEED_SUB_SUB_CATEGORIES, Array.isArray);
export const sizeOptionsStore = createStore(KEY('sizes'), SEED_SIZES, Array.isArray);
export const colorOptionsStore = createStore(KEY('colors'), SEED_COLORS, Array.isArray);
export const tagOptionsStore = createStore(KEY('tags'), SEED_TAGS, Array.isArray);
export const couponsStore = createStore(KEY('coupons'), SEED_COUPONS, Array.isArray);
export const ordersStore = createStore(KEY('orders'), SEED_ORDERS, Array.isArray);
export const customersStore = createStore(KEY('customers'), SEED_CUSTOMERS, Array.isArray);
export const bannersStore = createStore(KEY('banners'), SEED_BANNERS, Array.isArray);
export const instagramStore = createStore(KEY('instagram'), SEED_INSTAGRAM, Array.isArray);
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

export const videosStore = createStore<EcommerceVideo[]>('demo.admin.videos', [
  {
    id: 'vid-1',
    title: 'Unboxing & Sound Test: Wireless Headphones Pro',
    productName: 'Wireless Noise-Cancelling Headphones Pro',
    duration: '01:45',
    views: 12450,
    thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400',
    videoUrl: DEMO_VIDEO_URL,
    dateAdded: '2026-08-20',
  },
  {
    id: 'vid-2',
    title: 'Water Resistance & Fitness Tracking Test',
    productName: 'Ultra Slim Smartwatch Series 7',
    duration: '00:58',
    views: 8930,
    thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400',
    videoUrl: DEMO_VIDEO_URL,
    dateAdded: '2026-08-18',
  },
  {
    id: 'vid-3',
    title: 'Mechanical Switch Sound Profile & Typing ASMR',
    productName: 'Ergonomic Mechanical Keyboard RGB',
    duration: '02:15',
    views: 24100,
    thumbnail: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=400',
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
  { id: 'acc-1', name: 'Meera Iyer', email: 'meera.iyer@example.com', phone: '+91 98450 12345', password: 'demo1234', createdAt: '2026-10-20T10:00:00+05:30' },
], Array.isArray);
export const adminAccountStore = createStore<AdminAccount>(
  KEY('admin'),
  { email: 'shop@admin.com', password: 'shop123' },
  (v) => typeof v === 'object' && v !== null && typeof (v as AdminAccount).email === 'string' && typeof (v as AdminAccount).password === 'string'
);

// Razorpay in test mode: the keys and payment methods set in Admin Security, used by the store's checkout.
export interface PaymentGateway {
  keyId: string;
  keySecret: string;
  merchantName: string;
  methods: { upi: boolean; card: boolean; netbanking: boolean; cod: boolean };
  verifiedAt: string;
}
export const DEFAULT_PAYMENT_GATEWAY: PaymentGateway = {
  keyId: 'rzp_test_Rk7vH2pQm9XwLd',
  keySecret: 'Qm4tYv8LxR2bNw6KpZc9sH1e',
  merchantName: 'Demo Website',
  methods: { upi: true, card: true, netbanking: true, cod: true },
  verifiedAt: '',
};
export const paymentGatewayStore = createStore<PaymentGateway>(
  KEY('paymentGateway'),
  DEFAULT_PAYMENT_GATEWAY,
  (v) => typeof v === 'object' && v !== null && typeof (v as PaymentGateway).keyId === 'string' && typeof (v as PaymentGateway).methods === 'object'
);
/** Razorpay-style ids such as `order_Nq4…`, made in the browser for the test-mode checkout. */
export const fakeGatewayOrderId = () => `order_${randomId(14)}`;

const SHARED_STORES = [
  productsStore, categoriesStore, subCategoriesStore, subSubCategoriesStore, sizeOptionsStore, colorOptionsStore,
  tagOptionsStore, couponsStore, ordersStore, customersStore, bannersStore, instagramStore, adminAccountStore, shopperAccountsStore, videosStore, paymentGatewayStore,
];

/** Puts every shared list back to the sample data, for both the admin and the website. */
export function resetDemoData() {
  SHARED_STORES.forEach((store) => (store as Store<unknown>).reset());
}
