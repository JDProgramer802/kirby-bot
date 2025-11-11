/**
 * name: delgenre
 * aliases: []
 * description: Elimina tu género actual 💫
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
  u.gender = ''
  users[sender] = u
  await db.saveJSON(USERS_FILE, users)
  await sock.sendMessage(remoteJid, { text: '✨ Género eliminado. ¡Sé libre como el viento de Dreamland! 🌸' }, { quoted: msg })
}
