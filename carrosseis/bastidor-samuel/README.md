# Carrossel · Como o Samuel prepara uma palestra

8 slides 1080×1350 para o Instagram do Oratória Exponencial, montados como uma tira contínua (8640 px) que o Instagram corta. O texto é o aprovado; não mexer sem combinar.

## Trocar foto, logo, cores e fontes

Tudo fica em **`marca.css`**:

- **Foto do Samuel:** `assets/samuel.png` (foto sentado, fundo removido e corte na altura da coxa). Ela atravessa o corte entre os slides 1 e 2. Para ajustar o enquadramento, mude `--foto-left`, `--foto-top`, `--foto-width` e `--foto-height`.
- **Logo:** `assets/logo.png` (LOGO HORIZONTAL 01 em Dourado Claro, versão para fundo escuro). Para trocar, mude o arquivo ou o caminho em `--logo`.
- **Cores e fontes:** os tokens no topo de `marca.css`, tirados do manual de marca v1.0 (Navy #0D1B3E, Dourado #C8941A / #E8B84B, Barlow Condensed 900, Playfair Display, Barlow). As fontes ficam em `fonts/`.

Enquanto um asset não existir, o slide mostra o placeholder.

## Ver e exportar

- Abra `index.html` no navegador para ver a tira inteira e a prévia das animações, slide a slide.
- `npm install && npm run exportar` gera `export/bastidor-samuel-01.png` … `08.png`. O exportador **recusa** gerar enquanto houver placeholder; `npm run rascunho` exporta mesmo assim.

## Versão animada

`node animar.js` (precisa de ffmpeg) gera em `video/`:
- `bastidor-samuel-01..08.mp4`: um vídeo por slide, em 1080×1350 e 30 fps, para montar o carrossel com vídeos.
- `bastidor-samuel-tira.mp4`: os 8 em sequência, com cada slide deslizando para a esquerda (cerca de 49 s). Serve para Reels ou para o feed.

O movimento de cada slide fica em `animacao.js`. Cada quadro é capturado com o relógio parado, então o resultado sai igual toda vez.
