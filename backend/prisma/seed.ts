import prisma from '../src/lib/prisma'

async function main() {
    await prisma.cIFReferencia.createMany({
        data: [
            {
                tipoCIF: 'CIF',
                codigo: 'b280',
                descricao: 'Sensação de dor',
                categoria: 'FUNCAO',
                nivel: 1,
            },
            {
                tipoCIF: 'CIF',
                codigo: 'b130',
                descricao: 'Funções de energia e impulsos',
                categoria: 'FUNCAO',
                nivel: 1,
            },
            {
                tipoCIF: 'CIF',
                codigo: 'd410',
                descricao: 'Mudar posição básica do corpo',
                categoria: 'PARTICIPACAO',
                nivel: 1,
            },
            {
                tipoCIF: 'CIF',
                codigo: 'd450',
                descricao: 'Andar',
                categoria: 'ACTIVIDADE',
                nivel: 1,
            },
            {
                tipoCIF: 'CIF',
                codigo: 'e310',
                descricao: 'Família próxima',
                categoria: 'FACTOR_AMBIENTAL',
                nivel: 1,
            },
        ],
        skipDuplicates: true,
    })

    console.log('✅ Seed de CIF executado com sucesso')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })