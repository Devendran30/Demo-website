'use client';

import { Fragment, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CameraScanner, type ScanResult } from './camera-scanner';
import { ProductQrCode } from './product-qr-code';
import { VariantStockGrid } from './variant-stock-grid';
import { ImageListField } from './image-list-field';
// Products, orders, coupons, banners and the rest are shared with the storefront and saved in the browser.
import {
  useStore, productsStore, categoriesStore, subCategoriesStore, subSubCategoriesStore, sizeOptionsStore, colorOptionsStore,
  tagOptionsStore, couponsStore, ordersStore, customersStore, bannersStore, instagramStore, adminAccountStore,
  buildVariantStock, sizeTotal, variantSizes, variantColors, stockStatus, couponState, restockOrder, resetDemoData, fakePaymentId, fakeAwb, uid,
  localDate, STANDARD, ORDER_STATUSES, STORE_INFO,
  type VariantStock, type Product, type SizeOption, type ColorOption, type TagOption, type Coupon, type Order, type OrderStatus,
  type HeroBanner, type Shipment, type CategoryItem,
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
  paymentMethod: 'Cash' | 'Card' | 'UPI';
  items: { name: string; qty: number; price: number }[];
}

interface EcommerceVideo {
  id: string;
  title: string;
  productName: string;
  duration: string;
  views: number;
  thumbnail: string;
  videoUrl: string;
  dateAdded: string;
}

type AdminTab =
  | 'dashboard' | 'add-product' | 'product-list' | 'inventory' | 'attributes'
  | 'category' | 'sub-category' | 'sub-sub-category' | 'coupons' | 'orders' | 'customers'
  | 'pos-terminal' | 'pos-history' | 'banners' | 'instagram' | 'videos' | 'reports' | 'settings';

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
  reports: 'Reports & Analytics',
  settings: 'Admin Security',
};

const DEFAULT_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&q=80&w=400';

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
  const router = useRouter();

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const adminAccount = useStore(adminAccountStore);
  const adminEmail = adminAccount.email;
  const adminPassword = adminAccount.password;

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
  const [productStockFilter, setProductStockFilter] = useState<'All' | Product['status']>('All');
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
  const [barcodePrintStatus, setBarcodePrintStatus] = useState<'idle' | 'printing' | 'success'>('idle');
  const [activeBarcodeProduct, setActiveBarcodeProduct] = useState<Product | null>(null);

  const [isMultiProductModalOpen, setIsMultiProductModalOpen] = useState(false);
  const [multiProductInput, setMultiProductInput] = useState('');

  // Product Form State (shared by Add Product and Edit Product)
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [newProdName, setNewProdName] = useState('');
  const [newProdDescription, setNewProdDescription] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdBarcode, setNewProdBarcode] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Audio');
  const [newProdSubCategory, setNewProdSubCategory] = useState('Headphones');
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
  const [newSubCatParent, setNewSubCatParent] = useState('Audio');

  const subSubCategories = useStore(subSubCategoriesStore);
  const setSubSubCategories = subSubCategoriesStore.set;
  const [newSubSubCatName, setNewSubSubCatName] = useState('');
  const [newSubSubCatSubParent, setNewSubSubCatSubParent] = useState('Headphones');
  const [newSubSubCatParent, setNewSubSubCatParent] = useState('Audio');

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
  const [shipDraft, setShipDraft] = useState<{ orderId: string; courier: string; pickup: string; weightKg: string; length: string; breadth: string; height: string } | null>(null);
  const [shipError, setShipError] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'All' | OrderStatus>('All');

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
  const [posCustomerName, setPosCustomerName] = useState('Walk-in Customer');
  const [posPaymentMethod, setPosPaymentMethod] = useState<'Cash' | 'Card' | 'UPI'>('Cash');
  const [posReceiptModal, setPosReceiptModal] = useState<PosTransaction | null>(null);
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
  const [exchangeTx, setExchangeTx] = useState<PosTransaction | null>(null);
  const [posManualTotal, setPosManualTotal] = useState<string>('');
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [newCustomerFormName, setNewCustomerFormName] = useState('');

  const [posHistory, setPosHistory] = useState<PosTransaction[]>([
    {
      id: 'tx-1',
      receiptNo: 'REC-2026-8091',
      date: '2026-08-26 03:45 PM',
      cashier: 'John Cashier (Reg #01)',
      customer: 'Siddharth Rao',
      itemsCount: 2,
      total: 22498,
      paymentMethod: 'UPI',
      items: [
        { name: 'Wireless Headphones Pro', qty: 1, price: 14999 },
        { name: 'Ergonomic Keyboard RGB', qty: 1, price: 7499 },
      ],
    },
    {
      id: 'tx-2',
      receiptNo: 'REC-2026-8090',
      date: '2026-08-26 01:15 PM',
      cashier: 'Sarah Jenkins (Reg #02)',
      customer: 'Walk-in Customer',
      itemsCount: 1,
      total: 21999,
      paymentMethod: 'Card',
      items: [
        { name: 'Ultra Slim Smartwatch Series 7', qty: 1, price: 21999 },
      ],
    },
    {
      id: 'tx-3',
      receiptNo: 'REC-2026-8089',
      date: '2026-08-25 06:20 PM',
      cashier: 'John Cashier (Reg #01)',
      customer: 'Rahul Nair',
      itemsCount: 1,
      total: 4999,
      paymentMethod: 'Cash',
      items: [
        { name: 'Minimalist Matte Leather Backpack', qty: 1, price: 4999 },
      ],
    },
  ]);

  // Videos State
  const [videos, setVideos] = useState<EcommerceVideo[]>([
    {
      id: 'vid-1',
      title: 'Unboxing & Sound Test: Wireless Headphones Pro',
      productName: 'Wireless Noise-Cancelling Headphones Pro',
      duration: '01:45',
      views: 12450,
      thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400',
      videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
      dateAdded: '2026-08-20',
    },
    {
      id: 'vid-2',
      title: 'Water Resistance & Fitness Tracking Test',
      productName: 'Ultra Slim Smartwatch Series 7',
      duration: '00:58',
      views: 8930,
      thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400',
      videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
      dateAdded: '2026-08-18',
    },
    {
      id: 'vid-3',
      title: 'Mechanical Switch Sound Profile & Typing ASMR',
      productName: 'Ergonomic Mechanical Keyboard RGB',
      duration: '02:15',
      views: 24100,
      thumbnail: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=400',
      videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
      dateAdded: '2026-08-10',
    },
  ]);
  const [isUploadVideoModalOpen, setIsUploadVideoModalOpen] = useState(false);
  const [newVidTitle, setNewVidTitle] = useState('');
  const [newVidProduct, setNewVidProduct] = useState('Wireless Noise-Cancelling Headphones Pro');
  const [newVidDuration, setNewVidDuration] = useState('01:30');
  const [newVidThumbnail, setNewVidThumbnail] = useState('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400');

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
      sku: newProdSku || existing?.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: newProdBarcode || existing?.barcode || `890${Math.floor(1000000000 + Math.random() * 9000000000)}`,
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
      shipment: o.shipment && status === 'Delivered' ? { ...o.shipment, status: 'Delivered' } : o.shipment,
      // Cash on delivery is collected when the parcel arrives.
      paymentStatus: status === 'Delivered' && o.paymentMethod === 'Cash on Delivery' ? 'Paid' : o.paymentStatus,
    }));
    notify(`${ord.orderNumber} marked ${status}${status === 'Cancelled' ? ' — stock returned' : ''}`);
  };

  const emailCustomer = (ord: Order, kind: 'Status update' | 'Invoice') => {
    updateOrder(ord.id, (o) => ({ ...o, emails: [...o.emails, { kind, at: new Date().toISOString() }] }));
    notify(`${kind === 'Invoice' ? 'Invoice' : `Status update (${ord.orderStatus})`} emailed to ${ord.email}`);
  };

  const reconcilePayments = () => {
    const pending = orders.filter((o) => o.paymentStatus === 'Pending' && o.paymentMethod !== 'Cash on Delivery' && o.orderStatus !== 'Cancelled');
    if (!pending.length) {
      notify('All online payments are already confirmed');
      return;
    }
    setOrders(orders.map((o) => (pending.some((p) => p.id === o.id) ? { ...o, paymentStatus: 'Paid', paymentId: o.paymentId ?? fakePaymentId() } : o)));
    notify(`${pending.length} payment(s) confirmed with the payment gateway`);
  };

  const openInvoice = (ord: Order, paper: 'A4' | '4x6' = 'A4') => {
    setInvoicePaper(paper);
    setSelectedOrderForView(ord);
  };

  const openShipmentForm = (ord: Order) => {
    setShipError('');
    setShipDraft({ orderId: ord.id, courier: 'Delhivery', pickup: 'Bengaluru Warehouse', weightKg: String(Math.max(0.5, ord.itemsCount * 0.8)), length: '30', breadth: '25', height: '12' });
  };

  const handleCreateShipment = () => {
    if (!shipDraft) return;
    const ord = orders.find((o) => o.id === shipDraft.orderId);
    if (!ord) return;
    const nums = [shipDraft.weightKg, shipDraft.length, shipDraft.breadth, shipDraft.height].map(Number);
    if (nums.some((n) => !(n > 0))) {
      setShipError('Enter the packed weight and all three measurements.');
      return;
    }
    if (ord.paymentStatus !== 'Paid' && ord.paymentMethod !== 'Cash on Delivery') {
      setShipError('Payment must be confirmed before creating a shipment. Use "Check Payments" first.');
      return;
    }
    const shipment: Shipment = {
      courier: shipDraft.courier,
      awb: fakeAwb(),
      pickup: shipDraft.pickup,
      weightKg: nums[0],
      dimensions: `${nums[1]} × ${nums[2]} × ${nums[3]} cm`,
      status: 'Created',
      createdAt: new Date().toISOString(),
    };
    updateOrder(ord.id, (o) => ({ ...o, shipment, orderStatus: o.orderStatus === 'Pending' ? 'Processing' : o.orderStatus }));
    setShipDraft(null);
    notify(`Shipment created with ${shipment.courier} — AWB ${shipment.awb}`);
  };

  const advanceShipment = (ord: Order) => {
    if (!ord.shipment) return;
    const next = ord.shipment.status === 'Created' ? 'In Transit' : 'Delivered';
    updateOrder(ord.id, (o) => ({
      ...o,
      shipment: o.shipment && { ...o.shipment, status: next },
      orderStatus: next === 'In Transit' ? 'Shipped' : 'Delivered',
      paymentStatus: next === 'Delivered' && o.paymentMethod === 'Cash on Delivery' ? 'Paid' : o.paymentStatus,
    }));
    notify(`${ord.orderNumber}: parcel ${next === 'In Transit' ? 'picked up and in transit' : 'delivered'}`);
  };

  // Category Helpers
  const openCategoryModal = (cat?: CategoryItem) => {
    setCategoryDraft(cat ?? { id: '', name: '', slug: '', icon: '📦', image: '', blurb: '', status: 'Active' });
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
      icon: categoryDraft.icon.trim() || '📦',
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

  const visibleProducts = products.filter(
    (p) =>
      (productStockFilter === 'All' || p.status === productStockFilter) &&
      (productCategoryFilter === 'All' || p.category === productCategoryFilter) &&
      [p.name, p.sku, p.category, p.subCategory].some((v) => v.toLowerCase().includes(productSearch.trim().toLowerCase()))
  );

  // The ordered color's own photo when it has one, otherwise the product's cover photo.
  const productImageFor = (sku: string, color: string) => {
    const prod = products.find((p) => p.sku === sku);
    return prod?.colorImages[color]?.[0] ?? prod?.image ?? DEFAULT_PRODUCT_IMAGE;
  };

  const visibleOrders = orders.filter(
    (o) =>
      (orderStatusFilter === 'All' || o.orderStatus === orderStatusFilter) &&
      [o.orderNumber, o.customerName, o.email, o.phone].some((v) => v.toLowerCase().includes(orderSearch.trim().toLowerCase()))
  );

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
          category: parts[2]?.trim() || categories[0]?.name || 'Audio',
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
    const newTx: PosTransaction = {
      id: `tx-${Date.now()}`,
      receiptNo: `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toLocaleString(),
      cashier: 'Admin POS Terminal #01',
      customer: posCustomerName,
      itemsCount: posCart.reduce((acc, cur) => acc + cur.quantity, 0),
      total: posTotal,
      paymentMethod: posPaymentMethod,
      items: posCart.map((item) => ({
        name: item.product.name,
        qty: item.quantity,
        price: item.product.price,
      })),
    };
    setPosHistory([newTx, ...posHistory]);
    setPosReceiptModal(newTx);
    setPosCart([]);
  };

  // Login handler
  const handleLogin = () => {
    if (loginEmail.trim().toLowerCase() === adminEmail.toLowerCase() && loginPassword === adminPassword) {
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('Invalid credentials. Please try again.');
    }
  };

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div
        className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-4 antialiased"
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        }}
      >
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#ea580c] to-[#f97316] text-white flex items-center justify-center mx-auto shadow-xl shadow-orange-500/20 mb-5">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-[#1d1d1f]">Demo Hub</h1>
            <p className="text-[13px] text-[#86868b] font-semibold mt-1">E-Commerce Admin Control Suite</p>
          </div>

          {/* Login Card */}
          <div className="bg-white border border-[#e5e5ea] rounded-[32px] p-8 shadow-sm">
            <h2 className="text-xl font-bold text-[#1d1d1f] mb-6">Sign in to Admin Panel</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-extrabold text-[#86868b] uppercase tracking-wider mb-2">Email Address</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => { setLoginEmail(e.target.value); setLoginError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder={adminEmail}
                  className="w-full px-5 py-3.5 bg-[#f5f5f7] border border-[#e5e5ea] rounded-2xl text-[14px] text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#ea580c] transition-all font-semibold placeholder:text-[#c7c7cc]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-extrabold text-[#86868b] uppercase tracking-wider mb-2">Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => { setLoginPassword(e.target.value); setLoginError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="••••••"
                  className="w-full px-5 py-3.5 bg-[#f5f5f7] border border-[#e5e5ea] rounded-2xl text-[14px] text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#ea580c] transition-all font-semibold placeholder:text-[#c7c7cc]"
                />
              </div>

              {loginError && (
                <p className="text-red-500 text-[13px] font-bold bg-red-50 px-4 py-2.5 rounded-xl">{loginError}</p>
              )}

              <button
                onClick={handleLogin}
                className="w-full py-3.5 bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-extrabold text-[14px] rounded-2xl shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 transition-all active:scale-[0.98]"
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
              className="mt-6 p-4 bg-[#f5f5f7] hover:bg-[#fff2e8] border border-transparent hover:border-[#ea580c]/30 rounded-2xl cursor-pointer transition-all group"
            >
              <p className="text-[11px] font-extrabold text-[#86868b] group-hover:text-[#ea580c] uppercase tracking-wider mb-2 transition-colors">Demo Credentials</p>
              <div className="space-y-1">
                <p className="text-[13px] font-semibold text-[#6e6e73]">Email: <span className="font-bold text-[#1d1d1f] group-hover:text-[#ea580c]">{adminEmail}</span></p>
                <p className="text-[13px] font-semibold text-[#6e6e73]">Password: <span className="font-bold text-[#1d1d1f] group-hover:text-[#ea580c]">{adminPassword}</span></p>
              </div>
            </div>
          </div>

          {/* Back link */}
          <div className="text-center mt-6">
            <button
              onClick={() => window.location.href = '/'}
              className="text-[13px] font-bold text-[#86868b] hover:text-[#ea580c] transition-colors"
            >
              ← Back to Portal Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex antialiased selection:bg-orange-100 selection:text-[#ea580c]"
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
      <aside className={`w-[280px] min-w-[280px] bg-white border-r border-[#e5e5ea] flex flex-col justify-between h-screen shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-40 transition-transform duration-300 ${isMobileSidebarOpen ? 'fixed top-0 bottom-0 left-0 translate-x-0' : 'fixed top-0 bottom-0 left-0 -translate-x-full md:translate-x-0 md:sticky md:top-0'
        }`}>
        <div className="space-y-2 overflow-y-auto px-4 pt-8 pb-4 custom-scrollbar">
          {/* Brand Header */}
          <div className="flex flex-col items-center text-center pb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#ea580c] to-[#f97316] text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-orange-500/20 mb-3 transform hover:scale-105 transition-transform">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
            </div>
            <h2 className="text-xl font-black tracking-tight text-[#1d1d1f]">Commerce Hub</h2>
            <p className="text-[10px] text-[#86868b] mt-0.5 font-extrabold uppercase tracking-[0.2em]">
              Admin Control Suite
            </p>
          </div>

          <nav className="space-y-1 text-[14px]">
            {/* Dashboard */}
            <button
              onClick={() => { setActiveTab('dashboard'); setIsMobileSidebarOpen(false); }}
              className={`w-full text-left px-5 py-3 rounded-full transition-all duration-300 flex justify-between items-center ${activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-bold shadow-md shadow-[#ea580c]/20'
                : 'text-[#6e6e73] font-semibold hover:bg-[#f5f5f7] hover:text-[#1d1d1f]'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 flex items-center justify-center opacity-70"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg></span>
                <span>Dashboard</span>
              </div>
              {activeTab === 'dashboard' && <span className="text-white/80 text-lg leading-none">•</span>}
            </button>

            {/* Products Dropdown */}
            <div className="space-y-1">
              <button
                onClick={() => setIsProductsDropdownOpen(!isProductsDropdownOpen)}
                className="w-full text-left px-5 py-3 rounded-full text-[#1d1d1f] font-bold hover:bg-[#f5f5f7] transition-all flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 flex items-center justify-center opacity-70"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg></span>
                  <span>Products</span>
                </div>
                <span className={`text-[12px] text-[#86868b] transition-transform duration-200 ${isProductsDropdownOpen ? 'rotate-180' : ''}`}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg></span>
              </button>

              {isProductsDropdownOpen && (
                <div className="pl-6 space-y-1 pt-1 border-l-2 border-[#e5e5ea] ml-5">
                  <button
                    onClick={() => { openAddProduct(); setIsMobileSidebarOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 rounded-full text-[13px] transition-all flex items-center gap-2.5 ${activeTab === 'add-product'
                      ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-bold shadow-sm'
                      : 'text-[#6e6e73] font-semibold hover:bg-[#f5f5f7] hover:text-[#1d1d1f]'
                      }`}
                  >
                    <span className="w-4 h-4 flex items-center justify-center opacity-70"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg></span>
                    <span>Add Product</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('product-list'); setIsMobileSidebarOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 rounded-full text-[13px] transition-all flex items-center justify-between ${activeTab === 'product-list'
                      ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-bold shadow-sm'
                      : 'text-[#6e6e73] font-semibold hover:bg-[#f5f5f7] hover:text-[#1d1d1f]'
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-4 h-4 flex items-center justify-center opacity-70"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg></span>
                      <span>Product List</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${activeTab === 'product-list' ? 'bg-white/20 text-white' : 'bg-[#f5f5f7] text-[#86868b]'}`}>{products.length}</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('inventory'); setIsMobileSidebarOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 rounded-full text-[13px] transition-all flex items-center justify-between ${activeTab === 'inventory'
                      ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-bold shadow-sm'
                      : 'text-[#6e6e73] font-semibold hover:bg-[#f5f5f7] hover:text-[#1d1d1f]'
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-4 h-4 flex items-center justify-center opacity-70"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg></span>
                      <span>Inventory</span>
                    </div>
                    {products.some((p) => p.status !== 'In Stock') && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${activeTab === 'inventory' ? 'bg-white/20 text-white' : 'bg-red-50 text-red-600'}`}>{products.filter((p) => p.status !== 'In Stock').length}</span>
                    )}
                  </button>
                  <button
                    onClick={() => { setActiveTab('attributes'); setIsMobileSidebarOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 rounded-full text-[13px] transition-all flex items-center gap-2.5 ${activeTab === 'attributes'
                      ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-bold shadow-sm'
                      : 'text-[#6e6e73] font-semibold hover:bg-[#f5f5f7] hover:text-[#1d1d1f]'
                      }`}
                  >
                    <span className="w-4 h-4 flex items-center justify-center opacity-70"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="2.5" /><circle cx="19" cy="13" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="10" cy="19" r="2.5" /></svg></span>
                    <span>Sizes, Colors & Tags</span>
                  </button>
                </div>
              )}
            </div>

            {/* Categories Dropdown */}
            <div className="space-y-1">
              <button
                onClick={() => setIsCategoriesDropdownOpen(!isCategoriesDropdownOpen)}
                className="w-full text-left px-5 py-3 rounded-full text-[#1d1d1f] font-bold hover:bg-[#f5f5f7] transition-all flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 flex items-center justify-center opacity-70"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg></span>
                  <span>Categories</span>
                </div>
                <span className={`text-[12px] text-[#86868b] transition-transform duration-200 ${isCategoriesDropdownOpen ? 'rotate-180' : ''}`}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg></span>
              </button>

              {isCategoriesDropdownOpen && (
                <div className="pl-6 space-y-1 pt-1 border-l-2 border-[#e5e5ea] ml-5">
                  {([
                    { id: 'category', label: 'Category', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg> },
                    { id: 'sub-category', label: 'Sub Category', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" /><path d="M2 10h20" /></svg> },
                    { id: 'sub-sub-category', label: 'Sub Sub Categories', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg> },
                  ] satisfies { id: AdminTab; label: string; icon: React.ReactNode }[]).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); setIsMobileSidebarOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 rounded-full text-[13px] transition-all flex items-center gap-2.5 ${activeTab === item.id
                        ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-bold shadow-sm'
                        : 'text-[#6e6e73] font-semibold hover:bg-[#f5f5f7] hover:text-[#1d1d1f]'
                        }`}
                    >
                      <span className="w-4 h-4 flex items-center justify-center opacity-70">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Coupons */}
            <button
              onClick={() => { setActiveTab('coupons'); setIsMobileSidebarOpen(false); }}
              className={`w-full text-left px-5 py-3 rounded-full transition-all flex justify-between items-center ${activeTab === 'coupons'
                ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-bold shadow-md shadow-[#ea580c]/20'
                : 'text-[#6e6e73] font-semibold hover:bg-[#f5f5f7] hover:text-[#1d1d1f]'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 flex items-center justify-center opacity-70"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg></span>
                <span>Coupons</span>
              </div>
              {activeTab === 'coupons' && <span className="text-white/80 text-lg leading-none">•</span>}
            </button>

            {/* Orders */}
            <button
              onClick={() => { setActiveTab('orders'); setIsMobileSidebarOpen(false); }}
              className={`w-full text-left px-5 py-3 rounded-full transition-all flex justify-between items-center ${activeTab === 'orders'
                ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-bold shadow-md shadow-[#ea580c]/20'
                : 'text-[#6e6e73] font-semibold hover:bg-[#f5f5f7] hover:text-[#1d1d1f]'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 flex items-center justify-center opacity-70"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg></span>
                <span>Orders</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${activeTab === 'orders' ? 'bg-white/20 text-white' : 'bg-[#fff2e8] text-[#ea580c]'}`}>{orders.length}</span>
            </button>

            {/* Customers */}
            <button
              onClick={() => { setActiveTab('customers'); setIsMobileSidebarOpen(false); }}
              className={`w-full text-left px-5 py-3 rounded-full transition-all flex justify-between items-center ${activeTab === 'customers'
                ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-bold shadow-md shadow-[#ea580c]/20'
                : 'text-[#6e6e73] font-semibold hover:bg-[#f5f5f7] hover:text-[#1d1d1f]'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 flex items-center justify-center opacity-70"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg></span>
                <span>Customers</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${activeTab === 'customers' ? 'bg-white/20 text-white' : 'bg-[#f5f5f7] text-[#86868b]'}`}>{customers.length}</span>
            </button>

            {/* POS Dropdown */}
            <div className="space-y-1">
              <button
                onClick={() => setIsPosDropdownOpen(!isPosDropdownOpen)}
                className="w-full text-left px-5 py-3 rounded-full text-[#1d1d1f] font-bold hover:bg-[#f5f5f7] transition-all flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 flex items-center justify-center opacity-70"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg></span>
                  <span>POS Terminal</span>
                </div>
                <span className={`text-[12px] text-[#86868b] transition-transform duration-200 ${isPosDropdownOpen ? 'rotate-180' : ''}`}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg></span>
              </button>

              {isPosDropdownOpen && (
                <div className="pl-6 space-y-1 pt-1 border-l-2 border-[#e5e5ea] ml-5">
                  <button
                    onClick={() => { setActiveTab('pos-terminal'); setIsMobileSidebarOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 rounded-full text-[13px] transition-all flex items-center gap-2.5 ${activeTab === 'pos-terminal'
                      ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-bold shadow-sm'
                      : 'text-[#6e6e73] font-semibold hover:bg-[#f5f5f7] hover:text-[#1d1d1f]'
                      }`}
                  >
                    <span className="w-4 h-4 flex items-center justify-center opacity-70"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg></span>
                    <span>Live Register</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('pos-history'); setIsMobileSidebarOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 rounded-full text-[13px] transition-all flex items-center justify-between ${activeTab === 'pos-history'
                      ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-bold shadow-sm'
                      : 'text-[#6e6e73] font-semibold hover:bg-[#f5f5f7] hover:text-[#1d1d1f]'
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-4 h-4 flex items-center justify-center opacity-70"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg></span>
                      <span>POS History</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${activeTab === 'pos-history' ? 'bg-white/20 text-white' : 'bg-[#f5f5f7] text-[#86868b]'}`}>{posHistory.length}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Storefront Dropdown */}
            <div className="space-y-1">
              <button
                onClick={() => setIsStorefrontDropdownOpen(!isStorefrontDropdownOpen)}
                className="w-full text-left px-5 py-3 rounded-full text-[#1d1d1f] font-bold hover:bg-[#f5f5f7] transition-all flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 flex items-center justify-center opacity-70"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l1-5h16l1 5" /><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /><path d="M5 12v8h14v-8" /></svg></span>
                  <span>Storefront</span>
                </div>
                <span className={`text-[12px] text-[#86868b] transition-transform duration-200 ${isStorefrontDropdownOpen ? 'rotate-180' : ''}`}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg></span>
              </button>

              {isStorefrontDropdownOpen && (
                <div className="pl-6 space-y-1 pt-1 border-l-2 border-[#e5e5ea] ml-5">
                  {([
                    { id: 'banners', label: 'Hero Banners', count: banners.length, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg> },
                    { id: 'instagram', label: 'Instagram Feed', count: instagramPosts.length, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg> },
                  ] satisfies { id: AdminTab; label: string; count: number; icon: React.ReactNode }[]).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); setIsMobileSidebarOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 rounded-full text-[13px] transition-all flex items-center justify-between ${activeTab === item.id
                        ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-bold shadow-sm'
                        : 'text-[#6e6e73] font-semibold hover:bg-[#f5f5f7] hover:text-[#1d1d1f]'
                        }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-4 h-4 flex items-center justify-center opacity-70">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${activeTab === item.id ? 'bg-white/20 text-white' : 'bg-[#f5f5f7] text-[#86868b]'}`}>{item.count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Videos */}
            <button
              onClick={() => { setActiveTab('videos'); setIsMobileSidebarOpen(false); }}
              className={`w-full text-left px-5 py-3 rounded-full transition-all flex justify-between items-center ${activeTab === 'videos'
                ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-bold shadow-md shadow-[#ea580c]/20'
                : 'text-[#6e6e73] font-semibold hover:bg-[#f5f5f7] hover:text-[#1d1d1f]'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 flex items-center justify-center opacity-70"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg></span>
                <span>Videos & Reels</span>
              </div>
              {activeTab === 'videos' && <span className="text-white/80 text-lg leading-none">•</span>}
            </button>

            {/* Reports */}
            <button
              onClick={() => { setActiveTab('reports'); setIsMobileSidebarOpen(false); }}
              className={`w-full text-left px-5 py-3 rounded-full transition-all flex justify-between items-center ${activeTab === 'reports'
                ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-bold shadow-md shadow-[#ea580c]/20'
                : 'text-[#6e6e73] font-semibold hover:bg-[#f5f5f7] hover:text-[#1d1d1f]'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 flex items-center justify-center opacity-70"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg></span>
                <span>Reports</span>
              </div>
              {activeTab === 'reports' && <span className="text-white/80 text-lg leading-none">•</span>}
            </button>

            {/* Admin Security */}
            <button
              onClick={() => { setActiveTab('settings'); setIsMobileSidebarOpen(false); }}
              className={`w-full text-left px-5 py-3 rounded-full transition-all flex justify-between items-center ${activeTab === 'settings'
                ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-bold shadow-md shadow-[#ea580c]/20'
                : 'text-[#6e6e73] font-semibold hover:bg-[#f5f5f7] hover:text-[#1d1d1f]'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 flex items-center justify-center opacity-70"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg></span>
                <span>Admin Security</span>
              </div>
              {activeTab === 'settings' && <span className="text-white/80 text-lg leading-none">•</span>}
            </button>
          </nav>
        </div>

        {/* Sidebar Footer / Exit */}
        <div className="p-4 border-t border-[#e5e5ea] bg-white">
          <button
            onClick={() => setIsLoggedIn(false)}
            className="w-full py-3 px-4 bg-white hover:bg-[#fff2e8] text-[#ea580c] font-bold rounded-full text-[13px] transition-all text-center border border-[#e5e5ea] hover:border-[#ea580c] flex items-center justify-center gap-2"
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
          className="fixed top-4 left-4 z-20 md:hidden w-10 h-10 bg-white border border-[#e5e5ea] rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d1d1f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isMobileSidebarOpen ? (
              <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
            ) : (
              <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
            )}
          </svg>
        </button>
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Top Header Breadcrumb */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#e5e5ea]">
            <div>
              <div className="flex items-center gap-2 text-[12px] font-extrabold text-[#86868b] uppercase tracking-wider mb-1">
                <span>E-Commerce</span>
                <span>/</span>
                <span className="text-[#ea580c] capitalize">{activeTab.replaceAll('-', ' ')}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#1d1d1f] capitalize">
                {activeTab === 'add-product' && editingProductId ? 'Edit Product' : TAB_TITLES[activeTab]}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="/adminpanel/store"
                target="_blank"
                rel="noopener"
                title="Open the storefront in a new tab — changes here appear there instantly"
                className="px-4 py-2 bg-white border border-[#e5e5ea] hover:border-[#ea580c] text-[#1d1d1f] rounded-full text-[13px] font-bold shadow-sm flex items-center gap-2 transition-all"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                View Website ↗
              </a>
              {/* Only show Quick Scan for Products and POS */}
              {(activeTab === 'product-list' || activeTab === 'pos-terminal') && (
                <button
                  onClick={() => (activeTab === 'pos-terminal' ? setIsPosCameraOpen(true) : handleTriggerScanner())}
                  className="px-5 py-2 bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-bold text-[13px] rounded-full shadow-md hover:shadow-lg transition-all flex items-center gap-2"
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
                  { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, sub: `Website ₹${websiteRevenue.toLocaleString('en-IN')} • POS ₹${posRevenue.toLocaleString('en-IN')}`, color: 'text-[#10b981]', icon: '💰' },
                  { label: 'Active Orders', value: orders.filter((o) => o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled').length.toString(), sub: `${orders.filter((o) => o.orderStatus === 'Pending' || o.orderStatus === 'Processing').length} require dispatch`, color: 'text-[#ea580c]', icon: '📦' },
                  { label: 'Total Products', value: products.length.toString(), sub: `Across ${categories.length} categories`, color: 'text-[#1d1d1f]', icon: '🏷️' },
                  { label: 'Low Stock Alerts', value: products.filter((p) => p.status !== 'In Stock').length.toString(), sub: `${products.filter((p) => p.status === 'Out of Stock').length} sold out • restock recommended`, color: 'text-[#ef4444]', icon: '⚠️' },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="bg-white border border-[#e5e5ea] p-7 rounded-[32px] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-[12px] font-extrabold text-[#86868b] uppercase tracking-wider">{stat.label}</p>
                      <span className="text-xl p-2 bg-[#f5f5f7] rounded-xl">{stat.icon}</span>
                    </div>
                    <p className={`text-3xl font-black tracking-tight ${stat.color}`}>{stat.value}</p>
                    <p className="text-[12px] text-[#6e6e73] font-semibold mt-2">{stat.sub}</p>
                  </div>
                ))}
              </div>

              {/* Store Catalog Statistics (live, shared with the storefront) */}
              <div className="bg-white border border-[#e5e5ea] rounded-[36px] p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f]">Store Catalog</h3>
                    <p className="text-[13px] text-[#86868b] font-semibold mt-1">What shoppers see on the website right now</p>
                  </div>
                  <span className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[12px] font-extrabold flex items-center gap-2 w-fit">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live sync with storefront
                  </span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {([
                    { label: 'Categories', value: categories.filter((c) => c.status === 'Active').length, sub: `${subCategories.length} sub • ${subSubCategories.length} level 3`, tab: 'category', icon: '🗂️' },
                    { label: 'Hero Banners', value: banners.filter((b) => b.isActive).length, sub: `${banners.length} total slides`, tab: 'banners', icon: '🖼️' },
                    { label: 'Instagram Feed', value: instagramPosts.length, sub: 'Posts on the home page', tab: 'instagram', icon: '📸' },
                    { label: 'Sizes, Colors & Tags', value: sizeOptions.length + colorOptions.length + tagOptions.length, sub: `${sizeOptions.length} sizes • ${colorOptions.length} colors • ${tagOptions.length} tags`, tab: 'attributes', icon: '🎨' },
                  ] satisfies { label: string; value: number; sub: string; tab: AdminTab; icon: string }[]).map((tile) => (
                    <button
                      key={tile.label}
                      onClick={() => setActiveTab(tile.tab)}
                      className="p-5 bg-[#f5f5f7] hover:bg-[#fff2e8] border border-[#e5e5ea] hover:border-[#ea580c] rounded-[24px] text-left transition-all group"
                    >
                      <div className="flex justify-between items-start">
                        <p className="text-3xl font-black tracking-tight text-[#1d1d1f] group-hover:text-[#ea580c]">{tile.value}</p>
                        <span className="text-xl">{tile.icon}</span>
                      </div>
                      <p className="text-[12px] font-extrabold text-[#1d1d1f] uppercase tracking-wider mt-2">{tile.label}</p>
                      <p className="text-[11px] text-[#86868b] font-semibold mt-0.5">{tile.sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Actions & Recent Orders Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Orders Overview */}
                <div className="lg:col-span-2 bg-white border border-[#e5e5ea] rounded-[36px] p-8 space-y-6 shadow-sm">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f]">Recent Customer Orders</h3>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-[#ea580c] text-[13px] font-bold hover:underline"
                    >
                      View All Orders →
                    </button>
                  </div>

                  <div className="space-y-3">
                    {orders.slice(0, 3).map((ord) => (
                      <div
                        key={ord.id}
                        className="p-5 bg-[#f5f5f7] border border-[#e5e5ea] rounded-[24px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-white hover:shadow-sm transition-all"
                      >
                        <div>
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono font-bold text-[#ea580c] text-[13px]">{ord.orderNumber}</span>
                            <span className="text-[#86868b]">•</span>
                            <span className="font-bold text-[#1d1d1f] text-[14px]">{ord.customerName}</span>
                          </div>
                          <p className="text-[12px] text-[#6e6e73] font-semibold mt-1">
                            {ord.itemsCount} item(s) via {ord.paymentMethod}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-black text-[#1d1d1f] text-[15px]">₹{ord.total.toLocaleString()}</span>
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
                <div className="bg-white border border-[#e5e5ea] rounded-[36px] p-8 space-y-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f] mb-4">Quick Operations</h3>
                    <div className="space-y-3">
                      <button
                        onClick={openAddProduct}
                        className="w-full p-4 bg-[#f5f5f7] hover:bg-[#fff2e8] border border-[#e5e5ea] hover:border-[#ea580c] rounded-2xl text-left transition-all group flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">➕</span>
                          <div>
                            <span className="font-bold text-[#1d1d1f] group-hover:text-[#ea580c] block text-[14px]">
                              Add Single Product
                            </span>
                            <span className="text-[11px] text-[#86868b]">New inventory item form</span>
                          </div>
                        </div>
                        <span className="text-[#86868b] group-hover:text-[#ea580c]">→</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('product-list');
                          setIsMultiProductModalOpen(true);
                        }}
                        className="w-full p-4 bg-[#f5f5f7] hover:bg-[#fff2e8] border border-[#e5e5ea] hover:border-[#ea580c] rounded-2xl text-left transition-all group flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">📑</span>
                          <div>
                            <span className="font-bold text-[#1d1d1f] group-hover:text-[#ea580c] block text-[14px]">
                              Bulk Multi-Product Add
                            </span>
                            <span className="text-[11px] text-[#86868b]">Import multiple items</span>
                          </div>
                        </div>
                        <span className="text-[#86868b] group-hover:text-[#ea580c]">→</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('pos-terminal')}
                        className="w-full p-4 bg-[#f5f5f7] hover:bg-[#fff2e8] border border-[#e5e5ea] hover:border-[#ea580c] rounded-2xl text-left transition-all group flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">🖥️</span>
                          <div>
                            <span className="font-bold text-[#1d1d1f] group-hover:text-[#ea580c] block text-[14px]">
                              Open POS Terminal
                            </span>
                            <span className="text-[11px] text-[#86868b]">In-store checkout & receipt</span>
                          </div>
                        </div>
                        <span className="text-[#86868b] group-hover:text-[#ea580c]">→</span>
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('coupons')}
                    className="w-full p-4 bg-orange-50/60 border border-orange-200/60 rounded-2xl text-center hover:bg-orange-50 transition-all"
                  >
                    <p className="text-[11px] font-bold text-[#ea580c] uppercase tracking-wider">
                      {headerCoupons.length ? 'Coupon Shown in Store Header' : 'No Coupon in Store Header'}
                    </p>
                    <p className="text-[13px] font-black text-[#1d1d1f] mt-0.5">
                      {headerCoupons.length
                        ? headerCoupons.map((c) => `${c.code} (${c.discountType === 'Percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`})`).join(' • ')
                        : 'Pick one in Coupons →'}
                    </p>
                  </button>
                </div>
              </div>

              {/* Sales Performance Chart */}
              <div className="bg-white border border-[#e5e5ea] rounded-[36px] p-8 shadow-sm">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f]">Sales Performance</h3>
                    <p className="text-[13px] text-[#86868b] font-semibold mt-1">Revenue over the last 7 days</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] font-extrabold text-[#ea580c] uppercase tracking-wider">Total</p>
                    <p className="text-2xl font-black text-[#1d1d1f]">₹{totalRevenue.toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <div className="h-64 flex items-end justify-between gap-2 px-2 mt-4">
                  {[45, 60, 35, 80, 50, 95, 75].map((h, i) => (
                    <div key={i} className="w-full bg-[#f5f5f7] rounded-t-xl relative group h-full flex items-end">
                      <div
                        className="w-full bg-gradient-to-t from-[#ea580c] to-[#f97316] rounded-t-xl opacity-80 group-hover:opacity-100 transition-opacity"
                        style={{ height: `${h}%` }}
                      ></div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-4 text-[11px] font-extrabold text-[#86868b] uppercase tracking-wider px-2">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. ADD PRODUCT TAB */}
          {/* ========================================================================= */}
          {activeTab === 'add-product' && (
            <div className="bg-white border border-[#e5e5ea] rounded-[36px] p-8 md:p-10 shadow-sm w-full">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#e5e5ea]">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight text-[#1d1d1f]">{editingProductId ? 'Edit Product' : 'Add New Product'}</h3>
                  <p className="text-[14px] text-[#6e6e73] font-medium mt-1">
                    {editingProductId
                      ? 'Update details, sizes, colors, stock and photos. Changes go live as soon as you save.'
                      : 'Fill in the details below to publish an item to the e-commerce inventory.'}
                  </p>
                </div>
                {!editingProductId && (
                  <button
                    onClick={() => setIsMultiProductModalOpen(true)}
                    className="px-4 py-2 bg-[#f5f5f7] hover:bg-[#e5e5ea] text-[#1d1d1f] rounded-full text-[12px] font-extrabold border border-[#e5e5ea] transition-all"
                  >
                    ⚡ Bulk Add Multiple
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Product Title */}
                  <div className="md:col-span-2">
                    <label className="block text-[12px] font-extrabold uppercase tracking-widest text-[#86868b] mb-2 pl-2">
                      Product Name / Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={newProdName}
                      onChange={(e) => setNewProdName(e.target.value)}
                      placeholder="e.g. Wireless Noise-Cancelling Headphones"
                      className="w-full px-6 py-4 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[14px] text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#ea580c] transition-all font-semibold"
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-[12px] font-extrabold uppercase tracking-widest text-[#86868b] mb-2 pl-2">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={newProdDescription}
                      onChange={(e) => setNewProdDescription(e.target.value)}
                      placeholder="Key features, materials, battery life, what's in the box..."
                      className="w-full px-6 py-4 bg-[#f5f5f7] border border-[#e5e5ea] rounded-[24px] text-[14px] text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#ea580c] transition-all font-semibold resize-none"
                    />
                  </div>

                  {/* SKU */}
                  <div>
                    <label className="block text-[12px] font-extrabold uppercase tracking-widest text-[#86868b] mb-2 pl-2 flex justify-between">
                      <span>SKU Code</span>
                      <button
                        type="button"
                        onClick={() => setNewProdSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`)}
                        className="text-[#ea580c] hover:underline font-bold text-[11px]"
                      >
                        Auto-Generate
                      </button>
                    </label>
                    <input
                      type="text"
                      value={newProdSku}
                      onChange={(e) => setNewProdSku(e.target.value)}
                      placeholder="e.g. WNC-HP-01"
                      className="w-full px-6 py-4 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[14px] text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#ea580c] transition-all font-semibold font-mono"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-[12px] font-extrabold uppercase tracking-widest text-[#86868b] mb-2 pl-2">
                      Category *
                    </label>
                    <select
                      value={newProdCategory}
                      onChange={(e) => handleProductCategoryChange(e.target.value)}
                      className="w-full px-6 py-4 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[14px] text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#ea580c] transition-all font-bold cursor-pointer"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sub-Category */}
                  <div>
                    <label className="block text-[12px] font-extrabold uppercase tracking-widest text-[#86868b] mb-2 pl-2">
                      Sub Category
                    </label>
                    <select
                      value={newProdSubCategory}
                      onChange={(e) => { setNewProdSubCategory(e.target.value); setNewProdSubSubCategory(''); }}
                      className="w-full px-6 py-4 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[14px] text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#ea580c] transition-all font-bold cursor-pointer"
                    >
                      {subCategories
                        .filter((sc) => sc.parentCategory === newProdCategory)
                        .map((sc) => (
                          <option key={sc.id} value={sc.name}>
                            {sc.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Sub-Sub-Category */}
                  <div>
                    <label className="block text-[12px] font-extrabold uppercase tracking-widest text-[#86868b] mb-2 pl-2">
                      Sub Sub Category
                    </label>
                    <select
                      value={newProdSubSubCategory}
                      onChange={(e) => setNewProdSubSubCategory(e.target.value)}
                      className="w-full px-6 py-4 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[14px] text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#ea580c] transition-all font-bold cursor-pointer"
                    >
                      <option value="">None</option>
                      {subSubCategories
                        .filter((ssc) => ssc.parentSubCategory === newProdSubCategory)
                        .map((ssc) => (
                          <option key={ssc.id} value={ssc.name}>
                            {ssc.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-[12px] font-extrabold uppercase tracking-widest text-[#86868b] mb-2 pl-2">
                      Price (₹ INR) *
                    </label>
                    <input
                      type="number"
                      required
                      value={newProdPrice}
                      onChange={(e) => setNewProdPrice(e.target.value)}
                      placeholder="e.g. 14999"
                      className="w-full px-6 py-4 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[14px] text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#ea580c] transition-all font-bold"
                    />
                  </div>

                  {/* MRP */}
                  <div>
                    <label className="block text-[12px] font-extrabold uppercase tracking-widest text-[#86868b] mb-2 pl-2 flex justify-between">
                      <span>MRP / Original Price (₹)</span>
                      {parseFloat(newProdMrp) > parseFloat(newProdPrice) && (
                        <span className="text-emerald-600 normal-case tracking-normal">
                          {Math.round((1 - parseFloat(newProdPrice) / parseFloat(newProdMrp)) * 100)}% off
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newProdMrp}
                      onChange={(e) => setNewProdMrp(e.target.value)}
                      placeholder="Optional — shown struck through, e.g. 19999"
                      className="w-full px-6 py-4 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[14px] text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#ea580c] transition-all font-bold"
                    />
                  </div>
                </div>

                {/* Sizes, Colors & Stock */}
                <div className="pt-6 border-t border-[#e5e5ea] space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                    <div>
                      <h4 className="text-lg font-bold tracking-tight text-[#1d1d1f]">Sizes, Colors & Stock</h4>
                      <p className="text-[13px] text-[#86868b] font-semibold">
                        Every size and color combination has its own stock. Total stock is calculated automatically.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('attributes')}
                      className="text-[#ea580c] hover:underline font-bold text-[12px] whitespace-nowrap"
                    >
                      Manage sizes & colors →
                    </button>
                  </div>

                  <div>
                    <label className="block text-[12px] font-extrabold uppercase tracking-widest text-[#86868b] mb-2 pl-2">
                      Available Sizes <span className="normal-case tracking-normal font-semibold">(leave empty for one size)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {sizeOptions.map((sz) => (
                        <button
                          key={sz.id}
                          type="button"
                          aria-pressed={newProdSizes.includes(sz.code)}
                          title={sz.name}
                          onClick={() => setNewProdSizes(toggleInList(newProdSizes, sz.code))}
                          className={`px-4 py-2 rounded-full text-[13px] font-bold border transition-all ${newProdSizes.includes(sz.code)
                            ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white border-transparent shadow-sm'
                            : 'bg-[#f5f5f7] text-[#1d1d1f] border-[#e5e5ea] hover:bg-white hover:border-[#ea580c]'
                            }`}
                        >
                          {sz.code}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-extrabold uppercase tracking-widest text-[#86868b] mb-2 pl-2">
                      Available Colors <span className="normal-case tracking-normal font-semibold">(leave empty for one color)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map((col) => (
                        <button
                          key={col.id}
                          type="button"
                          aria-pressed={newProdColors.includes(col.name)}
                          onClick={() => setNewProdColors(toggleInList(newProdColors, col.name))}
                          className={`pl-2 pr-4 py-1.5 rounded-full text-[13px] font-bold border transition-all flex items-center gap-2 ${newProdColors.includes(col.name)
                            ? 'bg-[#1d1d1f] text-white border-[#1d1d1f] shadow-sm'
                            : 'bg-[#f5f5f7] text-[#1d1d1f] border-[#e5e5ea] hover:bg-white hover:border-[#ea580c]'
                            }`}
                        >
                          <span className="w-5 h-5 rounded-full border border-black/10" style={{ backgroundColor: col.hex }} />
                          {col.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <VariantStockGrid
                    sizes={sizeOptions.map((s) => s.code).filter((code) => newProdSizes.includes(code))}
                    colors={colorOptions.map((c) => c.name).filter((name) => newProdColors.includes(name))}
                    values={newProdVariantStock}
                    onChange={setNewProdVariantStock}
                    colorHex={colorHex}
                  />
                </div>

                {/* Photos */}
                <div className="pt-6 border-t border-[#e5e5ea] space-y-6">
                  <div>
                    <h4 className="text-lg font-bold tracking-tight text-[#1d1d1f]">Photos</h4>
                    <p className="text-[13px] text-[#86868b] font-semibold">
                      Main photos show on the product page. Photos for a color replace them when a shopper picks that color.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[12px] font-extrabold uppercase tracking-widest text-[#86868b] mb-2 pl-2">
                      Main Product Photos
                    </label>
                    <ImageListField images={newProdImages} onChange={setNewProdImages} label="Main product photo" />
                  </div>

                  {colorOptions
                    .filter((col) => newProdColors.includes(col.name))
                    .map((col) => (
                      <details key={col.id} className="group bg-[#f5f5f7] border border-[#e5e5ea] rounded-[24px] overflow-hidden">
                        <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                          <span className="w-5 h-5 rounded-full border border-black/10" style={{ backgroundColor: col.hex }} />
                          <span className="flex-1 font-bold text-[14px] text-[#1d1d1f]">Photos for {col.name}</span>
                          <span className="text-[12px] font-semibold text-[#86868b]">{(newProdColorImages[col.name] ?? []).length} photos</span>
                          <svg className="w-4 h-4 text-[#ea580c] transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                        </summary>
                        <div className="px-5 pb-5">
                          <ImageListField
                            images={newProdColorImages[col.name] ?? []}
                            onChange={(images) => setNewProdColorImages({ ...newProdColorImages, [col.name]: images })}
                            label={`${col.name} photo`}
                          />
                        </div>
                      </details>
                    ))}
                </div>

                {/* Product Page Details */}
                <div className="pt-6 border-t border-[#e5e5ea] space-y-5">
                  <div>
                    <h4 className="text-lg font-bold tracking-tight text-[#1d1d1f]">Product Page Details</h4>
                    <p className="text-[13px] text-[#86868b] font-semibold">Shown on the website&apos;s product page under &quot;Why you&apos;ll love it&quot; and &quot;Specifications&quot;.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[12px] font-extrabold uppercase tracking-widest text-[#86868b] mb-2 pl-2">
                        Key Highlights <span className="normal-case tracking-normal font-semibold">(one per line)</span>
                      </label>
                      <textarea
                        rows={5}
                        value={newProdHighlights}
                        onChange={(e) => setNewProdHighlights(e.target.value)}
                        placeholder={'Adaptive noise cancelling\n40-hour battery\nFolds into a travel case'}
                        className="w-full px-6 py-4 bg-[#f5f5f7] border border-[#e5e5ea] rounded-[24px] text-[14px] text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#ea580c] transition-all font-semibold resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-extrabold uppercase tracking-widest text-[#86868b] mb-2 pl-2">
                        Specifications <span className="normal-case tracking-normal font-semibold">(Label: Value, one per line)</span>
                      </label>
                      <textarea
                        rows={5}
                        value={newProdSpecs}
                        onChange={(e) => setNewProdSpecs(e.target.value)}
                        placeholder={'Battery: 40 hours\nBluetooth: 5.3\nWeight: 254 g'}
                        className="w-full px-6 py-4 bg-[#f5f5f7] border border-[#e5e5ea] rounded-[24px] text-[14px] text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#ea580c] transition-all font-semibold font-mono resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Tags & Visibility */}
                <div className="pt-6 border-t border-[#e5e5ea] space-y-5">
                  <div>
                    <label className="block text-[12px] font-extrabold uppercase tracking-widest text-[#86868b] mb-2 pl-2">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {tagOptions.map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          aria-pressed={newProdTags.includes(tag.name)}
                          onClick={() => setNewProdTags(toggleInList(newProdTags, tag.name))}
                          className={`px-4 py-2 rounded-full text-[13px] font-bold border transition-all ${newProdTags.includes(tag.name)
                            ? 'bg-[#fff2e8] text-[#ea580c] border-[#ea580c]'
                            : 'bg-[#f5f5f7] text-[#6e6e73] border-[#e5e5ea] hover:bg-white'
                            }`}
                        >
                          #{tag.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {[
                      { label: 'Mark as New Arrival', checked: newProdIsNew, set: setNewProdIsNew },
                      { label: 'Feature on Home Page', checked: newProdIsFeatured, set: setNewProdIsFeatured },
                    ].map((opt) => (
                      <label
                        key={opt.label}
                        className={`flex items-center gap-3 px-5 py-3 rounded-full border cursor-pointer transition-all ${opt.checked ? 'bg-[#fff2e8] border-[#ea580c]' : 'bg-[#f5f5f7] border-[#e5e5ea]'}`}
                      >
                        <input
                          type="checkbox"
                          checked={opt.checked}
                          onChange={(e) => opt.set(e.target.checked)}
                          className="w-4 h-4 accent-[#ea580c]"
                        />
                        <span className="text-[13px] font-bold text-[#1d1d1f]">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {productFormError && (
                  <p role="alert" className="text-red-500 text-[13px] font-bold bg-red-50 px-4 py-2.5 rounded-xl">{productFormError}</p>
                )}

                <div className="pt-4 flex gap-4">
                  <button
                    type="submit"
                    className="px-8 py-4 bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-black text-[14px] rounded-full transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 uppercase tracking-wider"
                  >
                    {editingProductId ? 'Save Changes' : 'Save & Publish Product'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { resetProductForm(); setActiveTab('product-list'); }}
                    className="px-8 py-4 bg-white border border-[#e5e5ea] hover:bg-[#f5f5f7] text-[#6e6e73] font-bold text-[14px] rounded-full transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. PRODUCT LIST TAB (With Scanner, Multi-Add, Edit, Delete) */}
          {/* ========================================================================= */}
          {activeTab === 'product-list' && (
            <div className="space-y-6">
              {/* Stock Summary Cards (click to filter) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {([
                  { label: 'Total Products', filter: 'All', count: products.length, color: 'text-[#1d1d1f]', bg: 'bg-white', border: 'border-[#e5e5ea]' },
                  { label: 'Healthy Stock', filter: 'In Stock', count: products.filter((p) => p.status === 'In Stock').length, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                  { label: 'Low Stock (1-10)', filter: 'Low Stock', count: products.filter((p) => p.status === 'Low Stock').length, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
                  { label: 'Sold Out', filter: 'Out of Stock', count: products.filter((p) => p.status === 'Out of Stock').length, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
                ] satisfies { label: string; filter: typeof productStockFilter; count: number; color: string; bg: string; border: string }[]).map((card) => (
                  <button
                    key={card.label}
                    onClick={() => setProductStockFilter(card.filter)}
                    className={`${card.bg} border ${productStockFilter === card.filter ? 'border-[#ea580c] ring-2 ring-[#ea580c]/20' : card.border} rounded-[24px] p-5 text-left transition-all hover:shadow-md`}
                  >
                    <p className={`text-3xl font-black tracking-tight ${card.color}`}>{card.count}</p>
                    <p className="text-[12px] font-extrabold text-[#86868b] uppercase tracking-wider mt-1">{card.label}</p>
                  </button>
                ))}
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[28px] border border-[#e5e5ea] shadow-sm">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f]">Inventory Catalog</h3>
                  <p className="text-[13px] text-[#86868b] font-semibold">
                    {products.length} products currently active in store
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setIsMultiProductModalOpen(true)}
                    className="px-5 py-2.5 bg-[#f5f5f7] hover:bg-[#e5e5ea] text-[#1d1d1f] border border-[#e5e5ea] rounded-full text-[13px] font-extrabold transition-all flex items-center gap-2"
                  >
                    <span>📑</span>
                    <span>Add Multiple Products</span>
                  </button>

                  <button
                    onClick={openAddProduct}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white rounded-full text-[13px] font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
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
                  className="flex-1 px-6 py-3.5 bg-white border border-[#e5e5ea] rounded-full text-[14px] text-[#1d1d1f] focus:outline-none focus:border-[#ea580c] transition-all font-semibold shadow-sm"
                />
                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  aria-label="Filter by category"
                  className="px-6 py-3.5 bg-white border border-[#e5e5ea] rounded-full text-[14px] text-[#1d1d1f] focus:outline-none focus:border-[#ea580c] transition-all font-bold cursor-pointer shadow-sm"
                >
                  <option value="All">All Categories ({products.length})</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name} ({products.filter((p) => p.category === c.name).length})</option>
                  ))}
                </select>
              </div>

              {/* Product Table */}
              <div className="bg-white border border-[#e5e5ea] rounded-[36px] p-6 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[14px]">
                    <thead className="text-[#86868b] border-b border-[#e5e5ea]">
                      <tr>
                        <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Product</th>
                        <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">SKU</th>
                        <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Category</th>
                        <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Price</th>
                        <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Stock</th>
                        <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Status</th>
                        <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e5ea]">
                      {visibleProducts.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-[13px] font-semibold text-[#86868b]">
                            No products match your search or filter.
                          </td>
                        </tr>
                      )}
                      {visibleProducts.map((prod) => (
                        <Fragment key={prod.id}>
                        <tr className="group hover:bg-[#f5f5f7]/60 transition-colors">
                          {/* Image & Title */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3.5">
                              <img
                                src={prod.image}
                                alt={prod.name}
                                className="w-12 h-12 rounded-2xl object-cover border border-[#e5e5ea] shadow-sm bg-white"
                              />
                              <div>
                                <span className="font-bold text-[#1d1d1f] block text-[14px] leading-tight max-w-xs">
                                  {prod.name}
                                </span>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                  <span className="text-[11px] text-[#86868b] font-semibold">⭐ {prod.rating}</span>
                                  {prod.colors.map((c) => (
                                    <span
                                      key={c}
                                      title={c}
                                      className="w-3 h-3 rounded-full border border-black/10"
                                      style={{ backgroundColor: colorHex[c] ?? '#d2d2d7' }}
                                    />
                                  ))}
                                  {prod.isNewArrival && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[9px] font-black uppercase">New</span>}
                                  {prod.isFeatured && <span className="px-1.5 py-0.5 bg-[#fff2e8] text-[#ea580c] rounded-md text-[9px] font-black uppercase">Featured</span>}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* SKU */}
                          <td className="py-4 px-4 font-mono text-[12px]">
                            <span className="font-bold text-[#1d1d1f] block">{prod.sku}</span>
                          </td>

                          {/* Category */}
                          <td className="py-4 px-4">
                            <span className="font-bold text-[#1d1d1f] block">{prod.category}</span>
                            <span className="text-[12px] text-[#86868b]">
                              {prod.subCategory} {prod.subSubCategory && `> ${prod.subSubCategory}`}
                            </span>
                          </td>

                          {/* Price */}
                          <td className="py-4 px-4">
                            <span className="font-black text-[#1d1d1f] text-[15px] block">₹{prod.price.toLocaleString()}</span>
                            {prod.mrp && prod.mrp > prod.price && (
                              <span className="text-[12px] text-[#86868b] font-semibold line-through">₹{prod.mrp.toLocaleString()}</span>
                            )}
                          </td>

                          {/* Stock (by size) */}
                          <td className="py-4 px-4">
                            <span className="font-bold text-[#1d1d1f] block">{prod.stock} units</span>
                            {prod.sizes.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1 max-w-[180px]">
                                {prod.sizes.map((size) => (
                                  <span
                                    key={size}
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${sizeTotal(prod.variantStock, size) > 0 ? 'bg-[#f5f5f7] text-[#6e6e73] border-[#e5e5ea]' : 'bg-red-50 text-red-600 border-red-200'}`}
                                  >
                                    {size}: {sizeTotal(prod.variantStock, size)}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4">
                            <span
                              className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${prod.status === 'In Stock'
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                : prod.status === 'Low Stock'
                                  ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                  : 'bg-red-100 text-red-700 border border-red-200'
                                }`}
                            >
                              {prod.status}
                            </span>
                          </td>

                          {/* Actions: Scanner, Edit, Delete */}
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Barcode Actions */}
                              <div className="flex bg-[#f5f5f7] border border-[#e5e5ea] rounded-xl overflow-hidden shadow-sm">
                                <button
                                  onClick={() => {
                                    setActiveBarcodeProduct(prod);
                                    setBarcodeGenStatus('idle');
                                    setIsGenerateBarcodeModalOpen(true);
                                  }}
                                  className="px-3 py-2 text-[11px] font-bold text-[#ea580c] hover:bg-[#fff2e8] transition-colors border-r border-[#e5e5ea] flex items-center gap-1.5"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h2v14H3z M7 5h1v14H7z M11 5h2v14h-2z M15 5h1v14h-1z M19 5h2v14h-2z" /></svg>
                                  Generate
                                </button>
                                <button
                                  onClick={() => {
                                    setActiveBarcodeProduct(prod);
                                    setBarcodePrintStatus('idle');
                                    setIsPrintBarcodeModalOpen(true);
                                  }}
                                  title="Print Barcode"
                                  className="px-2.5 py-2 text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-[#e5e5ea] transition-colors flex items-center justify-center"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
                                </button>
                              </div>

                              {/* Stock Button */}
                              <button
                                onClick={() => openStockEditor(prod)}
                                title="Edit stock by size & color"
                                className="p-2.5 bg-[#f5f5f7] hover:bg-[#fff2e8] text-[#ea580c] hover:border-[#ea580c] border border-[#e5e5ea] rounded-xl transition-all shadow-sm"
                              >
                                📦
                              </button>

                              {/* Edit Button */}
                              <button
                                onClick={() => openEditProduct(prod)}
                                title="Edit Product"
                                className="p-2.5 bg-[#f5f5f7] hover:bg-blue-50 text-blue-600 hover:border-blue-300 border border-[#e5e5ea] rounded-xl transition-all shadow-sm"
                              >
                                ✏️
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() => handleDeleteProduct(prod.id)}
                                title="Delete Product"
                                className="p-2.5 bg-[#f5f5f7] hover:bg-red-50 text-red-600 hover:border-red-300 border border-[#e5e5ea] rounded-xl transition-all shadow-sm"
                              >
                                🗑️
                              </button>

                              {/* Expand Details */}
                              <button
                                onClick={() => setExpandedProductId(expandedProductId === prod.id ? null : prod.id)}
                                title={expandedProductId === prod.id ? 'Hide details' : 'Show stock & photo details'}
                                aria-expanded={expandedProductId === prod.id}
                                className="p-2.5 bg-[#f5f5f7] hover:bg-[#e5e5ea] text-[#1d1d1f] border border-[#e5e5ea] rounded-xl transition-all shadow-sm"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${expandedProductId === prod.id ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expandedProductId === prod.id && (
                          <tr className="bg-[#fafafa]">
                            <td colSpan={7} className="px-4 pb-6 pt-2">
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                {/* Stock grid */}
                                <div className="lg:col-span-2 bg-white border border-[#e5e5ea] rounded-[24px] p-5 overflow-x-auto">
                                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#86868b] mb-3">Stock by Size & Color</p>
                                  <table className="w-full text-[13px]">
                                    <thead className="text-[#86868b]">
                                      <tr>
                                        <th className="pb-2 pr-3 text-left font-extrabold uppercase text-[10px] tracking-wider">Size</th>
                                        {variantColors(prod.colors).map((color) => (
                                          <th key={color} className="pb-2 px-3 text-left font-extrabold uppercase text-[10px] tracking-wider">{color === STANDARD ? 'Stock' : color}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {variantSizes(prod.sizes).map((size) => (
                                        <tr key={size} className="border-t border-[#f5f5f7]">
                                          <td className="py-2 pr-3 font-bold text-[#1d1d1f]">{size === STANDARD ? 'One Size' : size}</td>
                                          {variantColors(prod.colors).map((color) => {
                                            const qty = prod.variantStock[size]?.[color] ?? 0;
                                            return (
                                              <td key={color} className="py-2 px-3">
                                                <span className={`px-2.5 py-1 rounded-lg font-black text-[12px] ${qty === 0 ? 'bg-red-50 text-red-600' : qty <= 5 ? 'bg-amber-50 text-amber-700' : 'bg-[#f5f5f7] text-[#1d1d1f]'}`}>{qty === 0 ? 'Sold out' : qty}</span>
                                              </td>
                                            );
                                          })}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                  {prod.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-4">
                                      {prod.tags.map((t) => <span key={t} className="px-2.5 py-1 bg-[#fff2e8] text-[#ea580c] rounded-full text-[11px] font-bold">#{t}</span>)}
                                    </div>
                                  )}
                                </div>
                                {/* Photos */}
                                <div className="bg-white border border-[#e5e5ea] rounded-[24px] p-5 space-y-3">
                                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#86868b]">Photos</p>
                                  <div>
                                    <p className="text-[12px] font-bold text-[#1d1d1f] mb-1.5">Main ({prod.images.length})</p>
                                    <div className="flex flex-wrap gap-2">
                                      {prod.images.map((src, i) => <img key={i} src={src} alt="" className="w-11 h-11 rounded-xl object-cover border border-[#e5e5ea]" />)}
                                    </div>
                                  </div>
                                  {prod.colors.map((color) => (
                                    <div key={color}>
                                      <p className="text-[12px] font-bold text-[#1d1d1f] mb-1.5 flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: colorHex[color] ?? '#d2d2d7' }} />
                                        {color} ({prod.colorImages[color]?.length ?? 0})
                                      </p>
                                      {prod.colorImages[color]?.length ? (
                                        <div className="flex flex-wrap gap-2">
                                          {prod.colorImages[color].map((src, i) => <img key={i} src={src} alt="" className="w-11 h-11 rounded-xl object-cover border border-[#e5e5ea]" />)}
                                        </div>
                                      ) : (
                                        <p className="text-[11px] text-[#86868b] font-semibold">Uses the main photos</p>
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
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-[28px] border border-[#e5e5ea] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f]">Stock by Size & Color</h3>
                  <p className="text-[13px] text-[#86868b] font-semibold">Each combination is counted separately. Sold-out combinations are shown in red.</p>
                </div>
                <span className="px-4 py-1.5 bg-[#fff2e8] text-[#ea580c] font-black text-[13px] rounded-full border border-orange-200">
                  {products.reduce((sum, p) => sum + p.stock, 0).toLocaleString()} Units in Stock
                </span>
              </div>

              <input
                type="text"
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                placeholder="Search product name or SKU..."
                className="w-full px-6 py-3.5 bg-white border border-[#e5e5ea] rounded-full text-[14px] text-[#1d1d1f] focus:outline-none focus:border-[#ea580c] transition-all font-semibold shadow-sm"
              />

              <div className="space-y-4">
                {products
                  .filter((p) => [p.name, p.sku].some((v) => v.toLowerCase().includes(inventorySearch.trim().toLowerCase())))
                  .map((prod) => (
                    <div key={prod.id} className="bg-white border border-[#e5e5ea] rounded-[32px] p-6 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                        <div className="flex items-center gap-3.5">
                          <img src={prod.image} alt={prod.name} className="w-12 h-12 rounded-2xl object-cover border border-[#e5e5ea] bg-white" />
                          <div>
                            <span className="font-bold text-[#1d1d1f] block text-[15px] leading-tight">{prod.name}</span>
                            <span className="text-[12px] text-[#86868b] font-semibold font-mono">{prod.sku}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${prod.status === 'In Stock'
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                              : prod.status === 'Low Stock'
                                ? 'bg-amber-100 text-amber-700 border-amber-200'
                                : 'bg-red-100 text-red-700 border-red-200'
                              }`}
                          >
                            {prod.stock} units
                          </span>
                          <button
                            onClick={() => openStockEditor(prod)}
                            className="px-4 py-2 bg-[#f5f5f7] hover:bg-[#fff2e8] text-[#ea580c] border border-[#e5e5ea] hover:border-[#ea580c] rounded-full text-[12px] font-extrabold transition-all"
                          >
                            Update Stock
                          </button>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[13px]">
                          <thead className="text-[#86868b]">
                            <tr>
                              <th className="pb-2 px-3 font-extrabold uppercase text-[10px] tracking-wider">Size</th>
                              {variantColors(prod.colors).map((color) => (
                                <th key={color} className="pb-2 px-3 font-extrabold uppercase text-[10px] tracking-wider">
                                  <span className="flex items-center gap-1.5">
                                    {color !== STANDARD && <span className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ backgroundColor: colorHex[color] ?? '#d2d2d7' }} />}
                                    {color === STANDARD ? 'Stock' : color}
                                  </span>
                                </th>
                              ))}
                              <th className="pb-2 px-3 font-extrabold uppercase text-[10px] tracking-wider text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {variantSizes(prod.sizes).map((size) => (
                              <tr key={size} className="border-t border-[#f5f5f7]">
                                <td className="py-2.5 px-3 font-bold text-[#1d1d1f]">{size === STANDARD ? 'One Size' : size}</td>
                                {variantColors(prod.colors).map((color) => {
                                  const qty = prod.variantStock[size]?.[color] ?? 0;
                                  return (
                                    <td key={color} className="py-2.5 px-3">
                                      <span className={`px-2.5 py-1 rounded-lg font-black text-[12px] ${qty === 0 ? 'bg-red-50 text-red-600' : qty <= 5 ? 'bg-amber-50 text-amber-700' : 'bg-[#f5f5f7] text-[#1d1d1f]'}`}>
                                        {qty}
                                      </span>
                                    </td>
                                  );
                                })}
                                <td className="py-2.5 px-3 text-right font-black text-[#1d1d1f]">{sizeTotal(prod.variantStock, size)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3c. SIZES, COLORS & TAGS TAB (Product Attributes) */}
          {/* ========================================================================= */}
          {activeTab === 'attributes' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Sizes */}
              <div className="bg-white border border-[#e5e5ea] rounded-[36px] p-7 shadow-sm space-y-5">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f]">Size Options</h3>
                  <p className="text-[13px] text-[#86868b] font-semibold">The code shows on product chips and in stock tables.</p>
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Name (e.g. 45 mm Case)"
                    value={newSizeName}
                    onChange={(e) => setNewSizeName(e.target.value)}
                    className="w-full px-5 py-3 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[13px] font-semibold text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#ea580c]"
                  />
                  <input
                    type="text"
                    placeholder="Code (e.g. 45mm)"
                    value={newSizeCode}
                    onChange={(e) => setNewSizeCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveSize()}
                    className="w-full px-5 py-3 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[13px] font-semibold text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#ea580c]"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveSize}
                      className="flex-1 py-3 bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-extrabold text-[13px] rounded-full shadow-md hover:shadow-lg transition-all"
                    >
                      {editingSizeId ? 'Save Changes' : 'Add Size'}
                    </button>
                    {editingSizeId && (
                      <button onClick={resetSizeForm} className="px-5 py-3 bg-white border border-[#e5e5ea] hover:bg-[#f5f5f7] text-[#6e6e73] font-bold text-[13px] rounded-full">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
                <div className="divide-y divide-[#e5e5ea]">
                  {sizeOptions.map((sz) => (
                    <div key={sz.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="px-3 py-1 bg-[#fff2e8] text-[#ea580c] border border-orange-200 rounded-full text-[12px] font-black whitespace-nowrap">{sz.code}</span>
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-[#1d1d1f] truncate">{sz.name}</p>
                          <p className="text-[11px] text-[#86868b] font-semibold">{productsUsing('sizes', sz.code)} product(s)</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          onClick={() => { setEditingSizeId(sz.id); setNewSizeName(sz.name); setNewSizeCode(sz.code); }}
                          className="text-[12px] font-bold text-[#6e6e73] hover:text-[#1d1d1f]"
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
              <div className="bg-white border border-[#e5e5ea] rounded-[36px] p-7 shadow-sm space-y-5">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f]">Color Palette</h3>
                  <p className="text-[13px] text-[#86868b] font-semibold">Each color gets its own stock and photos on a product.</p>
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Color name (e.g. Ocean Blue)"
                    value={newColorName}
                    onChange={(e) => setNewColorName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveColor()}
                    className="w-full px-5 py-3 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[13px] font-semibold text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#ea580c]"
                  />
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      aria-label="Pick color"
                      value={newColorHex}
                      onChange={(e) => setNewColorHex(e.target.value)}
                      className="w-12 h-11 rounded-full border border-[#e5e5ea] bg-[#f5f5f7] cursor-pointer p-1"
                    />
                    <input
                      type="text"
                      placeholder="#2563EB"
                      value={newColorHex}
                      onChange={(e) => setNewColorHex(e.target.value)}
                      className="flex-1 px-5 py-3 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[13px] font-mono font-bold text-[#1d1d1f] uppercase focus:outline-none focus:bg-white focus:border-[#ea580c]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveColor}
                      className="flex-1 py-3 bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-extrabold text-[13px] rounded-full shadow-md hover:shadow-lg transition-all"
                    >
                      {editingColorId ? 'Save Changes' : 'Add Color'}
                    </button>
                    {editingColorId && (
                      <button onClick={resetColorForm} className="px-5 py-3 bg-white border border-[#e5e5ea] hover:bg-[#f5f5f7] text-[#6e6e73] font-bold text-[13px] rounded-full">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
                <div className="divide-y divide-[#e5e5ea]">
                  {colorOptions.map((col) => (
                    <div key={col.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-8 h-8 rounded-full border border-black/10 shadow-sm shrink-0" style={{ backgroundColor: col.hex }} />
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-[#1d1d1f] truncate">{col.name}</p>
                          <p className="text-[11px] text-[#86868b] font-semibold"><span className="font-mono uppercase">{col.hex}</span> • {productsUsing('colors', col.name)} product(s)</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          onClick={() => { setEditingColorId(col.id); setNewColorName(col.name); setNewColorHex(col.hex); }}
                          className="text-[12px] font-bold text-[#6e6e73] hover:text-[#1d1d1f]"
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
              <div className="bg-white border border-[#e5e5ea] rounded-[36px] p-7 shadow-sm space-y-5">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f]">Product Tags</h3>
                  <p className="text-[13px] text-[#86868b] font-semibold">Used for storefront filters and collections.</p>
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Tag name (e.g. Gaming)"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveTag()}
                    className="w-full px-5 py-3 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[13px] font-semibold text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#ea580c]"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveTag}
                      className="flex-1 py-3 bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-extrabold text-[13px] rounded-full shadow-md hover:shadow-lg transition-all"
                    >
                      {editingTagId ? 'Save Changes' : 'Add Tag'}
                    </button>
                    {editingTagId && (
                      <button
                        onClick={() => { setEditingTagId(null); setNewTagName(''); }}
                        className="px-5 py-3 bg-white border border-[#e5e5ea] hover:bg-[#f5f5f7] text-[#6e6e73] font-bold text-[13px] rounded-full"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tagOptions.map((tag) => (
                    <span key={tag.id} className="pl-4 pr-2 py-1.5 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[13px] font-bold text-[#1d1d1f] flex items-center gap-2">
                      <button
                        onClick={() => { setEditingTagId(tag.id); setNewTagName(tag.name); }}
                        title="Edit tag"
                        className="hover:text-[#ea580c]"
                      >
                        #{tag.name}
                      </button>
                      <span className="text-[11px] text-[#86868b]">{productsUsing('tags', tag.name)}</span>
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
              <div className="bg-white p-6 rounded-[28px] border border-[#e5e5ea] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f]">Store Categories</h3>
                  <p className="text-[13px] text-[#86868b] font-semibold">
                    {categories.filter((c) => c.status === 'Active').length} active categories shown on the storefront menu and home page
                  </p>
                </div>
                <button
                  onClick={() => openCategoryModal()}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white rounded-full text-[13px] font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <span>➕</span>
                  <span>Add New Category</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((cat) => {
                  const count = products.filter((p) => p.category === cat.name).length;
                  return (
                    <div key={cat.id} className={`bg-white border border-[#e5e5ea] rounded-[32px] shadow-sm hover:shadow-md transition-all overflow-hidden ${cat.status === 'Active' ? '' : 'opacity-70'}`}>
                      <div className="relative h-36 bg-[#f5f5f7]">
                        {cat.image ? (
                          <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[12px] font-bold text-[#86868b]">No photo yet</div>
                        )}
                        <span className="absolute -bottom-6 left-6 text-3xl w-14 h-14 bg-white border border-[#e5e5ea] rounded-2xl shadow-sm flex items-center justify-center">{cat.icon}</span>
                      </div>
                      <div className="p-6 pt-9 space-y-4">
                        <div>
                          <h4 className="font-bold text-[#1d1d1f] text-[16px]">{cat.name}</h4>
                          <p className="text-[12px] text-[#6e6e73] font-semibold mt-0.5">{cat.blurb || <span className="text-[#c7c7cc]">No description</span>}</p>
                          <p className="text-[12px] text-[#86868b] font-semibold mt-1">{count} products • /{cat.slug}</p>
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#e5e5ea]">
                          <button
                            onClick={() => setCategories(categories.map((c) => (c.id === cat.id ? { ...c, status: c.status === 'Active' ? 'Inactive' : 'Active' } : c)))}
                            className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${cat.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}
                          >
                            {cat.status}
                          </button>
                          <div className="flex items-center gap-4">
                            <button onClick={() => openCategoryModal(cat)} className="text-[12px] font-bold text-[#ea580c] hover:underline">
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
              <div className="bg-white border border-[#e5e5ea] rounded-[36px] p-8 shadow-sm max-w-3xl">
                <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f] mb-2">Create Sub Category</h3>
                <p className="text-[13px] text-[#86868b] font-semibold mb-6">Map sub-categories under parent category groups.</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Sub-Category Name"
                    value={newSubCatName}
                    onChange={(e) => setNewSubCatName(e.target.value)}
                    className="sm:col-span-1 px-6 py-3.5 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[14px] text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#ea580c] transition-all font-semibold"
                  />
                  <select
                    value={newSubCatParent}
                    onChange={(e) => setNewSubCatParent(e.target.value)}
                    className="sm:col-span-1 px-6 py-3.5 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[14px] text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#ea580c] transition-all font-bold cursor-pointer"
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
                    className="sm:col-span-1 px-6 py-3.5 bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-extrabold text-[13px] rounded-full shadow-md hover:shadow-lg transition-all"
                  >
                    Save Sub Category
                  </button>
                </div>
              </div>

              {/* Sub Categories Table */}
              <div className="bg-white border border-[#e5e5ea] rounded-[36px] p-6 shadow-sm overflow-hidden">
                <table className="w-full text-left text-[14px]">
                  <thead className="text-[#86868b] border-b border-[#e5e5ea]">
                    <tr>
                      <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Sub Category</th>
                      <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Parent Category</th>
                      <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Product Count</th>
                      <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Status</th>
                      <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e5ea]">
                    {subCategories.map((sc) => (
                      <tr key={sc.id} className="hover:bg-[#f5f5f7]/60 transition-colors">
                        <td className="py-4 px-4 font-bold text-[#1d1d1f]">{sc.name}</td>
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 bg-white border border-[#e5e5ea] rounded-full text-[12px] font-extrabold text-[#ea580c] shadow-sm">
                            {sc.parentCategory}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-semibold text-[#6e6e73]">{products.filter((p) => p.category === sc.parentCategory && p.subCategory === sc.name).length} items</td>
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
              <div className="bg-white border border-[#e5e5ea] rounded-[36px] p-8 shadow-sm max-w-4xl">
                <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f] mb-2">Create Sub Sub Category (Level 3)</h3>
                <p className="text-[13px] text-[#86868b] font-semibold mb-6">
                  Niche classification (e.g. Electronics → Audio & Sound → Over-Ear Headphones).
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <input
                    type="text"
                    placeholder="Sub Sub Category Name"
                    value={newSubSubCatName}
                    onChange={(e) => setNewSubSubCatName(e.target.value)}
                    className="sm:col-span-1 px-6 py-3.5 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[14px] text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#ea580c] transition-all font-semibold"
                  />
                  <select
                    value={newSubSubCatParent}
                    onChange={(e) => setNewSubSubCatParent(e.target.value)}
                    className="sm:col-span-1 px-5 py-3.5 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[13px] text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#ea580c] transition-all font-bold cursor-pointer"
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
                    className="sm:col-span-1 px-5 py-3.5 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[13px] text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#ea580c] transition-all font-bold cursor-pointer"
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
                    className="sm:col-span-1 px-6 py-3.5 bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-extrabold text-[13px] rounded-full shadow-md hover:shadow-lg transition-all"
                  >
                    Add Level 3
                  </button>
                </div>
              </div>

              {/* Sub Sub Categories Table */}
              <div className="bg-white border border-[#e5e5ea] rounded-[36px] p-6 shadow-sm overflow-hidden">
                <table className="w-full text-left text-[14px]">
                  <thead className="text-[#86868b] border-b border-[#e5e5ea]">
                    <tr>
                      <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Sub Sub Category</th>
                      <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Hierarchy Path</th>
                      <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Product Count</th>
                      <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Status</th>
                      <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e5ea]">
                    {subSubCategories.map((ssc) => (
                      <tr key={ssc.id} className="hover:bg-[#f5f5f7]/60 transition-colors">
                        <td className="py-4 px-4 font-bold text-[#1d1d1f]">{ssc.name}</td>
                        <td className="py-4 px-4 text-[13px]">
                          <span className="font-semibold text-[#6e6e73]">{ssc.parentCategory}</span>
                          <span className="text-[#86868b] mx-1.5">→</span>
                          <span className="font-bold text-[#ea580c]">{ssc.parentSubCategory}</span>
                        </td>
                        <td className="py-4 px-4 font-semibold text-[#6e6e73]">{products.filter((p) => p.subCategory === ssc.parentSubCategory && p.subSubCategory === ssc.name).length} items</td>
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
              <div className="flex justify-between items-center bg-white p-6 rounded-[28px] border border-[#e5e5ea] shadow-sm">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f]">Discount Coupons</h3>
                  <p className="text-[13px] text-[#86868b] font-semibold">Manage promo codes and checkout discounts</p>
                </div>
                <button
                  onClick={() => openCouponModal()}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white rounded-full text-[13px] font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <span>🎟️</span>
                  <span>Create Coupon</span>
                </button>
              </div>

              {/* Store Header Marquee Preview */}
              <div className="bg-white border border-[#e5e5ea] rounded-[28px] p-5 shadow-sm space-y-3">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#86868b] pl-1">Store Header Preview</p>
                <div className="bg-[#1d1d1f] text-white rounded-full px-6 py-2.5 text-[12px] font-bold text-center overflow-hidden whitespace-nowrap text-ellipsis">
                  {headerCoupons.length
                    ? headerCoupons.map((c) => `🎉 Use ${c.code} — ${c.discountType === 'Percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`} on orders above ₹${c.minPurchase.toLocaleString()}`).join('   •   ')
                    : 'No coupon is shown in the store header. Turn on "Show in header" on a coupon below.'}
                </div>
              </div>

              {/* Coupons Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {coupons.map((cp) => (
                  <div
                    key={cp.id}
                    className="bg-white border border-[#e5e5ea] rounded-[32px] p-7 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <button
                          onClick={() => copyText(cp.code, `Code ${cp.code}`)}
                          title="Copy coupon code"
                          className="px-3.5 py-1.5 bg-[#fff2e8] hover:bg-orange-100 text-[#ea580c] border border-orange-200 font-mono font-black rounded-xl text-[14px] flex items-center gap-2 transition-all"
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
                        <p className="text-3xl font-black text-[#1d1d1f]">
                          {cp.discountType === 'Percentage' ? `${cp.discountValue}% OFF` : `₹${cp.discountValue} FLAT`}
                        </p>
                        {cp.description && (
                          <p className="text-[13px] text-[#1d1d1f] font-semibold mt-1">{cp.description}</p>
                        )}
                        <p className="text-[13px] text-[#6e6e73] font-semibold mt-1">
                          Min. Purchase: <span className="font-bold text-[#1d1d1f]">₹{cp.minPurchase.toLocaleString()}</span>
                          {cp.maxDiscount !== undefined && (
                            <> • Max: <span className="font-bold text-[#1d1d1f]">₹{cp.maxDiscount.toLocaleString()}</span></>
                          )}
                        </p>
                      </div>

                      <div className="pt-2 text-[12px] text-[#86868b] font-semibold space-y-1">
                        <p>Valid: {cp.validFrom || 'now'} → {cp.validTill || 'no end date'}</p>
                        <p>Used: {cp.usageCount}{cp.usageLimit ? ` / ${cp.usageLimit}` : ''} times{cp.usageLimit ? '' : ' (no limit)'}</p>
                      </div>

                      <label className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full cursor-pointer">
                        <span className="text-[12px] font-bold text-[#1d1d1f]">Show in store header</span>
                        <input
                          type="checkbox"
                          checked={cp.showInHeader}
                          onChange={(e) => setCoupons(coupons.map((c) => (c.id === cp.id ? { ...c, showInHeader: e.target.checked } : c)))}
                          className="w-4 h-4 accent-[#ea580c]"
                        />
                      </label>
                    </div>

                    <div className="pt-6 border-t border-[#e5e5ea] mt-4 flex justify-between items-center">
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
                        className="text-[12px] font-bold text-[#6e6e73] hover:text-[#1d1d1f]"
                      >
                        {cp.status === 'Active' ? 'Pause' : 'Activate'}
                      </button>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => openCouponModal(cp)}
                          className="text-[12px] font-bold text-[#ea580c] hover:underline"
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
          {activeTab === 'orders' && (
            <div className="space-y-6">
              {/* Order Status Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Pending', count: orders.filter(o => o.orderStatus === 'Pending').length, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg> },
                  { label: 'Processing', count: orders.filter(o => o.orderStatus === 'Processing').length, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg> },
                  { label: 'Shipped', count: orders.filter(o => o.orderStatus === 'Shipped').length, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg> },
                  { label: 'Delivered', count: orders.filter(o => o.orderStatus === 'Delivered').length, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg> },
                ].map((status, i) => (
                  <button
                    key={i}
                    onClick={() => setOrderStatusFilter(orderStatusFilter === status.label ? 'All' : (status.label as OrderStatus))}
                    className={`${status.bg} border ${orderStatusFilter === status.label ? 'border-[#ea580c] ring-2 ring-[#ea580c]/20' : status.border} rounded-[24px] p-5 text-left transition-all hover:shadow-md`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`${status.color} opacity-70`}>{status.icon}</span>
                    </div>
                    <p className={`text-3xl font-black tracking-tight ${status.color}`}>{status.count}</p>
                    <p className="text-[12px] font-extrabold text-[#86868b] uppercase tracking-wider mt-1">{status.label}</p>
                  </button>
                ))}
              </div>

              <div className="bg-white p-6 rounded-[28px] border border-[#e5e5ea] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f]">Customer Orders</h3>
                  <p className="text-[13px] text-[#86868b] font-semibold">Track fulfillment and dispatch statuses</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[12px] font-extrabold">
                  <button
                    onClick={reconcilePayments}
                    title="Ask the payment gateway about online payments still marked Pending"
                    className="px-4 py-1.5 bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] rounded-full border border-[#e5e5ea] transition-all flex items-center gap-1.5"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
                    Check Payments
                  </button>
                  <span className="px-3 py-1.5 bg-[#fff2e8] text-[#ea580c] rounded-full border border-orange-200">
                    Total: {orders.length} Orders
                  </span>
                  <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                    Revenue: ₹{orders.filter((o) => o.orderStatus !== 'Cancelled').reduce((sum, o) => sum + o.total, 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Search & Status Filter */}
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search orders by order #, name, email or phone..."
                  className="flex-1 px-6 py-3.5 bg-white border border-[#e5e5ea] rounded-full text-[14px] text-[#1d1d1f] focus:outline-none focus:border-[#ea580c] transition-all font-semibold shadow-sm"
                />
                <div className="flex flex-wrap gap-2">
                  {(['All', ...ORDER_STATUSES] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setOrderStatusFilter(status)}
                      className={`px-4 py-2.5 rounded-full text-[12px] font-extrabold border transition-all ${orderStatusFilter === status
                        ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white border-transparent shadow-sm'
                        : 'bg-white text-[#6e6e73] border-[#e5e5ea] hover:bg-[#f5f5f7]'
                        }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orders Table */}
              <div className="bg-white border border-[#e5e5ea] rounded-[36px] p-6 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[14px]">
                    <thead className="text-[#86868b] border-b border-[#e5e5ea]">
                      <tr>
                        <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Order No.</th>
                        <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Customer</th>
                        <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Items</th>
                        <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Date</th>
                        <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Total</th>
                        <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Payment</th>
                        <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Fulfillment</th>
                        <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e5ea]">
                      {visibleOrders.length === 0 && (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-[13px] font-semibold text-[#86868b]">
                            No orders match your search or filter.
                          </td>
                        </tr>
                      )}
                      {visibleOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-[#f5f5f7]/60 transition-colors">
                          <td className="py-4 px-4">
                            <span className="font-mono font-bold text-[#ea580c] block">{ord.orderNumber}</span>
                            {ord.shipment && (
                              <span className="mt-1 inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] font-black uppercase" title={`${ord.shipment.courier} AWB ${ord.shipment.awb}`}>
                                🚚 {ord.shipment.status}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-bold text-[#1d1d1f] block">{ord.customerName}</span>
                            <span className="text-[12px] text-[#86868b] block">{ord.email}</span>
                            <span className="text-[12px] text-[#86868b]">{ord.phone}</span>
                          </td>
                          <td className="py-4 px-4 min-w-[220px]">
                            {(ord.items ?? []).map((item, idx) => (
                              <div key={idx} className="text-[12px] leading-snug mb-1 last:mb-0">
                                <span className="font-bold text-[#1d1d1f]">{item.name}</span>
                                <span className="text-[#86868b] font-semibold block">
                                  {[item.size !== STANDARD && item.size, item.color !== STANDARD && item.color].filter(Boolean).join(' / ') || 'One size'} × {item.qty}
                                </span>
                              </div>
                            ))}
                          </td>
                          <td className="py-4 px-4 text-[#6e6e73] font-semibold">{ord.date}</td>
                          <td className="py-4 px-4 font-black text-[#1d1d1f]">₹{ord.total.toLocaleString()}</td>
                          <td className="py-4 px-4">
                            <span className="font-semibold block text-[13px]">{ord.paymentMethod}</span>
                            <span
                              className={`text-[11px] font-black uppercase ${ord.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-600'
                                }`}
                            >
                              ● {ord.paymentStatus}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <select
                              value={ord.orderStatus}
                              onChange={(e) => changeOrderStatus(ord, e.target.value as OrderStatus)}
                              disabled={ord.orderStatus === 'Cancelled'}
                              title={ord.orderStatus === 'Cancelled' ? 'Cancelled orders are closed; their stock was returned' : undefined}
                              className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border cursor-pointer disabled:cursor-not-allowed ${orderStatusStyle(ord.orderStatus)}`}
                            >
                              {ORDER_STATUSES.map((status) => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setOrderDetailsId(ord.id)}
                                className="px-4 py-1.5 bg-[#1d1d1f] hover:bg-black text-white rounded-full text-[12px] font-extrabold transition-all whitespace-nowrap"
                              >
                                Details
                              </button>
                              <button
                                onClick={() => openInvoice(ord)}
                                className="px-4 py-1.5 bg-[#f5f5f7] hover:bg-[#fff2e8] text-[#ea580c] border border-[#e5e5ea] rounded-full text-[12px] font-extrabold transition-all"
                              >
                                Invoice
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 8b. CUSTOMERS TAB */}
          {/* ========================================================================= */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-[28px] border border-[#e5e5ea] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f]">Registered Customers</h3>
                  <p className="text-[13px] text-[#86868b] font-semibold">
                    {customers.length} customers • {customers.filter((c) => customerStats(c.email).orderCount > 0).length} have ordered
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={exportCustomersCsv}
                    className="px-5 py-2.5 bg-[#f5f5f7] hover:bg-[#e5e5ea] text-[#1d1d1f] border border-[#e5e5ea] rounded-full text-[13px] font-extrabold transition-all flex items-center gap-2"
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
                    className="px-6 py-2.5 bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white rounded-full text-[13px] font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
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
                  className="flex-1 px-6 py-3.5 bg-white border border-[#e5e5ea] rounded-full text-[14px] text-[#1d1d1f] focus:outline-none focus:border-[#ea580c] transition-all font-semibold shadow-sm"
                />
                <div className="flex bg-white border border-[#e5e5ea] rounded-full p-1 shadow-sm" role="group" aria-label="Filter customers">
                  {([['all', 'All'], ['ordered', 'Ordered'], ['new', 'New (0 orders)']] as const).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setCustomerFilter(key)}
                      aria-pressed={customerFilter === key}
                      className={`px-4 py-2 rounded-full text-[12px] font-extrabold transition-all whitespace-nowrap ${customerFilter === key ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white shadow-sm' : 'text-[#6e6e73] hover:text-[#1d1d1f]'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <select
                  value={customerSort}
                  onChange={(e) => setCustomerSort(e.target.value as typeof customerSort)}
                  aria-label="Sort customers"
                  className="px-6 py-3.5 bg-white border border-[#e5e5ea] rounded-full text-[14px] text-[#1d1d1f] focus:outline-none focus:border-[#ea580c] transition-all font-bold cursor-pointer shadow-sm"
                >
                  <option value="recent">Recently Registered</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="spent">Total Spent (High to Low)</option>
                  <option value="orders">Order Count (High to Low)</option>
                </select>
              </div>

              <div className="bg-white border border-[#e5e5ea] rounded-[36px] p-6 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[14px]">
                    <thead className="text-[#86868b] border-b border-[#e5e5ea]">
                      <tr>
                        <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Customer</th>
                        <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Phone</th>
                        <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Registered</th>
                        <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Orders</th>
                        <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider">Total Spent</th>
                        <th className="pb-4 pt-2 px-4 font-extrabold uppercase text-[11px] tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e5ea]">
                      {visibleCustomers.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-[13px] font-semibold text-[#86868b]">
                            No customers match your search.
                          </td>
                        </tr>
                      )}
                      {visibleCustomers.map((cus) => {
                        const stats = customerStats(cus.email);
                        return (
                          <tr key={cus.id} className="hover:bg-[#f5f5f7]/60 transition-colors">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <span className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#ea580c] to-[#f97316] text-white flex items-center justify-center font-black text-[13px] shrink-0">
                                  {cus.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                                </span>
                                <div>
                                  <span className="font-bold text-[#1d1d1f] block">{cus.name}</span>
                                  <span className="text-[12px] text-[#86868b] flex items-center gap-1.5">
                                    {cus.email}
                                    <button onClick={() => copyText(cus.email, 'Email')} title="Copy email address" className="text-[#c7c7cc] hover:text-[#ea580c]">⧉</button>
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-[13px] font-semibold text-[#6e6e73]">
                              {cus.phone ? (
                                <span className="flex items-center gap-2 whitespace-nowrap">
                                  {cus.phone}
                                  <button onClick={() => copyText(cus.phone, 'Phone number')} title="Copy phone number" className="text-[#c7c7cc] hover:text-[#ea580c]">⧉</button>
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
                                <span className="text-[#c7c7cc]">Not provided</span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-[13px] font-semibold text-[#6e6e73]">{cus.registeredDate}</td>
                            <td className="py-4 px-4 font-bold text-[#1d1d1f]">
                              {stats.orderCount || <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[10px] font-black uppercase">0 • New</span>}
                            </td>
                            <td className="py-4 px-4 font-black text-[#1d1d1f]">₹{stats.totalSpent.toLocaleString()}</td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setCustomerHistoryEmail(cus.email)}
                                  disabled={stats.orderCount === 0}
                                  title="See this customer's order history"
                                  className="px-4 py-1.5 bg-[#f5f5f7] hover:bg-[#fff2e8] text-[#ea580c] border border-[#e5e5ea] rounded-full text-[12px] font-extrabold transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Product Grid on Left */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white p-6 rounded-[32px] border border-[#e5e5ea] shadow-sm space-y-4">
                  <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f]">Catalog Selector</h3>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search product by title, SKU, or category..."
                      value={posSearchTerm}
                      onChange={(e) => setPosSearchTerm(e.target.value)}
                      className="w-full pl-5 pr-14 sm:pr-28 py-3.5 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[14px] text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#ea580c] font-semibold"
                    />
                    <button
                      onClick={() => setIsPosCameraOpen(true)}
                      aria-label="Scan a QR code with the camera"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 sm:px-4 py-2 bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white rounded-full text-[12px] font-extrabold shadow-sm flex items-center gap-1.5"
                    >
                      <span className="flex items-center justify-center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg></span>
                      <span className="hidden sm:inline">Scan</span>
                    </button>
                  </div>
                </div>

                {/* Items Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        className="bg-white border border-[#e5e5ea] rounded-[28px] p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div className="flex gap-4 items-start">
                          <img
                            src={prod.image}
                            alt={prod.name}
                            className="w-16 h-16 rounded-2xl object-cover border border-[#e5e5ea] bg-white flex-shrink-0"
                          />
                          <div>
                            <span className="text-[10px] font-black text-[#ea580c] uppercase tracking-wider block">
                              {prod.category}
                            </span>
                            <h4 className="font-bold text-[#1d1d1f] text-[14px] leading-snug line-clamp-2">
                              {prod.name}
                            </h4>
                            <span className="font-black text-[#1d1d1f] text-[16px] block mt-1">
                              ₹{prod.price.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="pt-4 mt-3 border-t border-[#e5e5ea] flex justify-between items-center">
                          <span className="text-[11px] text-[#86868b] font-semibold">Stock: {prod.stock}</span>
                          <button
                            onClick={() => addToPosCart(prod)}
                            disabled={prod.stock <= 0}
                            className={`px-4 py-2 rounded-full text-[12px] font-black transition-all ${prod.stock > 0
                              ? 'bg-[#f5f5f7] hover:bg-[#fff2e8] text-[#ea580c] hover:border-[#ea580c] border border-[#e5e5ea]'
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

              {/* Live Cart / Billing Slip on Right */}
              <div className="lg:col-span-5 bg-white border border-[#e5e5ea] rounded-[36px] p-7 shadow-sm flex flex-col justify-between sticky top-6">
                <div>
                  <div className="flex justify-between items-center pb-4 border-b border-[#e5e5ea]">
                    <div>
                      <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f]">Current Bill</h3>
                      <p className="text-[12px] text-[#86868b] font-semibold">Terminal #01 • Walk-in Sale</p>
                    </div>
                    {posCart.length > 0 && (
                      <button
                        onClick={() => setPosCart([])}
                        className="text-[12px] text-red-500 hover:text-red-700 font-bold"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {/* Customer Input */}
                  <div className="my-4">
                    <div className="flex justify-between items-center mb-1.5 pl-2 pr-1">
                      <label className="block text-[11px] font-extrabold uppercase tracking-widest text-[#86868b]">
                        Customer Name
                      </label>
                      <div className="flex gap-3">
                        <button className="text-[10px] font-bold text-[#ea580c] hover:underline" onClick={() => alert('Looking up customer...')}>Lookup</button>
                        <button className="text-[10px] font-bold text-[#ea580c] hover:underline" onClick={() => setIsNewCustomerModalOpen(true)}>New Reg</button>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={posCustomerName}
                      onChange={(e) => setPosCustomerName(e.target.value)}
                      placeholder="Walk-in Customer"
                      className="w-full px-4 py-2.5 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[13px] font-semibold text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#ea580c]"
                    />
                  </div>

                  {/* Cart Items List */}
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1 my-4">
                    {posCart.length === 0 ? (
                      <div className="py-12 text-center text-[#86868b] text-[13px] font-semibold">
                        Cart is currently empty. Click &quot;+ Add to Bill&quot; from catalog.
                      </div>
                    ) : (
                      posCart.map((item) => (
                        <div
                          key={item.product.id}
                          className="p-3.5 bg-[#f5f5f7] rounded-2xl flex justify-between items-center"
                        >
                          <div className="max-w-[170px]">
                            <span className="font-bold text-[#1d1d1f] text-[13px] block truncate">
                              {item.product.name}
                            </span>
                            <span className="text-[12px] text-[#ea580c] font-black mt-0.5">
                              ₹{item.product.price.toLocaleString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updatePosQty(item.product.id, -1)}
                              className="w-7 h-7 rounded-full bg-white border border-[#e5e5ea] font-black text-[13px] hover:bg-[#fff2e8] flex items-center justify-center"
                            >
                              -
                            </button>
                            <span className="font-black text-[14px] w-5 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updatePosQty(item.product.id, 1)}
                              className="w-7 h-7 rounded-full bg-white border border-[#e5e5ea] font-black text-[13px] hover:bg-[#fff2e8] flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Calculation Summary & Payment */}
                <div className="pt-4 border-t border-[#e5e5ea] space-y-4">
                  <div className="space-y-2 text-[13px] font-semibold text-[#6e6e73]">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-bold text-[#1d1d1f]">₹{posSubtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST / Tax (18%)</span>
                      <span className="font-bold text-[#1d1d1f]">₹{posTax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-[17px] font-black text-[#1d1d1f] pt-2 border-t border-[#e5e5ea]">
                      <span>Grand Total</span>
                      <div className="flex items-center text-[#ea580c]">
                        <span>₹</span>
                        <input
                          type="number"
                          value={posManualTotal !== '' ? posManualTotal : posCalculatedTotal}
                          onChange={(e) => setPosManualTotal(e.target.value)}
                          className="w-24 bg-transparent outline-none border-b-2 border-transparent focus:border-[#ea580c] ml-1 text-right py-0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="grid grid-cols-3 gap-2">
                    {(['Cash', 'Card', 'UPI'] as const).map((method) => (
                      <button
                        key={method}
                        onClick={() => setPosPaymentMethod(method)}
                        className={`py-2 rounded-xl text-[12px] font-black border transition-all ${posPaymentMethod === method
                          ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white border-transparent shadow-sm'
                          : 'bg-[#f5f5f7] text-[#6e6e73] border-[#e5e5ea] hover:bg-white'
                          }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleCompletePosOrder}
                    disabled={posCart.length === 0}
                    className={`w-full py-4 rounded-full font-black text-[14px] uppercase tracking-wider transition-all shadow-md ${posCart.length > 0
                      ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white hover:shadow-lg hover:-translate-y-0.5'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                  >
                    Complete Checkout (₹{posTotal.toLocaleString()})
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 10. POS HISTORY TAB */}
          {/* ========================================================================= */}
          {activeTab === 'pos-history' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-[28px] border border-[#e5e5ea] shadow-sm flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f]">POS In-Store Register History</h3>
                  <p className="text-[13px] text-[#86868b] font-semibold">Audit trail of completed counter sales</p>
                </div>
                <div className="flex items-center gap-3">
                  <button className="px-4 py-2 bg-[#f5f5f7] border border-[#e5e5ea] hover:bg-[#e5e5ea] text-[#1d1d1f] font-extrabold text-[12px] rounded-full flex items-center gap-1.5 transition-all shadow-sm">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                    Bulk Upload
                  </button>
                  <span className="px-4 py-1.5 bg-[#fff2e8] text-[#ea580c] font-black text-[13px] rounded-full border border-orange-200">
                    {posHistory.length} Receipts Logged
                  </span>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="bg-white border border-[#e5e5ea] rounded-[36px] p-6 shadow-sm overflow-hidden">
                <table className="w-full text-left text-[14px]">
                  <thead className="text-[#86868b] border-b border-[#e5e5ea]">
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
                  <tbody className="divide-y divide-[#e5e5ea]">
                    {posHistory.map((tx) => (
                      <tr key={tx.id} className="hover:bg-[#f5f5f7]/60 transition-colors">
                        <td className="py-4 px-4 font-mono font-bold text-[#ea580c]">{tx.receiptNo}</td>
                        <td className="py-4 px-4 text-[#6e6e73] font-semibold text-[13px]">{tx.date}</td>
                        <td className="py-4 px-4 font-bold text-[#1d1d1f]">{tx.customer}</td>
                        <td className="py-4 px-4 text-[13px] text-[#6e6e73] font-medium">{tx.cashier}</td>
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 bg-[#f5f5f7] border border-[#e5e5ea] text-[#1d1d1f] rounded-full text-[11px] font-black">
                            {tx.paymentMethod}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-black text-[#1d1d1f] text-[15px]">
                          ₹{tx.total.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setExchangeTx(tx);
                                setIsExchangeModalOpen(true);
                              }}
                              className="px-4 py-1.5 bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] border border-[#e5e5ea] rounded-full text-[12px] font-bold transition-all shadow-sm"
                            >
                              Exchange
                            </button>
                            <button
                              onClick={() => setPosReceiptModal(tx)}
                              className="px-4 py-1.5 bg-[#f5f5f7] hover:bg-[#fff2e8] text-[#ea580c] border border-[#e5e5ea] rounded-full text-[12px] font-extrabold transition-all"
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
          {/* 11. VIDEOS TAB (E-Commerce Product Reels & Video Marketing) */}
          {/* ========================================================================= */}
          {activeTab === 'videos' && (
            <div className="space-y-6">
              {/* Header Toolbar */}
              <div className="bg-white p-6 rounded-[28px] border border-[#e5e5ea] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f]">Product Video Marketing</h3>
                  <p className="text-[13px] text-[#86868b] font-semibold">Upload customer demo reels, unboxings & feature reviews</p>
                </div>
                <button
                  onClick={() => setIsUploadVideoModalOpen(true)}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white rounded-full text-[13px] font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <span>📹</span>
                  <span>Upload New Video</span>
                </button>
              </div>

              {/* Video Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((vid) => (
                  <div
                    key={vid.id}
                    className="bg-white border border-[#e5e5ea] rounded-[32px] overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
                  >
                    {/* Thumbnail & Video Preview simulation */}
                    <div className="relative h-48 bg-[#1d1d1f] overflow-hidden">
                      <img
                        src={vid.thumbnail}
                        alt={vid.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/90 text-[#ea580c] flex items-center justify-center font-black text-xl shadow-lg pl-1">
                          ▶
                        </div>
                      </div>
                      <span className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/70 text-white rounded-lg text-[11px] font-mono font-bold">
                        {vid.duration}
                      </span>
                    </div>

                    {/* Meta info */}
                    <div className="p-6 space-y-3">
                      <span className="px-3 py-1 bg-[#fff2e8] text-[#ea580c] rounded-full text-[11px] font-black uppercase tracking-wider border border-orange-200">
                        Linked: {vid.productName}
                      </span>
                      <h4 className="font-bold text-[#1d1d1f] text-[15px] leading-snug">{vid.title}</h4>
                      <div className="flex justify-between items-center text-[12px] text-[#86868b] font-semibold pt-2 border-t border-[#e5e5ea]">
                        <span>👀 {vid.views.toLocaleString()} views</span>
                        <span>{vid.dateAdded}</span>
                      </div>
                    </div>

                    <div className="px-6 pb-5 pt-1 flex justify-end gap-3">
                      <button
                        onClick={() => alert(`Previewing Video URL: ${vid.videoUrl}`)}
                        className="text-[12px] text-[#ea580c] font-black hover:underline"
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
                  { title: 'Total Revenue', value: `₹${products.reduce((sum, p) => sum + p.price * p.stock, 0).toLocaleString()}`, change: '+12.5%', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg> },
                  { title: 'Total Orders', value: orders.length.toString(), change: '+8.2%', color: 'text-blue-600', bg: 'bg-blue-50', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg> },
                  { title: 'Products Listed', value: products.length.toString(), change: '+3.1%', color: 'text-purple-600', bg: 'bg-purple-50', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg> },
                  { title: 'POS Transactions', value: posHistory.length.toString(), change: '+15.7%', color: 'text-orange-600', bg: 'bg-orange-50', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg> },
                ].map((card, i) => (
                  <div key={i} className="bg-white border border-[#e5e5ea] rounded-[28px] p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <span className={`w-11 h-11 rounded-2xl ${card.bg} flex items-center justify-center ${card.color}`}>{card.icon}</span>
                      <span className={`text-[12px] font-extrabold ${card.color} ${card.bg} px-2.5 py-1 rounded-full`}>{card.change}</span>
                    </div>
                    <p className="text-[11px] text-[#86868b] font-bold uppercase tracking-wider mb-1">{card.title}</p>
                    <p className="text-2xl font-black text-[#1d1d1f] tracking-tight">{card.value}</p>
                  </div>
                ))}
              </div>

              {/* Sales by Category */}
              <div className="bg-white border border-[#e5e5ea] rounded-[36px] p-8 shadow-sm">
                <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f] mb-6">Sales by Category</h3>
                <div className="space-y-4">
                  {categories.map((cat) => {
                    const catProducts = products.filter(p => p.category === cat.name);
                    const catRevenue = catProducts.reduce((sum, p) => sum + p.price * p.stock, 0);
                    const totalRevenue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
                    const percentage = totalRevenue > 0 ? Math.round((catRevenue / totalRevenue) * 100) : 0;
                    return (
                      <div key={cat.id} className="flex items-center gap-4">
                        <div className="w-32 text-[13px] font-bold text-[#1d1d1f] truncate">{cat.name}</div>
                        <div className="flex-1 bg-[#f5f5f7] rounded-full h-3 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#ea580c] to-[#f97316] rounded-full transition-all duration-700"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="w-16 text-right text-[13px] font-extrabold text-[#ea580c]">{percentage}%</div>
                        <div className="w-28 text-right text-[12px] font-bold text-[#86868b]">₹{catRevenue.toLocaleString()}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Inventory & Order Report Table */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Products */}
                <div className="bg-white border border-[#e5e5ea] rounded-[36px] p-6 shadow-sm">
                  <h3 className="text-lg font-bold tracking-tight text-[#1d1d1f] mb-4">Top Products by Stock Value</h3>
                  <div className="space-y-3">
                    {[...products]
                      .sort((a, b) => (b.price * b.stock) - (a.price * a.stock))
                      .slice(0, 5)
                      .map((p, i) => (
                        <div key={p.id} className="flex items-center gap-3 p-3 bg-[#f5f5f7] rounded-2xl">
                          <span className="w-7 h-7 rounded-full bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white flex items-center justify-center text-[11px] font-black">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-[#1d1d1f] truncate">{p.name}</p>
                            <p className="text-[11px] text-[#86868b] font-semibold">{p.stock} units × ₹{p.price.toLocaleString()}</p>
                          </div>
                          <span className="text-[13px] font-black text-[#ea580c]">₹{(p.price * p.stock).toLocaleString()}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Recent Orders Summary */}
                <div className="bg-white border border-[#e5e5ea] rounded-[36px] p-6 shadow-sm">
                  <h3 className="text-lg font-bold tracking-tight text-[#1d1d1f] mb-4">Recent Orders</h3>
                  <div className="space-y-3">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-[#f5f5f7] rounded-2xl">
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-[#1d1d1f]">{order.customerName}</p>
                          <p className="text-[11px] text-[#86868b] font-semibold">{order.date} • {order.paymentMethod}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${order.orderStatus === 'Delivered' ? 'bg-emerald-100 text-emerald-700'
                            : order.orderStatus === 'Shipped' ? 'bg-blue-100 text-blue-700'
                              : order.orderStatus === 'Processing' ? 'bg-amber-100 text-amber-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>{order.orderStatus}</span>
                          <span className="text-[13px] font-black text-[#1d1d1f]">₹{order.total.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Category Hierarchy Overview */}
              <div className="bg-white border border-[#e5e5ea] rounded-[36px] p-8 shadow-sm">
                <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f] mb-6">Category Hierarchy Map</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((cat) => (
                    <div key={cat.id} className="border border-[#e5e5ea] rounded-[24px] p-5 bg-[#fafafa]">
                      <p className="text-[14px] font-black text-[#1d1d1f] mb-3 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#ea580c] to-[#f97316]"></span>
                        {cat.name}
                      </p>
                      <div className="pl-4 space-y-2">
                        {subCategories.filter(sc => sc.parentCategory === cat.name).map((sc) => (
                          <div key={sc.id}>
                            <p className="text-[12px] font-bold text-[#6e6e73] flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#86868b]"></span>
                              {sc.name}
                            </p>
                            <div className="pl-4 mt-1 space-y-1">
                              {subSubCategories.filter(ssc => ssc.parentCategory === cat.name && ssc.parentSubCategory === sc.name).map((ssc) => (
                                <p key={ssc.id} className="text-[11px] font-semibold text-[#86868b] flex items-center gap-1.5">
                                  <span className="w-1 h-1 rounded-full bg-[#d2d2d7]"></span>
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
              <div className="bg-white p-6 rounded-[28px] border border-[#e5e5ea] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f]">Home Hero Banners</h3>
                  <p className="text-[13px] text-[#86868b] font-semibold">
                    {banners.filter((b) => b.isActive).length} of {banners.length} slides live on the storefront home page
                  </p>
                </div>
                <button
                  onClick={() => openBannerModal()}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white rounded-full text-[13px] font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <span>🖼️</span>
                  <span>Add New Banner</span>
                </button>
              </div>

              <div className="space-y-5">
                {banners.length === 0 && (
                  <div className="bg-white border border-dashed border-[#d2d2d7] rounded-[32px] p-12 text-center text-[13px] font-semibold text-[#86868b]">
                    No banners yet. Add one to show a slider on the storefront home page.
                  </div>
                )}
                {banners.map((bn, idx) => (
                  <div key={bn.id} className={`bg-white border border-[#e5e5ea] rounded-[32px] overflow-hidden shadow-sm ${bn.isActive ? '' : 'opacity-70'}`}>
                    {/* Slide preview */}
                    <div className="relative h-44 md:h-56 bg-[#1d1d1f]">
                      <img src={bn.imageUrl} alt={bn.title} className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-black/60" />
                      <div
                        className={`absolute inset-0 p-6 md:p-10 flex flex-col justify-center ${bn.textAlign === 'center' ? 'items-center text-center' : bn.textAlign === 'right' ? 'items-end text-right' : 'items-start text-left'}`}
                        style={{ color: bn.textColor }}
                      >
                        <h4 className="text-2xl md:text-4xl font-black tracking-tight">{bn.title}</h4>
                        {bn.subtitle && <p className="text-[13px] md:text-[15px] font-semibold mt-2 max-w-md opacity-90">{bn.subtitle}</p>}
                        {bn.ctaText && (
                          <span className="mt-4 px-5 py-2 bg-white text-[#1d1d1f] rounded-full text-[12px] font-extrabold shadow-md">{bn.ctaText} →</span>
                        )}
                      </div>
                      <span className="absolute top-4 left-4 px-3 py-1 bg-black/60 text-white rounded-full text-[11px] font-black">Slide {idx + 1}</span>
                      {bn.mobileImageUrl && (
                        <span className="absolute top-4 right-4 px-3 py-1 bg-black/60 text-white rounded-full text-[11px] font-black">📱 Mobile image set</span>
                      )}
                    </div>

                    <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="text-[12px] text-[#86868b] font-semibold">
                        Button links to <span className="font-mono font-bold text-[#1d1d1f]">{bn.ctaLink}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => moveBanner(idx, -1)}
                          disabled={idx === 0}
                          aria-label="Move banner up"
                          className="w-9 h-9 rounded-full bg-[#f5f5f7] border border-[#e5e5ea] hover:bg-[#e5e5ea] text-[13px] font-black disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveBanner(idx, 1)}
                          disabled={idx === banners.length - 1}
                          aria-label="Move banner down"
                          className="w-9 h-9 rounded-full bg-[#f5f5f7] border border-[#e5e5ea] hover:bg-[#e5e5ea] text-[13px] font-black disabled:opacity-30"
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
                          className="px-4 py-1.5 bg-[#f5f5f7] hover:bg-[#fff2e8] text-[#ea580c] border border-[#e5e5ea] rounded-full text-[12px] font-extrabold transition-all"
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
              <div className="bg-white p-6 rounded-[28px] border border-[#e5e5ea] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f]">Instagram Feed</h3>
                  <p className="text-[13px] text-[#86868b] font-semibold">Posts shown in the &quot;Follow us on Instagram&quot; section of the storefront</p>
                </div>
                <button
                  onClick={() => {
                    setNewIgUrl('');
                    setNewIgImage('');
                    setNewIgCaption('');
                    setIsInstagramModalOpen(true);
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white rounded-full text-[13px] font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <span>📸</span>
                  <span>Add Instagram Post</span>
                </button>
              </div>

              {instagramPosts.length === 0 ? (
                <div className="bg-white border border-dashed border-[#d2d2d7] rounded-[32px] p-12 text-center text-[13px] font-semibold text-[#86868b]">
                  No Instagram posts added yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {instagramPosts.map((post) => (
                    <div key={post.id} className="bg-white border border-[#e5e5ea] rounded-[32px] overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col">
                      <div className="aspect-square bg-[#f5f5f7] overflow-hidden">
                        <img src={post.imageUrl} alt={post.caption || 'Instagram post'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                        <p className="text-[13px] font-semibold text-[#1d1d1f] leading-snug line-clamp-3">{post.caption || <span className="text-[#86868b]">No caption</span>}</p>
                        <div className="flex justify-between items-center pt-3 border-t border-[#e5e5ea]">
                          <a href={post.postUrl} target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#ea580c] font-black hover:underline">
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

          {/* ========================================================================= */}
          {/* 15. ADMIN SECURITY TAB */}
          {/* ========================================================================= */}
          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Account Overview */}
              <div className="lg:col-span-2 bg-white border border-[#e5e5ea] rounded-[36px] p-8 shadow-sm space-y-5 h-fit">
                <div className="flex items-center gap-4">
                  <span className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#ea580c] to-[#f97316] text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                  </span>
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f]">Active Account</h3>
                    <p className="text-[12px] font-extrabold text-[#ea580c] uppercase tracking-wider">Super Admin</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="p-4 bg-[#f5f5f7] border border-[#e5e5ea] rounded-2xl">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#86868b]">Admin Email</p>
                    <p className="text-[14px] font-bold text-[#1d1d1f] break-all">{adminEmail}</p>
                  </div>
                  <div className="p-4 bg-[#f5f5f7] border border-[#e5e5ea] rounded-2xl flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#86868b]">Password</p>
                      <p className="text-[14px] font-bold text-[#1d1d1f] tracking-widest">{visiblePasswords.includes('active') ? adminPassword : '•'.repeat(adminPassword.length)}</p>
                    </div>
                    <button
                      onClick={() => setVisiblePasswords(toggleInList(visiblePasswords, 'active'))}
                      aria-label={visiblePasswords.includes('active') ? 'Hide password' : 'Show password'}
                      className="w-9 h-9 rounded-full bg-white border border-[#e5e5ea] hover:border-[#ea580c] text-[15px]"
                    >
                      {visiblePasswords.includes('active') ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-[#f5f5f7] border border-[#e5e5ea] rounded-2xl">
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#86868b]">Role</p>
                      <p className="text-[14px] font-bold text-[#1d1d1f]">Super Admin / Seller</p>
                    </div>
                    <div className="p-4 bg-[#f5f5f7] border border-[#e5e5ea] rounded-2xl">
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#86868b]">Session Length</p>
                      <p className="text-[14px] font-bold text-[#1d1d1f]">8 Hours</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setLoginEmail('');
                    setLoginPassword('');
                    setIsLoggedIn(false);
                  }}
                  className="w-full py-3 bg-white hover:bg-[#fff2e8] text-[#ea580c] font-bold rounded-full text-[13px] transition-all border border-[#e5e5ea] hover:border-[#ea580c]"
                >
                  Sign Out & Test Login
                </button>
                <div className="pt-5 border-t border-[#e5e5ea] space-y-2">
                  <p className="text-[12px] font-extrabold uppercase tracking-wider text-[#86868b]">Demo Data</p>
                  <p className="text-[12px] text-[#6e6e73] font-semibold">Products, orders, coupons and the rest are saved in this browser and shared with the website. Resetting puts back the original sample data everywhere.</p>
                  <button
                    onClick={() => {
                      if (!confirm('Reset all products, orders, customers, coupons, banners and settings to the original sample data?')) return;
                      resetDemoData();
                      notify('Demo data reset to the original samples');
                    }}
                    className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-full text-[13px] transition-all border border-red-200"
                  >
                    Reset All Demo Data
                  </button>
                </div>
              </div>

              {/* Update Credentials */}
              <div className="lg:col-span-3 bg-white border border-[#e5e5ea] rounded-[36px] p-8 shadow-sm space-y-5">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f]">Update Credentials</h3>
                  <p className="text-[13px] text-[#86868b] font-semibold">Change the admin email, password, or both. Leave a field empty to keep it.</p>
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
                        <label className="block text-[12px] font-extrabold uppercase tracking-widest text-[#86868b] mb-2 pl-2">{field.label}</label>
                        <div className="relative">
                          <input
                            type={field.type === 'password' && shown ? 'text' : field.type}
                            value={field.value}
                            onChange={(e) => { field.set(e.target.value); setSecMessage(null); }}
                            placeholder={field.placeholder}
                            className="w-full pl-6 pr-14 py-3.5 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[14px] text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#ea580c] transition-all font-semibold placeholder:text-[#c7c7cc]"
                          />
                          {field.type === 'password' && (
                            <button
                              type="button"
                              onClick={() => setVisiblePasswords(toggleInList(visiblePasswords, field.label))}
                              aria-label={shown ? 'Hide password' : 'Show password'}
                              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full hover:bg-white text-[15px]"
                            >
                              {shown ? '🙈' : '👁️'}
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
                  className="w-full py-3.5 bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-extrabold text-[14px] rounded-full shadow-md hover:shadow-lg transition-all"
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
          <div className="bg-white border border-[#e5e5ea] rounded-[36px] p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-[#1d1d1f]">Barcode & Product Scanner</h3>
                <p className="text-[12px] text-[#86868b] font-semibold">Camera Viewfinder Active</p>
              </div>
              <button
                onClick={() => setIsScannerModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#f5f5f7] hover:bg-[#e5e5ea] flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Simulated Viewfinder */}
            <div className="h-56 bg-neutral-900 rounded-[28px] relative overflow-hidden flex flex-col items-center justify-center text-white border-2 border-dashed border-[#ea580c]/50 p-6">
              {isScanning ? (
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-10 h-10 border-4 border-[#ea580c] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[13px] font-bold text-orange-400">Scanning Barcode...</span>
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
              <div className="p-4 bg-[#f5f5f7] rounded-2xl flex items-center justify-between border border-[#e5e5ea]">
                <div>
                  <span className="text-[11px] text-[#86868b] font-extrabold uppercase">Current Stock</span>
                  <p className="text-lg font-black text-[#1d1d1f]">{scannedProduct.stock} Units</p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-[#86868b] font-extrabold uppercase">Unit Price</span>
                  <p className="text-lg font-black text-[#ea580c]">₹{scannedProduct.price.toLocaleString()}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsScanning(true);
                  setTimeout(() => setIsScanning(false), 1200);
                }}
                className="flex-1 py-3.5 bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-extrabold text-[13px] rounded-full shadow-md"
              >
                Scan Another Item
              </button>
              <button
                onClick={() => setIsScannerModalOpen(false)}
                className="px-6 py-3.5 bg-white border border-[#e5e5ea] hover:bg-[#f5f5f7] text-[#1d1d1f] font-extrabold text-[13px] rounded-full"
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
          <div className="bg-white border border-[#e5e5ea] rounded-[36px] p-8 max-w-2xl w-full shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-[#1d1d1f]">Bulk Add Multiple Products</h3>
                <p className="text-[12px] text-[#86868b] font-semibold">
                  Paste comma-separated rows: Name, SKU, Category, Price, Stock
                </p>
              </div>
              <button
                onClick={() => setIsMultiProductModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#f5f5f7] hover:bg-[#e5e5ea] flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <textarea
              rows={6}
              value={multiProductInput}
              onChange={(e) => setMultiProductInput(e.target.value)}
              placeholder={`Example:\nWireless Mouse Pro, WMS-01, Computing, 1999, 40\nSmart Fitness Band, FTB-99, Wearables, 2499, 20\nUSB-C Fast Charger 65W, CHG-65, Electronics, 1499, 100`}
              className="w-full p-5 bg-[#f5f5f7] border border-[#e5e5ea] rounded-[24px] font-mono text-[13px] text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#ea580c] resize-none"
            ></textarea>

            <div className="flex gap-4">
              <button
                onClick={handleBulkAddSubmit}
                className="flex-1 py-3.5 bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-extrabold text-[13px] rounded-full shadow-md hover:shadow-lg"
              >
                Import & Add to Catalog
              </button>
              <button
                onClick={() => setIsMultiProductModalOpen(false)}
                className="px-6 py-3.5 bg-white border border-[#e5e5ea] hover:bg-[#f5f5f7] text-[#6e6e73] font-bold text-[13px] rounded-full"
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
          <div className="bg-white border border-[#e5e5ea] rounded-[36px] p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-3.5">
                <img src={stockEditProduct.image} alt={stockEditProduct.name} className="w-12 h-12 rounded-2xl object-cover border border-[#e5e5ea] bg-white" />
                <div>
                  <h3 className="text-xl font-bold text-[#1d1d1f]">Stock by Size & Color</h3>
                  <p className="text-[12px] text-[#86868b] font-semibold">{stockEditProduct.name} • {stockEditProduct.sku}</p>
                </div>
              </div>
              <button
                onClick={() => setStockEditProduct(null)}
                className="w-8 h-8 shrink-0 rounded-full bg-[#f5f5f7] hover:bg-[#e5e5ea] flex items-center justify-center text-sm font-bold"
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

            <p className="text-[12px] text-[#86868b] font-semibold">
              To add or remove sizes and colors, use{' '}
              <button
                onClick={() => { const prod = stockEditProduct; setStockEditProduct(null); openEditProduct(prod); }}
                className="text-[#ea580c] font-bold hover:underline"
              >
                Edit Product
              </button>.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleSaveStock}
                className="flex-1 py-3.5 bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-extrabold text-[13px] rounded-full shadow-md"
              >
                Save Stock
              </button>
              <button
                onClick={() => setStockEditProduct(null)}
                className="px-6 py-3.5 bg-white border border-[#e5e5ea] hover:bg-[#f5f5f7] text-[#6e6e73] font-bold text-[13px] rounded-full"
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
          <div className="bg-white border border-[#e5e5ea] rounded-[36px] p-8 max-w-lg w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-[#1d1d1f]">{editingCouponId ? 'Edit Coupon' : 'Generate New Coupon'}</h3>
              <button
                onClick={() => setIsCouponModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#f5f5f7] hover:bg-[#e5e5ea] flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#86868b] mb-1 pl-2">
                  Coupon Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. FLASH30"
                  value={newCouponCode}
                  onChange={(e) => { setNewCouponCode(e.target.value.toUpperCase().replace(/\s/g, '')); setCouponFormError(''); }}
                  className="w-full px-5 py-3 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[13px] font-mono font-bold text-[#1d1d1f]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#86868b] mb-1 pl-2">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Diwali Sale — 30% off on audio"
                  value={newCouponDescription}
                  onChange={(e) => setNewCouponDescription(e.target.value)}
                  className="w-full px-5 py-3 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[13px] font-semibold text-[#1d1d1f]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-[#86868b] mb-1 pl-2">Type</label>
                  <select
                    value={newCouponType}
                    onChange={(e) => setNewCouponType(e.target.value as Coupon['discountType'])}
                    className="w-full px-4 py-3 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[13px] font-bold"
                  >
                    <option value="Percentage">Percentage (%)</option>
                    <option value="Fixed">Fixed (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-[#86868b] mb-1 pl-2">Value</label>
                  <input
                    type="number"
                    min="0"
                    placeholder={newCouponType === 'Percentage' ? 'e.g. 20' : 'e.g. 500'}
                    value={newCouponValue}
                    onChange={(e) => setNewCouponValue(e.target.value)}
                    className="w-full px-5 py-3 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[13px] font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-[#86868b] mb-1 pl-2">
                    Min Purchase (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newCouponMin}
                    onChange={(e) => setNewCouponMin(e.target.value)}
                    className="w-full px-5 py-3 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[13px] font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-[#86868b] mb-1 pl-2">
                    Max Discount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder={newCouponType === 'Percentage' ? 'Optional cap' : 'Only for %'}
                    disabled={newCouponType !== 'Percentage'}
                    value={newCouponType === 'Percentage' ? newCouponMaxDiscount : ''}
                    onChange={(e) => setNewCouponMaxDiscount(e.target.value)}
                    className="w-full px-5 py-3 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[13px] font-bold disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-[#86868b] mb-1 pl-2">Valid From</label>
                  <input
                    type="date"
                    value={newCouponFrom}
                    onChange={(e) => setNewCouponFrom(e.target.value)}
                    className="w-full px-5 py-3 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[13px] font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-[#86868b] mb-1 pl-2 flex justify-between">
                    <span>Valid Until</span>
                    {newCouponDate && <button type="button" onClick={() => setNewCouponDate('')} className="text-[#ea580c] normal-case">Clear</button>}
                  </label>
                  <input
                    type="date"
                    value={newCouponDate}
                    onChange={(e) => setNewCouponDate(e.target.value)}
                    className="w-full px-5 py-3 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[13px] font-bold"
                  />
                  <p className="text-[11px] text-[#86868b] font-semibold mt-1 pl-2">Blank = never expires</p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#86868b] mb-1 pl-2">
                  Usage Limit
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Blank = unlimited"
                  value={newCouponUsageLimit}
                  onChange={(e) => setNewCouponUsageLimit(e.target.value)}
                  className="w-full px-5 py-3 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[13px] font-bold"
                />
              </div>

              <label className="flex items-center justify-between gap-3 px-5 py-3 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full cursor-pointer">
                <span className="text-[13px] font-bold text-[#1d1d1f]">Active (customers can use it)</span>
                <input
                  type="checkbox"
                  checked={newCouponActive}
                  onChange={(e) => setNewCouponActive(e.target.checked)}
                  className="w-4 h-4 accent-[#ea580c]"
                />
              </label>

              <label className="flex items-center justify-between gap-3 px-5 py-3 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full cursor-pointer">
                <span className="text-[13px] font-bold text-[#1d1d1f]">Show in store header marquee</span>
                <input
                  type="checkbox"
                  checked={newCouponShowInHeader}
                  onChange={(e) => setNewCouponShowInHeader(e.target.checked)}
                  className="w-4 h-4 accent-[#ea580c]"
                />
              </label>
            </div>

            {/* Validation Checklist */}
            <div className="p-4 bg-[#fafafa] border border-[#e5e5ea] rounded-[20px]">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#86868b] mb-2">Validation Checklist</p>
              <ul className="space-y-1 text-[12px] font-semibold">
                {[
                  [/^[A-Z0-9_-]{3,20}$/.test(newCouponCode), 'Code is 3–20 characters: capital letters, numbers, - and _ only'],
                  [!coupons.some((c) => c.id !== editingCouponId && c.code === newCouponCode), 'Code is not used by another coupon'],
                  [parseFloat(newCouponValue) > 0 && (newCouponType === 'Fixed' || parseFloat(newCouponValue) <= 100), newCouponType === 'Percentage' ? 'Discount is between 1% and 100%' : 'Discount amount is above ₹0'],
                  [!newCouponDate || !newCouponFrom || newCouponFrom <= newCouponDate, 'Start date is on or before the end date'],
                ].map(([ok, text]) => (
                  <li key={String(text)} className={ok ? 'text-emerald-700' : 'text-[#86868b]'}>
                    {ok ? '✓' : '○'} {text}
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-[#86868b] font-semibold mt-2">The discount applies automatically at checkout once a shopper enters the code.</p>
            </div>

            {couponFormError && (
              <p role="alert" className="text-red-500 text-[13px] font-bold bg-red-50 px-4 py-2.5 rounded-xl">{couponFormError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSaveCoupon}
                className="flex-1 py-3.5 bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-extrabold text-[13px] rounded-full shadow-md"
              >
                {editingCouponId ? 'Save Changes' : 'Create Coupon'}
              </button>
              <button
                onClick={() => setIsCouponModalOpen(false)}
                className="px-6 py-3.5 bg-white border border-[#e5e5ea] hover:bg-[#f5f5f7] text-[#6e6e73] font-bold text-[13px] rounded-full"
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
          <div className="bg-white border border-[#e5e5ea] rounded-[36px] p-8 max-w-sm w-full shadow-2xl space-y-6 text-center font-mono">
            <div className="space-y-1">
              <span className="text-2xl">🛍️</span>
              <h3 className="text-lg font-black text-[#1d1d1f]">COMMERCE HUB</h3>
              <p className="text-[11px] text-[#86868b]">Receipt: {posReceiptModal.receiptNo}</p>
              <p className="text-[10px] text-[#86868b]">{posReceiptModal.date}</p>
            </div>

            <div className="border-t border-b border-dashed border-[#e5e5ea] py-4 text-left text-[12px] space-y-2">
              <p>Customer: {posReceiptModal.customer}</p>
              <p>Cashier: {posReceiptModal.cashier}</p>
              <p>Method: {posReceiptModal.paymentMethod}</p>

              <div className="pt-2 border-t border-dashed border-[#e5e5ea] space-y-1">
                {posReceiptModal.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>
                      <span className="block font-bold">{it.name}</span>
                      <span className="block text-[10px] text-[#86868b] font-medium tracking-wide">Qty: {it.qty}</span>
                    </span>
                    <span className="font-bold">₹{(it.price * it.qty).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center text-lg font-black text-[#1d1d1f]">
              <span>TOTAL PAID</span>
              <span className="text-[#ea580c]">₹{posReceiptModal.total.toLocaleString()}</span>
            </div>

            <button
              onClick={() => setPosReceiptModal(null)}
              className="w-full py-3 bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white rounded-full font-bold text-[13px] shadow-md"
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
          <div className="bg-white border border-[#e5e5ea] rounded-[36px] p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-[#1d1d1f]">Process Exchange</h3>
                <p className="text-[12px] text-[#86868b] mt-1 font-mono font-semibold">{exchangeTx.receiptNo}</p>
              </div>
              <button onClick={() => setIsExchangeModalOpen(false)} className="w-8 h-8 rounded-full bg-[#f5f5f7] hover:bg-[#e5e5ea] flex items-center justify-center text-sm font-bold">✕</button>
            </div>

            <div className="space-y-3">
              <p className="text-[13px] font-bold text-[#1d1d1f]">Select items to exchange or return:</p>
              {exchangeTx.items.map((it, idx) => (
                <label key={idx} className="flex items-center gap-3 p-3.5 bg-[#f5f5f7] border border-[#e5e5ea] rounded-2xl cursor-pointer hover:border-[#ea580c]/50 transition-colors">
                  <input type="checkbox" className="w-4 h-4 text-[#ea580c] rounded border-[#e5e5ea] focus:ring-[#ea580c]" />
                  <div className="flex-1">
                    <span className="text-[13px] font-bold text-[#1d1d1f] block">{it.name}</span>
                    <span className="text-[11px] text-[#86868b] font-semibold">Qty: {it.qty}</span>
                  </div>
                  <span className="text-[13px] font-black text-[#ea580c]">₹{(it.price * it.qty).toLocaleString()}</span>
                </label>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  alert(`Successfully processed exchange for ${exchangeTx.customer}'s order!`);
                  setIsExchangeModalOpen(false);
                }}
                className="w-full py-4 bg-[#1d1d1f] hover:bg-black text-white font-extrabold text-[14px] rounded-full shadow-md transition-all active:scale-95 flex justify-center items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                Confirm Exchange
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
          <div className="bg-white border border-[#e5e5ea] rounded-[36px] p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-[#1d1d1f]">Upload Product Video</h3>
              <button
                onClick={() => setIsUploadVideoModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#f5f5f7] hover:bg-[#e5e5ea] flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#86868b] mb-1 pl-2">
                  Video Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Unboxing & Review"
                  value={newVidTitle}
                  onChange={(e) => setNewVidTitle(e.target.value)}
                  className="w-full px-5 py-3 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[13px] font-semibold text-[#1d1d1f]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#86868b] mb-1 pl-2">
                  Linked Product
                </label>
                <select
                  value={newVidProduct}
                  onChange={(e) => setNewVidProduct(e.target.value)}
                  className="w-full px-5 py-3 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[13px] font-bold"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#86868b] mb-1 pl-2">
                  Duration (MM:SS)
                </label>
                <input
                  type="text"
                  value={newVidDuration}
                  onChange={(e) => setNewVidDuration(e.target.value)}
                  className="w-full px-5 py-3 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[13px] font-mono font-bold"
                />
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
                      videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
                      dateAdded: 'Today',
                    },
                    ...videos,
                  ]);
                  setIsUploadVideoModalOpen(false);
                  setNewVidTitle('');
                }}
                className="flex-1 py-3.5 bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-extrabold text-[13px] rounded-full shadow-md"
              >
                Publish Video
              </button>
              <button
                onClick={() => setIsUploadVideoModalOpen(false)}
                className="px-6 py-3.5 bg-white border border-[#e5e5ea] hover:bg-[#f5f5f7] text-[#6e6e73] font-bold text-[13px] rounded-full"
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
              <div className="flex flex-wrap justify-between items-center gap-3 p-4 bg-[#f5f5f7] border-b border-[#e5e5ea]">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-[#1d1d1f]">Invoice {inv.orderNumber}</h3>
                  <div className="flex bg-white border border-[#e5e5ea] rounded-full p-0.5" role="group" aria-label="Paper size">
                    {(['A4', '4x6'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => setInvoicePaper(size)}
                        aria-pressed={invoicePaper === size}
                        className={`px-3.5 py-1 rounded-full text-[12px] font-extrabold transition-all ${invoicePaper === size ? 'bg-[#1d1d1f] text-white' : 'text-[#6e6e73]'}`}
                      >
                        {size === 'A4' ? 'A4 Invoice' : '4×6 Label'}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrderForView(null)}
                  className="w-8 h-8 rounded-full bg-white hover:bg-[#e5e5ea] flex items-center justify-center text-sm font-bold shadow-sm"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto bg-[#e5e5ea]/50 p-4 sm:p-8">
                <div
                  id="invoice-print"
                  className={`bg-white mx-auto shadow-sm text-[#1d1d1f] ${compact ? 'max-w-[384px] p-5 text-[11px]' : 'max-w-3xl p-8 sm:p-12 text-[13px]'}`}
                >
                  {/* Header */}
                  <div className={`flex justify-between items-start gap-4 ${compact ? 'mb-4 pb-3 border-b-2 border-[#1d1d1f]' : 'mb-10'}`}>
                    <div>
                      <h1 className={`${compact ? 'text-[20px]' : 'text-[40px]'} font-black tracking-tighter leading-none`}>{compact ? 'SHIP TO' : 'TAX INVOICE'}</h1>
                      <p className="font-bold mt-1.5">#{inv.orderNumber}</p>
                      <p className="text-[#6e6e73]">{inv.date}</p>
                    </div>
                    <div className="text-right">
                      <h2 className={`${compact ? 'text-[13px]' : 'text-[19px]'} font-black`}>{STORE_INFO.name}</h2>
                      {!compact && <p className="text-[#6e6e73] max-w-[240px] ml-auto leading-snug mt-1">{STORE_INFO.address}</p>}
                      <p className="text-[#6e6e73] mt-0.5">GSTIN {STORE_INFO.gstin}</p>
                    </div>
                  </div>

                  {/* Addresses */}
                  <div className={`grid ${compact ? 'grid-cols-1 gap-3 mb-4' : 'grid-cols-3 gap-6 mb-10 pt-6 border-t border-[#e5e5ea]'}`}>
                    {!compact && (
                      <div>
                        <h4 className="text-[10px] font-extrabold uppercase text-[#86868b] tracking-wider mb-1.5">Billed To</h4>
                        <p className="font-black">{inv.customerName}</p>
                        <p>{inv.email}</p>
                        <p>{inv.phone}</p>
                      </div>
                    )}
                    <div>
                      <h4 className="text-[10px] font-extrabold uppercase text-[#86868b] tracking-wider mb-1.5">{compact ? 'Deliver To' : 'Shipped To'}</h4>
                      <p className={`font-black ${compact ? 'text-[15px]' : ''}`}>{inv.customerName}</p>
                      <p className="leading-snug">{inv.shippingAddress}</p>
                      <p>{inv.city}{inv.state ? `, ${inv.state}` : ''} - <span className="font-bold">{inv.postalCode}</span></p>
                      <p className="font-semibold">Phone: {inv.phone}</p>
                    </div>
                    <div className={compact ? 'flex justify-between border-y border-dashed border-[#c7c7cc] py-2' : 'text-right'}>
                      <div>
                        <h4 className="text-[10px] font-extrabold uppercase text-[#86868b] tracking-wider mb-1.5">Payment</h4>
                        <p className="font-bold">{inv.paymentMethod}</p>
                        <p className={inv.paymentStatus === 'Paid' ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                          {inv.paymentMethod === 'Cash on Delivery' && inv.paymentStatus !== 'Paid' ? `COLLECT ₹${inv.total.toLocaleString('en-IN')}` : inv.paymentStatus.toUpperCase()}
                        </p>
                        {inv.paymentId && <p className="font-mono text-[#6e6e73]">{inv.paymentId}</p>}
                      </div>
                      {inv.shipment && (
                        <div className={compact ? 'text-right' : 'mt-3'}>
                          <h4 className="text-[10px] font-extrabold uppercase text-[#86868b] tracking-wider mb-1">{inv.shipment.courier}</h4>
                          <p className="font-mono font-bold">AWB {inv.shipment.awb}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Items */}
                  <table className={`w-full ${compact ? 'mb-3' : 'mb-8'}`}>
                    <thead>
                      <tr className="border-b-2 border-[#1d1d1f] text-[10px] font-extrabold uppercase tracking-wider">
                        <th className="text-left py-2 pr-2">S.No</th>
                        <th className="text-left py-2">Item</th>
                        <th className="text-center py-2">Qty</th>
                        {!compact && <th className="text-right py-2">Rate</th>}
                        <th className="text-right py-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inv.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-[#f0f0f2] align-top">
                          <td className="py-3 pr-2 font-bold">{idx + 1}</td>
                          <td className="py-3">
                            <div className="flex items-start gap-3">
                              {!compact && <img src={item.image || productImageFor(item.sku, item.color)} alt="" className="w-11 h-11 rounded-lg object-cover border border-[#e5e5ea]" />}
                              <div>
                                <p className="font-bold leading-snug">{item.name}</p>
                                <p className="text-[#6e6e73]">SKU {item.sku} • {variantLabel(item.size, item.color)}</p>
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
                        <div className="flex justify-between text-[#6e6e73] italic">
                          <span>Includes GST (18%)</span>
                          <span>₹{(inv.total - taxable).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center border-t-2 border-[#1d1d1f] pt-2 mt-2">
                        <span className={`${compact ? 'text-[14px]' : 'text-[20px]'} font-black`}>Total</span>
                        <span className={`${compact ? 'text-[14px]' : 'text-[20px]'} font-black`}>₹{inv.total.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  {compact ? (
                    <p className="text-center text-[10px] text-[#6e6e73] border-t border-dashed border-[#c7c7cc] pt-2">
                      From: {STORE_INFO.name}, {STORE_INFO.address} • {STORE_INFO.phone}
                    </p>
                  ) : (
                    <div className="pt-6 border-t border-[#e5e5ea] grid grid-cols-2 gap-6 text-[11px] text-[#6e6e73] leading-relaxed">
                      <div>
                        <p className="font-extrabold uppercase tracking-wider text-[#1d1d1f] mb-1">Returns & Warranty</p>
                        <p>{STORE_INFO.returnPolicy}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold uppercase tracking-wider text-[#1d1d1f] mb-1">Questions?</p>
                        <p>{STORE_INFO.email}</p>
                        <p>{STORE_INFO.phone}</p>
                        <p className="mt-3 font-bold text-[#1d1d1f]">For {STORE_INFO.name}</p>
                        <p>Computer-generated invoice — no signature required.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-[#f5f5f7] border-t border-[#e5e5ea] flex flex-wrap justify-end gap-3">
                <button
                  className="px-5 py-2.5 bg-white border border-[#e5e5ea] hover:bg-[#e5e5ea] text-[#1d1d1f] font-bold text-[13px] rounded-full transition-colors"
                  onClick={() => emailCustomer(inv, 'Invoice')}
                >
                  ✉️ Email to Customer
                </button>
                <button className="px-5 py-2.5 bg-white border border-[#e5e5ea] hover:bg-[#e5e5ea] text-[#1d1d1f] font-bold text-[13px] rounded-full transition-colors" onClick={() => setSelectedOrderForView(null)}>
                  Close
                </button>
                <button className="px-6 py-2.5 bg-[#ea580c] hover:bg-[#f97316] text-white font-bold text-[13px] rounded-full transition-colors shadow-sm" onClick={() => window.print()}>
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
        const box = 'p-5 bg-[#f5f5f7] border border-[#e5e5ea] rounded-[24px]';
        const heading = 'text-[11px] font-extrabold uppercase tracking-wider text-[#86868b] mb-2';
        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-[#e5e5ea] rounded-[36px] p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-2xl font-black tracking-tight text-[#1d1d1f] font-mono">{ord.orderNumber}</h3>
                    <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${orderStatusStyle(ord.orderStatus)}`}>{ord.orderStatus}</span>
                    <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#f5f5f7] text-[#6e6e73] border border-[#e5e5ea]">{ord.source}</span>
                  </div>
                  <p className="text-[13px] text-[#86868b] font-semibold mt-1">Placed {new Date(ord.placedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
                <button onClick={() => setOrderDetailsId(null)} className="w-8 h-8 shrink-0 rounded-full bg-[#f5f5f7] hover:bg-[#e5e5ea] flex items-center justify-center text-sm font-bold">✕</button>
              </div>

              {/* Progress */}
              {ord.orderStatus === 'Cancelled' ? (
                <p className="px-5 py-3 bg-red-50 border border-red-200 text-red-700 rounded-full text-[13px] font-bold">This order was cancelled and its items were returned to stock.</p>
              ) : (
                <ol className="grid grid-cols-4 gap-2">
                  {steps.map((step, i) => (
                    <li key={step} className="text-center">
                      <div className={`h-1.5 rounded-full ${i <= reached ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316]' : 'bg-[#e5e5ea]'}`} />
                      <p className={`mt-2 text-[11px] font-extrabold uppercase tracking-wider ${i <= reached ? 'text-[#1d1d1f]' : 'text-[#c7c7cc]'}`}>{step}</p>
                    </li>
                  ))}
                </ol>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={box}>
                  <p className={heading}>Customer Details</p>
                  <p className="font-bold text-[#1d1d1f] text-[15px]">{ord.customerName}</p>
                  <p className="text-[13px] text-[#6e6e73] font-semibold flex items-center gap-2">{ord.email}<button onClick={() => copyText(ord.email, 'Email')} className="text-[#ea580c] text-[11px] font-black">Copy</button></p>
                  <p className="text-[13px] text-[#6e6e73] font-semibold flex items-center gap-2">{ord.phone}<button onClick={() => copyText(ord.phone, 'Phone')} className="text-[#ea580c] text-[11px] font-black">Copy</button></p>
                  <p className="text-[13px] text-[#1d1d1f] font-semibold mt-2 leading-snug">{ord.shippingAddress}, {ord.city}{ord.state ? `, ${ord.state}` : ''} - {ord.postalCode}</p>
                </div>
                <div className={box}>
                  <p className={heading}>Payment</p>
                  <p className="font-bold text-[#1d1d1f] text-[15px]">{ord.paymentMethod}</p>
                  <p className={`text-[13px] font-black uppercase ${ord.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>● {ord.paymentStatus}</p>
                  {ord.paymentId && <p className="text-[12px] font-mono text-[#6e6e73] mt-1">{ord.paymentId}</p>}
                  <div className="mt-3 pt-3 border-t border-[#e5e5ea] text-[13px] font-semibold space-y-1">
                    <div className="flex justify-between"><span className="text-[#6e6e73]">Subtotal</span><span>₹{ord.subtotal.toLocaleString('en-IN')}</span></div>
                    {ord.discount > 0 && <div className="flex justify-between text-emerald-700"><span>Promo {ord.promo}</span><span>− ₹{ord.discount.toLocaleString('en-IN')}</span></div>}
                    <div className="flex justify-between"><span className="text-[#6e6e73]">Delivery</span><span>{ord.delivery ? `₹${ord.delivery}` : 'Free'}</span></div>
                    <div className="flex justify-between font-black text-[15px] pt-1"><span>Total</span><span>₹{ord.total.toLocaleString('en-IN')}</span></div>
                  </div>
                </div>
              </div>

              <div className={box}>
                <p className={heading}>Variant Details</p>
                <div className="space-y-3">
                  {ord.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <img src={item.image || productImageFor(item.sku, item.color)} alt="" className="w-12 h-12 rounded-xl object-cover border border-[#e5e5ea] bg-white" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold text-[#1d1d1f] truncate">{item.name}</p>
                        <p className="text-[12px] text-[#6e6e73] font-semibold">
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
                  <p className={`${heading} !mb-0`}>Shipping</p>
                  {!ord.shipment && ord.orderStatus !== 'Cancelled' && (
                    <button onClick={() => openShipmentForm(ord)} className="px-4 py-2 bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white rounded-full text-[12px] font-extrabold shadow-sm">
                      🚚 Create Shipment
                    </button>
                  )}
                </div>
                {ord.shipment ? (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                    <div className="text-[13px] font-semibold text-[#1d1d1f] space-y-0.5">
                      <p><span className="text-[#6e6e73]">Courier:</span> {ord.shipment.courier} • <span className="font-mono">AWB {ord.shipment.awb}</span></p>
                      <p><span className="text-[#6e6e73]">Parcel:</span> {ord.shipment.weightKg} kg • {ord.shipment.dimensions} • from {ord.shipment.pickup}</p>
                      <p><span className="text-[#6e6e73]">Status:</span> <span className="font-black text-blue-700">{ord.shipment.status}</span></p>
                    </div>
                    {ord.shipment.status !== 'Delivered' && ord.orderStatus !== 'Cancelled' && (
                      <button onClick={() => advanceShipment(ord)} className="px-4 py-2 bg-white border border-[#e5e5ea] hover:border-[#ea580c] text-[#1d1d1f] rounded-full text-[12px] font-extrabold">
                        {ord.shipment.status === 'Created' ? 'Mark Picked Up → In Transit' : 'Mark Delivered'}
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-[13px] text-[#86868b] font-semibold">No shipment yet. Create one to get an AWB tracking number for the courier.</p>
                )}
              </div>

              {/* Emails */}
              <div className={box}>
                <div className="flex flex-wrap justify-between items-center gap-3">
                  <p className={`${heading} !mb-0`}>Customer Emails</p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => emailCustomer(ord, 'Status update')} className="px-4 py-2 bg-white border border-[#e5e5ea] hover:border-[#ea580c] text-[#1d1d1f] rounded-full text-[12px] font-extrabold">
                      ✉️ Send Status Update
                    </button>
                    <button onClick={() => emailCustomer(ord, 'Invoice')} className="px-4 py-2 bg-white border border-[#e5e5ea] hover:border-[#ea580c] text-[#1d1d1f] rounded-full text-[12px] font-extrabold">
                      🧾 Send Invoice
                    </button>
                  </div>
                </div>
                {ord.emails.length ? (
                  <ul className="mt-3 space-y-1 text-[12px] font-semibold text-[#6e6e73]">
                    {[...ord.emails].reverse().map((mail, i) => (
                      <li key={i}>✓ {mail.kind} sent to {ord.email} • {new Date(mail.at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-[13px] text-[#86868b] font-semibold">No emails sent for this order yet.</p>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <button onClick={() => openInvoice(ord, 'A4')} className="flex-1 py-3.5 bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-extrabold text-[13px] rounded-full shadow-md">
                  Open Full Invoice
                </button>
                <button onClick={() => openInvoice(ord, '4x6')} className="px-6 py-3.5 bg-white border border-[#e5e5ea] hover:bg-[#f5f5f7] text-[#1d1d1f] font-bold text-[13px] rounded-full">
                  Print 4×6 Label
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL 7c: CREATE SHIPMENT (courier booking, demo) */}
      {/* ========================================================================= */}
      {shipDraft && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[55] flex items-center justify-center p-4">
          <div className="bg-white border border-[#e5e5ea] rounded-[36px] p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-[#1d1d1f]">Create Shipment</h3>
                <p className="text-[12px] text-[#86868b] font-semibold">{orders.find((o) => o.id === shipDraft.orderId)?.orderNumber} • demo courier booking</p>
              </div>
              <button onClick={() => setShipDraft(null)} className="w-8 h-8 rounded-full bg-[#f5f5f7] hover:bg-[#e5e5ea] flex items-center justify-center text-sm font-bold">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#86868b] mb-1 pl-2">Courier</label>
                <select value={shipDraft.courier} onChange={(e) => setShipDraft({ ...shipDraft, courier: e.target.value })} className="w-full px-4 py-3 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[13px] font-bold">
                  {['Delhivery', 'Blue Dart', 'Xpressbees', 'Ekart', 'DTDC'].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#86868b] mb-1 pl-2">Pickup Location</label>
                <select value={shipDraft.pickup} onChange={(e) => setShipDraft({ ...shipDraft, pickup: e.target.value })} className="w-full px-4 py-3 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[13px] font-bold">
                  {['Bengaluru Warehouse', 'Mumbai Hub', 'Chennai Store'].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase text-[#86868b] mb-1 pl-2">Packed Parcel Measurements</p>
              <p className="text-[12px] text-[#86868b] font-semibold mb-2 pl-2">Measure the sealed parcel, including its packaging.</p>
              <div className="grid grid-cols-4 gap-2">
                {([['weightKg', 'Weight kg'], ['length', 'L cm'], ['breadth', 'B cm'], ['height', 'H cm']] as const).map(([key, label]) => (
                  <label key={key} className="block">
                    <span className="block text-[10px] font-extrabold uppercase text-[#86868b] mb-1 text-center">{label}</span>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={shipDraft[key]}
                      onChange={(e) => { setShipDraft({ ...shipDraft, [key]: e.target.value }); setShipError(''); }}
                      className="w-full px-2 py-3 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[13px] font-bold text-center"
                    />
                  </label>
                ))}
              </div>
            </div>
            {shipError && <p role="alert" className="text-red-500 text-[13px] font-bold bg-red-50 px-4 py-2.5 rounded-xl">{shipError}</p>}
            <div className="flex gap-3">
              <button onClick={handleCreateShipment} className="flex-1 py-3.5 bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-extrabold text-[13px] rounded-full shadow-md">
                Book Courier & Get AWB
              </button>
              <button onClick={() => setShipDraft(null)} className="px-6 py-3.5 bg-white border border-[#e5e5ea] hover:bg-[#f5f5f7] text-[#6e6e73] font-bold text-[13px] rounded-full">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 8a: CUSTOMER ORDER HISTORY */}
      {/* ========================================================================= */}
      {customerHistoryEmail && (() => {
        const cus = customers.find((c) => c.email === customerHistoryEmail);
        const history = orders.filter((o) => o.email.toLowerCase() === customerHistoryEmail.toLowerCase());
        const stats = customerStats(customerHistoryEmail);
        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-[#e5e5ea] rounded-[36px] p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-xl font-bold text-[#1d1d1f]">{cus?.name ?? customerHistoryEmail}</h3>
                  <p className="text-[13px] text-[#86868b] font-semibold">{customerHistoryEmail}{cus?.phone ? ` • ${cus.phone}` : ''}</p>
                  <p className="text-[13px] font-bold text-[#1d1d1f] mt-1">{stats.orderCount} orders • ₹{stats.totalSpent.toLocaleString('en-IN')} spent</p>
                </div>
                <button onClick={() => setCustomerHistoryEmail(null)} className="w-8 h-8 shrink-0 rounded-full bg-[#f5f5f7] hover:bg-[#e5e5ea] flex items-center justify-center text-sm font-bold">✕</button>
              </div>
              <div className="space-y-3">
                {history.map((ord) => (
                  <div key={ord.id} className="p-4 bg-[#f5f5f7] border border-[#e5e5ea] rounded-[24px] flex flex-wrap items-center gap-4">
                    <div className="flex -space-x-3">
                      {ord.items.slice(0, 3).map((item, i) => (
                        <img key={i} src={item.image || productImageFor(item.sku, item.color)} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-white" />
                      ))}
                    </div>
                    <div className="flex-1 min-w-[160px]">
                      <p className="font-mono font-bold text-[#ea580c] text-[13px]">{ord.orderNumber}</p>
                      <p className="text-[12px] text-[#6e6e73] font-semibold">{ord.date} • {ord.itemsCount} item(s) • ₹{ord.total.toLocaleString('en-IN')}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${orderStatusStyle(ord.orderStatus)}`}>{ord.orderStatus}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setCustomerHistoryEmail(null); setOrderDetailsId(ord.id); }}
                        className="px-3 py-1.5 bg-white border border-[#e5e5ea] rounded-full text-[12px] font-extrabold text-[#1d1d1f] hover:border-[#ea580c]"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => openInvoice(ord, '4x6')}
                        className="px-3 py-1.5 bg-white border border-[#e5e5ea] rounded-full text-[12px] font-extrabold text-[#ea580c] hover:border-[#ea580c] whitespace-nowrap"
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
                className="w-full py-3.5 bg-white border border-[#e5e5ea] hover:bg-[#f5f5f7] text-[#1d1d1f] font-bold text-[13px] rounded-full"
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
          <div className="bg-white border border-[#e5e5ea] rounded-[36px] p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-[#1d1d1f]">Add Customer</h3>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#f5f5f7] hover:bg-[#e5e5ea] flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Full Name *', type: 'text', value: newCustomerName, set: setNewCustomerName, placeholder: 'e.g. Kavya Reddy' },
                { label: 'Email Address *', type: 'email', value: newCustomerEmail, set: setNewCustomerEmail, placeholder: 'name@example.com' },
                { label: 'Phone Number', type: 'tel', value: newCustomerPhone, set: setNewCustomerPhone, placeholder: '+91 98765 43210' },
              ].map((field) => (
                <div key={field.label}>
                  <label className="block text-[11px] font-extrabold uppercase text-[#86868b] mb-1 pl-2">{field.label}</label>
                  <input
                    type={field.type}
                    value={field.value}
                    onChange={(e) => { field.set(e.target.value); setCustomerFormError(''); }}
                    placeholder={field.placeholder}
                    className="w-full px-5 py-3 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[13px] font-semibold text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#ea580c]"
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
                className="flex-1 py-3.5 bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-extrabold text-[13px] rounded-full shadow-md"
              >
                Add Customer
              </button>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="px-6 py-3.5 bg-white border border-[#e5e5ea] hover:bg-[#f5f5f7] text-[#6e6e73] font-bold text-[13px] rounded-full"
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
          <div className="bg-white border border-[#e5e5ea] rounded-[36px] p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-[#1d1d1f]">{bannerDraft.id ? 'Edit Banner' : 'Add New Hero Banner'}</h3>
              <button
                onClick={() => setIsBannerModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#f5f5f7] hover:bg-[#e5e5ea] flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Live previews: desktop and phone */}
            <div className="grid grid-cols-[1fr_96px] sm:grid-cols-[1fr_120px] gap-3 items-end">
            <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#86868b] mb-1 pl-1">Desktop — 1600 × 500 px</p>
            <div className="relative h-40 rounded-[24px] overflow-hidden bg-[#1d1d1f]">
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
                {bannerDraft.ctaText && <span className="mt-3 px-4 py-1.5 bg-white text-[#1d1d1f] rounded-full text-[11px] font-extrabold">{bannerDraft.ctaText} →</span>}
              </div>
            </div>
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#86868b] mb-1 text-center">Mobile</p>
              <div className="relative aspect-[4/5] rounded-[18px] overflow-hidden bg-[#1d1d1f] border-[3px] border-[#1d1d1f]">
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
              <p className="text-[11px] text-[#86868b] font-semibold -mt-3">Mobile uses the landscape image when no mobile photo is uploaded.</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-extrabold uppercase text-[#86868b] mb-1 pl-2">Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Hear Every Detail"
                  value={bannerDraft.title}
                  onChange={(e) => setBannerDraft({ ...bannerDraft, title: e.target.value })}
                  className="w-full px-5 py-3 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[13px] font-semibold text-[#1d1d1f]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-extrabold uppercase text-[#86868b] mb-1 pl-2">Subtitle</label>
                <input
                  type="text"
                  placeholder="e.g. Noise-cancelling headphones — now ₹14,999"
                  value={bannerDraft.subtitle}
                  onChange={(e) => setBannerDraft({ ...bannerDraft, subtitle: e.target.value })}
                  className="w-full px-5 py-3 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[13px] font-semibold text-[#1d1d1f]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#86868b] mb-1 pl-2">Button Text</label>
                <input
                  type="text"
                  value={bannerDraft.ctaText}
                  onChange={(e) => setBannerDraft({ ...bannerDraft, ctaText: e.target.value })}
                  className="w-full px-5 py-3 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[13px] font-semibold text-[#1d1d1f]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#86868b] mb-1 pl-2">Button Link</label>
                <input
                  type="text"
                  value={bannerDraft.ctaLink}
                  onChange={(e) => setBannerDraft({ ...bannerDraft, ctaLink: e.target.value })}
                  className="w-full px-5 py-3 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[13px] font-mono font-semibold text-[#1d1d1f]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-extrabold uppercase text-[#86868b] mb-1 pl-2">Desktop Image * <span className="normal-case font-semibold">(landscape, 1600 × 500 px recommended)</span></label>
                <ImageListField
                  images={bannerDraft.imageUrl ? [bannerDraft.imageUrl] : []}
                  onChange={(images) => setBannerDraft({ ...bannerDraft, imageUrl: images[images.length - 1] ?? '' })}
                  label="Desktop banner image"
                  showCover={false}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-extrabold uppercase text-[#86868b] mb-1 pl-2">Mobile Image <span className="normal-case font-semibold">(optional portrait, 800 × 1000 px)</span></label>
                <ImageListField
                  images={bannerDraft.mobileImageUrl ? [bannerDraft.mobileImageUrl] : []}
                  onChange={(images) => setBannerDraft({ ...bannerDraft, mobileImageUrl: images[images.length - 1] ?? '' })}
                  label="Mobile banner image"
                  showCover={false}
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#86868b] mb-1 pl-2">Text Position</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['left', 'center', 'right'] as const).map((align) => (
                    <button
                      key={align}
                      type="button"
                      onClick={() => setBannerDraft({ ...bannerDraft, textAlign: align })}
                      className={`py-2.5 rounded-full text-[12px] font-black border capitalize transition-all ${bannerDraft.textAlign === align
                        ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white border-transparent'
                        : 'bg-[#f5f5f7] text-[#6e6e73] border-[#e5e5ea] hover:bg-white'
                        }`}
                    >
                      {align}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#86868b] mb-1 pl-2">Text Color</label>
                <div className="flex items-center gap-2">
                  {[
                    { label: 'Pure White', hex: '#ffffff' },
                    { label: 'Midnight', hex: '#1d1d1f' },
                    { label: 'Brand Orange', hex: '#ea580c' },
                    { label: 'Soft Grey', hex: '#e5e5ea' },
                  ].map((preset) => (
                    <button
                      key={preset.hex}
                      type="button"
                      title={preset.label}
                      aria-label={preset.label}
                      onClick={() => setBannerDraft({ ...bannerDraft, textColor: preset.hex })}
                      className={`w-9 h-9 rounded-full border-2 transition-all ${bannerDraft.textColor === preset.hex ? 'border-[#ea580c] scale-110' : 'border-[#e5e5ea]'}`}
                      style={{ backgroundColor: preset.hex }}
                    />
                  ))}
                  <input
                    type="color"
                    aria-label="Custom text color"
                    value={bannerDraft.textColor}
                    onChange={(e) => setBannerDraft({ ...bannerDraft, textColor: e.target.value })}
                    className="w-9 h-9 rounded-full border border-[#e5e5ea] cursor-pointer p-0.5"
                  />
                </div>
              </div>
              <label className="sm:col-span-2 flex items-center justify-between gap-3 px-5 py-3 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full cursor-pointer">
                <span className="text-[13px] font-bold text-[#1d1d1f]">Show this slide on the storefront</span>
                <input
                  type="checkbox"
                  checked={bannerDraft.isActive}
                  onChange={(e) => setBannerDraft({ ...bannerDraft, isActive: e.target.checked })}
                  className="w-4 h-4 accent-[#ea580c]"
                />
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveBanner}
                disabled={!bannerDraft.title.trim() || !bannerDraft.imageUrl}
                className="flex-1 py-3.5 bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-extrabold text-[13px] rounded-full shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bannerDraft.id ? 'Save Changes' : 'Add Banner'}
              </button>
              <button
                onClick={() => setIsBannerModalOpen(false)}
                className="px-6 py-3.5 bg-white border border-[#e5e5ea] hover:bg-[#f5f5f7] text-[#6e6e73] font-bold text-[13px] rounded-full"
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
          <div className="bg-white border border-[#e5e5ea] rounded-[36px] p-8 max-w-md w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-[#1d1d1f]">Add Instagram Post</h3>
              <button
                onClick={() => setIsInstagramModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#f5f5f7] hover:bg-[#e5e5ea] flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#86868b] mb-1 pl-2">Instagram Post Link *</label>
                <input
                  type="url"
                  placeholder="https://instagram.com/p/..."
                  value={newIgUrl}
                  onChange={(e) => setNewIgUrl(e.target.value)}
                  className="w-full px-5 py-3 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[13px] font-semibold text-[#1d1d1f]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#86868b] mb-1 pl-2">Post Image *</label>
                <ImageListField
                  images={newIgImage ? [newIgImage] : []}
                  onChange={(images) => setNewIgImage(images[images.length - 1] ?? '')}
                  label="Instagram post image"
                  showCover={false}
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#86868b] mb-1 pl-2">Caption</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Desk setup goals ⌨️ #MechanicalKeyboard"
                  value={newIgCaption}
                  onChange={(e) => setNewIgCaption(e.target.value)}
                  className="w-full px-5 py-3 bg-[#f5f5f7] border border-[#e5e5ea] rounded-[20px] text-[13px] font-semibold text-[#1d1d1f] resize-none"
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
                className="flex-1 py-3.5 bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-extrabold text-[13px] rounded-full shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Post
              </button>
              <button
                onClick={() => setIsInstagramModalOpen(false)}
                className="px-6 py-3.5 bg-white border border-[#e5e5ea] hover:bg-[#f5f5f7] text-[#6e6e73] font-bold text-[13px] rounded-full"
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
          <div className="bg-white border border-[#e5e5ea] rounded-[36px] p-8 max-w-lg w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-[#1d1d1f]">{categoryDraft.id ? 'Edit Category' : 'Add New Category'}</h3>
              <button
                onClick={() => setCategoryDraft(null)}
                className="w-8 h-8 rounded-full bg-[#f5f5f7] hover:bg-[#e5e5ea] flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-[1fr_88px] gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-[#86868b] mb-1 pl-2">Category Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Footwear & Shoes"
                    value={categoryDraft.name}
                    onChange={(e) => { setCategoryDraft({ ...categoryDraft, name: e.target.value }); setCategoryFormError(''); }}
                    className="w-full px-5 py-3 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[13px] font-semibold text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#ea580c]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-[#86868b] mb-1 pl-2">Icon</label>
                  <input
                    type="text"
                    value={categoryDraft.icon}
                    onChange={(e) => setCategoryDraft({ ...categoryDraft, icon: e.target.value })}
                    className="w-full px-3 py-3 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[15px] text-center focus:outline-none focus:bg-white focus:border-[#ea580c]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#86868b] mb-1 pl-2">Short Description</label>
                <input
                  type="text"
                  placeholder="e.g. Sneakers, sandals and formal shoes"
                  value={categoryDraft.blurb}
                  onChange={(e) => setCategoryDraft({ ...categoryDraft, blurb: e.target.value })}
                  className="w-full px-5 py-3 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[13px] font-semibold text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#ea580c]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#86868b] mb-1 pl-2">Category Photo <span className="normal-case font-semibold">(shown on the storefront)</span></label>
                <ImageListField
                  images={categoryDraft.image ? [categoryDraft.image] : []}
                  onChange={(images) => setCategoryDraft({ ...categoryDraft, image: images[images.length - 1] ?? '' })}
                  label="Category photo"
                  showCover={false}
                />
              </div>
              <label className="flex items-center justify-between gap-3 px-5 py-3 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full cursor-pointer">
                <span className="text-[13px] font-bold text-[#1d1d1f]">Show on the storefront</span>
                <input
                  type="checkbox"
                  checked={categoryDraft.status === 'Active'}
                  onChange={(e) => setCategoryDraft({ ...categoryDraft, status: e.target.checked ? 'Active' : 'Inactive' })}
                  className="w-4 h-4 accent-[#ea580c]"
                />
              </label>
            </div>

            {categoryFormError && (
              <p role="alert" className="text-red-500 text-[13px] font-bold bg-red-50 px-4 py-2.5 rounded-xl">{categoryFormError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSaveCategory}
                className="flex-1 py-3.5 bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-extrabold text-[13px] rounded-full shadow-md"
              >
                {categoryDraft.id ? 'Save Changes' : 'Add Category'}
              </button>
              <button
                onClick={() => setCategoryDraft(null)}
                className="px-6 py-3.5 bg-white border border-[#e5e5ea] hover:bg-[#f5f5f7] text-[#6e6e73] font-bold text-[13px] rounded-full"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POS NEW CUSTOMER MODAL */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#e5e5ea] rounded-[36px] p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-[#1d1d1f] mb-4">New Registration</h3>
            <input
              type="text"
              placeholder="Customer Name"
              value={newCustomerFormName}
              onChange={(e) => setNewCustomerFormName(e.target.value)}
              className="w-full px-5 py-3 mb-4 bg-[#f5f5f7] border border-[#e5e5ea] rounded-xl text-[14px] text-[#1d1d1f] focus:outline-none focus:border-[#ea580c]"
            />
            <button
              onClick={() => {
                if (!newCustomerFormName) return;
                setPosCustomerName(newCustomerFormName);
                setIsNewCustomerModalOpen(false);
                setNewCustomerFormName('');
                alert(`Successfully registered ${newCustomerFormName}!`);
              }}
              className="w-full py-3.5 bg-[#1d1d1f] hover:bg-black text-white font-extrabold text-[13px] rounded-full shadow-md"
            >
              Register & Select
            </button>
          </div>
        </div>
      )}
      {/* GENERATE BARCODE MODAL */}
      {isGenerateBarcodeModalOpen && activeBarcodeProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[36px] p-8 w-full max-w-md shadow-2xl relative overflow-hidden">
            <button
              onClick={() => setIsGenerateBarcodeModalOpen(false)}
              className="absolute top-6 right-6 p-2 bg-[#f5f5f7] hover:bg-[#e5e5ea] rounded-full transition-colors text-[#1d1d1f]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
            <h2 className="text-2xl font-black text-[#1d1d1f] tracking-tight mb-2">Barcode Scanner</h2>
            <p className="text-[14px] text-[#6e6e73] font-semibold mb-6">Scanning product <span className="text-[#1d1d1f] font-bold">{activeBarcodeProduct.name}</span>...</p>

            <div className="flex flex-col items-center justify-center py-8">
              {barcodeGenStatus === 'idle' ? (
                <button
                  onClick={() => {
                    setBarcodeGenStatus('generating');
                    setTimeout(() => setBarcodeGenStatus('success'), 1500);
                  }}
                  className="px-8 py-4 bg-[#ea580c] hover:bg-[#f97316] text-white rounded-full font-black text-[15px] shadow-lg shadow-orange-500/30 transition-all active:scale-95 flex items-center gap-2"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h2v14H3z M7 5h1v14H7z M11 5h2v14h-2z M15 5h1v14h-1z M19 5h2v14h-2z" /></svg>
                  Scan & Generate Code
                </button>
              ) : barcodeGenStatus === 'generating' ? (
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 border-4 border-[#ea580c]/20 border-t-[#ea580c] rounded-full animate-spin"></div>
                  <p className="text-[13px] font-bold text-[#ea580c] animate-pulse">Scanning database...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-4 w-full">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <div className="text-center w-full bg-[#f5f5f7] p-6 rounded-3xl border border-[#e5e5ea]">
                    <p className="text-[11px] font-extrabold text-[#86868b] uppercase tracking-wider mb-2">Generated QR Code</p>
                    <ProductQrCode value={activeBarcodeProduct.barcode} className="w-44 h-44 mx-auto mb-3 rounded-xl" />
                    <p className="text-2xl font-mono font-black tracking-[0.25em] text-[#1d1d1f]">{activeBarcodeProduct.barcode}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PRINT BARCODE MODAL */}
      {isPrintBarcodeModalOpen && activeBarcodeProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[36px] p-8 w-full max-w-sm shadow-2xl relative overflow-hidden">
            <button
              onClick={() => setIsPrintBarcodeModalOpen(false)}
              className="absolute top-6 right-6 p-2 bg-[#f5f5f7] hover:bg-[#e5e5ea] rounded-full transition-colors text-[#1d1d1f]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
            <h2 className="text-2xl font-black text-[#1d1d1f] tracking-tight mb-2">Print Tags</h2>
            <p className="text-[14px] text-[#6e6e73] font-semibold mb-6">Send to thermal printer</p>

            <div className="flex flex-col items-center justify-center py-6">
              {barcodePrintStatus === 'idle' ? (
                <button
                  onClick={() => {
                    setBarcodePrintStatus('printing');
                    setTimeout(() => setBarcodePrintStatus('success'), 2000);
                  }}
                  className="px-8 py-4 bg-[#1d1d1f] hover:bg-black text-white rounded-full font-black text-[15px] shadow-lg shadow-black/20 transition-all active:scale-95 flex items-center gap-2"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
                  Start Printing
                </button>
              ) : barcodePrintStatus === 'printing' ? (
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-[#f5f5f7] rounded-xl flex items-center justify-center animate-bounce">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6e6e73" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
                  </div>
                  <p className="text-[13px] font-bold text-[#1d1d1f] animate-pulse">Connecting to printer...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <h3 className="text-xl font-bold text-[#1d1d1f]">Print Successful!</h3>
                  <p className="text-[13px] text-[#6e6e73] font-medium text-center">Your labels have been sent to the thermal printer.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin toast */}
      {adminToast && (
        <div role="status" className="fixed z-[60] bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 bg-[#1d1d1f] text-white rounded-full text-[13px] font-bold shadow-2xl print:hidden">
          {adminToast.text}
        </div>
      )}
    </div>
  );
}
