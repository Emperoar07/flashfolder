import type { Metadata } from "next";
import { DM_Mono, Bebas_Neue, Playfair_Display, Space_Grotesk } from "next/font/google";

import { Navbar } from "@/components/navbar";
import { Providers } from "@/components/providers";
import "./globals.css";

function NavbarWrapper() {
  return <Navbar />;
}

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  subsets: ["latin"],
  weight: "400",
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FlashFolder",
  description:
    "A decentralized hot-storage workspace for instant file access, sharing, and streaming.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmMono.variable} ${bebasNeue.variable} ${playfairDisplay.variable} ${spaceGrotesk.variable} antialiased`}
      >
        <Providers>
          <NavbarWrapper />
          {children}
        </Providers>
      </body>
    </html>
  );
}
