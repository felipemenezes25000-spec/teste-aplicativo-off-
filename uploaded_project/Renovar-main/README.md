# RenoveJá+ - Sistema de Telemedicina

## Sobre o Projeto

O RenoveJá+ é uma plataforma completa de telemedicina que permite renovação de receitas médicas, solicitação de exames e agendamento de consultas online.

## Como editar este código?

Há várias formas de editar a aplicação.

**Use sua IDE preferida**

Você pode trabalhar localmente usando sua própria IDE. Clone este repositório e faça push das alterações.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Como fazer deploy deste projeto?

Para fazer deploy, você pode usar plataformas como Vercel, Netlify ou qualquer serviço de hospedagem que suporte aplicações React/Vite.

### Deploy com Vercel

```sh
npm install -g vercel
vercel
```

### Deploy com Netlify

```sh
npm run build
# Faça upload da pasta dist/ para o Netlify
```

## Como conectar um domínio personalizado?

Sim, você pode!

Para conectar um domínio, configure as DNS records do seu provedor de hospedagem apontando para o serviço de deploy escolhido.
