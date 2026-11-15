import { motion } from 'framer-motion'
import { Flame, Plus, Target } from 'lucide-react'
import { useState } from 'react'
import { BigSlider, Card, Num, Sheet, Tap } from '../components/ui'
import { addDays, bmi, bmiLabel, dayKey, keyToDate, weeksToGoal } from '../lib/nutrition'
import { sumEntries, useGoals, useStore } from '../store'

function WeightChart({ points, target }: { points: { date: string; kg: number }[]; target: number }) {
  const W = 320
  const H = 150
  const pad = 14
  const values = [...points.map((p) => p.kg), target]
  const min = Math.min(...values) - 1
  const max = Math.max(...values) + 1
  const x = (i: number) => (points.length === 1 ? W / 2 : pad + (i * (W - pad * 2)) / (points.length - 1))
  const y = (kg: number) => pad + ((max - kg) / (max - min)) * (H - pad * 2)
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.kg)}`).join(' ')
  const area = `${line} L${x(points.length - 1)},${H} L${x(0)},${H} Z`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <defs>
        <linearGradient id="wfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1={pad} x2={W - pad} y1={y(target)} y2={y(target)} stroke="#ff7a59" strokeWidth="1.5" strokeDasharray="5 5" />
      <text x={W - pad} y={y(target) - 5} textAnchor="end" fontSize="10" fontWeight="700" fill="#ff7a59">
        meta {target.toLocaleString('pt-BR')} kg
      </text>
      {points.length > 1 && <motion.path d={area} fill="url(#wfill)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} />}
      {points.length > 1 && (
        <motion.path d={line} fill="none" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />
      )}
      {points.map((p, i) => (
        <motion.circle key={p.date} cx={x(i)} cy={y(p.kg)} r={i === points.length - 1 ? 6 : 3.5} fill="#fff" stroke="#10b981" strokeWidth="3" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + i * 0.05 }} />
      ))}
    </svg>
  )
}

export default function Progress() {
  const s = useStore()
  const goals = useGoals()
  const today = dayKey()
  const current = s.weights.at(-1)?.kg ?? s.profile.weightKg
  const start = s.weights[0]?.kg ?? s.profile.weightKg
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(current)

  // sequência de dias seguidos com registro
  let streak = 0
  const daysWith = new Set(s.entries.map((e) => e.date))
  for (let d = daysWith.has(today) ? today : addDays(today, -1); daysWith.has(d); d = addDays(d, -1)) streak++

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(today, i - 6)
    return { d, kcal: sumEntries(s.entries.filter((e) => e.date === d)).kcal }
  })
  const logged = week.filter((w) => w.kcal > 0)
  const avg = logged.length ? logged.reduce((a, w) => a + w.kcal, 0) / logged.length : 0
  const maxBar = Math.max(goals.kcal * 1.2, ...week.map((w) => w.kcal))

  const imc = bmi(current, s.profile.heightCm)
  const imcInfo = bmiLabel(imc)
  const totalDiff = Math.abs(start - s.profile.targetKg)
  const donePct = totalDiff > 0 ? Math.min(1, Math.max(0, Math.abs(start - current) / totalDiff)) : 1
  const weeks = weeksToGoal(s.profile, current)

  return (
    <div className="space-y-4 px-5 pt-6 pb-32">
      <h1 className="text-2xl font-extrabold">Progresso</h1>

      <div className="grid grid-cols-2 gap-4">
        <motion.div className="relative overflow-hidden rounded-[28px] bg-coral p-5 text-white shadow-lg shadow-coral/30" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
          <motion.div animate={{ scale: [1, 1.15, 1], rotate: [0, -6, 6, 0] }} transition={{ duration: 1.8, repeat: Infinity }} className="inline-block">
            <Flame size={30} fill="currentColor" />
          </motion.div>
          <div className="mt-2 text-4xl font-extrabold">
            <Num value={streak} />
          </div>
          <div className="text-sm font-semibold text-white/85">{streak === 1 ? 'dia seguido' : 'dias seguidos'}</div>
        </motion.div>
        <Card delay={0.05}>
          <Target size={28} className="text-leaf" />
          <div className="mt-2 text-4xl font-extrabold">
            <Num value={Math.round(donePct * 100)} />%
          </div>
          <div className="text-sm font-semibold text-mute">da meta de peso</div>
        </Card>
      </div>

      <Card delay={0.1}>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-bold text-mute">Peso atual</div>
            <div className="text-4xl font-extrabold tabular-nums">
              <Num value={current} digits={1} /> <span className="text-base font-semibold text-mute">kg</span>
            </div>
            <div className="text-xs font-semibold text-mute">
              {current === start ? 'Registre seu peso toda semana' : `${current < start ? '▼' : '▲'} ${Math.abs(current - start).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg desde o início`}
            </div>
          </div>
          <Tap
            onClick={() => {
              setDraft(current)
              setOpen(true)
            }}
            className="grad-leaf flex items-center gap-1 rounded-full px-4 py-2.5 text-sm font-extrabold text-forest shadow-md shadow-leaf/30"
          >
            <Plus size={16} strokeWidth={3} /> Pesar
          </Tap>
        </div>
        <div className="mt-3">
          <WeightChart points={s.weights.length ? s.weights.slice(-12) : [{ date: today, kg: current }]} target={s.profile.targetKg} />
        </div>
        {weeks > 0 && (
          <div className="mt-2 rounded-2xl bg-leaf/10 px-4 py-3 text-xs font-bold text-forest">
            🎯 No ritmo planejado, você chega em {s.profile.targetKg.toLocaleString('pt-BR')} kg em cerca de {weeks} semana{weeks === 1 ? '' : 's'}.
          </div>
        )}
      </Card>

      <Card delay={0.15}>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-sm font-bold text-mute">Calorias na semana</div>
            <div className="text-2xl font-extrabold tabular-nums">
              <Num value={Math.round(avg)} /> <span className="text-sm font-semibold text-mute">kcal/dia em média</span>
            </div>
          </div>
        </div>
        <div className="relative mt-4 flex h-36 items-end justify-between gap-2">
          <div className="absolute inset-x-0 border-t-2 border-dashed border-black/15" style={{ bottom: `${(goals.kcal / maxBar) * 100}%` }}>
            <span className="absolute -top-4 right-0 text-[10px] font-bold text-mute">meta</span>
          </div>
          {week.map((w, i) => {
            const over = w.kcal > goals.kcal * 1.05
            return (
              <div key={w.d} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <motion.div
                  className={`w-full rounded-xl ${w.kcal === 0 ? 'bg-black/5' : over ? 'bg-coral' : 'grad-leaf'}`}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(4, (w.kcal / maxBar) * 100)}%` }}
                  transition={{ delay: 0.2 + i * 0.05, type: 'spring', stiffness: 90, damping: 14 }}
                />
              </div>
            )
          })}
        </div>
        <div className="mt-2 flex justify-between gap-2">
          {week.map((w) => (
            <span key={w.d} className={`flex-1 text-center text-[11px] font-bold ${w.d === today ? 'text-leaf' : 'text-mute'}`}>
              {keyToDate(w.d).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
            </span>
          ))}
        </div>
      </Card>

      <Card delay={0.2}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-mute">IMC</div>
            <div className="text-3xl font-extrabold tabular-nums">
              <Num value={imc} digits={1} />
            </div>
          </div>
          <span className="rounded-full px-4 py-2 text-sm font-extrabold text-white" style={{ background: imcInfo.color }}>
            {imcInfo.label}
          </span>
        </div>
        <div className="relative mt-4 h-3 rounded-full" style={{ background: 'linear-gradient(90deg,#38bdf8 0%,#10b981 30%,#10b981 50%,#f59e0b 70%,#ff7a59 100%)' }}>
          <motion.div
            className="absolute -top-1.5 h-6 w-6 -translate-x-1/2 rounded-full border-4 border-white bg-ink shadow-md"
            initial={{ left: '0%' }}
            animate={{ left: `${Math.min(100, Math.max(0, ((imc - 15) / 20) * 100))}%` }}
            transition={{ type: 'spring', stiffness: 60, damping: 14 }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[10px] font-bold text-mute">
          <span>15</span>
          <span>18,5</span>
          <span>25</span>
          <span>30</span>
          <span>35</span>
        </div>
      </Card>

      <Sheet open={open} onClose={() => setOpen(false)} title="Registrar peso">
        <div className="space-y-5 pt-3">
          <div className="rounded-3xl bg-card p-5">
            <BigSlider label="Peso de hoje" unit="kg" min={35} max={200} step={0.1} digits={1} value={draft} onChange={setDraft} />
          </div>
          <Tap
            onClick={() => {
              s.logWeight(Math.round(draft * 10) / 10)
              setOpen(false)
            }}
            className="grad-leaf w-full rounded-full py-4 text-base font-extrabold text-forest shadow-lg shadow-leaf/30"
          >
            Salvar
          </Tap>
        </div>
      </Sheet>
    </div>
  )
}
