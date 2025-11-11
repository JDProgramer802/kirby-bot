/**
 * name: forward
 * aliases: ["reenviar","sendto","fwd","hola"]
 * description: Reenvía una imagen citada (con su texto) a un grupo destino (JID) desde cualquier grupo. Solo para administradores.
 * category: Administración
 */

import { requireGroup, isAdmin } from './_common.js'

export async function run(ctx){
  const { sock, msg, args = [], files, db } = ctx

  // Debe ejecutarse en grupo y por admin del grupo actual
  const { ok, gid } = await requireGroup(sock, msg)
  if (!ok) return sock.sendMessage(msg.key.remoteJid, { text: '🌸 Este comando solo funciona en grupos.' }, { quoted: msg })
  const sender = msg.key?.participant || gid
  if (!(await isAdmin(sock, gid, sender))) {
    return sock.sendMessage(gid, { text: '🌸 Comando solo para administradores.' }, { quoted: msg })
  }

  // Resolver grupo destino: argumento o CONFIG_FILE.forwardTarget
  let target = (args[0] || '').trim()
  try {
    if (!target) {
      const cfg = await db.loadJSON(files.CONFIG_FILE, {})
      if (cfg.forwardTarget) target = String(cfg.forwardTarget).trim()
    }
  } catch {}
  if (!target || !target.endsWith('@g.us')) {
    return
  }

  // Verificar que el bot esté en el grupo destino (si falla metadata, avisar pero intentar enviar)
  let targetName = ''
  try {
    const meta = await sock.groupMetadata(target)
    targetName = meta?.subject || ''
  } catch (e) {
    // Puede fallar si el bot no está en el grupo destino
  }

  // Obtener mensaje citado (media o texto) o el media del propio mensaje
  const quotedRaw = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || null
  const unwrapMedia = (m) => {
    if (!m) return { kind: null, node: null }
    if (m.imageMessage) return { kind: 'image', node: m.imageMessage }
    if (m.videoMessage) return { kind: 'video', node: m.videoMessage }
    if (m.documentMessage) return { kind: 'document', node: m.documentMessage }
    if (m.ephemeralMessage?.message) return unwrapMedia(m.ephemeralMessage.message)
    if (m.viewOnceMessage?.message) return unwrapMedia(m.viewOnceMessage.message)
    if (m.viewOnceMessageV2?.message) return unwrapMedia(m.viewOnceMessageV2.message)
    if (m.viewOnceMessageV2Extension?.message) return unwrapMedia(m.viewOnceMessageV2Extension.message)
    return { kind: null, node: null }
  }
  const ownMedia = unwrapMedia(msg.message || null)
  const quotedMedia = unwrapMedia(quotedRaw)
  const media = quotedMedia.kind ? quotedMedia : ownMedia
  let caption = ''

  try {
    // Capturar caption del media citado si existe (también dentro de wrappers)
    const getCaption = (m) => {
      if (!m) return ''
      if (m.imageMessage?.caption) return m.imageMessage.caption
      if (m.videoMessage?.caption) return m.videoMessage.caption
      if (m.documentMessage?.caption) return m.documentMessage.caption
      if (m.ephemeralMessage?.message) return getCaption(m.ephemeralMessage.message)
      if (m.viewOnceMessage?.message) return getCaption(m.viewOnceMessage.message)
      if (m.viewOnceMessageV2?.message) return getCaption(m.viewOnceMessageV2.message)
      if (m.viewOnceMessageV2Extension?.message) return getCaption(m.viewOnceMessageV2Extension.message)
      return ''
    }
    caption = getCaption(quotedRaw) || getCaption(msg.message) || ''
  } catch {}

  if (media && media.kind) {
    try {
      const { downloadContentFromMessage } = await import('@whiskeysockets/baileys')
      let type = media.kind
      const stream = await downloadContentFromMessage(media.node, type)
      let buffer = Buffer.from([])
      for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
      if (type === 'image') {
        await sock.sendMessage(target, { image: buffer, caption }, {})
      } else if (type === 'video') {
        await sock.sendMessage(target, { video: buffer, caption }, {})
      } else if (type === 'document') {
        const fileName = media.node.fileName || 'file'
        const mimetype = media.node.mimetype || undefined
        await sock.sendMessage(target, { document: buffer, fileName, mimetype, caption }, {})
      }
    } catch (e) {
      return
    }
    return
  }

  // Si no hay imagen, intentar con texto del mensaje citado o de los args
  const getText = (m) => {
    if (!m) return ''
    if (m.conversation) return m.conversation
    if (m.extendedTextMessage?.text) return m.extendedTextMessage.text
    if (m.imageMessage?.caption) return m.imageMessage.caption
    if (m.videoMessage?.caption) return m.videoMessage.caption
    if (m.documentMessage?.caption) return m.documentMessage.caption
    if (m.ephemeralMessage?.message) return getText(m.ephemeralMessage.message)
    if (m.viewOnceMessage?.message) return getText(m.viewOnceMessage.message)
    if (m.viewOnceMessageV2?.message) return getText(m.viewOnceMessageV2.message)
    if (m.viewOnceMessageV2Extension?.message) return getText(m.viewOnceMessageV2Extension.message)
    return ''
  }
  const textToSend = (getText(quotedRaw) || args.join(' ').trim() || '').toString()
  if (!textToSend) return
  try {
    await sock.sendMessage(target, { text: textToSend }, {})
  } catch (e) {
    return
  }
}
