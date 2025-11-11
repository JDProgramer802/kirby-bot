/**
 * name: divorce
 * aliases: []
 * description: Rompe tu matrimonio en Dreamland 💔
 * category: Perfiles
 */

export async function run(ctx) {
  const { sock, msg, files, db } = ctx
  const { USERS_FILE } = files
  const remoteJid = msg.key?.remoteJid
  const sender = msg.key?.participant || remoteJid

  const users = await db.loadJSON(USERS_FILE, {})
  const a = users[sender]
  if (!a?.registered) {
    await sock.sendMessage(remoteJid, { text: `🌸 ¡Yay~! Aún no tienes perfil. Usa $register para comenzar 💕` }, { quoted: msg })
    return
  }
  if (!a.partner) {
    await sock.sendMessage(remoteJid, { text: '🌸 No estás casad@ en Dreamland. ¡Ánimo, tu estrella aparecerá! ✨' }, { quoted: msg })
    return
  }
  const partner = a.partner
  a.partner = ''
  users[sender] = a
  if (users[partner]) {
    users[partner].partner = ''
  }
  await db.saveJSON(USERS_FILE, users)
  await sock.sendMessage(remoteJid, { text: '💔 Has roto tu vínculo en Dreamland… ¡pero la esperanza vuelve a brillar! 🌸' }, { quoted: msg })
}
