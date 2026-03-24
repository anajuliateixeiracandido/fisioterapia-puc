import { PrismaClient, CategoriaCIF, TipoCIF } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

type CIFItem = {
    tipoCIF: TipoCIF
    codigo: string
    codigoPai: string | null
    descricao: string
    categoria: CategoriaCIF
    nivel: number
    capitulo: number | null
    ordemExibicao: number | null
}

async function main() {
    const filePath = path.join(process.cwd(), 'prisma', 'data', 'cif.json')
    const raw = fs.readFileSync(filePath, 'utf-8')
    const data: CIFItem[] = JSON.parse(raw)

    const chunkSize = 1000

    for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize)

        await prisma.cIFReferencia.createMany({
            data: chunk,
            skipDuplicates: true,
        })

        console.log(`Inseridos ${Math.min(i + chunkSize, data.length)} de ${data.length}`)
    }

    console.log('Seed finalizado com sucesso.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })