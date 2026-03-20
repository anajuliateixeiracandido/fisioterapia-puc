import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import routes from './src/routes'
import { errorHandler } from './src/middlewares/error.middleware'

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())

app.use('/api/v1', routes)

app.use(errorHandler)

export default app