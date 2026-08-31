import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Nguyen Minh'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '80px',
          background: '#0a0a0a',
          color: '#f5f5f5',
        }}
      >
        <div
          style={{
            fontSize: 28,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: '#c8ff00',
            marginBottom: 24,
          }}
        >
          Nguyen Minh
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            lineHeight: 1.1,
            maxWidth: 980,
          }}
        >
          Product Engineer
        </div>
        <div
          style={{
            fontSize: 30,
            color: '#a3a3a3',
            marginTop: 24,
          }}
        >
          nguyen-minh.dev
        </div>
      </div>
    ),
    { ...size },
  )
}
