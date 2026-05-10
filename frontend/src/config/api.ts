// @ts-ignore
export const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000/api/v1'

export const buildApiUrl = (path: string) => `${API_BASE_URL}${path}`
