// Helpers comunes para módulo Gacha
import { nekosBest, waifuIm } from '../../utils/fetchApi.js'

export const slugify = (s='') => s.toString().trim().toLowerCase().replace(/\s+/g,'').replace(/[^a-z0-9-_]/g,'')

export const ensureStores = async (files, db) => {
  const { USERS_FILE, CHARACTERS_FILE, SALES_FILE, GACHALOGS_FILE } = files
  await db.loadJSON(USERS_FILE, {})
  await db.loadJSON(CHARACTERS_FILE, {})
  const sales = await db.loadJSON(SALES_FILE, { items: [] })
  if (!Array.isArray(sales.items)) { sales.items = []; await db.saveJSON(SALES_FILE, sales) }
  await db.loadJSON(GACHALOGS_FILE, { logs: [] })
}

export const getUser = async (files, db, jid) => {
  const users = await db.loadJSON(files.USERS_FILE, {})
  const u = users[jid]
  return { users, u }
}

export const requireRegistered = async (ctx) => {
  const { msg, sock, files, db } = ctx
  const gid = msg.key?.remoteJid
  const jid = msg.key?.participant || gid
  const { u } = await getUser(files, db, jid)
  if (!u?.registered) {
    await sock.sendMessage(gid, { text: '🌸 ¡Ups~! Debes registrarte primero con $register 💕' }, { quoted: ctx.msg })
    return { ok: false }
  }
  return { ok: true, jid }
}

export const getChar = async (files, db, nameOrSlug) => {
  const chars = await db.loadJSON(files.CHARACTERS_FILE, {})
  const key = slugify(nameOrSlug)
  if (chars[key]) return { chars, key, char: chars[key] }
  // buscar por name/serie aproximado
  let entry = Object.entries(chars).find(([,c]) => slugify(c.name)===key)
  if (entry) return { chars, key: entry[0], char: entry[1] }
  // coincidencias parciales por id, nombre o serie
  const minLen = 2
  if (key && key.length >= minLen) {
    entry = Object.entries(chars).find(([id,c]) => {
      const n = slugify(c?.name||'')
      const s = slugify(c?.serie||'')
      return id.includes(key) || n.includes(key) || s.includes(key)
    })
    if (entry) return { chars, key: entry[0], char: entry[1] }
  }
  return { chars, key, char: null }
}

export const saveChars = async (files, db, chars) => db.saveJSON(files.CHARACTERS_FILE, chars)
export const saveUsers = async (files, db, users) => db.saveJSON(files.USERS_FILE, users)
export const loadSales = async (files, db) => db.loadJSON(files.SALES_FILE, { items: [] })
export const saveSales = async (files, db, sales) => db.saveJSON(files.SALES_FILE, sales)

export const addClaimToUser = (users, jid, charId, value=0) => {
  users[jid] ||= { registered:false }
  users[jid].claims = Array.isArray(users[jid].claims) ? users[jid].claims : []
  if (!users[jid].claims.includes(charId)) users[jid].claims.push(charId)
  // haremValue cache simple
  const hv = users[jid].claims.reduce((acc,id)=>acc + (users.__charValues?.[id]||0),0)
  users[jid].haremValue = hv
}

export const recalcHaremValue = (users, jid, chars) => {
  const claims = users[jid]?.claims || []
  const hv = claims.reduce((a,id)=> a + (chars[id]?.value||0), 0)
  users[jid].haremValue = hv
}

export const nowBogotaISO = () => {
  const now = new Date()
  const offsetMs = 5 * 60 * 60 * 1000
  return new Date(now.getTime() - offsetMs).toISOString()
}

export const cooldownPassed = (lastISO, seconds) => {
  if (!lastISO) return true
  const last = new Date(lastISO).getTime()
  const offsetMs = 5 * 60 * 60 * 1000
  const nowBogota = Date.now() - offsetMs
  return (nowBogota - last) / 1000 >= seconds
}

export const msUntil = (lastISO, seconds) => {
  if (!lastISO) return 0
  const end = new Date(lastISO).getTime() + seconds * 1000
  const offsetMs = 5 * 60 * 60 * 1000
  const nowBogota = Date.now() - offsetMs
  return Math.max(0, end - nowBogota)
}

export const fmtDuration = (ms) => {
  const totalSec = Math.ceil(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

export const findImageForChar = async (char) => {
  if (char?.images?.length) return char.images[Math.floor(Math.random()*char.images.length)]
  // intento Waifu.im por tags/nombre
  try {
    const tag = slugify(char?.name || '')
    const res = await waifuIm({ included_tags: tag })
    const url = res?.images?.[0]?.url
    if (url) return url
  } catch {}
  // nekos.best fallback temático
  try {
    const r = await nekosBest('smile')
    const url = r?.results?.[0]?.url
    if (url) return url
  } catch {}
  return null
}

export const findVideoForChar = async (char) => {
  if (char?.videos?.length) return char.videos[Math.floor(Math.random()*char.videos.length)]
  // fallback: intentar un gif de nekos.best
  try {
    const r = await nekosBest('smile')
    const url = r?.results?.[0]?.url
    if (url) return url
  } catch {}
  return null
}

// Progreso en un solo mensaje editable
export const startProgress = async (sock, chat, quoted, initial = '⏳ Cargando...') => {
  const sent = await sock.sendMessage(chat, { text: initial }, { quoted })
  const key = sent?.key
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const update = async (text) => {
    try { await sock.sendMessage(chat, { edit: key, text }) } catch {}
  }
  return { key, update, sleep }
}
