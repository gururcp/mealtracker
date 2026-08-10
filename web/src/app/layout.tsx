import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Noto_Sans_Devanagari, Onest } from "next/font/google";
import "./globals.css";

// Onest — modern warm sans, used for all body / UI text.
const onest = Onest({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Instrument Serif — editorial display face, used only for hero numbers
// (kcal ring center, deficit big number, weekly weight delta pill).
const displaySerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

// Devanagari for Hindi labels — kept as-is.
const devanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Meal Tracker",
  description: "Track your daily plan, meals, and weight.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FAFAF7",
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
