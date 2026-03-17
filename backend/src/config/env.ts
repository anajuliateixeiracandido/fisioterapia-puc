import 'dotenv/config'
import type { SignOptions } from 'jsonwebtoken'

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
}

export default env