import { create } from 'zustand'
import type { BgMode, Filters } from '../types'
import { DEFAULT_FILTERS } from '../types'

interface EditorState {
  // Source file
  sourceFile: File | null
  sourceBlob: Blob | null
  sourceUrl: string | null
  sourceWidth: number
  sourceHeight: number
  sourceFilename: string

  // Background-removed cutout (PNG dengan alpha)
  cutoutBlob: Blob | null
  cutoutUrl: string | null

  // BG mode
  bgMode: BgMode
  bgColor: string
  bgImageBlob: Blob | null
  bgImageUrl: string | null

  // Filters
  filters: Filters

  // Processing state
  isProcessing: boolean
  progressMessage: string
  progressPercent: number
  error: string | null

  // Actions
  setSource: (file: File, blob: Blob, w: number, h: number) => void
  setCutout: (blob: Blob | null) => void
  setBgMode: (m: BgMode) => void
  setBgColor: (c: string) => void
  setBgImage: (blob: Blob | null) => void
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void
  resetFilters: () => void
  setProcessing: (p: boolean) => void
  setProgress: (msg: string, percent: number) => void
  setError: (e: string | null) => void
  reset: () => void
}

const INITIAL = {
  sourceFile: null,
  sourceBlob: null,
  sourceUrl: null,
  sourceWidth: 0,
  sourceHeight: 0,
  sourceFilename: '',
  cutoutBlob: null,
  cutoutUrl: null,
  bgMode: 'transparent' as BgMode,
  bgColor: '#FFFFFF',
  bgImageBlob: null,
  bgImageUrl: null,
  filters: { ...DEFAULT_FILTERS },
  isProcessing: false,
  progressMessage: '',
  progressPercent: 0,
  error: null,
}

function revokeUrl(url: string | null) {
  if (url) URL.revokeObjectURL(url)
}

export const useEditorStore = create<EditorState>((set, get) => ({
  ...INITIAL,

  setSource: (file, blob, w, h) => {
    const prev = get()
    revokeUrl(prev.sourceUrl)
    revokeUrl(prev.cutoutUrl)
    revokeUrl(prev.bgImageUrl)
    set({
      sourceFile: file,
      sourceBlob: blob,
      sourceUrl: URL.createObjectURL(blob),
      sourceFilename: file.name,
      sourceWidth: w,
      sourceHeight: h,
      cutoutBlob: null,
      cutoutUrl: null,
      bgMode: 'transparent',
      bgImageBlob: null,
      bgImageUrl: null,
      filters: { ...DEFAULT_FILTERS },
      error: null,
    })
  },

  setCutout: (blob) => {
    const prev = get()
    revokeUrl(prev.cutoutUrl)
    set({
      cutoutBlob: blob,
      cutoutUrl: blob ? URL.createObjectURL(blob) : null,
    })
  },

  setBgMode: (bgMode) => set({ bgMode }),
  setBgColor: (bgColor) => set({ bgColor, bgMode: 'color' }),
  setBgImage: (blob) => {
    const prev = get()
    revokeUrl(prev.bgImageUrl)
    set({
      bgImageBlob: blob,
      bgImageUrl: blob ? URL.createObjectURL(blob) : null,
      bgMode: blob ? 'image' : prev.bgMode,
    })
  },

  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),

  resetFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),

  setProcessing: (isProcessing) => set({ isProcessing }),
  setProgress: (progressMessage, progressPercent) =>
    set({ progressMessage, progressPercent }),
  setError: (error) => set({ error }),

  reset: () => {
    const prev = get()
    revokeUrl(prev.sourceUrl)
    revokeUrl(prev.cutoutUrl)
    revokeUrl(prev.bgImageUrl)
    set({ ...INITIAL })
  },
}))
