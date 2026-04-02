import { useRef, useEffect, useCallback } from 'react'

export interface CanvasDimensions {
  width: number
  height: number
  dpr: number
}

/**
 * Shared canvas ref + ResizeObserver hook.
 * Keeps the canvas resolution in sync with its CSS size × devicePixelRatio.
 * Returns the canvas ref and a stable resize callback for experiments that
 * need to react to dimension changes (e.g. re-init WebGL viewport).
 */
export function useLabCanvas(
  onResize?: (dims: CanvasDimensions) => void,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const onResizeRef = useRef(onResize)
  onResizeRef.current = onResize

  const syncSize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const { width, height } = canvas.getBoundingClientRect()
    const w = Math.round(width * dpr)
    const h = Math.round(height * dpr)
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }
    onResizeRef.current?.({ width: w, height: h, dpr })
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    syncSize()

    const ro = new ResizeObserver(syncSize)
    ro.observe(canvas)

    return () => ro.disconnect()
  }, [syncSize])

  return { canvasRef, syncSize }
}
