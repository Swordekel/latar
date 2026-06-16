export type BgMode = 'transparent' | 'color' | 'image'

export interface Filters {
  brightness: number // 0..200, 100 = normal
  contrast: number // 0..200
  saturation: number // 0..200
  blur: number // 0..20 px
}

export const DEFAULT_FILTERS: Filters = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  blur: 0,
}

export interface EditMeta {
  id?: number
  createdAt: Date
  thumbnail: Blob
  width: number
  height: number
  hasBgRemoved: boolean
}

export type ExportFormat = 'png' | 'jpg' | 'webp'
