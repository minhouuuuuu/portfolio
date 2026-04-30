import type { Metadata } from 'next'
import { PerformanceTestClient } from './PerformanceTestClient'

export const metadata: Metadata = {
  title: 'Performance Test',
  description:
    'WebGPU flow field stress test — 3072 curl-noise particle trails, bloom post-processing, real-time FPS ranking.',
}

export default function PerformanceTestPage() {
  return <PerformanceTestClient />
}
