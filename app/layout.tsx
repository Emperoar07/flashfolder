import type { Metadata } from "next";
import { Fraunces, Space_Grotesk } from "next/font/google";

import { Providers } from "@/components/providers";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal"],
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
        className={`${spaceGrotesk.variable} ${fraunces.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
