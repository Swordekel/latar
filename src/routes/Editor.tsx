import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Check,
  ChevronLeft,
  Download,
  Eye,
  Loader2,
  Moon,
  Sparkles,
  Sun,
  X,
} from 'lucide-react'
import { useEditorStore } from '../store/useEditorStore'
import { useThemeStore } from '../store/useThemeStore'
import { removeBackground } from '../lib/bg-removal'
import { composite, loadImageBitmap } from '../lib/canvas'
import { downloadBlob, FORMAT_MAP, suggestFilename } from '../lib/export'
import type { ExportFormat } from '../types'
import { EditorCanvas } from '../components/EditorCanvas'
import { BgPicker } from '../components/BgPicker'
import { FilterPanel } from '../components/FilterPanel'
import { PrimaryBtn } from '../components/shared/Buttons'

export default function EditorRoute() {
  const navigate = useNavigate()
  const isDark = useThemeStore((s) => s.isDark)
  const toggleTheme = useThemeStore((s) => s.toggle)

  // States for Mobile Bottom Sheet
  const [isMobile, setIsMobile] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [sheetHeight, setSheetHeight] = useState(window.innerHeight * 0.55)
  const [startY, setStartY] = useState<number | null>(null)
  const [startHeight, setStartHeight] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Track if we are on mobile dynamically
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (!mobile) {
        setIsCollapsed(false)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isMobile) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setStartY(e.clientY)
    setStartHeight(isCollapsed ? 50 : sheetHeight)
    setIsDragging(true)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || startY === null || startHeight === null) return
    const deltaY = e.clientY - startY
    const newHeight = Math.max(50, Math.min(window.innerHeight * 0.85, startHeight - deltaY))
    setSheetHeight(newHeight)
    if (newHeight > 50 && isCollapsed) {
      setIsCollapsed(false)
    }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || startY === null || startHeight === null) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    setIsDragging(false)
    
    const deltaY = e.clientY - startY
    setStartY(null)
    setStartHeight(null)

    // Treat tiny movements as tap/click to toggle
    if (Math.abs(deltaY) < 5) {
      if (isCollapsed) {
        setIsCollapsed(false)
        setSheetHeight(window.innerHeight * 0.55)
      } else {
        setIsCollapsed(true)
        setSheetHeight(50)
      }
      return
    }

    // Snap to collapsed or expanded based on position
    const collapsedThreshold = window.innerHeight * 0.2
    if (sheetHeight < collapsedThreshold) {
      setIsCollapsed(true)
      setSheetHeight(50)
    } else {
      setIsCollapsed(false)
      // If dragged height is too low/high, snap to defaults
      if (sheetHeight < window.innerHeight * 0.3) {
        setSheetHeight(window.innerHeight * 0.55)
      }
    }
  }

  const sourceBlob = useEditorStore((s) => s.sourceBlob)
  const sourceUrl = useEditorStore((s) => s.sourceUrl)
  const cutoutBlob = useEditorStore((s) => s.cutoutBlob)
  const cutoutUrl = useEditorStore((s) => s.cutoutUrl)
  const sourceFilename = useEditorStore((s) => s.sourceFilename)
  const filters = useEditorStore((s) => s.filters)
  const bgMode = useEditorStore((s) => s.bgMode)
  const bgColor = useEditorStore((s) => s.bgColor)
  const bgImageBlob = useEditorStore((s) => s.bgImageBlob)
  const isProcessing = useEditorStore((s) => s.isProcessing)
  const progressMessage = useEditorStore((s) => s.progressMessage)
  const progressPercent = useEditorStore((s) => s.progressPercent)
  const error = useEditorStore((s) => s.error)
  const setCutout = useEditorStore((s) => s.setCutout)
  const setProcessing = useEditorStore((s) => s.setProcessing)
  const setProgress = useEditorStore((s) => s.setProgress)
  const setError = useEditorStore((s) => s.setError)
  const reset = useEditorStore((s) => s.reset)

  const [viewMode, setViewMode] = useState<'cutout' | 'before-after'>('cutout')
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png')
  const [exporting, setExporting] = useState(false)
  const [downloaded, setDownloaded] = useState(false)

  // Sanity — kalau buka /editor langsung tanpa source, balik ke home
  if (!sourceBlob || !sourceUrl) {
    navigate('/')
    return null
  }

  async function handleRemoveBg() {
    if (!sourceBlob) return
    setProcessing(true)
    setProgress('Memuat model AI...', 0)
    setError(null)
    try {
      const result = await removeBackground(sourceBlob, {
        onProgress: (kind, current, total) => {
          const pct = total > 0 ? Math.round((current / total) * 100) : 0
          let msg = 'Memproses...'
          if (kind.includes('fetch')) msg = 'Mengunduh model AI (sekali saja)...'
          else if (kind.includes('compute')) msg = 'Menghapus latar...'
          else if (kind.includes('mask')) msg = 'Menerapkan mask...'
          setProgress(msg, pct)
        },
      })
      setCutout(result)
      // Default ke 'cutout' view — user langsung lihat hasil tanpa harus klik toggle
      setViewMode('cutout')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal menghapus latar'
      setError(msg)
    } finally {
      setProcessing(false)
      setProgress('', 0)
    }
  }

  const handleExport = useCallback(async () => {
    if (!sourceBlob) return
    setExporting(true)
    try {
      // Load foreground bitmap
      const fgBlob = cutoutBlob || sourceBlob
      const fgBitmap = await loadImageBitmap(fgBlob)

      // Resolve background
      let bgArg: Parameters<typeof composite>[0]['background']
      if (!cutoutBlob || bgMode === 'transparent') {
        bgArg = 'transparent'
      } else if (bgMode === 'color') {
        bgArg = { type: 'color', value: bgColor }
      } else if (bgMode === 'image' && bgImageBlob) {
        const bgBitmap = await loadImageBitmap(bgImageBlob)
        bgArg = { type: 'image', bitmap: bgBitmap }
      } else {
        bgArg = 'transparent'
      }

      const out = await composite({
        foreground: fgBitmap,
        background: bgArg,
        filters,
        outputType: FORMAT_MAP[exportFormat].mime,
        outputQuality: FORMAT_MAP[exportFormat].quality,
      })

      fgBitmap.close?.()
      downloadBlob(out, suggestFilename(sourceFilename, exportFormat))
      setDownloaded(true)
      setTimeout(() => setDownloaded(false), 1800)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal export'
      setError(msg)
    } finally {
      setExporting(false)
    }
  }, [
    sourceBlob,
    cutoutBlob,
    bgMode,
    bgColor,
    bgImageBlob,
    filters,
    exportFormat,
    sourceFilename,
    setError,
  ])

  function handleBack() {
    if (
      cutoutBlob &&
      !confirm('Yakin keluar? Hasil edit belum di-download akan hilang.')
    )
      return
    reset()
    navigate('/')
  }

  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: 'var(--bg-base)' }}>
      {/* Top bar */}
      <header
        className="flex items-center gap-2 px-3 py-2.5 border-b backdrop-blur-md"
        style={{
          background: isDark
            ? 'rgba(26, 20, 16, 0.8)'
            : 'rgba(245, 235, 224, 0.8)',
          borderColor: 'var(--border-soft)',
        }}
      >
        <button
          onClick={handleBack}
          className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-muted/40 transition-colors"
          title="Kembali"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <p
            className="font-bold text-sm truncate"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
          >
            {sourceFilename}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {cutoutBlob ? '✓ Latar dihapus' : 'Belum dihapus'}
          </p>
        </div>

        {/* View toggle */}
        {cutoutUrl && (
          <button
            onClick={() =>
              setViewMode((m) => (m === 'cutout' ? 'before-after' : 'cutout'))
            }
            className="hidden sm:flex h-10 px-3 rounded-xl items-center gap-1.5 text-xs font-semibold hover:bg-muted/40 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            title={
              viewMode === 'cutout'
                ? 'Banding sebelum/sesudah'
                : 'Lihat hasil saja'
            }
          >
            <Eye size={14} />
            {viewMode === 'cutout' ? 'Banding' : 'Hasil'}
          </button>
        )}

        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-muted/40 transition-colors"
          title="Toggle tema"
        >
          {isDark ? (
            <Sun size={16} style={{ color: 'var(--accent-primary)' }} />
          ) : (
            <Moon size={16} style={{ color: 'var(--accent-primary)' }} />
          )}
        </button>
      </header>

      {/* Main layout: canvas + side panel */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Canvas area */}
        <div
          className="relative flex-1 overflow-hidden"
          style={{
            background:
              'radial-gradient(ellipse at center, var(--bg-elevated) 0%, var(--bg-base) 75%)',
          }}
        >
          <EditorCanvas viewMode={viewMode} />

          {/* Processing overlay */}
          {isProcessing && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center backdrop-blur-sm animate-fade-in"
              style={{ background: 'rgba(245, 235, 224, 0.6)' }}
            >
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 pulse-soft"
                style={{
                  background:
                    'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-tertiary) 100%)',
                }}
              >
                <Sparkles size={32} color="#fff" />
              </div>
              <p className="font-bold text-base mb-1" style={{ color: 'var(--text-primary)' }}>
                {progressMessage || 'Memproses...'}
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                AI jalan langsung di HP kamu — tidak ada upload
              </p>
              <div
                className="w-64 h-2 rounded-full overflow-hidden"
                style={{ background: 'var(--bg-muted)' }}
              >
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${progressPercent}%`,
                    background:
                      'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-tertiary) 100%)',
                  }}
                />
              </div>
              <p
                className="text-[10px] text-muted-foreground mt-2 tnum"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {progressPercent}%
              </p>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div
              className="absolute top-3 left-3 right-3 sm:left-auto sm:max-w-md rounded-xl px-4 py-2.5 flex items-center gap-2 animate-slide-up"
              style={{
                background: 'rgba(185, 28, 28, 0.95)',
                color: '#fff',
                boxShadow: '0 8px 24px rgba(185,28,28,0.3)',
              }}
            >
              <span className="text-xs font-semibold flex-1">{error}</span>
              <button onClick={() => setError(null)} className="text-white/80 hover:text-white">
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Side panel */}
        <aside
          className="border-t lg:border-t-0 lg:border-l p-4 lg:p-5 overflow-y-auto flex flex-col lg:w-[20rem] lg:flex-shrink-0"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border-soft)',
            height: isMobile ? (isCollapsed ? '50px' : `${sheetHeight}px`) : undefined,
            transition: isDragging ? 'none' : 'height 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
            overflowY: isCollapsed ? 'hidden' : 'auto',
          }}
        >
          {/* Mobile Drag Handle */}
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="flex lg:hidden items-center justify-center py-3 -mt-4 -mx-4 mb-2 cursor-grab active:cursor-grabbing touch-none select-none"
            style={{
              borderBottom: isCollapsed ? 'none' : '1px solid var(--border-soft)',
              background: 'var(--bg-surface)',
            }}
          >
            <div className="w-12 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600 transition-colors hover:bg-neutral-400" />
          </div>

          <div
            className="flex flex-col gap-4"
            style={{
              display: isCollapsed ? 'none' : 'flex',
            }}
          >
            {/* Remove BG CTA */}
            {!cutoutBlob ? (
              <PrimaryBtn full onClick={handleRemoveBg} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Memproses...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> Hapus Latar dengan AI
                  </>
                )}
              </PrimaryBtn>
            ) : (
              <div
                className="rounded-2xl p-3 flex items-center gap-2"
                style={{
                  background: 'rgba(91, 117, 83, 0.1)',
                  border: '1px solid rgba(91, 117, 83, 0.25)',
                }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white flex-shrink-0"
                  style={{ background: '#5B7553' }}
                >
                  <Check size={14} strokeWidth={3} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    Latar berhasil dihapus
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Sekarang pilih background atau langsung download
                  </p>
                </div>
              </div>
            )}

            {/* BG Picker */}
            {cutoutBlob && (
              <section>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Background
                </p>
                <BgPicker />
              </section>
            )}

            {/* Filters */}
            <section>
              <FilterPanel />
            </section>

            {/* Export */}
            <section className="pt-2 border-t" style={{ borderColor: 'var(--border-soft)' }}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Download
              </p>
              <div className="flex gap-1.5 mb-3">
                {(['png', 'jpg', 'webp'] as ExportFormat[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setExportFormat(f)}
                    className="flex-1 h-9 rounded-lg text-xs font-bold uppercase"
                    style={
                      exportFormat === f
                        ? {
                            background: 'var(--accent-primary)',
                            color: '#fff',
                          }
                        : {
                            background: 'var(--bg-elevated)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-soft)',
                          }
                    }
                  >
                    {f}
                  </button>
                ))}
              </div>
              <PrimaryBtn full onClick={handleExport} disabled={exporting}>
                {downloaded ? (
                  <>
                    <Check size={16} /> Tersimpan!
                  </>
                ) : exporting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Memproses...
                  </>
                ) : (
                  <>
                    <Download size={16} /> Download
                  </>
                )}
              </PrimaryBtn>
              <p className="text-[10px] text-muted-foreground mt-2 text-center leading-relaxed">
                File tersimpan di Downloads kamu
              </p>
            </section>
          </div>
        </aside>
      </div>
    </div>
  )
}
