/**
 * name: setdescription
 * aliases: ["setdesc"]
 * description: Cambia tu descripción personal 🌷
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
  const text = args.join(' ').trim()
  if (!text) {
    await sock.sendMessage(remoteJid, { text: '🌸 La descripción no puede estar vacía. Intenta algo cortito y lindo (máx 120) ✨' }, { quoted: msg })
    return
  }
  if (text.length > 120) {
    await sock.sendMessage(remoteJid, { text: '🎀 Oops, demasiado largo. Mantén tu descripción en 120 caracteres o menos, porfi~' }, { quoted: msg })
    return
  }
  u.description = text
  users[sender] = u
  await db.saveJSON(USERS_FILE, users)
  await sock.sendMessage(remoteJid, { text: '💖 ¡Descripción actualizada! Te ves más kawaii que nunca ✨' }, { quoted: msg })
}
