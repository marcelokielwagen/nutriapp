import { animate, AnimatePresence, motion, useDragControls } from 'framer-motion'
import { useEffect, useRef, type ReactNode } from 'react'

// Número que "conta" até o valor novo.
export function Num({ value, className, digits = 0 }: { value: number; className?: string; digits?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const prev = useRef(0)
  useEffect(() => {
    const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })
    const controls = animate(prev.current, value, {
      duration: 0.7,
      ease: 'easeOut',
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = fmt(v)
      },
    })
    prev.current = value
    return () => controls.stop()
  }, [value, digits])
  return <span ref={ref} className={className} />
}

// Anel de progresso animado.
export function Ring({
  value,
  max,
  size = 200,
  stroke = 16,
  from = '#b4f04a',
  to = '#34d399',
  track = 'rgba(255,255,255,0.14)',
  id,
  children,
}: {
  value: number
  max: number
  size?: number
  stroke?: number
  from?: string
  to?: string
  track?: string
  id: string
  children?: ReactNode
}) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - pct) }}
          transition={{ type: 'spring', stiffness: 45, damping: 14 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}

export function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-black/8">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ type: 'spring', stiffness: 60, damping: 16 }}
      />
    </div>
  )
}

// Painel que sobe de baixo da tela.
export function Sheet({
  open,
  onClose,
  children,
  title,
  full,
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  full?: boolean
}) {
  const controls = useDragControls()
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="absolute inset-0 z-40 bg-forest/45 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={`absolute inset-x-0 bottom-0 z-50 flex flex-col rounded-t-[32px] bg-bg shadow-2xl ${full ? 'h-[92%]' : 'max-h-[92%]'}`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            drag="y"
            dragControls={controls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose()
            }}
          >
            <div className="flex shrink-0 cursor-grab touch-none flex-col items-center pt-3 pb-2" onPointerDown={(e) => controls.start(e)}>
              <div className="h-1.5 w-11 rounded-full bg-black/15" />
              {title && <h2 className="mt-3 text-lg font-extrabold">{title}</h2>}
            </div>
            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-8">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export function Tap({
  children,
  className,
  onClick,
  disabled,
  label,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
  label?: string
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      className={className}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </motion.button>
  )
}

export function Card({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={`soft-shadow rounded-[28px] bg-card p-5 ${className}`}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 220, damping: 24 }}
    >
      {children}
    </motion.div>
  )
}

// Controle deslizante com número grande.
export function BigSlider({
  label,
  value,
  unit,
  min,
  max,
  step = 1,
  onChange,
  digits = 0,
}: {
  label: string
  value: number
  unit: string
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  digits?: number
}) {
  return (
    <div>
      <div className="mb-2 flex items-end justify-between">
        <span className="text-sm font-semibold text-mute">{label}</span>
        <span className="text-3xl font-extrabold tabular-nums">
          {value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })}
          <span className="ml-1 text-base font-semibold text-mute">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}
