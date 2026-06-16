import { useNavigate } from 'react-router-dom'
import { Lock, Moon, Sun, Wifi, Zap } from 'lucide-react'
import { ImageUploader } from '../components/ImageUploader'
import { useThemeStore } from '../store/useThemeStore'

export default function Home() {
  const navigate = useNavigate()
  const isDark = useThemeStore((s) => s.isDark)
  const toggleTheme = useThemeStore((s) => s.toggle)

  return (
    <div
      className="absolute inset-0 overflow-y-auto overflow-x-hidden"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Ambient bg pattern */}
      <BgPattern />

      <div className="relative min-h-full flex flex-col">
        {/* Top bar — sticky, full width */}
        <header
          className="sticky top-0 z-30 backdrop-blur-md"
          style={{
            background: isDark
              ? 'rgba(26, 20, 16, 0.7)'
              : 'rgba(245, 235, 224, 0.7)',
            borderBottom: '1px solid var(--border-soft)',
          }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between px-5 lg:px-12 py-4">
            <div className="flex items-center gap-2.5">
              <LogoMark size={40} />
              <span
                className="font-extrabold text-xl"
                style={{ letterSpacing: '-0.03em' }}
              >
                Latar
              </span>
            </div>
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              style={{
                backgroundColor: isDark
                  ? 'rgba(212,163,115,0.1)'
                  : 'rgba(43,24,16,0.06)',
              }}
              title="Toggle tema"
            >
              {isDark ? (
                <Sun size={17} style={{ color: 'var(--accent-primary)' }} />
              ) : (
                <Moon size={17} style={{ color: 'var(--accent-primary)' }} />
              )}
            </button>
          </div>
        </header>

        {/* HERO — full viewport height minus header */}
        <section className="relative flex items-center px-5 lg:px-12 py-10 lg:py-0" style={{ minHeight: 'calc(100vh - 73px)' }}>
          <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-20 items-center">
            {/* Left: pitch */}
            <div className="text-center lg:text-left">
              <h1
                className="font-extrabold tracking-tight leading-[0.98] mb-6"
                style={{
                  fontSize: 'clamp(2.5rem, 7.5vw, 5.5rem)',
                  letterSpacing: '-0.04em',
                }}
              >
                Hapus latar foto,
                <br />
                <span
                  style={{
                    background:
                      'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-tertiary) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  tanpa upload.
                </span>
              </h1>
              <p
                className="text-base lg:text-xl leading-relaxed max-w-xl mx-auto lg:mx-0"
                style={{ color: 'var(--text-secondary)' }}
              >
                Foto kamu tidak pernah keluar dari HP. AI{' '}
                <code
                  className="text-xs lg:text-sm font-mono px-1.5 py-0.5 rounded"
                  style={{ background: 'var(--bg-muted)' }}
                >
                  isnet
                </code>{' '}
                jalan via WASM langsung di browser — privasi 100% terjamin.
              </p>

              <div className="hidden lg:flex items-center gap-2 mt-8 flex-wrap">
                <Pill icon={<Lock size={12} />} label="100% private" />
                <Pill icon={<Wifi size={12} />} label="Works offline" />
                <Pill icon={<Zap size={12} />} label="Free forever" />
              </div>

              <p className="hidden lg:block text-xs text-muted-foreground mt-10">
                Scroll ke bawah untuk lihat cara kerjanya ↓
              </p>
            </div>

            {/* Right: uploader */}
            <div className="w-full max-w-md mx-auto lg:max-w-none lg:mx-0">
              <ImageUploader onUploaded={() => navigate('/editor')} />
              <div className="lg:hidden grid grid-cols-3 gap-2 mt-5">
                <Feature icon={<Lock size={14} />} label="Private" />
                <Feature icon={<Wifi size={14} />} label="Offline" />
                <Feature icon={<Zap size={14} />} label="Gratis" />
              </div>
            </div>
          </div>
        </section>

        {/* Below the fold — 3 steps */}
        <section
          className="relative px-5 lg:px-12 py-16 lg:py-24"
          style={{
            background: 'var(--bg-elevated)',
            borderTop: '1px solid var(--border-soft)',
          }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 lg:mb-16">
              <h2
                className="font-extrabold mb-3"
                style={{
                  fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
                  letterSpacing: '-0.03em',
                }}
              >
                Tiga langkah aja
              </h2>
              <p className="text-sm lg:text-base text-muted-foreground max-w-xl mx-auto">
                Tanpa register, tanpa login, tanpa langganan. Foto tetap di
                device kamu sepenuhnya.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 lg:gap-6">
              <Step
                num="01"
                title="Upload foto"
                desc="Drop file, paste dari clipboard, atau pilih dari device."
              />
              <Step
                num="02"
                title="Hapus latar"
                desc="AI model di-load sekali (~40MB), lalu proses instan untuk foto berikutnya."
              />
              <Step
                num="03"
                title="Edit & download"
                desc="Ganti BG (transparan/warna/gambar), atur filter, simpan PNG/JPG/WebP."
              />
            </div>
          </div>
        </section>

        <footer
          className="text-center text-xs text-muted-foreground py-8 px-5 leading-relaxed"
          style={{ borderTop: '1px solid var(--border-soft)' }}
        >
          AI model dari{' '}
          <a
            href="https://github.com/imgly/background-removal-js"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            @imgly/background-removal
          </a>
          {' · '}
          Open source &amp; gratis selamanya.
        </footer>
      </div>
    </div>
  )
}

function Pill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div
      className="flex items-center gap-1.5 px-3 h-8 rounded-full"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-soft)',
        color: 'var(--text-secondary)',
      }}
    >
      <span style={{ color: 'var(--accent-primary)' }}>{icon}</span>
      <span className="text-xs font-semibold">{label}</span>
    </div>
  )
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div
      className="rounded-xl p-2.5 flex flex-col items-center gap-1.5"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-soft)',
      }}
    >
      <div style={{ color: 'var(--accent-primary)' }}>{icon}</div>
      <span
        className="text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: 'var(--text-secondary)' }}
      >
        {label}
      </span>
    </div>
  )
}

function Step({
  num,
  title,
  desc,
}: {
  num: string
  title: string
  desc: string
}) {
  return (
    <div
      className="rounded-2xl p-6 lg:p-7"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-soft)',
        boxShadow: '0 4px 16px rgba(43, 24, 16, 0.06)',
      }}
    >
      <div
        className="text-3xl lg:text-4xl font-extrabold mb-3 tnum"
        style={{
          fontFamily: 'var(--font-mono)',
          background:
            'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-tertiary) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {num}
      </div>
      <h3
        className="font-bold text-base lg:text-lg mb-1.5"
        style={{ letterSpacing: '-0.01em' }}
      >
        {title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  )
}

function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      style={{
        boxShadow: '0 6px 16px rgba(139,90,60,0.25)',
        borderRadius: 14,
      }}
    >
      <defs>
        <linearGradient id="logo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--accent-primary)" />
          <stop offset="100%" stopColor="var(--accent-tertiary)" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#logo-bg)" />
      <path
        d="M 22 14 L 22 44 L 46 44"
        stroke="#F5EBE0"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="44" cy="18" r="3.2" fill="#D4A373" />
    </svg>
  )
}

function BgPattern() {
  return (
    <svg
      className="fixed inset-0 w-full h-full pointer-events-none opacity-40"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 1440 900"
    >
      <g style={{ color: 'var(--accent-primary)' }}>
        {/* Floating dots */}
        {[
          { x: 100, y: 220, r: 6, op: 0.12 },
          { x: 1340, y: 180, r: 9, op: 0.1 },
          { x: 180, y: 720, r: 5, op: 0.1 },
          { x: 1350, y: 700, r: 8, op: 0.12 },
          { x: 700, y: 100, r: 4, op: 0.1 },
          { x: 60, y: 460, r: 6, op: 0.08 },
          { x: 1400, y: 420, r: 5, op: 0.08 },
        ].map((d, i) => (
          <circle
            key={i}
            cx={d.x}
            cy={d.y}
            r={d.r}
            fill="currentColor"
            opacity={d.op}
          />
        ))}
        {/* Big subtle blobs */}
        <circle cx="100" cy="900" r="240" fill="currentColor" opacity="0.04" />
        <circle cx="1340" cy="0" r="280" fill="currentColor" opacity="0.035" />
      </g>
    </svg>
  )
}

export { Home }
