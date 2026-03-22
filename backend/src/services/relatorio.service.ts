import prisma from "../lib/prisma";
import { AppError } from "../errors/AppError";
import { CadastroRelatorioInput } from "../validators/relatorio.validator";

function parseDateBR(data: string): Date {
    const [dia, mes, ano] = data.split('/')
    return new Date(`${ano}-${mes}-${dia}`)
}

async function cadastrarRelatorio(dados: CadastroRelatorioInput, usuario: any) {
    const paciente = await prisma.paciente.findUnique({
        where: { id: dados.pacienteId },
    });

    if (!paciente) {
        throw new AppError(404, "PACIENTE_NOT_FOUND", "Paciente não encontrado");
    }

    const resultado = await prisma.$transaction(async (tx) => {
        const formulario = await tx.formularioCIF.create({
            data: {
                tipoCIF: dados.formularioCIF.tipoCIF,
                dataPreenchimento: parseDateBR(dados.formularioCIF.dataPreenchimento),
                ultimaAlteracao: dados.formularioCIF.ultimaAlteracao
                    ? parseDateBR(dados.formularioCIF.ultimaAlteracao)
                    : undefined,
                condicaoSaude: dados.formularioCIF.condicaoSaude,
                condicaoSaudeDescricao: dados.formularioCIF.condicaoSaudeDescricao,
                factoresPessoais: dados.formularioCIF.factoresPessoais,
                planoTerapeutico: dados.formularioCIF.planoTerapeutico,
                itens: dados.formularioCIF.itens?.length
                    ? {
                        createMany: {
                            data: dados.formularioCIF.itens.map((item) => ({
                                codigoCIF: item.codigoCIF,
                                descricao: item.descricao,
                                categoria: item.categoria,
                                nivel: item.nivel,
                                qualificador1: item.qualificador1,
                                tipoQualificador1: item.tipoQualificador1,
                                qualificador2: item.qualificador2,
                                qualificador3: item.qualificador3,
                                qualificador4: item.qualificador4,
                                observacao: item.observacao,
                            })),
                        },
                    }
                    : undefined,
            },
            select: {
                id: true,
            },
        });

        console.log(
            'ITENS RECEBIDOS:',
            JSON.stringify(dados.formularioCIF.itens, null, 2)
        )

        const relatorio = await tx.relatorio.create({
            data: {
                pacienteId: dados.pacienteId,
                fisioterapeutaId: usuario.fisioterapeutaId,
                professorResponsavelId: dados.professorResponsavelId ?? null,
                status: "ENVIADO",
                formularioCIFId: formulario.id,
            },
            select: {
                id: true,
                codigo: true,
                status: true,
                dataCriacao: true,
                formularioCIF: {
                    select: {
                        id: true,
                        tipoCIF: true,
                        dataPreenchimento: true,
                        ultimaAlteracao: true,
                        condicaoSaude: true,
                        condicaoSaudeDescricao: true,
                        factoresPessoais: true,
                        planoTerapeutico: true,
                        itens: {
                            select: {
                                id: true,
                                codigoCIF: true,
                                descricao: true,
                                categoria: true,
                                nivel: true,
                                qualificador1: true,
                                tipoQualificador1: true,
                                qualificador2: true,
                                qualificador3: true,
                                qualificador4: true,
                                observacao: true,
                            },
                        },
                    },
                },
            },
        });

        return relatorio;
    });

    return resultado;
}

export { cadastrarRelatorio }