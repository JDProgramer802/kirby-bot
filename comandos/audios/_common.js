// Helpers comunes para módulo Audios
import { promises as fs } from 'fs'
import path from 'path'

export const ensureAudioDB = async (files, db) => {
  const aud = await db.loadJSON(files.AUDIOS_DB, { audios: [] })
  if (!Array.isArray(aud.audios)) { aud.audios = []; await db.saveJSON(files.AUDIOS_DB, aud) }
  const cfg = await db.loadJSON(files.CONFIG_FILE, { audiosEnabled: true })
  if (typeof cfg.audiosEnabled !== 'boolean') { cfg.audiosEnabled = true; await db.saveJSON(files.CONFIG_FILE, cfg) }
  return { aud, cfg }
}

export const isOwnerOrAdmin = async (sock, msg) => {
  const owner = process.env.BOT_OWNER || ''
  const gid = msg.key?.remoteJid
  const jid = msg.key?.participant || gid
  if (owner && jid === owner) return true
  const isGroup = gid.endsWith('@g.us')
  if (!isGroup) return false
  try {
    const meta = await sock.groupMetadata(gid)
    const bare = (j)=> String(j||'').split(':')[0].split('@')[0]
    const adminsBare = (meta.participants||[]).filter(p=>p.admin).map(p=>bare(p.id))
    return adminsBare.includes(bare(jid))
  } catch { return false }
}

export const saveAudioFileFromMsg = async (sock, msg, destDir, filename) => {
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
  const audioMsg = quoted?.audioMessage || msg.message?.audioMessage || quoted?.voiceMessage || null
  if (!audioMsg) return null
  const { downloadContentFromMessage } = await import('@whiskeysockets/baileys')
  const stream = await downloadContentFromMessage(audioMsg, 'audio')
  await fs.mkdir(destDir, { recursive: true })
  const filePath = path.join(destDir, filename)
  let buffer = Buffer.from([])
  for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
  await fs.writeFile(filePath, buffer)
  return filePath
}

export const findTrigger = (text, list=[]) => {
  if (!text) return null
  const low = text.toLowerCase()
  // Coincidencia exacta por palabra o contiene
  const sorted = list.slice().sort((a,b)=> b.length - a.length)
  return sorted.find(t => low.includes(t.toLowerCase())) || null
}
