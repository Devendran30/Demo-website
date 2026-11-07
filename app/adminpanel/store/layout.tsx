import type { Metadata } from 'next';

// Metadata can only come from a server file; the store's pages are client components in this folder.
export const metadata: Metadata = {
  title: 'Demo Jewellery | Handcrafted Jewellery',
  description: 'Hand-finished necklaces, earrings, rings and bracelets, chosen with care for every occasion.',
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='18' fill='%230F2A24'/%3E%3Cpath d='M16 27 32 12l16 15-16 25z' fill='none' stroke='%23D9B865' stroke-width='4' stroke-linejoin='round'/%3E%3Ccircle cx='32' cy='32' r='6' fill='%23F6F2EA'/%3E%3C/svg%3E",
  },
};

// The theme fonts come from the admin panel layout, so Theme Setup's previews use them too.
export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
