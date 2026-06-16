import { useState } from 'react'
import { useEditorStore } from '../store/useEditorStore'
import { filtersToCss } from '../lib/canvas'

interface Props {
  viewMode: 'cutout' | 'before-after'
}

const MAX_HEIGHT = 'calc(100vh - 160px)'

export function EditorCanvas({ viewMode }: Props) {
  const sourceUrl = useEditorStore((s) => s.sourceUrl)
  const cutoutUrl = useEditorStore((s) => s.cutoutUrl)
  const bgMode = useEditorStore((s) => s.bgMode)
  const bgColor = useEditorStore((s) => s.bgColor)
  const bgImageUrl = useEditorStore((s) => s.bgImageUrl)
  const filters = useEditorStore((s) => s.filters)
  const filterCss = filtersToCss(filters)

  const displayUrl = cutoutUrl || sourceUrl
  if (!displayUrl) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Belum ada gambar</p>
      </div>
    )
  }

  if (viewMode === 'before-after' && sourceUrl && cutoutUrl) {
    return (
      <BeforeAfterView
        before={sourceUrl}
        after={cutoutUrl}
        filterCss={filterCss}
        bgMode={bgMode}
        bgColor={bgColor}
        bgImageUrl={bgImageUrl}
      />
    )
  }

  // Cutout (or source-only) view
  const showBg = !!cutoutUrl && bgMode !== 'transparent'

  return (
    <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-8">
      <div
        className="relative inline-block rounded-2xl overflow-hidden checkerboard"
        style={{
          boxShadow: '0 20px 48px rgba(43, 24, 16, 0.18)',
        }}
      >
        {showBg && (
          <BgLayer bgMode={bgMode} bgColor={bgColor} bgImageUrl={bgImageUrl} />
        )}
        <img
          src={displayUrl}
          alt="preview"
          className="relative block max-w-full"
          style={{
            maxHeight: MAX_HEIGHT,
            filter: filterCss,
            willChange: 'filter',
          }}
          draggable={false}
        />
      </div>
    </div>
  )
}

function BgLayer({
  bgMode,
  bgColor,
  bgImageUrl,
}: {
  bgMode: 'transparent' | 'color' | 'image'
  bgColor: string
  bgImageUrl: string | null
}) {
  if (bgMode === 'transparent') return null
  if (bgMode === 'color') {
    return (
      <div
        className="absolute inset-0"
        style={{ background: bgColor }}
      />
    )
  }
  if (bgMode === 'image' && bgImageUrl) {
    return (
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${bgImageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
    )
  }
  return null
}

interface BAProps {
  before: string
  after: string
  filterCss: string
  bgMode: 'transparent' | 'color' | 'image'
  bgColor: string
  bgImageUrl: string | null
}

function BeforeAfterView({
  before,
  after,
  filterCss,
  bgMode,
  bgColor,
  bgImageUrl,
}: BAProps) {
  const [pos, setPos] = useState(50)

  return (
    <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-8">
      <div
        className="relative inline-block rounded-2xl overflow-hidden checkerboard"
        style={{
          boxShadow: '0 20px 48px rgba(43, 24, 16, 0.18)',
        }}
      >
        {/* Before — structural, defines container size */}
        <img
          src={before}
          alt="before"
          className="relative block max-w-full"
          style={{
            maxHeight: MAX_HEIGHT,
            filter: filterCss,
          }}
          draggable={false}
        />

        {/* After overlay — clipped to right side */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
        >
          <BgLayer bgMode={bgMode} bgColor={bgColor} bgImageUrl={bgImageUrl} />
          <img
            src={after}
            alt="after"
            className="absolute inset-0 w-full h-full"
            style={{
              objectFit: 'fill',
              filter: filterCss,
            }}
            draggable={false}
          />
        </div>

        {/* Slider line + handle */}
        <div
          className="absolute top-0 bottom-0 w-0.5 pointer-events-none"
          style={{
            left: `${pos}%`,
            background:
              'linear-gradient(180deg, var(--accent-primary) 0%, var(--accent-tertiary) 100%)',
            boxShadow: '0 0 12px rgba(139,90,60,0.5)',
            transform: 'translateX(-50%)',
          }}
        >
          <div
            className="absolute top-1/2 left-1/2 w-10 h-10 rounded-full flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
            style={{
              background:
                'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-tertiary) 100%)',
              boxShadow: '0 6px 18px rgba(139,90,60,0.55)',
            }}
          >
            <span className="text-white text-base font-bold leading-none">⇆</span>
          </div>
        </div>

        {/* Range slider — covers entire area */}
        <input
          type="range"
          min={0}
          max={100}
          value={pos}
          onChange={(e) => setPos(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
          style={{ touchAction: 'none' }}
        />

        {/* Labels */}
        <div
          className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white pointer-events-none"
          style={{ background: 'rgba(43,24,16,0.7)' }}
        >
          Sebelum
        </div>
        <div
          className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white pointer-events-none"
          style={{
            background:
              'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-tertiary) 100%)',
          }}
        >
          Sesudah
        </div>
      </div>
    </div>
  )
}
