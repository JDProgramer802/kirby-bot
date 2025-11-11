/**
 * name: marry
 * aliases: ["casarse"]
 * description: Cásate con otro usuario en Dreamland 💞
 * category: Perfiles
 */

export async function run(ctx) {
  const { sock, msg, files, db } = ctx
  const { USERS_FILE } = files
  const remoteJid = msg.key?.remoteJid
  const sender = msg.key?.participant || remoteJid
  const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
  const target = mentions[0]

  const users = await db.loadJSON(USERS_FILE, {})
  const a = users[sender]
  if (!a?.registered) {
    await sock.sendMessage(remoteJid, { text: `🌸 ¡Yay~! Aún no tienes perfil. Usa $register para comenzar 💕` }, { quoted: msg })
    return
  }
  if (!target) {
    await sock.sendMessage(remoteJid, { text: '💕 Debes mencionar a alguien para casarte. Ej: $marry @usuario' }, { quoted: msg })
    return
  }
  if (target === sender) {
    await sock.sendMessage(remoteJid, { text: '(´｡• ᵕ •｡`) ♡ No puedes casarte contigo mism@, busca a tu media estrella ✨' }, { quoted: msg })
    return
  }
  const b = users[target]
  if (!b?.registered) {
    await sock.sendMessage(remoteJid, { text: '🌸 Esa personita no tiene perfil aún. Dile que use $register 💖' }, { quoted: msg })
    return
  }
  if (a.partner || b.partner) {
    await sock.sendMessage(remoteJid, { text: '💫 Alguien ya está casad@. Primero gestionen su estado, porfi~' }, { quoted: msg })
    return
  }
  a.partner = target
  b.partner = sender
  users[sender] = a
  users[target] = b
  await db.saveJSON(USERS_FILE, users)
  const nameA = a.name || 'Dreamer A'
  const nameB = b.name || 'Dreamer B'
  await sock.sendMessage(remoteJid, { text: `💍 ¡Felicidades, ${nameA} y ${nameB}! Dreamland celebra su unión 💖✨` }, { quoted: msg })
}
