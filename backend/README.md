# Backend — Fisioterapia PUC

API REST para o sistema de gestão fisioterapêutica da PUC. Construída com Node.js, Express 5 e TypeScript, utiliza Prisma como ORM sobre PostgreSQL e segue uma arquitetura em camadas (routes → controllers → services).

## Tecnologias

| Pacote              | Uso                                     |
|---------------------|-----------------------------------------|
| Express 5           | Framework HTTP                          |
| TypeScript + tsx    | Linguagem e execução em desenvolvimento |
| Prisma              | ORM e migrações (PostgreSQL)            |
| Zod                 | Validação de entrada                    |
| JSON Web Token      | Access token e refresh token            |
| bcryptjs            | Hash de senhas                          |
| Resend              | Envio de e-mails transacionais          |
| Helmet + CORS       | Segurança HTTP                          |
| Vitest              | Testes unitários e de integração        |

## Estrutura de Pastas

```
backend/
├── index.ts                  # Ponto de entrada (inicia o servidor)
├── app.ts                    # Configuração do Express
├── prisma/
│   ├── schema.prisma         # Modelos do banco de dados
│   ├── seed.ts               # Seed de dados CIF
│   └── migrations/           # Histórico de migrações
└── src/
    ├── config/env.ts         # Validação e exportação de variáveis de ambiente
    ├── controllers/          # Recebem requisições e delegam para services
    ├── services/             # Regras de negócio
    ├── routes/               # Definição das rotas da API
    ├── middlewares/          # Auth, roles e tratamento de erros
    ├── validators/           # Schemas Zod para validação de input
    ├── utils/                # Helpers (JWT, hash)
    ├── errors/AppError.ts    # Classe de erro customizado
    └── __tests__/            # Testes unitários e de serviço
```

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do `backend/` com as seguintes variáveis:

```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/fisioterapia

PORT=3000

JWT_SECRET=seu_segredo_jwt
JWT_EXPIRES_IN=15m

REFRESH_TOKEN_EXPIRES_IN_DAYS=7

RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM=noreply@seudominio.com

FRONTEND_URL=http://localhost:5173

PASSWORD_RESET_EXPIRES_IN_MINUTES=30
```

## Instalação e Execução

```bash
# Instalar dependências
npm install

# Aplicar migrações no banco
npx prisma migrate deploy

# Popular dados de referência CIF
npm run prisma:seed:cif

# Iniciar em modo de desenvolvimento (hot-reload)
npm run dev

# Build para produção
npm run build
npm start
```

## Scripts Disponíveis

| Comando                  | Descrição                                  |
|--------------------------|--------------------------------------------|
| `npm run dev`            | Servidor com hot-reload via `tsx watch`    |
| `npm run build`          | Compila TypeScript para `dist/`            |
| `npm start`              | Executa o build compilado                  |
| `npm test`               | Roda todos os testes com Vitest            |
| `npm run test:watch`     | Testes em modo watch                       |
| `npm run test:coverage`  | Relatório de cobertura de testes           |
| `npm run studio`         | Abre o Prisma Studio (visualização do DB)  |
| `npm run prisma:seed:cif`| Popula tabelas de referência CIF           |
| `npm run lint`           | Linting com ESLint                         |
| `npm run format`         | Formatação com Prettier                    |

## Endpoints da API

Base URL: `/api/v1`

| Método | Rota                         | Descrição                              | Auth |
|--------|------------------------------|----------------------------------------|------|
| GET    | `/health`                    | Health check                           | Não  |
| POST   | `/auth/login`                | Login (retorna access + refresh token) | Não  |
| POST   | `/auth/refresh`              | Renova o access token                  | Não  |
| POST   | `/auth/logout`               | Invalida o refresh token               | Sim  |
| POST   | `/auth/forgot-password`      | Solicita e-mail de redefinição de senha| Não  |
| POST   | `/auth/reset-password`       | Redefine a senha via token             | Não  |
| GET    | `/fisioterapeuta`            | Lista fisioterapeutas                  | Sim  |
| POST   | `/fisioterapeuta`            | Cria fisioterapeuta                    | Sim  |
| GET    | `/pacientes`                 | Lista pacientes                        | Sim  |
| POST   | `/pacientes`                 | Cadastra paciente                      | Sim  |
| GET    | `/pacientes/:id`             | Detalha paciente                       | Sim  |
| PUT    | `/pacientes/:id`             | Atualiza paciente                      | Sim  |
| GET    | `/relatorios`                | Lista relatórios                       | Sim  |
| POST   | `/relatorios`                | Cria relatório                         | Sim  |
| GET    | `/relatorios/:id`            | Detalha relatório                      | Sim  |
| PATCH  | `/relatorios/:id/status`     | Atualiza status do relatório           | Sim  |
| GET    | `/cif-referencias`           | Lista itens de referência CIF          | Sim  |

## Papéis de Usuário

| Papel       | Permissões                                                    |
|-------------|---------------------------------------------------------------|
| `ALUNO`     | Cria e edita seus próprios relatórios; acessa seus pacientes  |
| `PROFESSOR` | Aprova/nega relatórios dos alunos; acesso amplo              |

## Modelos Principais

- **Fisioterapeuta** — usuário do sistema (aluno ou professor)
- **Paciente** — paciente cadastrado com dados clínicos
- **Relatorio** — relatório clínico associado a um paciente
- **FormularioCIF** — formulário estruturado seguindo a CIF
- **ItemCIF** — item individual da CIF (estrutura, função, atividade, fator ambiental)
