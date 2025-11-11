// Helpers comunes para módulo Economía

export const nowBogotaISO = () => {
  const now = new Date()
  const offsetMs = 5 * 60 * 60 * 1000
  return new Date(now.getTime() - offsetMs).toISOString()
}

// ─── Pet Buffs ───────────────────────────────────────────────────────────────
// Retorna multiplicador extra según mascota favorita y felicidad
export const getPetBuff = (petObj, petStats) => {
  if (!petObj) return 0
  const rarity = String(petObj.rarity||'')
  let base = 0
  if (rarity.includes('⭐') && !rarity.includes('🌟') && !rarity.includes('💎') && !rarity.includes('🌈')) base = 0.05 // Común
  else if (rarity.includes('🌟')) base = 0.10 // Raro
  else if (rarity.includes('💎')) base = 0.15 // Épico
  else if (rarity.includes('🌈')) base = 0.20 // Legendario
  const happy = Math.max(0, Math.min(100, Number(petStats?.happiness||0)))
  const extra = (happy/100) * 0.05 // hasta +5% adicional por felicidad
  return base + extra
}

// Ajustar ganancias por mascota favorita (si existe)
export const petAdjust = async (ctx, { u, gain }) => {
  try{
    if (typeof gain !== 'number' || gain <= 0) return gain
    const { files, db } = ctx
    const petsDb = await db.loadJSON(files.PETS_FILE, {})
    const fav = u.petFav
    if (!fav) return gain
    const petObj = petsDb[fav]
    const stats = (u.petStats||{})[fav]
    const buff = getPetBuff(petObj, stats)
    if (buff <= 0) return gain
    return Math.max(1, Math.floor(gain * (1 + buff)))
  }catch{
    return gain
  }
}

export const todayBogota = () => {
  const now = new Date()
  const offsetMs = 5 * 60 * 60 * 1000
  const d = new Date(now.getTime() - offsetMs)
  return d.toISOString().slice(0,10) // YYYY-MM-DD
}

export const isYesterdayBogota = (yyyy_mm_dd) => {
  if(!yyyy_mm_dd) return false
  const now = new Date()
  const offsetMs = 5 * 60 * 60 * 1000
  const d = new Date(now.getTime() - offsetMs)
  const y = new Date(d.getTime() - 86400000)
  const ystr = y.toISOString().slice(0,10)
  return yyyy_mm_dd === ystr
}

export const hoursSince = (iso) => {
  if (!iso) return Infinity
  const ms = Date.now() - new Date(iso).getTime()
  return ms / 3600000
}

export const daysSince = (iso) => hoursSince(iso) / 24

export const cooldownOk = (lastISO, hoursReq) => hoursSince(lastISO) >= hoursReq

export const msUntil = (lastISO, hoursReq) => {
  if (!lastISO) return 0
  const end = new Date(lastISO).getTime() + hoursReq * 3600000
  return Math.max(0, end - Date.now())
}

export const fmtDuration = (ms) => {
  const totalSec = Math.ceil(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

export const parseAmount = (arg, available) => {
  if (!arg) return NaN
  const low = arg.toLowerCase()
  if (low === 'all' || low === 'todo' || low === 'max') return Number(available)
  const n = Number(arg.replace(/[^0-9.]/g, ''))
  if (!isFinite(n) || n <= 0) return NaN
  return Math.floor(n * 100) / 100
}

export const requireRegisteredEco = async (ctx) => {
  const { sock, msg, files, db } = ctx
  const gid = msg.key?.remoteJid
  const jid = msg.key?.participant || gid
  const users = await db.loadJSON(files.USERS_FILE, {})
  const u = users[jid]
  if (!u?.registered) {
    await sock.sendMessage(gid, { text: '🌸 ¡Ups~! Usa $register para comenzar 💕' }, { quoted: msg })
    return { ok: false }
  }
  return { ok: true, jid, users, u }
}

export const saveUsers = async (files, db, users) => db.saveJSON(files.USERS_FILE, users)

// ─── Elite Tier ──────────────────────────────────────────────────────────────
export const ELITE_THRESHOLD = 2000000

export const isElite = (u) => Number(u?.coins||0) >= ELITE_THRESHOLD || u?.tier === 'elite'

export const ensureTier = async (ctx, state) => {
  // Congratulate on first time crossing threshold
  try{
    const { sock, msg, files, db } = ctx
    const { jid, users, u } = state
    if (!u.tier && Number(u.coins||0) >= ELITE_THRESHOLD) {
      u.tier = 'elite'
      u.eliteSince = nowBogotaISO()
      users[jid] = u
      await db.saveJSON(files.USERS_FILE, users)
      const card = [
        '╭─💎 ᴅʀᴇᴀᴍʟᴀɴᴅ ᴇʟɪᴛᴇ 💎─╮',
        '🎉 ¡Felicidades! Has superado ₭ 2,000,000',
        '🛡️ Se activa el modo Elite: reglas más desafiantes y mejores premios',
        '  • Cooldowns mayores',
        '  • Recompensas mayores',
        '  • Multas más duras',
        '¡Demuestra tu dominio en Dreamland! ✨',
        '╰──────────────────────────🌸'
      ].join('\n')
      await sock.sendMessage(msg.key.remoteJid, { text: card }, { quoted: msg })
    }
  }catch{}
}

// Ajustes de dificultad para Elite
export const eliteAdjust = ({ u, gain, loss, cooldownHours }) => {
  const elite = isElite(u)
  return {
    elite,
    gain: elite && typeof gain === 'number' ? Math.max(1, Math.floor(gain * 1.25)) : gain,
    loss: elite && typeof loss === 'number' ? Math.ceil(loss * 1.25) : loss,
    cooldownHours: elite && typeof cooldownHours === 'number' ? cooldownHours * 1.5 : cooldownHours
  }
}
