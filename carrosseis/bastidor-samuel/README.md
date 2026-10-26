# Carrossel · Como o Samuel prepara uma palestra

8 slides 1080×1350 para o Instagram do Oratória Exponencial, montados como uma tira contínua (8640 px) que o Instagram corta. O texto é o aprovado; não mexer sem combinar.

## Trocar foto, logo, cores e fontes

Tudo fica em **`marca.css`**:

- **Foto do Samuel:** salve o recorte (PNG transparente, vertical, do peito pra cima) como `assets/samuel.png`. Ela atravessa o corte entre os slides 1 e 2. Para ajustar o enquadramento, mude `--foto-left`, `--foto-top`, `--foto-width` e `--foto-height`.
- **Logo:** salve como `assets/logo.svg` (ou PNG, trocando o caminho em `--logo`). Use a versão para fundo escuro.
- **Cores e fontes:** os tokens no topo de `marca.css`. As fontes ficam em `fonts/`.

Enquanto um asset não existir, o slide mostra o placeholder.

## Ver e exportar

- Abra `index.html` no navegador para ver a tira inteira e a prévia das animações, slide a slide.
- `npm install && npm run exportar` gera `export/bastidor-samuel-01.png` … `08.png`. O exportador **recusa** gerar enquanto houver placeholder; `npm run rascunho` exporta mesmo assim.
