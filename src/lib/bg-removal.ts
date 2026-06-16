/**
 * Background removal via @imgly/background-removal.
 *
 * Pakai ONNX Runtime Web. Model di-fetch on-demand, cached di IndexedDB
 * setelah pertama. Bisa pakai WebGPU kalau available, fallback ke WASM.
 */
import { removeBackground as imglyRemove } from '@imgly/background-removal'

export type ProgressCallback = (kind: string, current: number, total: number) => void

export interface BgRemovalOptions {
  onProgress?: ProgressCallback
}

export async function removeBackground(
  source: Blob | File | string,
  opts: BgRemovalOptions = {},
): Promise<Blob> {
  const { onProgress } = opts

  const result = await imglyRemove(source, {
    progress: (key, current, total) => {
      onProgress?.(key, current, total)
    },
    debug: false,
    output: { format: 'image/png', quality: 1 },
  })

  return result
}

/** Pre-warm the model di background (optional, untuk UX yang lebih instan) */
let warmupPromise: Promise<void> | null = null
export function preloadModel(): Promise<void> {
  if (warmupPromise) return warmupPromise
  warmupPromise = (async () => {
    try {
      const canvas = new OffscreenCanvas(1, 1)
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = 'rgba(0,0,0,0)'
      ctx.fillRect(0, 0, 1, 1)
      const blob = await canvas.convertToBlob({ type: 'image/png' })
      await imglyRemove(blob, { debug: false })
    } catch {
      // best-effort preload
    }
  })()
  return warmupPromise
}
