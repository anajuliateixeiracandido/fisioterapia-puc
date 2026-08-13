const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const DATA_HOJE = new Date().toISOString().slice(0, 10)

function formatDateBR(date) {
    const d = new Date(date)
    const dia = String(d.getDate()).padStart(2, '0')
    const mes = String(d.getMonth() + 1).padStart(2, '0')
    const ano = d.getFullYear()
    return `${dia}/${mes}/${ano}`
}

async function getOrCreatePaciente({ nome, dataNascimento, sexo, professorCodigoPessoa }) {
    const professor = await prisma.professor.findFirst({
        where: { codigoPessoa: professorCodigoPessoa },
        select: { id: true },
    })

    if (!professor) {
        throw new Error(`Professor com código ${professorCodigoPessoa} não encontrado`)
    }

    const pacienteExistente = await prisma.paciente.findFirst({
        where: {
            nomeCompleto: nome,
            professorId: professor.id,
        },
        select: { id: true, nomeCompleto: true },
    })

    if (pacienteExistente) {
        return pacienteExistente
    }

    return prisma.paciente.create({
        data: {
            nomeCompleto: nome,
            dataNascimento: new Date(dataNascimento),
            sexo,
            professorId: professor.id,
        },
        select: { id: true, nomeCompleto: true },
    })
}

async function getAlunoByMatricula(matricula) {
    return prisma.aluno.findFirst({
        where: { matricula },
        select: { id: true, fisioterapeutaId: true, professorId: true },
    })
}

async function getCifItems() {
    const item1 = await prisma.cIFReferencia.findFirst({
        where: { codigo: 'b110' },
        select: { codigo: true, descricao: true, categoria: true, nivel: true },
    })

    const item2 = await prisma.cIFReferencia.findFirst({
        where: { codigo: 'd230' },
        select: { codigo: true, descricao: true, categoria: true, nivel: true },
    })

    const item3 = await prisma.cIFReferencia.findFirst({
        where: { codigo: 'e310' },
        select: { codigo: true, descricao: true, categoria: true, nivel: true },
    })

    if (!item1 || !item2 || !item3) {
        throw new Error('Itens CIF básicos não encontrados. Rode o seed de CIF primeiro.')
    }

    return [item1, item2, item3]
}

async function createRelatorio({ pacienteId, autorEmail, professorCodigoPessoa, status, observacoes }) {
    const autor = await prisma.fisioterapeuta.findUnique({
        where: { email: autorEmail },
        select: { id: true, role: true },
    })

    if (!autor) {
        throw new Error(`Usuário autor não encontrado: ${autorEmail}`)
    }

    const professor = await prisma.professor.findFirst({
        where: { codigoPessoa: professorCodigoPessoa },
        select: { id: true },
    })

    if (!professor) {
        throw new Error(`Professor responsável não encontrado: ${professorCodigoPessoa}`)
    }

    const items = await getCifItems()

    const formulario = await prisma.formularioCIF.create({
        data: {
            tipoCIF: 'CIF',
            dataPreenchimento: new Date(),
            ultimaAlteracao: new Date(),
            condicaoSaude: 'Transtorno motor',
            condicaoSaudeDescricao: 'Paciente em reabilitação motora com limitação funcional observada em atividades diárias.',
            factoresPessoais: 'Motivação moderada e boa adesão às orientações.',
            planoTerapeutico: 'Acompanhamento semanal com foco em mobilidade e independência funcional.',
            diagnosticoFisioterapeutico: 'Dificuldade funcional para mobilidade e atividades de autocuidado.',
            objetivoCurtoPrazo: 'Melhorar mobilidade e estabilidade postural em atividades cotidianas.',
            objetivoLongoPrazo: 'Aumentar independência funcional e qualidade de vida.',
            observacoes: observacoes || 'Relatório gerado automaticamente para teste do sistema.',
            itens: {
                create: [
                    {
                        codigoCIF: items[0].codigo,
                        descricao: items[0].descricao,
                        categoria: items[0].categoria,
                        nivel: items[0].nivel ?? 0,
                        qualificador1: 1,
                        tipoQualificador1: 'FACILITADOR',
                        observacao: 'Melhora da execução funcional.',
                    },
                    {
                        codigoCIF: items[1].codigo,
                        descricao: items[1].descricao,
                        categoria: items[1].categoria,
                        nivel: items[1].nivel ?? 0,
                        qualificador1: 2,
                        tipoQualificador1: 'BARREIRA',
                        observacao: 'Limitação para mobilidade e deslocamento.',
                    },
                    {
                        codigoCIF: items[2].codigo,
                        descricao: items[2].descricao,
                        categoria: items[2].categoria,
                        nivel: items[2].nivel ?? 0,
                        qualificador1: 1,
                        tipoQualificador1: 'FACILITADOR',
                        observacao: 'Presença de suporte ambiental adequado.',
                    },
                ],
            },
        },
        select: { id: true },
    })

    return prisma.relatorio.create({
        data: {
            pacienteId,
            fisioterapeutaId: autor.id,
            professorResponsavelId: professor.id,
            status,
            formularioCIFId: formulario.id,
        },
        select: {
            id: true,
            status: true,
            dataCriacao: true,
            paciente: { select: { nomeCompleto: true } },
            fisioterapeuta: { select: { nomeCompleto: true, email: true, role: true } },
            professorResponsavel: { select: { codigoPessoa: true } },
        },
    })
}

async function main() {
    const professorCoordenador = await prisma.professor.findFirst({
        where: { coordenador: true },
        select: { codigoPessoa: true, fisioterapeuta: { select: { email: true, nomeCompleto: true } } },
    })

    if (!professorCoordenador) {
        throw new Error('Nenhum professor coordenador encontrado. Crie os fisioterapeutas primeiro.')
    }

    const pacienteA = await getOrCreatePaciente({
        nome: 'Paciente Relatório 01',
        dataNascimento: '2012-02-14',
        sexo: 'M',
        professorCodigoPessoa: professorCoordenador.codigoPessoa,
    })

    const pacienteB = await getOrCreatePaciente({
        nome: 'Paciente Relatório 02',
        dataNascimento: '2015-04-22',
        sexo: 'F',
        professorCodigoPessoa: professorCoordenador.codigoPessoa,
    })

    const aluno = await getAlunoByMatricula('20001')

    if (!aluno) {
        throw new Error('Aluno com matrícula 20001 não encontrado. Crie os fisioterapeutas primeiro.')
    }

    const relatorioProfessor = await createRelatorio({
        pacienteId: pacienteA.id,
        autorEmail: professorCoordenador.fisioterapeuta.email,
        professorCodigoPessoa: professorCoordenador.codigoPessoa,
        status: 'APROVADO',
        observacoes: 'Relatório gerado por professor para validação de fluxo do sistema.',
    })

    const relatorioAluno = await createRelatorio({
        pacienteId: pacienteB.id,
        autorEmail: 'aluno1@pucminas.edu.br',
        professorCodigoPessoa: professorCoordenador.codigoPessoa,
        status: 'ENVIADO',
        observacoes: 'Relatório enviado pelo aluno para revisão do professor.',
    })

    console.log('Relatórios criados com sucesso:')
    console.log(`- PROFESSOR: ${relatorioProfessor.id} | paciente=${relatorioProfessor.paciente.nomeCompleto} | autor=${relatorioProfessor.fisioterapeuta.nomeCompleto} | status=${relatorioProfessor.status}`)
    console.log(`- ALUNO: ${relatorioAluno.id} | paciente=${relatorioAluno.paciente.nomeCompleto} | autor=${relatorioAluno.fisioterapeuta.nomeCompleto} | status=${relatorioAluno.status}`)
}

main()
    .catch((error) => {
        console.error('Erro ao criar relatórios:', error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
