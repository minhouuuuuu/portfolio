import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { LocaleProvider } from '@/components/providers/LocaleProvider'
import { LenisProvider } from '@/components/providers/LenisProvider'
import { LoaderProvider } from '@/components/providers/LoaderContext'
import { CustomCursor } from '@/components/layout/CustomCursor'

const BASE_URL = 'https://www.nguyen-minh.dev'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: 'Nguyen Minh — Creative Web Developer',
    template: '%s | Nguyen Minh',
  },

  description:
    'Creative Web Developer specializing in React, Next.js, Three.js, and GSAP. Building immersive digital experiences at IZHAK INTERACT AGENCY in Strasbourg, France.',

  keywords: [
    'Creative Developer',
    'Creative Web Developer',
    'Frontend Developer',
    'Web Developer',
    'React Developer',
    'Next.js Developer',
    'Three.js',
    'GSAP',
    'Framer Motion',
    'WebGL',
    'Animation',
    'Interactive Web',
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
    siteName: 'Nguyen Minh — Creative Web Developer',
    title: 'Nguyen Minh — Creative Web Developer',
    description:
      'Crafting immersive web experiences at the intersection of code and creativity. React · Three.js · GSAP · Next.js',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Nguyen Minh — Creative Web Developer',
        type: 'image/png',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Nguyen Minh — Creative Web Developer',
    description:
      'Crafting immersive web experiences at the intersection of code and creativity.',
    images: ['/og-image.png'],
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
    <html lang="en" suppressHydrationWarning>
      <body className="noise">
        {/* Static black overlay — present in the initial SSR HTML so the page
            never flashes before the loader covers it (FOUC fix). Rendered by
            the server, so the inline script below is emitted as real HTML and
            runs before paint (it is NOT inside a client component). */}
        <div
          id="ssr-loader-overlay"
          aria-hidden
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9996,
            backgroundColor: '#050505',
            pointerEvents: 'none',
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var c=document.cookie.split('; ').find(function(r){return r.indexOf('loader_shown=')===0});if(c&&c.split('=')[1]==='1'){var o=document.getElementById('ssr-loader-overlay');if(o)o.remove();}}catch(e){}})();`,
          }}
        />
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
