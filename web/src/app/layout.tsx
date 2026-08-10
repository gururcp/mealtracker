import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Noto_Sans_Devanagari, Onest } from "next/font/google";
import "./globals.css";

// Onest — modern warm sans, all body / UI text.
const onest = Onest({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Instrument Serif — display face for hero numbers only.
const displaySerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

const devanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari"],
  display: "swap",
});

const APP_NAME = "Poshan";
const APP_DEFAULT_TITLE = "Poshan · पोषण";
const APP_TITLE_TEMPLATE = "%s · Poshan";
const APP_DESCRIPTION =
  "Daily nutrition, meal logging, and weight tracker built for nutrition clinics.";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  // Manifest is auto-linked by Next.js from app/manifest.ts, but listing here
  // makes it explicit and lets us set additional meta.
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: APP_DEFAULT_TITLE,
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: APP_DEFAULT_TITLE,
    description: APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAF7" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0B0A" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${onest.variable} ${displaySerif.variable} ${devanagari.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
