import taco from '../data/taco.json'

// Lista principal: alimentos comuns no Brasil, com porção do dia a dia. Valores por 100 g (referência: tabela TACO).
export interface Food {
  name: string
  emoji: string
  kcal: number
  p: number
  c: number
  f: number
  fiber: number
  portion: number // porção padrão em gramas (ou ml)
  unit: string // descrição da porção
}

type Row = [string, string, number, number, number, number, number, number, string]

const ROWS: Row[] = [
  ['Arroz branco cozido', '🍚', 128, 2.5, 28.1, 0.2, 1.6, 150, '4 col. de sopa'],
  ['Arroz integral cozido', '🍚', 124, 2.6, 25.8, 1, 2.7, 150, '4 col. de sopa'],
  ['Feijão carioca cozido', '🫘', 76, 4.8, 13.6, 0.5, 8.5, 140, '1 concha'],
  ['Feijão preto cozido', '🫘', 77, 4.5, 14, 0.5, 8.4, 140, '1 concha'],
  ['Peito de frango grelhado', '🍗', 159, 32, 0, 2.5, 0, 120, '1 filé'],
  ['Bife grelhado', '🥩', 219, 35.9, 0, 7.3, 0, 100, '1 bife'],
  ['Carne moída refogada', '🥩', 212, 26.7, 0, 10.9, 0, 100, '4 col. de sopa'],
  ['Strogonoff de frango', '🍛', 150, 12, 5, 9, 0.3, 200, '1 porção'],
  ['Feijoada', '🍲', 117, 8.7, 11.6, 6.5, 5.1, 300, '1 prato'],
  ['Salmão grelhado', '🐟', 229, 23.9, 0, 14, 0, 120, '1 filé'],
  ['Tilápia grelhada', '🐟', 128, 26, 0, 2.7, 0, 120, '1 filé'],
  ['Atum em conserva', '🐟', 166, 26.2, 0, 6, 0, 60, '1/2 lata'],
  ['Linguiça', '🌭', 296, 18, 0, 25, 0, 60, '1 gomo'],
  ['Presunto', '🥓', 94, 14.3, 2.1, 2.7, 0, 30, '2 fatias'],
  ['Peito de peru', '🥓', 100, 17, 2, 2, 0, 30, '2 fatias'],
  ['Ovo cozido', '🥚', 146, 13.3, 0.6, 9.5, 0, 50, '1 unidade'],
  ['Ovo frito', '🍳', 240, 15.6, 1.2, 18.6, 0, 50, '1 unidade'],
  ['Omelete', '🍳', 170, 11, 1, 13, 0, 100, '2 ovos'],
  ['Pão francês', '🥖', 300, 8, 58.6, 3.1, 2.3, 50, '1 unidade'],
  ['Pão integral', '🍞', 253, 9.4, 49.9, 3.7, 6.9, 50, '2 fatias'],
  ['Pão de queijo', '🧀', 363, 5.1, 34.2, 24.6, 0.6, 40, '1 unidade'],
  ['Tapioca', '🫓', 240, 0, 60, 0, 0, 80, '1 unidade'],
  ['Cuscuz de milho', '🌽', 113, 2.2, 25.3, 0.7, 2.1, 120, '1 fatia'],
  ['Aveia em flocos', '🌾', 394, 13.9, 66.6, 8.5, 9.1, 30, '2 col. de sopa'],
  ['Granola', '🥣', 421, 10, 65, 13, 7, 40, '3 col. de sopa'],
  ['Banana', '🍌', 98, 1.3, 26, 0.1, 2, 90, '1 unidade'],
  ['Maçã', '🍎', 56, 0.3, 15.2, 0, 1.3, 130, '1 unidade'],
  ['Laranja', '🍊', 46, 1, 11.5, 0.1, 1, 180, '1 unidade'],
  ['Mamão', '🥭', 40, 0.5, 10.4, 0.1, 1, 170, '1 fatia'],
  ['Manga', '🥭', 64, 0.4, 16.7, 0.3, 1.6, 150, '1/2 unidade'],
  ['Abacaxi', '🍍', 48, 0.9, 12.3, 0.1, 1, 150, '2 fatias'],
  ['Abacate', '🥑', 96, 1.2, 6, 8.4, 6.3, 100, '4 col. de sopa'],
  ['Morango', '🍓', 30, 0.9, 6.8, 0.3, 1.7, 150, '10 unidades'],
  ['Uva', '🍇', 53, 0.7, 13.6, 0.2, 0.9, 100, '1 cacho pequeno'],
  ['Melancia', '🍉', 33, 0.9, 8.1, 0, 0.1, 200, '1 fatia'],
  ['Açaí com granola', '🫐', 170, 2, 28, 6, 3, 200, '1 tigela'],
  ['Leite integral', '🥛', 61, 3.2, 4.6, 3.3, 0, 200, '1 copo'],
  ['Leite desnatado', '🥛', 35, 3.4, 5, 0.1, 0, 200, '1 copo'],
  ['Iogurte natural', '🥛', 51, 4.1, 1.9, 3, 0, 170, '1 pote'],
  ['Iogurte grego', '🥛', 100, 6, 9, 4.5, 0, 100, '1 pote'],
  ['Queijo minas frescal', '🧀', 264, 17.4, 3.2, 20.2, 0, 30, '1 fatia'],
  ['Queijo muçarela', '🧀', 330, 22.6, 3, 25.2, 0, 30, '2 fatias'],
  ['Requeijão', '🧀', 257, 9.6, 2.4, 23.4, 0, 30, '1 col. de sopa'],
  ['Manteiga', '🧈', 726, 0.4, 0.1, 82.4, 0, 10, '1 col. de chá'],
  ['Café sem açúcar', '☕', 3, 0.1, 0.4, 0, 0, 150, '1 xícara'],
  ['Café com leite', '☕', 40, 2, 4, 1.8, 0, 200, '1 xícara grande'],
  ['Suco de laranja', '🧃', 45, 0.7, 10.4, 0.1, 0.2, 250, '1 copo'],
  ['Refrigerante', '🥤', 40, 0, 10, 0, 0, 350, '1 lata'],
  ['Cerveja', '🍺', 41, 0.6, 3.3, 0, 0, 350, '1 lata'],
  ['Água de coco', '🥥', 22, 0, 5.3, 0, 0.1, 300, '1 copo grande'],
  ['Batata cozida', '🥔', 52, 1.2, 11.9, 0, 1.3, 150, '1 unidade'],
  ['Batata frita', '🍟', 267, 5, 35.6, 13.1, 3.2, 100, '1 porção'],
  ['Batata-doce cozida', '🍠', 77, 0.6, 18.4, 0.1, 2.2, 150, '1 unidade'],
  ['Mandioca cozida', '🥔', 125, 0.6, 30.1, 0.3, 1.6, 100, '2 pedaços'],
  ['Macarrão cozido', '🍝', 131, 4.5, 26, 1, 1.5, 200, '1 prato'],
  ['Macarrão à bolonhesa', '🍝', 120, 5, 15, 4.5, 1.2, 300, '1 prato'],
  ['Lasanha', '🍝', 160, 8, 15, 7.5, 1, 250, '1 pedaço'],
  ['Pizza de muçarela', '🍕', 250, 11, 30, 9.5, 2, 120, '1 fatia'],
  ['Hambúrguer', '🍔', 250, 13, 22, 12, 1, 200, '1 unidade'],
  ['Coxinha', '🍗', 283, 9.6, 34.5, 11.8, 1.5, 80, '1 unidade'],
  ['Pastel de carne', '🥟', 388, 10.1, 43.8, 20.1, 1, 80, '1 unidade'],
  ['Sushi', '🍣', 150, 5, 28, 1.5, 1, 150, '8 peças'],
  ['Salada de alface e tomate', '🥗', 17, 1.1, 3.4, 0.2, 1.5, 100, '1 prato'],
  ['Brócolis cozido', '🥦', 25, 2.1, 4.4, 0.5, 3.4, 80, '4 ramos'],
  ['Cenoura', '🥕', 34, 1.3, 7.7, 0.2, 3.2, 80, '1 unidade'],
  ['Tomate', '🍅', 15, 1.1, 3.1, 0.2, 1.2, 100, '1 unidade'],
  ['Legumes refogados', '🥬', 60, 1.8, 8, 2.5, 2.5, 100, '4 col. de sopa'],
  ['Whey protein', '🥤', 400, 80, 8, 6, 0, 30, '1 scoop'],
  ['Pasta de amendoim', '🥜', 590, 25, 20, 50, 6, 15, '1 col. de sopa'],
  ['Amendoim', '🥜', 544, 27.2, 20.3, 43.9, 8, 30, '1 punhado'],
  ['Mix de castanhas', '🌰', 600, 17, 22, 52, 8, 30, '1 punhado'],
  ['Chocolate ao leite', '🍫', 540, 7.2, 59.6, 30.3, 2.2, 25, '1 barrinha'],
  ['Chocolate 70%', '🍫', 580, 8, 35, 42, 11, 25, '2 quadrados'],
  ['Sorvete', '🍨', 200, 3.5, 24, 10, 0.5, 100, '2 bolas'],
  ['Bolo simples', '🍰', 320, 6, 52, 10, 1, 60, '1 fatia'],
  ['Brigadeiro', '🍬', 390, 5, 60, 14, 1, 20, '1 unidade'],
  ['Biscoito recheado', '🍪', 472, 6.4, 70.5, 19.6, 3, 30, '3 unidades'],
  ['Azeite de oliva', '🫒', 884, 0, 0, 100, 0, 8, '1 col. de sopa'],
  ['Açúcar', '🧂', 387, 0, 99.6, 0, 0, 5, '1 col. de chá'],
  ['Mel', '🍯', 309, 0, 84, 0, 0, 15, '1 col. de sopa'],
]

export const FOODS: Food[] = ROWS.map(([name, emoji, kcal, p, c, f, fiber, portion, unit]) => ({
  name,
  emoji,
  kcal,
  p,
  c,
  f,
  fiber,
  portion,
  unit,
}))

// Tabela TACO completa (NEPA/UNICAMP): 591 alimentos, valores por 100 g.
const CAT_EMOJI = ['🌾', '🥬', '🍎', '🫒', '🐟', '🥩', '🥛', '🥤', '🥚', '🍬', '🧂', '🥫', '🍲', '🫘', '🥜']
type TacoRow = [string, number, number, number, number, number, number]
export const TACO_FOODS: Food[] = (taco.rows as TacoRow[]).map(([name, cat, kcal, p, c, f, fiber]) => ({
  name,
  emoji: CAT_EMOJI[cat] ?? '🍴',
  kcal,
  p,
  c,
  f,
  fiber,
  portion: 100,
  unit: '100 g',
}))

export const POPULAR =['Arroz branco cozido', 'Feijão carioca cozido', 'Peito de frango grelhado', 'Ovo cozido', 'Pão francês', 'Banana', 'Café com leite', 'Salada de alface e tomate']

export const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

// Busca: todas as palavras digitadas precisam aparecer no nome, em qualquer ordem.
// A ordem da lista recebida é mantida (os alimentos principais vêm antes da tabela completa).
export function searchFoods(list: Food[], q: string) {
  const words = norm(q).split(/[^a-z0-9]+/).filter(Boolean)
  if (!words.length) return []
  const first = words[0]
  return list
    .map((f, i) => ({ f, i, n: norm(f.name) }))
    .filter((x) => words.every((w) => x.n.includes(w)))
    .sort((a, b) => Number(b.n.startsWith(first)) - Number(a.n.startsWith(first)) || a.i - b.i)
    .slice(0, 40)
    .map((x) => x.f)
}
