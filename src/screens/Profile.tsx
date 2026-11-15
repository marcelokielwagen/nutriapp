import { ChevronRight, Download, HeartPulse, RefreshCcw, SlidersHorizontal, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { BigSlider, Card, Sheet, Tap } from '../components/ui'
import { ACTIVITY_LEVELS, calcGoals } from '../lib/nutrition'
import { MEALS, useGoals, useStore } from '../store'

function Row({ icon, title, desc, onClick, danger }: { icon: ReactNode; title: string; desc?: string; onClick: () => void; danger?: boolean }) {
  return (
    <Tap onClick={onClick} className="flex w-full items-center gap-3 py-3 text-left">
      <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${danger ? 'bg-coral/12 text-coral' : 'bg-bg text-forest'}`}>{icon}</span>
      <span className="flex-1">
        <span className={`block text-sm font-extrabold ${danger ? 'text-coral' : ''}`}>{title}</span>
        {desc && <span className="block text-xs text-mute">{desc}</span>}
      </span>
      <ChevronRight size={18} className="text-mute" />
    </Tap>
  )
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${on ? 'bg-leaf' : 'bg-black/15'}`}>
      <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? 'left-7' : 'left-1'}`} />
    </button>
  )
}

export default function Profile() {
  const s = useStore()
  const goals = useGoals()
  const auto = calcGoals(s.profile)
  const [sheet, setSheet] = useState<'goals' | 'health' | 'reset' | null>(null)
  const [draft, setDraft] = useState({ kcal: goals.kcal, protein: goals.protein, carbs: goals.carbs, fat: goals.fat })
  const activity = ACTIVITY_LEVELS.find((a) => a.v === s.profile.activity)
  const goalLabel = { lose: 'Perder peso', maintain: 'Manter o peso', gain: 'Ganhar massa' }[s.profile.goal]

  const exportCsv = () => {
    const mealName = Object.fromEntries(MEALS.map((m) => [m.id, m.label]))
    const n = (v: number) => v.toFixed(1).replace('.', ',')
    const rows = [
      ['Data', 'Refeição', 'Alimento', 'Gramas', 'kcal', 'Proteína (g)', 'Carboidrato (g)', 'Gordura (g)', 'Fibra (g)'],
      ...[...s.entries].sort((a, b) => a.date.localeCompare(b.date)).map((e) => [e.date, mealName[e.meal], e.name, n(e.grams), n(e.kcal), n(e.p), n(e.c), n(e.f), n(e.fiber)]),
    ]
    const csv = '﻿' + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    a.download = 'meu-diario-alimentar.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="space-y-4 px-5 pt-6 pb-32">
      <h1 className="text-2xl font-extrabold">Perfil</h1>

      <div className="grad-forest rounded-[32px] p-6 text-white shadow-xl shadow-forest/25">
        <div className="flex items-center gap-4">
          <div className="grad-leaf flex h-16 w-16 items-center justify-center rounded-3xl text-3xl">{s.profile.sex === 'f' ? '👩' : '👨'}</div>
          <div>
            <div className="text-lg font-extrabold">{goalLabel}</div>
            <div className="text-sm text-white/70">
              {s.profile.age} anos · {s.profile.heightCm} cm · {activity?.title}
            </div>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          {[
            ['Atual', `${s.profile.weightKg.toLocaleString('pt-BR')} kg`],
            ['Meta', `${s.profile.targetKg.toLocaleString('pt-BR')} kg`],
            ['Por dia', `${goals.kcal} kcal`],
          ].map(([label, v]) => (
            <div key={label} className="rounded-2xl bg-white/10 py-3">
              <div className="text-base font-extrabold">{v}</div>
              <div className="text-xs text-white/70">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <Card delay={0.05} className="!py-2">
        <Row icon={<RefreshCcw size={18} />} title="Refazer meu plano" desc="Mudar objetivo, peso, altura ou rotina" onClick={s.redoPlan} />
        <Row
          icon={<SlidersHorizontal size={18} />}
          title="Ajustar calorias e macros"
          desc={s.override ? 'Usando metas personalizadas' : 'Usando metas calculadas pelo app'}
          onClick={() => {
            setDraft({ kcal: goals.kcal, protein: goals.protein, carbs: goals.carbs, fat: goals.fat })
            setSheet('goals')
          }}
        />
        <div className="flex items-center gap-3 py-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-bg text-xl">🔥</span>
          <span className="flex-1">
            <span className="block text-sm font-extrabold">Somar exercício à meta</span>
            <span className="block text-xs text-mute">Calorias gastas aumentam o que você pode comer no dia</span>
          </span>
          <Toggle on={s.addExerciseToGoal} onChange={s.setAddExercise} label="Somar exercício à meta" />
        </div>
      </Card>

      <Card delay={0.1} className="!py-2">
        <Row icon={<HeartPulse size={18} />} title="Dados de saúde" desc="Apple Saúde e Health Connect (Android)" onClick={() => setSheet('health')} />
        <Row icon={<Download size={18} />} title="Exportar meu diário" desc={`Planilha com ${s.entries.length} registro${s.entries.length === 1 ? '' : 's'}`} onClick={exportCsv} />
        <Row icon={<Trash2 size={18} />} title="Apagar tudo e recomeçar" onClick={() => setSheet('reset')} danger />
      </Card>

      <p className="px-2 text-center text-xs text-mute">NutriApp · versão inicial. Os valores são estimativas e não substituem orientação de nutricionista ou médico.</p>

      <Sheet open={sheet === 'goals'} onClose={() => setSheet(null)} title="Metas diárias">
        <div className="space-y-4 pt-2">
          <div className="space-y-6 rounded-3xl bg-card p-5">
            <BigSlider label="Calorias" unit="kcal" min={1000} max={4500} step={10} value={draft.kcal} onChange={(v) => setDraft({ ...draft, kcal: v })} />
            <BigSlider label="Proteína" unit="g" min={30} max={300} value={draft.protein} onChange={(v) => setDraft({ ...draft, protein: v })} />
            <BigSlider label="Carboidrato" unit="g" min={20} max={600} value={draft.carbs} onChange={(v) => setDraft({ ...draft, carbs: v })} />
            <BigSlider label="Gordura" unit="g" min={20} max={200} value={draft.fat} onChange={(v) => setDraft({ ...draft, fat: v })} />
          </div>
          <div className="rounded-2xl bg-leaf/10 px-4 py-3 text-xs font-bold text-forest">
            Os macros escolhidos somam {draft.protein * 4 + draft.carbs * 4 + draft.fat * 9} kcal (proteína e carbo = 4 kcal/g, gordura = 9 kcal/g).
          </div>
          <Tap
            onClick={() => {
              s.setOverride(draft)
              setSheet(null)
            }}
            className="grad-leaf w-full rounded-full py-4 text-base font-extrabold text-forest shadow-lg shadow-leaf/30"
          >
            Salvar metas
          </Tap>
          <Tap
            onClick={() => {
              s.setOverride(null)
              setSheet(null)
            }}
            className="w-full rounded-full bg-card py-3.5 text-sm font-extrabold"
          >
            Voltar ao cálculo do app ({auto.kcal} kcal)
          </Tap>
        </div>
      </Sheet>

      <Sheet open={sheet === 'health'} onClose={() => setSheet(null)} title="Dados de saúde">
        <div className="space-y-3 pt-2">
          {[
            ['🍎', 'Apple Saúde', 'iPhone e Apple Watch'],
            ['🤖', 'Health Connect', 'Android, Samsung Health, Garmin, Fitbit'],
          ].map(([emoji, title, desc]) => (
            <div key={title} className="flex items-center gap-3 rounded-3xl bg-card p-4">
              <span className="text-3xl">{emoji}</span>
              <span className="flex-1">
                <span className="block text-sm font-extrabold">{title}</span>
                <span className="block text-xs text-mute">{desc}</span>
              </span>
              <span className="rounded-full bg-carb/15 px-3 py-1.5 text-[11px] font-extrabold text-carb">Na versão de loja</span>
            </div>
          ))}
          <div className="rounded-3xl bg-leaf/10 p-4 text-sm text-forest">
            <b>Como vai funcionar:</b> quando o app estiver instalado pelo App Store / Google Play, ele poderá importar sozinho <b>passos, treinos, calorias gastas e peso</b>. Isso só é possível em app instalado no celular, não nesta versão de navegador.
            <br />
            <br />
            Por enquanto, registre passos e treinos no cartão <b>Atividade</b> e o peso em <b>Progresso</b>.
          </div>
        </div>
      </Sheet>

      <Sheet open={sheet === 'reset'} onClose={() => setSheet(null)} title="Apagar tudo?">
        <div className="space-y-3 pt-2">
          <p className="text-center text-sm text-mute">Isso apaga seu plano, refeições, pesos e alimentos criados neste aparelho. Não dá para desfazer.</p>
          <Tap
            onClick={() => {
              s.reset()
              setSheet(null)
            }}
            className="w-full rounded-full bg-coral py-4 text-base font-extrabold text-white"
          >
            Sim, apagar tudo
          </Tap>
          <Tap onClick={() => setSheet(null)} className="w-full rounded-full bg-card py-3.5 text-sm font-extrabold">
            Cancelar
          </Tap>
        </div>
      </Sheet>
    </div>
  )
}
