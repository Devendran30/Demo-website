'use client';

import { Fragment, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { CameraScanner, type ScanResult } from './camera-scanner';
import { ProductQrCode } from './product-qr-code';
import { ProductBarcode } from './product-barcode';
import { BarcodeLabel, downloadLabelsPdf, type LabelData } from './barcode-label';
import { VariantStockGrid } from './variant-stock-grid';
import { ImageListField } from './image-list-field';
import { ShiprocketDialog } from './shiprocket-dialog';
import { VideoPlayerModal } from './video-player';
import { RazorpaySettings } from './payment-settings';
import { ThemeSetup } from './theme-setup';
import { StoreDetailsSettings } from './store-details-settings';
import { K, KaavuDetails, KaavuImageUploader, KaavuInventoryRow, KaavuStockFields } from './kaavu-ui';
// Products, orders, coupons, banners and the rest are shared with the storefront and saved in the browser.
import {
  useStore, createStore, productsStore, categoriesStore, subCategoriesStore, subSubCategoriesStore, sizeOptionsStore, colorOptionsStore,
  tagOptionsStore, couponsStore, ordersStore, customersStore, bannersStore, instagramStore, adminAccountStore, videosStore,
  buildVariantStock, variantSizes, variantColors, stockStatus, couponState, restockOrder, resetDemoData, fakePaymentId, uid,
  localDate, sellInStore, returnToStock, STANDARD, ORDER_STATUSES, DEMO_VIDEO_URL,
  type VariantStock, type Product, type SizeOption, type ColorOption, type TagOption, type Coupon, type Order, type OrderStatus,
  type HeroBanner, type CategoryItem, type EcommerceVideo, type StockLine, useStoreDetails,
} from './demo-data';

interface PosCartItem {
  product: Product;
  quantity: number;
}

interface PosTransaction {
  id: string;
  receiptNo: string;
  date: string;
  cashier: string;
  customer: string;
  itemsCount: number;
  total: number;
  paymentMethod: 'Cash' | 'Card' | 'UPI' | 'COD';
  customerPhone?: string;
  items: { productId?: string; name: string; qty: number; price: number }[];
  // Exactly which size/colour stock the sale took, so a return puts it back in the same place.
  stockLines?: StockLine[];
  returnedItems?: number[];
}

// POS bills are saved in the browser like the rest of the demo data, so they survive a refresh.
const posHistoryStore = createStore<PosTransaction[]>('demo.admin.posHistory.v4', [
  {
    id: 'tx-1',
    receiptNo: 'REC-2026-8091',
    date: '2026-08-26 03:45 PM',
    cashier: 'John Cashier (Reg #01)',
    customer: 'Siddharth Rao',
    itemsCount: 2,
    total: 36998,
    paymentMethod: 'UPI',
    items: [
      { productId: 'wireless-nc-headphones-pro', name: 'Mehr Pearl Strand Necklace', qty: 1, price: 24999 },
      { productId: 'ergonomic-mechanical-keyboard-rgb', name: 'Gulab Pink Stone Ring', qty: 1, price: 11999 },
    ],
  },
  {
    id: 'tx-2',
    receiptNo: 'REC-2026-8090',
    date: '2026-08-26 01:15 PM',
    cashier: 'Sarah Jenkins (Reg #02)',
    customer: 'Walk-in Customer',
    itemsCount: 1,
    total: 9499,
    paymentMethod: 'Card',
    items: [
      { productId: 'ultra-slim-smartwatch-7', name: 'Nila Sapphire Drop Earrings', qty: 1, price: 9499 },
    ],
  },
  {
    id: 'tx-3',
    receiptNo: 'REC-2026-8089',
    date: '2026-08-25 06:20 PM',
    cashier: 'John Cashier (Reg #01)',
    customer: 'Rahul Nair',
    itemsCount: 1,
    total: 4799,
    paymentMethod: 'Cash',
    items: [
      { productId: 'retro-compact-camera', name: 'Anika Floral Bracelet', qty: 1, price: 4799 },
    ],
  },
], Array.isArray);


type AdminTab =
  | 'dashboard' | 'add-product' | 'product-list' | 'inventory' | 'attributes'
  | 'category' | 'sub-category' | 'sub-sub-category' | 'coupons' | 'orders' | 'customers'
  | 'pos-terminal' | 'pos-history' | 'banners' | 'instagram' | 'videos' | 'themes' | 'store-details' | 'reports' | 'settings';

type DemoSubAdmin = { id: string; name: string; email: string; password: string; permissions: AdminTab[] };
// Staff logins and product videos are saved in the browser like the rest of the demo data (same keys as before).
const subAdminsStore = createStore<DemoSubAdmin[]>('demo.admin.subAdmins', [], Array.isArray);
// Every admin page except Admin Security, which stays with the super admin.
const SUBADMIN_MODULES: { id: AdminTab; label: string; group: string }[] = [
  { id: 'dashboard', label: 'Dashboard', group: 'Overview' },
  { id: 'reports', label: 'Reports', group: 'Overview' },
  { id: 'add-product', label: 'Add and edit products', group: 'Products' },
  { id: 'product-list', label: 'Product list', group: 'Products' },
  { id: 'inventory', label: 'Inventory', group: 'Products' },
  { id: 'attributes', label: 'Sizes, colours & tags', group: 'Products' },
  { id: 'category', label: 'Category', group: 'Categories' },
  { id: 'sub-category', label: 'Sub category', group: 'Categories' },
  { id: 'sub-sub-category', label: 'Sub sub categories', group: 'Categories' },
  { id: 'orders', label: 'Orders', group: 'Sales' },
  { id: 'customers', label: 'Customers', group: 'Sales' },
  { id: 'coupons', label: 'Coupons', group: 'Sales' },
  { id: 'pos-terminal', label: 'POS live register', group: 'POS Terminal' },
  { id: 'pos-history', label: 'POS history', group: 'POS Terminal' },
  { id: 'banners', label: 'Hero banners', group: 'Storefront' },
  { id: 'instagram', label: 'Instagram feed', group: 'Storefront' },
  { id: 'videos', label: 'Videos', group: 'Storefront' },
  { id: 'themes', label: 'Theme setup', group: 'Storefront' },
  { id: 'store-details', label: 'Logo, contact & footer', group: 'Storefront' },
];
const SUBADMIN_GROUPS = [...new Set(SUBADMIN_MODULES.map((module) => module.group))];

type OrderDateFilter = 'all' | 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'last-month' | 'custom';
const ORDER_DATE_FILTERS: { id: OrderDateFilter; label: string }[] = [
  { id: 'all', label: 'All dates' },
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: 'month', label: 'This month' },
  { id: 'last-month', label: 'Last month' },
  { id: 'custom', label: 'Custom range' },
];

/** First and last day (YYYY-MM-DD, inclusive) for an order date filter, or null for all dates. */
function orderDateRange(filter: OrderDateFilter, from: string, to: string): [string, string] | null {
  const daysAgo = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return localDate(d);
  };
  const today = localDate();
  switch (filter) {
    case 'today': return [today, today];
    case 'yesterday': return [daysAgo(1), daysAgo(1)];
    case '7d': return [daysAgo(6), today];
    case '30d': return [daysAgo(29), today];
    case 'month': return [`${today.slice(0, 7)}-01`, today];
    case 'last-month': {
      const now = new Date();
      return [localDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)), localDate(new Date(now.getFullYear(), now.getMonth(), 0))];
    }
    case 'custom': return from || to ? [from || '0000-01-01', to || '9999-12-31'] : null;
    default: return null;
  }
}

const TAB_TITLES: Record<AdminTab, string> = {
  dashboard: 'Commerce Overview',
  'add-product': 'Add Product',
  'product-list': 'Product List',
  inventory: 'Inventory',
  attributes: 'Sizes, Colors & Tags',
  category: 'Category',
  'sub-category': 'Sub Category',
  'sub-sub-category': 'Sub Sub Category',
  coupons: 'Coupons',
  orders: 'Orders',
  customers: 'Customers',
  'pos-terminal': 'POS Cash Register',
  'pos-history': 'POS History',
  banners: 'Hero Banners',
  instagram: 'Instagram Feed',
  videos: 'Videos',
  themes: 'Theme Setup',
  'store-details': 'Store Details',
  reports: 'Reports & Analytics',
  settings: 'Admin Security',
};

const DEFAULT_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=400';

/** The Live / Hidden switch for a product's visibility on the website. */
function LiveToggle({ live, name, onToggle }: { live: boolean; name: string; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={live}
      aria-label={`Show ${name} on the website`}
      title={live ? 'Live on the website. Click to hide.' : 'Hidden from the website. Click to make it live.'}
      onClick={onToggle}
      className="inline-flex items-center gap-2.5"
    >
      <span className={`relative w-11 h-6 rounded-full transition-colors ${live ? 'bg-emerald-500' : 'bg-[#CFD8E3]'}`}>
        <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${live ? 'translate-x-5' : ''}`} />
      </span>
      <span className={`text-[12.5px] font-bold w-12 text-left ${live ? 'text-emerald-700' : 'text-[#6F7E92]'}`}>{live ? 'Live' : 'Hidden'}</span>
    </button>
  );
}

function PanelIcon({ name, size = 18 }: { name: 'money' | 'box' | 'tag' | 'warning' | 'folder' | 'image' | 'instagram' | 'palette' | 'file' | 'monitor' | 'plus' | 'ticket' | 'camera' | 'eye' | 'eye-off' | 'lock' | 'truck' | 'receipt' | 'bag' | 'mobile' | 'video' | 'views' | 'barcode'; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    money: <><path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
    box: <><path d="m12 3 9 5v8l-9 5-9-5V8l9-5Z" /><path d="m3 8 9 5 9-5M12 13v8" /></>,
    tag: <><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" /><circle cx="7.5" cy="7.5" r="1" /></>,
    warning: <><path d="m10.3 3.9-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.1l-8-14a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4m0 4h.01" /></>,
    folder: <><path d="M3 6a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z" /></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>,
    instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".6" /></>,
    palette: <><path d="M12 3a9 9 0 1 0 0 18h1.2a2 2 0 0 0 1.4-3.4 1.8 1.8 0 0 1 1.3-3.1H18a3 3 0 0 0 3-3c0-4.7-4-8.5-9-8.5Z" /><path d="M7.5 11h.01M9 7.5h.01M14 7.5h.01M16.5 10h.01" /></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h8" /></>,
    monitor: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8m-4-4v4" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    ticket: <><path d="M2 9a3 3 0 0 0 0 6v3h20v-3a3 3 0 0 1 0-6V6H2v3Z" /><path d="M13 6v2m0 4v2m0 4v1" /></>,
    camera: <><path d="M14 4h-4L8 7H4a2 2 0 0 0-2 2v10h20V9a2 2 0 0 0-2-2h-4l-2-3Z" /><circle cx="12" cy="13" r="3" /></>,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
    'eye-off': <><path d="m3 3 18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7c1.6 0 3.1-.4 4.4-1.1" /></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3" /></>,
    truck: <><path d="M2 6h12v11H2zM14 10h4l4 4v3h-8z" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></>,
    receipt: <><path d="M4 2v20l4-2 4 2 4-2 4 2V2l-4 2-4-2-4 2-4-2Z" /><path d="M8 9h8m-8 4h8" /></>,
    bag: <><path d="M5 8h14l1 13H4L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
    mobile: <><rect x="6" y="2" width="12" height="20" rx="2" /><path d="M11 18h2" /></>,
    video: <><rect x="3" y="5" width="13" height="14" rx="2" /><path d="m16 10 5-3v10l-5-3" /></>,
    views: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
    barcode: <><path d="M3 5v14M6 5v14M10 5v14M12 5v14M17 5v14M21 5v14" /></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">{paths[name]}</svg>;
}

const orderStatusStyle = (status: OrderStatus) =>
  status === 'Delivered'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : status === 'Shipped'
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : status === 'Cancelled'
        ? 'bg-red-50 text-red-700 border-red-200'
        : 'bg-amber-50 text-amber-700 border-amber-200';

/** Renames a size or color key everywhere it appears in a product, so stock and photos follow it. */
const renameKey = <T,>(record: Record<string, T>, from: string, to: string) =>
  Object.fromEntries(Object.entries(record).map(([key, value]) => [key === from ? to : key, value]));

export default function EcommerceAdminPanel() {
  const storeInfo = useStoreDetails();
  const router = useRouter();

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [signedInSubAdmin, setSignedInSubAdmin] = useState<DemoSubAdmin | null>(null);
  const demoSubAdmins = useStore(subAdminsStore);
  const setDemoSubAdmins = subAdminsStore.set;
  const [subAdminDraft, setSubAdminDraft] = useState({ name: '', email: '', password: '', permissions: [] as AdminTab[] });
  const [editingSubAdminId, setEditingSubAdminId] = useState<string | null>(null);
  const [subAdminError, setSubAdminError] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const adminAccount = useStore(adminAccountStore);
  const adminEmail = adminAccount.email;
  const adminPassword = adminAccount.password;
  const canSeeAdminTab = (tab: AdminTab) => !signedInSubAdmin || signedInSubAdmin.permissions.includes(tab);


  // Active Tab and Dropdown States
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isProductsDropdownOpen, setIsProductsDropdownOpen] = useState(false);
  const [isPosDropdownOpen, setIsPosDropdownOpen] = useState(false);
  const [isCategoriesDropdownOpen, setIsCategoriesDropdownOpen] = useState(false);
  const [isStorefrontDropdownOpen, setIsStorefrontDropdownOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [adminToast, setAdminToast] = useState<{ id: string; text: string } | null>(null);

  // Sizes, Colors & Tags (product attributes)
  const sizeOptions = useStore(sizeOptionsStore);
  const setSizeOptions = sizeOptionsStore.set;
  const colorOptions = useStore(colorOptionsStore);
  const setColorOptions = colorOptionsStore.set;
  const tagOptions = useStore(tagOptionsStore);
  const setTagOptions = tagOptionsStore.set;
  const colorHex = Object.fromEntries(colorOptions.map((c) => [c.name, c.hex]));
  const [newSizeName, setNewSizeName] = useState('');
  const [newSizeCode, setNewSizeCode] = useState('');
  const [editingSizeId, setEditingSizeId] = useState<string | null>(null);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#ea580c');
  const [editingColorId, setEditingColorId] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [editingTagId, setEditingTagId] = useState<string | null>(null);

  // Products State
  const products = useStore(productsStore);
  const setProducts = productsStore.set;
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  // Inventory (stock by size & color)
  const [inventorySearch, setInventorySearch] = useState('');
  const [stockEditProduct, setStockEditProduct] = useState<Product | null>(null);
  const [stockEditValues, setStockEditValues] = useState<VariantStock>({});

  // Product Modals & Forms
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Barcode Modals
  const [isGenerateBarcodeModalOpen, setIsGenerateBarcodeModalOpen] = useState(false);
  const [isPrintBarcodeModalOpen, setIsPrintBarcodeModalOpen] = useState(false);
  const [barcodeGenStatus, setBarcodeGenStatus] = useState<'idle' | 'generating' | 'success'>('idle');
  const [activeBarcodeProduct, setActiveBarcodeProduct] = useState<Product | null>(null);
  const [barcodeLabelCount, setBarcodeLabelCount] = useState(1);
  const [barcodeLabelDims, setBarcodeLabelDims] = useState({ w: 50, h: 25 });
  const [barcodeDimInput, setBarcodeDimInput] = useState({ w: '50', h: '25' });

  const [isMultiProductModalOpen, setIsMultiProductModalOpen] = useState(false);
  const [multiProductInput, setMultiProductInput] = useState('');

  // Product Form State (shared by Add Product and Edit Product)
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [newProdName, setNewProdName] = useState('');
  const [newProdDescription, setNewProdDescription] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdBarcode, setNewProdBarcode] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Necklaces');
  const [newProdSubCategory, setNewProdSubCategory] = useState('Chains & Pendants');
  const [newProdSubSubCategory, setNewProdSubSubCategory] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdMrp, setNewProdMrp] = useState('');
  const [newProdImages, setNewProdImages] = useState<string[]>([]);
  const [newProdSizes, setNewProdSizes] = useState<string[]>([]);
  const [newProdColors, setNewProdColors] = useState<string[]>([]);
  const [newProdVariantStock, setNewProdVariantStock] = useState<VariantStock>({});
  const [newProdColorImages, setNewProdColorImages] = useState<Record<string, string[]>>({});
  const [newProdTags, setNewProdTags] = useState<string[]>([]);
  const [newProdIsNew, setNewProdIsNew] = useState(true);
  const [newProdIsFeatured, setNewProdIsFeatured] = useState(false);
  const [newProdHighlights, setNewProdHighlights] = useState('');
  const [newProdSpecs, setNewProdSpecs] = useState('');
  const [productFormError, setProductFormError] = useState('');

  // Categories Hierarchy State
  const categories = useStore(categoriesStore);
  const setCategories = categoriesStore.set;
  const [categoryDraft, setCategoryDraft] = useState<CategoryItem | null>(null);
  const [categoryFormError, setCategoryFormError] = useState('');

  const subCategories = useStore(subCategoriesStore);
  const setSubCategories = subCategoriesStore.set;
  const [newSubCatName, setNewSubCatName] = useState('');
  const [newSubCatParent, setNewSubCatParent] = useState('Necklaces');

  const subSubCategories = useStore(subSubCategoriesStore);
  const setSubSubCategories = subSubCategoriesStore.set;
  const [newSubSubCatName, setNewSubSubCatName] = useState('');
  const [newSubSubCatSubParent, setNewSubSubCatSubParent] = useState('Chains & Pendants');
  const [newSubSubCatParent, setNewSubSubCatParent] = useState('Necklaces');

  // Coupons State
  const coupons = useStore(couponsStore);
  const setCoupons = couponsStore.set;
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDescription, setNewCouponDescription] = useState('');
  const [newCouponType, setNewCouponType] = useState<'Percentage' | 'Fixed'>('Percentage');
  const [newCouponValue, setNewCouponValue] = useState('');
  const [newCouponMaxDiscount, setNewCouponMaxDiscount] = useState('');
  const [newCouponMin, setNewCouponMin] = useState('1000');
  const [newCouponUsageLimit, setNewCouponUsageLimit] = useState('');
  const [newCouponFrom, setNewCouponFrom] = useState(localDate());
  const [newCouponDate, setNewCouponDate] = useState('');
  const [newCouponShowInHeader, setNewCouponShowInHeader] = useState(false);
  const [newCouponActive, setNewCouponActive] = useState(true);
  const [couponFormError, setCouponFormError] = useState('');

  // Orders State
  const orders = useStore(ordersStore);
  const setOrders = ordersStore.set;
  const [selectedOrderForView, setSelectedOrderForView] = useState<Order | null>(null);
  const [invoicePaper, setInvoicePaper] = useState<'A4' | '4x6'>('A4');
  const [orderDetailsId, setOrderDetailsId] = useState<string | null>(null);
  const [shiprocketOrderId, setShiprocketOrderId] = useState<string | null>(null);
  const [checkingPayments, setCheckingPayments] = useState(false);
  const [paymentCheckMessage, setPaymentCheckMessage] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'All' | OrderStatus>('All');
  const [orderDateFilter, setOrderDateFilter] = useState<OrderDateFilter>('all');
  const [orderDateFrom, setOrderDateFrom] = useState('');
  const [orderDateTo, setOrderDateTo] = useState('');
  const [productVisibilityFilter, setProductVisibilityFilter] = useState<'All' | 'Live' | 'Hidden'>('All');

  // Customers State
  const customers = useStore(customersStore);
  const setCustomers = customersStore.set;
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSort, setCustomerSort] = useState<'recent' | 'name' | 'spent' | 'orders'>('recent');
  const [customerFilter, setCustomerFilter] = useState<'all' | 'ordered' | 'new'>('all');
  const [customerHistoryEmail, setCustomerHistoryEmail] = useState<string | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [customerFormError, setCustomerFormError] = useState('');

  // Hero Banners State
  const banners = useStore(bannersStore);
  const setBanners = bannersStore.set;
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [bannerDraft, setBannerDraft] = useState<HeroBanner | null>(null);

  // Instagram Feed State
  const instagramPosts = useStore(instagramStore);
  const setInstagramPosts = instagramStore.set;
  const [isInstagramModalOpen, setIsInstagramModalOpen] = useState(false);
  const [newIgUrl, setNewIgUrl] = useState('');
  const [newIgImage, setNewIgImage] = useState('');
  const [newIgCaption, setNewIgCaption] = useState('');

  // Admin Security State
  const [secCurrentPassword, setSecCurrentPassword] = useState('');
  const [secNewEmail, setSecNewEmail] = useState('');
  const [secNewPassword, setSecNewPassword] = useState('');
  const [secConfirmPassword, setSecConfirmPassword] = useState('');
  const [secMessage, setSecMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<string[]>([]);

  // POS State
  const [posCart, setPosCart] = useState<PosCartItem[]>([
    { product: products[0], quantity: 1 },
    { product: products[2], quantity: 1 },
  ]);
  const [posSearchTerm, setPosSearchTerm] = useState('');
  const [isPosCameraOpen, setIsPosCameraOpen] = useState(false);
  const [posCustomerName, setPosCustomerName] = useState('');
  const [posCustomerPhone, setPosCustomerPhone] = useState('');
  const [posPaymentMethod, setPosPaymentMethod] = useState<'COD' | 'Card' | 'UPI'>('COD');
  const [posReceiptModal, setPosReceiptModal] = useState<PosTransaction | null>(null);
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
  const [exchangeTx, setExchangeTx] = useState<PosTransaction | null>(null);
  const [posManualTotal, setPosManualTotal] = useState<string>('');
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [isCustomerLookupOpen, setIsCustomerLookupOpen] = useState(false);
  const [customerLookupQuery, setCustomerLookupQuery] = useState('');
  const [newCustomerFormName, setNewCustomerFormName] = useState('');
  const [newCustomerFormPhone, setNewCustomerFormPhone] = useState('');
  const [newCustomerFormError, setNewCustomerFormError] = useState('');

  const posHistory = useStore(posHistoryStore);
  const setPosHistory = posHistoryStore.set;
  const [exchangeSelected, setExchangeSelected] = useState<number[]>([]);

  // Videos State
  const videos = useStore(videosStore);
  const setVideos = videosStore.set;
  const [isUploadVideoModalOpen, setIsUploadVideoModalOpen] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<EcommerceVideo | null>(null);
  const [newVidTitle, setNewVidTitle] = useState('');
  const [newVidProduct, setNewVidProduct] = useState('Heritage Gold Necklace');
  const [newVidDuration, setNewVidDuration] = useState('01:30');
  const [newVidThumbnail, setNewVidThumbnail] = useState('');
  const [newVidVideoUrl, setNewVidVideoUrl] = useState('');

  // Helper Functions
  const resetProductForm = () => {
    setEditingProductId(null);
    setNewProdName('');
    setNewProdDescription('');
    setNewProdSku('');
    setNewProdBarcode('');
    setNewProdCategory(categories[0]?.name ?? '');
    setNewProdSubCategory(subCategories.find((sc) => sc.parentCategory === categories[0]?.name)?.name ?? '');
    setNewProdSubSubCategory('');
    setNewProdPrice('');
    setNewProdMrp('');
    setNewProdImages([]);
    setNewProdSizes([]);
    setNewProdColors([]);
    setNewProdVariantStock({});
    setNewProdColorImages({});
    setNewProdTags([]);
    setNewProdIsNew(true);
    setNewProdIsFeatured(false);
    setNewProdHighlights('');
    setNewProdSpecs('');
    setProductFormError('');
  };

  const openAddProduct = () => {
    resetProductForm();
    setActiveTab('add-product');
  };

  const openEditProduct = (prod: Product) => {
    setEditingProductId(prod.id);
    setNewProdName(prod.name);
    setNewProdDescription(prod.description);
    setNewProdSku(prod.sku);
    setNewProdBarcode(prod.barcode);
    setNewProdCategory(prod.category);
    setNewProdSubCategory(prod.subCategory);
    setNewProdSubSubCategory(prod.subSubCategory ?? '');
    setNewProdPrice(String(prod.price));
    setNewProdMrp(prod.mrp ? String(prod.mrp) : '');
    setNewProdImages(prod.images.length ? prod.images : [prod.image]);
    setNewProdSizes(prod.sizes);
    setNewProdColors(prod.colors);
    setNewProdVariantStock(prod.variantStock);
    setNewProdColorImages(prod.colorImages);
    setNewProdTags(prod.tags);
    setNewProdIsNew(prod.isNewArrival);
    setNewProdIsFeatured(prod.isFeatured);
    setNewProdHighlights(prod.highlights.join('\n'));
    setNewProdSpecs(prod.specs.map(([label, value]) => `${label}: ${value}`).join('\n'));
    setProductFormError('');
    setActiveTab('add-product');
  };

  const handleProductCategoryChange = (category: string) => {
    setNewProdCategory(category);
    setNewProdSubCategory(subCategories.find((sc) => sc.parentCategory === category)?.name ?? '');
    setNewProdSubSubCategory('');
  };

  const toggleInList = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(newProdPrice);
    const mrp = newProdMrp ? parseFloat(newProdMrp) : undefined;
    if (!newProdName.trim() || !(price > 0)) {
      setProductFormError('Enter a product name and a price above ₹0.');
      return;
    }
    if (mrp !== undefined && !(mrp >= price)) {
      setProductFormError('MRP must be equal to or higher than the selling price.');
      return;
    }
    // Keep sizes and colors in the order they appear on the Sizes, Colors & Tags page.
    const sizes = sizeOptions.map((s) => s.code).filter((code) => newProdSizes.includes(code));
    const colors = colorOptions.map((c) => c.name).filter((name) => newProdColors.includes(name));
    const { variantStock, stock } = buildVariantStock(sizes, colors, newProdVariantStock);
    const colorImages = Object.fromEntries(
      colors.filter((c) => newProdColorImages[c]?.length).map((c) => [c, newProdColorImages[c]])
    );
    const cover = newProdImages[0] ?? Object.values(colorImages)[0]?.[0] ?? DEFAULT_PRODUCT_IMAGE;
    const existing = products.find((p) => p.id === editingProductId);
    const slug = newProdName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
    const prod: Product = {
      id: existing?.id ?? `${slug || 'product'}-${Date.now().toString(36)}`,
      name: newProdName.trim(),
      description: newProdDescription.trim(),
      sku: newProdSku.trim() || existing?.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: newProdSku.trim() || existing?.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      category: newProdCategory,
      subCategory: newProdSubCategory,
      subSubCategory: newProdSubSubCategory,
      price,
      mrp,
      stock,
      status: stockStatus(stock),
      image: cover,
      images: newProdImages.length ? newProdImages : [cover],
      sizes,
      colors,
      variantStock,
      colorImages,
      tags: newProdTags,
      isNewArrival: newProdIsNew,
      isFeatured: newProdIsFeatured,
      rating: existing?.rating ?? 5.0,
      reviews: existing?.reviews ?? 0,
      isLive: existing?.isLive ?? true,
      highlights: newProdHighlights.split('\n').map((h) => h.trim()).filter(Boolean),
      // One "Label: Value" per line; a line without a colon is ignored.
      specs: newProdSpecs
        .split('\n')
        .map((row) => row.split(':'))
        .filter((parts) => parts.length > 1 && parts[0].trim())
        .map(([label, ...value]) => [label.trim(), value.join(':').trim()] as [string, string]),
    };
    setProducts(existing ? products.map((p) => (p.id === existing.id ? prod : p)) : [prod, ...products]);
    resetProductForm();
    setActiveTab('product-list');
  };

  const openStockEditor = (prod: Product) => {
    setStockEditProduct(prod);
    setStockEditValues(prod.variantStock);
  };

  const handleSaveStock = () => {
    if (!stockEditProduct) return;
    const { variantStock, stock } = buildVariantStock(stockEditProduct.sizes, stockEditProduct.colors, stockEditValues);
    setProducts(products.map((p) => (p.id === stockEditProduct.id ? { ...p, variantStock, stock, status: stockStatus(stock) } : p)));
    setStockEditProduct(null);
  };

  // A short confirmation at the bottom of the screen for quick actions (copy, email sent...).
  const notify = (text: string) => {
    const id = uid('toast');
    setAdminToast({ id, text });
    setTimeout(() => setAdminToast((current) => (current?.id === id ? null : current)), 2800);
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard?.writeText(text).then(
      () => notify(`${label} copied`),
      () => notify(`Couldn't copy ${label.toLowerCase()}`)
    );
  };

  // Order Helpers
  const updateOrder = (id: string, change: (o: Order) => Order) =>
    setOrders(ordersStore.get().map((o) => (o.id === id ? change(o) : o)));

  const changeOrderStatus = (ord: Order, status: OrderStatus) => {
    if (status === ord.orderStatus) return;
    if (status === 'Cancelled') {
      if (!confirm(`Cancel ${ord.orderNumber}? Its ${ord.itemsCount} item(s) will go back into stock.`)) return;
      restockOrder(ord);
    }
    updateOrder(ord.id, (o) => ({
      ...o,
      orderStatus: status,
      shipment: o.shipment && status === 'Delivered' ? { ...o.shipment, status: 'Delivered', remoteStatus: 'DELIVERED' } : o.shipment,
      // Cash on delivery is collected when the parcel arrives.
      paymentStatus: status === 'Delivered' && o.paymentMethod === 'Cash on Delivery' ? 'Paid' : o.paymentStatus,
      // Like Kaavu, every status change emails the customer.
      emails: [...o.emails, { kind: 'Status update', at: new Date().toISOString() }],
    }));
    notify(`${ord.orderNumber} marked ${status}${status === 'Cancelled' ? ' — stock returned' : ''} · customer emailed`);
  };

  const emailCustomer = (ord: Order, kind: 'Status update' | 'Invoice') => {
    updateOrder(ord.id, (o) => ({ ...o, emails: [...o.emails, { kind, at: new Date().toISOString() }] }));
    notify(`${kind === 'Invoice' ? 'Invoice' : `Status update (${ord.orderStatus})`} emailed to ${ord.email}`);
  };

  // Asks the payment gateway (simulated) about online payments still marked Pending.
  const reconcilePayments = () => {
    if (checkingPayments) return;
    setCheckingPayments(true);
    setPaymentCheckMessage('');
    setTimeout(() => {
      const current = ordersStore.get();
      const pending = current.filter((o) => o.paymentStatus === 'Pending' && o.paymentMethod !== 'Cash on Delivery' && o.orderStatus !== 'Cancelled');
      const failed = current.filter((o) => o.paymentStatus === 'Failed').length;
      setOrders(current.map((o) => (pending.some((p) => p.id === o.id) ? { ...o, paymentStatus: 'Paid', paymentId: o.paymentId ?? fakePaymentId() } : o)));
      setPaymentCheckMessage(`${pending.length + failed} attempts checked. ${pending.length} orders confirmed. 0 awaiting payment. ${failed} need review.`);
      setCheckingPayments(false);
    }, 900);
  };

  const openInvoice = (ord: Order, paper: 'A4' | '4x6' = 'A4') => {
    setInvoicePaper(paper);
    setSelectedOrderForView(ord);
  };

  // Category Helpers
  const openCategoryModal = (cat?: CategoryItem) => {
    setCategoryDraft(cat ?? { id: '', name: '', slug: '', icon: 'folder', image: '', blurb: '', status: 'Active' });
    setCategoryFormError('');
  };

  const handleSaveCategory = () => {
    if (!categoryDraft) return;
    const name = categoryDraft.name.trim();
    if (!name) {
      setCategoryFormError('Enter a category name.');
      return;
    }
    if (categories.some((c) => c.id !== categoryDraft.id && c.name.toLowerCase() === name.toLowerCase())) {
      setCategoryFormError(`A category called "${name}" already exists.`);
      return;
    }
    const saved: CategoryItem = {
      ...categoryDraft,
      name,
      blurb: categoryDraft.blurb.trim(),
      icon: categoryDraft.icon.trim() || 'folder',
      slug: name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    };
    const previous = categories.find((c) => c.id === categoryDraft.id);
    if (previous) {
      setCategories(categories.map((c) => (c.id === previous.id ? saved : c)));
      // Products and sub-categories follow a renamed category.
      if (previous.name !== name) {
        setProducts(products.map((p) => (p.category === previous.name ? { ...p, category: name } : p)));
        setSubCategories(subCategories.map((sc) => (sc.parentCategory === previous.name ? { ...sc, parentCategory: name } : sc)));
        setSubSubCategories(subSubCategories.map((ssc) => (ssc.parentCategory === previous.name ? { ...ssc, parentCategory: name } : ssc)));
      }
    } else {
      setCategories([...categories, { ...saved, id: `c-${Date.now()}` }]);
    }
    setCategoryDraft(null);
  };

  // Attribute Helpers (sizes, colors, tags)
  const productsUsing = (key: 'sizes' | 'colors' | 'tags', value: string) =>
    products.filter((p) => p[key].includes(value)).length;

  const resetSizeForm = () => {
    setEditingSizeId(null);
    setNewSizeName('');
    setNewSizeCode('');
  };

  const handleSaveSize = () => {
    const name = newSizeName.trim();
    const code = newSizeCode.trim();
    if (!name || !code) return;
    if (sizeOptions.some((s) => s.id !== editingSizeId && s.code.toLowerCase() === code.toLowerCase())) {
      alert(`A size with the code "${code}" already exists.`);
      return;
    }
    const previous = sizeOptions.find((s) => s.id === editingSizeId);
    if (previous) {
      setSizeOptions(sizeOptions.map((s) => (s.id === previous.id ? { ...s, name, code } : s)));
      if (previous.code !== code) {
        setProducts(products.map((p) =>
          p.sizes.includes(previous.code)
            ? { ...p, sizes: p.sizes.map((s) => (s === previous.code ? code : s)), variantStock: renameKey(p.variantStock, previous.code, code) }
            : p
        ));
      }
    } else {
      setSizeOptions([...sizeOptions, { id: `sz-${Date.now()}`, name, code }]);
    }
    resetSizeForm();
  };

  const handleDeleteSize = (size: SizeOption) => {
    const used = productsUsing('sizes', size.code);
    if (used) {
      alert(`"${size.code}" is used by ${used} product(s). Remove it from those products first.`);
      return;
    }
    setSizeOptions(sizeOptions.filter((s) => s.id !== size.id));
    if (editingSizeId === size.id) resetSizeForm();
  };

  const resetColorForm = () => {
    setEditingColorId(null);
    setNewColorName('');
    setNewColorHex('#ea580c');
  };

  const handleSaveColor = () => {
    const name = newColorName.trim();
    if (!name || !/^#[0-9a-f]{6}$/i.test(newColorHex)) return;
    if (colorOptions.some((c) => c.id !== editingColorId && c.name.toLowerCase() === name.toLowerCase())) {
      alert(`The color "${name}" already exists.`);
      return;
    }
    const previous = colorOptions.find((c) => c.id === editingColorId);
    if (previous) {
      setColorOptions(colorOptions.map((c) => (c.id === previous.id ? { ...c, name, hex: newColorHex } : c)));
      if (previous.name !== name) {
        setProducts(products.map((p) =>
          p.colors.includes(previous.name)
            ? {
              ...p,
              colors: p.colors.map((c) => (c === previous.name ? name : c)),
              variantStock: Object.fromEntries(Object.entries(p.variantStock).map(([size, qty]) => [size, renameKey(qty, previous.name, name)])),
              colorImages: renameKey(p.colorImages, previous.name, name),
            }
            : p
        ));
      }
    } else {
      setColorOptions([...colorOptions, { id: `col-${Date.now()}`, name, hex: newColorHex }]);
    }
    resetColorForm();
  };

  const handleDeleteColor = (color: ColorOption) => {
    const used = productsUsing('colors', color.name);
    if (used) {
      alert(`"${color.name}" is used by ${used} product(s). Remove it from those products first.`);
      return;
    }
    setColorOptions(colorOptions.filter((c) => c.id !== color.id));
    if (editingColorId === color.id) resetColorForm();
  };

  const handleSaveTag = () => {
    const name = newTagName.trim();
    if (!name) return;
    if (tagOptions.some((t) => t.id !== editingTagId && t.name.toLowerCase() === name.toLowerCase())) {
      alert(`The tag "${name}" already exists.`);
      return;
    }
    const previous = tagOptions.find((t) => t.id === editingTagId);
    if (previous) {
      setTagOptions(tagOptions.map((t) => (t.id === previous.id ? { ...t, name } : t)));
      setProducts(products.map((p) => ({ ...p, tags: p.tags.map((t) => (t === previous.name ? name : t)) })));
    } else {
      setTagOptions([...tagOptions, { id: `tag-${Date.now()}`, name }]);
    }
    setEditingTagId(null);
    setNewTagName('');
  };

  const handleDeleteTag = (tag: TagOption) => {
    setTagOptions(tagOptions.filter((t) => t.id !== tag.id));
    setProducts(products.map((p) => ({ ...p, tags: p.tags.filter((t) => t !== tag.name) })));
    if (editingTagId === tag.id) {
      setEditingTagId(null);
      setNewTagName('');
    }
  };

  // Coupon Helpers
  const openCouponModal = (cp?: Coupon) => {
    setEditingCouponId(cp?.id ?? null);
    setNewCouponCode(cp?.code ?? '');
    setNewCouponDescription(cp?.description ?? '');
    setNewCouponType(cp?.discountType ?? 'Percentage');
    setNewCouponValue(cp ? String(cp.discountValue) : '');
    setNewCouponMaxDiscount(cp?.maxDiscount ? String(cp.maxDiscount) : '');
    setNewCouponMin(cp ? String(cp.minPurchase) : '1000');
    setNewCouponUsageLimit(cp?.usageLimit ? String(cp.usageLimit) : '');
    setNewCouponFrom(cp?.validFrom ?? localDate());
    setNewCouponDate(cp ? cp.validTill : '');
    setNewCouponShowInHeader(cp?.showInHeader ?? false);
    setNewCouponActive(cp ? cp.status === 'Active' : true);
    setCouponFormError('');
    setIsCouponModalOpen(true);
  };

  const handleSaveCoupon = () => {
    const code = newCouponCode.trim();
    const value = parseFloat(newCouponValue);
    if (!code || !(value > 0)) {
      setCouponFormError('Enter a coupon code and a discount value above 0.');
      return;
    }
    if (!/^[A-Z0-9_-]{3,20}$/.test(code)) {
      setCouponFormError('Codes use 3–20 capital letters, numbers, - or _ only.');
      return;
    }
    if (newCouponType === 'Percentage' && value > 100) {
      setCouponFormError('A percentage discount cannot be more than 100%.');
      return;
    }
    if (coupons.some((c) => c.id !== editingCouponId && c.code === code)) {
      setCouponFormError(`The code ${code} already exists.`);
      return;
    }
    if (newCouponFrom && newCouponDate && newCouponFrom > newCouponDate) {
      setCouponFormError('The start date must be on or before the end date.');
      return;
    }
    const existing = coupons.find((c) => c.id === editingCouponId);
    const coupon: Coupon = {
      id: existing?.id ?? `cp-${Date.now()}`,
      code,
      description: newCouponDescription.trim(),
      discountType: newCouponType,
      discountValue: value,
      maxDiscount: newCouponType === 'Percentage' && parseFloat(newCouponMaxDiscount) > 0 ? parseFloat(newCouponMaxDiscount) : undefined,
      minPurchase: parseFloat(newCouponMin) || 0,
      usageLimit: parseInt(newCouponUsageLimit) > 0 ? parseInt(newCouponUsageLimit) : undefined,
      validFrom: newCouponFrom,
      validTill: newCouponDate,
      usageCount: existing?.usageCount ?? 0,
      showInHeader: newCouponShowInHeader,
      status: newCouponActive ? 'Active' : 'Expired',
    };
    setCoupons(existing ? coupons.map((c) => (c.id === existing.id ? coupon : c)) : [coupon, ...coupons]);
    setIsCouponModalOpen(false);
  };

  // Only coupons a shopper can use today run in the storefront's top bar.
  const headerCoupons = coupons.filter((c) => c.showInHeader && couponState(c) === 'Live');

  // Customer Helpers
  const customerStats = (email: string) => {
    const placed = orders.filter((o) => o.email.toLowerCase() === email.toLowerCase());
    return {
      orderCount: placed.length,
      totalSpent: placed.filter((o) => o.orderStatus !== 'Cancelled').reduce((sum, o) => sum + o.total, 0),
    };
  };

  const visibleCustomers = customers
    .filter((c) =>
      [c.name, c.email, c.phone].some((v) => v.toLowerCase().includes(customerSearch.trim().toLowerCase())) &&
      (customerFilter === 'all' || (customerFilter === 'ordered') === customerStats(c.email).orderCount > 0)
    )
    .sort((a, b) =>
      customerSort === 'name'
        ? a.name.localeCompare(b.name)
        : customerSort === 'spent'
          ? customerStats(b.email).totalSpent - customerStats(a.email).totalSpent
          : customerSort === 'orders'
            ? customerStats(b.email).orderCount - customerStats(a.email).orderCount
            : b.registeredDate.localeCompare(a.registeredDate)
    );

  const handleAddCustomer = () => {
    const name = newCustomerName.trim();
    const email = newCustomerEmail.trim().toLowerCase();
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setCustomerFormError('Enter a name and a valid email address.');
      return;
    }
    if (customers.some((c) => c.email.toLowerCase() === email)) {
      setCustomerFormError('A customer with this email already exists.');
      return;
    }
    setCustomers([
      { id: uid('cus'), name, email, phone: newCustomerPhone.trim(), registeredDate: localDate() },
      ...customers,
    ]);
    setIsCustomerModalOpen(false);
    notify(`${name} registered successfully`);
  };

  /** wa.me needs the number with country code and digits only; 10-digit Indian numbers get +91. */
  const whatsappLink = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}`;
  };

  const exportCustomersCsv = () => {
    const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const rows = [
      ['Name', 'Email', 'Phone', 'Registered', 'Orders', 'Total Spent (INR)'],
      ...visibleCustomers.map((c) => {
        const stats = customerStats(c.email);
        return [c.name, c.email, c.phone, c.registeredDate, stats.orderCount, stats.totalSpent];
      }),
    ];
    const blob = new Blob([rows.map((r) => r.map(escape).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'customers.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Banner Helpers
  const openBannerModal = (banner?: HeroBanner) => {
    setBannerDraft(
      banner ?? { id: '', title: '', subtitle: '', imageUrl: '', mobileImageUrl: '', ctaText: 'Shop Now', ctaLink: '/shop', isActive: true, textAlign: 'left', textColor: '#ffffff' }
    );
    setIsBannerModalOpen(true);
  };

  const handleSaveBanner = () => {
    if (!bannerDraft || !bannerDraft.title.trim() || !bannerDraft.imageUrl) return;
    const saved = { ...bannerDraft, title: bannerDraft.title.trim(), subtitle: bannerDraft.subtitle.trim() };
    setBanners(saved.id ? banners.map((b) => (b.id === saved.id ? saved : b)) : [...banners, { ...saved, id: `bn-${Date.now()}` }]);
    setIsBannerModalOpen(false);
    setBannerDraft(null);
  };

  const moveBanner = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= banners.length) return;
    const next = [...banners];
    [next[index], next[target]] = [next[target], next[index]];
    setBanners(next);
  };

  // Admin Security
  const handleUpdateCredentials = () => {
    if (secCurrentPassword !== adminPassword) {
      setSecMessage({ ok: false, text: 'Current password is incorrect.' });
      return;
    }
    const email = secNewEmail.trim() || adminEmail;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setSecMessage({ ok: false, text: 'Enter a valid email address.' });
      return;
    }
    if (secNewPassword && secNewPassword.length < 6) {
      setSecMessage({ ok: false, text: 'New password must be at least 6 characters.' });
      return;
    }
    if (secNewPassword !== secConfirmPassword) {
      setSecMessage({ ok: false, text: 'New password and confirmation do not match.' });
      return;
    }
    adminAccountStore.set({ email, password: secNewPassword || adminPassword });
    setSecCurrentPassword('');
    setSecNewEmail('');
    setSecNewPassword('');
    setSecConfirmPassword('');
    setSecMessage({ ok: true, text: 'Admin credentials updated. Use them the next time you sign in.' });
  };

  const websiteRevenue = orders.filter((o) => o.orderStatus !== 'Cancelled').reduce((sum, o) => sum + o.total, 0);
  const posRevenue = posHistory.reduce((sum, tx) => sum + tx.total, 0);
  const totalRevenue = websiteRevenue + posRevenue;
  // Every unit actually sold (website orders that weren't cancelled, plus POS bills), for Reports.
  const soldLines = [
    ...orders.filter((o) => o.orderStatus !== 'Cancelled').flatMap((o) => o.items.map((it) => ({ productId: it.productId, name: it.name, qty: it.qty, amount: it.price * it.qty }))),
    ...posHistory.flatMap((tx) => tx.items.map((it) => ({ productId: it.productId, name: it.name, qty: it.qty, amount: it.price * it.qty }))),
  ];
  const categoryOfSale = (line: { productId?: string; name: string }) => (products.find((p) => p.id === line.productId) ?? products.find((p) => p.name === line.name))?.category;

  const visibleProducts = products.filter(
    (p) =>
      (productCategoryFilter === 'All' || p.category === productCategoryFilter) &&
      (productVisibilityFilter === 'All' || (productVisibilityFilter === 'Live') === (p.isLive !== false)) &&
      [p.name, p.sku, p.category, p.subCategory].some((v) => v.toLowerCase().includes(productSearch.trim().toLowerCase()))
  );

  // The ordered color's own photo when it has one, otherwise the product's cover photo.
  const productImageFor = (sku: string, color: string) => {
    const prod = products.find((p) => p.sku === sku);
    return prod?.colorImages[color]?.[0] ?? prod?.image ?? DEFAULT_PRODUCT_IMAGE;
  };

  const dateRange = orderDateRange(orderDateFilter, orderDateFrom, orderDateTo);
  const visibleOrders = orders.filter(
    (o) =>
      (orderStatusFilter === 'All' || o.orderStatus === orderStatusFilter) &&
      (!dateRange || (o.date >= dateRange[0] && o.date <= dateRange[1])) &&
      [o.orderNumber, o.customerName, o.email, o.phone].some((v) => v.toLowerCase().includes(orderSearch.trim().toLowerCase()))
  );

  const toggleProductLive = (prod: Product) => {
    const live = prod.isLive === false;
    setProducts(products.map((p) => (p.id === prod.id ? { ...p, isLive: live } : p)));
    notify(live ? `${prod.name} is live on the store` : `${prod.name} is hidden from the store`);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  const handleTriggerScanner = (product?: Product) => {
    setIsScannerModalOpen(true);
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScannedProduct(product || products[0]);
    }, 1500);
  };

  const handleBulkAddSubmit = () => {
    if (!multiProductInput.trim()) return;
    const lines = multiProductInput.split('\n');
    const newItems: Product[] = [];
    lines.forEach((line, idx) => {
      const parts = line.split(',');
      if (parts.length >= 2) {
        const stock = parseInt(parts[4]?.trim()) || 25;
        newItems.push({
          id: `p-bulk-${Date.now()}-${idx}`,
          name: parts[0].trim(),
          description: '',
          sku: parts[1]?.trim() || `BULK-${idx + 100}`,
          barcode: `890${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          category: parts[2]?.trim() || categories[0]?.name || 'Necklaces',
          subCategory: 'General',
          price: parseFloat(parts[3]?.trim()) || 999,
          stock,
          status: stockStatus(stock),
          image: DEFAULT_PRODUCT_IMAGE,
          images: [DEFAULT_PRODUCT_IMAGE],
          sizes: [],
          colors: [],
          variantStock: { [STANDARD]: { [STANDARD]: stock } },
          colorImages: {},
          tags: [],
          isNewArrival: true,
          isFeatured: false,
          rating: 4.5,
          reviews: 0,
          highlights: [],
          specs: [],
        });
      }
    });
    if (newItems.length > 0) {
      setProducts([...newItems, ...products]);
      setMultiProductInput('');
      setIsMultiProductModalOpen(false);
    }
  };

  // POS Helper Functions
  const addToPosCart = (product: Product) => {
    const existing = posCart.find((item) => item.product.id === product.id);
    if (existing) {
      setPosCart(
        posCart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setPosCart([...posCart, { product, quantity: 1 }]);
    }
  };

  const findProductByCode = (code: string) => {
    const term = code.trim().toLowerCase();
    return products.find((p) => [p.barcode, p.sku, p.id, p.name].some((value) => value.toLowerCase() === term));
  };

  const handlePosScan = (code: string): ScanResult => {
    const product = findProductByCode(code);
    if (!product) return { ok: false, message: `No product found for "${code}"` };
    const scanned = { name: product.name, image: product.image, code: product.barcode, price: product.price, stock: product.stock };
    if (product.stock <= 0) return { ok: false, message: `${product.name} is out of stock`, product: scanned };
    const inBill = posCart.find((item) => item.product.id === product.id)?.quantity ?? 0;
    if (inBill >= product.stock) return { ok: false, message: `Only ${product.stock} of ${product.name} in stock`, product: scanned };
    addToPosCart(product);
    return { ok: true, message: `Added ${product.name}`, product: scanned };
  };

  const updatePosQty = (productId: string, delta: number) => {
    setPosCart(
      posCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as PosCartItem[]
    );
  };

  const posSubtotal = posCart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const posTax = Math.round(posSubtotal * 0.18);
  const posCalculatedTotal = posSubtotal + posTax;
  const posTotal = posManualTotal !== '' ? parseFloat(posManualTotal) || 0 : posCalculatedTotal;

  const handleCompletePosOrder = () => {
    if (posCart.length === 0) return;
    if (posCustomerName.trim().length < 2 || posCustomerPhone.replace(/\D/g, '').length < 10) {
      alert('Enter the customer name and a valid 10-digit phone number before checkout.');
      return;
    }
    let stockLines: StockLine[];
    try {
      stockLines = sellInStore(posCart.map((item) => ({ productId: item.product.id, qty: item.quantity })));
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Not enough stock for this bill.');
      return;
    }
    const newTx: PosTransaction = {
      id: `tx-${Date.now()}`,
      receiptNo: `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toLocaleString(),
      cashier: 'Admin POS Terminal #01',
      customer: posCustomerName,
      customerPhone: posCustomerPhone.trim(),
      itemsCount: posCart.reduce((acc, cur) => acc + cur.quantity, 0),
      total: posTotal,
      paymentMethod: posPaymentMethod,
      items: posCart.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        qty: item.quantity,
        price: item.product.price,
      })),
      stockLines,
    };
    setPosHistory([newTx, ...posHistory]);
    setPosReceiptModal(newTx);
    setPosCart([]);
    setPosCustomerName('');
    setPosCustomerPhone('');
  };

  // Login handler
  const handleLogin = () => {
    if (loginEmail.trim().toLowerCase() === adminEmail.toLowerCase() && loginPassword === adminPassword) {
      setSignedInSubAdmin(null);
      setIsLoggedIn(true);
      setLoginError('');
      setActiveTab('dashboard');
      return;
    } else {
      const subAdmin = demoSubAdmins.find((account) => account.email.toLowerCase() === loginEmail.trim().toLowerCase() && account.password === loginPassword);
      if (subAdmin) {
        setSignedInSubAdmin(subAdmin);
        setIsLoggedIn(true);
        setLoginError('');
        setActiveTab(subAdmin.permissions[0] ?? 'product-list');
        return;
      }
      setLoginError('Invalid credentials. Please try again.');
    }
  };

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div
        className="min-h-screen bg-[#F3F6FA] flex items-center justify-center p-4 antialiased"
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        }}
      >
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#2F6BFF] to-[#5A8BFF] text-white flex items-center justify-center mx-auto shadow-xl shadow-[#2F6BFF]/20 mb-5">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-[#0E1A2B]">Demo Hub</h1>
            <p className="text-[13px] text-[#6F7E92] font-semibold mt-1">E-Commerce Admin Control Suite</p>
          </div>

          {/* Login Card */}
          <div className="bg-white border border-[#E3E8EF] rounded-[32px] p-8 shadow-sm">
            <h2 className="text-xl font-bold text-[#0E1A2B] mb-6">Sign in to Admin Panel</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-extrabold text-[#6F7E92] uppercase tracking-wider mb-2">Email Address</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => { setLoginEmail(e.target.value); setLoginError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder={adminEmail}
                  className="w-full px-5 py-3.5 bg-[#F3F6FA] border border-[#E3E8EF] rounded-2xl text-[14px] text-[#0E1A2B] focus:outline-none focus:bg-white focus:border-[#2F6BFF] transition-all font-semibold placeholder:text-[#A9B4C2]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-extrabold text-[#6F7E92] uppercase tracking-wider mb-2">Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => { setLoginPassword(e.target.value); setLoginError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="••••••"
                  className="w-full px-5 py-3.5 bg-[#F3F6FA] border border-[#E3E8EF] rounded-2xl text-[14px] text-[#0E1A2B] focus:outline-none focus:bg-white focus:border-[#2F6BFF] transition-all font-semibold placeholder:text-[#A9B4C2]"
                />
              </div>

              {loginError && (
                <p className="text-red-500 text-[13px] font-bold bg-red-50 px-4 py-2.5 rounded-xl">{loginError}</p>
              )}

              <button
                onClick={handleLogin}
                className="w-full py-3.5 bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white font-extrabold text-[14px] rounded-2xl shadow-md shadow-[#2F6BFF]/20 hover:shadow-lg hover:shadow-[#2F6BFF]/30 transition-all active:scale-[0.98]"
              >
                Sign In
              </button>
            </div>

            {/* Credentials Hint */}
            <div
              onClick={() => {
                setLoginEmail(adminEmail);
                setLoginPassword(adminPassword);
                setLoginError('');
              }}
              className="mt-6 p-4 bg-[#F3F6FA] hover:bg-[#EAF1FF] border border-transparent hover:border-[#2F6BFF]/30 rounded-2xl cursor-pointer transition-all group"
            >
              <p className="text-[11px] font-extrabold text-[#6F7E92] group-hover:text-[#2F6BFF] uppercase tracking-wider mb-2 transition-colors">Demo Credentials</p>
              <div className="space-y-1">
                <p className="text-[13px] font-semibold text-[#5B6B80]">Email: <span className="font-bold text-[#0E1A2B] group-hover:text-[#2F6BFF]">{adminEmail}</span></p>
                <p className="text-[13px] font-semibold text-[#5B6B80]">Password: <span className="font-bold text-[#0E1A2B] group-hover:text-[#2F6BFF]">{adminPassword}</span></p>
              </div>
            </div>
            {demoSubAdmins.length > 0 && (
              <div className="mt-3 p-4 rounded-2xl border border-[#E3E8EF] bg-white">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#6F7E92]">Demo sub-admin logins</p>
                <div className="mt-2 space-y-2">
                  {demoSubAdmins.map((account) => <button key={account.id} onClick={() => { setLoginEmail(account.email); setLoginPassword(account.password); setLoginError(''); }} className="w-full text-left rounded-xl p-2.5 hover:bg-[#EAF1FF]">
                    <span className="block text-sm font-bold text-[#0E1A2B]">{account.name}</span><span className="block text-xs text-[#5B6B80]">{account.email} · {account.permissions.length} modules · click to fill</span>
                  </button>)}
                </div>
              </div>
            )}
          </div>

          {/* Back link */}
          <div className="text-center mt-6">
            <button
              onClick={() => window.location.href = '/'}
              className="text-[13px] font-bold text-[#6F7E92] hover:text-[#2F6BFF] transition-colors"
            >
              ← Back to Portal Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (signedInSubAdmin && !signedInSubAdmin.permissions.includes(activeTab)) {
    return (
      <div className="min-h-screen bg-[#F3F6FA] flex items-center justify-center p-6">
        <section className="max-w-lg w-full rounded-[28px] bg-white border border-[#E3E8EF] p-8 text-center shadow-sm">
<p className="flex justify-center text-[#2F6BFF]"><PanelIcon name="lock" size={34} /></p>
          <h1 className="mt-4 text-2xl font-black">This section isn&apos;t assigned to you</h1>
          <p className="mt-2 text-sm text-[#5B6B80]">Signed in as {signedInSubAdmin.name}. Your demo access is limited to the modules selected by the super admin.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {signedInSubAdmin.permissions.map((permission) => <button key={permission} onClick={() => setActiveTab(permission)} className="px-4 py-2 rounded-full bg-[#EAF1FF] text-[#1F55E0] text-sm font-bold">{TAB_TITLES[permission]}</button>)}
          </div>
          <button onClick={() => { setIsLoggedIn(false); setSignedInSubAdmin(null); setLoginPassword(''); }} className="mt-7 px-5 py-2.5 rounded-full bg-[#0E1A2B] text-white text-sm font-bold">Sign out</button>
        </section>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#F3F6FA] text-[#0E1A2B] flex antialiased selection:bg-[#DCE7FF] selection:text-[#2F6BFF]"
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden" onClick={() => setIsMobileSidebarOpen(false)} />
      )}

      {/* Sidebar Navigation - Clean Inline, No Section Titles */}
      <aside className={`w-[280px] min-w-[280px] bg-gradient-to-b from-[#13233A] via-[#0E1A2B] to-[#0B1524] border-r border-white/[0.06] flex flex-col justify-between h-screen shadow-[4px_0_32px_rgba(0,0,0,0.18)] z-40 transition-transform duration-300 ${isMobileSidebarOpen ? 'fixed top-0 bottom-0 left-0 translate-x-0' : 'fixed top-0 bottom-0 left-0 -translate-x-full md:translate-x-0 md:sticky md:top-0'
        }`}>
        <div className="space-y-2 overflow-y-auto px-4 pt-8 pb-4 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.14)_transparent]">
          {/* Brand Header */}
          <div className="flex flex-col items-center text-center pb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#2F6BFF] to-[#5A8BFF] text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-[#2F6BFF]/30 ring-1 ring-white/10 mb-3 transform hover:scale-105 transition-transform">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white">Commerce Hub</h2>
            <p className="text-[10px] text-[#8FB0FF]/80 mt-0.5 font-extrabold uppercase tracking-[0.2em]">
              Admin Control Suite
            </p>
          </div>

          <nav className="space-y-1 text-[14px]">
            {/* Dashboard */}
            {canSeeAdminTab('dashboard') && <button
              onClick={() => { setActiveTab('dashboard'); setIsMobileSidebarOpen(false); }}
              className={`w-full text-left px-5 py-3 rounded-full transition-all duration-300 flex justify-between items-center ${activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white font-bold shadow-lg shadow-[#2F6BFF]/30'
                : 'text-[#A9B4C2] font-semibold hover:bg-white/[0.06] hover:text-white'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 flex items-center justify-center opacity-70"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg></span>
                <span>Dashboard</span>
              </div>
              {activeTab === 'dashboard' && <span className="text-white/80 text-lg leading-none">•</span>}
            </button>}

            {/* Products Dropdown */}
            {(['add-product', 'product-list', 'inventory', 'attributes'] as AdminTab[]).some(canSeeAdminTab) && <div className="space-y-1">
              <button
                onClick={() => setIsProductsDropdownOpen(!isProductsDropdownOpen)}
                className="w-full text-left px-5 py-3 rounded-full text-[#F6F8FB] font-bold hover:bg-white/[0.06] transition-all flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 flex items-center justify-center opacity-70"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg></span>
                  <span>Products</span>
                </div>
                <span className={`text-[12px] text-[#6F7E92] transition-transform duration-200 ${isProductsDropdownOpen ? 'rotate-180' : ''}`}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg></span>
              </button>

              {isProductsDropdownOpen && (
                <div className="pl-6 space-y-1 pt-1 border-l-2 border-white/[0.08] ml-5">
                  {canSeeAdminTab('add-product') && <button
                    onClick={() => { openAddProduct(); setIsMobileSidebarOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 rounded-full text-[13px] transition-all flex items-center gap-2.5 ${activeTab === 'add-product'
                      ? 'bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white font-bold shadow-sm'
                      : 'text-[#A9B4C2] font-semibold hover:bg-white/[0.06] hover:text-white'
                      }`}
                  >
                    <span className="w-4 h-4 flex items-center justify-center opacity-70"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg></span>
                    <span>Add Product</span>
                  </button>}
                  {canSeeAdminTab('product-list') && <button
                    onClick={() => { setActiveTab('product-list'); setIsMobileSidebarOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 rounded-full text-[13px] transition-all flex items-center justify-between ${activeTab === 'product-list'
                      ? 'bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white font-bold shadow-sm'
                      : 'text-[#A9B4C2] font-semibold hover:bg-white/[0.06] hover:text-white'
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-4 h-4 flex items-center justify-center opacity-70"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg></span>
                      <span>Product List</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${activeTab === 'product-list' ? 'bg-white/20 text-white' : 'bg-white/[0.08] text-[#C9D2DD]'}`}>{products.length}</span>
                  </button>}
                  {canSeeAdminTab('inventory') && <button
                    onClick={() => { setActiveTab('inventory'); setIsMobileSidebarOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 rounded-full text-[13px] transition-all flex items-center justify-between ${activeTab === 'inventory'
                      ? 'bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white font-bold shadow-sm'
                      : 'text-[#A9B4C2] font-semibold hover:bg-white/[0.06] hover:text-white'
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-4 h-4 flex items-center justify-center opacity-70"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg></span>
                      <span>Inventory</span>
                    </div>
                    {products.some((p) => p.status !== 'In Stock') && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${activeTab === 'inventory' ? 'bg-white/20 text-white' : 'bg-red-500/15 text-red-300'}`}>{products.filter((p) => p.status !== 'In Stock').length}</span>
                    )}
                  </button>}
                  {canSeeAdminTab('attributes') && <button
                    onClick={() => { setActiveTab('attributes'); setIsMobileSidebarOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 rounded-full text-[13px] transition-all flex items-center gap-2.5 ${activeTab === 'attributes'
                      ? 'bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white font-bold shadow-sm'
                      : 'text-[#A9B4C2] font-semibold hover:bg-white/[0.06] hover:text-white'
                      }`}
                  >
                    <span className="w-4 h-4 flex items-center justify-center opacity-70"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="2.5" /><circle cx="19" cy="13" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="10" cy="19" r="2.5" /></svg></span>
                    <span>Sizes, Colors & Tags</span>
                  </button>}
                </div>
              )}
            </div>}

            {/* Categories Dropdown */}
            {(['category', 'sub-category', 'sub-sub-category'] as AdminTab[]).some(canSeeAdminTab) && <div className="space-y-1">
              <button
                onClick={() => setIsCategoriesDropdownOpen(!isCategoriesDropdownOpen)}
                className="w-full text-left px-5 py-3 rounded-full text-[#F6F8FB] font-bold hover:bg-white/[0.06] transition-all flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 flex items-center justify-center opacity-70"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg></span>
                  <span>Categories</span>
                </div>
                <span className={`text-[12px] text-[#6F7E92] transition-transform duration-200 ${isCategoriesDropdownOpen ? 'rotate-180' : ''}`}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg></span>
              </button>

              {isCategoriesDropdownOpen && (
                <div className="pl-6 space-y-1 pt-1 border-l-2 border-white/[0.08] ml-5">
                  {([
                    { id: 'category', label: 'Category', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg> },
                    { id: 'sub-category', label: 'Sub Category', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" /><path d="M2 10h20" /></svg> },
                    { id: 'sub-sub-category', label: 'Sub Sub Categories', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg> },
                  ] satisfies { id: AdminTab; label: string; icon: React.ReactNode }[]).filter((item) => canSeeAdminTab(item.id)).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); setIsMobileSidebarOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 rounded-full text-[13px] transition-all flex items-center gap-2.5 ${activeTab === item.id
                        ? 'bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white font-bold shadow-sm'
                        : 'text-[#A9B4C2] font-semibold hover:bg-white/[0.06] hover:text-white'
                        }`}
                    >
                      <span className="w-4 h-4 flex items-center justify-center opacity-70">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>}

            {/* Coupons */}
            {canSeeAdminTab('coupons') && <button
              onClick={() => { setActiveTab('coupons'); setIsMobileSidebarOpen(false); }}
              className={`w-full text-left px-5 py-3 rounded-full transition-all flex justify-between items-center ${activeTab === 'coupons'
                ? 'bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white font-bold shadow-lg shadow-[#2F6BFF]/30'
                : 'text-[#A9B4C2] font-semibold hover:bg-white/[0.06] hover:text-white'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 flex items-center justify-center opacity-70"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg></span>
                <span>Coupons</span>
              </div>
              {activeTab === 'coupons' && <span className="text-white/80 text-lg leading-none">•</span>}
            </button>}

            {/* Orders */}
            {canSeeAdminTab('orders') && <button
              onClick={() => { setActiveTab('orders'); setIsMobileSidebarOpen(false); }}
              className={`w-full text-left px-5 py-3 rounded-full transition-all flex justify-between items-center ${activeTab === 'orders'
                ? 'bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white font-bold shadow-lg shadow-[#2F6BFF]/30'
                : 'text-[#A9B4C2] font-semibold hover:bg-white/[0.06] hover:text-white'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 flex items-center justify-center opacity-70"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg></span>
                <span>Orders</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${activeTab === 'orders' ? 'bg-white/20 text-white' : 'bg-[#2F6BFF]/20 text-[#A9C2FF]'}`}>{orders.length}</span>
            </button>}

            {/* Customers */}
            {canSeeAdminTab('customers') && <button
              onClick={() => { setActiveTab('customers'); setIsMobileSidebarOpen(false); }}
              className={`w-full text-left px-5 py-3 rounded-full transition-all flex justify-between items-center ${activeTab === 'customers'
                ? 'bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white font-bold shadow-lg shadow-[#2F6BFF]/30'
                : 'text-[#A9B4C2] font-semibold hover:bg-white/[0.06] hover:text-white'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 flex items-center justify-center opacity-70"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg></span>
                <span>Customers</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${activeTab === 'customers' ? 'bg-white/20 text-white' : 'bg-white/[0.08] text-[#C9D2DD]'}`}>{customers.length}</span>
            </button>}

            {/* POS Dropdown */}
            {(['pos-terminal', 'pos-history'] as AdminTab[]).some(canSeeAdminTab) && <div className="space-y-1">
              <button
                onClick={() => setIsPosDropdownOpen(!isPosDropdownOpen)}
                className="w-full text-left px-5 py-3 rounded-full text-[#F6F8FB] font-bold hover:bg-white/[0.06] transition-all flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 flex items-center justify-center opacity-70"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg></span>
                  <span>POS Terminal</span>
                </div>
                <span className={`text-[12px] text-[#6F7E92] transition-transform duration-200 ${isPosDropdownOpen ? 'rotate-180' : ''}`}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg></span>
              </button>

              {isPosDropdownOpen && (
                <div className="pl-6 space-y-1 pt-1 border-l-2 border-white/[0.08] ml-5">
                  {canSeeAdminTab('pos-terminal') && <button
                    onClick={() => { setActiveTab('pos-terminal'); setIsMobileSidebarOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 rounded-full text-[13px] transition-all flex items-center gap-2.5 ${activeTab === 'pos-terminal'
                      ? 'bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white font-bold shadow-sm'
                      : 'text-[#A9B4C2] font-semibold hover:bg-white/[0.06] hover:text-white'
                      }`}
                  >
                    <span className="w-4 h-4 flex items-center justify-center opacity-70"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg></span>
                    <span>Live Register</span>
                  </button>}
                  {canSeeAdminTab('pos-history') && <button
                    onClick={() => { setActiveTab('pos-history'); setIsMobileSidebarOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 rounded-full text-[13px] transition-all flex items-center justify-between ${activeTab === 'pos-history'
                      ? 'bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white font-bold shadow-sm'
                      : 'text-[#A9B4C2] font-semibold hover:bg-white/[0.06] hover:text-white'
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-4 h-4 flex items-center justify-center opacity-70"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg></span>
                      <span>POS History</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${activeTab === 'pos-history' ? 'bg-white/20 text-white' : 'bg-white/[0.08] text-[#C9D2DD]'}`}>{posHistory.length}</span>
                  </button>}
                </div>
              )}
            </div>}

            {/* Storefront Dropdown */}
            {(['banners', 'instagram'] as AdminTab[]).some(canSeeAdminTab) && <div className="space-y-1">
              <button
                onClick={() => setIsStorefrontDropdownOpen(!isStorefrontDropdownOpen)}
                className="w-full text-left px-5 py-3 rounded-full text-[#F6F8FB] font-bold hover:bg-white/[0.06] transition-all flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 flex items-center justify-center opacity-70"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l1-5h16l1 5" /><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /><path d="M5 12v8h14v-8" /></svg></span>
                  <span>Storefront</span>
                </div>
                <span className={`text-[12px] text-[#6F7E92] transition-transform duration-200 ${isStorefrontDropdownOpen ? 'rotate-180' : ''}`}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg></span>
              </button>

              {isStorefrontDropdownOpen && (
                <div className="pl-6 space-y-1 pt-1 border-l-2 border-white/[0.08] ml-5">
                  {([
                    { id: 'banners', label: 'Hero Banners', count: banners.length, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg> },
                    { id: 'instagram', label: 'Instagram Feed', count: instagramPosts.length, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg> },
                  ] satisfies { id: AdminTab; label: string; count: number; icon: React.ReactNode }[]).filter((item) => canSeeAdminTab(item.id)).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); setIsMobileSidebarOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 rounded-full text-[13px] transition-all flex items-center justify-between ${activeTab === item.id
                        ? 'bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white font-bold shadow-sm'
                        : 'text-[#A9B4C2] font-semibold hover:bg-white/[0.06] hover:text-white'
                        }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-4 h-4 flex items-center justify-center opacity-70">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${activeTab === item.id ? 'bg-white/20 text-white' : 'bg-white/[0.08] text-[#C9D2DD]'}`}>{item.count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>}

            {/* Videos */}
            {canSeeAdminTab('videos') && <button
              onClick={() => { setActiveTab('videos'); setIsMobileSidebarOpen(false); }}
              className={`w-full text-left px-5 py-3 rounded-full transition-all flex justify-between items-center ${activeTab === 'videos'
                ? 'bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white font-bold shadow-lg shadow-[#2F6BFF]/30'
                : 'text-[#A9B4C2] font-semibold hover:bg-white/[0.06] hover:text-white'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 flex items-center justify-center opacity-70"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg></span>
                <span>Videos</span>
              </div>
              {activeTab === 'videos' && <span className="text-white/80 text-lg leading-none">•</span>}
            </button>}

            {/* Theme Setup */}
            {canSeeAdminTab('themes') && <button
              onClick={() => { setActiveTab('themes'); setIsMobileSidebarOpen(false); }}
              className={`w-full text-left px-5 py-3 rounded-full transition-all flex justify-between items-center ${activeTab === 'themes'
                ? 'bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white font-bold shadow-lg shadow-[#2F6BFF]/30'
                : 'text-[#A9B4C2] font-semibold hover:bg-white/[0.06] hover:text-white'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 flex items-center justify-center opacity-70"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a10 10 0 1 1 10-10c0 2.8-2.2 4-4 4h-2a2 2 0 0 0-1.5 3.3A2 2 0 0 1 12 22z" /><circle cx="7.5" cy="10.5" r="1" /><circle cx="12" cy="7.5" r="1" /><circle cx="16.5" cy="10.5" r="1" /></svg></span>
                <span>Theme Setup</span>
              </div>
              {activeTab === 'themes' && <span className="text-white/80 text-lg leading-none">•</span>}
            </button>}

            {/* Store Details */}
            {canSeeAdminTab('store-details') && <button
              onClick={() => { setActiveTab('store-details'); setIsMobileSidebarOpen(false); }}
              className={`w-full text-left px-5 py-3 rounded-full transition-all flex justify-between items-center ${activeTab === 'store-details'
                ? 'bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white font-bold shadow-lg shadow-[#2F6BFF]/30'
                : 'text-[#A9B4C2] font-semibold hover:bg-white/[0.06] hover:text-white'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 flex items-center justify-center opacity-70"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l1-5h16l1 5" /><path d="M4 9v11h16V9" /><path d="M9 20v-6h6v6" /></svg></span>
                <span>Store Details</span>
              </div>
              {activeTab === 'store-details' && <span className="text-white/80 text-lg leading-none">•</span>}
            </button>}

            {/* Reports */}
            {canSeeAdminTab('reports') && <button
              onClick={() => { setActiveTab('reports'); setIsMobileSidebarOpen(false); }}
              className={`w-full text-left px-5 py-3 rounded-full transition-all flex justify-between items-center ${activeTab === 'reports'
                ? 'bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white font-bold shadow-lg shadow-[#2F6BFF]/30'
                : 'text-[#A9B4C2] font-semibold hover:bg-white/[0.06] hover:text-white'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 flex items-center justify-center opacity-70"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg></span>
                <span>Reports</span>
              </div>
              {activeTab === 'reports' && <span className="text-white/80 text-lg leading-none">•</span>}
            </button>}

            {/* Admin Security */}
            {!signedInSubAdmin && <button
              onClick={() => { setActiveTab('settings'); setIsMobileSidebarOpen(false); }}
              className={`w-full text-left px-5 py-3 rounded-full transition-all flex justify-between items-center ${activeTab === 'settings'
                ? 'bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white font-bold shadow-lg shadow-[#2F6BFF]/30'
                : 'text-[#A9B4C2] font-semibold hover:bg-white/[0.06] hover:text-white'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 flex items-center justify-center opacity-70"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg></span>
                <span>Admin Security</span>
              </div>
              {activeTab === 'settings' && <span className="text-white/80 text-lg leading-none">•</span>}
            </button>}
          </nav>
        </div>

        {/* Sidebar Footer / Exit */}
        <div className="p-4 border-t border-white/[0.08]">
          <button
            onClick={() => setIsLoggedIn(false)}
            className="w-full py-3 px-4 bg-white/[0.05] hover:bg-gradient-to-r hover:from-[#2F6BFF] hover:to-[#5A8BFF] text-[#8FB0FF] hover:text-white font-bold rounded-full text-[13px] transition-all text-center border border-white/10 hover:border-transparent flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            <span>Log Out Securely</span>
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 p-4 pt-16 md:pt-6 md:p-10 lg:p-12 overflow-y-auto max-h-screen">
        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="fixed top-4 left-4 z-20 md:hidden w-10 h-10 bg-white border border-[#E3E8EF] rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0E1A2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isMobileSidebarOpen ? (
              <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
            ) : (
              <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
            )}
          </svg>
        </button>
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Top Header Breadcrumb */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E3E8EF]">
            <div>
              <div className="flex items-center gap-2 text-[12px] font-extrabold text-[#6F7E92] uppercase tracking-wider mb-1">
                <span>E-Commerce</span>
                <span>/</span>
                <span className="text-[#2F6BFF] capitalize">{activeTab.replaceAll('-', ' ')}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#0E1A2B] capitalize">
                {activeTab === 'add-product' && editingProductId ? 'Edit Product' : TAB_TITLES[activeTab]}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="/adminpanel/store"
                target="_blank"
                rel="noopener"
                title="Open the storefront in a new tab — changes here appear there instantly"
                className="px-4 py-2 bg-white border border-[#E3E8EF] hover:border-[#2F6BFF] text-[#0E1A2B] rounded-full text-[13px] font-bold shadow-sm flex items-center gap-2 transition-all"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                View Website ↗
              </a>
              {/* Only show Quick Scan for Products and POS */}
              {(activeTab === 'product-list' || activeTab === 'pos-terminal') && (
                <button
                  onClick={() => (activeTab === 'pos-terminal' ? setIsPosCameraOpen(true) : handleTriggerScanner())}
                  className="px-5 py-2 bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white font-bold text-[13px] rounded-full shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <span className="flex items-center justify-center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h2v14H3z M7 5h1v14H7z M11 5h2v14h-2z M15 5h1v14h-1z M19 5h2v14h-2z" /></svg></span>
                  <span>Quick Scan</span>
                </button>
              )}
            </div>
          </header>

          {/* ========================================================================= */}
          {/* 1. DASHBOARD TAB */}
          {/* ========================================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, sub: `Website ₹${websiteRevenue.toLocaleString('en-IN')} • POS ₹${posRevenue.toLocaleString('en-IN')}`, color: 'text-[#10b981]', icon: 'money' },
                  { label: 'Active Orders', value: orders.filter((o) => o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled').length.toString(), sub: `${orders.filter((o) => o.orderStatus === 'Pending' || o.orderStatus === 'Processing').length} require dispatch`, color: 'text-[#2F6BFF]', icon: 'box' },
                  { label: 'Total Products', value: products.length.toString(), sub: `Across ${categories.length} categories`, color: 'text-[#0E1A2B]', icon: 'tag' },
                  { label: 'Low Stock Alerts', value: products.filter((p) => p.status !== 'In Stock').length.toString(), sub: `${products.filter((p) => p.status === 'Out of Stock').length} sold out • restock recommended`, color: 'text-[#ef4444]', icon: 'warning' },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="bg-white border border-[#E3E8EF] p-7 rounded-[32px] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-[12px] font-extrabold text-[#6F7E92] uppercase tracking-wider">{stat.label}</p>
                      <span className="text-xl p-2 bg-[#F3F6FA] rounded-xl"><PanelIcon name={stat.icon as 'money' | 'box' | 'tag' | 'warning'} /></span>
                    </div>
                    <p className={`text-3xl font-black tracking-tight ${stat.color}`}>{stat.value}</p>
                    <p className="text-[12px] text-[#5B6B80] font-semibold mt-2">{stat.sub}</p>
                  </div>
                ))}
              </div>

              {/* Store Catalog Statistics (live, shared with the storefront) */}
              <div className="bg-white border border-[#E3E8EF] rounded-[36px] p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-[#0E1A2B]">Store Catalog</h3>
                    <p className="text-[13px] text-[#6F7E92] font-semibold mt-1">What shoppers see on the website right now</p>
                  </div>
                  <span className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[12px] font-extrabold flex items-center gap-2 w-fit">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live sync with storefront
                  </span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {([
                    { label: 'Categories', value: categories.filter((c) => c.status === 'Active').length, sub: `${subCategories.length} sub • ${subSubCategories.length} level 3`, tab: 'category', icon: 'folder' },
                    { label: 'Hero Banners', value: banners.filter((b) => b.isActive).length, sub: `${banners.length} total slides`, tab: 'banners', icon: 'image' },
                    { label: 'Instagram Feed', value: instagramPosts.length, sub: 'Posts on the home page', tab: 'instagram', icon: 'instagram' },
                    { label: 'Sizes, Colors & Tags', value: sizeOptions.length + colorOptions.length + tagOptions.length, sub: `${sizeOptions.length} sizes • ${colorOptions.length} colors • ${tagOptions.length} tags`, tab: 'attributes', icon: 'palette' },
                  ] satisfies { label: string; value: number; sub: string; tab: AdminTab; icon: 'folder' | 'image' | 'instagram' | 'palette' }[]).map((tile) => (
                    <button
                      key={tile.label}
                      onClick={() => setActiveTab(tile.tab)}
                      className="p-5 bg-[#F3F6FA] hover:bg-[#EAF1FF] border border-[#E3E8EF] hover:border-[#2F6BFF] rounded-[24px] text-left transition-all group"
                    >
                      <div className="flex justify-between items-start">
                        <p className="text-3xl font-black tracking-tight text-[#0E1A2B] group-hover:text-[#2F6BFF]">{tile.value}</p>
                        <span className="text-[#2F6BFF]"><PanelIcon name={tile.icon} size={22} /></span>
                      </div>
                      <p className="text-[12px] font-extrabold text-[#0E1A2B] uppercase tracking-wider mt-2">{tile.label}</p>
                      <p className="text-[11px] text-[#6F7E92] font-semibold mt-0.5">{tile.sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Actions & Recent Orders Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Orders Overview */}
                <div className="lg:col-span-2 bg-white border border-[#E3E8EF] rounded-[36px] p-8 space-y-6 shadow-sm">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold tracking-tight text-[#0E1A2B]">Recent Customer Orders</h3>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-[#2F6BFF] text-[13px] font-bold hover:underline"
                    >
                      View All Orders →
                    </button>
                  </div>

                  <div className="space-y-3">
                    {orders.slice(0, 3).map((ord) => (
                      <div
                        key={ord.id}
                        className="p-5 bg-[#F3F6FA] border border-[#E3E8EF] rounded-[24px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-white hover:shadow-sm transition-all"
                      >
                        <div>
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono font-bold text-[#2F6BFF] text-[13px]">{ord.orderNumber}</span>
                            <span className="text-[#6F7E92]">•</span>
                            <span className="font-bold text-[#0E1A2B] text-[14px]">{ord.customerName}</span>
                          </div>
                          <p className="text-[12px] text-[#5B6B80] font-semibold mt-1">
                            {ord.itemsCount} item(s) via {ord.paymentMethod}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-black text-[#0E1A2B] text-[15px]">₹{ord.total.toLocaleString()}</span>
                          <span
                            className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${ord.orderStatus === 'Delivered'
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : ord.orderStatus === 'Shipped'
                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                : 'bg-amber-100 text-amber-700 border border-amber-200'
                              }`}
                          >
                            {ord.orderStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Catalog Actions */}
                <div className="bg-white border border-[#E3E8EF] rounded-[36px] p-8 space-y-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-[#0E1A2B] mb-4">Quick Operations</h3>
                    <div className="space-y-3">
                      <button
                        onClick={openAddProduct}
                        className="w-full p-4 bg-[#F3F6FA] hover:bg-[#EAF1FF] border border-[#E3E8EF] hover:border-[#2F6BFF] rounded-2xl text-left transition-all group flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <PanelIcon name="plus" size={20} />
                          <div>
                            <span className="font-bold text-[#0E1A2B] group-hover:text-[#2F6BFF] block text-[14px]">
                              Add Single Product
                            </span>
                            <span className="text-[11px] text-[#6F7E92]">New inventory item form</span>
                          </div>
                        </div>
                        <span className="text-[#6F7E92] group-hover:text-[#2F6BFF]">→</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('product-list');
                          setIsMultiProductModalOpen(true);
                        }}
                        className="w-full p-4 bg-[#F3F6FA] hover:bg-[#EAF1FF] border border-[#E3E8EF] hover:border-[#2F6BFF] rounded-2xl text-left transition-all group flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <PanelIcon name="file" size={20} />
                          <div>
                            <span className="font-bold text-[#0E1A2B] group-hover:text-[#2F6BFF] block text-[14px]">
                              Bulk Multi-Product Add
                            </span>
                            <span className="text-[11px] text-[#6F7E92]">Import multiple items</span>
                          </div>
                        </div>
                        <span className="text-[#6F7E92] group-hover:text-[#2F6BFF]">→</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('pos-terminal')}
                        className="w-full p-4 bg-[#F3F6FA] hover:bg-[#EAF1FF] border border-[#E3E8EF] hover:border-[#2F6BFF] rounded-2xl text-left transition-all group flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <PanelIcon name="monitor" size={20} />
                          <div>
                            <span className="font-bold text-[#0E1A2B] group-hover:text-[#2F6BFF] block text-[14px]">
                              Open POS Terminal
                            </span>
                            <span className="text-[11px] text-[#6F7E92]">In-store checkout & receipt</span>
                          </div>
                        </div>
                        <span className="text-[#6F7E92] group-hover:text-[#2F6BFF]">→</span>
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('coupons')}
                    className="w-full p-4 bg-[#EAF1FF]/60 border border-[#C9D9FF]/60 rounded-2xl text-center hover:bg-[#EAF1FF] transition-all"
                  >
                    <p className="text-[11px] font-bold text-[#2F6BFF] uppercase tracking-wider">
                      {headerCoupons.length ? 'Coupon Shown in Store Header' : 'No Coupon in Store Header'}
                    </p>
                    <p className="text-[13px] font-black text-[#0E1A2B] mt-0.5">
                      {headerCoupons.length
                        ? headerCoupons.map((c) => `${c.code} (${c.discountType === 'Percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`})`).join(' • ')
                        : 'Pick one in Coupons →'}
                    </p>
                  </button>
                </div>
              </div>

              {/* Sales Performance Chart */}
              <div className="bg-white border border-[#E3E8EF] rounded-[36px] p-8 shadow-sm">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-[#0E1A2B]">Sales Performance</h3>
                    <p className="text-[13px] text-[#6F7E92] font-semibold mt-1">Revenue over the last 7 days</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] font-extrabold text-[#2F6BFF] uppercase tracking-wider">Total</p>
                    <p className="text-2xl font-black text-[#0E1A2B]">₹{totalRevenue.toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <div className="h-64 flex items-end justify-between gap-2 px-2 mt-4">
                  {[45, 60, 35, 80, 50, 95, 75].map((h, i) => (
                    <div key={i} className="w-full bg-[#F3F6FA] rounded-t-xl relative group h-full flex items-end">
                      <div
                        className="w-full bg-gradient-to-t from-[#2F6BFF] to-[#5A8BFF] rounded-t-xl opacity-80 group-hover:opacity-100 transition-opacity"
                        style={{ height: `${h}%` }}
                      ></div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-4 text-[11px] font-extrabold text-[#6F7E92] uppercase tracking-wider px-2">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. ADD PRODUCT TAB */}
          {/* ========================================================================= */}
          {activeTab === 'add-product' && (() => {
            const chosenSizes = sizeOptions.map((s) => s.code).filter((code) => newProdSizes.includes(code));
            const chosenColors = colorOptions.map((c) => c.name).filter((name) => newProdColors.includes(name));
            const totalStock = buildVariantStock(chosenSizes, chosenColors, newProdVariantStock).stock;
            const price = parseFloat(newProdPrice);
            const mrp = parseFloat(newProdMrp);
            const discount = mrp > price && price > 0 ? Math.round((1 - price / mrp) * 100) : 0;
            const backToProducts = () => { resetProductForm(); setActiveTab('product-list'); };
            return (
              <div className={K.page}>
                <div className="max-w-6xl mx-auto space-y-6">
                  {/* Page intro */}
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                      <button type="button" onClick={backToProducts} className={`text-xs ${K.link}`}>← Back to products</button>
                      <h1 className={`${K.serif} text-2xl sm:text-3xl text-[#0E1A2B] mt-2`}>{editingProductId ? 'Refine your product' : 'Create a new product'}</h1>
                      <p className="text-sm text-[#6F7E92] mt-1">Add details, allocate stock by size and colour, and upload photos for each colour.</p>
                    </div>
                    {!editingProductId && (
                      <button type="button" onClick={() => setIsMultiProductModalOpen(true)} className="self-start sm:self-auto px-4 py-2.5 bg-white border border-[#E3E8EF] hover:border-[#2F6BFF] rounded-lg text-xs font-semibold text-[#0E1A2B] whitespace-nowrap transition-colors">
                        Bulk add multiple
                      </button>
                    )}
                  </div>

                  <form id="product-form" onSubmit={handleSaveProduct} className="grid grid-cols-1 xl:grid-cols-2 gap-6 text-sm">
                    {/* ===== Product details ===== */}
                    <section className={`${K.card} min-w-0`}>
                      <h2 className={`${K.serif} text-xl text-[#0E1A2B]`}>Product details</h2>
                      <div>
                        <label htmlFor="prod-name" className={K.label}>Name</label>
                        <input id="prod-name" type="text" required value={newProdName} onChange={(e) => setNewProdName(e.target.value)} placeholder="e.g. Heritage Gold Necklace" className={K.input} />
                      </div>
                      <div>
                        <label htmlFor="prod-desc" className={K.label}>Description</label>
                        <textarea id="prod-desc" rows={3} value={newProdDescription} onChange={(e) => setNewProdDescription(e.target.value)} placeholder="Key features, battery life, what's in the box…" className={K.input} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="prod-price" className={K.label}>Price (INR ₹)</label>
                          <input id="prod-price" type="number" min="0" required value={newProdPrice} onChange={(e) => setNewProdPrice(e.target.value)} placeholder="14999" className={K.input} />
                        </div>
                        <div>
                          <label htmlFor="prod-mrp" className={K.label}>Original Price (MRP)</label>
                          <input id="prod-mrp" type="number" min="0" value={newProdMrp} onChange={(e) => setNewProdMrp(e.target.value)} placeholder="19999" className={K.input} />
                        </div>
                      </div>
                      {discount > 0 && <p className="-mt-2 text-xs text-emerald-700">Shoppers will see {discount}% off.</p>}
                      <div>
                        <label htmlFor="prod-cat" className={K.label}>Category</label>
                        <select id="prod-cat" value={newProdCategory} onChange={(e) => handleProductCategoryChange(e.target.value)} className={`${K.input} cursor-pointer`}>
                          {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="prod-sub" className={K.label}>Sub category</label>
                          <select id="prod-sub" value={newProdSubCategory} onChange={(e) => { setNewProdSubCategory(e.target.value); setNewProdSubSubCategory(''); }} className={`${K.input} cursor-pointer`}>
                            {subCategories.filter((sc) => sc.parentCategory === newProdCategory).map((sc) => <option key={sc.id} value={sc.name}>{sc.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="prod-subsub" className={K.label}>Sub sub category</label>
                          <select id="prod-subsub" value={newProdSubSubCategory} onChange={(e) => setNewProdSubSubCategory(e.target.value)} className={`${K.input} cursor-pointer`}>
                            <option value="">None</option>
                            {subSubCategories.filter((ssc) => ssc.parentSubCategory === newProdSubCategory).map((ssc) => <option key={ssc.id} value={ssc.name}>{ssc.name}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <label htmlFor="prod-sku" className={K.label}>SKU / Barcode</label>
                          <button type="button" onClick={() => setNewProdSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`)} className={`mb-1 text-xs ${K.link}`}>Generate</button>
                        </div>
                        <input id="prod-sku" type="text" required value={newProdSku} onChange={(e) => setNewProdSku(e.target.value)} placeholder="e.g. WNC-HP-01" className={`${K.input} font-mono uppercase placeholder:normal-case`} />
                        {newProdSku.trim() && (
                          <div className="mt-3 rounded-xl border border-[#E3E8EF] bg-[#F6F8FB] p-3 text-center">
                            <div className="bg-white p-2 rounded-lg border border-[#E3E8EF]">
                              <ProductBarcode value={newProdSku} className="w-full h-14" />
                            </div>
                            <p className="font-mono text-xs font-semibold text-[#0E1A2B] mt-2 tracking-widest">{newProdSku}</p>
                          </div>
                        )}
                      </div>
                    </section>

                    {/* ===== Sizes & inventory ===== */}
                    <section className={`${K.card} min-w-0`}>
                      <div className="flex items-baseline justify-between gap-3">
                        <h2 className={`${K.serif} text-xl text-[#0E1A2B]`}>Sizes &amp; inventory</h2>
                        <button type="button" onClick={() => setActiveTab('attributes')} className={`text-xs whitespace-nowrap ${K.link}`}>Manage options →</button>
                      </div>
                      <div>
                        <p className={K.label}>Available Sizes</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {sizeOptions.map((sz) => (
                            <button key={sz.id} type="button" title={sz.name} aria-pressed={newProdSizes.includes(sz.code)} onClick={() => setNewProdSizes(toggleInList(newProdSizes, sz.code))} className={K.chip(newProdSizes.includes(sz.code), 'accent')}>
                              {sz.code}
                            </button>
                          ))}
                        </div>
                      </div>
                      <KaavuStockFields sizes={chosenSizes} colors={chosenColors} values={newProdVariantStock} onChange={setNewProdVariantStock} colorHex={colorHex} />
                      <p className="text-xs text-[#6F7E92]">
                        Each size and colour has its own stock. Checkout deducts only the size and colour the shopper picks. Total: <strong className="text-[#0E1A2B]">{totalStock}</strong> · {stockStatus(totalStock)}
                      </p>
                      <div>
                        <p className={K.label}>Tags</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {tagOptions.map((tag) => (
                            <button key={tag.id} type="button" aria-pressed={newProdTags.includes(tag.name)} onClick={() => setNewProdTags(toggleInList(newProdTags, tag.name))} className={K.chip(newProdTags.includes(tag.name), 'soft')}>
                              {tag.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </section>

                    {/* ===== Product page details: highlights under the details, specifications under the stock ===== */}
                    <section className={`${K.card} min-w-0 flex flex-col`}>
                      <div>
                        <h2 className={`${K.serif} text-xl text-[#0E1A2B]`}>Key highlights</h2>
                        <p className="text-xs text-[#6F7E92] mt-1">Shown as a checklist on the product page. One per line.</p>
                      </div>
                      <label htmlFor="prod-highlights" className="sr-only">Key highlights (one per line)</label>
                      <textarea id="prod-highlights" rows={5} value={newProdHighlights} onChange={(e) => setNewProdHighlights(e.target.value)} placeholder={'Adaptive noise cancelling\n40-hour battery\nFolds into a travel case'} className={`${K.input} flex-1 min-h-[140px] resize-none`} />
                    </section>

                    <section className={`${K.card} min-w-0 flex flex-col`}>
                      <div>
                        <h2 className={`${K.serif} text-xl text-[#0E1A2B]`}>Specifications</h2>
                        <p className="text-xs text-[#6F7E92] mt-1">Shown as a table on the product page. One per line, as Label: Value.</p>
                      </div>
                      <label htmlFor="prod-specs" className="sr-only">Specifications (Label: Value per line)</label>
                      <textarea id="prod-specs" rows={5} value={newProdSpecs} onChange={(e) => setNewProdSpecs(e.target.value)} placeholder={'Battery: 40 hours\nBluetooth: 5.3\nWeight: 254 g'} className={`${K.input} font-mono flex-1 min-h-[140px] resize-none`} />
                    </section>

                    {/* ===== Colors & photography ===== */}
                    <section className={`${K.card} xl:col-span-2 min-w-0`}>
                      <h2 className={`${K.serif} text-xl text-[#0E1A2B]`}>Colors &amp; photography</h2>
                      <div>
                        <p className={K.label}>Available Colors</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {colorOptions.map((col) => (
                            <button key={col.id} type="button" aria-pressed={newProdColors.includes(col.name)} onClick={() => setNewProdColors(toggleInList(newProdColors, col.name))} className={`${K.chip(newProdColors.includes(col.name), 'dark')} inline-flex items-center gap-1.5`}>
                              <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: col.hex }} />
                              {col.name}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-3">
                        {colorOptions
                          .filter((col) => newProdColors.includes(col.name))
                          .map((col) => (
                            <KaavuDetails key={col.id} title={`Photos for ${col.name}`} meta={`${(newProdColorImages[col.name] ?? []).length} photos`} swatch={col.hex}>
                              <KaavuImageUploader label={`${col.name} photos`} images={newProdColorImages[col.name] ?? []} onChange={(images) => setNewProdColorImages({ ...newProdColorImages, [col.name]: images })} />
                            </KaavuDetails>
                          ))}
                        <KaavuDetails title="Main product photos" meta={`${newProdImages.length} photos`} defaultOpen={!editingProductId || chosenColors.length === 0}>
                          <KaavuImageUploader label="Main photos (the first is the cover)" images={newProdImages} onChange={setNewProdImages} />
                        </KaavuDetails>
                      </div>
                      <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
                        <label className="flex items-center gap-2 text-xs text-[#0E1A2B] cursor-pointer">
                          <input type="checkbox" checked={newProdIsNew} onChange={(e) => setNewProdIsNew(e.target.checked)} className="accent-[#2F6BFF] w-4 h-4" />
                          Mark as New Arrival
                        </label>
                        <label className="flex items-center gap-2 text-xs text-[#0E1A2B] cursor-pointer">
                          <input type="checkbox" checked={newProdIsFeatured} onChange={(e) => setNewProdIsFeatured(e.target.checked)} className="accent-[#2F6BFF] w-4 h-4" />
                          Feature on Home Page
                        </label>
                      </div>
                      {productFormError && (
                        <p role="alert" className="rounded-lg border border-[#2F6BFF]/40 bg-[#2F6BFF]/5 p-3 text-sm font-medium text-[#2F6BFF]">{productFormError}</p>
                      )}
                      <div className="flex flex-col-reverse sm:flex-row gap-3">
                        <button type="button" onClick={backToProducts} className="sm:w-40 py-3.5 bg-white border border-[#E3E8EF] hover:border-[#2F6BFF] text-[#0E1A2B] text-xs uppercase tracking-[0.24em] font-semibold rounded transition-colors">Cancel</button>
                        <button type="submit" className={`flex-1 py-3.5 text-xs uppercase tracking-[0.24em] font-semibold shadow-md rounded ${K.button}`}>
                          {editingProductId ? 'Save changes' : 'Publish product'}
                        </button>
                      </div>
                    </section>
                  </form>
                </div>
              </div>
            );
          })()}

          {/* ========================================================================= */}
          {/* 3. PRODUCT LIST TAB (With Scanner, Multi-Add, Edit, Delete) */}
          {/* ========================================================================= */}
          {activeTab === 'product-list' && (
            <div className="space-y-6">
              {/* Action Toolbar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#FBFCFE] p-5 rounded-[24px] border border-[#DCE5F2] shadow-sm">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-[#0E1A2B]">Inventory Catalog</h3>
                  <p className="text-[13px] text-[#6F7E92] font-semibold">
                    {visibleProducts.length} matching {visibleProducts.length === 1 ? 'product' : 'products'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setIsMultiProductModalOpen(true)}
                    className="px-5 py-2.5 bg-[#F3F6FA] hover:bg-[#E3E8EF] text-[#0E1A2B] border border-[#E3E8EF] rounded-full text-[13px] font-extrabold transition-all flex items-center gap-2"
                  >
                    <PanelIcon name="file" size={16} />
                    <span>Add Multiple Products</span>
                  </button>

                  <button
                    onClick={openAddProduct}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white rounded-full text-[13px] font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <span>➕</span>
                    <span>New Product</span>
                  </button>
                </div>
              </div>

              {/* Search & Category Filter */}
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products by name, SKU or category..."
                  className="flex-1 px-6 py-3.5 bg-white border border-[#E3E8EF] rounded-full text-[14px] text-[#0E1A2B] focus:outline-none focus:border-[#2F6BFF] transition-all font-semibold shadow-sm"
                />
                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  aria-label="Filter by category"
                  className="px-6 py-3.5 bg-white border border-[#E3E8EF] rounded-full text-[14px] text-[#0E1A2B] focus:outline-none focus:border-[#2F6BFF] transition-all font-bold cursor-pointer shadow-sm"
                >
                  <option value="All">All Categories ({products.length})</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name} ({products.filter((p) => p.category === c.name).length})</option>
                  ))}
                </select>
                <select
                  value={productVisibilityFilter}
                  onChange={(e) => setProductVisibilityFilter(e.target.value as 'All' | 'Live' | 'Hidden')}
                  aria-label="Filter by visibility"
                  className="px-6 py-3.5 bg-white border border-[#E3E8EF] rounded-full text-[14px] text-[#0E1A2B] focus:outline-none focus:border-[#2F6BFF] transition-all font-bold cursor-pointer shadow-sm"
                >
                  <option value="All">Live &amp; hidden</option>
                  <option value="Live">Live only ({products.filter((p) => p.isLive !== false).length})</option>
                  <option value="Hidden">Hidden only ({products.filter((p) => p.isLive === false).length})</option>
                </select>
              </div>

              {/* Product cards on phones (the table below is for tablets and desktops) */}
              <div className="md:hidden space-y-3">
                {visibleProducts.length === 0 && (
                  <p className="py-10 text-center text-[13px] font-semibold text-[#6F7E92] bg-[#FBFCFE] border border-[#DCE5F2] rounded-[20px]">No products match your search or filter.</p>
                )}
                {visibleProducts.map((prod) => (
                  <div key={prod.id} className="bg-[#FBFCFE] border border-[#DCE5F2] rounded-[20px] p-4 shadow-sm">
                    <div className="flex gap-3.5">
                      <img src={prod.image} alt={prod.name} className="w-16 h-16 shrink-0 rounded-2xl object-cover border border-[#E3E8EF] bg-white" />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-[#0E1A2B] text-[14.5px] leading-snug line-clamp-2">{prod.name}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="text-[11px] text-[#6F7E92] font-semibold font-mono">{prod.sku}</span>
                          {prod.colors.map((c) => (
                            <span key={c} title={c} className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: colorHex[c] ?? '#CFD8E3' }} />
                          ))}
                        </div>
                        <p className="mt-1 text-[12px] text-[#6F7E92] truncate">{prod.category} · {prod.subCategory}</p>
                      </div>
                    </div>
                    <div className="mt-3.5 flex items-center justify-between gap-2">
                      <div className="whitespace-nowrap">
                        <span className="font-bold text-[#0E1A2B] text-[15px]">₹{prod.price.toLocaleString()}</span>
                        {prod.mrp && prod.mrp > prod.price && <span className="ml-1.5 text-[12px] text-[#6F7E92] line-through">₹{prod.mrp.toLocaleString()}</span>}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openStockEditor(prod)} className="px-3 py-1.5 rounded-full bg-[#EEF3FC] text-[#1F55E0] text-[12px] font-bold whitespace-nowrap">{prod.stock} units</button>
                        <span className={`px-3 py-1.5 rounded-full text-[11.5px] font-bold whitespace-nowrap ${prod.status === 'In Stock' ? 'bg-gradient-to-r from-[#DCE7FF] to-[#EAF1FF] text-[#1F55E0]' : prod.status === 'Low Stock' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700'}`}>{prod.status}</span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-[#F3F6FA] px-3.5 py-2.5">
                      <span className="text-[12.5px] font-bold text-[#5B6B80]">Show on website</span>
                      <LiveToggle live={prod.isLive !== false} name={prod.name} onToggle={() => toggleProductLive(prod)} />
                    </div>
                    <div className="mt-3.5 pt-3.5 border-t border-[#E3E8EF] grid grid-cols-[1fr_1fr_auto] gap-2">
                      <button onClick={() => { setActiveBarcodeProduct(prod); setBarcodeLabelCount(1); setIsPrintBarcodeModalOpen(true); }} className="h-10 rounded-full border border-[#DCE5F2] text-[#0E1A2B] font-bold text-[13px] inline-flex items-center justify-center gap-2"><PanelIcon name="barcode" size={15} /> Barcode</button>
                      <button onClick={() => openEditProduct(prod)} className="h-10 rounded-full border border-[#DCE5F2] text-[#0E1A2B] font-bold text-[13px] inline-flex items-center justify-center gap-2">
                        <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m14.5 6.5 3 3" /><path d="M4 20l4.2-.9L19.5 7.8a2.1 2.1 0 0 0-3-3L5.2 16.1 4 20Z" /></svg> Edit
                      </button>
                      <button onClick={() => handleDeleteProduct(prod.id)} aria-label={`Delete ${prod.name}`} className="w-10 h-10 rounded-full border border-[#DCE5F2] text-[#0E1A2B] inline-flex items-center justify-center">
                        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16" /><path d="M10 11v6M14 11v6" /><path d="m5 7 1 13h12l1-13" /><path d="M9 7V4h6v3" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Product Table */}
              <div className="hidden md:block bg-[#FBFCFE] border border-[#DCE5F2] rounded-[24px] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[14px]">
                    <thead className="text-[#6F7E92] border-b border-[#E3E8EF]">
                      <tr className="bg-[#EEF3FC] text-[#0E1A2B]">
                        <th className="py-4 pl-5 pr-3 font-extrabold text-[13px]">Product</th>
                        <th className="py-4 px-3 font-extrabold text-[13px]">Category</th>
                        <th className="py-4 px-4 font-extrabold text-[13px] whitespace-nowrap">Price</th>
                        <th className="py-4 px-4 font-extrabold text-[13px] whitespace-nowrap">Stock</th>
                        <th className="py-4 px-4 font-extrabold text-[13px] whitespace-nowrap">Visibility</th>
                        <th className="py-4 px-5 font-extrabold text-[13px] text-right whitespace-nowrap">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E3E8EF]">
                      {visibleProducts.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-[13px] font-semibold text-[#6F7E92]">
                            No products match your search or filter.
                          </td>
                        </tr>
                      )}
                      {visibleProducts.map((prod) => (
                        <Fragment key={prod.id}>
                        <tr className="group hover:bg-[#F6F8FB] transition-colors">
                          {/* Image & Title */}
                          <td className="py-3.5 pl-5 pr-3">
                            <div className="flex items-center gap-3.5 w-[270px]">
                              <img
                                src={prod.image}
                                alt={prod.name}
                                className="w-12 h-12 shrink-0 rounded-2xl object-cover border border-[#E3E8EF] bg-white"
                              />
                              <div className="min-w-0">
                                <span title={prod.name} className="font-bold text-[#0E1A2B] block text-[14px] leading-tight truncate">
                                  {prod.name}
                                </span>
                                <div className="flex flex-nowrap items-center gap-1.5 mt-1 whitespace-nowrap overflow-hidden">
                                  <span className="text-[11px] text-[#6F7E92] font-semibold font-mono">{prod.sku}</span>
                                  {prod.colors.map((c) => (
                                    <span
                                      key={c}
                                      title={c}
                                      className="w-3 h-3 rounded-full border border-black/10"
                                      style={{ backgroundColor: colorHex[c] ?? '#CFD8E3' }}
                                    />
                                  ))}
                                  {prod.isNewArrival && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[9px] font-black uppercase">New</span>}
                                  {prod.isFeatured && <span className="px-1.5 py-0.5 bg-[#EAF1FF] text-[#2F6BFF] rounded-md text-[9px] font-black uppercase">Featured</span>}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="py-3.5 px-3">
                            <div className="w-[165px]">
                            <span className="font-medium text-[#0E1A2B] block truncate">{prod.category}</span>
                            <span title={`${prod.subCategory}${prod.subSubCategory ? ` > ${prod.subSubCategory}` : ''}`} className="text-[12px] text-[#6F7E92] block truncate">
                              {prod.subCategory}{prod.subSubCategory && ` > ${prod.subSubCategory}`}
                            </span>
                            </div>
                          </td>

                          {/* Price */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-semibold text-[#0E1A2B] text-[15px] block">₹{prod.price.toLocaleString()}</span>
                            {prod.mrp && prod.mrp > prod.price && (
                              <span className="text-[12px] text-[#6F7E92] font-semibold line-through">₹{prod.mrp.toLocaleString()}</span>
                            )}
                          </td>

                          {/* Stock (by size) */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <button onClick={() => openStockEditor(prod)} title="Edit stock by size and color" className="px-3 py-2 rounded-full bg-[#EEF3FC] text-[#1F55E0] text-[13px] font-bold hover:bg-[#E3ECFB] whitespace-nowrap">{prod.stock} units</button>
                            <span className={`block mt-1.5 pl-1 text-[11.5px] font-bold ${prod.status === 'In Stock' ? 'text-[#1F55E0]' : prod.status === 'Low Stock' ? 'text-amber-700' : 'text-red-600'}`}>{prod.status}</span>
                          </td>

                          {/* Visibility on the website */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <LiveToggle live={prod.isLive !== false} name={prod.name} onToggle={() => toggleProductLive(prod)} />
                          </td>

                          {/* Actions: Scanner, Edit, Delete */}
                          <td className="py-3.5 pl-2 pr-5 whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2 flex-nowrap">
                              <button onClick={() => { setActiveBarcodeProduct(prod); setBarcodeLabelCount(1); setIsPrintBarcodeModalOpen(true); }} title="Print barcode labels" aria-label={`Print barcode labels for ${prod.name}`} className="h-9 px-2.5 2xl:px-3.5 rounded-full border border-[#DCE5F2] text-[#0E1A2B] font-bold text-[13px] inline-flex items-center gap-2 hover:bg-[#EEF3FC] whitespace-nowrap"><PanelIcon name="barcode" size={15} /><span className="hidden 2xl:inline">Barcode</span></button>

                              {/* Edit Button */}
                              <button
                                onClick={() => openEditProduct(prod)}
                                title="Edit Product"
                                aria-label={`Edit ${prod.name}`}
                                className="h-9 px-3.5 rounded-full border border-[#DCE5F2] text-[#0E1A2B] hover:bg-[#EEF3FC] inline-flex items-center gap-2 text-[13px] font-bold whitespace-nowrap"
                              >
                                <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m14.5 6.5 3 3" /><path d="M4 20l4.2-.9L19.5 7.8a2.1 2.1 0 0 0-3-3L5.2 16.1 4 20Z" /></svg> Edit
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() => handleDeleteProduct(prod.id)}
                                title="Delete Product"
                                aria-label={`Delete ${prod.name}`}
                                className="w-9 h-9 shrink-0 rounded-full border border-[#DCE5F2] text-[#0E1A2B] hover:bg-red-50 inline-flex items-center justify-center"
                              >
                                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16" /><path d="M10 11v6M14 11v6" /><path d="m5 7 1 13h12l1-13" /><path d="M9 7V4h6v3" /></svg>
                              </button>

                            </div>
                          </td>
                        </tr>
                        {expandedProductId === prod.id && (
                          <tr className="bg-[#F8FAFC]">
                            <td colSpan={6} className="px-4 pb-6 pt-2">
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                {/* Stock grid */}
                                <div className="lg:col-span-2 bg-white border border-[#E3E8EF] rounded-[24px] p-5 overflow-x-auto">
                                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#6F7E92] mb-3">Stock by Size & Color</p>
                                  <table className="w-full text-[13px]">
                                    <thead className="text-[#6F7E92]">
                                      <tr>
                                        <th className="pb-2 pr-3 text-left font-extrabold uppercase text-[10px] tracking-wider">Size</th>
                                        {variantColors(prod.colors).map((color) => (
                                          <th key={color} className="pb-2 px-3 text-left font-extrabold uppercase text-[10px] tracking-wider">{color === STANDARD ? 'Stock' : color}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {variantSizes(prod.sizes).map((size) => (
                                        <tr key={size} className="border-t border-[#F3F6FA]">
                                          <td className="py-2 pr-3 font-bold text-[#0E1A2B]">{size === STANDARD ? 'One Size' : size}</td>
                                          {variantColors(prod.colors).map((color) => {
                                            const qty = prod.variantStock[size]?.[color] ?? 0;
                                            return (
                                              <td key={color} className="py-2 px-3">
                                                <span className={`px-2.5 py-1 rounded-lg font-black text-[12px] ${qty === 0 ? 'bg-red-50 text-red-600' : qty <= 5 ? 'bg-amber-50 text-amber-700' : 'bg-[#F3F6FA] text-[#0E1A2B]'}`}>{qty === 0 ? 'Sold out' : qty}</span>
                                              </td>
                                            );
                                          })}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                  {prod.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-4">
                                      {prod.tags.map((t) => <span key={t} className="px-2.5 py-1 bg-[#EAF1FF] text-[#2F6BFF] rounded-full text-[11px] font-bold">#{t}</span>)}
                                    </div>
                                  )}
                                </div>
                                {/* Photos */}
                                <div className="bg-white border border-[#E3E8EF] rounded-[24px] p-5 space-y-3">
                                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#6F7E92]">Photos</p>
                                  <div>
                                    <p className="text-[12px] font-bold text-[#0E1A2B] mb-1.5">Main ({prod.images.length})</p>
                                    <div className="flex flex-wrap gap-2">
                                      {prod.images.map((src, i) => <img key={i} src={src} alt="" className="w-11 h-11 rounded-xl object-cover border border-[#E3E8EF]" />)}
                                    </div>
                                  </div>
                                  {prod.colors.map((color) => (
                                    <div key={color}>
                                      <p className="text-[12px] font-bold text-[#0E1A2B] mb-1.5 flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: colorHex[color] ?? '#CFD8E3' }} />
                                        {color} ({prod.colorImages[color]?.length ?? 0})
                                      </p>
                                      {prod.colorImages[color]?.length ? (
                                        <div className="flex flex-wrap gap-2">
                                          {prod.colorImages[color].map((src, i) => <img key={i} src={src} alt="" className="w-11 h-11 rounded-xl object-cover border border-[#E3E8EF]" />)}
                                        </div>
                                      ) : (
                                        <p className="text-[11px] text-[#6F7E92] font-semibold">Uses the main photos</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3b. INVENTORY TAB (Stock by Size & Color) */}
          {/* ========================================================================= */}
          {activeTab === 'inventory' && (() => {
            const query = inventorySearch.trim().toLowerCase();
            const rows = products.filter((p) => [p.name, p.sku, p.id].some((v) => v.toLowerCase().includes(query)));
            return (
              <div className={K.page}>
                <div className="max-w-6xl mx-auto space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                    <div>
                      <h1 className={`${K.serif} text-2xl sm:text-3xl text-[#0E1A2B]`}>Stock by size &amp; color</h1>
                      <p className="text-sm text-[#6F7E92] mt-1">Review and update quantities. Checkout deducts only the selected size and color.</p>
                    </div>
                    <p className="text-xs text-[#6F7E92] whitespace-nowrap">
                      <strong className="text-[#0E1A2B]">{products.reduce((sum, p) => sum + p.stock, 0).toLocaleString('en-IN')}</strong> units across {products.length} products
                    </p>
                  </div>
                  <input
                    type="search"
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    placeholder="Search product name, SKU or ID"
                    aria-label="Search inventory"
                    className="w-full border border-[#E3E8EF] rounded-lg p-3 bg-white text-sm text-[#0E1A2B] outline-none focus:border-[#2F6BFF]"
                  />
                  <div className="space-y-3">
                    {rows.length === 0 && <p className="py-10 text-center text-sm text-[#6F7E92] bg-white rounded-xl border border-[#E3E8EF]">No products match your search.</p>}
                    {rows.map((prod) => (
                      <KaavuInventoryRow
                        key={prod.id}
                        product={prod}
                        colorHex={colorHex}
                        onEdit={() => openEditProduct(prod)}
                        onSave={(values) => {
                          const { variantStock, stock } = buildVariantStock(prod.sizes, prod.colors, values);
                          setProducts(products.map((p) => (p.id === prod.id ? { ...p, variantStock, stock, status: stockStatus(stock) } : p)));
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ========================================================================= */}
          {/* 3c. SIZES, COLORS & TAGS TAB (Product Attributes) */}
          {/* ========================================================================= */}
          {activeTab === 'attributes' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Sizes */}
              <div className="bg-white border border-[#E3E8EF] rounded-[36px] p-7 shadow-sm space-y-5">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-[#0E1A2B]">Size Options</h3>
                  <p className="text-[13px] text-[#6F7E92] font-semibold">The code shows on product chips and in stock tables.</p>
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Name (e.g. 45 mm Case)"
                    value={newSizeName}
                    onChange={(e) => setNewSizeName(e.target.value)}
                    className="w-full px-5 py-3 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full text-[13px] font-semibold text-[#0E1A2B] focus:outline-none focus:bg-white focus:border-[#2F6BFF]"
                  />
                  <input
                    type="text"
                    placeholder="Code (e.g. 45mm)"
                    value={newSizeCode}
                    onChange={(e) => setNewSizeCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveSize()}
                    className="w-full px-5 py-3 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full text-[13px] font-semibold text-[#0E1A2B] focus:outline-none focus:bg-white focus:border-[#2F6BFF]"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveSize}
                      className="flex-1 py-3 bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white font-extrabold text-[13px] rounded-full shadow-md hover:shadow-lg transition-all"
                    >
                      {editingSizeId ? 'Save Changes' : 'Add Size'}
                    </button>
                    {editingSizeId && (
                      <button onClick={resetSizeForm} className="px-5 py-3 bg-white border border-[#E3E8EF] hover:bg-[#F3F6FA] text-[#5B6B80] font-bold text-[13px] rounded-full">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
                <div className="divide-y divide-[#E3E8EF]">
                  {sizeOptions.map((sz) => (
                    <div key={sz.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="px-3 py-1 bg-[#EAF1FF] text-[#2F6BFF] border border-[#C9D9FF] rounded-full text-[12px] font-black whitespace-nowrap">{sz.code}</span>
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-[#0E1A2B] truncate">{sz.name}</p>
                          <p className="text-[11px] text-[#6F7E92] font-semibold">{productsUsing('sizes', sz.code)} product(s)</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          onClick={() => { setEditingSizeId(sz.id); setNewSizeName(sz.name); setNewSizeCode(sz.code); }}
                          className="text-[12px] font-bold text-[#5B6B80] hover:text-[#0E1A2B]"
                        >
                          Edit
                        </button>
                        <button onClick={() => handleDeleteSize(sz)} className="text-[12px] font-bold text-red-500 hover:text-red-700">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div className="bg-white border border-[#E3E8EF] rounded-[36px] p-7 shadow-sm space-y-5">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-[#0E1A2B]">Color Palette</h3>
                  <p className="text-[13px] text-[#6F7E92] font-semibold">Each color gets its own stock and photos on a product.</p>
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Color name (e.g. Ocean Blue)"
                    value={newColorName}
                    onChange={(e) => setNewColorName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveColor()}
                    className="w-full px-5 py-3 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full text-[13px] font-semibold text-[#0E1A2B] focus:outline-none focus:bg-white focus:border-[#2F6BFF]"
                  />
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      aria-label="Pick color"
                      value={newColorHex}
                      onChange={(e) => setNewColorHex(e.target.value)}
                      className="w-12 h-11 rounded-full border border-[#E3E8EF] bg-[#F3F6FA] cursor-pointer p-1"
                    />
                    <input
                      type="text"
                      placeholder="#2563EB"
                      value={newColorHex}
                      onChange={(e) => setNewColorHex(e.target.value)}
                      className="flex-1 px-5 py-3 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full text-[13px] font-mono font-bold text-[#0E1A2B] uppercase focus:outline-none focus:bg-white focus:border-[#2F6BFF]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveColor}
                      className="flex-1 py-3 bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white font-extrabold text-[13px] rounded-full shadow-md hover:shadow-lg transition-all"
                    >
                      {editingColorId ? 'Save Changes' : 'Add Color'}
                    </button>
                    {editingColorId && (
                      <button onClick={resetColorForm} className="px-5 py-3 bg-white border border-[#E3E8EF] hover:bg-[#F3F6FA] text-[#5B6B80] font-bold text-[13px] rounded-full">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
                <div className="divide-y divide-[#E3E8EF]">
                  {colorOptions.map((col) => (
                    <div key={col.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-8 h-8 rounded-full border border-black/10 shadow-sm shrink-0" style={{ backgroundColor: col.hex }} />
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-[#0E1A2B] truncate">{col.name}</p>
                          <p className="text-[11px] text-[#6F7E92] font-semibold"><span className="font-mono uppercase">{col.hex}</span> • {productsUsing('colors', col.name)} product(s)</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          onClick={() => { setEditingColorId(col.id); setNewColorName(col.name); setNewColorHex(col.hex); }}
                          className="text-[12px] font-bold text-[#5B6B80] hover:text-[#0E1A2B]"
                        >
                          Edit
                        </button>
                        <button onClick={() => handleDeleteColor(col)} className="text-[12px] font-bold text-red-500 hover:text-red-700">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className="bg-white border border-[#E3E8EF] rounded-[36px] p-7 shadow-sm space-y-5">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-[#0E1A2B]">Product Tags</h3>
                  <p className="text-[13px] text-[#6F7E92] font-semibold">Used for storefront filters and collections.</p>
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Tag name (e.g. Handcrafted)"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveTag()}
                    className="w-full px-5 py-3 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full text-[13px] font-semibold text-[#0E1A2B] focus:outline-none focus:bg-white focus:border-[#2F6BFF]"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveTag}
                      className="flex-1 py-3 bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white font-extrabold text-[13px] rounded-full shadow-md hover:shadow-lg transition-all"
                    >
                      {editingTagId ? 'Save Changes' : 'Add Tag'}
                    </button>
                    {editingTagId && (
                      <button
                        onClick={() => { setEditingTagId(null); setNewTagName(''); }}
                        className="px-5 py-3 bg-white border border-[#E3E8EF] hover:bg-[#F3F6FA] text-[#5B6B80] font-bold text-[13px] rounded-full"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tagOptions.map((tag) => (
                    <span key={tag.id} className="pl-4 pr-2 py-1.5 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full text-[13px] font-bold text-[#0E1A2B] flex items-center gap-2">
                      <button
                        onClick={() => { setEditingTagId(tag.id); setNewTagName(tag.name); }}
                        title="Edit tag"
                        className="hover:text-[#2F6BFF]"
                      >
                        #{tag.name}
                      </button>
                      <span className="text-[11px] text-[#6F7E92]">{productsUsing('tags', tag.name)}</span>
                      <button
                        onClick={() => handleDeleteTag(tag)}
                        aria-label={`Delete tag ${tag.name}`}
                        className="w-5 h-5 rounded-full hover:bg-red-50 text-red-500 text-[10px] font-black"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. CATEGORY TAB */}
          {/* ========================================================================= */}
          {activeTab === 'category' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-[28px] border border-[#E3E8EF] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-[#0E1A2B]">Store Categories</h3>
                  <p className="text-[13px] text-[#6F7E92] font-semibold">
                    {categories.filter((c) => c.status === 'Active').length} active categories shown on the storefront menu and home page
                  </p>
                </div>
                <button
                  onClick={() => openCategoryModal()}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white rounded-full text-[13px] font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <span>➕</span>
                  <span>Add New Category</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((cat) => {
                  const count = products.filter((p) => p.category === cat.name).length;
                  return (
                    <div key={cat.id} className={`bg-white border border-[#E3E8EF] rounded-[32px] shadow-sm hover:shadow-md transition-all overflow-hidden ${cat.status === 'Active' ? '' : 'opacity-70'}`}>
                      <div className="relative h-36 bg-[#F3F6FA]">
                        {cat.image ? (
                          <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[12px] font-bold text-[#6F7E92]">No photo yet</div>
                        )}
                        <span className="absolute -bottom-6 left-6 text-[#2F6BFF] w-14 h-14 bg-white border border-[#E3E8EF] rounded-2xl shadow-sm flex items-center justify-center"><PanelIcon name="folder" size={24} /></span>
                      </div>
                      <div className="p-6 pt-9 space-y-4">
                        <div>
                          <h4 className="font-bold text-[#0E1A2B] text-[16px]">{cat.name}</h4>
                          <p className="text-[12px] text-[#5B6B80] font-semibold mt-0.5">{cat.blurb || <span className="text-[#A9B4C2]">No description</span>}</p>
                          <p className="text-[12px] text-[#6F7E92] font-semibold mt-1">{count} products • /{cat.slug}</p>
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#E3E8EF]">
                          <button
                            onClick={() => setCategories(categories.map((c) => (c.id === cat.id ? { ...c, status: c.status === 'Active' ? 'Inactive' : 'Active' } : c)))}
                            className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${cat.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}
                          >
                            {cat.status}
                          </button>
                          <div className="flex items-center gap-4">
                            <button onClick={() => openCategoryModal(cat)} className="text-[12px] font-bold text-[#2F6BFF] hover:underline">
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (count) {
                                  alert(`${cat.name} still has ${count} product(s). Move or delete them first.`);
                                  return;
                                }
                                if (confirm(`Delete the category "${cat.name}"?`)) setCategories(categories.filter((c) => c.id !== cat.id));
                              }}
                              className="text-[12px] font-bold text-red-500 hover:text-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. SUB CATEGORY TAB */}
          {/* ========================================================================= */}
          {activeTab === 'sub-category' && (
            <div className="space-y-8">
              {/* Add Sub Category Form */}
              <div className="bg-white border border-[#E3E8EF] rounded-[36px] p-8 shadow-sm max-w-3xl">
                <h3 className="text-xl font-bold tracking-tight text-[#0E1A2B] mb-2">Create Sub Category</h3>
                <p className="text-[13px] text-[#6F7E92] font-semibold mb-6">Map sub-categories under parent category groups.</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Sub-Category Name"
                    value={newSubCatName}
                    onChange={(e) => setNewSubCatName(e.target.value)}
                    className="sm:col-span-1 px-6 py-3.5 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full text-[14px] text-[#0E1A2B] focus:outline-none focus:bg-white focus:border-[#2F6BFF] transition-all font-semibold"
                  />
                  <select
                    value={newSubCatParent}
                    onChange={(e) => setNewSubCatParent(e.target.value)}
                    className="sm:col-span-1 px-6 py-3.5 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full text-[14px] text-[#0E1A2B] focus:outline-none focus:bg-white focus:border-[#2F6BFF] transition-all font-bold cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        Parent: {c.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      if (!newSubCatName) return;
                      setSubCategories([
                        ...subCategories,
                        {
                          id: `sc-${Date.now()}`,
                          name: newSubCatName,
                          parentCategory: newSubCatParent,
                          status: 'Active',
                        },
                      ]);
                      setNewSubCatName('');
                    }}
                    className="sm:col-span-1 px-6 py-3.5 bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white font-extrabold text-[13px] rounded-full shadow-md hover:shadow-lg transition-all"
                  >
                    Save Sub Category
                  </button>
                </div>
              </div>

              {/* Sub Categories Table */}
              <div className="bg-white border border-[#E3E8EF] rounded-[36px] p-6 shadow-sm overflow-hidden">
                <table className="w-full text-left text-[14px]">
                  <thead className="text-[#6F7E92] border-b border-[#E3E8EF]">
                    <tr>
                      <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Sub Category</th>
                      <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Parent Category</th>
                      <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Product Count</th>
                      <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Status</th>
                      <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E3E8EF]">
                    {subCategories.map((sc) => (
                      <tr key={sc.id} className="hover:bg-[#F3F6FA]/60 transition-colors">
                        <td className="py-4 px-4 font-bold text-[#0E1A2B]">{sc.name}</td>
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 bg-white border border-[#E3E8EF] rounded-full text-[12px] font-extrabold text-[#2F6BFF] shadow-sm">
                            {sc.parentCategory}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-semibold text-[#5B6B80]">{products.filter((p) => p.category === sc.parentCategory && p.subCategory === sc.name).length} items</td>
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[11px] font-black uppercase tracking-wider">
                            {sc.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => setSubCategories(subCategories.filter((s) => s.id !== sc.id))}
                            className="text-red-500 hover:text-red-700 text-[13px] font-bold"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 6. SUB SUB CATEGORIES TAB */}
          {/* ========================================================================= */}
          {activeTab === 'sub-sub-category' && (
            <div className="space-y-8">
              {/* Add Sub Sub Category Form */}
              <div className="bg-white border border-[#E3E8EF] rounded-[36px] p-8 shadow-sm max-w-4xl">
                <h3 className="text-xl font-bold tracking-tight text-[#0E1A2B] mb-2">Create Sub Sub Category (Level 3)</h3>
                <p className="text-[13px] text-[#6F7E92] font-semibold mb-6">
                  Niche classification (e.g. Jewellery → Necklaces → Temple & Heritage).
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <input
                    type="text"
                    placeholder="Sub Sub Category Name"
                    value={newSubSubCatName}
                    onChange={(e) => setNewSubSubCatName(e.target.value)}
                    className="sm:col-span-1 px-6 py-3.5 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full text-[14px] text-[#0E1A2B] focus:outline-none focus:bg-white focus:border-[#2F6BFF] transition-all font-semibold"
                  />
                  <select
                    value={newSubSubCatParent}
                    onChange={(e) => setNewSubSubCatParent(e.target.value)}
                    className="sm:col-span-1 px-5 py-3.5 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full text-[13px] text-[#0E1A2B] focus:outline-none focus:bg-white focus:border-[#2F6BFF] transition-all font-bold cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        Main: {c.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={newSubSubCatSubParent}
                    onChange={(e) => setNewSubSubCatSubParent(e.target.value)}
                    className="sm:col-span-1 px-5 py-3.5 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full text-[13px] text-[#0E1A2B] focus:outline-none focus:bg-white focus:border-[#2F6BFF] transition-all font-bold cursor-pointer"
                  >
                    {subCategories
                      .filter((sc) => sc.parentCategory === newSubSubCatParent)
                      .map((sc) => (
                        <option key={sc.id} value={sc.name}>
                          Sub: {sc.name}
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={() => {
                      if (!newSubSubCatName) return;
                      setSubSubCategories([
                        ...subSubCategories,
                        {
                          id: `ssc-${Date.now()}`,
                          name: newSubSubCatName,
                          parentCategory: newSubSubCatParent,
                          parentSubCategory: newSubSubCatSubParent,
                          status: 'Active',
                        },
                      ]);
                      setNewSubSubCatName('');
                    }}
                    className="sm:col-span-1 px-6 py-3.5 bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white font-extrabold text-[13px] rounded-full shadow-md hover:shadow-lg transition-all"
                  >
                    Add Level 3
                  </button>
                </div>
              </div>

              {/* Sub Sub Categories Table */}
              <div className="bg-white border border-[#E3E8EF] rounded-[36px] p-6 shadow-sm overflow-hidden">
                <table className="w-full text-left text-[14px]">
                  <thead className="text-[#6F7E92] border-b border-[#E3E8EF]">
                    <tr>
                      <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Sub Sub Category</th>
                      <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Hierarchy Path</th>
                      <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Product Count</th>
                      <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Status</th>
                      <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E3E8EF]">
                    {subSubCategories.map((ssc) => (
                      <tr key={ssc.id} className="hover:bg-[#F3F6FA]/60 transition-colors">
                        <td className="py-4 px-4 font-bold text-[#0E1A2B]">{ssc.name}</td>
                        <td className="py-4 px-4 text-[13px]">
                          <span className="font-semibold text-[#5B6B80]">{ssc.parentCategory}</span>
                          <span className="text-[#6F7E92] mx-1.5">→</span>
                          <span className="font-bold text-[#2F6BFF]">{ssc.parentSubCategory}</span>
                        </td>
                        <td className="py-4 px-4 font-semibold text-[#5B6B80]">{products.filter((p) => p.subCategory === ssc.parentSubCategory && p.subSubCategory === ssc.name).length} items</td>
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[11px] font-black uppercase tracking-wider">
                            {ssc.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => setSubSubCategories(subSubCategories.filter((s) => s.id !== ssc.id))}
                            className="text-red-500 hover:text-red-700 text-[13px] font-bold"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 7. COUPONS TAB */}
          {/* ========================================================================= */}
          {activeTab === 'coupons' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-6 rounded-[28px] border border-[#E3E8EF] shadow-sm">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-[#0E1A2B]">Discount Coupons</h3>
                  <p className="text-[13px] text-[#6F7E92] font-semibold">Manage promo codes and checkout discounts</p>
                </div>
                <button
                  onClick={() => openCouponModal()}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white rounded-full text-[13px] font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <PanelIcon name="ticket" size={16} />
                  <span>Create Coupon</span>
                </button>
              </div>

              {/* Store Header Marquee Preview */}
              <div className="bg-white border border-[#E3E8EF] rounded-[28px] p-5 shadow-sm space-y-3">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#6F7E92] pl-1">Store Header Preview</p>
                <div className="bg-[#0E1A2B] text-white rounded-full px-6 py-2.5 text-[12px] font-bold text-center overflow-hidden whitespace-nowrap text-ellipsis">
                  {headerCoupons.length
                    ? headerCoupons.map((c) => `Use ${c.code} — ${c.discountType === 'Percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`} on orders above ₹${c.minPurchase.toLocaleString()}`).join('   •   ')
                    : 'No coupon is shown in the store header. Turn on "Show in header" on a coupon below.'}
                </div>
              </div>

              {/* Coupons Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {coupons.map((cp) => (
                  <div
                    key={cp.id}
                    className="bg-white border border-[#E3E8EF] rounded-[32px] p-7 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <button
                          onClick={() => copyText(cp.code, `Code ${cp.code}`)}
                          title="Copy coupon code"
                          className="px-3.5 py-1.5 bg-[#EAF1FF] hover:bg-[#DCE7FF] text-[#2F6BFF] border border-[#C9D9FF] font-mono font-black rounded-xl text-[14px] flex items-center gap-2 transition-all"
                        >
                          {cp.code}
                          <span className="text-[12px] opacity-60">⧉</span>
                        </button>
                        {(() => {
                          const state = couponState(cp);
                          return (
                            <span
                              title={state === 'Live' ? 'Usable at checkout today' : undefined}
                              className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${state === 'Live'
                                ? 'bg-emerald-100 text-emerald-700'
                                : state === 'Scheduled'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-500'
                                }`}
                            >
                              {state}
                            </span>
                          );
                        })()}
                      </div>

                      <div>
                        <p className="text-3xl font-black text-[#0E1A2B]">
                          {cp.discountType === 'Percentage' ? `${cp.discountValue}% OFF` : `₹${cp.discountValue} FLAT`}
                        </p>
                        {cp.description && (
                          <p className="text-[13px] text-[#0E1A2B] font-semibold mt-1">{cp.description}</p>
                        )}
                        <p className="text-[13px] text-[#5B6B80] font-semibold mt-1">
                          Min. Purchase: <span className="font-bold text-[#0E1A2B]">₹{cp.minPurchase.toLocaleString()}</span>
                          {cp.maxDiscount !== undefined && (
                            <> • Max: <span className="font-bold text-[#0E1A2B]">₹{cp.maxDiscount.toLocaleString()}</span></>
                          )}
                        </p>
                      </div>

                      <div className="pt-2 text-[12px] text-[#6F7E92] font-semibold space-y-1">
                        <p>Valid: {cp.validFrom || 'now'} → {cp.validTill || 'no end date'}</p>
                        <p>Used: {cp.usageCount}{cp.usageLimit ? ` / ${cp.usageLimit}` : ''} times{cp.usageLimit ? '' : ' (no limit)'}</p>
                      </div>

                      <label className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full cursor-pointer">
                        <span className="text-[12px] font-bold text-[#0E1A2B]">Show in store header</span>
                        <input
                          type="checkbox"
                          checked={cp.showInHeader}
                          onChange={(e) => setCoupons(coupons.map((c) => (c.id === cp.id ? { ...c, showInHeader: e.target.checked } : c)))}
                          className="w-4 h-4 accent-[#2F6BFF]"
                        />
                      </label>
                    </div>

                    <div className="pt-6 border-t border-[#E3E8EF] mt-4 flex justify-between items-center">
                      <button
                        onClick={() =>
                          setCoupons(
                            coupons.map((c) =>
                              c.id === cp.id
                                ? { ...c, status: c.status === 'Active' ? 'Expired' : 'Active' }
                                : c
                            )
                          )
                        }
                        className="text-[12px] font-bold text-[#5B6B80] hover:text-[#0E1A2B]"
                      >
                        {cp.status === 'Active' ? 'Pause' : 'Activate'}
                      </button>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => openCouponModal(cp)}
                          className="text-[12px] font-bold text-[#2F6BFF] hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setCoupons(coupons.filter((c) => c.id !== cp.id))}
                          className="text-[12px] font-bold text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 8. ORDERS TAB */}
          {/* ========================================================================= */}
          {activeTab === 'orders' && (() => {
            const month = localDate().slice(0, 7);
            const monthLabel = new Date(`${month}-01T00:00:00`).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
            const counted = orders.filter((o) => o.orderStatus !== 'Cancelled');
            const thisMonth = orders.filter((o) => o.date.startsWith(month));
            const revenue = (list: Order[]) => list.filter((o) => o.orderStatus !== 'Cancelled').reduce((sum, o) => sum + o.total, 0);
            const countOf = (status: OrderStatus) => orders.filter((o) => o.orderStatus === status).length;
            const paymentBadge = (o: Order) => (o.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : o.paymentStatus === 'Failed' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200');
            const itemCount = (o: Order) => { const n = o.items.reduce((sum, item) => sum + item.qty, 0); return `${n} item${n === 1 ? '' : 's'}`; };
            const shortDate = (o: Order) => new Date(`${o.date}T00:00:00`).toLocaleDateString('en-IN');
            const shipLabel = (o: Order) => (o.shipment && o.shipment.status !== 'Cancelled' ? 'Shipment' : 'Shipping');
            return (
              <div className="space-y-6">
                {/* Check pending payments */}
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled={checkingPayments}
                    onClick={reconcilePayments}
                    className="px-5 py-2.5 bg-white hover:bg-[#EAF1FF] border border-[#2F6BFF] text-[#2F6BFF] rounded-full text-[13px] font-extrabold transition-all disabled:opacity-50"
                  >
                    {checkingPayments ? 'Checking captured payments…' : 'Check pending payments'}
                  </button>
                  {paymentCheckMessage && <p role="status" className="text-[13px] font-semibold text-[#5B6B80]">{paymentCheckMessage}</p>}
                </div>

                {/* Key order & revenue numbers */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-[#E3E8EF] rounded-[24px] p-5 space-y-2 shadow-sm">
                    <span className="block text-[10.5px] uppercase tracking-[0.16em] font-extrabold text-[#6F7E92]">Total Orders (All-Time)</span>
                    <p className="text-3xl font-black tracking-tight text-[#0E1A2B]">{orders.length}</p>
                    <span className="block text-[11.5px] font-bold text-[#2F6BFF]">{countOf('Delivered')} Delivered · {countOf('Pending')} Pending</span>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-[24px] p-5 space-y-2 shadow-sm">
                    <span className="block text-[10.5px] uppercase tracking-[0.16em] font-extrabold text-amber-900">This Month&apos;s Orders</span>
                    <p className="text-3xl font-black tracking-tight text-amber-700">{thisMonth.length}</p>
                    <span className="block text-[11.5px] font-bold text-amber-700 uppercase">{monthLabel}</span>
                  </div>
                  <div className="bg-white border border-[#E3E8EF] rounded-[24px] p-5 space-y-2 shadow-sm">
                    <span className="block text-[10.5px] uppercase tracking-[0.16em] font-extrabold text-[#6F7E92]">Total Sales Revenue</span>
                    <p className="text-2xl sm:text-3xl font-black tracking-tight text-[#2F6BFF]">₹{revenue(orders).toLocaleString('en-IN')}</p>
                    <span className="block text-[11.5px] font-bold text-emerald-700">{counted.length} orders, excluding cancelled</span>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-[24px] p-5 space-y-2 shadow-sm">
                    <span className="block text-[10.5px] uppercase tracking-[0.16em] font-extrabold text-emerald-900">This Month&apos;s Revenue</span>
                    <p className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-700">₹{revenue(thisMonth).toLocaleString('en-IN')}</p>
                    <span className="block text-[11.5px] font-bold text-emerald-700 uppercase">Current month total</span>
                  </div>
                </div>

                {/* Search & status filter */}
                <div className="bg-white p-4 rounded-[24px] border border-[#E3E8EF] shadow-sm flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3">
                  <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <input
                      type="search"
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      placeholder="Search orders by Order #, Name, Email or Phone..."
                      aria-label="Search orders"
                      className="flex-1 px-5 py-3 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full text-[14px] text-[#0E1A2B] font-semibold focus:outline-none focus:bg-white focus:border-[#2F6BFF] transition-all"
                    />
                    <select
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value as 'All' | OrderStatus)}
                      aria-label="Filter by status"
                      className="px-5 py-3 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full text-[13px] text-[#0E1A2B] font-extrabold uppercase tracking-wider focus:outline-none focus:border-[#2F6BFF] cursor-pointer"
                    >
                      <option value="All">All Statuses ({orders.length})</option>
                      {ORDER_STATUSES.map((status) => <option key={status} value={status}>{status} ({countOf(status)})</option>)}
                    </select>
                    <select
                      value={orderDateFilter}
                      onChange={(e) => setOrderDateFilter(e.target.value as OrderDateFilter)}
                      aria-label="Filter by order date"
                      className={`px-5 py-3 border rounded-full text-[13px] font-extrabold uppercase tracking-wider focus:outline-none focus:border-[#2F6BFF] cursor-pointer ${orderDateFilter === 'all' ? 'bg-[#F3F6FA] border-[#E3E8EF] text-[#0E1A2B]' : 'bg-[#EAF1FF] border-[#2F6BFF] text-[#1F55E0]'}`}
                    >
                      {ORDER_DATE_FILTERS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                    </select>
                  </div>
                  <p className="text-[13px] font-bold text-[#6F7E92] whitespace-nowrap">Showing {visibleOrders.length} of {orders.length} orders</p>
                </div>

                {/* Date filter: a custom range, and what the chosen period covers */}
                {orderDateFilter !== 'all' && (
                  <div className="-mt-3 bg-[#F5F8FF] border border-[#DCE7FF] rounded-[20px] px-4 py-3 flex flex-col md:flex-row md:items-center gap-3">
                    {orderDateFilter === 'custom' ? (
                      <div className="flex flex-wrap items-center gap-2.5">
                        <label className="flex items-center gap-2 text-[12.5px] font-bold text-[#5B6B80]">
                          From
                          <input type="date" value={orderDateFrom} max={orderDateTo || undefined} onChange={(e) => setOrderDateFrom(e.target.value)} className="px-3 py-2 bg-white border border-[#E3E8EF] rounded-xl text-[13px] font-semibold text-[#0E1A2B] focus:outline-none focus:border-[#2F6BFF]" />
                        </label>
                        <label className="flex items-center gap-2 text-[12.5px] font-bold text-[#5B6B80]">
                          To
                          <input type="date" value={orderDateTo} min={orderDateFrom || undefined} onChange={(e) => setOrderDateTo(e.target.value)} className="px-3 py-2 bg-white border border-[#E3E8EF] rounded-xl text-[13px] font-semibold text-[#0E1A2B] focus:outline-none focus:border-[#2F6BFF]" />
                        </label>
                      </div>
                    ) : (
                      <p className="text-[13px] font-semibold text-[#3A4A5F]">
                        {ORDER_DATE_FILTERS.find((option) => option.id === orderDateFilter)?.label}:{' '}
                        <span className="font-bold text-[#0E1A2B]">{dateRange && (dateRange[0] === dateRange[1] ? new Date(`${dateRange[0]}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : `${new Date(`${dateRange[0]}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${new Date(`${dateRange[1]}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`)}</span>
                      </p>
                    )}
                    <p className="md:ml-auto text-[13px] font-semibold text-[#3A4A5F]">
                      <span className="font-bold text-[#0E1A2B]">{visibleOrders.length}</span> {visibleOrders.length === 1 ? 'order' : 'orders'} · <span className="font-bold text-[#2F6BFF]">₹{revenue(visibleOrders).toLocaleString('en-IN')}</span> sales
                    </p>
                    <button type="button" onClick={() => { setOrderDateFilter('all'); setOrderDateFrom(''); setOrderDateTo(''); }} className="self-start md:self-auto px-4 py-2 rounded-full bg-white border border-[#DCE7FF] text-[#1F55E0] text-[12.5px] font-bold hover:bg-[#EAF1FF]">Clear date</button>
                  </div>
                )}

                <div className="bg-white border border-[#E3E8EF] rounded-[24px] shadow-sm overflow-hidden">
                  {/* Compact screens: one card per order */}
                  <div className="xl:hidden grid grid-cols-1 md:grid-cols-2 gap-3 p-3">
                    {visibleOrders.length === 0 && <p className="md:col-span-2 p-6 text-center text-[13px] font-semibold text-[#6F7E92]">No orders match your filters.</p>}
                    {visibleOrders.map((ord) => (
                      <div key={ord.id} className="rounded-[20px] border border-[#E3E8EF] p-4 space-y-3 text-[14px]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-mono font-black text-[#2F6BFF]">#{ord.orderNumber}</p>
                            <p className="font-bold text-[#0E1A2B] truncate">{ord.customerName}</p>
                          </div>
                          <span className={`shrink-0 px-3 py-1 rounded-full text-[10.5px] font-black uppercase tracking-wider border ${orderStatusStyle(ord.orderStatus)}`}>{ord.orderStatus}</span>
                        </div>
                        <div className="flex justify-between gap-3"><span className="text-[#6F7E92] font-semibold">Total</span><strong className="font-black text-[#2F6BFF]">₹{ord.total.toLocaleString('en-IN')}</strong></div>
                        <div className="flex justify-between items-center gap-2 text-[12px] py-2 border-y border-[#EDF1F6]">
                          <span className="text-[#6F7E92] font-semibold">Payment:</span>
                          <span className="flex items-center gap-2 min-w-0">
                            <span className={`px-2 py-0.5 rounded-md border text-[9.5px] font-black uppercase ${paymentBadge(ord)}`}>{ord.paymentStatus}</span>
                            <span className="font-mono text-[11px] text-[#0E1A2B] truncate">{ord.paymentId ?? ord.paymentMethod}</span>
                          </span>
                        </div>
                        <p className="text-[12px] font-semibold text-[#6F7E92]">{itemCount(ord)} · {shortDate(ord)}</p>
                        <div className="bg-[#F6F8FB] border border-[#E3E8EF] rounded-xl p-3 space-y-0.5">
                          <p className="font-bold text-[#0E1A2B]">{ord.customerName}</p>
                          <p className="text-[12px] text-[#6F7E92] break-all">{ord.email}</p>
                          <p className="text-[12px] text-[#6F7E92]">{ord.phone}</p>
                        </div>
                        <label className="block text-[12px] font-bold text-[#6F7E92]">
                          Order status
                          <select
                            aria-label={`Status for ${ord.orderNumber}`}
                            value={ord.orderStatus}
                            disabled={ord.orderStatus === 'Cancelled'}
                            onChange={(e) => changeOrderStatus(ord, e.target.value as OrderStatus)}
                            className="block w-full mt-2 p-3 border border-[#E3E8EF] rounded-xl bg-white text-[14px] font-bold text-[#0E1A2B] disabled:opacity-60"
                          >
                            {ORDER_STATUSES.map((status) => <option key={status}>{status}</option>)}
                          </select>
                        </label>
                        <button type="button" onClick={() => setShiprocketOrderId(ord.id)} className="w-full border border-[#2F6BFF] text-[#2F6BFF] rounded-xl py-3 text-[13px] font-bold">
                          {shipLabel(ord) === 'Shipment' ? 'View shipment' : 'Shipping · enter parcel details'}
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                          <button type="button" onClick={() => openInvoice(ord)} className="border border-[#E3E8EF] text-[#0E1A2B] rounded-xl py-3 text-[13px] font-bold">Invoice</button>
                          <button type="button" onClick={() => setOrderDetailsId(ord.id)} className="bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white rounded-xl py-3 text-[13px] font-bold">View details</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop table */}
                  <div className="hidden xl:block overflow-x-auto">
                    <table className="w-full text-left text-[13px]">
                      <thead>
                        <tr className="border-b border-[#E3E8EF] uppercase tracking-wider text-[10.5px] font-extrabold text-[#6F7E92] bg-[#F6F8FB]">
                          <th className="py-3.5 px-2.5">Order #</th>
                          <th className="py-3.5 px-2.5">Customer</th>
                          <th className="py-3.5 px-2.5">Total</th>
                          <th className="py-3.5 px-2.5">Payment</th>
                          <th className="py-3.5 px-2.5">Status</th>
                          <th className="py-3.5 px-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EDF1F6]">
                        {visibleOrders.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-10 text-center text-[13px] font-semibold text-[#6F7E92]">No orders matching the selected filter criteria.</td>
                          </tr>
                        )}
                        {visibleOrders.map((ord) => (
                          <tr key={ord.id} className="hover:bg-[#F6F8FB] transition-colors">
                            <td className="py-3 px-2.5">
                              <span className="font-mono font-black text-[#2F6BFF] block whitespace-nowrap">#{ord.orderNumber}</span>
                              <span className="block text-[11px] text-[#6F7E92] font-semibold">{shortDate(ord)}</span>
                              {ord.shipment && (
                                <span className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-black uppercase whitespace-nowrap ${ord.shipment.status === 'Cancelled' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-700'}`}>
                                  <PanelIcon name="truck" size={11} />{ord.shipment.remoteStatus ?? ord.shipment.status}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-2.5">
                              <span className="font-bold text-[#0E1A2B] block">{ord.customerName}</span>
                              <span className="text-[11px] text-[#6F7E92] block max-w-[170px] truncate" title={ord.email}>{ord.email}</span>
                              <span className="text-[11px] text-[#2F6BFF] font-semibold block">{ord.phone}</span>
                            </td>
                            <td className="py-3 px-2.5 whitespace-nowrap">
                              <span className="block text-[14px] font-black text-[#2F6BFF]">₹{ord.total.toLocaleString('en-IN')}</span>
                              <span className="block text-[11px] font-semibold text-[#6F7E92]">{itemCount(ord)}</span>
                            </td>
                            <td className="py-3 px-2.5">
                              <span className={`inline-flex px-2 py-0.5 rounded-md border text-[10px] font-black uppercase tracking-wider ${paymentBadge(ord)}`}>{ord.paymentStatus}</span>
                              <span className="block mt-1 font-mono text-[11px] text-[#6F7E92] whitespace-nowrap">{ord.paymentId ?? '—'}</span>
                            </td>
                            <td className="py-3 px-2.5">
                              <select
                                value={ord.orderStatus}
                                onChange={(e) => changeOrderStatus(ord, e.target.value as OrderStatus)}
                                disabled={ord.orderStatus === 'Cancelled'}
                                aria-label={`Status for ${ord.orderNumber}`}
                                title={ord.orderStatus === 'Cancelled' ? 'Cancelled orders are closed; their stock was returned' : 'Changing the status emails the customer'}
                                className={`px-2.5 py-1.5 rounded-lg text-[10.5px] font-black uppercase tracking-wider border cursor-pointer disabled:cursor-not-allowed ${orderStatusStyle(ord.orderStatus)}`}
                              >
                                {ORDER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                              </select>
                            </td>
                            <td className="py-3 px-2.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button type="button" onClick={() => setShiprocketOrderId(ord.id)} className="px-2.5 py-1.5 border border-[#2F6BFF] text-[#2F6BFF] hover:bg-[#EAF1FF] rounded-lg text-[11px] font-extrabold whitespace-nowrap">{shipLabel(ord)}</button>
                                <button type="button" onClick={() => openInvoice(ord)} title="Open the invoice to print or save as PDF" className="px-2.5 py-1.5 bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white rounded-lg text-[11px] font-extrabold inline-flex items-center gap-1 shadow-sm">
                                  <PanelIcon name="receipt" size={13} /> Invoice
                                </button>
                                <button type="button" onClick={() => setOrderDetailsId(ord.id)} className="px-2.5 py-1.5 bg-[#F3F6FA] hover:bg-[#0E1A2B] hover:text-white text-[#0E1A2B] border border-[#E3E8EF] rounded-lg text-[11px] font-extrabold transition-colors">Details</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ========================================================================= */}
          {/* 8b. CUSTOMERS TAB */}
          {/* ========================================================================= */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-[28px] border border-[#E3E8EF] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-[#0E1A2B]">Registered Customers</h3>
                  <p className="text-[13px] text-[#6F7E92] font-semibold">
                    {customers.length} customers • {customers.filter((c) => customerStats(c.email).orderCount > 0).length} have ordered
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={exportCustomersCsv}
                    className="px-5 py-2.5 bg-[#F3F6FA] hover:bg-[#E3E8EF] text-[#0E1A2B] border border-[#E3E8EF] rounded-full text-[13px] font-extrabold transition-all flex items-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={() => {
                      setNewCustomerName('');
                      setNewCustomerEmail('');
                      setNewCustomerPhone('');
                      setCustomerFormError('');
                      setIsCustomerModalOpen(true);
                    }}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white rounded-full text-[13px] font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <span>➕</span>
                    <span>Add Customer</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search customers by name, email or phone..."
                  className="flex-1 px-6 py-3.5 bg-white border border-[#E3E8EF] rounded-full text-[14px] text-[#0E1A2B] focus:outline-none focus:border-[#2F6BFF] transition-all font-semibold shadow-sm"
                />
                <div className="flex bg-white border border-[#E3E8EF] rounded-full p-1 shadow-sm" role="group" aria-label="Filter customers">
                  {([['all', 'All'], ['ordered', 'Ordered'], ['new', 'New (0 orders)']] as const).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setCustomerFilter(key)}
                      aria-pressed={customerFilter === key}
                      className={`px-4 py-2 rounded-full text-[12px] font-extrabold transition-all whitespace-nowrap ${customerFilter === key ? 'bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white shadow-sm' : 'text-[#5B6B80] hover:text-[#0E1A2B]'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <select
                  value={customerSort}
                  onChange={(e) => setCustomerSort(e.target.value as typeof customerSort)}
                  aria-label="Sort customers"
                  className="px-6 py-3.5 bg-white border border-[#E3E8EF] rounded-full text-[14px] text-[#0E1A2B] focus:outline-none focus:border-[#2F6BFF] transition-all font-bold cursor-pointer shadow-sm"
                >
                  <option value="recent">Recently Registered</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="spent">Total Spent (High to Low)</option>
                  <option value="orders">Order Count (High to Low)</option>
                </select>
              </div>

              <div className="bg-white border border-[#E3E8EF] rounded-[36px] p-6 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[14px]">
                    <thead className="text-[#6F7E92] border-b border-[#E3E8EF]">
                      <tr>
                        <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Customer</th>
                        <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Phone</th>
                        <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Registered</th>
                        <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Orders</th>
                        <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Total Spent</th>
                        <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E3E8EF]">
                      {visibleCustomers.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-[13px] font-semibold text-[#6F7E92]">
                            No customers match your search.
                          </td>
                        </tr>
                      )}
                      {visibleCustomers.map((cus) => {
                        const stats = customerStats(cus.email);
                        return (
                          <tr key={cus.id} className="hover:bg-[#F3F6FA]/60 transition-colors">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <span className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#2F6BFF] to-[#5A8BFF] text-white flex items-center justify-center font-black text-[13px] shrink-0">
                                  {cus.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                                </span>
                                <div>
                                  <span className="font-bold text-[#0E1A2B] block">{cus.name}</span>
                                  <span className="text-[12px] text-[#6F7E92] flex items-center gap-1.5">
                                    {cus.email}
                                    <button onClick={() => copyText(cus.email, 'Email')} title="Copy email address" className="text-[#A9B4C2] hover:text-[#2F6BFF]">⧉</button>
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-[13px] font-semibold text-[#5B6B80]">
                              {cus.phone ? (
                                <span className="flex items-center gap-2 whitespace-nowrap">
                                  {cus.phone}
                                  <button onClick={() => copyText(cus.phone, 'Phone number')} title="Copy phone number" className="text-[#A9B4C2] hover:text-[#2F6BFF]">⧉</button>
                                  <a
                                    href={whatsappLink(cus.phone)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Open WhatsApp chat with this customer"
                                    className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-black hover:bg-emerald-100"
                                  >
                                    WhatsApp
                                  </a>
                                </span>
                              ) : (
                                <span className="text-[#A9B4C2]">Not provided</span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-[13px] font-semibold text-[#5B6B80]">{cus.registeredDate}</td>
                            <td className="py-4 px-4 font-bold text-[#0E1A2B]">
                              {stats.orderCount || <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[10px] font-black uppercase">0 • New</span>}
                            </td>
                            <td className="py-4 px-4 font-black text-[#0E1A2B]">₹{stats.totalSpent.toLocaleString()}</td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setCustomerHistoryEmail(cus.email)}
                                  disabled={stats.orderCount === 0}
                                  title="See this customer's order history"
                                  className="px-4 py-1.5 bg-[#F3F6FA] hover:bg-[#EAF1FF] text-[#2F6BFF] border border-[#E3E8EF] rounded-full text-[12px] font-extrabold transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                                >
                                  View Orders
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Remove ${cus.name} from customers?`)) setCustomers(customers.filter((c) => c.id !== cus.id));
                                  }}
                                  className="text-red-500 hover:text-red-700 text-[13px] font-bold px-2"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 9. POS TERMINAL (Live Point of Sale Register) */}
          {/* ========================================================================= */}
          {activeTab === 'pos-terminal' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Product Grid on Left */}
              <div className="lg:col-span-8 space-y-5">
                <div className="bg-white p-5 rounded-[28px] border border-[#E3E8EF] shadow-sm space-y-3">
                  <h3 className="text-lg font-bold tracking-tight text-[#0E1A2B]">Catalog Selector</h3>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search product by title, SKU, or category..."
                      value={posSearchTerm}
                      onChange={(e) => setPosSearchTerm(e.target.value)}
                      className="w-full pl-5 pr-14 sm:pr-28 py-3 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full text-[13px] text-[#0E1A2B] focus:outline-none focus:bg-white focus:border-[#2F6BFF] font-semibold"
                    />
                    <button
                      onClick={() => setIsPosCameraOpen(true)}
                      aria-label="Scan a QR code with the camera"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 sm:px-4 py-1.5 bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white rounded-full text-[11px] font-extrabold shadow-sm flex items-center gap-1.5"
                    >
                      <span className="flex items-center justify-center"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg></span>
                      <span className="hidden sm:inline">Scan</span>
                    </button>
                  </div>
                </div>

                {/* Items Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                  {products
                    .filter(
                      (p) =>
                        p.name.toLowerCase().includes(posSearchTerm.toLowerCase()) ||
                        p.sku.toLowerCase().includes(posSearchTerm.toLowerCase()) ||
                        p.category.toLowerCase().includes(posSearchTerm.toLowerCase())
                    )
                    .map((prod) => (
                      <div
                        key={prod.id}
                        className="bg-white border border-[#E3E8EF] rounded-[24px] p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div className="flex gap-3 items-start">
                          <img
                            src={prod.image}
                            alt={prod.name}
                            className="w-14 h-14 rounded-xl object-cover border border-[#E3E8EF] bg-white shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-[9px] font-black text-[#2F6BFF] uppercase tracking-wider block">
                              {prod.category}
                            </span>
                            <h4 className="font-bold text-[#0E1A2B] text-[13px] leading-snug line-clamp-2">
                              {prod.name}
                            </h4>
                            <span className="font-black text-[#0E1A2B] text-[15px] block mt-1">
                              ₹{prod.price.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="pt-3 mt-2.5 border-t border-[#E3E8EF] flex justify-between items-center">
                          <span className="text-[11px] text-[#6F7E92] font-semibold">Stock: {prod.stock}</span>
                          <button
                            onClick={() => addToPosCart(prod)}
                            disabled={prod.stock <= 0}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-black transition-all ${prod.stock > 0
                              ? 'bg-[#F3F6FA] hover:bg-[#EAF1FF] text-[#2F6BFF] hover:border-[#2F6BFF] border border-[#E3E8EF]'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              }`}
                          >
                            + Add to Bill
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Compact Current Bill Card */}
              <div className="lg:col-span-4 bg-white border border-[#E3E8EF] rounded-[24px] p-4 shadow-sm flex flex-col gap-2.5 sticky top-6 self-start w-full">
                {/* Header */}
                <div className="flex justify-between items-center pb-2.5 border-b border-[#E3E8EF]">
                  <div>
                    <h3 className="text-[14px] font-black text-[#0E1A2B] uppercase tracking-wide">Current Bill</h3>
                    <p className="text-[10px] text-[#6F7E92] font-semibold">Terminal #01 · Walk-in Sale</p>
                  </div>
                  {posCart.length > 0 && (
                    <button onClick={() => setPosCart([])} className="text-[11px] text-red-500 hover:text-red-700 font-bold px-2 py-0.5 rounded-full hover:bg-red-50">Clear All</button>
                  )}
                </div>

                {/* Customer Row */}
                <div className="bg-[#F6F8FB] p-2.5 rounded-2xl border border-[#E3E8EF] space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#6F7E92]">Customer Info</span>
                    <div className="flex gap-2">
                      <button className="text-[10px] font-bold text-[#2F6BFF] hover:underline" onClick={() => { setCustomerLookupQuery(posCustomerPhone.trim() || posCustomerName.trim()); setIsCustomerLookupOpen(true); }}>Lookup</button>
                      <button className="text-[10px] font-bold text-[#2F6BFF] hover:underline" onClick={() => { setNewCustomerFormName(posCustomerName); setNewCustomerFormPhone(posCustomerPhone); setNewCustomerFormError(''); setIsNewCustomerModalOpen(true); }}>+ New</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      value={posCustomerName}
                      onChange={(e) => setPosCustomerName(e.target.value)}
                      placeholder="Name *"
                      required
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E3E8EF] rounded-xl text-[12px] font-semibold text-[#0E1A2B] focus:outline-none focus:border-[#2F6BFF]"
                    />
                    <input
                      id="pos-customer-phone"
                      type="tel"
                      inputMode="numeric"
                      value={posCustomerPhone}
                      onChange={(e) => setPosCustomerPhone(e.target.value)}
                      placeholder="Phone *"
                      required
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E3E8EF] rounded-xl text-[12px] font-semibold text-[#0E1A2B] focus:outline-none focus:border-[#2F6BFF]"
                    />
                  </div>
                </div>

                {/* Cart Items */}
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-0.5 custom-scrollbar">
                  {posCart.length === 0 ? (
                    <div className="py-7 text-center text-[#6F7E92] text-[12px] font-semibold border border-dashed border-[#E3E8EF] rounded-2xl">
                      Cart empty · Click &quot;+ Add to Bill&quot;
                    </div>
                  ) : (
                    posCart.map((item) => (
                      <div key={item.product.id} className="p-2 bg-[#F3F6FA] rounded-xl flex justify-between items-center">
                        <div className="min-w-0 flex-1 mr-2">
                          <span className="font-bold text-[#0E1A2B] text-[12px] block truncate">{item.product.name}</span>
                          <span className="text-[11px] text-[#2F6BFF] font-black">₹{item.product.price.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button onClick={() => updatePosQty(item.product.id, -1)} className="w-5 h-5 rounded-full bg-white border border-[#E3E8EF] font-black text-[11px] hover:bg-[#EAF1FF] flex items-center justify-center">-</button>
                          <span className="font-black text-[12px] w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updatePosQty(item.product.id, 1)} className="w-5 h-5 rounded-full bg-white border border-[#E3E8EF] font-black text-[11px] hover:bg-[#EAF1FF] flex items-center justify-center">+</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Totals */}
                <div className="border-t border-[#E3E8EF] pt-2 space-y-1 text-[11.5px] font-semibold text-[#5B6B80]">
                  <div className="flex justify-between"><span>Subtotal</span><span className="font-bold text-[#0E1A2B]">₹{posSubtotal.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>GST (18%)</span><span className="font-bold text-[#0E1A2B]">₹{posTax.toLocaleString()}</span></div>
                  <div className="flex justify-between items-center text-[14px] font-black text-[#0E1A2B] pt-1 border-t border-[#E3E8EF]">
                    <span>Total</span>
                    <div className="flex items-center text-[#2F6BFF]">
                      <span>₹</span>
                      <input type="number" value={posManualTotal !== '' ? posManualTotal : posCalculatedTotal} onChange={(e) => setPosManualTotal(e.target.value)} className="w-20 bg-transparent outline-none border-b border-dashed border-[#2F6BFF] ml-1 text-right py-0 font-black text-[14px]" />
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="grid grid-cols-3 gap-1.5">
                  {(['UPI', 'Card', 'COD'] as const).map((method) => (
                    <button key={method} onClick={() => setPosPaymentMethod(method)}
                      className={`py-1 rounded-lg text-[11px] font-black border transition-all ${posPaymentMethod === method ? 'bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white border-transparent shadow-xs' : 'bg-[#F3F6FA] text-[#5B6B80] border-[#E3E8EF] hover:bg-white'}`}>
                      {method}
                    </button>
                  ))}
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCompletePosOrder}
                  disabled={posCart.length === 0}
                  className={`w-full py-2.5 rounded-full font-black text-[12px] uppercase tracking-wider transition-all ${posCart.length > 0 ? 'bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white shadow-md hover:shadow-lg' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                >
                  Pay ₹{posTotal.toLocaleString()}
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 10. POS HISTORY TAB */}
          {/* ========================================================================= */}
          {activeTab === 'pos-history' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-[28px] border border-[#E3E8EF] shadow-sm flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-[#0E1A2B]">POS In-Store Register History</h3>
                  <p className="text-[13px] text-[#6F7E92] font-semibold">Audit trail of completed counter sales</p>
                </div>
                <div className="flex items-center gap-3">
                  <button className="px-4 py-2 bg-[#F3F6FA] border border-[#E3E8EF] hover:bg-[#E3E8EF] text-[#0E1A2B] font-extrabold text-[12px] rounded-full flex items-center gap-1.5 transition-all shadow-sm">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                    Bulk Upload
                  </button>
                  <span className="px-4 py-1.5 bg-[#EAF1FF] text-[#2F6BFF] font-black text-[13px] rounded-full border border-[#C9D9FF]">
                    {posHistory.length} Receipts Logged
                  </span>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="bg-white border border-[#E3E8EF] rounded-[36px] p-6 shadow-sm overflow-hidden">
                <table className="w-full text-left text-[14px]">
                  <thead className="text-[#6F7E92] border-b border-[#E3E8EF]">
                    <tr>
                      <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Receipt No.</th>
                      <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Date & Time</th>
                      <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Customer</th>
                      <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Cashier / Reg</th>
                      <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Payment</th>
                      <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Total Paid</th>
                      <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E3E8EF]">
                    {posHistory.map((tx) => (
                      <tr key={tx.id} className="hover:bg-[#F3F6FA]/60 transition-colors">
                        <td className="py-4 px-4 font-mono font-bold text-[#2F6BFF]">{tx.receiptNo}</td>
                        <td className="py-4 px-4 text-[#5B6B80] font-semibold text-[13px]">{tx.date}</td>
                        <td className="py-4 px-4 font-bold text-[#0E1A2B]">{tx.customer}</td>
                        <td className="py-4 px-4 text-[13px] text-[#5B6B80] font-medium">{tx.cashier}</td>
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 bg-[#F3F6FA] border border-[#E3E8EF] text-[#0E1A2B] rounded-full text-[11px] font-black">
                            {tx.paymentMethod}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-black text-[#0E1A2B] text-[15px]">
                          ₹{tx.total.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setExchangeTx(tx);
                                setExchangeSelected([]);
                                setIsExchangeModalOpen(true);
                              }}
                              className="px-4 py-1.5 bg-white hover:bg-[#F3F6FA] text-[#0E1A2B] border border-[#E3E8EF] rounded-full text-[12px] font-bold transition-all shadow-sm"
                            >
                              Exchange
                            </button>
                            <button
                              onClick={() => setPosReceiptModal(tx)}
                              className="px-4 py-1.5 bg-[#F3F6FA] hover:bg-[#EAF1FF] text-[#2F6BFF] border border-[#E3E8EF] rounded-full text-[12px] font-extrabold transition-all"
                            >
                              Print Receipt
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 11. VIDEOS TAB (Product Video Marketing) */}
          {/* ========================================================================= */}
          {activeTab === 'videos' && (
            <div className="space-y-6">
              {/* Header Toolbar */}
              <div className="bg-white p-6 rounded-[28px] border border-[#E3E8EF] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-[#0E1A2B]">Product Video Marketing</h3>
                  <p className="text-[13px] text-[#6F7E92] font-semibold">Upload product demos, unboxings & feature reviews</p>
                </div>
                <button
                  onClick={() => setIsUploadVideoModalOpen(true)}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white rounded-full text-[13px] font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <PanelIcon name="video" size={16} />
                  <span>Upload New Video</span>
                </button>
              </div>

              {/* Video Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((vid) => (
                  <div
                    key={vid.id}
                    className="bg-white border border-[#E3E8EF] rounded-[32px] overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
                  >
                    {/* Thumbnail & Video Preview simulation */}
                    <div className="relative h-48 bg-[#0E1A2B] overflow-hidden">
                      <img
                        src={vid.thumbnail || products.find((p) => p.name === vid.productName)?.image || ''}
                        alt={vid.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/90 text-[#2F6BFF] flex items-center justify-center font-black text-xl shadow-lg pl-1">
                          ▶
                        </div>
                      </div>
                      <span className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/70 text-white rounded-lg text-[11px] font-mono font-bold">
                        {vid.duration}
                      </span>
                    </div>

                    {/* Meta info */}
                    <div className="p-6 space-y-3">
                      <span className="px-3 py-1 bg-[#EAF1FF] text-[#2F6BFF] rounded-full text-[11px] font-black uppercase tracking-wider border border-[#C9D9FF]">
                        Linked: {vid.productName}
                      </span>
                      <h4 className="font-bold text-[#0E1A2B] text-[15px] leading-snug">{vid.title}</h4>
                      <div className="flex justify-between items-center text-[12px] text-[#6F7E92] font-semibold pt-2 border-t border-[#E3E8EF]">
                        <span className="inline-flex items-center gap-1"><PanelIcon name="views" size={14} />{vid.views.toLocaleString()} views</span>
                        <span>{vid.dateAdded}</span>
                      </div>
                    </div>

                    <div className="px-6 pb-5 pt-1 flex justify-end gap-3">
                      <button
                        onClick={() => setPlayingVideo(vid)}
                        className="text-[12px] text-[#2F6BFF] font-black hover:underline"
                      >
                        Play Demo
                      </button>
                      <button
                        onClick={() => setVideos(videos.filter((v) => v.id !== vid.id))}
                        className="text-[12px] text-red-500 font-bold hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 12. REPORTS TAB */}
          {/* ========================================================================= */}
          {activeTab === 'reports' && (
            <div className="space-y-8">
              {/* Summary Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { title: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, change: `Website ₹${websiteRevenue.toLocaleString('en-IN')} · POS ₹${posRevenue.toLocaleString('en-IN')}`, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg> },
                  { title: 'Total Orders', value: orders.length.toString(), change: `${orders.filter((o) => o.orderStatus === 'Delivered').length} delivered · ${orders.filter((o) => o.orderStatus === 'Cancelled').length} cancelled`, color: 'text-blue-600', bg: 'bg-blue-50', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg> },
                  { title: 'Products Listed', value: products.length.toString(), change: `${products.filter((p) => p.stock === 0).length} sold out · ${products.reduce((sum, p) => sum + p.stock, 0).toLocaleString('en-IN')} units`, color: 'text-purple-600', bg: 'bg-purple-50', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg> },
                  { title: 'POS Transactions', value: posHistory.length.toString(), change: `₹${posRevenue.toLocaleString('en-IN')} in-store sales`, color: 'text-[#2F6BFF]', bg: 'bg-[#EAF1FF]', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg> },
                ].map((card, i) => (
                  <div key={i} className="bg-white border border-[#E3E8EF] rounded-[28px] p-6 shadow-sm hover:shadow-md transition-shadow">
                    <span className={`mb-4 w-11 h-11 rounded-2xl ${card.bg} flex items-center justify-center ${card.color}`}>{card.icon}</span>
                    <p className="text-[11px] text-[#6F7E92] font-bold uppercase tracking-wider mb-1">{card.title}</p>
                    <p className="text-2xl font-black text-[#0E1A2B] tracking-tight">{card.value}</p>
                    <p className={`mt-1 text-[12px] font-bold ${card.color}`}>{card.change}</p>
                  </div>
                ))}
              </div>

              {/* Sales by Category */}
              <div className="bg-white border border-[#E3E8EF] rounded-[36px] p-8 shadow-sm">
                <h3 className="text-xl font-bold tracking-tight text-[#0E1A2B] mb-1">Sales by Category</h3>
                <p className="text-[12px] text-[#6F7E92] font-semibold mb-6">Website orders (not cancelled) and POS bills.</p>
                <div className="space-y-4">
                  {categories.map((cat) => {
                    const catRevenue = soldLines.filter((line) => categoryOfSale(line) === cat.name).reduce((sum, line) => sum + line.amount, 0);
                    const allSales = soldLines.reduce((sum, line) => sum + line.amount, 0);
                    const percentage = allSales > 0 ? Math.round((catRevenue / allSales) * 100) : 0;
                    return (
                      <div key={cat.id} className="flex items-center gap-4">
                        <div className="w-32 text-[13px] font-bold text-[#0E1A2B] truncate">{cat.name}</div>
                        <div className="flex-1 bg-[#F3F6FA] rounded-full h-3 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] rounded-full transition-all duration-700"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="w-16 text-right text-[13px] font-extrabold text-[#2F6BFF]">{percentage}%</div>
                        <div className="w-28 text-right text-[12px] font-bold text-[#6F7E92]">₹{catRevenue.toLocaleString()}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Inventory & Order Report Table */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Products */}
                <div className="bg-white border border-[#E3E8EF] rounded-[36px] p-6 shadow-sm">
                  <h3 className="text-lg font-bold tracking-tight text-[#0E1A2B] mb-4">Top Products by Stock Value</h3>
                  <div className="space-y-3">
                    {[...products]
                      .sort((a, b) => (b.price * b.stock) - (a.price * a.stock))
                      .slice(0, 5)
                      .map((p, i) => (
                        <div key={p.id} className="flex items-center gap-3 p-3 bg-[#F3F6FA] rounded-2xl">
                          <span className="w-7 h-7 rounded-full bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white flex items-center justify-center text-[11px] font-black">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-[#0E1A2B] truncate">{p.name}</p>
                            <p className="text-[11px] text-[#6F7E92] font-semibold">{p.stock} units × ₹{p.price.toLocaleString()}</p>
                          </div>
                          <span className="text-[13px] font-black text-[#2F6BFF]">₹{(p.price * p.stock).toLocaleString()}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Recent Orders Summary */}
                <div className="bg-white border border-[#E3E8EF] rounded-[36px] p-6 shadow-sm">
                  <h3 className="text-lg font-bold tracking-tight text-[#0E1A2B] mb-4">Recent Orders</h3>
                  <div className="space-y-3">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-[#F3F6FA] rounded-2xl">
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-[#0E1A2B]">{order.customerName}</p>
                          <p className="text-[11px] text-[#6F7E92] font-semibold">{order.date} • {order.paymentMethod}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${order.orderStatus === 'Delivered' ? 'bg-emerald-100 text-emerald-700'
                            : order.orderStatus === 'Shipped' ? 'bg-blue-100 text-blue-700'
                              : order.orderStatus === 'Processing' ? 'bg-amber-100 text-amber-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>{order.orderStatus}</span>
                          <span className="text-[13px] font-black text-[#0E1A2B]">₹{order.total.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Category Hierarchy Overview */}
              <div className="bg-white border border-[#E3E8EF] rounded-[36px] p-8 shadow-sm">
                <h3 className="text-xl font-bold tracking-tight text-[#0E1A2B] mb-6">Category Hierarchy Map</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((cat) => (
                    <div key={cat.id} className="border border-[#E3E8EF] rounded-[24px] p-5 bg-[#F8FAFC]">
                      <p className="text-[14px] font-black text-[#0E1A2B] mb-3 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF]"></span>
                        {cat.name}
                      </p>
                      <div className="pl-4 space-y-2">
                        {subCategories.filter(sc => sc.parentCategory === cat.name).map((sc) => (
                          <div key={sc.id}>
                            <p className="text-[12px] font-bold text-[#5B6B80] flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#6F7E92]"></span>
                              {sc.name}
                            </p>
                            <div className="pl-4 mt-1 space-y-1">
                              {subSubCategories.filter(ssc => ssc.parentCategory === cat.name && ssc.parentSubCategory === sc.name).map((ssc) => (
                                <p key={ssc.id} className="text-[11px] font-semibold text-[#6F7E92] flex items-center gap-1.5">
                                  <span className="w-1 h-1 rounded-full bg-[#CFD8E3]"></span>
                                  {ssc.name}
                                </p>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 13. HERO BANNERS TAB (Storefront Slider) */}
          {/* ========================================================================= */}
          {activeTab === 'banners' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-[28px] border border-[#E3E8EF] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-[#0E1A2B]">Home Hero Banners</h3>
                  <p className="text-[13px] text-[#6F7E92] font-semibold">
                    {banners.filter((b) => b.isActive).length} of {banners.length} slides live on the storefront home page
                  </p>
                </div>
                <button
                  onClick={() => openBannerModal()}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white rounded-full text-[13px] font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <PanelIcon name="image" size={16} />
                  <span>Add New Banner</span>
                </button>
              </div>

              <div className="space-y-5">
                {banners.length === 0 && (
                  <div className="bg-white border border-dashed border-[#CFD8E3] rounded-[32px] p-12 text-center text-[13px] font-semibold text-[#6F7E92]">
                    No banners yet. Add one to show a slider on the storefront home page.
                  </div>
                )}
                {banners.map((bn, idx) => (
                  <div key={bn.id} className={`bg-white border border-[#E3E8EF] rounded-[32px] overflow-hidden shadow-sm ${bn.isActive ? '' : 'opacity-70'}`}>
                    {/* Slide preview */}
                    <div className="relative h-44 md:h-56 bg-[#0E1A2B]">
                      <img src={bn.imageUrl} alt={bn.title} className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-black/60" />
                      <div
                        className={`absolute inset-0 p-6 md:p-10 flex flex-col justify-center ${bn.textAlign === 'center' ? 'items-center text-center' : bn.textAlign === 'right' ? 'items-end text-right' : 'items-start text-left'}`}
                        style={{ color: bn.textColor }}
                      >
                        <h4 className="text-2xl md:text-4xl font-black tracking-tight">{bn.title}</h4>
                        {bn.subtitle && <p className="text-[13px] md:text-[15px] font-semibold mt-2 max-w-md opacity-90">{bn.subtitle}</p>}
                        {bn.ctaText && (
                          <span className="mt-4 px-5 py-2 bg-white text-[#0E1A2B] rounded-full text-[12px] font-extrabold shadow-md">{bn.ctaText} →</span>
                        )}
                      </div>
                      <span className="absolute top-4 left-4 px-3 py-1 bg-black/60 text-white rounded-full text-[11px] font-black">Slide {idx + 1}</span>
                      {bn.mobileImageUrl && (
                        <span className="absolute top-4 right-4 px-3 py-1 bg-black/60 text-white rounded-full text-[11px] font-black inline-flex items-center gap-1"><PanelIcon name="mobile" size={12} />Mobile image set</span>
                      )}
                    </div>

                    <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="text-[12px] text-[#6F7E92] font-semibold">
                        Button links to <span className="font-mono font-bold text-[#0E1A2B]">{bn.ctaLink}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => moveBanner(idx, -1)}
                          disabled={idx === 0}
                          aria-label="Move banner up"
                          className="w-9 h-9 rounded-full bg-[#F3F6FA] border border-[#E3E8EF] hover:bg-[#E3E8EF] text-[13px] font-black disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveBanner(idx, 1)}
                          disabled={idx === banners.length - 1}
                          aria-label="Move banner down"
                          className="w-9 h-9 rounded-full bg-[#F3F6FA] border border-[#E3E8EF] hover:bg-[#E3E8EF] text-[13px] font-black disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => setBanners(banners.map((b) => (b.id === bn.id ? { ...b, isActive: !b.isActive } : b)))}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider ${bn.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}
                        >
                          {bn.isActive ? 'Live' : 'Hidden'}
                        </button>
                        <button
                          onClick={() => openBannerModal(bn)}
                          className="px-4 py-1.5 bg-[#F3F6FA] hover:bg-[#EAF1FF] text-[#2F6BFF] border border-[#E3E8EF] rounded-full text-[12px] font-extrabold transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete the banner "${bn.title}"?`)) setBanners(banners.filter((b) => b.id !== bn.id));
                          }}
                          className="text-red-500 hover:text-red-700 text-[12px] font-bold px-2"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 14. INSTAGRAM FEED TAB */}
          {/* ========================================================================= */}
          {activeTab === 'instagram' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-[28px] border border-[#E3E8EF] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-[#0E1A2B]">Instagram Feed</h3>
                  <p className="text-[13px] text-[#6F7E92] font-semibold">Posts shown in the &quot;Follow us on Instagram&quot; section of the storefront</p>
                </div>
                <button
                  onClick={() => {
                    setNewIgUrl('');
                    setNewIgImage('');
                    setNewIgCaption('');
                    setIsInstagramModalOpen(true);
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white rounded-full text-[13px] font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <PanelIcon name="camera" size={16} />
                  <span>Add Instagram Post</span>
                </button>
              </div>

              {instagramPosts.length === 0 ? (
                <div className="bg-white border border-dashed border-[#CFD8E3] rounded-[32px] p-12 text-center text-[13px] font-semibold text-[#6F7E92]">
                  No Instagram posts added yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {instagramPosts.map((post) => (
                    <div key={post.id} className="bg-white border border-[#E3E8EF] rounded-[32px] overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col">
                      <div className="aspect-square bg-[#F3F6FA] overflow-hidden">
                        <img src={post.imageUrl} alt={post.caption || 'Instagram post'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                        <p className="text-[13px] font-semibold text-[#0E1A2B] leading-snug line-clamp-3">{post.caption || <span className="text-[#6F7E92]">No caption</span>}</p>
                        <div className="flex justify-between items-center pt-3 border-t border-[#E3E8EF]">
                          <a href={post.postUrl} target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#2F6BFF] font-black hover:underline">
                            View Post ↗
                          </a>
                          <button
                            onClick={() => setInstagramPosts(instagramPosts.filter((p) => p.id !== post.id))}
                            className="text-[12px] text-red-500 font-bold hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'themes' && <ThemeSetup notify={notify} />}
          {activeTab === 'store-details' && <StoreDetailsSettings notify={notify} />}

          {/* ========================================================================= */}
          {/* 15. ADMIN SECURITY TAB */}
          {/* ========================================================================= */}
          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {signedInSubAdmin ? (
                <div className="lg:col-span-5 bg-white border border-[#E3E8EF] rounded-[28px] p-7 shadow-sm">
                  <h3 className="text-xl font-bold">Demo sub-admin access</h3>
                  <p className="mt-2 text-sm text-[#5B6B80]">Only the super admin can manage demo accounts. Ask your admin to update your assigned modules.</p>
                </div>
              ) : (
                <section className="lg:col-span-5 bg-white border border-[#E3E8EF] rounded-[28px] p-7 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div><h3 className="text-xl font-bold">Demo sub-admin access</h3><p className="mt-1 text-sm text-[#5B6B80]">Create sample staff logins and choose which admin modules each person can open. Demo only; credentials are stored in this browser.</p></div>
                    <span className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-extrabold uppercase tracking-wide">Demo access</span>
                  </div>
                  <div className="mt-6 grid sm:grid-cols-3 gap-3">
                    <input aria-label="Sub-admin name" placeholder="Staff name" value={subAdminDraft.name} onChange={(e) => setSubAdminDraft({ ...subAdminDraft, name: e.target.value })} className="px-4 py-3 rounded-xl bg-[#F3F6FA] border border-[#E3E8EF] text-sm" />
                    <input aria-label="Sub-admin email" type="email" placeholder="Email address" value={subAdminDraft.email} onChange={(e) => setSubAdminDraft({ ...subAdminDraft, email: e.target.value })} className="px-4 py-3 rounded-xl bg-[#F3F6FA] border border-[#E3E8EF] text-sm" />
                    <input aria-label="Sub-admin password" placeholder="Demo password" value={subAdminDraft.password} onChange={(e) => setSubAdminDraft({ ...subAdminDraft, password: e.target.value })} className="px-4 py-3 rounded-xl bg-[#F3F6FA] border border-[#E3E8EF] text-sm" />
                  </div>
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-bold text-[#0E1A2B]">Pages this person can open <span className="ml-1 text-[#6F7E92] font-semibold">{subAdminDraft.permissions.length} of {SUBADMIN_MODULES.length}</span></p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setSubAdminDraft({ ...subAdminDraft, permissions: SUBADMIN_MODULES.map((module) => module.id) })} className="px-3.5 py-1.5 rounded-full bg-[#EAF1FF] text-[#2F6BFF] text-xs font-bold hover:bg-[#DCE7FF]">Select all</button>
                      <button type="button" onClick={() => setSubAdminDraft({ ...subAdminDraft, permissions: [] })} className="px-3.5 py-1.5 rounded-full bg-[#F3F6FA] text-[#5B6B80] text-xs font-bold hover:bg-[#E3E8EF]">Clear</button>
                    </div>
                  </div>
                  <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {SUBADMIN_GROUPS.map((group) => (
                      <div key={group} className="rounded-2xl border border-[#E3E8EF] p-3">
                        <p className="px-1 pb-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#6F7E92]">{group}</p>
                        <div className="space-y-1.5">
                          {SUBADMIN_MODULES.filter((module) => module.group === group).map((module) => <label key={module.id} className="flex items-center gap-2.5 rounded-xl bg-[#F6F8FB] px-3 py-2.5 text-sm font-semibold cursor-pointer"><input type="checkbox" checked={subAdminDraft.permissions.includes(module.id)} onChange={() => setSubAdminDraft({ ...subAdminDraft, permissions: toggleInList(subAdminDraft.permissions, module.id) as AdminTab[] })} className="accent-[#2F6BFF]" />{module.label}</label>)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-[#6F7E92]">Admin Security (staff logins and the admin password) always stays with the super admin.</p>
                  {subAdminError && <p role="alert" className="mt-4 text-sm font-bold text-red-600">{subAdminError}</p>}
                  <button onClick={() => {
                    const email = subAdminDraft.email.trim().toLowerCase();
                    if (!subAdminDraft.name.trim() || !email || !subAdminDraft.password.trim() || !subAdminDraft.permissions.length) return setSubAdminError('Enter the staff details and select at least one module.');
                    if (email === adminEmail.toLowerCase() || demoSubAdmins.some((account) => account.id !== editingSubAdminId && account.email.toLowerCase() === email)) return setSubAdminError('That email is already in use.');
                    if (editingSubAdminId) setDemoSubAdmins(demoSubAdmins.map((account) => account.id === editingSubAdminId ? { ...subAdminDraft, id: editingSubAdminId, name: subAdminDraft.name.trim(), email } : account));
                    else setDemoSubAdmins([{ ...subAdminDraft, id: `sub-${Date.now()}`, name: subAdminDraft.name.trim(), email }, ...demoSubAdmins]);
                    setSubAdminDraft({ name: '', email: '', password: '', permissions: [] });
                    setEditingSubAdminId(null);
                    setSubAdminError('');
                  }} className="mt-5 px-5 py-3 rounded-full bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white text-sm font-extrabold">{editingSubAdminId ? 'Save sub-admin access' : 'Add demo sub-admin'}</button>
                  <div className="mt-6 space-y-3">
                    {demoSubAdmins.map((account) => <div key={account.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E3E8EF] p-4">
                      <div className="min-w-[200px]"><p className="font-bold">{account.name} <span className="ml-2 text-[11px] uppercase tracking-wide text-[#2F6BFF]">Sub-admin</span></p><p className="text-sm text-[#5B6B80]">{account.email} · Password: {account.password}</p><p className="mt-1 text-xs text-[#6F7E92]">{account.permissions.map((permission) => TAB_TITLES[permission]).join(' · ')}</p></div>
                      <div className="flex gap-2"><button onClick={() => { setEditingSubAdminId(account.id); setSubAdminDraft({ name: account.name, email: account.email, password: account.password, permissions: account.permissions }); setSubAdminError(''); }} className="px-3 py-2 rounded-full bg-[#F3F6FA] text-xs font-bold">Edit access</button><button onClick={() => setDemoSubAdmins(demoSubAdmins.filter((item) => item.id !== account.id))} className="px-3 py-2 rounded-full bg-red-50 text-red-600 text-xs font-bold">Remove</button></div>
                    </div>)}
                    {!demoSubAdmins.length && <p className="text-sm text-[#6F7E92]">No sub-admin demo accounts yet.</p>}
                  </div>
                </section>
              )}
              {!signedInSubAdmin && <RazorpaySettings notify={notify} />}
              {/* Account Overview */}
              <div className="lg:col-span-2 bg-white border border-[#E3E8EF] rounded-[36px] p-8 shadow-sm space-y-5 h-fit">
                <div className="flex items-center gap-4">
                  <span className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#2F6BFF] to-[#5A8BFF] text-white flex items-center justify-center shadow-lg shadow-[#2F6BFF]/20">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                  </span>
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-[#0E1A2B]">Active Account</h3>
                    <p className="text-[12px] font-extrabold text-[#2F6BFF] uppercase tracking-wider">Super Admin</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="p-4 bg-[#F3F6FA] border border-[#E3E8EF] rounded-2xl">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#6F7E92]">Admin Email</p>
                    <p className="text-[14px] font-bold text-[#0E1A2B] break-all">{adminEmail}</p>
                  </div>
                  <div className="p-4 bg-[#F3F6FA] border border-[#E3E8EF] rounded-2xl flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#6F7E92]">Password</p>
                      <p className="text-[14px] font-bold text-[#0E1A2B] tracking-widest">{visiblePasswords.includes('active') ? adminPassword : '•'.repeat(adminPassword.length)}</p>
                    </div>
                    <button
                      onClick={() => setVisiblePasswords(toggleInList(visiblePasswords, 'active'))}
                      aria-label={visiblePasswords.includes('active') ? 'Hide password' : 'Show password'}
                      className={`shrink-0 w-9 h-9 rounded-full border flex items-center justify-center transition-colors ${visiblePasswords.includes('active') ? 'bg-[#EAF1FF] border-[#2F6BFF]/40 text-[#2F6BFF]' : 'bg-white border-[#E3E8EF] text-[#6F7E92] hover:border-[#2F6BFF] hover:text-[#2F6BFF]'}`}
                    >
                      <PanelIcon name={visiblePasswords.includes('active') ? 'eye-off' : 'eye'} size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-[#F3F6FA] border border-[#E3E8EF] rounded-2xl">
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#6F7E92]">Role</p>
                      <p className="text-[14px] font-bold text-[#0E1A2B]">Super Admin / Seller</p>
                    </div>
                    <div className="p-4 bg-[#F3F6FA] border border-[#E3E8EF] rounded-2xl">
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#6F7E92]">Session Length</p>
                      <p className="text-[14px] font-bold text-[#0E1A2B]">8 Hours</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setLoginEmail('');
                    setLoginPassword('');
                    setIsLoggedIn(false);
                  }}
                  className="w-full py-3 bg-white hover:bg-[#EAF1FF] text-[#2F6BFF] font-bold rounded-full text-[13px] transition-all border border-[#E3E8EF] hover:border-[#2F6BFF]"
                >
                  Sign Out & Test Login
                </button>
                <div className="pt-5 border-t border-[#E3E8EF] space-y-2">
                  <p className="text-[12px] font-extrabold uppercase tracking-wider text-[#6F7E92]">Demo Data</p>
                  <p className="text-[12px] text-[#5B6B80] font-semibold">Products, orders, coupons and the rest are saved in this browser and shared with the website. Resetting puts back the original sample data everywhere.</p>
                  <button
                    onClick={() => {
                      if (!confirm('Reset all products, orders, customers, coupons, banners and settings to the original sample data?')) return;
                      resetDemoData();
                      posHistoryStore.reset();
                      notify('Demo data reset to the original samples');
                    }}
                    className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-full text-[13px] transition-all border border-red-200"
                  >
                    Reset All Demo Data
                  </button>
                </div>
              </div>

              {/* Update Credentials */}
              <div className="lg:col-span-3 bg-white border border-[#E3E8EF] rounded-[36px] p-8 shadow-sm space-y-5">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-[#0E1A2B]">Update Credentials</h3>
                  <p className="text-[13px] text-[#6F7E92] font-semibold">Change the admin email, password, or both. Leave a field empty to keep it.</p>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Current Password *', type: 'password', value: secCurrentPassword, set: setSecCurrentPassword, placeholder: 'Enter current password to confirm it’s you' },
                    { label: 'New Admin Email', type: 'email', value: secNewEmail, set: setSecNewEmail, placeholder: adminEmail },
                    { label: 'New Password', type: 'password', value: secNewPassword, set: setSecNewPassword, placeholder: 'Minimum 6 characters' },
                    { label: 'Confirm New Password', type: 'password', value: secConfirmPassword, set: setSecConfirmPassword, placeholder: 'Repeat new password' },
                  ].map((field) => {
                    const shown = visiblePasswords.includes(field.label);
                    return (
                      <div key={field.label}>
                        <label className="block text-[12px] font-extrabold uppercase tracking-widest text-[#6F7E92] mb-2 pl-2">{field.label}</label>
                        <div className="relative">
                          <input
                            type={field.type === 'password' && shown ? 'text' : field.type}
                            value={field.value}
                            onChange={(e) => { field.set(e.target.value); setSecMessage(null); }}
                            placeholder={field.placeholder}
                            className="w-full pl-6 pr-14 py-3.5 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full text-[14px] text-[#0E1A2B] focus:outline-none focus:bg-white focus:border-[#2F6BFF] transition-all font-semibold placeholder:text-[#A9B4C2]"
                          />
                          {field.type === 'password' && (
                            <button
                              type="button"
                              onClick={() => setVisiblePasswords(toggleInList(visiblePasswords, field.label))}
                              aria-label={shown ? 'Hide password' : 'Show password'}
                              className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${shown ? 'bg-[#EAF1FF] text-[#2F6BFF]' : 'text-[#6F7E92] hover:bg-white hover:text-[#2F6BFF]'}`}
                            >
                              <PanelIcon name={shown ? 'eye-off' : 'eye'} size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {secMessage && (
                  <p className={`text-[13px] font-bold px-4 py-2.5 rounded-xl ${secMessage.ok ? 'text-emerald-700 bg-emerald-50' : 'text-red-500 bg-red-50'}`}>
                    {secMessage.text}
                  </p>
                )}
                <button
                  onClick={handleUpdateCredentials}
                  className="w-full py-3.5 bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white font-extrabold text-[14px] rounded-full shadow-md hover:shadow-lg transition-all"
                >
                  Update Credentials
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* POS CAMERA SCANNER (Live QR / Barcode Reader) */}
      {isPosCameraOpen && (
        <CameraScanner
          onScan={handlePosScan}
          isKnown={(code) => !!findProductByCode(code)}
          onClose={() => setIsPosCameraOpen(false)}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: SCANNER ACTION MODAL (Barcode / QR Scanner Simulation) */}
      {/* ========================================================================= */}
      {isScannerModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E3E8EF] rounded-[36px] p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-[#0E1A2B]">Barcode & Product Scanner</h3>
                <p className="text-[12px] text-[#6F7E92] font-semibold">Camera Viewfinder Active</p>
              </div>
              <button
                onClick={() => setIsScannerModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F3F6FA] hover:bg-[#E3E8EF] flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Simulated Viewfinder */}
            <div className="h-56 bg-neutral-900 rounded-[28px] relative overflow-hidden flex flex-col items-center justify-center text-white border-2 border-dashed border-[#2F6BFF]/50 p-6">
              {isScanning ? (
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-10 h-10 border-4 border-[#2F6BFF] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[13px] font-bold text-[#8FB0FF]">Scanning Barcode...</span>
                  <div className="w-48 h-0.5 bg-red-500 shadow-[0_0_8px_red] animate-pulse"></div>
                </div>
              ) : scannedProduct ? (
                <div className="text-center space-y-2">
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[11px] font-black uppercase">
                    Barcode Matched!
                  </span>
                  <p className="font-mono text-lg font-black text-white">{scannedProduct.barcode}</p>
                  <p className="text-[13px] font-bold text-neutral-300">{scannedProduct.name}</p>
                </div>
              ) : (
                <div className="text-center text-neutral-400 text-sm">
                  Point barcode at center of frame
                </div>
              )}
            </div>

            {/* Product Details Result */}
            {scannedProduct && !isScanning && (
              <div className="p-4 bg-[#F3F6FA] rounded-2xl flex items-center justify-between border border-[#E3E8EF]">
                <div>
                  <span className="text-[11px] text-[#6F7E92] font-extrabold uppercase">Current Stock</span>
                  <p className="text-lg font-black text-[#0E1A2B]">{scannedProduct.stock} Units</p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-[#6F7E92] font-extrabold uppercase">Unit Price</span>
                  <p className="text-lg font-black text-[#2F6BFF]">₹{scannedProduct.price.toLocaleString()}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsScanning(true);
                  setTimeout(() => setIsScanning(false), 1200);
                }}
                className="flex-1 py-3.5 bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white font-extrabold text-[13px] rounded-full shadow-md"
              >
                Scan Another Item
              </button>
              <button
                onClick={() => setIsScannerModalOpen(false)}
                className="px-6 py-3.5 bg-white border border-[#E3E8EF] hover:bg-[#F3F6FA] text-[#0E1A2B] font-extrabold text-[13px] rounded-full"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: BULK ADD MULTIPLE PRODUCTS */}
      {/* ========================================================================= */}
      {isMultiProductModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E3E8EF] rounded-[36px] p-8 max-w-2xl w-full shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-[#0E1A2B]">Bulk Add Multiple Products</h3>
                <p className="text-[12px] text-[#6F7E92] font-semibold">
                  Paste comma-separated rows: Name, SKU, Category, Price, Stock
                </p>
              </div>
              <button
                onClick={() => setIsMultiProductModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F3F6FA] hover:bg-[#E3E8EF] flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <textarea
              rows={6}
              value={multiProductInput}
              onChange={(e) => setMultiProductInput(e.target.value)}
              placeholder={`Example:\nPearl Drop Earrings, MIR-ER-02, Earrings, 7499, 20\nSolitaire Ring, AUR-RG-03, Rings, 15999, 12\nHeritage Necklace, AAR-NK-01, Necklaces, 28999, 10`}
              className="w-full p-5 bg-[#F3F6FA] border border-[#E3E8EF] rounded-[24px] font-mono text-[13px] text-[#0E1A2B] focus:outline-none focus:bg-white focus:border-[#2F6BFF] resize-none"
            ></textarea>

            <div className="flex gap-4">
              <button
                onClick={handleBulkAddSubmit}
                className="flex-1 py-3.5 bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white font-extrabold text-[13px] rounded-full shadow-md hover:shadow-lg"
              >
                Import & Add to Catalog
              </button>
              <button
                onClick={() => setIsMultiProductModalOpen(false)}
                className="px-6 py-3.5 bg-white border border-[#E3E8EF] hover:bg-[#F3F6FA] text-[#5B6B80] font-bold text-[13px] rounded-full"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: STOCK BY SIZE & COLOR */}
      {/* ========================================================================= */}
      {stockEditProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E3E8EF] rounded-[36px] p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-3.5">
                <img src={stockEditProduct.image} alt={stockEditProduct.name} className="w-12 h-12 rounded-2xl object-cover border border-[#E3E8EF] bg-white" />
                <div>
                  <h3 className="text-xl font-bold text-[#0E1A2B]">Stock by Size & Color</h3>
                  <p className="text-[12px] text-[#6F7E92] font-semibold">{stockEditProduct.name} • {stockEditProduct.sku}</p>
                </div>
              </div>
              <button
                onClick={() => setStockEditProduct(null)}
                className="w-8 h-8 shrink-0 rounded-full bg-[#F3F6FA] hover:bg-[#E3E8EF] flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <VariantStockGrid
              sizes={stockEditProduct.sizes}
              colors={stockEditProduct.colors}
              values={stockEditValues}
              onChange={setStockEditValues}
              colorHex={colorHex}
            />

            <p className="text-[12px] text-[#6F7E92] font-semibold">
              To add or remove sizes and colors, use{' '}
              <button
                onClick={() => { const prod = stockEditProduct; setStockEditProduct(null); openEditProduct(prod); }}
                className="text-[#2F6BFF] font-bold hover:underline"
              >
                Edit Product
              </button>.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleSaveStock}
                className="flex-1 py-3.5 bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white font-extrabold text-[13px] rounded-full shadow-md"
              >
                Save Stock
              </button>
              <button
                onClick={() => setStockEditProduct(null)}
                className="px-6 py-3.5 bg-white border border-[#E3E8EF] hover:bg-[#F3F6FA] text-[#5B6B80] font-bold text-[13px] rounded-full"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: CREATE / EDIT COUPON MODAL */}
      {/* ========================================================================= */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E3E8EF] rounded-[36px] p-8 max-w-lg w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-[#0E1A2B]">{editingCouponId ? 'Edit Coupon' : 'Generate New Coupon'}</h3>
              <button
                onClick={() => setIsCouponModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F3F6FA] hover:bg-[#E3E8EF] flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#6F7E92] mb-1 pl-2">
                  Coupon Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. FLASH30"
                  value={newCouponCode}
                  onChange={(e) => { setNewCouponCode(e.target.value.toUpperCase().replace(/\s/g, '')); setCouponFormError(''); }}
                  className="w-full px-5 py-3 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full text-[13px] font-mono font-bold text-[#0E1A2B]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#6F7E92] mb-1 pl-2">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Festive Jewellery — 20% off on selected pieces"
                  value={newCouponDescription}
                  onChange={(e) => setNewCouponDescription(e.target.value)}
                  className="w-full px-5 py-3 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full text-[13px] font-semibold text-[#0E1A2B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-[#6F7E92] mb-1 pl-2">Type</label>
                  <select
                    value={newCouponType}
                    onChange={(e) => setNewCouponType(e.target.value as Coupon['discountType'])}
                    className="w-full px-4 py-3 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full text-[13px] font-bold"
                  >
                    <option value="Percentage">Percentage (%)</option>
                    <option value="Fixed">Fixed (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-[#6F7E92] mb-1 pl-2">Value</label>
                  <input
                    type="number"
                    min="0"
                    placeholder={newCouponType === 'Percentage' ? 'e.g. 20' : 'e.g. 500'}
                    value={newCouponValue}
                    onChange={(e) => setNewCouponValue(e.target.value)}
                    className="w-full px-5 py-3 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full text-[13px] font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-[#6F7E92] mb-1 pl-2">
                    Min Purchase (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newCouponMin}
                    onChange={(e) => setNewCouponMin(e.target.value)}
                    className="w-full px-5 py-3 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full text-[13px] font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-[#6F7E92] mb-1 pl-2">
                    Max Discount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder={newCouponType === 'Percentage' ? 'Optional cap' : 'Only for %'}
                    disabled={newCouponType !== 'Percentage'}
                    value={newCouponType === 'Percentage' ? newCouponMaxDiscount : ''}
                    onChange={(e) => setNewCouponMaxDiscount(e.target.value)}
                    className="w-full px-5 py-3 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full text-[13px] font-bold disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-[#6F7E92] mb-1 pl-2">Valid From</label>
                  <input
                    type="date"
                    value={newCouponFrom}
                    onChange={(e) => setNewCouponFrom(e.target.value)}
                    className="w-full px-5 py-3 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full text-[13px] font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-[#6F7E92] mb-1 pl-2 flex justify-between">
                    <span>Valid Until</span>
                    {newCouponDate && <button type="button" onClick={() => setNewCouponDate('')} className="text-[#2F6BFF] normal-case">Clear</button>}
                  </label>
                  <input
                    type="date"
                    value={newCouponDate}
                    onChange={(e) => setNewCouponDate(e.target.value)}
                    className="w-full px-5 py-3 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full text-[13px] font-bold"
                  />
                  <p className="text-[11px] text-[#6F7E92] font-semibold mt-1 pl-2">Blank = never expires</p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#6F7E92] mb-1 pl-2">
                  Usage Limit
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Blank = unlimited"
                  value={newCouponUsageLimit}
                  onChange={(e) => setNewCouponUsageLimit(e.target.value)}
                  className="w-full px-5 py-3 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full text-[13px] font-bold"
                />
              </div>

              <label className="flex items-center justify-between gap-3 px-5 py-3 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full cursor-pointer">
                <span className="text-[13px] font-bold text-[#0E1A2B]">Active (customers can use it)</span>
                <input
                  type="checkbox"
                  checked={newCouponActive}
                  onChange={(e) => setNewCouponActive(e.target.checked)}
                  className="w-4 h-4 accent-[#2F6BFF]"
                />
              </label>

              <label className="flex items-center justify-between gap-3 px-5 py-3 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full cursor-pointer">
                <span className="text-[13px] font-bold text-[#0E1A2B]">Show in store header marquee</span>
                <input
                  type="checkbox"
                  checked={newCouponShowInHeader}
                  onChange={(e) => setNewCouponShowInHeader(e.target.checked)}
                  className="w-4 h-4 accent-[#2F6BFF]"
                />
              </label>
            </div>

            {/* Validation Checklist */}
            <div className="p-4 bg-[#F8FAFC] border border-[#E3E8EF] rounded-[20px]">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#6F7E92] mb-2">Validation Checklist</p>
              <ul className="space-y-1 text-[12px] font-semibold">
                {[
                  [/^[A-Z0-9_-]{3,20}$/.test(newCouponCode), 'Code is 3–20 characters: capital letters, numbers, - and _ only'],
                  [!coupons.some((c) => c.id !== editingCouponId && c.code === newCouponCode), 'Code is not used by another coupon'],
                  [parseFloat(newCouponValue) > 0 && (newCouponType === 'Fixed' || parseFloat(newCouponValue) <= 100), newCouponType === 'Percentage' ? 'Discount is between 1% and 100%' : 'Discount amount is above ₹0'],
                  [!newCouponDate || !newCouponFrom || newCouponFrom <= newCouponDate, 'Start date is on or before the end date'],
                ].map(([ok, text]) => (
                  <li key={String(text)} className={ok ? 'text-emerald-700' : 'text-[#6F7E92]'}>
                    {ok ? '✓' : '○'} {text}
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-[#6F7E92] font-semibold mt-2">The discount applies automatically at checkout once a shopper enters the code.</p>
            </div>

            {couponFormError && (
              <p role="alert" className="text-red-500 text-[13px] font-bold bg-red-50 px-4 py-2.5 rounded-xl">{couponFormError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSaveCoupon}
                className="flex-1 py-3.5 bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white font-extrabold text-[13px] rounded-full shadow-md"
              >
                {editingCouponId ? 'Save Changes' : 'Create Coupon'}
              </button>
              <button
                onClick={() => setIsCouponModalOpen(false)}
                className="px-6 py-3.5 bg-white border border-[#E3E8EF] hover:bg-[#F3F6FA] text-[#5B6B80] font-bold text-[13px] rounded-full"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: POS RECEIPT SLIP MODAL */}
      {/* ========================================================================= */}
      {posReceiptModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E3E8EF] rounded-[36px] p-8 max-w-sm w-full shadow-2xl space-y-6 text-center font-mono">
            <div className="space-y-1">
              <PanelIcon name="bag" size={22} />
              <h3 className="text-lg font-black text-[#0E1A2B]">COMMERCE HUB</h3>
              <p className="text-[11px] text-[#6F7E92]">Receipt: {posReceiptModal.receiptNo}</p>
              <p className="text-[10px] text-[#6F7E92]">{posReceiptModal.date}</p>
            </div>

            <div className="border-t border-b border-dashed border-[#E3E8EF] py-4 text-left text-[12px] space-y-2">
              <p>Customer: {posReceiptModal.customer}</p>
              {posReceiptModal.customerPhone && <p>Phone: {posReceiptModal.customerPhone}</p>}
              <p>Cashier: {posReceiptModal.cashier}</p>
              <p>Method: {posReceiptModal.paymentMethod}</p>

              <div className="pt-2 border-t border-dashed border-[#E3E8EF] space-y-1">
                {posReceiptModal.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>
                      <span className="block font-bold">{it.name}</span>
                      <span className="block text-[10px] text-[#6F7E92] font-medium tracking-wide">Qty: {it.qty}</span>
                    </span>
                    <span className="font-bold">₹{(it.price * it.qty).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center text-lg font-black text-[#0E1A2B]">
              <span>TOTAL PAID</span>
              <span className="text-[#2F6BFF]">₹{posReceiptModal.total.toLocaleString()}</span>
            </div>

            <button
              onClick={() => setPosReceiptModal(null)}
              className="w-full py-3 bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white rounded-full font-bold text-[13px] shadow-md"
            >
              Close & Print
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL X: POS EXCHANGE MODAL */}
      {/* ========================================================================= */}
      {isExchangeModalOpen && exchangeTx && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E3E8EF] rounded-[36px] p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-[#0E1A2B]">Process Exchange</h3>
                <p className="text-[12px] text-[#6F7E92] mt-1 font-mono font-semibold">{exchangeTx.receiptNo}</p>
              </div>
              <button onClick={() => setIsExchangeModalOpen(false)} className="w-8 h-8 rounded-full bg-[#F3F6FA] hover:bg-[#E3E8EF] flex items-center justify-center text-sm font-bold">✕</button>
            </div>

            <div className="space-y-3">
              <p className="text-[13px] font-bold text-[#0E1A2B]">Select the items the customer is bringing back. They go back into stock on the website too.</p>
              {exchangeTx.items.map((it, idx) => {
                const returned = exchangeTx.returnedItems?.includes(idx);
                return (
                <label key={idx} className={`flex items-center gap-3 p-3.5 bg-[#F3F6FA] border border-[#E3E8EF] rounded-2xl transition-colors ${returned ? 'opacity-60' : 'cursor-pointer hover:border-[#2F6BFF]/50'}`}>
                  <input
                    type="checkbox"
                    disabled={returned}
                    checked={returned || exchangeSelected.includes(idx)}
                    onChange={(e) => setExchangeSelected(e.target.checked ? [...exchangeSelected, idx] : exchangeSelected.filter((i) => i !== idx))}
                    className="w-4 h-4 accent-[#2F6BFF] rounded border-[#E3E8EF]"
                  />
                  <div className="flex-1">
                    <span className="text-[13px] font-bold text-[#0E1A2B] block">{it.name}</span>
                    <span className="text-[11px] text-[#6F7E92] font-semibold">Qty: {it.qty}{returned ? ' · already returned' : ''}</span>
                  </div>
                  <span className="text-[13px] font-black text-[#2F6BFF]">₹{(it.price * it.qty).toLocaleString()}</span>
                </label>
                );
              })}
            </div>

            <div className="pt-2">
              <button
                disabled={exchangeSelected.length === 0}
                onClick={() => {
                  const picked = exchangeSelected.map((idx) => exchangeTx.items[idx]);
                  // Put back exactly the size/colour the sale took; older bills fall back to the product's first variant.
                  const lines = picked.flatMap((it) => {
                    const product = products.find((p) => p.id === it.productId) ?? products.find((p) => p.name === it.name);
                    if (!product) return [];
                    const taken = exchangeTx.stockLines?.filter((l) => l.productId === product.id);
                    if (taken?.length) return taken;
                    const size = Object.keys(product.variantStock)[0] ?? STANDARD;
                    const color = Object.keys(product.variantStock[size] ?? {})[0] ?? STANDARD;
                    return [{ productId: product.id, size, color, qty: it.qty }];
                  });
                  returnToStock(lines);
                  setPosHistory(posHistory.map((tx) => (tx.id === exchangeTx.id ? { ...tx, returnedItems: [...(tx.returnedItems ?? []), ...exchangeSelected] } : tx)));
                  setIsExchangeModalOpen(false);
                  notify(`${picked.reduce((sum, it) => sum + it.qty, 0)} item(s) from ${exchangeTx.receiptNo} returned to stock`);
                }}
                className="w-full py-4 bg-[#0E1A2B] hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-[14px] rounded-full shadow-md transition-all active:scale-95 flex justify-center items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                Return selected to stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: UPLOAD PRODUCT VIDEO */}
      {/* ========================================================================= */}
      {isUploadVideoModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E3E8EF] rounded-[36px] p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-[#0E1A2B]">Upload Product Video</h3>
              <button
                onClick={() => setIsUploadVideoModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F3F6FA] hover:bg-[#E3E8EF] flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#6F7E92] mb-1 pl-2">
                  Video Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Unboxing & Review"
                  value={newVidTitle}
                  onChange={(e) => setNewVidTitle(e.target.value)}
                  className="w-full px-5 py-3 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full text-[13px] font-semibold text-[#0E1A2B]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#6F7E92] mb-1 pl-2">
                  Linked Product
                </label>
                <select
                  value={newVidProduct}
                  onChange={(e) => setNewVidProduct(e.target.value)}
                  className="w-full px-5 py-3 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full text-[13px] font-bold"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#6F7E92] mb-1 pl-2">
                  Duration (MM:SS)
                </label>
                <input
                  type="text"
                  value={newVidDuration}
                  onChange={(e) => setNewVidDuration(e.target.value)}
                  className="w-full px-5 py-3 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full text-[13px] font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#6F7E92] mb-1 pl-2">Video URL</label>
                <input type="url" value={newVidVideoUrl} onChange={(e) => setNewVidVideoUrl(e.target.value)} placeholder="https://… .mp4 file or YouTube link" className="w-full px-5 py-3 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full text-[13px] font-semibold" />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#6F7E92] mb-1 pl-2">Cover image URL</label>
                <input type="url" value={newVidThumbnail} onChange={(e) => setNewVidThumbnail(e.target.value)} placeholder="Leave empty to use the product photo" className="w-full px-5 py-3 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full text-[13px] font-semibold" />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (!newVidTitle) return;
                  setVideos([
                    {
                      id: `vid-${Date.now()}`,
                      title: newVidTitle,
                      productName: newVidProduct,
                      duration: newVidDuration || '01:30',
                      views: 0,
                      thumbnail: newVidThumbnail,
                      videoUrl: newVidVideoUrl.trim() || DEMO_VIDEO_URL,
                      dateAdded: localDate(),
                    },
                    ...videos,
                  ]);
                  setIsUploadVideoModalOpen(false);
                  setNewVidTitle('');
                  setNewVidVideoUrl('');
                  setNewVidThumbnail('');
                  notify('Video published — it now shows on the storefront');
                }}
                className="flex-1 py-3.5 bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white font-extrabold text-[13px] rounded-full shadow-md"
              >
                Publish Video
              </button>
              <button
                onClick={() => setIsUploadVideoModalOpen(false)}
                className="px-6 py-3.5 bg-white border border-[#E3E8EF] hover:bg-[#F3F6FA] text-[#5B6B80] font-bold text-[13px] rounded-full"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: ORDER INVOICE (A4 or 4×6 label, prints on its own) */}
      {/* ========================================================================= */}
      {selectedOrderForView && (() => {
        const inv = orders.find((o) => o.id === selectedOrderForView.id) ?? selectedOrderForView;
        const compact = invoicePaper === '4x6';
        const taxable = inv.total / 1.18;
        const variantLabel = (size: string, color: string) =>
          [size !== STANDARD && `Size: ${size}`, color !== STANDARD && `Color: ${color}`].filter(Boolean).join(' • ') || 'One size';
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <style>{`
              @page { size: ${compact ? '4in 6in' : 'A4'}; margin: ${compact ? '6mm' : '12mm'}; }
              @media print {
                body * { visibility: hidden !important; }
                #invoice-print, #invoice-print * { visibility: visible !important; }
                #invoice-print { position: absolute; inset: 0 auto auto 0; width: 100%; padding: 0 !important; }
              }
            `}</style>
            <div className="bg-white max-w-4xl w-full shadow-2xl relative overflow-hidden flex flex-col h-[90vh] rounded-[28px]">
              <div className="flex flex-wrap justify-between items-center gap-3 p-4 bg-[#F3F6FA] border-b border-[#E3E8EF]">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-[#0E1A2B]">Invoice {inv.orderNumber}</h3>
                  <div className="flex bg-white border border-[#E3E8EF] rounded-full p-0.5" role="group" aria-label="Paper size">
                    {(['A4', '4x6'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => setInvoicePaper(size)}
                        aria-pressed={invoicePaper === size}
                        className={`px-3.5 py-1 rounded-full text-[12px] font-extrabold transition-all ${invoicePaper === size ? 'bg-[#0E1A2B] text-white' : 'text-[#5B6B80]'}`}
                      >
                        {size === 'A4' ? 'A4 Invoice' : '4×6 Label'}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrderForView(null)}
                  className="w-8 h-8 rounded-full bg-white hover:bg-[#E3E8EF] flex items-center justify-center text-sm font-bold shadow-sm"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto bg-[#E3E8EF]/50 p-4 sm:p-8">
                <div
                  id="invoice-print"
                  className={`bg-white mx-auto shadow-sm text-[#0E1A2B] ${compact ? 'max-w-[384px] p-5 text-[11px]' : 'max-w-3xl p-8 sm:p-12 text-[13px]'}`}
                >
                  {/* Header */}
                  <div className={`flex justify-between items-start gap-4 ${compact ? 'mb-4 pb-3 border-b-2 border-[#0E1A2B]' : 'mb-10'}`}>
                    <div>
                      <h1 className={`${compact ? 'text-[20px]' : 'text-[40px]'} font-black tracking-tighter leading-none`}>{compact ? 'SHIP TO' : 'TAX INVOICE'}</h1>
                      <p className="font-bold mt-1.5">#{inv.orderNumber}</p>
                      <p className="text-[#5B6B80]">{inv.date}</p>
                    </div>
                    <div className="text-right">
                      <h2 className={`${compact ? 'text-[13px]' : 'text-[19px]'} font-black`}>{storeInfo.name}</h2>
                      {!compact && <p className="text-[#5B6B80] max-w-[240px] ml-auto leading-snug mt-1">{storeInfo.address}</p>}
                    </div>
                  </div>

                  {/* Addresses */}
                  <div className={`grid ${compact ? 'grid-cols-1 gap-3 mb-4' : 'grid-cols-3 gap-6 mb-10 pt-6 border-t border-[#E3E8EF]'}`}>
                    {!compact && (
                      <div>
                        <h4 className="text-[10px] font-extrabold uppercase text-[#6F7E92] tracking-wider mb-1.5">Billed To</h4>
                        <p className="font-black">{inv.customerName}</p>
                        <p>{inv.email}</p>
                        <p>{inv.phone}</p>
                      </div>
                    )}
                    <div>
                      <h4 className="text-[10px] font-extrabold uppercase text-[#6F7E92] tracking-wider mb-1.5">{compact ? 'Deliver To' : 'Shipped To'}</h4>
                      <p className={`font-black ${compact ? 'text-[15px]' : ''}`}>{inv.customerName}</p>
                      <p className="leading-snug">{inv.shippingAddress}</p>
                      <p>{inv.city}{inv.state ? `, ${inv.state}` : ''} - <span className="font-bold">{inv.postalCode}</span></p>
                      <p className="font-semibold">Phone: {inv.phone}</p>
                    </div>
                    <div className={compact ? 'flex justify-between border-y border-dashed border-[#A9B4C2] py-2' : 'text-right'}>
                      <div>
                        <h4 className="text-[10px] font-extrabold uppercase text-[#6F7E92] tracking-wider mb-1.5">Payment</h4>
                        <p className="font-bold">{inv.paymentMethod}</p>
                        <p className={inv.paymentStatus === 'Paid' ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                          {inv.paymentMethod === 'Cash on Delivery' && inv.paymentStatus !== 'Paid' ? `COLLECT ₹${inv.total.toLocaleString('en-IN')}` : inv.paymentStatus.toUpperCase()}
                        </p>
                        {inv.paymentId && <p className="font-mono text-[#5B6B80]">{inv.paymentId}</p>}
                      </div>
                      {inv.shipment && (
                        <div className={compact ? 'text-right' : 'mt-3'}>
                          <h4 className="text-[10px] font-extrabold uppercase text-[#6F7E92] tracking-wider mb-1">{inv.shipment.courier}</h4>
                          <p className="font-mono font-bold">AWB {inv.shipment.awb}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Items */}
                  <table className={`w-full ${compact ? 'mb-3' : 'mb-8'}`}>
                    <thead>
                      <tr className="border-b-2 border-[#0E1A2B] text-[10px] font-extrabold uppercase tracking-wider">
                        <th className="text-left py-2 pr-2">S.No</th>
                        <th className="text-left py-2">Item</th>
                        <th className="text-center py-2">Qty</th>
                        {!compact && <th className="text-right py-2">Rate</th>}
                        <th className="text-right py-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inv.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-[#EDF1F6] align-top">
                          <td className="py-3 pr-2 font-bold">{idx + 1}</td>
                          <td className="py-3">
                            <div className="flex items-start gap-3">
                              {!compact && <img src={item.image || productImageFor(item.sku, item.color)} alt="" className="w-11 h-11 rounded-lg object-cover border border-[#E3E8EF]" />}
                              <div>
                                <p className="font-bold leading-snug">{item.name}</p>
                                <p className="text-[#5B6B80]">SKU {item.sku} • {variantLabel(item.size, item.color)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-center">{item.qty}</td>
                          {!compact && <td className="py-3 text-right">₹{item.price.toLocaleString('en-IN')}</td>}
                          <td className="py-3 text-right font-bold">₹{(item.price * item.qty).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals */}
                  <div className={`flex justify-end ${compact ? 'mb-3' : 'mb-10'}`}>
                    <div className={`${compact ? 'w-full' : 'w-72'} space-y-1.5`}>
                      <div className="flex justify-between"><span>Subtotal</span><span>₹{inv.subtotal.toLocaleString('en-IN')}</span></div>
                      {inv.discount > 0 && <div className="flex justify-between text-emerald-700"><span>Promo {inv.promo}</span><span>− ₹{inv.discount.toLocaleString('en-IN')}</span></div>}
                      <div className="flex justify-between"><span>Delivery</span><span>{inv.delivery ? `₹${inv.delivery}` : 'Free'}</span></div>
                      {!compact && (
                        <div className="flex justify-between text-[#5B6B80] italic">
                          <span>Includes GST (18%)</span>
                          <span>₹{(inv.total - taxable).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center border-t-2 border-[#0E1A2B] pt-2 mt-2">
                        <span className={`${compact ? 'text-[14px]' : 'text-[20px]'} font-black`}>Total</span>
                        <span className={`${compact ? 'text-[14px]' : 'text-[20px]'} font-black`}>₹{inv.total.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  {compact ? (
                    <p className="text-center text-[10px] text-[#5B6B80] border-t border-dashed border-[#A9B4C2] pt-2">
                      From: {storeInfo.name}, {storeInfo.address} • {storeInfo.phone}
                    </p>
                  ) : (
                    <div className="pt-6 border-t border-[#E3E8EF] grid grid-cols-2 gap-6 text-[11px] text-[#5B6B80] leading-relaxed">
                      <div>
                        <p className="font-extrabold uppercase tracking-wider text-[#0E1A2B] mb-1">Jewellery Care & Returns</p>
                        <p>{storeInfo.returnPolicy}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold uppercase tracking-wider text-[#0E1A2B] mb-1">Questions?</p>
                        <p>{storeInfo.email}</p>
                        <p>{storeInfo.phone}</p>
                        <p className="mt-3 font-bold text-[#0E1A2B]">For {storeInfo.name}</p>
                        <p>Computer-generated invoice — no signature required.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-[#F3F6FA] border-t border-[#E3E8EF] flex flex-wrap justify-end gap-3">
                <button
                  className="px-5 py-2.5 bg-white border border-[#E3E8EF] hover:bg-[#E3E8EF] text-[#0E1A2B] font-bold text-[13px] rounded-full transition-colors"
                  onClick={() => emailCustomer(inv, 'Invoice')}
                >
                  ✉️ Email to Customer
                </button>
                <button className="px-5 py-2.5 bg-white border border-[#E3E8EF] hover:bg-[#E3E8EF] text-[#0E1A2B] font-bold text-[13px] rounded-full transition-colors" onClick={() => setSelectedOrderForView(null)}>
                  Close
                </button>
                <button className="px-6 py-2.5 bg-[#2F6BFF] hover:bg-[#5A8BFF] text-white font-bold text-[13px] rounded-full transition-colors shadow-sm" onClick={() => window.print()}>
                  Print / Save PDF ({compact ? '4×6' : 'A4'})
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL 7b: ORDER DETAILS (customer, items, payment, shipping, emails) */}
      {/* ========================================================================= */}
      {orderDetailsId && (() => {
        const ord = orders.find((o) => o.id === orderDetailsId);
        if (!ord) return null;
        const steps: OrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Delivered'];
        const reached = steps.indexOf(ord.orderStatus);
        const box = 'p-5 bg-[#F3F6FA] border border-[#E3E8EF] rounded-[24px]';
        const heading = 'text-[11px] font-extrabold uppercase tracking-wider text-[#6F7E92] mb-2';
        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-[#E3E8EF] rounded-[36px] p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-2xl font-black tracking-tight text-[#0E1A2B] font-mono">{ord.orderNumber}</h3>
                    <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${orderStatusStyle(ord.orderStatus)}`}>{ord.orderStatus}</span>
                    <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#F3F6FA] text-[#5B6B80] border border-[#E3E8EF]">{ord.source}</span>
                  </div>
                  <p className="text-[13px] text-[#6F7E92] font-semibold mt-1">Placed {new Date(ord.placedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
                <button onClick={() => setOrderDetailsId(null)} className="w-8 h-8 shrink-0 rounded-full bg-[#F3F6FA] hover:bg-[#E3E8EF] flex items-center justify-center text-sm font-bold">✕</button>
              </div>

              {/* Progress */}
              {ord.orderStatus === 'Cancelled' ? (
                <p className="px-5 py-3 bg-red-50 border border-red-200 text-red-700 rounded-full text-[13px] font-bold">This order was cancelled and its items were returned to stock.</p>
              ) : (
                <ol className="grid grid-cols-4 gap-2">
                  {steps.map((step, i) => (
                    <li key={step} className="text-center">
                      <div className={`h-1.5 rounded-full ${i <= reached ? 'bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF]' : 'bg-[#E3E8EF]'}`} />
                      <p className={`mt-2 text-[11px] font-extrabold uppercase tracking-wider ${i <= reached ? 'text-[#0E1A2B]' : 'text-[#A9B4C2]'}`}>{step}</p>
                    </li>
                  ))}
                </ol>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={box}>
                  <p className={heading}>Customer Details</p>
                  <p className="font-bold text-[#0E1A2B] text-[15px]">{ord.customerName}</p>
                  <p className="text-[13px] text-[#5B6B80] font-semibold flex items-center gap-2">{ord.email}<button onClick={() => copyText(ord.email, 'Email')} className="text-[#2F6BFF] text-[11px] font-black">Copy</button></p>
                  <p className="text-[13px] text-[#5B6B80] font-semibold flex items-center gap-2">{ord.phone}<button onClick={() => copyText(ord.phone, 'Phone')} className="text-[#2F6BFF] text-[11px] font-black">Copy</button></p>
                  <p className="text-[13px] text-[#0E1A2B] font-semibold mt-2 leading-snug">{ord.shippingAddress}, {ord.city}{ord.state ? `, ${ord.state}` : ''} - {ord.postalCode}</p>
                </div>
                <div className={box}>
                  <p className={heading}>Payment</p>
                  <p className="font-bold text-[#0E1A2B] text-[15px]">{ord.paymentMethod}</p>
                  <p className={`text-[13px] font-black uppercase ${ord.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>● {ord.paymentStatus}</p>
                  {ord.paymentDetail && <p className="text-[13px] font-semibold text-[#3A4A5F] mt-1">{ord.paymentDetail}</p>}
                  {ord.paymentId && <p className="text-[12px] font-mono text-[#5B6B80] mt-1">{ord.paymentId}{ord.gatewayOrderId ? ` · ${ord.gatewayOrderId}` : ''}</p>}
                  <div className="mt-3 pt-3 border-t border-[#E3E8EF] text-[13px] font-semibold space-y-1">
                    <div className="flex justify-between"><span className="text-[#5B6B80]">Subtotal</span><span>₹{ord.subtotal.toLocaleString('en-IN')}</span></div>
                    {ord.discount > 0 && <div className="flex justify-between text-emerald-700"><span>Promo {ord.promo}</span><span>− ₹{ord.discount.toLocaleString('en-IN')}</span></div>}
                    <div className="flex justify-between"><span className="text-[#5B6B80]">Delivery</span><span>{ord.delivery ? `₹${ord.delivery}` : 'Free'}</span></div>
                    <div className="flex justify-between font-black text-[15px] pt-1"><span>Total</span><span>₹{ord.total.toLocaleString('en-IN')}</span></div>
                  </div>
                </div>
              </div>

              <div className={box}>
                <p className={heading}>Variant Details</p>
                <div className="space-y-3">
                  {ord.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <img src={item.image || productImageFor(item.sku, item.color)} alt="" className="w-12 h-12 rounded-xl object-cover border border-[#E3E8EF] bg-white" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold text-[#0E1A2B] truncate">{item.name}</p>
                        <p className="text-[12px] text-[#5B6B80] font-semibold">
                          {item.sku} • {item.size !== STANDARD ? `Size ${item.size}` : 'One size'}{item.color !== STANDARD ? ` • ${item.color}` : ''} • Qty {item.qty}
                        </p>
                      </div>
                      <span className="text-[14px] font-black">₹{(item.price * item.qty).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping */}
              <div className={box}>
                <div className="flex flex-wrap justify-between items-center gap-3">
                  <p className={`${heading} !mb-0`}>Shipping · Shiprocket</p>
                  {ord.orderStatus !== 'Cancelled' && (
                    <button onClick={() => setShiprocketOrderId(ord.id)} className="px-4 py-2 bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white rounded-full text-[12px] font-extrabold shadow-sm inline-flex items-center gap-1.5">
                      <PanelIcon name="truck" size={15} /> {ord.shipment && ord.shipment.status !== 'Cancelled' ? 'View shipment' : 'Create shipment'}
                    </button>
                  )}
                </div>
                {ord.shipment ? (
                  <div className="mt-3 text-[13px] font-semibold text-[#0E1A2B] space-y-0.5">
                    <p><span className="text-[#5B6B80]">Shiprocket status:</span> <span className={`font-black ${ord.shipment.status === 'Cancelled' ? 'text-red-600' : 'text-blue-700'}`}>{ord.shipment.remoteStatus ?? ord.shipment.status}</span></p>
                    {ord.shipment.srOrderId && <p><span className="text-[#5B6B80]">Shiprocket order:</span> {ord.shipment.srOrderId} • <span className="text-[#5B6B80]">Shipment:</span> {ord.shipment.srShipmentId}</p>}
                    <p><span className="text-[#5B6B80]">Courier:</span> {ord.shipment.awb ? <>{ord.shipment.courier} • <span className="font-mono">AWB {ord.shipment.awb}</span></> : 'Not assigned yet'}</p>
                    <p><span className="text-[#5B6B80]">Parcel:</span> {ord.shipment.weightKg} kg • {ord.shipment.dimensions} • from {ord.shipment.pickup}</p>
                  </div>
                ) : (
                  <p className="mt-2 text-[13px] text-[#6F7E92] font-semibold">No shipment yet. Create a Shiprocket order with the packed parcel details.</p>
                )}
              </div>

              {/* Emails */}
              <div className={box}>
                <div className="flex flex-wrap justify-between items-center gap-3">
                  <p className={`${heading} !mb-0`}>Customer Emails</p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => emailCustomer(ord, 'Status update')} className="px-4 py-2 bg-white border border-[#E3E8EF] hover:border-[#2F6BFF] text-[#0E1A2B] rounded-full text-[12px] font-extrabold">
                      ✉️ Send Status Update
                    </button>
                    <button onClick={() => emailCustomer(ord, 'Invoice')} className="px-4 py-2 bg-white border border-[#E3E8EF] hover:border-[#2F6BFF] text-[#0E1A2B] rounded-full text-[12px] font-extrabold">
                    <PanelIcon name="receipt" size={15} /> Send Invoice
                    </button>
                  </div>
                </div>
                {ord.emails.length ? (
                  <ul className="mt-3 space-y-1 text-[12px] font-semibold text-[#5B6B80]">
                    {[...ord.emails].reverse().map((mail, i) => (
                      <li key={i}>✓ {mail.kind} sent to {ord.email} • {new Date(mail.at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-[13px] text-[#6F7E92] font-semibold">No emails sent for this order yet.</p>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <button onClick={() => openInvoice(ord, 'A4')} className="flex-1 py-3.5 bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white font-extrabold text-[13px] rounded-full shadow-md">
                  Open Full Invoice
                </button>
                <button onClick={() => openInvoice(ord, '4x6')} className="px-6 py-3.5 bg-white border border-[#E3E8EF] hover:bg-[#F3F6FA] text-[#0E1A2B] font-bold text-[13px] rounded-full">
                  Print 4×6 Label
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL 7c: SHIPROCKET SHIPMENT (Kaavu's dialog, simulated) */}
      {/* ========================================================================= */}
      {shiprocketOrderId && (() => {
        const ord = orders.find((o) => o.id === shiprocketOrderId);
        if (!ord) return null;
        return (
          <ShiprocketDialog
            order={ord}
            onClose={() => setShiprocketOrderId(null)}
            onSave={(changes, message) => {
              updateOrder(ord.id, (o) => ({ ...o, ...changes }));
              notify(message);
            }}
          />
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL 8a: CUSTOMER ORDER HISTORY */}
      {/* ========================================================================= */}
      {customerHistoryEmail && (() => {
        const cus = customers.find((c) => c.email === customerHistoryEmail);
        const history = orders.filter((o) => o.email.toLowerCase() === customerHistoryEmail.toLowerCase());
        const stats = customerStats(customerHistoryEmail);
        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-[#E3E8EF] rounded-[36px] p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-xl font-bold text-[#0E1A2B]">{cus?.name ?? customerHistoryEmail}</h3>
                  <p className="text-[13px] text-[#6F7E92] font-semibold">{customerHistoryEmail}{cus?.phone ? ` • ${cus.phone}` : ''}</p>
                  <p className="text-[13px] font-bold text-[#0E1A2B] mt-1">{stats.orderCount} orders • ₹{stats.totalSpent.toLocaleString('en-IN')} spent</p>
                </div>
                <button onClick={() => setCustomerHistoryEmail(null)} className="w-8 h-8 shrink-0 rounded-full bg-[#F3F6FA] hover:bg-[#E3E8EF] flex items-center justify-center text-sm font-bold">✕</button>
              </div>
              <div className="space-y-3">
                {history.map((ord) => (
                  <div key={ord.id} className="p-4 bg-[#F3F6FA] border border-[#E3E8EF] rounded-[24px] flex flex-wrap items-center gap-4">
                    <div className="flex -space-x-3">
                      {ord.items.slice(0, 3).map((item, i) => (
                        <img key={i} src={item.image || productImageFor(item.sku, item.color)} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-white" />
                      ))}
                    </div>
                    <div className="flex-1 min-w-[160px]">
                      <p className="font-mono font-bold text-[#2F6BFF] text-[13px]">{ord.orderNumber}</p>
                      <p className="text-[12px] text-[#5B6B80] font-semibold">{ord.date} • {ord.itemsCount} item(s) • ₹{ord.total.toLocaleString('en-IN')}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${orderStatusStyle(ord.orderStatus)}`}>{ord.orderStatus}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setCustomerHistoryEmail(null); setOrderDetailsId(ord.id); }}
                        className="px-3 py-1.5 bg-white border border-[#E3E8EF] rounded-full text-[12px] font-extrabold text-[#0E1A2B] hover:border-[#2F6BFF]"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => openInvoice(ord, '4x6')}
                        className="px-3 py-1.5 bg-white border border-[#E3E8EF] rounded-full text-[12px] font-extrabold text-[#2F6BFF] hover:border-[#2F6BFF] whitespace-nowrap"
                      >
                        Print 4×6 Invoice
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  setOrderSearch(customerHistoryEmail);
                  setOrderStatusFilter('All');
                  setCustomerHistoryEmail(null);
                  setActiveTab('orders');
                }}
                className="w-full py-3.5 bg-white border border-[#E3E8EF] hover:bg-[#F3F6FA] text-[#0E1A2B] font-bold text-[13px] rounded-full"
              >
                Filter the Orders page to this customer →
              </button>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL 8: ADD CUSTOMER */}
      {/* ========================================================================= */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E3E8EF] rounded-[36px] p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-[#0E1A2B]">Add Customer</h3>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F3F6FA] hover:bg-[#E3E8EF] flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Full Name *', type: 'text', value: newCustomerName, set: setNewCustomerName, placeholder: 'e.g. Kavya Reddy' },
                { label: 'Email Address *', type: 'email', value: newCustomerEmail, set: setNewCustomerEmail, placeholder: 'demo.customer@example.com' },
                { label: 'Phone Number', type: 'tel', value: newCustomerPhone, set: setNewCustomerPhone, placeholder: '+91 00000 00000' },
              ].map((field) => (
                <div key={field.label}>
                  <label className="block text-[11px] font-extrabold uppercase text-[#6F7E92] mb-1 pl-2">{field.label}</label>
                  <input
                    type={field.type}
                    value={field.value}
                    onChange={(e) => { field.set(e.target.value); setCustomerFormError(''); }}
                    placeholder={field.placeholder}
                    className="w-full px-5 py-3 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full text-[13px] font-semibold text-[#0E1A2B] focus:outline-none focus:bg-white focus:border-[#2F6BFF]"
                  />
                </div>
              ))}
            </div>

            {customerFormError && (
              <p role="alert" className="text-red-500 text-[13px] font-bold bg-red-50 px-4 py-2.5 rounded-xl">{customerFormError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleAddCustomer}
                className="flex-1 py-3.5 bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white font-extrabold text-[13px] rounded-full shadow-md"
              >
                Add Customer
              </button>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="px-6 py-3.5 bg-white border border-[#E3E8EF] hover:bg-[#F3F6FA] text-[#5B6B80] font-bold text-[13px] rounded-full"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 9: ADD / EDIT HERO BANNER */}
      {/* ========================================================================= */}
      {isBannerModalOpen && bannerDraft && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E3E8EF] rounded-[36px] p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-[#0E1A2B]">{bannerDraft.id ? 'Edit Banner' : 'Add New Hero Banner'}</h3>
              <button
                onClick={() => setIsBannerModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F3F6FA] hover:bg-[#E3E8EF] flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Live previews: desktop and phone */}
            <div className="grid grid-cols-[1fr_96px] sm:grid-cols-[1fr_120px] gap-3 items-end">
            <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#6F7E92] mb-1 pl-1">Desktop — 1600 × 500 px</p>
            <div className="relative h-40 rounded-[24px] overflow-hidden bg-[#0E1A2B]">
              {bannerDraft.imageUrl ? (
                <img src={bannerDraft.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[12px] font-bold text-white/50">Add a desktop image below</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-black/60" />
              <div
                className={`absolute inset-0 p-6 flex flex-col justify-center ${bannerDraft.textAlign === 'center' ? 'items-center text-center' : bannerDraft.textAlign === 'right' ? 'items-end text-right' : 'items-start text-left'}`}
                style={{ color: bannerDraft.textColor }}
              >
                <h4 className="text-2xl font-black tracking-tight">{bannerDraft.title || 'Banner title'}</h4>
                {bannerDraft.subtitle && <p className="text-[13px] font-semibold mt-1 opacity-90">{bannerDraft.subtitle}</p>}
                {bannerDraft.ctaText && <span className="mt-3 px-4 py-1.5 bg-white text-[#0E1A2B] rounded-full text-[11px] font-extrabold">{bannerDraft.ctaText} →</span>}
              </div>
            </div>
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#6F7E92] mb-1 text-center">Mobile</p>
              <div className="relative aspect-[4/5] rounded-[18px] overflow-hidden bg-[#0E1A2B] border-[3px] border-[#0E1A2B]">
                {(bannerDraft.mobileImageUrl || bannerDraft.imageUrl) && (
                  <img src={bannerDraft.mobileImageUrl || bannerDraft.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <p className="absolute inset-x-2 bottom-2 text-[10px] font-black leading-tight text-center" style={{ color: bannerDraft.textColor }}>
                  {bannerDraft.title || 'Banner title'}
                </p>
              </div>
            </div>
            </div>
            {!bannerDraft.mobileImageUrl && (
              <p className="text-[11px] text-[#6F7E92] font-semibold -mt-3">Mobile uses the landscape image when no mobile photo is uploaded.</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-extrabold uppercase text-[#6F7E92] mb-1 pl-2">Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Hear Every Detail"
                  value={bannerDraft.title}
                  onChange={(e) => setBannerDraft({ ...bannerDraft, title: e.target.value })}
                  className="w-full px-5 py-3 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full text-[13px] font-semibold text-[#0E1A2B]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-extrabold uppercase text-[#6F7E92] mb-1 pl-2">Subtitle</label>
                <input
                  type="text"
                  placeholder="e.g. Hand-finished necklace — now ₹14,999"
                  value={bannerDraft.subtitle}
                  onChange={(e) => setBannerDraft({ ...bannerDraft, subtitle: e.target.value })}
                  className="w-full px-5 py-3 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full text-[13px] font-semibold text-[#0E1A2B]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#6F7E92] mb-1 pl-2">Button Text</label>
                <input
                  type="text"
                  value={bannerDraft.ctaText}
                  onChange={(e) => setBannerDraft({ ...bannerDraft, ctaText: e.target.value })}
                  className="w-full px-5 py-3 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full text-[13px] font-semibold text-[#0E1A2B]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#6F7E92] mb-1 pl-2">Button Link</label>
                <input
                  type="text"
                  value={bannerDraft.ctaLink}
                  onChange={(e) => setBannerDraft({ ...bannerDraft, ctaLink: e.target.value })}
                  className="w-full px-5 py-3 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full text-[13px] font-mono font-semibold text-[#0E1A2B]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-extrabold uppercase text-[#6F7E92] mb-1 pl-2">Desktop Image * <span className="normal-case font-semibold">(landscape, 1600 × 500 px recommended)</span></label>
                <ImageListField
                  images={bannerDraft.imageUrl ? [bannerDraft.imageUrl] : []}
                  onChange={(images) => setBannerDraft({ ...bannerDraft, imageUrl: images[images.length - 1] ?? '' })}
                  label="Desktop banner image"
                  showCover={false}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-extrabold uppercase text-[#6F7E92] mb-1 pl-2">Mobile Image <span className="normal-case font-semibold">(optional portrait, 800 × 1000 px)</span></label>
                <ImageListField
                  images={bannerDraft.mobileImageUrl ? [bannerDraft.mobileImageUrl] : []}
                  onChange={(images) => setBannerDraft({ ...bannerDraft, mobileImageUrl: images[images.length - 1] ?? '' })}
                  label="Mobile banner image"
                  showCover={false}
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#6F7E92] mb-1 pl-2">Text Position</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['left', 'center', 'right'] as const).map((align) => (
                    <button
                      key={align}
                      type="button"
                      onClick={() => setBannerDraft({ ...bannerDraft, textAlign: align })}
                      className={`py-2.5 rounded-full text-[12px] font-black border capitalize transition-all ${bannerDraft.textAlign === align
                        ? 'bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white border-transparent'
                        : 'bg-[#F3F6FA] text-[#5B6B80] border-[#E3E8EF] hover:bg-white'
                        }`}
                    >
                      {align}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#6F7E92] mb-1 pl-2">Text Color</label>
                <div className="flex items-center gap-2">
                  {[
                    { label: 'Pure White', hex: '#ffffff' },
                    { label: 'Midnight', hex: '#0E1A2B' },
                    { label: 'Brand Orange', hex: '#ea580c' },
                    { label: 'Soft Grey', hex: '#E3E8EF' },
                  ].map((preset) => (
                    <button
                      key={preset.hex}
                      type="button"
                      title={preset.label}
                      aria-label={preset.label}
                      onClick={() => setBannerDraft({ ...bannerDraft, textColor: preset.hex })}
                      className={`w-9 h-9 rounded-full border-2 transition-all ${bannerDraft.textColor === preset.hex ? 'border-[#2F6BFF] scale-110' : 'border-[#E3E8EF]'}`}
                      style={{ backgroundColor: preset.hex }}
                    />
                  ))}
                  <input
                    type="color"
                    aria-label="Custom text color"
                    value={bannerDraft.textColor}
                    onChange={(e) => setBannerDraft({ ...bannerDraft, textColor: e.target.value })}
                    className="w-9 h-9 rounded-full border border-[#E3E8EF] cursor-pointer p-0.5"
                  />
                </div>
              </div>
              <label className="sm:col-span-2 flex items-center justify-between gap-3 px-5 py-3 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full cursor-pointer">
                <span className="text-[13px] font-bold text-[#0E1A2B]">Show this slide on the storefront</span>
                <input
                  type="checkbox"
                  checked={bannerDraft.isActive}
                  onChange={(e) => setBannerDraft({ ...bannerDraft, isActive: e.target.checked })}
                  className="w-4 h-4 accent-[#2F6BFF]"
                />
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveBanner}
                disabled={!bannerDraft.title.trim() || !bannerDraft.imageUrl}
                className="flex-1 py-3.5 bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white font-extrabold text-[13px] rounded-full shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bannerDraft.id ? 'Save Changes' : 'Add Banner'}
              </button>
              <button
                onClick={() => setIsBannerModalOpen(false)}
                className="px-6 py-3.5 bg-white border border-[#E3E8EF] hover:bg-[#F3F6FA] text-[#5B6B80] font-bold text-[13px] rounded-full"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 10: ADD INSTAGRAM POST */}
      {/* ========================================================================= */}
      {isInstagramModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E3E8EF] rounded-[36px] p-8 max-w-md w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-[#0E1A2B]">Add Instagram Post</h3>
              <button
                onClick={() => setIsInstagramModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F3F6FA] hover:bg-[#E3E8EF] flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#6F7E92] mb-1 pl-2">Instagram Post Link *</label>
                <input
                  type="url"
                  placeholder="https://instagram.com/p/..."
                  value={newIgUrl}
                  onChange={(e) => setNewIgUrl(e.target.value)}
                  className="w-full px-5 py-3 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full text-[13px] font-semibold text-[#0E1A2B]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#6F7E92] mb-1 pl-2">Post Image *</label>
                <ImageListField
                  images={newIgImage ? [newIgImage] : []}
                  onChange={(images) => setNewIgImage(images[images.length - 1] ?? '')}
                  label="Instagram post image"
                  showCover={false}
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#6F7E92] mb-1 pl-2">Caption</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Heirloom details for today ✨ #DemoJewellery"
                  value={newIgCaption}
                  onChange={(e) => setNewIgCaption(e.target.value)}
                  className="w-full px-5 py-3 bg-[#F3F6FA] border border-[#E3E8EF] rounded-[20px] text-[13px] font-semibold text-[#0E1A2B] resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (!newIgUrl.trim() || !newIgImage) return;
                  setInstagramPosts([...instagramPosts, { id: `ig-${Date.now()}`, postUrl: newIgUrl.trim(), imageUrl: newIgImage, caption: newIgCaption.trim() }]);
                  setIsInstagramModalOpen(false);
                }}
                disabled={!newIgUrl.trim() || !newIgImage}
                className="flex-1 py-3.5 bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white font-extrabold text-[13px] rounded-full shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Post
              </button>
              <button
                onClick={() => setIsInstagramModalOpen(false)}
                className="px-6 py-3.5 bg-white border border-[#E3E8EF] hover:bg-[#F3F6FA] text-[#5B6B80] font-bold text-[13px] rounded-full"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 11: ADD / EDIT CATEGORY */}
      {/* ========================================================================= */}
      {categoryDraft && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E3E8EF] rounded-[36px] p-8 max-w-lg w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-[#0E1A2B]">{categoryDraft.id ? 'Edit Category' : 'Add New Category'}</h3>
              <button
                onClick={() => setCategoryDraft(null)}
                className="w-8 h-8 rounded-full bg-[#F3F6FA] hover:bg-[#E3E8EF] flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-[1fr_88px] gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-[#6F7E92] mb-1 pl-2">Category Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Footwear & Shoes"
                    value={categoryDraft.name}
                    onChange={(e) => { setCategoryDraft({ ...categoryDraft, name: e.target.value }); setCategoryFormError(''); }}
                    className="w-full px-5 py-3 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full text-[13px] font-semibold text-[#0E1A2B] focus:outline-none focus:bg-white focus:border-[#2F6BFF]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-[#6F7E92] mb-1 pl-2">Icon</label>
                  <input
                    type="text"
                    value={categoryDraft.icon}
                    onChange={(e) => setCategoryDraft({ ...categoryDraft, icon: e.target.value })}
                    className="w-full px-3 py-3 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full text-[15px] text-center focus:outline-none focus:bg-white focus:border-[#2F6BFF]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#6F7E92] mb-1 pl-2">Short Description</label>
                <input
                  type="text"
                  placeholder="e.g. Sneakers, sandals and formal shoes"
                  value={categoryDraft.blurb}
                  onChange={(e) => setCategoryDraft({ ...categoryDraft, blurb: e.target.value })}
                  className="w-full px-5 py-3 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full text-[13px] font-semibold text-[#0E1A2B] focus:outline-none focus:bg-white focus:border-[#2F6BFF]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#6F7E92] mb-1 pl-2">Category Photo <span className="normal-case font-semibold">(shown on the storefront)</span></label>
                <ImageListField
                  images={categoryDraft.image ? [categoryDraft.image] : []}
                  onChange={(images) => setCategoryDraft({ ...categoryDraft, image: images[images.length - 1] ?? '' })}
                  label="Category photo"
                  showCover={false}
                />
              </div>
              <label className="flex items-center justify-between gap-3 px-5 py-3 bg-[#F3F6FA] border border-[#E3E8EF] rounded-full cursor-pointer">
                <span className="text-[13px] font-bold text-[#0E1A2B]">Show on the storefront</span>
                <input
                  type="checkbox"
                  checked={categoryDraft.status === 'Active'}
                  onChange={(e) => setCategoryDraft({ ...categoryDraft, status: e.target.checked ? 'Active' : 'Inactive' })}
                  className="w-4 h-4 accent-[#2F6BFF]"
                />
              </label>
            </div>

            {categoryFormError && (
              <p role="alert" className="text-red-500 text-[13px] font-bold bg-red-50 px-4 py-2.5 rounded-xl">{categoryFormError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSaveCategory}
                className="flex-1 py-3.5 bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white font-extrabold text-[13px] rounded-full shadow-md"
              >
                {categoryDraft.id ? 'Save Changes' : 'Add Category'}
              </button>
              <button
                onClick={() => setCategoryDraft(null)}
                className="px-6 py-3.5 bg-white border border-[#E3E8EF] hover:bg-[#F3F6FA] text-[#5B6B80] font-bold text-[13px] rounded-full"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POS NEW CUSTOMER MODAL */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="pos-new-customer-title">
          <div className="bg-white border border-[#E3E8EF] rounded-[28px] p-7 max-w-sm w-full shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div><h3 id="pos-new-customer-title" className="text-xl font-bold text-[#0E1A2B]">New Registration</h3><p className="mt-1 text-[12px] text-[#6F7E92]">Customer name and phone are required.</p></div>
              <button type="button" onClick={() => { setIsNewCustomerModalOpen(false); setNewCustomerFormError(''); }} aria-label="Close new customer registration" className="w-9 h-9 shrink-0 rounded-full border border-[#E3E8EF] text-[#5B6B80] hover:bg-[#F3F6FA] flex items-center justify-center"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
            </div>
            <input
              type="text"
              placeholder="Customer Name *"
              value={newCustomerFormName}
              onChange={(e) => setNewCustomerFormName(e.target.value)}
              required
              className="w-full px-5 py-3 mb-4 bg-[#F3F6FA] border border-[#E3E8EF] rounded-xl text-[14px] text-[#0E1A2B] focus:outline-none focus:border-[#2F6BFF]"
            />
            <input type="tel" inputMode="numeric" autoComplete="tel" placeholder="Phone Number *" value={newCustomerFormPhone} onChange={(e) => setNewCustomerFormPhone(e.target.value)} required className="w-full px-5 py-3 mb-4 bg-[#F3F6FA] border border-[#E3E8EF] rounded-xl text-[14px] text-[#0E1A2B] focus:outline-none focus:border-[#2F6BFF]" />
            {newCustomerFormError && <p role="alert" className="mb-4 text-[12px] font-bold text-red-600">{newCustomerFormError}</p>}
            <div className="flex gap-3">
              <button onClick={() => { setIsNewCustomerModalOpen(false); setNewCustomerFormError(''); }} className="flex-1 py-3.5 bg-white border border-[#E3E8EF] text-[#5B6B80] font-bold text-[13px] rounded-full">Cancel</button>
              <button
                onClick={() => {
                  const name = newCustomerFormName.trim();
                  const phone = newCustomerFormPhone.trim();
                  if (name.length < 2 || phone.replace(/\D/g, '').length < 10) {
                    setNewCustomerFormError('Enter a customer name and a valid 10-digit phone number.');
                    return;
                  }
                  setPosCustomerName(name);
                  setPosCustomerPhone(phone);
                  setIsNewCustomerModalOpen(false);
                  setNewCustomerFormName('');
                  setNewCustomerFormPhone('');
                  setNewCustomerFormError('');
                }}
                className="flex-1 py-3.5 bg-[#0E1A2B] hover:bg-black text-white font-extrabold text-[13px] rounded-full shadow-md"
              >Register & Select</button>
            </div>
          </div>
        </div>
      )}
      {/* POS CUSTOMER LOOKUP */}
      {isCustomerLookupOpen && (() => {
        const digits = (value: string) => value.replace(/\D/g, '');
        // Saved customers first, then walk-in buyers from earlier POS bills.
        const candidates = [
          ...customers.map((c) => ({ key: c.id, name: c.name, phone: c.phone, email: c.email, note: `Customer since ${c.registeredDate}` })),
          ...posHistory
            .filter((tx) => tx.customer.trim() && !/^walk-?in/i.test(tx.customer.trim()))
            .filter((tx, i, all) => all.findIndex((t) => digits(t.customerPhone ?? '') === digits(tx.customerPhone ?? '') && t.customer === tx.customer) === i)
            .filter((tx) => { const d = digits(tx.customerPhone ?? '').slice(-10); return d.length < 10 || !customers.some((c) => digits(c.phone).endsWith(d)); })
            .map((tx) => ({ key: tx.id, name: tx.customer, phone: tx.customerPhone ?? '', email: '', note: `Walk-in · last bill ${tx.receiptNo}` })),
        ];
        const q = customerLookupQuery.trim().toLowerCase();
        const qDigits = digits(q);
        const matches = candidates.filter((c) => !q
          || c.name.toLowerCase().includes(q)
          || c.email.toLowerCase().includes(q)
          || (qDigits.length >= 3 && digits(c.phone).includes(qDigits)));
        const close = () => setIsCustomerLookupOpen(false);
        const pick = (c: (typeof candidates)[number]) => {
          setPosCustomerName(c.name);
          setPosCustomerPhone(c.phone);
          close();
          if (digits(c.phone).length < 10) {
            notify(`${c.name} has no phone number saved — please add one`);
            setTimeout(() => document.getElementById('pos-customer-phone')?.focus(), 50);
          } else {
            notify(`${c.name} added to the bill`);
          }
        };
        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="pos-lookup-title" onKeyDown={(e) => e.key === 'Escape' && close()}>
            <div className="bg-white border border-[#E3E8EF] rounded-[28px] p-6 sm:p-7 max-w-md w-full shadow-2xl flex flex-col max-h-[85vh]">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div><h3 id="pos-lookup-title" className="text-xl font-bold text-[#0E1A2B]">Find customer</h3><p className="mt-1 text-[12px] text-[#6F7E92]">Search by name, phone number or email.</p></div>
                <button type="button" onClick={close} aria-label="Close customer lookup" className="w-9 h-9 shrink-0 rounded-full border border-[#E3E8EF] text-[#5B6B80] hover:bg-[#F3F6FA] flex items-center justify-center"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
              </div>
              <input
                type="search"
                autoFocus
                value={customerLookupQuery}
                onChange={(e) => setCustomerLookupQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && matches.length === 1) pick(matches[0]); }}
                placeholder="e.g. Demo Customer or demo.customer"
                aria-label="Search customers"
                className="w-full px-5 py-3 bg-[#F3F6FA] border border-[#E3E8EF] rounded-xl text-[14px] text-[#0E1A2B] focus:outline-none focus:border-[#2F6BFF] focus:ring-2 focus:ring-[#2F6BFF]/20"
              />
              <p className="mt-3 mb-2 text-[11px] font-extrabold uppercase tracking-widest text-[#6F7E92]">{matches.length} {matches.length === 1 ? 'match' : 'matches'}</p>
              <div className="overflow-y-auto -mx-1 px-1 space-y-1.5 min-h-0">
                {matches.map((c) => (
                  <button key={c.key} type="button" onClick={() => pick(c)} className="w-full text-left p-3 rounded-2xl border border-[#E3E8EF] hover:border-[#2F6BFF] hover:bg-[#EAF1FF] transition-colors flex items-center gap-3">
                    <span className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-[#2F6BFF] to-[#5A8BFF] text-white text-[13px] font-black flex items-center justify-center">{c.name.trim().charAt(0).toUpperCase() || '?'}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-bold text-[#0E1A2B] truncate">{c.name}</span>
                      <span className="block text-[12px] text-[#5B6B80] truncate">{c.phone || 'No phone saved'}{c.email ? ` · ${c.email}` : ''}</span>
                      <span className="block text-[11px] text-[#6F7E92] truncate">{c.note}</span>
                    </span>
                    <span className="text-[12px] font-bold text-[#2F6BFF] shrink-0">Select</span>
                  </button>
                ))}
                {matches.length === 0 && (
                  <div className="py-8 text-center border border-dashed border-[#E3E8EF] rounded-2xl">
                    <p className="text-[13px] font-semibold text-[#5B6B80]">No customer found for “{customerLookupQuery.trim()}”.</p>
                    <button
                      type="button"
                      onClick={() => {
                        const typedDigits = qDigits.length >= 3;
                        setNewCustomerFormName(typedDigits ? posCustomerName : customerLookupQuery.trim());
                        setNewCustomerFormPhone(typedDigits ? customerLookupQuery.trim() : posCustomerPhone);
                        setNewCustomerFormError('');
                        close();
                        setIsNewCustomerModalOpen(true);
                      }}
                      className="mt-3 px-5 py-2 rounded-full bg-[#0E1A2B] text-white text-[12px] font-bold"
                    >+ Register new customer</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
      {/* GENERATE BARCODE MODAL */}
      {isGenerateBarcodeModalOpen && activeBarcodeProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[36px] p-8 w-full max-w-md shadow-2xl relative overflow-hidden">
            <button
              onClick={() => setIsGenerateBarcodeModalOpen(false)}
              className="absolute top-6 right-6 p-2 bg-[#F3F6FA] hover:bg-[#E3E8EF] rounded-full transition-colors text-[#0E1A2B]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
            <h2 className="text-2xl font-black text-[#0E1A2B] tracking-tight mb-2">Barcode Scanner</h2>
            <p className="text-[14px] text-[#5B6B80] font-semibold mb-6">Scanning product <span className="text-[#0E1A2B] font-bold">{activeBarcodeProduct.name}</span>...</p>

            <div className="flex flex-col items-center justify-center py-8">
              {barcodeGenStatus === 'idle' ? (
                <button
                  onClick={() => {
                    setBarcodeGenStatus('generating');
                    setTimeout(() => setBarcodeGenStatus('success'), 1500);
                  }}
                  className="px-8 py-4 bg-[#2F6BFF] hover:bg-[#5A8BFF] text-white rounded-full font-black text-[15px] shadow-lg shadow-[#2F6BFF]/30 transition-all active:scale-95 flex items-center gap-2"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h2v14H3z M7 5h1v14H7z M11 5h2v14h-2z M15 5h1v14h-1z M19 5h2v14h-2z" /></svg>
                  Scan & Generate Code
                </button>
              ) : barcodeGenStatus === 'generating' ? (
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 border-4 border-[#2F6BFF]/20 border-t-[#2F6BFF] rounded-full animate-spin"></div>
                  <p className="text-[13px] font-bold text-[#2F6BFF] animate-pulse">Scanning database...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-4 w-full">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <div className="text-center w-full bg-[#F3F6FA] p-6 rounded-3xl border border-[#E3E8EF]">
                    <p className="text-[11px] font-extrabold text-[#6F7E92] uppercase tracking-wider mb-2">Generated QR Code</p>
                    <ProductQrCode value={activeBarcodeProduct.barcode} className="w-44 h-44 mx-auto mb-3 rounded-xl" />
                    <p className="text-2xl font-mono font-black tracking-[0.25em] text-[#0E1A2B]">{activeBarcodeProduct.barcode}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PRINT BARCODE MODAL */}
      {isPrintBarcodeModalOpen && activeBarcodeProduct && (() => {
        const prod = activeBarcodeProduct;
        const { w, h } = barcodeLabelDims;
        const labelData: LabelData = {
          store: storeInfo.name,
          name: prod.name,
          code: prod.sku,
          left: prod.sizes[0] && prod.sizes[0] !== STANDARD ? `SIZE: ${prod.sizes[0]}` : `SKU: ${prod.sku}`,
          right: `PRICE: Rs.${prod.price.toLocaleString('en-IN')}`,
        };
        const presets = [{ w: 50, h: 25 }, { w: 40, h: 30 }, { w: 38, h: 25 }, { w: 75, h: 50 }, { w: 100, h: 50 }];
        const isPreset = presets.some((p) => p.w === w && p.h === h);
        const previewScale = Math.min(380 / w, 190 / h); // px per mm, keeps the real aspect ratio
        const pickSize = (dims: { w: number; h: number }) => { setBarcodeLabelDims(dims); setBarcodeDimInput({ w: String(dims.w), h: String(dims.h) }); };
        // Typed sizes apply live once they are a sensible label size (20–150 mm).
        const typeSize = (side: 'w' | 'h', value: string) => {
          setBarcodeDimInput({ ...barcodeDimInput, [side]: value });
          const mm = Math.round(Number(value));
          if (mm >= 20 && mm <= 150) setBarcodeLabelDims({ ...barcodeLabelDims, [side]: mm });
        };
        return (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
            <div className="bg-white rounded-[24px] p-5 sm:p-7 w-full max-w-2xl shadow-2xl relative max-h-[94vh] overflow-y-auto text-[#0E1A2B]">
              <button
                onClick={() => setIsPrintBarcodeModalOpen(false)}
                aria-label="Close"
                className="absolute top-5 right-5 p-2 bg-[#F3F6FA] hover:bg-[#E3E8EF] rounded-full transition-colors text-[#0E1A2B]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
              <p className="text-[11px] uppercase tracking-[0.2em] font-extrabold text-[#6F7E92]">Product label</p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">Barcode labels</h2>
              <p className="text-[14px] text-[#5B6B80] font-semibold mb-5 pr-10">{prod.name}</p>

              <div className="bg-[#F3F6FA] border border-[#E3E8EF] rounded-2xl p-4 sm:p-6 flex flex-col items-center gap-3">
                <BarcodeLabel widthMm={w} heightMm={h} data={labelData} className="max-w-full h-auto shadow-md ring-1 ring-[#CFD8E3] rounded-sm" style={{ width: w * previewScale }} />
                <p className="text-[12px] font-bold text-[#5B6B80]">Actual size: {w} × {h} mm · preview scaled to fit</p>
              </div>

              <div className="mt-5">
                <p className="text-[11px] uppercase tracking-[0.16em] font-extrabold text-[#6F7E92]">Label size</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {presets.map((p) => (
                    <button key={`${p.w}x${p.h}`} type="button" onClick={() => pickSize(p)} className={`px-4 py-2 rounded-full border text-sm font-bold ${p.w === w && p.h === h ? 'bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white border-transparent' : 'bg-white text-[#0E1A2B] border-[#E3E8EF] hover:border-[#2F6BFF]'}`}>{p.w} × {p.h} mm</button>
                  ))}
                  <span className={`px-4 py-2 rounded-full border text-sm font-bold ${isPreset ? 'border-[#E3E8EF] text-[#6F7E92]' : 'bg-[#EAF1FF] text-[#2F6BFF] border-[#2F6BFF]'}`}>Custom</span>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <label className="text-[11px] uppercase tracking-[0.16em] font-extrabold text-[#6F7E92]">Width (mm)<input type="number" min={20} max={150} value={barcodeDimInput.w} onChange={(e) => typeSize('w', e.target.value)} onBlur={() => pickSize(barcodeLabelDims)} className="mt-2 block w-full px-3 py-3 bg-[#F3F6FA] border border-[#E3E8EF] rounded-xl text-sm font-bold text-[#0E1A2B] outline-none focus:border-[#2F6BFF] focus:ring-2 focus:ring-[#2F6BFF]/20" /></label>
                  <label className="text-[11px] uppercase tracking-[0.16em] font-extrabold text-[#6F7E92]">Height (mm)<input type="number" min={20} max={150} value={barcodeDimInput.h} onChange={(e) => typeSize('h', e.target.value)} onBlur={() => pickSize(barcodeLabelDims)} className="mt-2 block w-full px-3 py-3 bg-[#F3F6FA] border border-[#E3E8EF] rounded-xl text-sm font-bold text-[#0E1A2B] outline-none focus:border-[#2F6BFF] focus:ring-2 focus:ring-[#2F6BFF]/20" /></label>
                  <label className="text-[11px] uppercase tracking-[0.16em] font-extrabold text-[#6F7E92]">Labels<input type="number" min={1} max={500} value={barcodeLabelCount} onChange={(e) => setBarcodeLabelCount(Math.max(1, Math.min(500, Number(e.target.value) || 1)))} className="mt-2 block w-full px-3 py-3 bg-[#F3F6FA] border border-[#E3E8EF] rounded-xl text-sm font-bold text-[#0E1A2B] outline-none focus:border-[#2F6BFF] focus:ring-2 focus:ring-[#2F6BFF]/20" /></label>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">{[1, 10, 50, 100].map((qty) => <button key={qty} type="button" onClick={() => setBarcodeLabelCount(qty)} className={`px-4 py-1.5 rounded-full border text-sm font-bold ${barcodeLabelCount === qty ? 'bg-[#0E1A2B] text-white border-[#0E1A2B]' : 'bg-white text-[#0E1A2B] border-[#E3E8EF]'}`}>{qty}</button>)}</div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    downloadLabelsPdf(w, h, labelData, barcodeLabelCount);
                    notify(`Downloaded ${barcodeLabelCount} ${barcodeLabelCount === 1 ? 'label' : 'labels'} (${w} × ${h} mm PDF)`);
                  }}
                  className="px-5 py-3 rounded-full border border-[#2F6BFF] text-[#2F6BFF] font-bold inline-flex gap-2 items-center justify-center hover:bg-[#EAF1FF]"
                >
                  <PanelIcon name="file" />Download PDF ({barcodeLabelCount})
                </button>
                <button type="button" onClick={() => window.print()} className="px-6 py-3 rounded-full bg-gradient-to-r from-[#2F6BFF] to-[#5A8BFF] text-white font-bold inline-flex gap-2 items-center justify-center shadow-md"><PanelIcon name="receipt" />Print {barcodeLabelCount} {barcodeLabelCount === 1 ? 'label' : 'labels'}</button>
              </div>
              <p className="text-center text-[12px] text-[#6F7E92] mt-4">Download saves a PDF with one {w} × {h} mm page per label. When printing, choose your label printer and print at 100% / actual size.</p>
            </div>
            {createPortal(
              <div id="barcode-print-sheet">
                <style>{`@media print { @page { size: ${w}mm ${h}mm; margin: 0; } }`}</style>
                {Array.from({ length: barcodeLabelCount }, (_, index) => (
                  <BarcodeLabel key={index} widthMm={w} heightMm={h} data={labelData} className="barcode-print-label" style={{ width: `${w}mm`, height: `${h}mm` }} />
                ))}
              </div>,
              document.body,
            )}
          </div>
        );
      })()}

      {playingVideo && <VideoPlayerModal video={playingVideo} onClose={() => setPlayingVideo(null)}><span className="text-[13px] text-white/70">{playingVideo.views.toLocaleString('en-IN')} views · shown on the storefront home page and on the product page</span></VideoPlayerModal>}

      {/* Admin toast */}
      {adminToast && (
        <div role="status" className="fixed z-[60] bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 bg-[#0E1A2B] text-white rounded-full text-[13px] font-bold shadow-2xl print:hidden">
          {adminToast.text}
        </div>
      )}
    </div>
  );
}
