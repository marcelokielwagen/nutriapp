import { AnimatePresence, motion } from 'framer-motion'
import { Camera, Check, Mic, PencilLine, Plus, ScanBarcode, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { BigSlider, Sheet, Tap } from '../components/ui'
import { FOODS, POPULAR, searchFoods, TACO_FOODS, type Food } from '../lib/foods'
import { GRADE_INFO, gradeFood } from '../lib/nutrition'
import { MEALS, useStore, type Meal } from '../store'

export function MealChips({ meal, setMeal }: { meal: Meal; setMeal: (m: Meal) => void }) {
  return (
    <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
      {MEALS.map((m) => (
        <Tap
          key={m.id}
          onClick={() => setMeal(m.id)}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors ${meal === m.id ? 'bg-forest text-white' : 'bg-card text-ink'}`}
        >
          {m.emoji} {m.label}
        </Tap>
      ))}
    </div>
  )
}

export default function AddFood({
  open,
  onClose,
  date,
  meal,
  setMeal,
  onCamera,
  onBarcode,
  onVoice,
}: {
  onBarcode: () => void
  onVoice: () => void
  open: boolean
  onClose: () => void
  date: string
  meal: Meal
  setMeal: (m: Meal) => void
  onCamera: () => void
}) {
  const addEntry = useStore((s) => s.addEntry)
  const customFoods = useStore((s) => s.customFoods)
  const addCustomFood = useStore((s) => s.addCustomFood)
  const [q, setQ] = useState('')
  const [openFood, setOpenFood] = useState<string | null>(null)
  const [grams, setGrams] = useState(100)
  const [added, setAdded] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState({ name: '', kcal: '', p: '', c: '', f: '', portion: '100' })

  // ordem de prioridade: meus alimentos, lista principal (com porções do dia a dia), tabela TACO completa
  const all = useMemo(() => [...customFoods, ...FOODS, ...TACO_FOODS], [customFoods])
  const list = useMemo(() => {
    if (q.trim()) return searchFoods(all, q)
    // sem busca: os que a pessoa mais usa primeiro, depois os populares
    // (a ordem só é recalculada quando o painel abre, para a lista não "pular" enquanto a pessoa adiciona)
    const recentNames = [...new Set([...useStore.getState().entries].reverse().map((e) => e.name))].slice(0, 6)
    const names = [...new Set([...customFoods.map((f) => f.name), ...recentNames, ...POPULAR])]
    return names.map((n) => all.find((f) => f.name === n)).filter((f): f is Food => !!f)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, all, customFoods, open])

  const add = (f: Food, g: number) => {
    const k = g / 100
    addEntry({ date, meal, name: f.name, emoji: f.emoji, grams: g, kcal: f.kcal * k, p: f.p * k, c: f.c * k, f: f.f * k, fiber: f.fiber * k })
    setAdded((a) => [...a, f.name])
    setOpenFood(null)
    setTimeout(() => setAdded((a) => a.filter((n) => n !== f.name)), 1400)
  }

  const saveCustom = () => {
    const num = (v: string) => Number(v.replace(',', '.')) || 0
    if (!draft.name.trim() || num(draft.kcal) <= 0) return
    const f: Food = {
      name: draft.name.trim(),
      emoji: '🍴',
      kcal: num(draft.kcal),
      p: num(draft.p),
      c: num(draft.c),
      f: num(draft.f),
      fiber: 0,
      portion: num(draft.portion) || 100,
      unit: 'porção',
    }
    addCustomFood(f)
    setCreating(false)
    setDraft({ name: '', kcal: '', p: '', c: '', f: '', portion: '100' })
    setQ(f.name)
  }

  return (
    <Sheet open={open} onClose={onClose} full>
      <div className="space-y-4 pt-1">
        <MealChips meal={meal} setMeal={setMeal} />

        <Tap onClick={onCamera} className="grad-forest relative flex w-full items-center gap-4 overflow-hidden rounded-[28px] p-5 text-left text-white shadow-xl shadow-forest/25">
          <motion.div
            className="grad-leaf flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-forest"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Camera size={28} />
          </motion.div>
          <div>
            <div className="text-lg font-extrabold">Tirar foto do prato</div>
            <div className="text-sm text-white/70">A IA identifica os alimentos e calcula tudo</div>
          </div>
        </Tap>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Código de barras', desc: 'Embalagens', icon: <ScanBarcode size={24} />, go: onBarcode },
            { label: 'Falar', desc: 'Diga o que comeu', icon: <Mic size={24} />, go: onVoice },
          ].map((b) => (
            <Tap key={b.label} onClick={b.go} className="soft-shadow flex items-center gap-3 rounded-3xl bg-card px-4 py-3.5 text-left">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-leaf/12 text-leaf">{b.icon}</span>
              <span className="min-w-0">
                <span className="block text-sm leading-tight font-extrabold">{b.label}</span>
                <span className="block text-xs text-mute">{b.desc}</span>
              </span>
            </Tap>
          ))}
        </div>

        <div className="flex gap-2">
          <label className="soft-shadow flex h-13 flex-1 items-center gap-3 rounded-full bg-card px-4 py-3.5">
            <Search size={18} className="text-mute" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar alimento…"
              aria-label="Buscar alimento"
              className="w-full bg-transparent text-base font-semibold outline-none placeholder:text-mute/70"
            />
          </label>
          <Tap label="Criar alimento" onClick={() => setCreating((v) => !v)} className={`soft-shadow flex w-13 items-center justify-center rounded-full ${creating ? 'bg-forest text-white' : 'bg-card'}`}>
            <PencilLine size={18} />
          </Tap>
        </div>

        <AnimatePresence initial={false}>
          {creating && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="space-y-3 rounded-3xl bg-card p-4">
                <div className="text-sm font-extrabold">Criar meu alimento (valores por 100 g)</div>
                <input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="Nome do alimento"
                  className="w-full rounded-2xl bg-bg px-4 py-3 text-sm font-semibold outline-none"
                />
                <div className="grid grid-cols-5 gap-2">
                  {(
                    [
                      ['kcal', 'kcal'],
                      ['p', 'Prot.'],
                      ['c', 'Carbo'],
                      ['f', 'Gord.'],
                      ['portion', 'Porção g'],
                    ] as const
                  ).map(([k, label]) => (
                    <label key={k} className="text-center text-[11px] font-bold text-mute">
                      {label}
                      <input
                        inputMode="decimal"
                        value={draft[k]}
                        onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
                        className="mt-1 w-full rounded-xl bg-bg px-1 py-2.5 text-center text-sm font-bold text-ink outline-none"
                      />
                    </label>
                  ))}
                </div>
                <Tap onClick={saveCustom} className="grad-leaf w-full rounded-full py-3 text-sm font-extrabold text-forest">
                  Salvar alimento
                </Tap>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-xs font-extrabold tracking-wide text-mute uppercase">{q.trim() ? `${list.length} resultado${list.length === 1 ? '' : 's'}` : 'Sugestões para você'}</div>

        <div className="space-y-2">
          {list.map((f) => {
            const grade = GRADE_INFO[gradeFood(f.kcal, f.p, f.c, f.f, f.fiber)]
            const isOpen = openFood === f.name
            const done = added.includes(f.name)
            const k = grams / 100
            return (
              <motion.div key={f.name} layout className="soft-shadow overflow-hidden rounded-3xl bg-card">
                <div className="flex items-center gap-3 p-3">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    onClick={() => {
                      setOpenFood(isOpen ? null : f.name)
                      setGrams(f.portion)
                    }}
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-bg text-2xl">{f.emoji}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-extrabold">{f.name}</span>
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: grade.color }} title={grade.label} />
                      </span>
                      <span className="block text-xs font-semibold text-mute">
                        {f.unit} ({f.portion} g) · {Math.round((f.kcal * f.portion) / 100)} kcal
                      </span>
                    </span>
                  </button>
                  <Tap
                    label={`Adicionar ${f.name}`}
                    onClick={() => add(f, f.portion)}
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors ${done ? 'bg-leaf text-white' : 'bg-leaf/12 text-leaf'}`}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span key={done ? 'ok' : 'add'} initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
                        {done ? <Check size={20} strokeWidth={3} /> : <Plus size={20} strokeWidth={3} />}
                      </motion.span>
                    </AnimatePresence>
                  </Tap>
                </div>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="space-y-4 border-t border-black/5 p-4">
                        <BigSlider label="Quantidade" unit="g" min={5} max={Math.max(500, f.portion * 3)} step={5} value={grams} onChange={setGrams} />
                        <div className="grid grid-cols-4 gap-2 text-center">
                          {[
                            ['kcal', f.kcal * k, 'text-ink'],
                            ['Prot.', f.p * k, 'text-protein'],
                            ['Carbo', f.c * k, 'text-carb'],
                            ['Gord.', f.f * k, 'text-fat'],
                          ].map(([label, v, color]) => (
                            <div key={label as string} className="rounded-2xl bg-bg py-2">
                              <div className={`text-base font-extrabold tabular-nums ${color}`}>{Math.round(v as number)}</div>
                              <div className="text-[11px] font-bold text-mute">{label}</div>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold" style={{ color: grade.color }}>
                            ● {grade.label}
                          </span>
                          <Tap onClick={() => add(f, grams)} className="grad-leaf rounded-full px-6 py-3 text-sm font-extrabold text-forest shadow-md shadow-leaf/30">
                            Adicionar
                          </Tap>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
          {q.trim() && list.length === 0 && (
            <div className="rounded-3xl bg-card p-6 text-center text-sm text-mute">
              Não encontrei "{q}". Toque no lápis para criar esse alimento ou use a foto.
            </div>
          )}
        </div>
      </div>
    </Sheet>
  )
}
