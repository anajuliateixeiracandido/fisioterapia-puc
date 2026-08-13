const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

const DEFAULT_PASSWORD = 'Senha@123'

async function hashPassword(password) {
    return bcrypt.hash(password, 12)
}

async function createProfessor({ nome, email, codigoPessoa, coordenador = false }) {
    const senhaHash = await hashPassword(DEFAULT_PASSWORD)

    const fisioterapeuta = await prisma.fisioterapeuta.create({
        data: {
            nomeCompleto: nome,
            email,
            senha: senhaHash,
            role: 'PROFESSOR',
            professor: {
                create: {
                    codigoPessoa,
                    coordenador,
                },
            },
        },
        include: {
            professor: true,
        },
    })

    return { ...fisioterapeuta, tipo: 'PROFESSOR' }
}

async function createAluno({ nome, email, matricula, professorCodigoPessoa }) {
    const senhaHash = await hashPassword(DEFAULT_PASSWORD)

    const professor = await prisma.professor.findFirst({
        where: { codigoPessoa: professorCodigoPessoa },
    })

    if (!professor) {
        throw new Error(`Professor com codigoPessoa ${professorCodigoPessoa} não encontrado`)
    }

    const fisioterapeuta = await prisma.fisioterapeuta.create({
        data: {
            nomeCompleto: nome,
            email,
            senha: senhaHash,
            role: 'ALUNO',
            aluno: {
                create: {
                    matricula,
                    professorId: professor.id,
                },
            },
        },
        include: {
            aluno: true,
        },
    })

    return { ...fisioterapeuta, tipo: 'ALUNO' }
}

async function ensureUniqueEmails(emails) {
    const seen = new Set()

    for (const email of emails) {
        const existing = await prisma.fisioterapeuta.findUnique({
            where: { email },
            select: { id: true },
        })

        if (existing) {
            throw new Error(`E-mail já existe: ${email}`)
        }

        if (seen.has(email)) {
            throw new Error(`E-mail duplicado no lote: ${email}`)
        }

        seen.add(email)
    }
}

async function main() {
    const professores = [
        {
            nome: 'Professor Fisioterapia 01',
            email: 'professor1@pucminas.edu.br',
            codigoPessoa: '10001',
            coordenador: true,
        },
        {
            nome: 'Professor Fisioterapia 02',
            email: 'professor2@pucminas.edu.br',
            codigoPessoa: '10002',
            coordenador: false,
        },
        {
            nome: 'Professor Fisioterapia 03',
            email: 'professor3@pucminas.edu.br',
            codigoPessoa: '10003',
            coordenador: false,
        },
    ]

    const alunos = [
        {
            nome: 'Aluno Fisioterapia 01',
            email: 'aluno1@pucminas.edu.br',
            matricula: '20001',
            professorCodigoPessoa: '10001',
        },
        {
            nome: 'Aluno Fisioterapia 02',
            email: 'aluno2@pucminas.edu.br',
            matricula: '20002',
            professorCodigoPessoa: '10001',
        },
        {
            nome: 'Aluno Fisioterapia 03',
            email: 'aluno3@pucminas.edu.br',
            matricula: '20003',
            professorCodigoPessoa: '10002',
        },
    ]

    const emails = [...professores.map((p) => p.email), ...alunos.map((a) => a.email)]

    await ensureUniqueEmails(emails)

    const created = []

    for (const professor of professores) {
        const item = await createProfessor(professor)
        created.push(item)
    }

    for (const aluno of alunos) {
        const item = await createAluno(aluno)
        created.push(item)
    }

    console.log('Usuários criados com sucesso:')
    for (const item of created) {
        console.log(`- ${item.tipo}: ${item.nomeCompleto} | ${item.email} | senha: ${DEFAULT_PASSWORD}`)
    }
}

main()
    .catch((error) => {
        console.error('Erro ao criar fisioterapeutas:', error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
