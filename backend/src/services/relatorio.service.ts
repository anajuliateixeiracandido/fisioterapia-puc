import prisma from "../lib/prisma";
import { AppError } from "../errors/AppError";
import { 
    CadastroRelatorioInput, 
    EditarRelatorioInput, 
    AvaliarRelatorioInput,
    ListarRelatoriosInput 
} from "../validators/relatorio.validator";
import { Prisma } from "@prisma/client";

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

    const statusInicial = usuario.role === 'ALUNO' ? 'ENVIADO' : 'APROVADO';

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
                status: statusInicial,
                formularioCIFId: formulario.id,
            },
            select: {
                id: true,
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

async function editarRelatorio(
    id: number, 
    dados: EditarRelatorioInput, 
    usuario: any
) {
    const relatorio = await prisma.relatorio.findUnique({
        where: { id },
        include: { 
            fisioterapeuta: true,
            professorResponsavel: true,
        },
    });

    if (!relatorio) {
        throw new AppError(404, "RELATORIO_NOT_FOUND", "Relatório não encontrado");
    }

    // Verificar se o usuário pode editar, só pode editar seus próprios relatórios
    if (relatorio.fisioterapeutaId !== usuario.fisioterapeutaId) {
        throw new AppError(403, "FORBIDDEN", "Você não tem permissão para editar este relatório");
    }
    
    // Não pode editar relatórios aprovados
    if (relatorio.status === 'APROVADO') {
        throw new AppError(400, "RELATORIO_JA_APROVADO", "Não é possível editar um relatório que já foi aprovado");
    }

    // Determinar novo status baseado no status atual
    // Se estava NEGADO e aluno está corrigindo → muda para CORRIGIDO
    // Se estava ENVIADO ou CORRIGIDO → mantém o mesmo status
    let novoStatus = relatorio.status;
    if (relatorio.status === 'NEGADO') {
        novoStatus = 'CORRIGIDO';
    }

    // Atualizar relatório e adicionar data de edição
    const resultado = await prisma.relatorio.update({
        where: { id },
        data: {
            professorResponsavelId: dados.professorResponsavelId,
            status: novoStatus,
            datasEdicao: {
                push: new Date(),
            },
        },
        include: {
            paciente: true,
            fisioterapeuta: true,
            professorResponsavel: true,
            formularioCIF: {
                include: {
                    itens: true,
                },
            },
        },
    });

    return resultado;
}

async function deletarRelatorio(id: number, usuario: any) {
    const relatorio = await prisma.relatorio.findUnique({
        where: { id },
    });

    if (!relatorio) {
        throw new AppError(404, "RELATORIO_NOT_FOUND", "Relatório não encontrado");
    }

    if (usuario.role === 'ALUNO') {
        if (relatorio.fisioterapeutaId !== usuario.fisioterapeutaId) {
            throw new AppError(403, "FORBIDDEN", "Você não tem permissão para deletar este relatório");
        }
    }

    await prisma.relatorio.delete({
        where: { id },
    });
}

async function avaliarRelatorio(
    id: number, 
    dados: AvaliarRelatorioInput, 
    usuario: any
) {
    const relatorio = await prisma.relatorio.findUnique({
        where: { id },
        include: {
            professorResponsavel: {
                include: {
                    fisioterapeuta: true,
                },
            },
        },
    });

    if (!relatorio) {
        throw new AppError(404, "RELATORIO_NOT_FOUND", "Relatório não encontrado");
    }

    if (relatorio.status == 'APROVADO') {
        throw new AppError(400, "RELATORIO_JA_APROVADO", "Este relatório já foi avaliado");
    }

    if (usuario.role === 'PROFESSOR') {
        const professor = await prisma.professor.findFirst({
            where: { fisioterapeutaId: usuario.fisioterapeutaId },
        });

        if (!professor) {
            throw new AppError(403, "FORBIDDEN", "Professor não encontrado");
        }

        if (!professor.coordenador && relatorio.professorResponsavelId !== professor.id) {
            throw new AppError(403, "FORBIDDEN", "Você não é o professor responsável por este relatório");
        }
    }

    const dataAtual = new Date();
    
    const resultado = await prisma.relatorio.update({
        where: { id },
        data: {
            status: dados.status,
            feedbacks: {
                push: dados.feedback,
            },
            datasFeedback: {
                push: dataAtual,
            },
            dataAprovacao: dados.status === 'APROVADO' ? dataAtual : null,
        },
        include: {
            paciente: true,
            fisioterapeuta: true,
            professorResponsavel: true,
            formularioCIF: {
                include: {
                    itens: true,
                },
            },
        },
    });

    return resultado;
}

async function listarRelatorios(filtros: ListarRelatoriosInput, usuario: any) {
    const { 
        page, 
        limit, 
        codigoPaciente, 
        nomePaciente,
        nomeResponsavel,
        codigoPessoaResponsavel,
        status, 
        dataInicio, 
        dataFim, 
        ordenarPor,
        ordem,
        tipo, 
        matriculaAluno 
    } = filtros;

    const where: Prisma.RelatorioWhereInput = {};
    const andConditions: Prisma.RelatorioWhereInput[] = [];

    if (tipo === 'meus') {
        where.fisioterapeutaId = usuario.fisioterapeutaId;
    } else if (tipo === 'supervisionados') {
        if (usuario.role === 'PROFESSOR') {
            const professor = await prisma.professor.findFirst({
                where: { fisioterapeutaId: usuario.fisioterapeutaId },
            });
            if (professor) {
                where.professorResponsavelId = professor.id;
            }
        }
    } else if (tipo === 'todos') {
        if (usuario.role === 'ALUNO') {
            where.fisioterapeutaId = usuario.fisioterapeutaId;
        } else if (usuario.role === 'PROFESSOR') {
            const professor = await prisma.professor.findFirst({
                where: { fisioterapeutaId: usuario.fisioterapeutaId },
            });
            if (professor) {
                if (!professor.coordenador) {
                    where.OR = [
                        { fisioterapeutaId: usuario.fisioterapeutaId },
                        { professorResponsavelId: professor.id },
                    ];
                }
            }
        }
    }

    if (status) {
        andConditions.push({ status });
    }

    if (dataInicio || dataFim) {
        const dataCriacaoFilter: any = {};
        if (dataInicio) {
            dataCriacaoFilter.gte = new Date(dataInicio);
        }
        if (dataFim) {
            const fim = new Date(dataFim);
            fim.setHours(23, 59, 59, 999);
            dataCriacaoFilter.lte = fim;
        }
        andConditions.push({ dataCriacao: dataCriacaoFilter });
    }

    const pacienteFilters: any = {};
    if (codigoPaciente) {
        pacienteFilters.codigo = codigoPaciente;
    }
    if (nomePaciente) {
        pacienteFilters.nomeCompleto = {
            contains: nomePaciente,
            mode: 'insensitive' as Prisma.QueryMode,
        };
    }
    if (Object.keys(pacienteFilters).length > 0) {
        andConditions.push({ paciente: pacienteFilters });
    }

    // Filtros de RESPONSÁVEL (fisioterapeuta autor)
    // Nota: matrícula está no modelo Aluno, não em Fisioterapeuta
    // codigoPessoa está no modelo Professor, não em Fisioterapeuta
    if (matriculaAluno) {
        andConditions.push({
            fisioterapeuta: {
                aluno: {
                    matricula: matriculaAluno
                }
            }
        });
    }
    
    // Nome ou código de pessoa do responsável
    if (nomeResponsavel || codigoPessoaResponsavel) {
        const responsavelConditions: Prisma.RelatorioWhereInput[] = [];
        
        // Busca por nome no fisioterapeuta autor
        if (nomeResponsavel) {
            responsavelConditions.push({
                fisioterapeuta: {
                    nomeCompleto: {
                        contains: nomeResponsavel,
                        mode: 'insensitive' as Prisma.QueryMode,
                    }
                },
            });
        }

        // Busca por codigoPessoa no professor responsável
        if (codigoPessoaResponsavel) {
            responsavelConditions.push({
                professorResponsavel: {
                    codigoPessoa: codigoPessoaResponsavel,
                },
            });
        }

        // Busca por nome no professor responsável
        if (nomeResponsavel) {
            responsavelConditions.push({
                professorResponsavel: {
                    fisioterapeuta: {
                        nomeCompleto: {
                            contains: nomeResponsavel,
                            mode: 'insensitive' as Prisma.QueryMode,
                        }
                    },
                },
            });
        }

        if (responsavelConditions.length > 0) {
            andConditions.push({ OR: responsavelConditions });
        }
    }

    // Combinar todas as condições
    if (andConditions.length > 0) {
        where.AND = andConditions;
    }

    // Ordenação avançada
    let orderBy: Prisma.RelatorioOrderByWithRelationInput = {};
    
    switch (ordenarPor) {
        case 'dataCriacao':
            orderBy = { dataCriacao: ordem };
            break;
        case 'dataFeedback':
            // Última data de feedback (mais recente do array)
            orderBy = { datasFeedback: ordem === 'desc' ? 'desc' : 'asc' };
            break;
        case 'dataEdicao':
            // Última data de edição (mais recente do array)
            orderBy = { datasEdicao: ordem === 'desc' ? 'desc' : 'asc' };
            break;
        case 'nomeAluno':
            orderBy = { fisioterapeuta: { nomeCompleto: ordem } };
            break;
        case 'nomeProfessor':
            orderBy = { professorResponsavel: { fisioterapeuta: { nomeCompleto: ordem } } };
            break;
        case 'nomePaciente':
            orderBy = { paciente: { nomeCompleto: ordem } };
            break;
        default:
            orderBy = { dataCriacao: 'desc' };
    }

    // Paginação
    const skip = (page - 1) * limit;

    // Buscar relatórios
    const [relatorios, total] = await Promise.all([
        prisma.relatorio.findMany({
            where,
            orderBy,
            skip,
            take: limit,
            include: {
                paciente: {
                    select: {
                        id: true,
                        codigo: true,
                        nomeCompleto: true,
                    },
                },
                fisioterapeuta: {
                    select: {
                        id: true,
                        nomeCompleto: true,
                        role: true,
                        aluno: {
                            select: {
                                matricula: true,
                            }
                        },
                        professor: {
                            select: {
                                codigoPessoa: true,
                            }
                        }
                    },
                },
                professorResponsavel: {
                    select: {
                        id: true,
                        codigoPessoa: true,
                        fisioterapeuta: {
                            select: {
                                id: true,
                                nomeCompleto: true,
                            },
                        },
                    },
                },
            },
        }),
        prisma.relatorio.count({ where }),
    ]);

    return {
        data: relatorios,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

async function obterRelatorioPorId(id: number, usuario: any) {
    const relatorio = await prisma.relatorio.findUnique({
        where: { id },
        include: {
            paciente: true,
            fisioterapeuta: {
                select: {
                    id: true,
                    uid: true,
                    nomeCompleto: true,
                    email: true,
                    role: true,
                    aluno: {
                        select: {
                            matricula: true,
                        }
                    },
                    professor: {
                        select: {
                            codigoPessoa: true,
                        }
                    }
                },
            },
            professorResponsavel: {
                select: {
                    id: true,
                    codigoPessoa: true,
                    fisioterapeuta: {
                        select: {
                            id: true,
                            nomeCompleto: true,
                        },
                    },
                },
            },
            formularioCIF: {
                include: {
                    itens: {
                        orderBy: {
                            id: 'asc',
                        },
                    },
                },
            },
        },
    });

    if (!relatorio) {
        throw new AppError(404, "RELATORIO_NOT_FOUND", "Relatório não encontrado");
    }

    if (usuario.role === 'ALUNO') {
        if (relatorio.fisioterapeutaId !== usuario.fisioterapeutaId) {
            throw new AppError(403, "FORBIDDEN", "Você não tem permissão para visualizar este relatório");
        }
    } else if (usuario.role === 'PROFESSOR') {
        const professor = await prisma.professor.findFirst({
            where: { fisioterapeutaId: usuario.fisioterapeutaId },
        });

        if (!professor) {
            throw new AppError(403, "FORBIDDEN", "Professor não encontrado");
        }

        const ehAutor = relatorio.fisioterapeutaId === usuario.fisioterapeutaId;
        const ehSupervisor = relatorio.professorResponsavelId === professor.id;
        const ehCoordenador = professor.coordenador === true;

        if (!ehAutor && !ehSupervisor && !ehCoordenador) {
            throw new AppError(403, "FORBIDDEN", "Você não tem permissão para visualizar este relatório");
        }
    }

    return relatorio;
}

export { 
    cadastrarRelatorio,
    editarRelatorio,
    deletarRelatorio,
    avaliarRelatorio,
    listarRelatorios,
    obterRelatorioPorId,
}
