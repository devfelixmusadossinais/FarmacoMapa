import type { Metadata, Viewport } from "next";
import { Newsreader, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
});

export const metadata: Metadata = {
  title: {
    default: "Mapa Mental Bioanálise",
    template: "%s · Mapa Mental Bioanálise",
  },
  description:
    "Mapas mentais de bioanálise para revisar coleta, hematologia, bioquímica e o restante do laboratório clínico.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#14312d",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${outfit.variable} ${newsreader.variable} antialiased`}>{children}</body>
    </html>
  );
}
