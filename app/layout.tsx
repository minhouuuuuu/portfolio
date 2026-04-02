import type { Metadata } from "next";
import { Space_Grotesk, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { LenisProvider } from "@/components/providers/LenisProvider";
import { CustomCursor } from "@/components/layout/CustomCursor";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nguyen Minh — Creative Web Developer",
  description:
    "Creative Web Developer specializing in React, Next.js, and immersive web experiences. Currently at IZHAK INTERACT AGENCY in Strasbourg, France.",
  keywords: ["Creative Developer", "Web Developer", "React", "Next.js", "GSAP", "Three.js", "Animation"],
  authors: [{ name: "Nguyen Minh" }],
  openGraph: {
    title: "Nguyen Minh — Creative Web Developer",
    description:
      "Crafting immersive web experiences at the intersection of code and creativity.",
    url: "https://nguyen-minh.dev",
    siteName: "Nguyen Minh Portfolio",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nguyen Minh — Creative Web Developer",
    description: "Crafting immersive web experiences at the intersection of code and creativity.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="noise">
        <LenisProvider>
          <CustomCursor />
          {children}
        </LenisProvider>
      </body>
    </html>
  );
}
