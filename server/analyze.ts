import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'

// Formato da resposta que a IA deve devolver ao analisar a foto do prato.
const FoodAnalysis = z.object({
  is_food: z.boolean(),
  items: z.array(
    z.object({
      name: z.string(),
      emoji: z.string(),
      grams: z.number(),
      kcal: z.number(),
      protein: z.number(),
      carbs: z.number(),
      fat: z.number(),
      fiber: z.number(),
    }),
  ),
})

const SYSTEM = `Você é um nutricionista que analisa fotos de refeições para um app de controle alimentar brasileiro.
Identifique cada alimento ou bebida visível na foto como um item separado (ex.: arroz, feijão, bife, salada).
Para cada item, estime a porção em gramas a partir do tamanho aparente no prato e calcule, PARA ESSA PORÇÃO:
kcal, proteína, carboidrato, gordura e fibra (em gramas). Use valores típicos de tabelas brasileiras (TACO).
Nomes curtos em português do Brasil, com um emoji que represente o alimento.
Se a imagem não mostrar comida ou bebida, devolva is_food=false e a lista vazia.`

export type AnalyzeResult =
  | { ok: true; items: z.infer<typeof FoodAnalysis>['items'] }
  | { ok: false; status: number; error: string }

export async function analyzeFood(
  apiKey: string,
  base64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp',
): Promise<AnalyzeResult> {
  const client = new Anthropic({ apiKey })
  try {
    const response = await client.messages.parse({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      system: SYSTEM,
      output_config: { effort: 'low', format: zodOutputFormat(FoodAnalysis) },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
            { type: 'text', text: 'Analise esta refeição.' },
          ],
        },
      ],
    })
    if (response.stop_reason === 'refusal' || !response.parsed_output) {
      return { ok: false, status: 422, error: 'not_analyzed' }
    }
    if (!response.parsed_output.is_food || response.parsed_output.items.length === 0) {
      return { ok: false, status: 422, error: 'no_food' }
    }
    return { ok: true, items: response.parsed_output.items }
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) return { ok: false, status: 401, error: 'bad_key' }
    if (error instanceof Anthropic.RateLimitError) return { ok: false, status: 429, error: 'rate_limit' }
    if (error instanceof Anthropic.APIError) return { ok: false, status: 502, error: 'api_error' }
    return { ok: false, status: 500, error: 'server_error' }
  }
}
