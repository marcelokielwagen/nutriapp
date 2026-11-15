import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { analyzeFood } from './server/analyze.ts'

// Pequeno servidor local: recebe a foto do app e pede a análise para a IA.
// A chave fica só aqui (arquivo .env), nunca dentro do app.
function foodApi(apiKey: string | undefined): Plugin {
  return {
    name: 'food-api',
    configureServer(server) {
      server.middlewares.use('/api/analyze', (req, res) => {
        const send = (status: number, body: unknown) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(body))
        }
        if (req.method !== 'POST') return send(405, { error: 'method' })
        if (!apiKey) return send(503, { error: 'no_key' })
        const chunks: Buffer[] = []
        let size = 0
        req.on('data', (c: Buffer) => {
          size += c.length
          if (size < 8_000_000) chunks.push(c)
        })
        req.on('end', async () => {
          try {
            const { image, mediaType } = JSON.parse(Buffer.concat(chunks).toString('utf8'))
            if (typeof image !== 'string' || !['image/jpeg', 'image/png', 'image/webp'].includes(mediaType)) {
              return send(400, { error: 'bad_request' })
            }
            const result = await analyzeFood(apiKey, image, mediaType)
            if (result.ok) send(200, { items: result.items })
            else send(result.status, { error: result.error })
          } catch {
            send(400, { error: 'bad_request' })
          }
        })
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // "npm run celular": abre o app para outros aparelhos da rede de casa, com conexão segura
  // (o celular só libera a câmera em endereço https).
  const phone = mode === 'celular'
  return {
    base: './', // caminhos relativos: funciona em qualquer endereço (GitHub Pages, app de loja)
    plugins: [react(), tailwindcss(), foodApi(env.ANTHROPIC_API_KEY), ...(phone ? [basicSsl()] : [])],
    server: phone ? { host: true, port: 5174 } : { port: 5173 },
  }
})
