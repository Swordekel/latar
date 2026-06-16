import type { Filters } from '../types'

/** Load gambar dari Blob/URL ke ImageBitmap (honor EXIF orientation) */
export async function loadImageBitmap(source: Blob | File): Promise<ImageBitmap> {
  return await createImageBitmap(source, { imageOrientation: 'from-image' })
}

/** Convert ImageBitmap ke Blob (PNG/JPG/WebP) */
export async function bitmapToBlob(
  bitmap: ImageBitmap,
  type: string = 'image/png',
  quality = 0.92,
): Promise<Blob> {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0)
  return await canvas.convertToBlob({ type, quality })
}

/** Convert Blob → ImageBitmap → resize ke maxSide */
export async function downscaleToBlob(
  source: Blob,
  maxSide: number,
  type = 'image/jpeg',
  quality = 0.85,
): Promise<Blob> {
  const bitmap = await loadImageBitmap(source)
  const longSide = Math.max(bitmap.width, bitmap.height)
  const scale = longSide > maxSide ? maxSide / longSide : 1
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = new OffscreenCanvas(w, h)
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close?.()
  return await canvas.convertToBlob({ type, quality })
}

/** Generate CSS filter string dari Filters */
export function filtersToCss(f: Filters): string {
  const parts: string[] = []
  if (f.brightness !== 100) parts.push(`brightness(${f.brightness}%)`)
  if (f.contrast !== 100) parts.push(`contrast(${f.contrast}%)`)
  if (f.saturation !== 100) parts.push(`saturate(${f.saturation}%)`)
  if (f.blur > 0) parts.push(`blur(${f.blur}px)`)
  return parts.join(' ')
}

/**
 * Composite foreground (cutout PNG dengan alpha) di atas background, plus apply filter.
 * Return PNG/JPG blob.
 */
export interface CompositeOptions {
  foreground: ImageBitmap
  background: 'transparent' | { type: 'color'; value: string } | { type: 'image'; bitmap: ImageBitmap }
  filters: Filters
  outputType?: string
  outputQuality?: number
}

export async function composite(opts: CompositeOptions): Promise<Blob> {
  const { foreground, background, filters, outputType = 'image/png', outputQuality = 0.95 } = opts
  const w = foreground.width
  const h = foreground.height

  const canvas = new OffscreenCanvas(w, h)
  const ctx = canvas.getContext('2d')!

  // Background
  if (background === 'transparent') {
    // Don't fill — canvas default is transparent
  } else if (background.type === 'color') {
    ctx.fillStyle = background.value
    ctx.fillRect(0, 0, w, h)
  } else {
    // Cover-fit background image
    const bg = background.bitmap
    const scale = Math.max(w / bg.width, h / bg.height)
    const bgW = bg.width * scale
    const bgH = bg.height * scale
    const bgX = (w - bgW) / 2
    const bgY = (h - bgH) / 2
    ctx.drawImage(bg, bgX, bgY, bgW, bgH)
  }

  // Apply filter to foreground draw
  const filterCss = filtersToCss(filters)
  if (filterCss) {
    ctx.filter = filterCss
  }
  ctx.drawImage(foreground, 0, 0)
  ctx.filter = 'none'

  return await canvas.convertToBlob({ type: outputType, quality: outputQuality })
}

/** Read clipboard untuk image — null kalau gak ada / not supported */
export async function readImageFromClipboard(): Promise<Blob | null> {
  if (!('clipboard' in navigator) || !navigator.clipboard.read) return null
  try {
    const items = await navigator.clipboard.read()
    for (const item of items) {
      const imgType = item.types.find((t) => t.startsWith('image/'))
      if (imgType) {
        return await item.getType(imgType)
      }
    }
  } catch {
    // permission denied or no image
  }
  return null
}

/** Sanity-check ukuran upload */
export const MAX_UPLOAD_SIZE = 20 * 1024 * 1024 // 20 MB
export const MAX_IMAGE_DIMENSION = 4096

export function validateImageFile(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'File harus gambar (JPG/PNG/WebP).'
  if (file.size > MAX_UPLOAD_SIZE) {
    return `Ukuran file maks ${Math.round(MAX_UPLOAD_SIZE / 1024 / 1024)} MB.`
  }
  return null
}
