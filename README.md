# Lohan AI

Assistente de inteligência artificial pessoal, com chat em streaming, histórico persistente em SQLite e integração real com a API da OpenAI.

> **Status:** `lint`, `typecheck` e `build` foram executados com sucesso. Para usar o chat com a OpenAI, configure `OPENAI_API_KEY` conforme a seção [Instalação](#instalação). A integração com a API depende de uma chave válida e de cota disponível.

## Pré-requisitos

- Node.js 18.18 ou superior (recomendado: 20 LTS)
- npm
- Uma chave de API da OpenAI (https://platform.openai.com/api-keys) com saldo/cota ativa
- Acesso à internet na instalação (dependências e fontes do Google Fonts via `next/font`)

## Instalação

```bash
npm install
cp .env.example .env.local
```

Abra o `.env.local` e preencha:

```
OPENAI_API_KEY=sua_chave_aqui
```

A chave existe apenas no servidor. Ela nunca é enviada ao navegador nem gravada no banco. O `.env.local` está no `.gitignore`.

## Banco de dados

O SQLite fica em `prisma/dev.db` (ignorado pelo Git). Na primeira vez, crie o banco e a migração inicial:

```bash
npm run db:migrate -- --name init
```

A migração inicial já está versionada em `prisma/migrations/`. O banco local é criado/atualizado pelo comando acima; em produção, aplique as migrações versionadas com `npm run db:deploy`.

## Executar

```bash
npm run dev
```

Acesse http://localhost:3000.

Produção local:

```bash
npm run build
npm run start
```

## Verificação

```bash
npm run lint
npm run typecheck
npm run build
```

Esses comandos foram executados com sucesso. O envio de mensagens e a resposta da OpenAI só podem ser verificados com uma chave de API válida configurada no `.env.local`.

## Funcionalidades

- Chat com streaming conectado à OpenAI (SDK oficial)
- Botão para interromper a geração (o texto parcial é salvo)
- Nova conversa, listagem, abertura de conversas anteriores
- Renomear (inline) e excluir (com confirmação)
- Histórico persistente em SQLite via Prisma
- Respostas em Markdown (listas, tabelas, links) e blocos de código com botão de copiar
- Botão de copiar em cada resposta
- Enter envia, Shift + Enter quebra linha
- Configurações: modelo e personalidade (instruções de sistema) com modelos prontos
- Tema escuro (padrão) e claro
- Sidebar recolhível no desktop e em gaveta no celular
- Mensagens de erro claras (sem chave, chave inválida, cota, limite de requisições, rede)
- Se a chamada à IA falhar, nada é inventado nem salvo; o texto volta para o campo de mensagem

## Segurança

- `OPENAI_API_KEY` lida apenas no servidor (`lib/openai.ts`)
- Mensagens limitadas a 8.000 caracteres; corpo da requisição a 64 KB
- IDs de conversa validados com Zod e existência confirmada antes de ler, renomear ou excluir
- Acesso ao banco somente via Prisma (consultas parametrizadas)
- Apenas os últimos 40 turnos são enviados como contexto

## Estrutura

```
app/                 páginas e rotas de API (chat, conversations, settings)
components/          sidebar, chat, mensagens, campo de entrada, configurações, ui/
lib/                 prisma, cliente OpenAI, validação, constantes, serviços
lib/services/        acesso ao banco (conversas e configurações)
prisma/              schema (e migrações, após o primeiro db:migrate)
public/              logotipo
```

## Limitações conhecidas

- Não testado em execução (ver aviso no topo)
- Sem login: pensado para uso pessoal e local. Se for publicar na internet, adicione autenticação, senão qualquer pessoa com acesso usa a sua chave
- O SQLite local não funciona em hospedagens serverless de disco efêmero (ex.: Vercel)
- Blocos de código sem destaque de sintaxe (apenas fonte monoespaçada e botão de copiar)
- Lista de modelos fixa em `lib/constants.ts`; edite para incluir outros
- Sem regenerar resposta, anexos de arquivos ou busca no histórico
- Sem limite de requisições por usuário no servidor (depende dos limites da OpenAI)
- O título da conversa é o início da primeira mensagem (não é gerado pela IA)

## Problemas comuns

- **"A chave da OpenAI não está configurada"**: confira o `.env.local` e reinicie o `npm run dev`
- **"Não foi possível carregar as conversas"**: rode `npm run db:migrate -- --name init`
- **Erro de versão do Prisma/Next**: apague `node_modules` e `package-lock.json` e rode `npm install` de novo
