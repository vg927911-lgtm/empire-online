# Empire Online

Protótipo web de tiro em terceira pessoa (TPS), com foco em celulares e controles touch.

## O que já funciona

- Arena 3D compacta de treinamento, com ruínas, coberturas e alvos.
- Câmera TPS atrás do personagem.
- Movimento por teclado no computador e analógico virtual no celular.
- Controle de câmera por mouse ou arraste na tela.
- Rifle, pistola e shotgun com troca de arma e recarga.
- Alvos de treino com hitbox de peito e cabeça.
- Dano numérico flutuante e indicação de CAPA (headshot).
- HUD com vida, colete, munição, minimapa ilustrativo, tempo e eliminações.
- Pulo, agachar, mirar, pausar e reiniciar treinamento.
- Ajustes automáticos de qualidade para aparelhos móveis e hardware modesto.

## Executar no Termux

Requer Node.js instalado.

```sh
git pull
npm install
npm run dev -- --host 0.0.0.0
```

Abra no navegador do próprio aparelho o endereço local exibido pelo Vite. Para acessar por outro dispositivo na mesma rede, use o endereço de rede informado no terminal.

## Controles

### Celular
- Analógico esquerdo: movimentar.
- Arrastar no lado direito: girar a câmera.
- Botões na tela: atirar, mirar, pular, agachar, recarregar e trocar arma.

### Computador
- WASD ou setas: movimentar.
- Mouse: mirar e atirar.
- Espaço: pular.
- Shift: correr.
- R: recarregar.
- 1, 2 e 3: trocar arma.

## Limites desta versão

Este é um protótipo local single-player. Os alvos são bots de treinamento; ainda não há matchmaking, partidas online, contas, salvamento em servidor ou multiplayer. O minimapa é ilustrativo. O projeto usa Vite e Three.js.
