import type { Metadata } from 'next';
import { Manrope, Inter, Poppins, Jost, Playfair_Display, Space_Grotesk, DM_Sans, Inter_Tight, Sora, Plus_Jakarta_Sans, Cormorant_Garamond, Cinzel } from 'next/font/google';

// One modern geometric family for the whole storefront: tight bold headlines, calm readable body.
const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
});

// Each store theme has its own type. Only the default theme's font is preloaded; the rest load when a theme uses them.
const inter = Inter({ variable: '--font-inter', subsets: ['latin'], preload: false });
const poppins = Poppins({ variable: '--font-poppins', subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], preload: false });
const jost = Jost({ variable: '--font-jost', subsets: ['latin'], preload: false });
const playfair = Playfair_Display({ variable: '--font-playfair', subsets: ['latin'], style: ['normal', 'italic'], preload: false });
const spaceGrotesk = Space_Grotesk({ variable: '--font-space', subsets: ['latin'], preload: false });
const dmSans = DM_Sans({ variable: '--font-dmsans', subsets: ['latin'], weight: ['300', '400', '500', '600', '700'], preload: false });
const interTight = Inter_Tight({ variable: '--font-intertight', subsets: ['latin'], preload: false });
const sora = Sora({ variable: '--font-sora', subsets: ['latin'], preload: false });
const jakarta = Plus_Jakarta_Sans({ variable: '--font-jakarta', subsets: ['latin'], preload: false });
const cormorant = Cormorant_Garamond({ variable: '--font-cormorant', subsets: ['latin'], weight: ['500', '600', '700'], style: ['normal', 'italic'], preload: false });
const cinzel = Cinzel({ variable: '--font-cinzel', subsets: ['latin'], weight: ['500', '600'], preload: false });
const FONT_VARIABLES = [manrope, inter, poppins, jost, playfair, spaceGrotesk, dmSans, interTight, sora, jakarta, cormorant, cinzel].map((font) => font.variable).join(' ');

// Metadata can only come from a server file; the store's pages are client components in this folder.
export const metadata: Metadata = {
  title: 'Demo Website | Premium Electronics',
  description: 'Headphones, earbuds, speakers, smartwatches, cameras, drones, gaming and smart home gadgets, chosen with care.',
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%232F6BFF'/%3E%3Cstop offset='1' stop-color='%230E1A2B'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='64' height='64' rx='16' fill='url(%23g)'/%3E%3Cpath d='M20 14h12a18 18 0 0 1 0 36H20z' fill='none' stroke='white' stroke-width='6'/%3E%3Ccircle cx='32' cy='32' r='5' fill='%23C9D2DD'/%3E%3C/svg%3E",
  },
};

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${FONT_VARIABLES} contents`}>{children}</div>;
}
