// A jewellery-only sample collection shared with the admin catalog.
export interface SeedProduct {
  id: string;
  name: string;
  tagline: string;
  category: string;
  price: number;
  mrp: number;
  rating: number;
  reviews: number;
  stock: number;
  photo: string;
  /** More photos shown in the product gallery after `photo`. */
  gallery?: string[];
  badge?: 'New' | 'Bestseller';
  highlights: string[];
  specs: [string, string][];
}

export const PHOTOS = {
  pearlNecklace: '1515562141207-7a88fb7ce338',
  pearlPendant: '1611085583191-a3b181a88401',
  templeNecklace: '1601121141461-9d6647bca1ed',
  layeredNecklaces: '1599459183200-59c7687a0275',
  necklaceModel: '1611652022419-a9419f74343d',
  pendantModel: '1620656798579-1984d9e87df7',
  goldChainModel: '1633810542706-90e5ff7557be',
  layeredGold: '1601821765780-754fa98637c1',
  necklaceEditorial: '1600721391689-2564bb8055de',
  silverPendant: '1589128777073-263566ae5e4d',
  silverHeart: '1588444837495-c6cfeb53f32d',
  roseGoldPendant: '1610694955371-d4a3e0ce4b52',
  floralBracelet: '1611591437281-460bfbe1220a',
  goldChainBracelet: '1602173574767-37ac01994b2a',
  tennisBracelet: '1573408301185-9146fe634ad0',
  handsStacked: '1596944924616-7b38e7cfac36',
  bangles: '1611107683227-e9060eccd846',
  haloRing: '1605100804763-247f67b3557e',
  pinkStoneRing: '1603561591411-07134e71a2a9',
  gemRings: '1608042314453-ae338d80c427',
  stackedRings: '1543294001-f7cd5d7fb516',
  ringTray: '1631982690223-8aa4be0a2497',
  weddingBands: '1622398925373-3f91b1e275f5',
  solitaire: '1598560917807-1bae44bd2be8',
  sapphireBands: '1543295204-2ae345412549',
  hoopsStone: '1617038220319-276d3cfab638',
  sapphireEarrings: '1535632066927-ab7c9ab60908',
  hoopsBox: '1584302179602-e4c3d3fd629d',
  goldHoops: '1608508644127-ba99d7732fee',
  twistedHoops: '1617038260897-41a1f14a8ca0',
  kundanStuds: '1626784215021-2e39ccf971cd',
  knotEarrings: '1603974372039-adc49044b6bd',
  roseGoldDrops: '1629224316810-9d8805b95e76',
};

export const SEED_PRODUCTS: SeedProduct[] = [
  { id: 'studio-one-headphones', name: 'Heritage Gold Necklace', tagline: 'Hand-linked 22K gold-plated chain with a soft, warm lustre.', category: 'necklaces', price: 28999, mrp: 34999, rating: 4.9, reviews: 612, stock: 18, photo: PHOTOS.layeredGold, gallery: [PHOTOS.goldChainModel], badge: 'Bestseller', highlights: ['22K gold-plated finish', 'Hand-linked by artisans', 'Lightweight for all-day wear', 'Presented in a keepsake box'], specs: [['Style', 'Link necklace'], ['Finish', 'Polished gold'], ['Closure', 'Secure lobster clasp'], ['Care', 'Store in a dry pouch']] },
  { id: 'pulse-buds-pro', name: 'Mira Rose Gold Drop Earrings', tagline: 'Slender rose gold drops that catch the light as you move.', category: 'earrings', price: 7499, mrp: 9999, rating: 4.8, reviews: 3410, stock: 120, photo: PHOTOS.roseGoldDrops, badge: 'Bestseller', highlights: ['Rose gold finish', 'Hypoallergenic posts', 'Secure push-back fastening', 'Gift-ready presentation'], specs: [['Style', 'Drop earrings'], ['Finish', '18K rose gold plated'], ['Length', '4 cm'], ['Pair', 'Sold as a pair']] },
  { id: 'wave-capsule-speaker', name: 'Ziya Polki Choker Set', tagline: 'A statement choker with matching earrings for celebration dressing.', category: 'bridal', price: 18999, mrp: 24999, rating: 4.7, reviews: 874, stock: 64, photo: PHOTOS.templeNecklace, badge: 'New', highlights: ['Polki-inspired stone setting', 'Adjustable necklace chain', 'Matching earrings included', 'Designed for festive occasions'], specs: [['Set includes', 'Necklace and earrings'], ['Finish', 'Antique gold'], ['Stone', 'Polki-style glass'], ['Closure', 'Adjustable dori']] },
  { id: 'resonance-bookshelf-pair', name: 'Saanvi Gold Link Bracelet', tagline: 'Polished gold links with an easy, everyday drape.', category: 'bracelets', price: 6299, mrp: 8499, rating: 4.7, reviews: 298, stock: 44, photo: PHOTOS.goldChainBracelet, gallery: [PHOTOS.handsStacked], highlights: ['Polished curb links', 'Comfortable everyday weight', 'Pairs beautifully with a watch', 'Gift-ready presentation'], specs: [['Style', 'Link bracelet'], ['Finish', 'Gold tone'], ['Length', '7 in'], ['Care', 'Avoid water and perfume']] },
  { id: 'orbit-smartwatch', name: 'Aurelia Solitaire Ring', tagline: 'A single brilliant stone on a slim, polished gold band.', category: 'rings', price: 15999, mrp: 19999, rating: 4.8, reviews: 1520, stock: 32, photo: PHOTOS.solitaire, gallery: [PHOTOS.stackedRings], badge: 'Bestseller', highlights: ['Cubic zirconia centre stone', 'Comfort-fit band', 'Available in sizes 6, 7 and 8', 'Polished keepsake box'], specs: [['Style', 'Solitaire'], ['Finish', '18K gold plated'], ['Stone', 'Cubic zirconia'], ['Band', 'Comfort fit']] },
  { id: 'vital-active-watch', name: 'Meher Gold Knot Earrings', tagline: 'Sculpted gold knots with a soft, brushed glow.', category: 'earrings', price: 4299, mrp: 5999, rating: 4.6, reviews: 945, stock: 37, photo: PHOTOS.knotEarrings, gallery: [PHOTOS.twistedHoops], highlights: ['Sculpted knot silhouette', 'Lightweight for all-day wear', 'Comfortable push-back closure', 'Made for everyday styling'], specs: [['Style', 'Knot stud'], ['Finish', 'Brushed gold'], ['Closure', 'Push back'], ['Pair', 'Sold as a pair']] },
  { id: 'nova-classic-watch', name: 'Tara Silver Pendant Necklace', tagline: 'A sparkling cushion pendant on a fine sterling silver chain.', category: 'necklaces', price: 5499, mrp: 6999, rating: 4.6, reviews: 402, stock: 22, photo: PHOTOS.silverPendant, gallery: [PHOTOS.silverHeart], badge: 'New', highlights: ['925 sterling silver', 'Cushion-cut sparkling stone', 'Adjustable extender chain', 'Easy to layer'], specs: [['Metal', '925 sterling silver'], ['Length', '16 in + 2 in extender'], ['Closure', 'Lobster clasp'], ['Care', 'Store in a dry pouch']] },
  { id: 'phantom-gaming-mouse', name: 'Kavya Kundan Stud Earrings', tagline: 'A refined kundan-inspired stud with a luminous finish.', category: 'earrings', price: 3299, mrp: 4499, rating: 4.5, reviews: 511, stock: 52, photo: PHOTOS.kundanStuds, highlights: ['Kundan-inspired stonework', 'Lightweight stud profile', 'Secure push-back fastening', 'Ideal for everyday occasions'], specs: [['Style', 'Kundan stud'], ['Finish', 'Gold tone'], ['Stone', 'Glass kundan'], ['Pair', 'Sold as a pair']] },
  { id: 'vista-27-monitor', name: 'Ruhani Rose Gold Pendant', tagline: 'A delicate everyday pendant on a fine matching chain.', category: 'necklaces', price: 3999, mrp: 5499, rating: 4.4, reviews: 239, stock: 29, photo: PHOTOS.roseGoldPendant, gallery: [PHOTOS.pendantModel], highlights: ['Minimal floral pendant', 'Rose gold finish', 'Matching chain included', 'Gift-ready presentation'], specs: [['Style', 'Pendant necklace'], ['Finish', 'Rose gold tone'], ['Chain', '18 in'], ['Closure', 'Lobster clasp']] },
  { id: 'volt-gan-charger', name: 'Leela Diamond Tennis Bracelet', tagline: 'A continuous line of brilliant stones in a white gold setting.', category: 'bracelets', price: 8999, mrp: 11999, rating: 4.6, reviews: 418, stock: 26, photo: PHOTOS.tennisBracelet, highlights: ['Line of brilliant stones', 'Flexible, comfortable setting', 'Box clasp with safety catch', 'Polished presentation box'], specs: [['Style', 'Tennis bracelet'], ['Finish', 'White gold tone'], ['Stone', 'Cubic zirconia'], ['Closure', 'Box clasp']] },
  { id: 'alpha-m-camera', name: 'Noor Diamond Halo Ring', tagline: 'A delicate halo ring with a bright, elegant sparkle.', category: 'rings', price: 12999, mrp: 16999, rating: 4.7, reviews: 284, stock: 16, photo: PHOTOS.haloRing, gallery: [PHOTOS.ringTray], highlights: ['Halo-inspired setting', 'Brilliant clear centre stone', 'Available in sizes 6, 7 and 8', 'Polished presentation box'], specs: [['Style', 'Halo ring'], ['Finish', 'White gold tone'], ['Stone', 'Cubic zirconia'], ['Sizes', '6, 7 and 8']] },
  { id: 'retro-compact-camera', name: 'Anika Floral Bracelet', tagline: 'A delicate floral bracelet with a graceful adjustable fit.', category: 'bracelets', price: 4799, mrp: 6499, rating: 4.5, reviews: 176, stock: 34, photo: PHOTOS.floralBracelet, highlights: ['Floral link detailing', 'Lightweight everyday wear', 'Adjustable extender chain', 'Gift-ready presentation'], specs: [['Style', 'Chain bracelet'], ['Finish', 'Gold tone'], ['Length', '6.5 in + extender'], ['Closure', 'Lobster clasp']] },
];
