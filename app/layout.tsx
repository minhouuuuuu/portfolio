import type { Metadata } from 'next'
import './globals.css'
import { monument, neueMachina } from './fonts'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { LocaleProvider } from '@/components/providers/LocaleProvider'
import { LenisProvider } from '@/components/providers/LenisProvider'
import { LoaderProvider } from '@/components/providers/LoaderContext'
import { CustomCursor } from '@/components/layout/CustomCursor'

const BASE_URL = 'https://www.nguyen-minh.dev'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: 'Nguyen Minh — Product Engineer',
    template: '%s | Nguyen Minh',
  },

  description:
    'Product Engineer / Fullstack Developer specializing in React, Next.js, and TypeScript. Shipping production systems — from client scoping to data pipelines to on-call monitoring.',

  keywords: [
    'Product Engineer',
    'Fullstack Developer',
    'Frontend Developer',
    'Web Developer',
    'React Developer',
    'Next.js Developer',
    'TypeScript',
    'System Design',
    'Three.js',
    'GSAP',
    'WebGL',
    'Strasbourg',
    'France',
    'Nguyen Minh',
  ],

  authors: [{ name: 'Nguyen Minh', url: BASE_URL }],
  creator: 'Nguyen Minh',
  publisher: 'Nguyen Minh',

  alternates: {
    canonical: BASE_URL,
  },

  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'Nguyen Minh — Product Engineer',
    title: 'Nguyen Minh — Product Engineer',
    description:
      'Product Engineer / Fullstack Developer. React · Next.js · TypeScript — production systems, not just prototypes.',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Nguyen Minh — Product Engineer',
    description:
      'Product Engineer / Fullstack Developer. Production systems, not just prototypes.',
    creator: '@nguyen__minh',
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  category: 'technology',

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${monument.variable} ${neueMachina.variable}`}
    >
      {/* The body is server-rendered with a black background (var(--bg)), which
          covers the SSR→hydration gap on its own — no FOUC overlay needed. The
          first-visit PageLoader (z-9997) then covers the page; returning
          visitors see content immediately. */}
      <body className="noise">
        <ThemeProvider>
          <LocaleProvider>
            <LoaderProvider>
              <LenisProvider>
                <CustomCursor />
                {children}
              </LenisProvider>
            </LoaderProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
