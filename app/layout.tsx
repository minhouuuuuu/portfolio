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

const BASE_URL = "https://nguyen-minh.dev";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: "Nguyen Minh — Creative Web Developer",
    template: "%s | Nguyen Minh",
  },

  description:
    "Creative Web Developer specializing in React, Next.js, Three.js, and GSAP. Building immersive digital experiences at IZHAK INTERACT AGENCY in Strasbourg, France.",

  keywords: [
    "Creative Developer",
    "Creative Web Developer",
    "Frontend Developer",
    "Web Developer",
    "React Developer",
    "Next.js Developer",
    "Three.js",
    "GSAP",
    "Framer Motion",
    "WebGL",
    "Animation",
    "Interactive Web",
    "Strasbourg",
    "France",
    "Nguyen Minh",
  ],

  authors: [{ name: "Nguyen Minh", url: BASE_URL }],
  creator: "Nguyen Minh",
  publisher: "Nguyen Minh",

  alternates: {
    canonical: BASE_URL,
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "Nguyen Minh — Creative Web Developer",
    title: "Nguyen Minh — Creative Web Developer",
    description:
      "Crafting immersive web experiences at the intersection of code and creativity. React · Three.js · GSAP · Next.js",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Nguyen Minh — Creative Web Developer",
        type: "image/png",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Nguyen Minh — Creative Web Developer",
    description:
      "Crafting immersive web experiences at the intersection of code and creativity.",
    images: ["/og-image.png"],
    creator: "@nguyen__minh",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  category: "technology",

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
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
