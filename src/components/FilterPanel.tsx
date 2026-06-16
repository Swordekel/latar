import { RotateCcw } from 'lucide-react'
import { useEditorStore } from '../store/useEditorStore'
import { DEFAULT_FILTERS, type Filters } from '../types'

interface SliderConfig {
  key: keyof Filters
  label: string
  min: number
  max: number
  step: number
  unit?: string
}

const SLIDERS: SliderConfig[] = [
  { key: 'brightness', label: 'Cerah', min: 0, max: 200, step: 1, unit: '%' },
  { key: 'contrast', label: 'Kontras', min: 0, max: 200, step: 1, unit: '%' },
  { key: 'saturation', label: 'Saturasi', min: 0, max: 200, step: 1, unit: '%' },
  { key: 'blur', label: 'Blur', min: 0, max: 20, step: 0.5, unit: 'px' },
]

export function FilterPanel() {
  const filters = useEditorStore((s) => s.filters)
  const setFilter = useEditorStore((s) => s.setFilter)
  const resetFilters = useEditorStore((s) => s.resetFilters)

  const hasChanges = SLIDERS.some(
    (s) => filters[s.key] !== DEFAULT_FILTERS[s.key],
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Filter
        </span>
        {hasChanges && (
          <button
            onClick={resetFilters}
            className="text-[10px] font-semibold flex items-center gap-1 transition-opacity hover:opacity-70"
            style={{ color: 'var(--accent-primary)' }}
          >
            <RotateCcw size={10} /> Reset
          </button>
        )}
      </div>
      {SLIDERS.map((s) => (
        <div key={s.key} className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {s.label}
            </span>
            <span
              className="tnum font-bold"
              style={{
                color: 'var(--accent-primary)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {filters[s.key]}
              {s.unit}
            </span>
          </div>
          <input
            type="range"
            min={s.min}
            max={s.max}
            step={s.step}
            value={filters[s.key]}
            onChange={(e) => setFilter(s.key, parseFloat(e.target.value))}
            className="w-full"
            style={{ accentColor: 'var(--accent-primary)' }}
          />
        </div>
      ))}
    </div>
  )
}
