/**
 * name: setgenre
 * aliases: []
 * description: Establece tu género: Hombre o Mujer 🌸
 * category: Perfiles
 */

export async function run(ctx) {
  const { sock, msg, args, files, db } = ctx
  const { USERS_FILE } = files
  const remoteJid = msg.key?.remoteJid
  const sender = msg.key?.participant || remoteJid

  const users = await db.loadJSON(USERS_FILE, {})
  const u = users[sender]
  if (!u?.registered) {
    await sock.sendMessage(remoteJid, { text: `🌸 ¡Yay~! Aún no tienes perfil. Usa $register para comenzar 💕` }, { quoted: msg })
    return
  }
  const val = (args[0] || '').toLowerCase()
  if (!['hombre','mujer'].includes(val)) {
    await sock.sendMessage(remoteJid, { text: '💕 Opciones válidas: Hombre | Mujer. Ej: $setgenre Mujer' }, { quoted: msg })
    return
  }
  u.gender = val === 'hombre' ? 'Hombre' : 'Mujer'
  users[sender] = u
  await db.saveJSON(USERS_FILE, users)
  await sock.sendMessage(remoteJid, { text: `💫 Género actualizado a: ${u.gender} ✨` }, { quoted: msg })
}
