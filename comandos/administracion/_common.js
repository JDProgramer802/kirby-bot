// Helpers comunes para comandos de administración (MD)

const DEFAULT_OWNER = '52373569429752@lid'

export const ensureGroupConfig = async (GROUPS_FILE, db, gid) => {
  const groups = await db.loadJSON(GROUPS_FILE, {})
  groups[gid] ||= {
    active: true,
    onlyAdmin: false,
    antilink: false,
    alerts: true,
    welcome: true,
    goodbye: true,
    welcomeMsg: '🌸 ¡Bienvenido/a a Dreamland!',
    goodbyeMsg: '💫 Adiós, ¡te extrañaremos! 🌸',
    warnLimit: 3,
    warns: {},
    modules: { economy: true, gacha: true },
    primaryBot: ''
  }
  return groups
}

export const saveGroups = async (GROUPS_FILE, db, groups) => {
  await db.saveJSON(GROUPS_FILE, groups)
}

export const requireGroup = async (sock, msg) => {
  const gid = msg.key?.remoteJid || ''
  const isGroup = gid.endsWith('@g.us')
  return { ok: isGroup, gid }
}

export const getAdmins = async (sock, gid) => {
  const meta = await sock.groupMetadata(gid)
  const bare = (j)=> String(j||'').split(':')[0].split('@')[0]
  const admins = (meta.participants || []).filter(p => p.admin).map(p => p.id)
  const adminsBare = admins.map(bare)
  return { admins, adminsBare, meta }
}

export const isAdmin = async (sock, gid, jid) => {
  try {
    const bare = (j)=> String(j||'').split(':')[0].split('@')[0]
    const { adminsBare } = await getAdmins(sock, gid)
    const owner = (process.env.BOT_OWNER && process.env.BOT_OWNER.trim()) || DEFAULT_OWNER
    const me = sock.user?.id
    const b = bare(jid)
    // Tratar como admin si es admin real, el owner configurado o el propio bot
    return adminsBare.includes(b) || bare(owner) === b || bare(me) === b
  } catch { return false }
}

export const isBotAdmin = async (sock, gid) => {
  try {
    const bare = (j)=> String(j||'').split(':')[0].split('@')[0]
    const { adminsBare } = await getAdmins(sock, gid)
    const me = sock.user?.id
    return adminsBare.includes(bare(me))
  } catch { return false }
}

export const isOwnerOrAdmin = async (sock, gid, jid) => {
  const owner = (process.env.BOT_OWNER && process.env.BOT_OWNER.trim()) || DEFAULT_OWNER
  const bare = (j)=> String(j||'').split(':')[0].split('@')[0]
  if (bare(jid) === bare(owner)) return true
  return isAdmin(sock, gid, jid)
}

export const mentionTarget = (msg, args) => {
  const mention = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
  return mention || args[0] || ''
}

export const nowBogotaISODate = () => {
  const now = new Date()
  const offsetMs = 5 * 60 * 60 * 1000
  const d = new Date(now.getTime() - offsetMs)
  return d.toISOString().slice(0,10)
}

export const sumDays = (byDay = {}, days = 1) => {
  const resDate = new Date()
  const offsetMs = 5 * 60 * 60 * 1000
  const today = new Date(resDate.getTime() - offsetMs)
  let total = 0
  for (let i=0;i<days;i++) {
    const d = new Date(today.getTime() - i*86400000)
    const key = d.toISOString().slice(0,10)
    total += byDay[key] || 0
  }
  return total
}

// ─── Estilo Kirby para mensajes de administración ────────────────────────────
export const kirbyHeader = (title = 'KIRBY ADMIN') => `╭─❖  *${title}*  ❖─╮`
export const kirbyDivider = (txt = '') => (txt ? `──────────────────────────────\n> ${txt}` : '──────────────────────────────')
export const kirbyFooter = (note = '🌸 _Dreamland protege a su gente._') => `╰──────────────────────────────╯\n${note}`
export const kirbyCard = ({ title, lines = [], quote = '', note = '' }) => {
  const out = []
  out.push(kirbyHeader(title))
  for (const l of lines) out.push(l)
  out.push(kirbyDivider(quote))
  out.push(kirbyFooter(note))
  return out.join('\n')
}

// Temas únicos por acción
const ACTION_THEMES = {
  promote: { title: 'KIRBY ✦ PROMOTE', note: '💖 _Sube como estrella fugaz._' },
  demote:  { title: 'KIRBY ✦ DEMOTE',  note: '🌙 _A veces, descansar también es brillar._' },
  kick:    { title: 'KIRBY ✦ KICK',    note: '🧹 _Dreamland se mantiene limpito._' },
  warn:    { title: 'KIRBY ✦ WARN',    note: '⚠️ _Una estrellita guía mejores caminos._' },
  welcome: { title: 'KIRBY ✦ WELCOME', note: '🎀 _Abrazo de algodón para quien llega._' },
}

export const kirbyAdminCard = (action = 'admin', { lines = [], quote = '', note = '' } = {}) => {
  const theme = ACTION_THEMES[action] || { title: `KIRBY ✦ ${String(action).toUpperCase()}`, note: '🌸 _Dreamland a tu servicio._' }
  return kirbyCard({ title: theme.title, lines, quote, note: note || theme.note })
}
