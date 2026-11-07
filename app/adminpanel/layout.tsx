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

// The store and Admin → Theme Setup both draw the store themes, so both get every theme font.
export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${FONT_VARIABLES} contents`}>{children}</div>;
}
