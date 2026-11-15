import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'
import { motion } from 'framer-motion'
import { RotateCcw, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { BigSlider, Tap } from '../components/ui'
import { lookupBarcode } from '../lib/barcode'
import type { Food } from '../lib/foods'
import { GRADE_INFO, gradeFood } from '../lib/nutrition'
import { useStore, type Meal } from '../store'
import { MealChips } from './AddFood'

const HINTS = new Map<DecodeHintType, unknown>([[DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E]]])

type Phase = 'scan' | 'loading' | 'found' | 'missing' | 'offline'

export default function BarcodeScan({ date, meal, setMeal, onClose }: { date: string; meal: Meal; setMeal: (m: Meal) => void; onClose: () => void }) {
  const addEntry = useStore((s) => s.addEntry)
  const addCustomFood = useStore((s) => s.addCustomFood)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [phase, setPhase] = useState<Phase>('scan')
  const [hasCam, setHasCam] = useState<boolean | null>(() => (navigator.mediaDevices ? null : false))
  const [typed, setTyped] = useState('')
  const [code, setCode] = useState('')
  const [food, setFood] = useState<Food | null>(null)
  const [grams, setGrams] = useState(100)

  const search = async (value: string) => {
    setCode(value)
    setPhase('loading')
    const result = await lookupBarcode(value)
    if (result.status === 'found') {
      setFood(result.food)
      setGrams(result.food.portion)
      addCustomFood(result.food) // fica salvo: da próxima vez aparece na busca, sem precisar ler de novo
    }
    setPhase(result.status)
  }

  // Liga a câmera e fica procurando um código de barras enquanto a tela está em modo de leitura.
  useEffect(() => {
    if (phase !== 'scan' || !videoRef.current || !navigator.mediaDevices) return
    let controls: IScannerControls | undefined
    let stopped = false
    let handled = false
    new BrowserMultiFormatReader(HINTS)
      .decodeFromConstraints({ audio: false, video: { facingMode: 'environment' } }, videoRef.current, (result) => {
        if (!result || handled || stopped) return
        handled = true
        navigator.vibrate?.(60)
        search(result.getText())
      })
      .then((c) => {
        if (stopped) return c.stop()
        controls = c
        setHasCam(true)
      })
      .catch(() => setHasCam(false))
    return () => {
      stopped = true
      controls?.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const k = grams / 100
  const grade = food ? GRADE_INFO[gradeFood(food.kcal, food.p, food.c, food.f, food.fiber)] : null
  const digits = typed.replace(/\D/g, '')

  const save = () => {
    if (!food) return
    addEntry({ date, meal, name: food.name, emoji: food.emoji, grams, kcal: food.kcal * k, p: food.p * k, c: food.c * k, f: food.f * k, fiber: food.fiber * k })
    onClose()
  }

  return (
    <motion.div className="absolute inset-0 z-[60] flex flex-col bg-black text-white" initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
      <div className={`relative overflow-hidden transition-all duration-500 ${phase === 'scan' ? 'flex-1' : 'h-[26%] shrink-0'}`}>
        <video ref={videoRef} autoPlay playsInline muted className={`absolute inset-0 h-full w-full object-cover ${phase === 'scan' && hasCam ? '' : 'hidden'}`} />
        {!(phase === 'scan' && hasCam) && (
          <div className="grad-forest absolute inset-0 flex flex-col items-center justify-center gap-3 px-10 text-center">
            <span className="text-6xl">{phase === 'scan' ? '📷' : '🏷️'}</span>
            {phase === 'scan' && hasCam === false && (
              <>
                <p className="text-lg font-extrabold">Câmera indisponível aqui</p>
                <p className="text-sm text-white/70">Digite abaixo os números que ficam sob o código de barras.</p>
              </>
            )}
          </div>
        )}

        {phase === 'scan' && hasCam && (
          <div className="pointer-events-none absolute inset-x-8 top-1/2 h-40 -translate-y-1/2 rounded-3xl border-4 border-lime shadow-[0_0_0_2000px_rgba(0,0,0,0.45)]">
            <div className="scan-line absolute inset-x-3 h-0.5 rounded-full bg-lime shadow-[0_0_16px_4px_rgba(180,240,74,0.8)]" />
          </div>
        )}

        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5">
          <Tap label="Fechar leitor" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full bg-black/45 backdrop-blur">
            <X size={20} />
          </Tap>
          {phase === 'scan' && hasCam && <span className="rounded-full bg-black/45 px-4 py-2 text-xs font-bold backdrop-blur">Aponte para o código de barras</span>}
          <div className="w-11" />
        </div>
      </div>

      {phase === 'scan' && (
        <form
          className="flex shrink-0 gap-2 px-5 pt-4 pb-8"
          onSubmit={(e) => {
            e.preventDefault()
            if (digits.length >= 8) search(digits)
          }}
        >
          <input
            inputMode="numeric"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="ou digite o código"
            aria-label="Número do código de barras"
            className="min-w-0 flex-1 rounded-full bg-white/15 px-5 py-3.5 text-base font-bold tracking-wider outline-none placeholder:font-semibold placeholder:tracking-normal placeholder:text-white/50"
          />
          <Tap disabled={digits.length < 8} className="grad-leaf rounded-full px-6 text-sm font-extrabold text-forest disabled:opacity-40" onClick={() => digits.length >= 8 && search(digits)}>
            Buscar
          </Tap>
        </form>
      )}

      {phase !== 'scan' && (
        <motion.div className="relative z-10 -mt-6 flex min-h-0 flex-1 flex-col rounded-t-[32px] bg-bg text-ink" initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 28 }}>
          <div className="no-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pt-6 pb-4">
            {phase === 'loading' && (
              <motion.div className="pt-10 text-center text-sm font-bold text-mute" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.2, repeat: Infinity }}>
                Procurando o produto {code}…
              </motion.div>
            )}

            {(phase === 'missing' || phase === 'offline') && (
              <div className="space-y-4 pt-4 text-center">
                <div className="text-5xl">{phase === 'missing' ? '🤔' : '📡'}</div>
                <div className="text-lg font-extrabold">{phase === 'missing' ? 'Produto não encontrado' : 'Sem conexão com a base de produtos'}</div>
                <p className="text-sm text-mute">
                  {phase === 'missing'
                    ? `O código ${code} não está na base pública ou está sem tabela nutricional. Você pode criar esse alimento pelo lápis, na tela de adicionar.`
                    : 'Confira a internet e tente de novo.'}
                </p>
                <Tap onClick={() => setPhase('scan')} className="grad-leaf mx-auto flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-extrabold text-forest">
                  <RotateCcw size={16} /> Ler outro código
                </Tap>
              </div>
            )}

            {phase === 'found' && food && grade && (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold tracking-wide text-leaf uppercase">Produto encontrado</div>
                    <div className="text-xl leading-tight font-extrabold">{food.name}</div>
                    <div className="mt-1 text-xs font-bold" style={{ color: grade.color }}>
                      ● {grade.label}
                    </div>
                  </div>
                  <Tap onClick={() => setPhase('scan')} className="flex shrink-0 items-center gap-1 rounded-full bg-card px-4 py-2 text-xs font-bold">
                    <RotateCcw size={14} /> Outro
                  </Tap>
                </div>
                <MealChips meal={meal} setMeal={setMeal} />
                <div className="soft-shadow rounded-3xl bg-card p-5">
                  <BigSlider label={`Quantidade (porção: ${food.unit})`} unit="g" min={5} max={Math.max(500, food.portion * 3)} step={5} value={grams} onChange={setGrams} />
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    ['kcal', food.kcal * k, 'text-ink'],
                    ['Prot.', food.p * k, 'text-protein'],
                    ['Carbo', food.c * k, 'text-carb'],
                    ['Gord.', food.f * k, 'text-fat'],
                  ].map(([label, v, color]) => (
                    <div key={label as string} className="soft-shadow rounded-2xl bg-card py-3">
                      <div className={`text-lg font-extrabold tabular-nums ${color}`}>{Math.round(v as number)}</div>
                      <div className="text-[11px] font-bold text-mute">{label}</div>
                    </div>
                  ))}
                </div>
                <p className="text-center text-[11px] text-mute">Dados da base colaborativa Open Food Facts. Confira com o rótulo.</p>
              </>
            )}
          </div>
          {phase === 'found' && (
            <div className="px-5 pt-2 pb-7">
              <Tap onClick={save} className="grad-leaf w-full rounded-full py-4 text-lg font-extrabold text-forest shadow-lg shadow-leaf/30">
                Adicionar ao diário
              </Tap>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
