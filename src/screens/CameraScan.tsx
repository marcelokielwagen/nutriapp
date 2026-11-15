import { motion } from 'framer-motion'
import { Check, ImagePlus, RotateCcw, Sparkles, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Tap } from '../components/ui'
import { useStore, type Meal } from '../store'
import { MealChips } from './AddFood'

interface Item {
  name: string
  emoji: string
  grams: number
  kcal: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  on: boolean
}

// Exemplo usado quando a chave da IA ainda não foi configurada.
const DEMO: Omit<Item, 'on'>[] = [
  { name: 'Arroz branco', emoji: '🍚', grams: 150, kcal: 192, protein: 3.8, carbs: 42, fat: 0.3, fiber: 2.4 },
  { name: 'Feijão carioca', emoji: '🫘', grams: 140, kcal: 106, protein: 6.7, carbs: 19, fat: 0.7, fiber: 11.9 },
  { name: 'Peito de frango grelhado', emoji: '🍗', grams: 120, kcal: 191, protein: 38.4, carbs: 0, fat: 3, fiber: 0 },
  { name: 'Salada de alface e tomate', emoji: '🥗', grams: 80, kcal: 14, protein: 0.9, carbs: 2.7, fat: 0.2, fiber: 1.2 },
]

const ERRORS: Record<string, string> = {
  no_food: 'Não encontrei comida nessa foto. Tente de novo, com o prato bem enquadrado.',
  not_analyzed: 'Não consegui analisar essa foto. Tente outra.',
  bad_key: 'A chave da IA está incorreta. Confira o arquivo .env.',
  rate_limit: 'Muitas análises seguidas. Espere um instante e tente de novo.',
}

function shrink(source: HTMLVideoElement | HTMLImageElement) {
  const w = source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth
  const h = source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight
  const scale = Math.min(1, 1024 / Math.max(w, h))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w * scale)
  canvas.height = Math.round(h * scale)
  canvas.getContext('2d')!.drawImage(source, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.82)
}

export default function CameraScan({ date, meal, setMeal, onClose }: { date: string; meal: Meal; setMeal: (m: Meal) => void; onClose: () => void }) {
  const addEntry = useStore((s) => s.addEntry)
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<'live' | 'scanning' | 'result'>('live')
  const [hasCam, setHasCam] = useState<boolean | null>(() => (navigator.mediaDevices ? null : false))
  const [photo, setPhoto] = useState('')
  const [items, setItems] = useState<Item[]>([])
  const [demo, setDemo] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let stream: MediaStream | undefined
    let cancelled = false
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop())
        stream = s
        if (videoRef.current) videoRef.current.srcObject = s
        setHasCam(true)
      })
      .catch(() => setHasCam(false))
    return () => {
      cancelled = true
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const analyze = async (dataUrl: string) => {
    setPhoto(dataUrl)
    setPhase('scanning')
    setError('')
    setDemo(false)
    try {
      const res = await fetch('api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl.split(',')[1], mediaType: 'image/jpeg' }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && Array.isArray(data.items)) {
        setItems(data.items.map((i: Omit<Item, 'on'>) => ({ ...i, on: true })))
        setPhase('result')
        return
      }
      // sem chave, ou hospedado em lugar sem o servidor de análise (ex.: GitHub Pages): cai no exemplo
      if (data.error === 'no_key' || !data.error) throw new Error('demo')
      setError(ERRORS[data.error] ?? 'A análise falhou. Tente novamente.')
      setPhase('live')
    } catch {
      // sem chave (ou sem servidor): mostra um exemplo, avisando que é demonstração
      await new Promise((r) => setTimeout(r, 1600))
      setItems(DEMO.map((i) => ({ ...i, on: true })))
      setDemo(true)
      setPhase('result')
    }
  }

  const onFile = (file?: File) => {
    if (!file) return
    const img = new Image()
    img.onload = () => {
      analyze(shrink(img))
      URL.revokeObjectURL(img.src)
    }
    img.src = URL.createObjectURL(file)
  }

  const setGrams = (idx: number, grams: number) =>
    setItems((list) =>
      list.map((it, i) => {
        if (i !== idx || it.grams <= 0) return it
        const k = grams / it.grams
        return { ...it, grams, kcal: it.kcal * k, protein: it.protein * k, carbs: it.carbs * k, fat: it.fat * k, fiber: it.fiber * k }
      }),
    )

  const chosen = items.filter((i) => i.on)
  const totalKcal = Math.round(chosen.reduce((a, i) => a + i.kcal, 0))

  const save = () => {
    chosen.forEach((i) => addEntry({ date, meal, name: i.name, emoji: i.emoji, grams: i.grams, kcal: i.kcal, p: i.protein, c: i.carbs, f: i.fat, fiber: i.fiber }))
    onClose()
  }

  return (
    <motion.div className="absolute inset-0 z-[60] flex flex-col bg-black text-white" initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />

      {/* Imagem: câmera ao vivo ou a foto tirada */}
      <div className={`relative overflow-hidden transition-all duration-500 ${phase === 'result' ? 'h-[34%] shrink-0' : 'flex-1'}`}>
        <video ref={videoRef} autoPlay playsInline muted className={`absolute inset-0 h-full w-full object-cover ${phase === 'live' && hasCam ? '' : 'hidden'}`} />
        {photo && phase !== 'live' && <img src={photo} alt="Foto da refeição" className="absolute inset-0 h-full w-full object-cover" />}

        {phase === 'live' && hasCam === false && (
          <div className="grad-forest absolute inset-0 flex flex-col items-center justify-center gap-4 px-10 text-center">
            <span className="text-6xl">📷</span>
            <p className="text-lg font-extrabold">Câmera indisponível aqui</p>
            <p className="text-sm text-white/70">Escolha uma foto da galeria para analisar.</p>
          </div>
        )}

        {phase === 'live' && hasCam && (
          <div className="pointer-events-none absolute inset-10 top-24 bottom-24">
            {['top-0 left-0 border-t-4 border-l-4 rounded-tl-3xl', 'top-0 right-0 border-t-4 border-r-4 rounded-tr-3xl', 'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-3xl', 'bottom-0 right-0 border-b-4 border-r-4 rounded-br-3xl'].map((c) => (
              <div key={c} className={`absolute h-10 w-10 border-lime ${c}`} />
            ))}
          </div>
        )}

        {phase === 'scanning' && (
          <>
            <div className="absolute inset-0 bg-forest/40" />
            <div className="scan-line absolute inset-x-6 h-1 rounded-full bg-lime shadow-[0_0_24px_6px_rgba(180,240,74,0.8)]" />
            <div className="absolute inset-x-0 bottom-10 flex justify-center">
              <motion.div className="flex items-center gap-2 rounded-full bg-black/60 px-5 py-3 text-sm font-bold backdrop-blur" animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.4, repeat: Infinity }}>
                <Sparkles size={16} className="text-lime" /> Identificando os alimentos…
              </motion.div>
            </div>
          </>
        )}

        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5">
          <Tap label="Fechar câmera" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full bg-black/45 backdrop-blur">
            <X size={20} />
          </Tap>
          {phase === 'live' && <span className="rounded-full bg-black/45 px-4 py-2 text-xs font-bold backdrop-blur">Enquadre o prato inteiro</span>}
          <div className="w-11" />
        </div>

        {error && phase === 'live' && <div className="absolute inset-x-5 top-20 rounded-2xl bg-coral px-4 py-3 text-sm font-bold">{error}</div>}
      </div>

      {/* Botões da câmera */}
      {phase === 'live' && (
        <div className="flex shrink-0 items-center justify-around px-8 pt-5 pb-9">
          <Tap label="Escolher da galeria" onClick={() => fileRef.current?.click()} className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15">
            <ImagePlus size={24} />
          </Tap>
          <Tap
            label="Tirar foto"
            onClick={() => (hasCam && videoRef.current ? analyze(shrink(videoRef.current)) : fileRef.current?.click())}
            className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white"
          >
            <span className="grad-leaf block h-15 w-15 rounded-full" />
          </Tap>
          <div className="w-14" />
        </div>
      )}

      {/* Resultado */}
      {phase === 'result' && (
        <motion.div className="relative z-10 -mt-6 flex min-h-0 flex-1 flex-col rounded-t-[32px] bg-bg text-ink" initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 28 }}>
          <div className="no-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto px-5 pt-5 pb-4">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-xs font-extrabold tracking-wide text-leaf uppercase">Encontrei {items.length} itens</div>
                <div className="text-3xl font-extrabold tabular-nums">
                  {totalKcal} <span className="text-base font-semibold text-mute">kcal</span>
                </div>
              </div>
              <Tap onClick={() => setPhase('live')} className="flex items-center gap-1 rounded-full bg-card px-4 py-2 text-xs font-bold">
                <RotateCcw size={14} /> Refazer
              </Tap>
            </div>
            {demo && (
              <div className="rounded-2xl bg-carb/15 px-4 py-3 text-xs font-semibold text-ink">
                ⚠️ <b>Modo demonstração:</b> este resultado é um exemplo, não a análise da sua foto. Para reconhecer de verdade, falta configurar a chave da IA.
              </div>
            )}
            <MealChips meal={meal} setMeal={setMeal} />
            {items.map((it, idx) => (
              <motion.div
                key={idx}
                className={`soft-shadow flex items-center gap-3 rounded-3xl bg-card p-3 transition-opacity ${it.on ? '' : 'opacity-45'}`}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: it.on ? 1 : 0.45, x: 0 }}
                transition={{ delay: idx * 0.08 }}
              >
                <Tap
                  label={`${it.on ? 'Desmarcar' : 'Marcar'} ${it.name}`}
                  onClick={() => setItems((l) => l.map((x, i) => (i === idx ? { ...x, on: !x.on } : x)))}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${it.on ? 'bg-leaf text-white' : 'bg-black/10'}`}
                >
                  {it.on && <Check size={16} strokeWidth={3} />}
                </Tap>
                <span className="text-2xl">{it.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-extrabold">{it.name}</div>
                  <div className="text-xs text-mute">
                    {Math.round(it.kcal)} kcal · P {Math.round(it.protein)} · C {Math.round(it.carbs)} · G {Math.round(it.fat)}
                  </div>
                </div>
                <label className="flex items-center gap-1 rounded-2xl bg-bg px-2 py-2 text-xs font-bold text-mute">
                  <input
                    inputMode="numeric"
                    aria-label={`Gramas de ${it.name}`}
                    value={Math.round(it.grams)}
                    onChange={(e) => setGrams(idx, Math.max(1, Number(e.target.value.replace(/\D/g, '')) || 1))}
                    className="w-11 bg-transparent text-right text-sm font-extrabold text-ink outline-none"
                  />
                  g
                </label>
              </motion.div>
            ))}
          </div>
          <div className="px-5 pt-2 pb-7">
            <Tap onClick={save} disabled={chosen.length === 0} className="grad-leaf w-full rounded-full py-4 text-lg font-extrabold text-forest shadow-lg shadow-leaf/30 disabled:opacity-40">
              Adicionar ao diário
            </Tap>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
