import 'dotenv/config'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { readdirSync, readFileSync } from 'fs'
import { promises as fs } from 'fs'
import makeWASocket, { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys'
import pino from 'pino'
import qrcode from 'qrcode-terminal'

import { banner, info, success, warn, error, event } from './utils/logger.js'
import { checkDeps } from './utils/mediaTools.js'
import { loadJSON, saveJSON } from './utils/db.js'
import { parseCommand, extractText, isGroup } from './utils/helpers.js'
import { formatKirby } from './utils/formatCurrency.js'
import { BOT_NAME, PREFIX, DATA_DIR, SESSION_DIR } from './config.js'

// Paths y config básica
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// Config centralizada desde config.js

// Utilidades para JIDs (LID / s.whatsapp.net)
const bareJid = (j) => String(j||'').split(':')[0].split('@')[0]
const isLidJid = (j) => String(j||'').toLowerCase().includes('@lid')

// Evitar que errores de red/timeout tiren el proceso entero
process.on('unhandledRejection', (e) => {
  try { warn('Unhandled promise rejection:', e?.message || e) } catch {}
})
process.on('uncaughtException', (e) => {
  try { warn('Uncaught exception:', e?.message || e) } catch {}
})

// Archivos de datos (ruta fija desde config)
const DATA_PATH = DATA_DIR
const USERS_FILE = path.resolve(__dirname, DATA_PATH, 'users.json')
const ECON_FILE = path.resolve(__dirname, DATA_PATH, 'economy.json')
const GACHA_FILE = path.resolve(__dirname, DATA_PATH, 'gacha.json')
const GROUPS_FILE = path.resolve(__dirname, DATA_PATH, 'groups.json')
const GROUPSTATS_FILE = path.resolve(__dirname, DATA_PATH, 'groupStats.json')
const GROUPMETA_FILE = path.resolve(__dirname, DATA_PATH, 'groupMeta.json')
// Gacha files
const CHARACTERS_FILE = path.resolve(__dirname, DATA_PATH, 'characters.json')
const SALES_FILE = path.resolve(__dirname, DATA_PATH, 'sales.json')
const GACHALOGS_FILE = path.resolve(__dirname, DATA_PATH, 'gachaLogs.json')
// Audio files
const AUDIOS_DB = path.resolve(__dirname, DATA_PATH, 'audios.json')
const CONFIG_FILE = path.resolve(__dirname, DATA_PATH, 'config.json')
// Stickers files
const STICKERS_DB = path.resolve(__dirname, DATA_DIR, 'stickers.json')
const STICKERS_DIR = path.resolve(__dirname, 'stickers')
const REACTIONS_FILE = path.resolve(__dirname, DATA_PATH, 'reactions.json')
const EVENTS_FILE = path.resolve(__dirname, DATA_PATH, 'events.json')
const PETS_FILE = path.resolve(__dirname, DATA_PATH, 'pets.json')
const ADMINQ_FILE = path.resolve(__dirname, DATA_PATH, 'adminQueue.json')

// Prefijo dinámico por instancia (ENV > config.json > default)
let CURRENT_PREFIX = process.env.PREFIX || PREFIX

// Inicio visual kawaii
banner()
info('Iniciando', BOT_NAME, 'con prefijo', `'${CURRENT_PREFIX}'`)

// Validación dependencias multimedia
checkDeps()

// Loader de metadatos de comandos desde encabezados /** ... */
const parseHeaderMeta = (content) => {
  const m = content.match(/\/\*\*[\s\S]*?\*\//)
  if (!m) return null
  const block = m[0]
  const get = (key) => {
    const r = new RegExp(`\\* \\s*${key}\\s*:\\s*([^\n]+)`, 'i')
    const mm = block.match(r)
    return mm ? mm[1].trim() : null
  }
  const name = get('name')
  const aliasesRaw = get('aliases') || get('alias') || '[]'
  const description = get('description') || get('desc') || ''
  const category = get('category') || 'misc'
  let aliases = []
  try { aliases = JSON.parse(aliasesRaw) } catch { aliases = [] }
  return { name, aliases, description, category }
}

const walkCommands = (dir) => {
  const out = []
  const walk = (d) => {
    if (!fs) return
    const entries = readdirSync(d, { withFileTypes: true })
    for (const ent of entries) {
      const full = path.join(d, ent.name)
      if (ent.isDirectory()) walk(full)
      else if (ent.isFile() && ent.name.endsWith('.js')) {
        try {
          const content = readFileSync(full, 'utf8')
          const meta = parseHeaderMeta(content)
          if (meta?.name) {
            out.push({ ...meta, file: full })
          }
        } catch {}
      }
    }
  }
  try { walk(dir) } catch {}
  return out
}

const COMMANDS_DIR = path.resolve(__dirname, 'comandos')
const commandMeta = walkCommands(COMMANDS_DIR)

const buildMenu = () => {
  const cats = {}
  for (const c of commandMeta) {
    cats[c.category] ||= []
    cats[c.category].push(`$${c.name} — ${c.description}`)
  }
  const lines = [
    `｡ﾟ✧ ${BOT_NAME} Menu ✧ﾟ｡`,
    '',
  ]
  for (const [cat, cmds] of Object.entries(cats)) {
    lines.push(`• ${cat}`)
    for (const l of cmds.sort()) lines.push(`  - ${l}`)
    lines.push('')
  }
  return lines.join('\n')
}

// Registro de usuarios básico (requerido para economía y gacha)
const ensureUser = async (jid) => {
  const users = await loadJSON(USERS_FILE, {})
  if (!users[jid]) {
    users[jid] = { registered: false, createdAt: Date.now() }
    await saveJSON(USERS_FILE, users)
  }
  return users[jid]
}

const setRegistered = async (jid) => {
  const users = await loadJSON(USERS_FILE, {})
  users[jid] ||= { registered: false, createdAt: Date.now() }
  users[jid].registered = true
  users[jid].registeredAt = Date.now()
  await saveJSON(USERS_FILE, users)
}

// Economía básica: inicialización de saldo/banco
const ensureEconomy = async (jid) => {
  const econ = await loadJSON(ECON_FILE, {})
  econ[jid] ||= { balance: 0, bank: 0 }
  await saveJSON(ECON_FILE, econ)
  return econ[jid]
}

// Arranque Baileys
const SESSION_PATH = SESSION_DIR
const BV_FILE = path.resolve(__dirname, DATA_PATH, 'baileysVersion.json')

// Cache de versión de Baileys (evita red en cada arranque)
const getBaileysVersion = async () => {
  // Permitir override por ENV: BAILEYS_VERSION='[2, 3000, 0]'
  try {
    if (process.env.BAILEYS_VERSION) {
      const parsed = JSON.parse(process.env.BAILEYS_VERSION)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {}
  try {
    const cached = await loadJSON(BV_FILE, null)
    const ttl = 7 * 24 * 60 * 60 * 1000 // 7 días
    if (cached && Array.isArray(cached.version) && (Date.now() - (cached.ts || 0) < ttl)) {
      return cached.version
    }
  } catch {}
  try {
    const { version } = await fetchLatestBaileysVersion()
    await saveJSON(BV_FILE, { ts: Date.now(), version })
    return version
  } catch {
    // Fallback conservador (no ideal, pero evita bloquear arranque)
    return [2, 3000, 0]
  }
}

const start = async () => {
  // Cargar prefijo desde config si existe (se respeta ENV primero)
  try {
    if (!process.env.PREFIX) {
      const cfg = await loadJSON(CONFIG_FILE, {})
      if (cfg?.prefix && typeof cfg.prefix === 'string') {
        CURRENT_PREFIX = cfg.prefix
      }
    }
  } catch {}
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_PATH)
  const version = await getBaileysVersion()

  const sock = makeWASocket({
    version,
    printQRInTerminal: false,
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: ['Kirby Dream', 'Chrome', '1.0.0'],
    markOnlineOnConnect: false,
    generateHighQualityLinkPreview: false
  })

  sock.ev.on('connection.update', (u) => {
    const { connection, lastDisconnect, qr } = u
    if (qr) {
      warn('Escanea este QR para vincular tu WhatsApp (caduca en 60s):')
      qrcode.generate(qr, { small: true })
    }

    if (connection === 'open') {
      success('Conectado al universo de WhatsApp ✨')
      info('Sesión activa en', `'${SESSION_PATH}'`)
      info('Data path', `'${DATA_PATH}'`)
      info('Prefijo en uso', `'${CURRENT_PREFIX}'`)
      // Refrescar cache de nombres de grupos para el Panel
      ;(async () => {
        try {
          const all = await sock.groupFetchAllParticipating()
          const meta = {}
          Object.values(all||{}).forEach(g => { if(g?.id) meta[g.id] = { name: g.subject || g.id } })
          await saveJSON(GROUPMETA_FILE, meta)
        } catch (e) { warn('No se pudo refrescar groupMeta:', e?.message||e) }
      })()
      // Iniciar procesador de cola admin
      ;(async () => {
        const tick = async () => {
          try {
            const q = await loadJSON(ADMINQ_FILE, { items: [] })
            const items = Array.isArray(q.items) ? q.items : []
            if (!items.length) return
            const next = items.shift()
            try {
              const { action, gid, user } = next || {}
              if (gid && user && ['promote','demote','kick'].includes(action)) {
                const op = action === 'kick' ? 'remove' : action
                await sock.groupParticipantsUpdate(gid, [user], op)
              }
            } catch {}
            await saveJSON(ADMINQ_FILE, { items })
          } catch {}
        }
        // Ejecutar cada 2s
        setInterval(tick, 2000)
      })()
    } else if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode
      if (code === DisconnectReason.loggedOut) {
        warn('Sesión expirada. Elimina carpeta /session para reemparejar y reinicia.')
      } else {
        warn('Conexión cerrada, intentando reconectar...')
        start().catch(error)
      }
    }
  })

  sock.ev.on('creds.update', saveCreds)

  // Alertas de cambios de rol (promote/demote)
  try {
    sock.ev.on('group-participants.update', async (ev) => {
      try {
        const gid = ev.id
        if (!gid?.endsWith('@g.us')) return
        const groups = await loadJSON(GROUPS_FILE, {})
        const conf = groups[gid] || {}
        const action = String(ev.action||'').toLowerCase()
        const list = Array.isArray(ev.participants) ? ev.participants : []
        if (!list.length) return

        // Bienvenida en altas
        if (action === 'add') {
          const mentions = list
          const tags = mentions.map(j => `@${bareJid(j)}`).join(' ')
          let text = conf.welcomeMsg || '🎀 ¡Bienvenid@ {mentions} a {grupo}!'
          try {
            const meta = await sock.groupMetadata(gid)
            const gname = meta?.subject
            if (gname) text = text.replaceAll('{grupo}', gname)
          } catch {}
          text = text.replaceAll('{mentions}', tags)
          await sock.sendMessage(gid, { text, mentions })
          return
        }

        // Despedida en bajas
        if (action === 'remove') {
          if (conf.goodbye === false) return
          const mentions = list
          const tags = mentions.map(j => `@${bareJid(j)}`).join(' ')
          let text = conf.goodbyeMsg || '💫 {mentions} ha salido de {grupo}. ¡Hasta pronto!'
          try {
            const meta = await sock.groupMetadata(gid)
            const gname = meta?.subject
            if (gname) text = text.replaceAll('{grupo}', gname)
          } catch {}
          text = text.replaceAll('{mentions}', tags)
          await sock.sendMessage(gid, { text, mentions })
          return
        }

        // Alertas promote/demote (respetar flag alerts)
        if (!['promote','demote'].includes(action)) return
        if (conf.alerts === false) return
        const lines = [action === 'promote' ? '🛡️ Promoción de admin' : '⚠️ Degradación de admin']
        list.forEach((jid, i) => lines.push(`${i+1}. @${bareJid(jid)}`))
        await sock.sendMessage(gid, { text: lines.join('\n'), mentions: list })
      } catch {}
    })
  } catch {}

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (!messages?.length) return
    const msg = messages[0]
    if (!msg.message) return

    const remoteJid = msg.key?.remoteJid
    const isGrp = remoteJid?.endsWith('@g.us')
    // Autojoin por DM del owner
    try {
      if (!isGrp) {
        const cfg = await loadJSON(CONFIG_FILE, {})
        if (cfg.autojoin) {
          const owner = (cfg.botOwner || process.env.BOT_OWNER || '').trim()
          const sender = msg.key?.participant || remoteJid
          const bare = (j)=> String(j||'').split(':')[0].split('@')[0]
          if (owner && bare(sender) === bare(owner)) {
            const textRaw = extractText(msg) || ''
            const m = textRaw.match(/chat\.whatsapp\.com\/([A-Za-z0-9]+)/i)
            if (m) {
              const code = m[1]
              try { await sock.groupAcceptInvite(code); await sock.sendMessage(remoteJid,{ text:'🎀 Invitación aceptada.' },{ quoted: msg }) } catch {}
            }
          }
        }
      }
    } catch {}
    // AntiLink middleware: borrar mensajes con links si está activo
    try {
      if (isGrp) {
        const groups = await loadJSON(GROUPS_FILE, {})
        const conf = groups[remoteJid] || {}
        if (conf.antilink) {
          const textRaw = extractText(msg) || ''
          const linkRe = /(https?:\/\/|wa\.me\/|chat\.whatsapp\.com\/|t\.me\/|discord\.gg\/|discord\.com\/invite\/|instagram\.com|facebook\.com|youtu\.be|youtube\.com)/i
          if (linkRe.test(textRaw)) {
            // verificar si el emisor es admin
            let isSenderAdmin = false
            try {
              const meta = await sock.groupMetadata(remoteJid)
              const adminsBare = (meta.participants||[]).filter(p=>p.admin).map(p=>bareJid(p.id))
              const sender = msg.key?.participant || remoteJid
              isSenderAdmin = adminsBare.includes(bareJid(sender))
            } catch {}
            if (!isSenderAdmin) {
              try {
                await sock.sendMessage(remoteJid, { delete: msg.key })
              } catch (e) {
                // No se pudo borrar: informar brevemente
                try { await sock.sendMessage(remoteJid, { text: '🚫 Enlaces no permitidos en este grupo.' }, { quoted: msg }) } catch {}
              }
              // No seguir procesando comandos de este mensaje
              return
            }
          }
        }
      }
    } catch {}
    // ----- Registrar conteo de mensajes por día (América/Bogotá) -----
    try {
      if (isGrp) {
        const stats = await loadJSON(GROUPSTATS_FILE, {})
        const now = new Date()
        // Bogotá TZ: aproximación simple ajustando a GMT-5 sin DST
        const offsetMs = 5 * 60 * 60 * 1000
        const d = new Date(now.getTime() - offsetMs)
        const day = d.toISOString().slice(0,10)
        const sender = msg.key?.participant || remoteJid
        stats[remoteJid] ||= { users: {}, lastUpdated: day }
        const su = stats[remoteJid].users[sender] ||= { total: 0, byDay: {}, commands: 0 }
        su.total += 1
        su.byDay[day] = (su.byDay[day] || 0) + 1
        stats[remoteJid].lastUpdated = day
        await saveJSON(GROUPSTATS_FILE, stats)
      }
    } catch {}
    const text = extractText(msg)
    if (!text) return

    // Middleware: audios automáticos por trigger (antes de parsear comandos)
    try {
      const cfg = await loadJSON(CONFIG_FILE, { audiosEnabled: true })
      if (cfg.audiosEnabled) {
        const audDB = await loadJSON(AUDIOS_DB, { audios: [] })
        const list = Array.isArray(audDB.audios) ? audDB.audios : []
        const low = text.toLowerCase()
        const sorted = list.slice().sort((a,b)=> (b.trigger||'').length - (a.trigger||'').length)
        const item = sorted.find(a => a && a.trigger && low.includes(String(a.trigger).toLowerCase()))
        if (item) {
          const isGroup = remoteJid?.endsWith('@g.us')
          if (!isGroup && item.groupOnly) {
            // restringido a grupos; no reproducir en privado
          } else {
            await sock.sendMessage(remoteJid, { audio: { url: item.url }, mimetype: 'audio/mpeg', ptt: false }, { quoted: msg })
          }
        }
      }
    } catch {}

    const parsed = parseCommand(text, PREFIX)
    if (!parsed) return
    let cmd = parsed?.cmd
    let args = parsed?.args || []

    // Alias mapping a nombre principal
    const aliasMap = new Map()
    for (const c of commandMeta) {
      aliasMap.set(c.name, c.name)
      for (const a of c.aliases || []) aliasMap.set(a.toLowerCase(), c.name)
    }
    const mainName = aliasMap.get(cmd) || cmd

    // ----- Control por grupo: activo, onlyAdmin (permitir $bot siempre) -----
    if (isGrp) {
      const groups = await loadJSON(GROUPS_FILE, {})
      const conf = groups[remoteJid] || {}
      // Si el bot está desactivado, permitir únicamente $bot para reactivarlo
      if (conf.active === false && mainName !== 'bot') {
        await sock.sendMessage(remoteJid, { text: `🌙 El bot está desactivado en este grupo. Un admin puede usar ${PREFIX}bot enable` }, { quoted: msg })
        return
      }
      // onlyAdmin: no aplica a $bot aquí (el propio comando valida admin)
      if (conf.onlyAdmin && mainName !== 'bot') {
        try {
          const meta = await sock.groupMetadata(remoteJid)
          const bare = (j)=> String(j||'').split(':')[0].split('@')[0]
          const adminsBare = (meta.participants||[]).filter(p=>p.admin).map(p=>bare(p.id))
          const sender = msg.key?.participant || remoteJid
          const isAdmin = adminsBare.includes(bare(sender))
          if (!isAdmin) {
            await sock.sendMessage(remoteJid, { text: '🌸 Comando solo para administradores 💕' }, { quoted: msg })
            return
          }
        } catch {}
      }
    }

    // Comandos internos mínimos (reservados si hicieran falta)
    // Registrar ahora se maneja como módulo en comandos/perfiles/register.js

    // Verificación de registro para economía/gacha
    const econCmds = new Set(['balance','bal','coins','daily','deposit','withdraw','work','topcoins','fish','pescar','mine','minar'])
    const gachaCmds = new Set(['roll','gacha','pull','harem','givechar','sell','topwaifus'])
    if (econCmds.has(mainName) || gachaCmds.has(mainName)) {
      const jidKey = msg.key?.participant || remoteJid
      const user = await ensureUser(jidKey)
      if (!user.registered) {
        await sock.sendMessage(remoteJid, { text: `Necesitas registrarte antes de usar economía o gacha. Usa ${PREFIX}register porfi~ (｡•́︿•̀｡)` }, { quoted: msg })
        return
      }
    }

    // Si el comando aún no existe implementado
    const found = commandMeta.find(c => c.name === mainName)
    if (!found) {
      await sock.sendMessage(remoteJid, { text: `Comando desconocido. Prueba ${PREFIX}menu` }, { quoted: msg })
      return
    }
    // Respetar estado del bot por grupo: si está inactivo, solo permitir comando 'bot' o owner
    if (isGrp) {
      try {
        const groups = await loadJSON(GROUPS_FILE, {})
        const active = groups?.[remoteJid]?.active !== false
        if (!active) {
          const actorJid = msg.key?.participant || remoteJid
          const owner = process.env.BOT_OWNER || ''
          if (found.name !== 'bot' && actorJid !== owner) {
            await sock.sendMessage(remoteJid, { text: `🌙 El bot está desactivado en este grupo. Un admin puede usar ${PREFIX}bot enable` }, { quoted: msg })
            return
          }
        }
      } catch {}
    }
    // Intentar cargar e invocar módulo si existe export run
    try {
      const mod = await import(pathToFileURL(found.file).href)
      if (typeof mod.run === 'function') {
        const ctx = {
          sock,
          msg,
          args,
          PREFIX,
          meta: found,
          rawCmd: cmd,
          files: { USERS_FILE, ECON_FILE, GACHA_FILE, GROUPS_FILE, GROUPSTATS_FILE, CHARACTERS_FILE, SALES_FILE, GACHALOGS_FILE, AUDIOS_DB, CONFIG_FILE, STICKERS_DB, STICKERS_DIR, REACTIONS_FILE, PETS_FILE, EVENTS_FILE },
          db: { loadJSON, saveJSON },
          util: {
            formatKirby,
            bareJid,
            isLidJid,
            meBare: bareJid(sock.user?.id),
            groupUsesLid: isLidJid(msg.key?.participant || ''),
          },
        }
        // Log de comando ejecutado
        try {
          const actorJid = msg.key?.participant || remoteJid
          const actorName = msg.pushName || actorJid
          event(`$${found.name} by ${actorName} (${actorJid})${isGrp ? ` in ${remoteJid}` : ''} args="${args.join(' ')}"`)
        } catch {}

        // marcar conteo de comandos en stats
        try {
          if (isGrp) {
            const stats = await loadJSON(GROUPSTATS_FILE, {})
            const now = new Date()
            const offsetMs = 5 * 60 * 60 * 1000
            const d = new Date(now.getTime() - offsetMs)
            const day = d.toISOString().slice(0,10)
            stats[remoteJid] ||= { users: {}, lastUpdated: day }
            stats[remoteJid].users ||= {}
            const su = stats[remoteJid].users[actorJid] ||= { total: 0, byDay: {}, commands: 0 }
            su.commands += 1
            stats[remoteJid].lastUpdated = day
            await saveJSON(GROUPSTATS_FILE, stats)
          }
        } catch {}

        try {
          await mod.run(ctx)
          success(`✔ CMD ${found.name} completed`)
          return
        } catch (e) {
          error(`✖ CMD ${found.name} failed: ${e?.message||e}`)
          try { await sock.sendMessage(remoteJid, { text: `❌ Ocurrió un error al ejecutar ${PREFIX}${found.name}. Intenta de nuevo más tarde.` }, { quoted: msg }) } catch {}
          return
        }
      }
    } catch (e) {
      warn(`Error cargando módulo ${found.name}:`, e?.message)
      try { await sock.sendMessage(remoteJid, { text: `Comando ${PREFIX}${found.name} aún no implementado. Prueba ${PREFIX}menu mientras tanto~` }, { quoted: msg }) } catch {}
      return
    }
  })
}

start().catch((e) => {
  error('Error fatal al iniciar:', e?.message || e)
  process.exitCode = 1
})
