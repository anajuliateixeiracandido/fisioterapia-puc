import { Resend } from 'resend'
import env from '../config/env'

const resend = new Resend(env.resend.apiKey)

async function enviarEmailResetSenha(destinatario: string, token: string): Promise<void> {
  const link = `${env.frontend.url}/reset-password?token=${token}`

  await resend.emails.send({
    from: env.resend.from,
    to: destinatario,
    subject: 'Redefinição de senha — Sistema de Fisioterapia PUC Minas',
    html: `
    <h2>Redefinição de senha</h2>
    <p>Você solicitou a redefinição da sua senha.</p>
    <p>Clique no link abaixo para criar uma nova senha:</p>
    <a href="${link}">${link}</a>
    <p>Este link expira em ${env.passwordReset.expiresInMinutes} minutos.</p>
    <p>Se você não solicitou a redefinição, ignore este e-mail.</p>
  `,
  })
}

export { enviarEmailResetSenha }
