/**
 * name: fake
 * aliases: ["respuesta","replyfake"]
 * description: Envía un mensaje que "parece" responder a un usuario específico, simulando una cita.
 * category: Administración
 */

import { requireGroup, isAdmin, mentionTarget } from './_common.js'

export async function run(ctx){
  const { sock, msg, args = [] } = ctx

  // Solo en grupos y por administradores (para evitar abuso)
  const { ok, gid } = await requireGroup(sock, msg)
  if (!ok) return
  const sender = msg.key?.participant || gid
  if (!(await isAdmin(sock, gid, sender))) return

  // Target: por mención o primer argumento
  let target = mentionTarget(msg, args) || ''
  // Si no hay mención y el primer arg parece número/JID, tomarlo
  if (!target && args[0]) target = String(args[0]).trim()
  // Normalizar JID: aceptar @s.whatsapp.net, @lid o número pelado
  const normalizeJid = (v='') => {
    const s = String(v).trim()
    if (!s) return ''
    if (s.includes('@lid')) {
      const digits = s.replace(/[^0-9]/g,'')
      return digits ? `${digits}@s.whatsapp.net` : ''
    }
    if (s.includes('@')) return s
    // número pelado
    const digits = s.replace(/[^0-9]/g,'')
    return digits ? `${digits}@s.whatsapp.net` : ''
  }
  target = normalizeJid(target)

  // Construir el texto a partir del resto de args, removiendo el token de @mención si viene en texto
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
  let restTokens = [...args]
  if (mentioned.length) {
    restTokens = restTokens.filter(t => !t.startsWith('@'))
  } else if (args[0]) {
    // si el primer token era el id/número del objetivo, quitarlo
    const maybeId = String(args[0]).trim()
    if (/^@?\d{5,}$/.test(maybeId)) restTokens = args.slice(1)
  }
  const joined = restTokens.join(' ').trim()

  // Formato: $fake @user | texto_citado | respuesta
  // Si solo hay una parte, se usa como respuesta; la cita será "Era ejemplo"
  const parts = joined.split('|').map(s => s.trim()).filter(Boolean)
  const quotedText = parts.length >= 2 ? parts[0] : (parts[0] ? parts[0] : 'Mensaje de ejemplo')
  const replyText  = parts.length >= 2 ? parts[1] : (parts[0] ? parts[0] : 'OK')

  if (!target) return

  // Construir un mensaje "quoted" falso que parezca enviado por target
  const fakeQuoted = {
    key: {
      remoteJid: gid,
      fromMe: false,
      id: 'BAE5' + Date.now(),
      participant: target
    },
    message: {
      conversation: quotedText
    }
  }

  try {
    await sock.sendMessage(gid, { text: replyText || '.' }, { quoted: fakeQuoted })
  } catch {}
}
