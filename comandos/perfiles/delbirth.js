/**
 * name: delbirth
 * aliases: []
 * description: Borra tu fecha de cumpleaños 🗑️
 * category: Perfiles
 */

export async function run(ctx) {
  const { sock, msg, files, db } = ctx
  const { USERS_FILE } = files
  const remoteJid = msg.key?.remoteJid
  const sender = msg.key?.participant || remoteJid

  const users = await db.loadJSON(USERS_FILE, {})
  const u = users[sender]
  if (!u?.registered) {
    await sock.sendMessage(remoteJid, { text: `🌸 ¡Yay~! Aún no tienes perfil. Usa $register para comenzar 💕` }, { quoted: msg })
    return
  }
  u.birthdate = ''
  users[sender] = u
  await db.saveJSON(USERS_FILE, users)
  await sock.sendMessage(remoteJid, { text: '🗑️ Cumpleaños eliminado de tu perfil. ¡Aún celebramos tu brillo! ✨' }, { quoted: msg })
}
