export const TOKEN_STORAGE_KEY = 'auth_token'

export const getToken = (storageKey: string = TOKEN_STORAGE_KEY): string | null => {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem(storageKey)
}

export const formatarData = (data: any) => {
  if (!data) {
    return 'Nao informado'
  }

  const parsedDate = new Date(data)

  if (Number.isNaN(parsedDate.getTime())) {
    return data
  }

  return parsedDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}