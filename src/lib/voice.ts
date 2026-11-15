import { norm, type Food } from './foods'

// Entende frases como "duas bananas, um café com leite e 150 gramas de arroz"
// e transforma em itens do diário.

export interface SpokenItem {
  food: Food
  grams: number
  said: string
}

const NUMBERS: Record<string, number> = {
  um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10, meio: 0.5, meia: 0.5,
}

// Unidades com peso fixo (em gramas ou ml); as demais valem "uma porção" do alimento.
const FIXED_UNITS: Record<string, number> = {
  g: 1, grama: 1, gr: 1, ml: 1, mililitro: 1, kg: 1000, quilo: 1000, kilo: 1000, l: 1000, litro: 1000, colher: 15, copo: 200, xicara: 150,
}
const PORTION_UNITS = ['unidade', 'pedaco', 'porcao', 'prato', 'concha', 'file', 'lata', 'pote', 'bola', 'fatia', 'bife', 'punhado', 'scoop', 'gomo', 'tigela']
const STOP = new Set(['de', 'da', 'do', 'das', 'dos', 'a', 'o', 'as', 'os', 'com', 'e', 'em', 'no', 'na', 'tipo'])

// Palavras do dia a dia → alimento da lista principal.
const ALIASES: Record<string, string> = {
  arroz: 'Arroz branco cozido', feijao: 'Feijão carioca cozido', frango: 'Peito de frango grelhado', carne: 'Bife grelhado', bife: 'Bife grelhado',
  ovo: 'Ovo cozido', pao: 'Pão francês', cafe: 'Café sem açúcar', leite: 'Leite integral', queijo: 'Queijo muçarela', iogurte: 'Iogurte natural',
  salada: 'Salada de alface e tomate', macarrao: 'Macarrão cozido', batata: 'Batata cozida', peixe: 'Tilápia grelhada', suco: 'Suco de laranja',
  pizza: 'Pizza de muçarela', chocolate: 'Chocolate ao leite', acai: 'Açaí com granola', aveia: 'Aveia em flocos', azeite: 'Azeite de oliva',
}

function singular(w: string) {
  if (w.length <= 3 || w in NUMBERS) return w
  if (/[rz]es$/.test(w)) return w.slice(0, -2) // colheres → colher, nozes → noz
  if (w.endsWith('oes') || w.endsWith('aes')) return w.slice(0, -3) + 'ao'
  if (w.endsWith('eis')) return w.slice(0, -3) + 'el'
  if (w.endsWith('ns')) return w.slice(0, -2) + 'm'
  if (w.endsWith('s')) return w.slice(0, -1)
  return w
}
const tokens = (s: string) =>
  norm(s)
    .split(/[^a-z0-9.,]+/)
    .map((w) => w.replace(/^[.,]+|[.,]+$/g, ''))
    .filter(Boolean)
    .map(singular)
const same = (a: string, b: string) => a === b || (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a)))

interface Match {
  food: Food
  exact: boolean
}

function findFood(words: string[], foods: Food[], index: string[][]): Match | null {
  const q = words.filter((w) => !STOP.has(w))
  if (!q.length) return null
  const alias = ALIASES[q.join(' ')]
  if (alias) {
    const food = foods.find((f) => f.name === alias)
    if (food) return { food, exact: true }
  }
  let best: { score: number; i: number; exact: boolean } | null = null
  for (let i = 0; i < foods.length; i++) {
    const ft = index[i]
    // a primeira palavra dita é o alimento em si ("suco de uva" não pode virar "uva")
    if (!ft.some((t) => same(q[0], t))) continue
    const hit = q.filter((w) => ft.some((t) => same(w, t))).length
    const said = hit / q.length
    if (said < 0.5) continue
    const covered = ft.filter((t) => q.some((w) => same(w, t))).length / ft.length
    // na dúvida, prefere a versão pronta para comer em vez da crua
    const raw = ft.some((t) => t === 'cru' || t === 'crua') && !q.some((w) => w === 'cru' || w === 'crua')
    const score = said * 0.7 + covered * 0.3 - (raw ? 0.05 : 0)
    if (!best || score > best.score + 1e-9) best = { score, i, exact: said === 1 && covered === 1 }
  }
  return best ? { food: foods[best.i], exact: best.exact } : null
}

function parseSegment(seg: string, foods: Food[], index: string[][]): { item?: SpokenItem; exact?: boolean } {
  let words = tokens(seg)
  let qty: number | undefined
  if (words.length) {
    const w = words[0]
    const asNumber = NUMBERS[w] ?? (/^\d+([.,]\d+)?$/.test(w) ? Number(w.replace(',', '.')) : undefined)
    // "150g" falado junto
    const glued = /^(\d+([.,]\d+)?)(g|ml|kg|l)$/.exec(w)
    if (glued) {
      qty = Number(glued[1].replace(',', '.'))
      words = [glued[3], ...words.slice(1)]
    } else if (asNumber !== undefined) {
      qty = asNumber
      words = words.slice(1)
    }
  }
  let fixed: number | undefined
  if (qty !== undefined && words.length) {
    const u = words[0]
    if (u in FIXED_UNITS) {
      fixed = FIXED_UNITS[u]
      words = words.slice(1)
      // "colher de sopa" / "colher de chá"
      if (u === 'colher' && words[0] === 'de' && (words[1] === 'sopa' || words[1] === 'cha' || words[1] === 'sobremesa')) {
        if (words[1] === 'cha') fixed = 5
        words = words.slice(2)
      }
    } else if (PORTION_UNITS.includes(u) && words.length > 1) {
      words = words.slice(1) // "2 fatias de pão": conta em porções do alimento
    }
  }
  const m = findFood(words, foods, index)
  if (!m) return {}
  const grams = fixed !== undefined ? qty! * fixed : (qty ?? 1) * m.food.portion
  return { item: { food: m.food, grams: Math.max(1, Math.round(grams)), said: seg.trim() }, exact: m.exact }
}

export function parseSpoken(text: string, foods: Food[]): { items: SpokenItem[]; missed: string[] } {
  const index = foods.map((f) => tokens(f.name).filter((w) => !STOP.has(w)))
  const items: SpokenItem[] = []
  const missed: string[] = []
  const segments = text
    .replace(/\s+/g, ' ')
    .split(/[;\n]|,\s|\s+mais\s+|\s+e tamb[eé]m\s+/i)
    .map((s) => s.trim())
    .filter(Boolean)
  // "arroz e feijão" são dois alimentos; "salada de alface e tomate" e "café com leite" são um só (nome exato).
  // Por isso: primeiro tenta o trecho inteiro; se não for um nome exato, tenta dividir em "e" e depois em "com".
  const resolve = (seg: string): { items: SpokenItem[]; missed: string[] } => {
    const whole = parseSegment(seg, foods, index)
    if (whole.item && whole.exact) return { items: [whole.item], missed: [] }
    for (const sep of [/\s+e\s+/i, /\s+com\s+/i]) {
      const parts = seg.split(sep).filter((p) => p.trim())
      if (parts.length < 2) continue
      const solved = parts.map(resolve)
      const split = { items: solved.flatMap((s) => s.items), missed: solved.flatMap((s) => s.missed) }
      if (split.missed.length === 0 || !whole.item) return split
    }
    return whole.item ? { items: [whole.item], missed: [] } : { items: [], missed: [seg] }
  }
  for (const seg of segments) {
    const r = resolve(seg)
    items.push(...r.items)
    missed.push(...r.missed)
  }
  return { items, missed }
}
