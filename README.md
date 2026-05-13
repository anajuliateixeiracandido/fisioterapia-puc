# Fisioterapia PUC

Sistema web para gestão de atendimentos fisioterapêuticos, desenvolvido como projeto acadêmico da PUC. A plataforma permite que alunos e professores gerenciem pacientes, elaborem relatórios clínicos e apliquem a Classificação Internacional de Funcionalidade, Incapacidade e Saúde (CIF).

## Estrutura do Projeto

```
fisioterapia-puc/
├── backend/   # API REST — Node.js + Express + TypeScript + Prisma
└── frontend/  # Interface web — React + Vite
```

## Funcionalidades

- Autenticação com JWT e refresh token, com controle de sessão seguro
- Controle de acesso por papel: **Aluno** e **Professor**
- Cadastro e gerenciamento de pacientes
- Elaboração e revisão de relatórios clínicos baseados na CIF
- Fluxo de aprovação de relatórios (enviado → aprovado / negado / corrigido)
- Recuperação de senha por e-mail

## Tecnologias

| Camada    | Stack principal                                      |
|-----------|------------------------------------------------------|
| Backend   | Node.js, Express 5, TypeScript, Prisma, PostgreSQL   |
| Frontend  | React 19, Vite, JavaScript (JSX)                     |
| Auth      | JWT (access + refresh token), bcrypt                 |
| E-mail    | Resend                                               |
| Validação | Zod                                                  |
| Testes    | Vitest                                               |

## Pré-requisitos

- Node.js 20+
- PostgreSQL
- npm ou outro gerenciador de pacotes compatível

## Início Rápido

```bash
# 1. Clone o repositório
git clone https://github.com/<org>/fisioterapia-puc.git
cd fisioterapia-puc

# 2. Configure e inicie o backend
cd backend
cp .env.example .env   # preencha as variáveis de ambiente
npm install
npx prisma migrate deploy
npm run dev

# 3. Em outro terminal, inicie o frontend
cd ../frontend
npm install
npm run dev
```

Consulte os READMEs individuais em [`backend/`](./backend/README.md) e [`frontend/`](./frontend/README.md) para instruções detalhadas.
