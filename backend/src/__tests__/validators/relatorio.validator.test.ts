import { describe, it, expect } from 'vitest'
import {
  cadastroRelatorioSchema,
  editarRelatorioSchema,
  listarRelatoriosSchema,
} from '../../validators/relatorio.validator'

const formularioCIFValido = {
  tipoCIF: 'CIF' as const,
  dataPreenchimento: '2026-01-10',
  condicaoSaudeDescricao: 'Descrição',
  itens: [],
}

// ─── cadastroRelatorioSchema ──────────────────────────────────────────────────

describe('cadastroRelatorioSchema', () => {
  it('deve aceitar dados mínimos válidos', () => {
    expect(() =>
      cadastroRelatorioSchema.parse({ pacienteId: 1, formularioCIF: formularioCIFValido })
    ).not.toThrow()
  })

  it('deve aceitar com professorResponsavelId opcional', () => {
    expect(() =>
      cadastroRelatorioSchema.parse({
        pacienteId: 1,
        professorResponsavelId: 5,
        formularioCIF: formularioCIFValido,
      })
    ).not.toThrow()
  })

  it('deve rejeitar pacienteId não positivo', () => {
    expect(() =>
      cadastroRelatorioSchema.parse({ pacienteId: 0, formularioCIF: formularioCIFValido })
    ).toThrow()
  })

  it('deve rejeitar sem formularioCIF', () => {
    expect(() => cadastroRelatorioSchema.parse({ pacienteId: 1 })).toThrow()
  })

  it('deve rejeitar professorResponsavelId negativo', () => {
    expect(() =>
      cadastroRelatorioSchema.parse({
        pacienteId: 1,
        professorResponsavelId: -1,
        formularioCIF: formularioCIFValido,
      })
    ).toThrow()
  })
})

// ─── editarRelatorioSchema ────────────────────────────────────────────────────

describe('editarRelatorioSchema', () => {
  it('deve aceitar atualização de status APROVADO sem feedback', () => {
    expect(() => editarRelatorioSchema.parse({ status: 'APROVADO' })).not.toThrow()
  })

  it('deve aceitar status NEGADO com feedback', () => {
    expect(() =>
      editarRelatorioSchema.parse({ status: 'NEGADO', feedback: 'Precisa corrigir' })
    ).not.toThrow()
  })

  it('deve rejeitar status NEGADO sem feedback', () => {
    expect(() => editarRelatorioSchema.parse({ status: 'NEGADO' })).toThrow()
  })

  it('deve rejeitar status NEGADO com feedback vazio', () => {
    expect(() => editarRelatorioSchema.parse({ status: 'NEGADO', feedback: '   ' })).toThrow()
  })

  it('deve aceitar apenas feedback sem status', () => {
    expect(() =>
      editarRelatorioSchema.parse({ feedback: 'Comentário adicional' })
    ).not.toThrow()
  })

  it('deve rejeitar status inválido', () => {
    expect(() => editarRelatorioSchema.parse({ status: 'PENDENTE' })).toThrow()
  })

  it('deve aceitar professorResponsavelId positivo', () => {
    expect(() =>
      editarRelatorioSchema.parse({ professorResponsavelId: 3 })
    ).not.toThrow()
  })

  it('deve aceitar objeto vazio (sem campos)', () => {
    expect(() => editarRelatorioSchema.parse({})).not.toThrow()
  })

  it('deve rejeitar feedback com mais de 1000 caracteres', () => {
    expect(() =>
      editarRelatorioSchema.parse({ feedback: 'a'.repeat(1001) })
    ).toThrow()
  })

  it('deve aceitar formularioCIF opcional', () => {
    expect(() =>
      editarRelatorioSchema.parse({ formularioCIF: formularioCIFValido })
    ).not.toThrow()
  })
})

// ─── listarRelatoriosSchema ───────────────────────────────────────────────────

describe('listarRelatoriosSchema', () => {
  it('deve usar valores padrão quando parâmetros não são fornecidos', () => {
    const resultado = listarRelatoriosSchema.parse({})
    expect(resultado.page).toBe(1)
    expect(resultado.limit).toBe(10)
    expect(resultado.ordenarPor).toBe('dataCriacao')
    expect(resultado.ordem).toBe('desc')
    expect(resultado.tipo).toBe('authored')
  })

  it('deve converter strings numéricas para números (coerce)', () => {
    const resultado = listarRelatoriosSchema.parse({ page: '2', limit: '20' })
    expect(resultado.page).toBe(2)
    expect(resultado.limit).toBe(20)
  })

  it('deve rejeitar limit acima de 100', () => {
    expect(() => listarRelatoriosSchema.parse({ limit: 101 })).toThrow()
  })

  it('deve aceitar todos os tipos de ordenação', () => {
    const campos = ['dataCriacao', 'dataFeedback', 'dataEdicao', 'nomeAluno', 'nomeProfessor', 'nomePaciente']
    for (const ordenarPor of campos) {
      expect(() => listarRelatoriosSchema.parse({ ordenarPor })).not.toThrow()
    }
  })

  it('deve rejeitar campo de ordenação inválido', () => {
    expect(() => listarRelatoriosSchema.parse({ ordenarPor: 'invalido' })).toThrow()
  })

  it('deve aceitar todos os status válidos', () => {
    for (const status of ['ENVIADO', 'APROVADO', 'NEGADO', 'CORRIGIDO']) {
      expect(() => listarRelatoriosSchema.parse({ status })).not.toThrow()
    }
  })

  it('deve rejeitar status inválido', () => {
    expect(() => listarRelatoriosSchema.parse({ status: 'PENDENTE' })).toThrow()
  })

  it('deve aceitar dataInicio no formato YYYY-MM-DD', () => {
    expect(() =>
      listarRelatoriosSchema.parse({ dataInicio: '2026-01-01' })
    ).not.toThrow()
  })

  it('deve rejeitar dataInicio em formato inválido', () => {
    expect(() =>
      listarRelatoriosSchema.parse({ dataInicio: '01/01/2026' })
    ).toThrow()
  })

  it('deve aceitar todos os tipos de tipo', () => {
    for (const tipo of ['authored', 'all', 'todos', 'supervised']) {
      expect(() => listarRelatoriosSchema.parse({ tipo })).not.toThrow()
    }
  })
})
