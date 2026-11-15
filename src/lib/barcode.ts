import type { Food } from './foods'

// Busca um produto pelo código de barras na base pública e gratuita Open Food Facts.
export type BarcodeResult = { status: 'found'; food: Food } | { status: 'missing'; name?: string } | { status: 'offline' }

const num = (v: unknown) => {
  const n = typeof v === 'string' ? Number(v.replace(',', '.')) : typeof v === 'number' ? v : NaN
  return Number.isFinite(n) ? n : undefined
}

export async function lookupBarcode(code: string): Promise<BarcodeResult> {
  const fields = 'product_name,product_name_pt,brands,nutriments,serving_quantity,serving_size'
  let data: { status?: number; product?: Record<string, unknown> }
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${fields}`)
    if (res.status === 404) return { status: 'missing' }
    if (!res.ok) return { status: 'offline' }
    data = await res.json()
  } catch {
    return { status: 'offline' }
  }
  const p = data.product
  if (data.status !== 1 || !p) return { status: 'missing' }

  const baseName = String(p.product_name_pt || p.product_name || '').trim()
  const brand = String(p.brands || '')
    .split(',')[0]
    .trim()
  const name = [baseName, brand && !baseName.toLowerCase().includes(brand.toLowerCase()) ? brand : ''].filter(Boolean).join(' · ')
  const n = (p.nutriments ?? {}) as Record<string, unknown>
  const kj = num(n['energy_100g'])
  const kcal = num(n['energy-kcal_100g']) ?? (kj !== undefined ? kj / 4.184 : undefined)
  // sem nome ou sem calorias não dá para registrar com segurança
  if (!name || kcal === undefined) return { status: 'missing', name: name || undefined }

  const serving = num(p.serving_quantity)
  return {
    status: 'found',
    food: {
      name,
      emoji: '🏷️',
      kcal: Math.round(kcal),
      p: num(n['proteins_100g']) ?? 0,
      c: num(n['carbohydrates_100g']) ?? 0,
      f: num(n['fat_100g']) ?? 0,
      fiber: num(n['fiber_100g']) ?? 0,
      portion: serving && serving > 0 && serving <= 1000 ? Math.round(serving) : 100,
      unit: serving ? String(p.serving_size || '1 porção') : '100 g',
    },
  }
}
