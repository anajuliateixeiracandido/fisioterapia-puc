import { describe, it, expect } from 'vitest'
import {
  professorCadastroSchema,
  alunoCadastroSchema,
} from '../../validators/fisioterapeuta.validator'

const dadosProfessorValido = {
  role: 'PROFESSOR' as const,
  nomeCompleto: 'Professor Teste',
  email: 'professor@sga.pucminas.br',
  senha: 'Senha@123',
  codigoPessoa: '1448023',
}

const dadosAlunoValido = {
  role: 'ALUNO' as const,
  nomeCompleto: 'Aluno Teste',
  email: 'aluno@sga.pucminas.br',
  senha: 'Senha@123',
  matricula: '123456',
}

describe('professorCadastroSchema', () => {
  it('deve aceitar dados válidos', () => {
    expect(() => professorCadastroSchema.parse(dadosProfessorValido)).not.toThrow()
  })

  it('deve rejeitar email fora do domínio', () => {
    expect(() =>
      professorCadastroSchema.parse({ ...dadosProfessorValido, email: 'prof@gmail.com' })
    ).toThrow()
  })

  it('deve rejeitar senha fraca', () => {
    expect(() =>
      professorCadastroSchema.parse({ ...dadosProfessorValido, senha: 'fraca' })
    ).toThrow()
  })

  it('deve rejeitar codigoPessoa com menos de 5 dígitos', () => {
    expect(() =>
      professorCadastroSchema.parse({ ...dadosProfessorValido, codigoPessoa: '123' })
    ).toThrow()
  })

  it('deve rejeitar codigoPessoa com mais de 10 dígitos', () => {
    expect(() =>
      professorCadastroSchema.parse({ ...dadosProfessorValido, codigoPessoa: '12345678901' })
    ).toThrow()
  })

  it('deve rejeitar codigoPessoa com letras', () => {
    expect(() =>
      professorCadastroSchema.parse({ ...dadosProfessorValido, codigoPessoa: 'abc1234' })
    ).toThrow()
  })
})

describe('alunoCadastroSchema', () => {
  it('deve aceitar dados válidos sem professor', () => {
    expect(() => alunoCadastroSchema.parse(dadosAlunoValido)).not.toThrow()
  })

  it('deve aceitar dados válidos com codigoPessoaProfessor', () => {
    expect(() =>
      alunoCadastroSchema.parse({
        ...dadosAlunoValido,
        codigoPessoaProfessor: '1448023',
      })
    ).not.toThrow()
  })

  it('deve rejeitar email fora do domínio', () => {
    expect(() =>
      alunoCadastroSchema.parse({ ...dadosAlunoValido, email: 'aluno@gmail.com' })
    ).toThrow()
  })

  it('deve rejeitar senha fraca', () => {
    expect(() => alunoCadastroSchema.parse({ ...dadosAlunoValido, senha: 'fraca' })).toThrow()
  })

  it('deve rejeitar matrícula com menos de 5 dígitos', () => {
    expect(() => alunoCadastroSchema.parse({ ...dadosAlunoValido, matricula: '123' })).toThrow()
  })

  it('deve rejeitar matrícula com mais de 10 dígitos', () => {
    expect(() =>
      alunoCadastroSchema.parse({ ...dadosAlunoValido, matricula: '12345678901' })
    ).toThrow()
  })

  it('deve rejeitar matrícula com letras', () => {
    expect(() => alunoCadastroSchema.parse({ ...dadosAlunoValido, matricula: 'abc123' })).toThrow()
  })

  it('deve rejeitar codigoPessoaProfessor inválido', () => {
    expect(() =>
      alunoCadastroSchema.parse({ ...dadosAlunoValido, codigoPessoaProfessor: 'abc' })
    ).toThrow()
  })
})
