# 🕐 Clock Virtual

Um relógio digital simples feito com **Electron**, usando apenas `HTML`, `CSS` e `JavaScript`. Perfeito para aprender ou usar como base.

## ✨ Funcionalidades

- ⏰ Exibe hora atual em tempo real
- 📅 Mostra data completa.
- 👋 Saudação conforme o horário (Bom dia, Boa tarde, Boa noite)
- 🪟 Janela sem borda (frameless), arrastável e sem menu

## 🗂️ Estrutura do projeto

```
├── main/
│   ├── main.js         # Processo principal do Electron (janela + ciclo de vida)
│   ├── preload.js      # Ponte segura (contextBridge) entre renderer e Node
│   └── notifications.js # Notificações nativas do SO (via IPC)
├── renderer/
│   ├── index.html      # Estrutura da página (com abas)
│   ├── app.js          # Bootstrap do renderer (módulo ES)
│   ├── styles/
│   │   ├── base.css    # Estilos base e visual
│   │   ├── tabs.css    # Navegação por abas
│   │   └── pomodoro.css # UI do Pomodoro
│   ├── core/
│   │   ├── tabs.js     # Gerenciador de abas (estado + acessibilidade)
│   │   └── notify.js   # Wrapper de notificações (nativo + fallback HTML5)
│   └── features/
│       ├── clock/
│       │   ├── clock.js      # Engine pura do relógio (dados/formatação, sem DOM)
│       │   └── clock.view.js # Renderização no DOM (tick alinhado ao segundo)
│       └── pomodoro/
│           ├── pomodoro.js      # Máquina de estados + timer acurado (engine)
│           ├── pomodoro.view.js # UI do Pomodoro (anel, controles, settings)
│           └── settings.js      # Configurações (foco/pausas/ciclos) com persistência
```

## 🚀 Como executar

```bash
# Instala as dependências
npm install

# Inicia o relógio
npm start
```

## 🛠️ Tecnologias

- [Electron](https://www.electronjs.org/) 🖥️
- HTML5 / CSS3 📄
- JavaScript (Vanilla) ⚡

## 📝 Licença

Distribuído sob a licença **ISC**.
