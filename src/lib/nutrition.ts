// Regras de cálculo do app (metas, gasto calórico, IMC, nota dos alimentos).

export type Sex = 'f' | 'm'
export type Goal = 'lose' | 'maintain' | 'gain'

export interface Profile {
  sex: Sex
  age: number
  heightCm: number
  weightKg: number
  targetKg: number
  goal: Goal
  paceKgWeek: number // ritmo desejado (kg por semana)
  activity: number // fator de atividade (1.2 a 1.725)
}

export interface Goals {
  kcal: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  waterMl: number
  bmr: number
  tdee: number
}

export const ACTIVITY_LEVELS = [
  { v: 1.2, emoji: '🪑', title: 'Sedentário', desc: 'Trabalho sentado, pouco movimento' },
  { v: 1.375, emoji: '🚶', title: 'Leve', desc: 'Exercício leve 1 a 3x por semana' },
  { v: 1.55, emoji: '🏃', title: 'Moderado', desc: 'Exercício 3 a 5x por semana' },
  { v: 1.725, emoji: '🏋️', title: 'Intenso', desc: 'Treino pesado 6 a 7x por semana' },
]

// Gasto em repouso pela fórmula de Mifflin-St Jeor.
export function bmr(p: Profile) {
  return 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === 'm' ? 5 : -161)
}

export function calcGoals(p: Profile): Goals {
  const base = bmr(p)
  const tdee = base * p.activity
  // 1 kg de gordura ≈ 7700 kcal
  const dailyDelta = p.goal === 'maintain' ? 0 : ((p.paceKgWeek * 7700) / 7) * (p.goal === 'lose' ? -1 : 1)
  const floor = p.sex === 'm' ? 1500 : 1200 // piso de segurança
  const kcal = Math.round(Math.max(floor, tdee + dailyDelta) / 10) * 10
  const protPerKg = p.goal === 'lose' ? 2.0 : p.goal === 'gain' ? 1.8 : 1.6
  const protein = Math.round(protPerKg * p.weightKg)
  const fat = Math.round((kcal * 0.28) / 9)
  const carbs = Math.max(50, Math.round((kcal - protein * 4 - fat * 9) / 4))
  return {
    kcal,
    protein,
    carbs,
    fat,
    fiber: Math.round((kcal / 1000) * 14),
    waterMl: Math.round((p.weightKg * 35) / 250) * 250,
    bmr: Math.round(base),
    tdee: Math.round(tdee),
  }
}

export function bmi(weightKg: number, heightCm: number) {
  const m = heightCm / 100
  return weightKg / (m * m)
}

export function bmiLabel(v: number) {
  if (v < 18.5) return { label: 'Abaixo do peso', color: '#38bdf8' }
  if (v < 25) return { label: 'Peso saudável', color: '#10b981' }
  if (v < 30) return { label: 'Sobrepeso', color: '#f59e0b' }
  return { label: 'Obesidade', color: '#ff7a59' }
}

export function weeksToGoal(p: Profile, currentKg: number) {
  if (p.goal === 'maintain' || p.paceKgWeek <= 0) return 0
  return Math.max(0, Math.ceil(Math.abs(currentKg - p.targetKg) / p.paceKgWeek))
}

// Exercícios: gasto = MET × peso (kg) × horas
export const EXERCISES = [
  { name: 'Caminhada', emoji: '🚶', met: 3.5 },
  { name: 'Corrida', emoji: '🏃', met: 9.8 },
  { name: 'Bicicleta', emoji: '🚴', met: 7.5 },
  { name: 'Musculação', emoji: '🏋️', met: 5 },
  { name: 'Natação', emoji: '🏊', met: 8 },
  { name: 'Yoga / Pilates', emoji: '🧘', met: 2.8 },
  { name: 'Futebol', emoji: '⚽', met: 7 },
  { name: 'Dança', emoji: '💃', met: 5 },
]

export function exerciseKcal(met: number, weightKg: number, minutes: number) {
  return Math.round((met * weightKg * minutes) / 60)
}

export function stepsKcal(steps: number, weightKg: number) {
  return Math.round(steps * 0.04 * (weightKg / 70))
}

// Nota simples do alimento (por 100 g): verde, amarelo ou vermelho.
export type Grade = 'A' | 'B' | 'C'
export function gradeFood(kcal: number, p: number, c: number, f: number, fiber: number): Grade {
  const sugaryDrink = kcal < 100 && c > 8 && p < 1 && fiber < 0.5
  if (sugaryDrink) return 'C'
  if (kcal >= 330 && fiber < 5 && p < 20) return 'C'
  if ((kcal <= 150 && f < 10) || fiber >= 5 || (p >= 15 && f <= 14 && kcal <= 250)) return 'A'
  return 'B'
}
export const GRADE_INFO: Record<Grade, { color: string; label: string }> = {
  A: { color: '#10b981', label: 'Ótima escolha' },
  B: { color: '#f59e0b', label: 'Equilibrado' },
  C: { color: '#ff7a59', label: 'Com moderação' },
}

// Datas no formato AAAA-MM-DD (horário local)
export function dayKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
export function addDays(key: string, n: number) {
  const [y, m, d] = key.split('-').map(Number)
  return dayKey(new Date(y, m - 1, d + n))
}
export function keyToDate(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}
