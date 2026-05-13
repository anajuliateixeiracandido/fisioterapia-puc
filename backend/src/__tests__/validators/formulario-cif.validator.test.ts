import { describe, it, expect } from 'vitest'
import {
  categoriaCIFSchema,
  tipoCIFSchema,
  tipoFactorAmbientalSchema,
  itemCIFSchema,
  formularioCIFSchema,
  formularioCIFCJSchema,
  cadastroFormularioCIFSchema,
} from '../../validators/formulario-cif.validator'

// ─── categoriaCIFSchema ───────────────────────────────────────────────────────

describe('categoriaCIFSchema', () => {
  it('deve aceitar todas as categorias válidas', () => {
    const categorias = ['ESTRUTURA', 'FUNCAO', 'ACTIVIDADE_PARTICIPACAO', 'FACTOR_AMBIENTAL']
    for (const cat of categorias) {
      expect(() => categoriaCIFSchema.parse(cat)).not.toThrow()
    }
  })

  it('deve rejeitar categoria inválida', () => {
    expect(() => categoriaCIFSchema.parse('ATIVIDADE')).toThrow()
  })
})

// ─── tipoCIFSchema ────────────────────────────────────────────────────────────

describe('tipoCIFSchema', () => {
  it('deve aceitar CIF', () => {
    expect(() => tipoCIFSchema.parse('CIF')).not.toThrow()
  })

  it('deve aceitar CIF_CJ', () => {
    expect(() => tipoCIFSchema.parse('CIF_CJ')).not.toThrow()
  })

  it('deve rejeitar tipo inválido', () => {
    expect(() => tipoCIFSchema.parse('CIF_ADULTO')).toThrow()
  })
})

// ─── tipoFactorAmbientalSchema ────────────────────────────────────────────────

describe('tipoFactorAmbientalSchema', () => {
  it('deve aceitar FACILITADOR', () => {
    expect(() => tipoFactorAmbientalSchema.parse('FACILITADOR')).not.toThrow()
  })

  it('deve aceitar BARREIRA', () => {
    expect(() => tipoFactorAmbientalSchema.parse('BARREIRA')).not.toThrow()
  })

  it('deve rejeitar tipo inválido', () => {
    expect(() => tipoFactorAmbientalSchema.parse('NEUTRO')).toThrow()
  })
})

// ─── itemCIFSchema ────────────────────────────────────────────────────────────

describe('itemCIFSchema', () => {
  const itemValido = {
    codigoCIF: 'b110',
    categoria: 'FUNCAO',
  }

  it('deve aceitar item mínimo válido', () => {
    expect(() => itemCIFSchema.parse(itemValido)).not.toThrow()
  })

  it('deve aceitar item completo', () => {
    expect(() =>
      itemCIFSchema.parse({
        ...itemValido,
        descricao: 'Funções da consciência',
        nivel: 2,
        qualificador1: 1,
        tipoQualificador1: 'FACILITADOR',
        qualificador2: 0,
        qualificador3: 0,
        qualificador4: 0,
        observacao: 'Observação do item',
      })
    ).not.toThrow()
  })

  it('deve rejeitar codigoCIF vazio', () => {
    expect(() => itemCIFSchema.parse({ ...itemValido, codigoCIF: '' })).toThrow()
  })

  it('deve rejeitar categoria inválida', () => {
    expect(() => itemCIFSchema.parse({ ...itemValido, categoria: 'INVALIDA' })).toThrow()
  })

  it('deve rejeitar qualificador negativo', () => {
    expect(() =>
      itemCIFSchema.parse({ ...itemValido, qualificador1: -1 })
    ).toThrow()
  })

  it('deve rejeitar nivel negativo', () => {
    expect(() => itemCIFSchema.parse({ ...itemValido, nivel: -1 })).toThrow()
  })
})

// ─── formularioCIFSchema ──────────────────────────────────────────────────────

describe('formularioCIFSchema', () => {
  const formularioValido = {
    tipoCIF: 'CIF' as const,
    dataPreenchimento: '2026-01-10',
    condicaoSaudeDescricao: 'Descrição da condição de saúde',
    itens: [],
  }

  it('deve aceitar formulário mínimo válido', () => {
    expect(() => formularioCIFSchema.parse(formularioValido)).not.toThrow()
  })

  it('deve aceitar formulário completo', () => {
    expect(() =>
      formularioCIFSchema.parse({
        ...formularioValido,
        ultimaAlteracao: '2026-02-01',
        condicaoSaude: 'CID X00',
        factoresPessoais: 'Factores pessoais',
        planoTerapeutico: 'Plano terapêutico',
        observacoes: 'Observações gerais',
        itens: [{ codigoCIF: 'b110', categoria: 'FUNCAO' }],
      })
    ).not.toThrow()
  })

  it('deve rejeitar com tipoCIF errado', () => {
    expect(() =>
      formularioCIFSchema.parse({ ...formularioValido, tipoCIF: 'CIF_CJ' })
    ).toThrow()
  })

  it('deve rejeitar data de preenchimento inválida', () => {
    expect(() =>
      formularioCIFSchema.parse({ ...formularioValido, dataPreenchimento: 'nao-e-data' })
    ).toThrow()
  })

  it('deve usar array vazio como padrão para itens', () => {
    const { itens } = formularioCIFSchema.parse({
      tipoCIF: 'CIF',
      dataPreenchimento: '2026-01-10',
      condicaoSaudeDescricao: 'Descrição',
    })
    expect(itens).toEqual([])
  })
})

// ─── formularioCIFCJSchema ────────────────────────────────────────────────────

describe('formularioCIFCJSchema', () => {
  it('deve aceitar tipoCIF CIF_CJ', () => {
    expect(() =>
      formularioCIFCJSchema.parse({
        tipoCIF: 'CIF_CJ',
        dataPreenchimento: '2026-01-10',
        condicaoSaudeDescricao: 'Descrição',
      })
    ).not.toThrow()
  })

  it('deve rejeitar tipoCIF CIF', () => {
    expect(() =>
      formularioCIFCJSchema.parse({
        tipoCIF: 'CIF',
        dataPreenchimento: '2026-01-10',
        condicaoSaudeDescricao: 'Descrição',
      })
    ).toThrow()
  })
})

// ─── cadastroFormularioCIFSchema (discriminatedUnion) ─────────────────────────

describe('cadastroFormularioCIFSchema', () => {
  it('deve aceitar CIF', () => {
    expect(() =>
      cadastroFormularioCIFSchema.parse({
        tipoCIF: 'CIF',
        dataPreenchimento: '2026-01-10',
        condicaoSaudeDescricao: 'Descrição',
      })
    ).not.toThrow()
  })

  it('deve aceitar CIF_CJ', () => {
    expect(() =>
      cadastroFormularioCIFSchema.parse({
        tipoCIF: 'CIF_CJ',
        dataPreenchimento: '2026-01-10',
        condicaoSaudeDescricao: 'Descrição',
      })
    ).not.toThrow()
  })

  it('deve rejeitar tipo desconhecido', () => {
    expect(() =>
      cadastroFormularioCIFSchema.parse({
        tipoCIF: 'OUTRO',
        dataPreenchimento: '2026-01-10',
        condicaoSaudeDescricao: 'Descrição',
      })
    ).toThrow()
  })

  it('deve rejeitar sem condicaoSaudeDescricao', () => {
    expect(() =>
      cadastroFormularioCIFSchema.parse({
        tipoCIF: 'CIF',
        dataPreenchimento: '2026-01-10',
      })
    ).toThrow()
  })
})
