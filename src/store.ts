import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Food } from './lib/foods'
import { calcGoals, dayKey, type Goals, type Profile } from './lib/nutrition'

export type Meal = 'cafe' | 'almoco' | 'lanche' | 'jantar'
export const MEALS: { id: Meal; label: string; emoji: string }[] = [
  { id: 'cafe', label: 'Café da manhã', emoji: '☕' },
  { id: 'almoco', label: 'Almoço', emoji: '🍽️' },
  { id: 'lanche', label: 'Lanches', emoji: '🍎' },
  { id: 'jantar', label: 'Jantar', emoji: '🌙' },
]
export function mealForNow(): Meal {
  const h = new Date().getHours()
  if (h < 10) return 'cafe'
  if (h < 15) return 'almoco'
  if (h < 18) return 'lanche'
  return 'jantar'
}

export interface Entry {
  id: string
  date: string
  meal: Meal
  name: string
  emoji: string
  grams: number
  kcal: number
  p: number
  c: number
  f: number
  fiber: number
}
export interface Exercise {
  id: string
  date: string
  name: string
  emoji: string
  minutes: number
  kcal: number
}
export interface Weight {
  date: string
  kg: number
}
type MacroOverride = Pick<Goals, 'kcal' | 'protein' | 'carbs' | 'fat'>

interface State {
  onboarded: boolean
  profile: Profile
  override: MacroOverride | null
  addExerciseToGoal: boolean
  entries: Entry[]
  exercises: Exercise[]
  weights: Weight[]
  water: Record<string, number>
  steps: Record<string, number>
  customFoods: Food[]
  finishOnboarding: (p: Profile) => void
  redoPlan: () => void
  setOverride: (o: MacroOverride | null) => void
  setAddExercise: (v: boolean) => void
  addEntry: (e: Omit<Entry, 'id'>) => void
  removeEntry: (id: string) => void
  addExercise: (e: Omit<Exercise, 'id'>) => void
  removeExercise: (id: string) => void
  addWater: (date: string, ml: number) => void
  setSteps: (date: string, n: number) => void
  logWeight: (kg: number, date?: string) => void
  addCustomFood: (f: Food) => void
  reset: () => void
}

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

export const DEFAULT_PROFILE: Profile = {
  sex: 'f',
  age: 30,
  heightCm: 168,
  weightKg: 72,
  targetKg: 66,
  goal: 'lose',
  paceKgWeek: 0.5,
  activity: 1.375,
}

const initial = {
  onboarded: false,
  profile: DEFAULT_PROFILE,
  override: null,
  addExerciseToGoal: true,
  entries: [] as Entry[],
  exercises: [] as Exercise[],
  weights: [] as Weight[],
  water: {} as Record<string, number>,
  steps: {} as Record<string, number>,
  customFoods: [] as Food[],
}

export const useStore = create<State>()(
  persist(
    (set) => ({
      ...initial,
      finishOnboarding: (p) =>
        set((s) => ({
          onboarded: true,
          profile: p,
          weights: s.weights.length ? s.weights : [{ date: dayKey(), kg: p.weightKg }],
        })),
      redoPlan: () => set({ onboarded: false, override: null }),
      setOverride: (override) => set({ override }),
      setAddExercise: (addExerciseToGoal) => set({ addExerciseToGoal }),
      addEntry: (e) => set((s) => ({ entries: [...s.entries, { ...e, id: uid() }] })),
      removeEntry: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
      addExercise: (e) => set((s) => ({ exercises: [...s.exercises, { ...e, id: uid() }] })),
      removeExercise: (id) => set((s) => ({ exercises: s.exercises.filter((e) => e.id !== id) })),
      addWater: (date, ml) => set((s) => ({ water: { ...s.water, [date]: Math.max(0, (s.water[date] ?? 0) + ml) } })),
      setSteps: (date, n) => set((s) => ({ steps: { ...s.steps, [date]: Math.max(0, Math.round(n)) } })),
      logWeight: (kg, date = dayKey()) =>
        set((s) => ({
          weights: [...s.weights.filter((w) => w.date !== date), { date, kg }].sort((a, b) => a.date.localeCompare(b.date)),
          profile: date >= (s.weights.at(-1)?.date ?? '') ? { ...s.profile, weightKg: kg } : s.profile,
        })),
      addCustomFood: (f) => set((s) => ({ customFoods: [f, ...s.customFoods.filter((x) => x.name !== f.name)] })),
      reset: () => set({ ...initial }),
    }),
    { name: 'nutriapp-v1' },
  ),
)

// Metas do dia: calculadas pelo perfil, com ajuste manual opcional.
export function useGoals(): Goals {
  const profile = useStore((s) => s.profile)
  const override = useStore((s) => s.override)
  const g = calcGoals(profile)
  return override ? { ...g, ...override } : g
}

export function sumEntries(list: Entry[]) {
  return list.reduce(
    (a, e) => ({ kcal: a.kcal + e.kcal, p: a.p + e.p, c: a.c + e.c, f: a.f + e.f, fiber: a.fiber + e.fiber }),
    { kcal: 0, p: 0, c: 0, f: 0, fiber: 0 },
  )
}
