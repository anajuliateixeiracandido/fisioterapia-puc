import { describe, expect, it } from 'vitest'
import {
    calcularIdade,
    dataNascimentoValida,
    formatarData,
    parseDateBR,
} from '../../utils/date.utils'

describe('date.utils', () => {
    it('deve converter datas brasileiras e ISO para Date', () => {
        expect(parseDateBR('10/01/2026').toISOString()).toBe('2026-01-10T00:00:00.000Z')
        expect(parseDateBR('2026-01-10').toISOString()).toBe('2026-01-10T00:00:00.000Z')
    })

    it('deve formatar datas para exibicao em pt-BR', () => {
        expect(formatarData('2026-01-10')).toBe('10/01/2026')
        expect(formatarData('2026-01-10T00:00:00.000Z', 'America/Sao_Paulo')).toBe('09/01/2026')
        expect(formatarData('2026-01-10T00:00:00.000Z', 'Asia/Tokyo')).toBe('10/01/2026')
        expect(formatarData(null)).toBe('')
        expect(formatarData('data invalida')).toBe('')
    })

    it('deve validar datas de nascimento reais e nao futuras', () => {
        expect(dataNascimentoValida('29/02/2024')).toBe(true)
        expect(dataNascimentoValida('31/02/2024')).toBe(false)
        expect(dataNascimentoValida('01/01/1899')).toBe(false)
        expect(dataNascimentoValida('01/01/2999')).toBe(false)
    })

    it('deve calcular a idade a partir da data de nascimento', () => {
        const hoje = new Date()
        const aniversarioAindaNaoPassou = new Date(
            hoje.getFullYear() - 20,
            hoje.getMonth(),
            hoje.getDate() + 1
        )
        const aniversarioJaPassou = new Date(
            hoje.getFullYear() - 20,
            hoje.getMonth(),
            hoje.getDate() - 1
        )

        expect(calcularIdade(aniversarioAindaNaoPassou)).toBe('19')
        expect(calcularIdade(aniversarioJaPassou)).toBe('20')
        expect(calcularIdade('data invalida')).toBe('')
    })
})
