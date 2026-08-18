# 🕐 Clock Virtual

Relógio digital **e sistema Pomodoro** feitos com **Electron**, usando `HTML`, `CSS` e `JavaScript`. Projetado com arquitetura modular e boas práticas de segurança e testabilidade.

## ✨ Funcionalidades

### Relógio
- ⏰ Exibe hora atual em tempo real (tick alinhado ao segundo real)
- 📅 Mostra data completa em pt-BR
- 👋 Saudação conforme o horário (Bom dia, Boa tarde, Boa noite)

### Pomodoro
- 🍅 Sessão fixa de 6 ciclos: Foco (25 min) → Pausa curta (5 min) → Foco → Pausa curta → Foco → Pausa longa (15 min), finalizando ao fim
- ▶️ Iniciar / Pausar / Retomar / Pular / Resetar
- 🔄 Anel de progresso circular + contador de ciclos
- ⚙️ Durações das etapas configuráveis (persistidas em `localStorage`)
- 🔔 Notificações nativas do SO no desktop e Web Notification API no navegador (com pedido de permissão explícito, via controle na interface)
- ⏱️ Timer baseado em timestamp absoluto — sem drift

### Geral
- 🪟 Janela frameless, arrastável, sem menu
- 🗂️ Navegação por abas (acessível, com suporte a teclado)
- 🛡️ Segurança: `contextIsolation`, `sandbox`, `nodeIntegration: off`, CSP, IPC via `contextBridge`

## 🗂️ Estrutura do projeto

```
├── main/                        # Processo principal (ES Modules)
│   ├── main.js                  # Ciclo de vida da janela + app
│   ├── preload.cjs              # Ponte segura (CommonJS — exceção obrigatória do sandbox)
│   └── notifications.js         # Notificações nativas do SO (via IPC)
├── renderer/                    # Processo de renderização (ES Modules)
│   ├── index.html               # Estrutura da página (com abas)
│   ├── app.js                   # Bootstrap (registra views e módulos)
│   ├── styles/
│   │   ├── base.css             # Variáveis, reset e visual base
│   │   ├── tabs.css             # Navegação por abas
│   │   └── pomodoro.css         # UI do Pomodoro
│   ├── core/
│   │   ├── tabs.js              # Gerenciador de abas (estado + a11y)
│   │   └── notify.js            # Wrapper de notificações (nativo + fallback)
│   └── features/
│       ├── clock/
│       │   ├── clock.js         # Engine pura (dados/formatação, sem DOM)
│       │   └── clock.view.js    # Renderização no DOM
│       └── pomodoro/
│           ├── pomodoro.js      # Máquina de estados + timer acurado (engine)
│           ├── pomodoro.view.js # UI (anel, controles, settings)
│           └── settings.js      # Configurações + persistência
├── tests/                       # Suíte de testes (Jest)
└── package.json
```

## 🏗️ Arquitetura e padrões

- **Padronização ES Modules** — `package.json` com `"type": "module"`: o processo principal (`main/`) e o renderer usam `import`/`export` de forma uniforme. A única exceção é o `preload.cjs` (CommonJS), exigência do sandbox do Electron — mantém a segurança e evita duplicidade de padrões.
- **Separação engine × view** — a lógica (pura, sem DOM) é isolada da renderização; as engines são testáveis de forma determinística.
- **Máquina de estados** — o Pomodoro modela `idle → running → paused` e as fases `focus ⇄ shortBreak ⇄ longBreak`.
- **Observer pattern** — a engine emite eventos (`tick`, `state-change`, `phase-change`, `reset`, `settings-change`) que a view e as notificações consomem.
- **Dependency injection** — engines recebem `now`/`intervalFn` (relógio injetável) e o wrapper de notificação aceita `bridge`/`Notification` (testabilidade).
- **Factory + módulos ES** — criação via fábricas e feature modules autocontidos em `features/`.
- **IPC seguro** — o renderer nunca acessa o Node; tudo passa por `preload.cjs` com `contextBridge`.

## 🚀 Como executar

```bash
npm install
npm start
```

## 🧪 Como testar

```bash
npm test
```

> Suíte com **Jest** (rodando em modo ESM nativo) cobrindo as engines (clock e pomodoro) e o módulo de settings. 19 testes, 3 suites.

## 🛠️ Tecnologias

- [Electron](https://www.electronjs.org/) — runtime desktop
- HTML5 / CSS3 / JavaScript (Vanilla, ES Modules)
- [Jest](https://jestjs.io/) — testes

## 📝 Licença

Distribuído sob a licença **ISC**.