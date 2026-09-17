import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import type { SignOptions } from 'jsonwebtoken'

const backendRoot = path.basename(path.resolve(__dirname, '../..')) === 'dist'
  ? path.resolve(__dirname, '../../../')
  : path.resolve(__dirname, '../../')

function resolverTemplatePath(valor?: string): string {
  const nomeTemplate = valor || 'templates/avaliacao-funcional-pediatrica.docx'
  if (path.isAbsolute(nomeTemplate)) return nomeTemplate

  const candidatos = [
    path.resolve(backendRoot, nomeTemplate),
    path.resolve(backendRoot, '..', nomeTemplate),
    path.resolve(process.cwd(), nomeTemplate),
  ]

  return candidatos.find((candidato) => fs.existsSync(candidato)) ?? candidatos[0]
}

const required = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'REFRESH_TOKEN_EXPIRES_IN_DAYS',
  'RESEND_API_KEY',
  'RESEND_FROM',
  'FRONTEND_URL',
  'PASSWORD_RESET_EXPIRES_IN_MINUTES',
]

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Variável de ambiente obrigatória não definida: ${key}`)
  }
}

const env = {
  port: Number(process.env.PORT) || 3000,
  jwt: {
    secret: process.env.JWT_SECRET as string,
    expiresIn: process.env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  },
  refreshToken: {
    expiresInDays: Number(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS),
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY as string,
    from: process.env.RESEND_FROM as string,
  },
  frontend: {
    url: process.env.FRONTEND_URL as string,
  },
  passwordReset: {
    expiresInMinutes: Number(process.env.PASSWORD_RESET_EXPIRES_IN_MINUTES),
  },
  docx: {
    templatePath: resolverTemplatePath(process.env.DOCX_TEMPLATE_PATH),
  },
}

export default env
