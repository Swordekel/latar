import { useCallback, useEffect, useRef, useState } from 'react'
import { ClipboardPaste, Image as ImageIcon, Upload } from 'lucide-react'
import { loadImageBitmap, readImageFromClipboard, validateImageFile } from '../lib/canvas'
import { useEditorStore } from '../store/useEditorStore'

interface UploaderProps {
  onUploaded?: () => void
}

export function ImageUploader({ onUploaded }: UploaderProps) {
  const setSource = useEditorStore((s) => s.setSource)
  const setError = useEditorStore((s) => s.setError)
  const [dragActive, setDragActive] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(
    async (files: FileList | File[] | null) => {
      const file = files ? Array.from(files)[0] : null
      if (!file) return
      const err = validateImageFile(file)
      if (err) {
        setLocalError(err)
        return
      }
      setLocalError(null)
      try {
        const bitmap = await loadImageBitmap(file)
        setSource(file, file, bitmap.width, bitmap.height)
        bitmap.close?.()
        onUploaded?.()
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Gagal memuat gambar'
        setLocalError(msg)
        setError(msg)
      }
    },
    [setSource, setError, onUploaded],
  )

  // Global paste handler
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      if (!e.clipboardData) return
      const file = Array.from(e.clipboardData.files)[0]
      if (file && file.type.startsWith('image/')) {
        e.preventDefault()
        void handleFiles([file])
      }
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [handleFiles])

  async function handlePasteButton() {
    const blob = await readImageFromClipboard()
    if (!blob) {
      setLocalError('Clipboard tidak ada gambar (atau permission ditolak)')
      return
    }
    const file = new File([blob], 'clipboard-image.png', {
      type: blob.type,
    })
    await handleFiles([file])
  }

  return (
    <div className="w-full">
      <div
        onDragEnter={(e) => {
          e.preventDefault()
          setDragActive(true)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragActive(false)
          void handleFiles(e.dataTransfer.files)
        }}
        onClick={() => fileRef.current?.click()}
        className="w-full rounded-3xl flex flex-col items-center justify-center text-center p-8 sm:p-12 cursor-pointer transition-all"
        style={{
          background: dragActive
            ? 'rgba(139, 90, 60, 0.08)'
            : 'var(--bg-elevated)',
          border: `2px dashed ${
            dragActive
              ? 'var(--accent-primary)'
              : 'var(--border-strong)'
          }`,
          transform: dragActive ? 'scale(1.01)' : 'scale(1)',
        }}
      >
        <div
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mb-4"
          style={{
            background:
              'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-tertiary) 100%)',
            boxShadow: '0 8px 24px rgba(139,90,60,0.28)',
          }}
        >
          <Upload size={28} color="#fff" strokeWidth={2.2} />
        </div>
        <h2
          className="font-bold text-lg sm:text-xl mb-1.5"
          style={{ letterSpacing: '-0.02em' }}
        >
          Drop foto di sini
        </h2>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
          Atau klik untuk pilih dari device. PNG, JPG, WebP up to 20 MB.
        </p>

        <div className="flex flex-wrap items-center gap-2 justify-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              fileRef.current?.click()
            }}
            className="h-10 px-4 rounded-xl text-sm font-semibold text-white flex items-center gap-2 active:scale-95 transition-transform"
            style={{
              background:
                'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-tertiary) 100%)',
            }}
          >
            <ImageIcon size={15} /> Pilih File
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              void handlePasteButton()
            }}
            className="h-10 px-4 rounded-xl text-sm font-semibold flex items-center gap-2 border active:scale-95 transition-all"
            style={{
              borderColor: 'var(--border-medium)',
              color: 'var(--text-secondary)',
            }}
          >
            <ClipboardPaste size={14} /> Paste
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
      </div>

      {localError && (
        <div
          className="mt-3 px-4 py-2.5 rounded-xl text-sm font-medium animate-fade-in"
          style={{
            background: 'rgba(185, 28, 28, 0.08)',
            color: 'var(--destructive)',
            border: '1px solid rgba(185, 28, 28, 0.2)',
          }}
        >
          {localError}
        </div>
      )}
    </div>
  )
}
