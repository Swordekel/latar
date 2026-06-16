import type { ExportFormat } from '../types'

export const FORMAT_MAP: Record<ExportFormat, { mime: string; ext: string; quality: number }> = {
  png: { mime: 'image/png', ext: 'png', quality: 1 },
  jpg: { mime: 'image/jpeg', ext: 'jpg', quality: 0.92 },
  webp: { mime: 'image/webp', ext: 'webp', quality: 0.9 },
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function suggestFilename(base: string, format: ExportFormat): string {
  const cleaned = base
    .replace(/\.(jpg|jpeg|png|webp|gif|bmp)$/i, '')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .slice(0, 40) || 'latar'
  return `${cleaned}-latar.${FORMAT_MAP[format].ext}`
}
