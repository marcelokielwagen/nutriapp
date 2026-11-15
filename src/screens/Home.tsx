import { AnimatePresence, motion } from 'framer-motion'
import { Droplets, Flame, Footprints, Minus, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { Bar, BigSlider, Card, Num, Ring, Sheet, Tap } from '../components/ui'
import { addDays, dayKey, EXERCISES, exerciseKcal, keyToDate, stepsKcal } from '../lib/nutrition'
import { MEALS, sumEntries, useGoals, useStore, type Meal } from '../store'

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

export default function Home({ date, setDate, onAdd }: { date: string; setDate: (d: string) => void; onAdd: (meal: Meal) => void }) {
  const s = useStore()
  const goals = useGoals()
  const today = dayKey()
  const entries = s.entries.filter((e) => e.date === date)
  const total = sumEntries(entries)
  const exercises = s.exercises.filter((e) => e.date === date)
  const steps = s.steps[date] ?? 0
  const burned = exercises.reduce((a, e) => a + e.kcal, 0) + stepsKcal(steps, s.profile.weightKg)
  const goalKcal = goals.kcal + (s.addExerciseToGoal ? burned : 0)
  const remaining = Math.round(goalKcal - total.kcal)
  const over = remaining < 0
  const water = s.water[date] ?? 0
  const [actOpen, setActOpen] = useState(false)
  const [ex, setEx] = useState(EXERCISES[0])
  const [minutes, setMinutes] = useState(30)
  const [stepsDraft, setStepsDraft] = useState(steps)

  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6))
  const waterPct = Math.min(1, water / goals.waterMl)

  return (
    <div className="space-y-4 px-5 pt-6 pb-32">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-semibold text-mute">{greeting()} 👋</p>
          <h1 className="text-2xl font-extrabold">
            {date === today ? 'Hoje' : keyToDate(date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
          </h1>
        </div>
      </div>

      {/* Semana */}
      <div className="flex justify-between">
        {days.map((d) => {
          const dt = keyToDate(d)
          const active = d === date
          const has = s.entries.some((e) => e.date === d)
          return (
            <Tap
              key={d}
              onClick={() => setDate(d)}
              className={`relative flex h-16 w-11 flex-col items-center justify-center rounded-2xl text-sm font-bold transition-colors ${active ? 'text-white' : 'text-ink'}`}
            >
              {active && <motion.div layoutId="day" className="grad-forest absolute inset-0 rounded-2xl" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
              <span className={`relative text-[11px] ${active ? 'text-white/70' : 'text-mute'}`}>{WEEKDAYS[dt.getDay()]}</span>
              <span className="relative">{dt.getDate()}</span>
              <span className={`relative mt-0.5 h-1.5 w-1.5 rounded-full ${has ? (active ? 'bg-lime' : 'bg-leaf') : 'bg-transparent'}`} />
            </Tap>
          )
        })}
      </div>

      {/* Calorias */}
      <motion.div
        className="grad-forest relative overflow-hidden rounded-[32px] p-6 text-white shadow-xl shadow-forest/25"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="flex items-center justify-between">
          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold text-white/60">Consumidas</div>
              <div className="text-xl font-extrabold tabular-nums">
                <Num value={Math.round(total.kcal)} /> <span className="text-xs font-semibold text-white/60">kcal</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-xs font-semibold text-white/60">
                <Flame size={12} /> Gastas
              </div>
              <div className="text-xl font-extrabold tabular-nums">
                <Num value={burned} /> <span className="text-xs font-semibold text-white/60">kcal</span>
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-white/60">Meta</div>
              <div className="text-xl font-extrabold tabular-nums">
                <Num value={goalKcal} /> <span className="text-xs font-semibold text-white/60">kcal</span>
              </div>
            </div>
          </div>
          <Ring id="kcal" value={total.kcal} max={goalKcal} size={176} stroke={16} from={over ? '#ff7a59' : '#b4f04a'} to={over ? '#ffb199' : '#34d399'}>
            <Num value={Math.abs(remaining)} className="text-4xl font-extrabold tabular-nums" />
            <span className="text-xs font-semibold text-white/70">{over ? 'kcal acima' : 'kcal restantes'}</span>
          </Ring>
        </div>
      </motion.div>

      {/* Macros */}
      <Card delay={0.05}>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Proteína', v: total.p, max: goals.protein, color: 'var(--color-protein)' },
            { label: 'Carbo', v: total.c, max: goals.carbs, color: 'var(--color-carb)' },
            { label: 'Gordura', v: total.f, max: goals.fat, color: 'var(--color-fat)' },
          ].map((m) => (
            <div key={m.label}>
              <div className="mb-1 text-xs font-bold text-mute">{m.label}</div>
              <div className="mb-2 text-sm font-extrabold tabular-nums">
                <Num value={Math.round(m.v)} />
                <span className="font-semibold text-mute"> / {m.max}g</span>
              </div>
              <Bar value={m.v} max={m.max} color={m.color} />
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3 border-t border-black/5 pt-3 text-xs font-bold text-mute">
          🌾 Fibras
          <div className="flex-1">
            <Bar value={total.fiber} max={goals.fiber} color="var(--color-leaf)" />
          </div>
          <span className="text-ink tabular-nums">
            {Math.round(total.fiber)} / {goals.fiber}g
          </span>
        </div>
      </Card>

      {/* Refeições */}
      {MEALS.map((meal, i) => {
        const list = entries.filter((e) => e.meal === meal.id)
        const kcal = Math.round(list.reduce((a, e) => a + e.kcal, 0))
        return (
          <Card key={meal.id} delay={0.08 + i * 0.04} className="!p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bg text-2xl">{meal.emoji}</div>
              <div className="flex-1">
                <div className="font-extrabold">{meal.label}</div>
                <div className="text-xs font-semibold text-mute">{list.length ? `${kcal} kcal · ${list.length} ${list.length > 1 ? 'itens' : 'item'}` : 'Nada registrado'}</div>
              </div>
              <Tap label={`Adicionar em ${meal.label}`} onClick={() => onAdd(meal.id)} className="grad-leaf flex h-11 w-11 items-center justify-center rounded-full text-forest shadow-md shadow-leaf/30">
                <Plus size={22} strokeWidth={3} />
              </Tap>
            </div>
            <AnimatePresence initial={false}>
              {list.map((e) => (
                <motion.div
                  key={e.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 flex items-center gap-3 rounded-2xl bg-bg px-3 py-2.5">
                    <span className="text-xl">{e.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold">{e.name}</div>
                      <div className="text-xs text-mute">
                        {Math.round(e.grams)} g · P {Math.round(e.p)} · C {Math.round(e.c)} · G {Math.round(e.f)}
                      </div>
                    </div>
                    <span className="text-sm font-extrabold tabular-nums">{Math.round(e.kcal)}</span>
                    <Tap label={`Remover ${e.name}`} onClick={() => s.removeEntry(e.id)} className="flex h-7 w-7 items-center justify-center rounded-full bg-black/5 text-mute">
                      <X size={14} />
                    </Tap>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </Card>
        )
      })}

      {/* Água + Atividade */}
      <div className="grid grid-cols-2 gap-4">
        <Card delay={0.25} className="relative overflow-hidden !p-4">
          <motion.div className="absolute inset-x-0 bottom-0 bg-water/20" animate={{ height: `${waterPct * 100}%` }} transition={{ type: 'spring', stiffness: 50, damping: 14 }}>
            <svg className="wave absolute -top-3 left-0 h-4 w-[200%] text-water/20" viewBox="0 0 400 20" preserveAspectRatio="none">
              <path d="M0 10 Q25 0 50 10 T100 10 T150 10 T200 10 T250 10 T300 10 T350 10 T400 10 V20 H0Z" fill="currentColor" />
            </svg>
          </motion.div>
          <div className="relative">
            <div className="flex items-center gap-2 text-sm font-extrabold">
              <Droplets size={16} className="text-water" /> Água
            </div>
            <div className="mt-2 text-2xl font-extrabold tabular-nums">
              <Num value={water / 1000} digits={2} />
              <span className="text-sm font-semibold text-mute"> / {(goals.waterMl / 1000).toLocaleString('pt-BR')} L</span>
            </div>
            <div className="mt-3 flex gap-2">
              <Tap label="Remover um copo de água" onClick={() => s.addWater(date, -250)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-mute">
                <Minus size={16} />
              </Tap>
              <Tap onClick={() => s.addWater(date, 250)} className="flex h-10 flex-1 items-center justify-center gap-1 rounded-full bg-water text-sm font-extrabold text-white shadow-md shadow-water/40">
                <Plus size={16} strokeWidth={3} /> copo
              </Tap>
            </div>
          </div>
        </Card>

        <Card delay={0.3} className="!p-4">
          <div className="flex items-center gap-2 text-sm font-extrabold">
            <Footprints size={16} className="text-coral" /> Atividade
          </div>
          <div className="mt-2 text-2xl font-extrabold tabular-nums">
            <Num value={burned} />
            <span className="text-sm font-semibold text-mute"> kcal</span>
          </div>
          <div className="text-xs font-semibold text-mute">
            {steps.toLocaleString('pt-BR')} passos · {exercises.length} treino{exercises.length === 1 ? '' : 's'}
          </div>
          <Tap
            onClick={() => {
              setStepsDraft(steps)
              setActOpen(true)
            }}
            className="mt-2 flex h-10 w-full items-center justify-center gap-1 rounded-full bg-coral text-sm font-extrabold text-white shadow-md shadow-coral/40"
          >
            <Plus size={16} strokeWidth={3} /> registrar
          </Tap>
        </Card>
      </div>

      <Sheet open={actOpen} onClose={() => setActOpen(false)} title="Atividade">
        <div className="space-y-5 pt-2">
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
            {EXERCISES.map((e) => (
              <Tap
                key={e.name}
                onClick={() => setEx(e)}
                className={`flex shrink-0 flex-col items-center gap-1 rounded-2xl border-2 px-4 py-3 text-xs font-bold ${ex.name === e.name ? 'border-coral bg-coral/10' : 'border-transparent bg-card'}`}
              >
                <span className="text-2xl">{e.emoji}</span>
                {e.name}
              </Tap>
            ))}
          </div>
          <div className="rounded-3xl bg-card p-5">
            <BigSlider label="Duração" unit="min" min={5} max={180} step={5} value={minutes} onChange={setMinutes} />
            <div className="mt-3 text-center text-sm font-bold text-coral">≈ {exerciseKcal(ex.met, s.profile.weightKg, minutes)} kcal gastas</div>
          </div>
          <Tap
            onClick={() => {
              s.addExercise({ date, name: ex.name, emoji: ex.emoji, minutes, kcal: exerciseKcal(ex.met, s.profile.weightKg, minutes) })
              setActOpen(false)
            }}
            className="w-full rounded-full bg-coral py-4 text-base font-extrabold text-white shadow-lg shadow-coral/30"
          >
            Adicionar {ex.name.toLowerCase()}
          </Tap>

          {exercises.length > 0 && (
            <div className="space-y-2">
              {exercises.map((e) => (
                <div key={e.id} className="flex items-center gap-3 rounded-2xl bg-card px-3 py-2.5">
                  <span className="text-xl">{e.emoji}</span>
                  <div className="flex-1 text-sm font-bold">
                    {e.name} <span className="font-semibold text-mute">· {e.minutes} min</span>
                  </div>
                  <span className="text-sm font-extrabold">{e.kcal} kcal</span>
                  <Tap label={`Remover ${e.name}`} onClick={() => s.removeExercise(e.id)} className="flex h-7 w-7 items-center justify-center rounded-full bg-black/5 text-mute">
                    <X size={14} />
                  </Tap>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-3xl bg-card p-5">
            <BigSlider
              label="Passos do dia"
              unit="passos"
              min={0}
              max={30000}
              step={500}
              value={stepsDraft}
              onChange={(v) => {
                setStepsDraft(v)
                s.setSteps(date, v)
              }}
            />
            <p className="mt-3 text-xs text-mute">Na versão para celular, os passos virão sozinhos do Apple Saúde ou Health Connect.</p>
          </div>
        </div>
      </Sheet>
    </div>
  )
}
