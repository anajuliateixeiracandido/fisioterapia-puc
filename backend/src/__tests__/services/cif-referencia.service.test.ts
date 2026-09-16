import { describe, expect, it } from 'vitest'
import { normalizarDadosCIF } from '../../services/cif-referencia.service'

describe('normalizarDadosCIF', () => {
  it('deve converter itens CIF em payload válido para o banco', () => {
    const payload = [
      {
        tipoCIF: 'CIF',
        codigo: 'b110',
        codigoPai: null,
        descricao: 'Funções da consciência',
        categoria: 'FUNCAO',
        nivel: 1,
        capitulo: 1,
        ordemExibicao: 10,
      },
    ]

    expect(normalizarDadosCIF(payload)).toEqual([
      {
        tipoCIF: 'CIF',
        codigo: 'b110',
        codigoPai: null,
        descricao: 'Funções da consciência',
        categoria: 'FUNCAO',
        nivel: 1,
        capitulo: 1,
        ordemExibicao: 10,
      },
    ])
  })

  it('deve rejeitar payload com campos obrigatórios ausentes', () => {
    expect(() =>
      normalizarDadosCIF([
        {
          tipoCIF: 'CIF',
          codigo: '',
          codigoPai: null,
          descricao: 'Item inválido',
          categoria: 'FUNCAO',
          nivel: 1,
        },
      ])
    ).toThrow(/codigo/i)
  })
})
