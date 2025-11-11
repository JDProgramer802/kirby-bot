// Clientes de API (Nekos.best, Waifu.im) - implementación simple usando fetch

const NB_BASE = 'https://nekos.best/api/v2'
const WI_BASE = 'https://api.waifu.im'

export const nekosBest = async (endpoint = 'hug') => {
  const url = `${NB_BASE}/${endpoint}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Nekos.best error ${res.status}`)
  return res.json()
}

export const waifuIm = async (params = {}) => {
  const q = new URLSearchParams(params).toString()
  const url = `${WI_BASE}/search${q ? `?${q}` : ''}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Waifu.im error ${res.status}`)
  return res.json()
}

export default { nekosBest, waifuIm }
