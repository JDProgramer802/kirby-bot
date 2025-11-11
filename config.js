// === Configuración estática (placeholders, sin código) ===
// BOT_NAME: nombre visible del bot
// PREFIX: prefijo de comandos (por defecto "$")
// DATA_DIR: ruta para JSONs globales
// SESSION_DIR: ruta para credenciales Baileys
// API_KEYS: placeholders para servicios externos (si aplica)
// CURRENCY: KirbyCoin (₭), formato decimal visible (2 decimales)
// GACHA_RAREZAS: [N, R, SR, SSR, UR]
// MENSAJES: tono kawaii, logs coloridos

export const BOT_NAME = process.env.BOT_NAME || 'Kirby Dream'
export const PREFIX = process.env.PREFIX || '$'
export const DATA_DIR = process.env.DATA_DIR || './data'
export const SESSION_DIR = process.env.SESSION_DIR || './session'

export const API_KEYS = {
  NEKOS_BEST: process.env.NEKOS_BEST_API_KEY || '',
  WAIFU_IM: process.env.WAIFU_IM_API_KEY || ''
}

export const CURRENCY = {
  code: 'KIRBY',
  symbol: '₭',
  name: 'KirbyCoin',
  decimals: 2
}

export const GACHA_RAREZAS = ['N', 'R', 'SR', 'SSR', 'UR']

export const MESSAGES = {
  tone: 'kawaii'
}

export const EVENTS = {
  CHRISTMAS_ENABLED: String(process.env.CHRISTMAS_ENABLED || 'true').toLowerCase() === 'true'
}

export default {
  BOT_NAME,
  PREFIX,
  DATA_DIR,
  SESSION_DIR,
  API_KEYS,
  CURRENCY,
  GACHA_RAREZAS,
  MESSAGES,
  EVENTS
}
