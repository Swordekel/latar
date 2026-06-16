import { useRef } from 'react'
import { Image as ImageIcon, Plus, Square } from 'lucide-react'
import { useEditorStore } from '../store/useEditorStore'

const PRESETS = [
  '#FFFFFF',
  '#F5EBE0',
  '#000000',
  '#2B1810',
  '#B91C1C',
  '#D97706',
  '#5B7553',
  '#3B82F6',
  '#9F7AEA',
  '#C75B7A',
]

export function BgPicker() {
  const bgMode = useEditorStore((s) => s.bgMode)
  const bgColor = useEditorStore((s) => s.bgColor)
  const bgImageUrl = useEditorStore((s) => s.bgImageUrl)
  const setBgMode = useEditorStore((s) => s.setBgMode)
  const setBgColor = useEditorStore((s) => s.setBgColor)
  const setBgImage = useEditorStore((s) => s.setBgImage)
  const colorInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleBgFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setBgImage(file)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <ModeBtn
          active={bgMode === 'transparent'}
          onClick={() => setBgMode('transparent')}
          label="Transparan"
        >
          <Square size={14} />
        </ModeBtn>
        <ModeBtn
          active={bgMode === 'color'}
          onClick={() => setBgMode('color')}
          label="Warna"
        >
          <div
            className="w-3.5 h-3.5 rounded-sm"
            style={{ background: bgColor, border: '1px solid var(--border-medium)' }}
          />
        </ModeBtn>
        <ModeBtn
          active={bgMode === 'image' && !!bgImageUrl}
          onClick={() => {
            if (bgImageUrl) {
              setBgMode('image')
            } else {
              fileInputRef.current?.click()
            }
          }}
          label="Gambar"
        >
          <ImageIcon size={14} />
        </ModeBtn>
      </div>

      {bgMode === 'color' && (
        <div className="flex items-center gap-1.5 flex-wrap animate-fade-in">
          {PRESETS.map((c) => {
            const active = bgColor.toLowerCase() === c.toLowerCase()
            return (
              <button
                key={c}
                onClick={() => setBgColor(c)}
                title={c}
                className="w-8 h-8 rounded-full transition-transform active:scale-90 hover:scale-110"
                style={{
                  background: c,
                  border: active
                    ? '2px solid var(--accent-primary)'
                    : '1.5px solid var(--border-medium)',
                  outline: active ? '2px solid var(--bg-surface)' : 'none',
                  outlineOffset: '-4px',
                  transform: active ? 'scale(1.1)' : 'scale(1)',
                }}
              />
            )
          })}
          <button
            onClick={() => colorInputRef.current?.click()}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-90 hover:scale-110"
            style={{
              border: '2px dashed var(--border-strong)',
              color: 'var(--accent-primary)',
            }}
            title="Warna bebas"
          >
            <Plus size={12} strokeWidth={2.4} />
          </button>
          <input
            ref={colorInputRef}
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="absolute opacity-0 pointer-events-none w-0 h-0"
            tabIndex={-1}
          />
        </div>
      )}

      {bgMode === 'image' && (
        <div className="flex items-center gap-2 animate-fade-in">
          {bgImageUrl && (
            <div
              className="w-14 h-14 rounded-xl bg-cover bg-center"
              style={{
                backgroundImage: `url(${bgImageUrl})`,
                border: '1px solid var(--border-medium)',
              }}
            />
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="h-10 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 border"
            style={{
              borderColor: 'var(--border-medium)',
              color: 'var(--text-secondary)',
            }}
          >
            <Plus size={12} />
            {bgImageUrl ? 'Ganti' : 'Pilih gambar BG'}
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleBgFile}
      />
    </div>
  )
}

function ModeBtn({
  active,
  onClick,
  children,
  label,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 h-10 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all active:scale-95"
      style={
        active
          ? {
              background:
                'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-tertiary) 100%)',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(139,90,60,0.25)',
            }
          : {
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-soft)',
              color: 'var(--text-secondary)',
            }
      }
    >
      {children}
      <span>{label}</span>
    </button>
  )
}
