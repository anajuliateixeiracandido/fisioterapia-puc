import { describe, it, expect } from 'vitest'
import { transferenciaCoordenadorSchema } from '../../validators/coordenador.validator'

describe('transferenciaCoordenadorSchema', () => {
  it('aceita payload válido', () => {
    expect(() => transferenciaCoordenadorSchema.parse({ novoCoordenadorId: 5 })).not.toThrow()
  })

  it('rejeita quando faltando novoCoordenadorId', () => {
    expect(() => transferenciaCoordenadorSchema.parse({})).toThrow()
  })

  it('rejeita quando novoCoordenadorId não é número', () => {
    expect(() => transferenciaCoordenadorSchema.parse({ novoCoordenadorId: '5' })).toThrow()
  })

  it('rejeita quando novoCoordenadorId é zero ou negativo', () => {
    expect(() => transferenciaCoordenadorSchema.parse({ novoCoordenadorId: 0 })).toThrow()
    expect(() => transferenciaCoordenadorSchema.parse({ novoCoordenadorId: -1 })).toThrow()
  })
})
