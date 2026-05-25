import './src/config/env'
import app from './app'
import env from './src/config/env'

app.listen(env.port, () => {
  console.log(`Servidor rodando na porta ${env.port}`)
})
