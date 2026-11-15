import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { BigSlider, Num, Ring, Tap } from '../components/ui'
import { ACTIVITY_LEVELS, calcGoals, weeksToGoal, type Goal, type Profile } from '../lib/nutrition'
import { useStore } from '../store'

const GOALS: { id: Goal; emoji: string; title: string; desc: string }[] = [
  { id: 'lose', emoji: '🔥', title: 'Perder peso', desc: 'Emagrecer com saúde' },
  { id: 'maintain', emoji: '⚖️', title: 'Manter o peso', desc: 'Comer melhor e ter equilíbrio' },
  { id: 'gain', emoji: '💪', title: 'Ganhar massa', desc: 'Aumentar peso e músculos' },
]

function Choice({ active, emoji, title, desc, onClick }: { active: boolean; emoji: string; title: string; desc?: string; onClick: () => void }) {
  return (
    <Tap
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-3xl border-2 p-4 text-left transition-colors ${active ? 'border-leaf bg-leaf/10' : 'border-transparent bg-card'} soft-shadow`}
    >
      <span className="text-3xl">{emoji}</span>
      <span className="flex-1">
        <span className="block text-base font-bold">{title}</span>
        {desc && <span className="block text-sm text-mute">{desc}</span>}
      </span>
      <span className={`h-5 w-5 rounded-full border-2 ${active ? 'border-leaf bg-leaf' : 'border-black/15'}`} />
    </Tap>
  )
}

export default function Onboarding() {
  const saved = useStore((s) => s.profile)
  const finish = useStore((s) => s.finishOnboarding)
  const [step, setStep] = useState(0)
  const [p, setP] = useState<Profile>(saved)
  const up = (patch: Partial<Profile>) => setP((old) => ({ ...old, ...patch }))

  const hasTarget = p.goal !== 'maintain'
  const steps = ['welcome', 'goal', 'sex', 'body', ...(hasTarget ? ['target'] : []), 'activity', 'plan']
  const name = steps[step]
  const last = step === steps.length - 1
  const goals = calcGoals(p)
  const weeks = weeksToGoal(p, p.weightKg)

  const next = () => {
    if (name === 'goal' || name === 'body') {
      // mantém a meta de peso coerente com o objetivo
      if (p.goal === 'lose' && p.targetKg >= p.weightKg) up({ targetKg: Math.round(p.weightKg * 0.92) })
      if (p.goal === 'gain' && p.targetKg <= p.weightKg) up({ targetKg: Math.round(p.weightKg * 1.06) })
    }
    if (last) finish(p.goal === 'maintain' ? { ...p, targetKg: p.weightKg } : p)
    else setStep(step + 1)
  }

  return (
    <div className="flex h-full flex-col bg-bg">
      <div className="flex items-center gap-3 px-5 pt-6">
        {step > 0 ? (
          <Tap label="Voltar" onClick={() => setStep(step - 1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-card soft-shadow">
            <ArrowLeft size={18} />
          </Tap>
        ) : (
          <div className="h-10 w-10" />
        )}
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/8">
          <motion.div className="grad-leaf h-full rounded-full" animate={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>
        <div className="w-10 text-right text-xs font-bold text-mute">
          {step + 1}/{steps.length}
        </div>
      </div>

      <div className="no-scrollbar relative min-h-0 flex-1 overflow-y-auto px-6 pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={name}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.22 }}
            className="pb-6"
          >
            {name === 'welcome' && (
              <div className="flex flex-col items-center pt-8 text-center">
                <motion.div
                  className="grad-leaf flex h-36 w-36 items-center justify-center rounded-[44px] text-7xl shadow-xl shadow-leaf/30"
                  animate={{ rotate: [0, -6, 6, 0], y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  🥗
                </motion.div>
                <h1 className="mt-10 text-4xl leading-tight font-extrabold">
                  Coma melhor,
                  <br />
                  <span className="text-leaf">sem complicação</span>
                </h1>
                <p className="mt-4 max-w-xs text-base text-mute">
                  Tire uma foto do prato e o app calcula calorias e nutrientes para você. Vamos montar seu plano em menos de 1 minuto.
                </p>
              </div>
            )}

            {name === 'goal' && (
              <>
                <h1 className="text-3xl font-extrabold">Qual é o seu objetivo?</h1>
                <p className="mt-1 mb-6 text-mute">Isso define sua meta diária de calorias.</p>
                <div className="space-y-3">
                  {GOALS.map((g) => (
                    <Choice key={g.id} active={p.goal === g.id} emoji={g.emoji} title={g.title} desc={g.desc} onClick={() => up({ goal: g.id })} />
                  ))}
                </div>
              </>
            )}

            {name === 'sex' && (
              <>
                <h1 className="text-3xl font-extrabold">Sexo biológico</h1>
                <p className="mt-1 mb-6 text-mute">Usado apenas no cálculo do seu gasto de energia.</p>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      ['f', '👩', 'Feminino'],
                      ['m', '👨', 'Masculino'],
                    ] as const
                  ).map(([id, emoji, label]) => (
                    <Tap
                      key={id}
                      onClick={() => up({ sex: id })}
                      className={`soft-shadow flex flex-col items-center gap-3 rounded-3xl border-2 py-8 ${p.sex === id ? 'border-leaf bg-leaf/10' : 'border-transparent bg-card'}`}
                    >
                      <span className="text-6xl">{emoji}</span>
                      <span className="font-bold">{label}</span>
                    </Tap>
                  ))}
                </div>
              </>
            )}

            {name === 'body' && (
              <>
                <h1 className="text-3xl font-extrabold">Sobre você</h1>
                <p className="mt-1 mb-6 text-mute">Arraste para ajustar.</p>
                <div className="soft-shadow space-y-7 rounded-3xl bg-card p-5">
                  <BigSlider label="Idade" unit="anos" min={14} max={90} value={p.age} onChange={(v) => up({ age: v })} />
                  <BigSlider label="Altura" unit="cm" min={130} max={210} value={p.heightCm} onChange={(v) => up({ heightCm: v })} />
                  <BigSlider label="Peso atual" unit="kg" min={35} max={200} step={0.5} digits={1} value={p.weightKg} onChange={(v) => up({ weightKg: v })} />
                </div>
              </>
            )}

            {name === 'target' && (
              <>
                <h1 className="text-3xl font-extrabold">Sua meta de peso</h1>
                <p className="mt-1 mb-6 text-mute">Ritmos mais suaves são mais fáceis de manter.</p>
                <div className="soft-shadow space-y-7 rounded-3xl bg-card p-5">
                  <BigSlider
                    label="Peso desejado"
                    unit="kg"
                    min={p.goal === 'lose' ? 35 : Math.ceil(p.weightKg)}
                    max={p.goal === 'lose' ? Math.floor(p.weightKg) : 200}
                    step={0.5}
                    digits={1}
                    value={p.targetKg}
                    onChange={(v) => up({ targetKg: v })}
                  />
                  <BigSlider label="Ritmo" unit="kg/semana" min={0.25} max={1} step={0.25} digits={2} value={p.paceKgWeek} onChange={(v) => up({ paceKgWeek: v })} />
                </div>
                <div className="mt-4 rounded-3xl bg-leaf/10 p-4 text-sm font-semibold text-forest">
                  ⏱️ Nesse ritmo você chega lá em cerca de <b>{weeks} semanas</b>.
                </div>
              </>
            )}

            {name === 'activity' && (
              <>
                <h1 className="text-3xl font-extrabold">Seu dia a dia</h1>
                <p className="mt-1 mb-6 text-mute">Quanto você se movimenta?</p>
                <div className="space-y-3">
                  {ACTIVITY_LEVELS.map((a) => (
                    <Choice key={a.v} active={p.activity === a.v} emoji={a.emoji} title={a.title} desc={a.desc} onClick={() => up({ activity: a.v })} />
                  ))}
                </div>
              </>
            )}

            {name === 'plan' && (
              <div className="flex flex-col items-center">
                <div className="mb-1 flex items-center gap-2 text-sm font-bold text-leaf">
                  <Sparkles size={16} /> Seu plano está pronto
                </div>
                <h1 className="text-center text-3xl font-extrabold">Meta diária</h1>
                <div className="grad-forest mt-6 flex w-full flex-col items-center rounded-[32px] p-6 text-white">
                  <Ring id="ob" value={1} max={1} size={190}>
                    <Num value={goals.kcal} className="text-5xl font-extrabold tabular-nums" />
                    <span className="text-sm font-semibold text-white/70">kcal por dia</span>
                  </Ring>
                  <div className="mt-6 grid w-full grid-cols-3 gap-2 text-center">
                    {[
                      ['Proteína', goals.protein, 'bg-protein'],
                      ['Carboidrato', goals.carbs, 'bg-carb'],
                      ['Gordura', goals.fat, 'bg-fat'],
                    ].map(([label, v, color]) => (
                      <div key={label as string} className="rounded-2xl bg-white/10 p-3">
                        <div className={`mx-auto mb-2 h-1.5 w-8 rounded-full ${color}`} />
                        <div className="text-xl font-extrabold">{v}g</div>
                        <div className="text-xs text-white/70">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 grid w-full grid-cols-2 gap-3 text-sm">
                  <div className="soft-shadow rounded-3xl bg-card p-4">
                    💧 <b>{(goals.waterMl / 1000).toLocaleString('pt-BR')} L</b> de água
                  </div>
                  <div className="soft-shadow rounded-3xl bg-card p-4">
                    🌾 <b>{goals.fiber} g</b> de fibras
                  </div>
                </div>
                <p className="mt-4 text-center text-xs text-mute">
                  Seu corpo gasta cerca de {goals.tdee.toLocaleString('pt-BR')} kcal por dia. Valores estimados; não substituem orientação de nutricionista ou médico.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-6 pt-2 pb-7">
        <Tap onClick={next} className="grad-leaf flex w-full items-center justify-center gap-2 rounded-full py-4 text-lg font-extrabold text-forest shadow-lg shadow-leaf/30">
          {name === 'welcome' ? 'Começar' : last ? 'Usar meu plano' : 'Continuar'} <ArrowRight size={20} />
        </Tap>
      </div>
    </div>
  )
}
