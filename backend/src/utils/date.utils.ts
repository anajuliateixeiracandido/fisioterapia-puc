export type DateInput = Date | string | null | undefined
export type TimeZone = string | undefined

function obterTimeZoneValido(timeZone?: TimeZone): string | undefined {
    if (!timeZone) return undefined

    try {
        new Intl.DateTimeFormat('pt-BR', { timeZone }).format()
        return timeZone
    } catch {
        return undefined
    }
}

export function parseDateBR(data: string): Date {
    if (data.includes('-') && !data.includes('/')) return new Date(data)
    const [dia, mes, ano] = data.split('/')
    return new Date(`${ano}-${mes}-${dia}`)
}

export function formatarData(valor?: DateInput, timeZone?: TimeZone): string {
    if (!valor) return ''
    if (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
        const [ano, mes, dia] = valor.split('-')
        return `${dia}/${mes}/${ano}`
    }

    const data = valor instanceof Date ? valor : parseDateBR(valor)
    if (Number.isNaN(data.getTime())) return ''
    const timeZoneValido = obterTimeZoneValido(timeZone)
    return new Intl.DateTimeFormat('pt-BR', timeZoneValido ? { timeZone: timeZoneValido } : undefined).format(data)
}

export function formatarDataExportacao(valor?: DateInput, timeZone?: TimeZone): string {
    return formatarData(valor, timeZone)
}

export function calcularIdade(dataNascimento?: DateInput, timeZone?: TimeZone): string {
    if (!dataNascimento) return ''
    const nascimento = dataNascimento instanceof Date ? dataNascimento : parseDateBR(dataNascimento)
    if (Number.isNaN(nascimento.getTime())) return ''

    const timeZoneValido = obterTimeZoneValido(timeZone)
    const formatador = new Intl.DateTimeFormat('en-US', {
        ...(timeZoneValido ? { timeZone: timeZoneValido } : {}),
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
    })
    const hoje = formatador.formatToParts(new Date())
    const hojeAno = Number(hoje.find((parte) => parte.type === 'year')?.value)
    const hojeMes = Number(hoje.find((parte) => parte.type === 'month')?.value)
    const hojeDia = Number(hoje.find((parte) => parte.type === 'day')?.value)
    const nascimentoAno = nascimento.getUTCFullYear()
    const nascimentoMes = nascimento.getUTCMonth() + 1
    const nascimentoDia = nascimento.getUTCDate()

    let idade = hojeAno - nascimentoAno
    const aniversarioAindaNaoPassou =
        hojeMes < nascimentoMes ||
        (hojeMes === nascimentoMes && hojeDia < nascimentoDia)

    if (aniversarioAindaNaoPassou) idade -= 1
    return String(Math.max(idade, 0))
}

export function dataNascimentoValida(data: string): boolean {
    const [dia, mes, ano] = data.split('/').map(Number)
    const nascimento = new Date(ano, mes - 1, dia)
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    return (
        ano >= 1900 &&
        nascimento.getFullYear() === ano &&
        nascimento.getMonth() === mes - 1 &&
        nascimento.getDate() === dia &&
        nascimento <= hoje
    )
}