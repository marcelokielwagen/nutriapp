import { AnimatePresence, motion } from 'framer-motion'
import { ChartNoAxesColumn, House, Plus, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Tap } from './components/ui'
import { dayKey } from './lib/nutrition'
import AddFood from './screens/AddFood'
import BarcodeScan from './screens/BarcodeScan'
import CameraScan from './screens/CameraScan'
import Home from './screens/Home'
import Onboarding from './screens/Onboarding'
import Profile from './screens/Profile'
import Progress from './screens/Progress'
import VoiceAdd from './screens/VoiceAdd'
import { mealForNow, useStore, type Meal } from './store'

type Tab = 'home' | 'progress' | 'profile'

export default function App() {
  const onboarded = useStore((s) => s.onboarded)
  const [tab, setTab] = useState<Tab>('home')
  const [date, setDate] = useState(dayKey())
  const [meal, setMeal] = useState<Meal>(mealForNow())
  const [addOpen, setAddOpen] = useState(false)
  const [camOpen, setCamOpen] = useState(false)
  const [barOpen, setBarOpen] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)

  const openAdd = (m?: Meal) => {
    setMeal(m ?? mealForNow())
    setAddOpen(true)
  }

  const tabs: { id: Tab; label: string; icon: typeof House }[] = [
    { id: 'home', label: 'Hoje', icon: House },
    { id: 'progress', label: 'Progresso', icon: ChartNoAxesColumn },
    { id: 'profile', label: 'Perfil', icon: UserRound },
  ]

  return (
    <div className="flex h-full items-center justify-center">
      {/* No computador aparece como um celular; no celular ocupa a tela toda. */}
      <div className="relative h-full w-full overflow-hidden bg-bg sm:h-[min(100dvh-32px,880px)] sm:w-[420px] sm:rounded-[44px] sm:border-[10px] sm:border-ink sm:shadow-2xl">
        {!onboarded ? (
          <Onboarding />
        ) : (
          <>
            <div key={tab} className="no-scrollbar h-full overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                  {tab === 'home' && <Home date={date} setDate={setDate} onAdd={openAdd} />}
                  {tab === 'progress' && <Progress />}
                  {tab === 'profile' && <Profile />}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Barra inferior */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-end justify-center gap-3 bg-gradient-to-t from-bg via-bg/90 to-transparent px-5 pt-10 pb-6">
              <nav className="soft-shadow pointer-events-auto flex flex-1 items-center justify-around rounded-full bg-card p-1.5">
                {tabs.map((t) => {
                  const active = tab === t.id
                  return (
                    <button key={t.id} type="button" onClick={() => setTab(t.id)} className={`relative flex h-12 flex-1 items-center justify-center gap-2 rounded-full text-sm font-extrabold transition-colors ${active ? 'text-white' : 'text-mute'}`}>
                      {active && <motion.span layoutId="tab" className="grad-forest absolute inset-0 rounded-full" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                      <t.icon size={20} className="relative" />
                      {active && <span className="relative">{t.label}</span>}
                      {!active && <span className="sr-only">{t.label}</span>}
                    </button>
                  )
                })}
              </nav>
              <Tap label="Adicionar refeição" onClick={() => openAdd()} className="grad-leaf pointer-events-auto flex h-15 w-15 shrink-0 items-center justify-center rounded-full text-forest shadow-xl shadow-leaf/50">
                <Plus size={30} strokeWidth={3} />
              </Tap>
            </div>

            <AddFood
              open={addOpen}
              onClose={() => setAddOpen(false)}
              date={date}
              meal={meal}
              setMeal={setMeal}
              onCamera={() => {
                setAddOpen(false)
                setCamOpen(true)
              }}
              onVoice={() => {
                setAddOpen(false)
                setVoiceOpen(true)
              }}
              onBarcode={() => {
                setAddOpen(false)
                setBarOpen(true)
              }}
            />
            <AnimatePresence>{voiceOpen && <VoiceAdd date={date} meal={meal} setMeal={setMeal} onClose={() => setVoiceOpen(false)} />}</AnimatePresence>
            <AnimatePresence>{barOpen && <BarcodeScan date={date} meal={meal} setMeal={setMeal} onClose={() => setBarOpen(false)} />}</AnimatePresence>
            <AnimatePresence>{camOpen && <CameraScan date={date} meal={meal} setMeal={setMeal} onClose={() => setCamOpen(false)} />}</AnimatePresence>
          </>
        )}
      </div>
    </div>
  )
}
