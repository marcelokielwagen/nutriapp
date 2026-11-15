# NutriApp (nome provisório)

App de controle alimentar: diário de refeições, metas de calorias e macros, foto do prato, código de barras, registro por voz, água, atividade e peso.

## Rodar no computador

```bash
npm install
npm run dev
```

Abra `http://localhost:5173`.

## Testar no celular pela rede de casa

```bash
npm run celular
```

Abra no celular o endereço `https://...:5174` que aparecer na tela (mesmo Wi-Fi).

## Reconhecimento por foto

Funciona só ao rodar no computador com uma chave da Anthropic no arquivo `.env` (veja `.env.example`). Sem a chave, e na versão publicada no GitHub Pages, a foto mostra apenas um exemplo (modo demonstração).

## Dados

- Alimentos: Tabela Brasileira de Composição de Alimentos (TACO), NEPA/UNICAMP.
- Produtos por código de barras: Open Food Facts.

Os valores são estimativas e não substituem orientação de nutricionista ou médico.
