# Empire Online

Protótipo TPS mobile-first feito com Vite e Three.js.

## Versão visual 0.2

- Menu principal com identidade visual tática, tela de personalização e configurações.
- Quatro paletas cosméticas selecionáveis; a escolha fica salva no aparelho.
- Arena com texturas procedurais de areia e pedra, sem depender de downloads externos.
- HUD de combate, controles touch, rifle, pistola e shotgun.
- Alvos de treino com hitboxes de cabeça e peito, dano e indicação de CAPA.
- Qualidade gráfica ajustada automaticamente para aparelhos modestos.

## Executar no Termux

```sh
git pull origin main
npm install
npm run dev -- --host 0.0.0.0
```

Abra `http://localhost:5173` no navegador do aparelho.

## Controles

### Celular
- Analógico esquerdo: movimentar.
- Arrastar no lado direito: girar a câmera.
- Botões: atirar, mirar, pular, agachar, recarregar e trocar arma.

### Computador
- WASD/setas: movimentar; mouse: mirar/atirar.
- Espaço: pular; Shift: correr; R: recarregar; 1/2/3: trocar arma.

## Estado do projeto

Esta versão continua sendo um protótipo single-player local. As skins são cosméticas e salvas localmente no navegador. Ainda não existe servidor de contas, login Google, banco de dados online, matchmaking ou multiplayer. Para essas funções será necessário configurar um projeto Supabase (ou backend equivalente), as chaves públicas de ambiente e o provedor OAuth do Google; nenhuma chave privada deve ser colocada no código do cliente.
