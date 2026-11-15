import { motion } from 'framer-motion'
import { Check, Mic, RotateCcw, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Tap } from '../components/ui'
import { FOODS, TACO_FOODS } from '../lib/foods'
import { parseSpoken, type SpokenItem } from '../lib/voice'
import { useStore, type Meal } from '../store'
import { MealChips } from './AddFood'

// Reconhecimento de fala do navegador (o TypeScript não traz esses tipos prontos).
interface Recognition {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}
function createRecognition(): Recognition | null {
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition
  return Ctor ? new Ctor() : null
}

type Row = SpokenItem & { on: boolean }

export default function VoiceAdd({ date, meal, setMeal, onClose }: { date: string; meal: Meal; setMeal: (m: Meal) => void; onClose: () => void }) {
  const addEntry = useStore((s) => s.addEntry)
  const customFoods = useStore((s) => s.customFoods)
  const foods = useMemo(() => [...customFoods, ...FOODS, ...TACO_FOODS], [customFoods])
  const recRef = useRef<Recognition | null>(null)
  const heardRef = useRef('')
  const [supported] = useState(() => createRecognition() !== null)
  const [listening, setListening] = useState(false)
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [rows, setRows] = useState<Row[] | null>(null)
  const [missed, setMissed] = useState<string[]>([])

  const understand = (phrase: string) => {
    if (!phrase.trim()) return
    const r = parseSpoken(phrase, foods)
    setRows(r.items.map((i) => ({ ...i, on: true })))
    setMissed(r.missed)
  }

  const listen = () => {
    const rec = createRecognition()
    if (!rec) return
    recRef.current?.abort()
    recRef.current = rec
    heardRef.current = ''
    setError('')
    setText('')
    setRows(null)
    rec.lang = 'pt-BR'
    rec.interimResults = true
    rec.continuous = false
    rec.onresult = (e) => {
      const said = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(' ')
      heardRef.current = said
      setText(said)
    }
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') setError('Permita o uso do microfone para falar o que comeu.')
      else if (e.error === 'no-speech') setError('Não ouvi nada. Toque no microfone e fale de novo.')
      else if (e.error !== 'aborted') setError('Não consegui ouvir agora. Você também pode escrever abaixo.')
    }
    rec.onend = () => {
      setListening(false)
      understand(heardRef.current)
    }
    setListening(true)
    try {
      rec.start()
    } catch {
      setListening(false)
    }
  }

  useEffect(() => () => recRef.current?.abort(), [])

  const chosen = (rows ?? []).filter((r) => r.on)
  const kcalOf = (r: Row) => (r.food.kcal * r.grams) / 100
  const total = Math.round(chosen.reduce((a, r) => a + kcalOf(r), 0))

  const save = () => {
    chosen.forEach((r) => {
      const k = r.grams / 100
      addEntry({ date, meal, name: r.food.name, emoji: r.food.emoji, grams: r.grams, kcal: r.food.kcal * k, p: r.food.p * k, c: r.food.c * k, f: r.food.f * k, fiber: r.food.fiber * k })
    })
    onClose()
  }

  return (
    <motion.div className="absolute inset-0 z-[60] flex flex-col bg-bg" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}>
      <div className="flex items-center justify-between p-5">
        <Tap label="Fechar" onClick={onClose} className="soft-shadow flex h-11 w-11 items-center justify-center rounded-full bg-card">
          <X size={20} />
        </Tap>
        <span className="text-base font-extrabold">Falar o que comi</span>
        <div className="w-11" />
      </div>

      <div className="no-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pb-4">
        {rows === null ? (
          <div className="flex flex-col items-center pt-6 text-center">
            <div className="relative flex h-44 w-44 items-center justify-center">
              {listening &&
                [0, 0.5, 1].map((d) => (
                  <motion.span key={d} className="absolute inset-0 rounded-full bg-leaf/25" initial={{ scale: 0.6, opacity: 0.8 }} animate={{ scale: 1.25, opacity: 0 }} transition={{ duration: 1.6, repeat: Infinity, delay: d }} />
                ))}
              <Tap
                label={listening ? 'Parar de ouvir' : 'Começar a falar'}
                disabled={!supported}
                onClick={() => (listening ? recRef.current?.stop() : listen())}
                className={`relative flex h-28 w-28 items-center justify-center rounded-full text-forest shadow-xl shadow-leaf/40 disabled:opacity-40 ${listening ? 'bg-coral text-white' : 'grad-leaf'}`}
              >
                <Mic size={44} />
              </Tap>
            </div>
            <p className="mt-2 min-h-14 max-w-xs text-lg font-extrabold">{text || (listening ? 'Ouvindo…' : supported ? 'Toque e fale' : 'Fala indisponível neste navegador')}</p>
            <p className="max-w-xs text-sm text-mute">Exemplo: “duas bananas, um café com leite e 150 gramas de arroz”</p>
            {error && <div className="mt-4 rounded-2xl bg-coral/15 px-4 py-3 text-sm font-bold text-coral">{error}</div>}

            <form
              className="mt-8 flex w-full gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                understand(text)
              }}
            >
              <input
                value={listening ? '' : text}
                onChange={(e) => setText(e.target.value)}
                placeholder="ou escreva aqui o que comeu"
                aria-label="Escrever o que comeu"
                className="soft-shadow min-w-0 flex-1 rounded-full bg-card px-5 py-3.5 text-sm font-semibold outline-none placeholder:text-mute/70"
              />
              <Tap onClick={() => understand(text)} disabled={!text.trim() || listening} className="rounded-full bg-forest px-5 text-sm font-extrabold text-white disabled:opacity-40">
                Ok
              </Tap>
            </form>
          </div>
        ) : (
          <>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-xs font-extrabold tracking-wide text-leaf uppercase">
                  Entendi {rows.length} {rows.length === 1 ? 'item' : 'itens'}
                </div>
                <div className="text-3xl font-extrabold tabular-nums">
                  {total} <span className="text-base font-semibold text-mute">kcal</span>
                </div>
              </div>
              <Tap onClick={() => setRows(null)} className="soft-shadow flex items-center gap-1 rounded-full bg-card px-4 py-2 text-xs font-bold">
                <RotateCcw size={14} /> De novo
              </Tap>
            </div>
            <p className="text-sm text-mute">“{text}”</p>
            <MealChips meal={meal} setMeal={setMeal} />
            {rows.map((r, idx) => (
              <motion.div
                key={idx}
                className="soft-shadow flex items-center gap-3 rounded-3xl bg-card p-3"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: r.on ? 1 : 0.45, x: 0 }}
                transition={{ delay: idx * 0.07 }}
              >
                <Tap
                  label={`${r.on ? 'Desmarcar' : 'Marcar'} ${r.food.name}`}
                  onClick={() => setRows((l) => l && l.map((x, i) => (i === idx ? { ...x, on: !x.on } : x)))}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${r.on ? 'bg-leaf text-white' : 'bg-black/10'}`}
                >
                  {r.on && <Check size={16} strokeWidth={3} />}
                </Tap>
                <span className="text-2xl">{r.food.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-extrabold">{r.food.name}</div>
                  <div className="truncate text-xs text-mute">
                    {Math.round(kcalOf(r))} kcal · você disse “{r.said}”
                  </div>
                </div>
                <label className="flex items-center gap-1 rounded-2xl bg-bg px-2 py-2 text-xs font-bold text-mute">
                  <input
                    inputMode="numeric"
                    aria-label={`Gramas de ${r.food.name}`}
                    value={r.grams}
                    onChange={(e) => {
                      const g = Math.max(1, Number(e.target.value.replace(/\D/g, '')) || 1)
                      setRows((l) => l && l.map((x, i) => (i === idx ? { ...x, grams: g } : x)))
                    }}
                    className="w-11 bg-transparent text-right text-sm font-extrabold text-ink outline-none"
                  />
                  g
                </label>
              </motion.div>
            ))}
            {missed.length > 0 && (
              <div className="rounded-2xl bg-carb/15 px-4 py-3 text-xs font-semibold text-ink">
                Não encontrei: <b>{missed.join(', ')}</b>. Tente outro nome ou use a busca.
              </div>
            )}
            {rows.length === 0 && missed.length === 0 && <div className="rounded-3xl bg-card p-6 text-center text-sm text-mute">Não entendi nenhum alimento. Tente de novo.</div>}
          </>
        )}
      </div>

      {rows !== null && (
        <div className="px-5 pt-2 pb-7">
          <Tap onClick={save} disabled={chosen.length === 0} className="grad-leaf w-full rounded-full py-4 text-lg font-extrabold text-forest shadow-lg shadow-leaf/30 disabled:opacity-40">
            Adicionar ao diário
          </Tap>
        </div>
      )}
    </motion.div>
  )
}
