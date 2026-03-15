import { Router } from 'express'
import { cadastrar } from '../controllers/fisioterapeuta.controller'

const router = Router()

router.post('/', cadastrar)

export default router