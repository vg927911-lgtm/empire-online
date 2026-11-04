# Empire Online

Protótipo de FPS mobile em desenvolvimento, com lobby de shooter, arena 3D e controles adaptados para toque.

## Lobby 0.4
- Tela inicial redesenhada com composição cinematográfica de base militar.
- Operador tático estilizado em destaque, painel de modo e botão de entrada na arena.
- Navegação de lobby, arsenal/skins e configurações.
- Seleção de skin salva localmente.
- Layout responsivo para celular em orientação retrato e desktop.

## Executar localmente

```bash
npm install
npm run dev -- --host 0.0.0.0
```

Abra o endereço informado pelo Vite no navegador. Para gerar a versão de produção:

```bash
npm run build
```

## Estado do projeto
Pré-alpha. O lobby é uma interface visual de protótipo; moedas, loja, temporada e dados de conta ainda são elementos demonstrativos. O modo de treinamento usa a arena local existente. Ainda não há autenticação, partidas online ou economia conectada a servidor.
