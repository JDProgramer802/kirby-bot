/**
 * name: setfavourite
 * aliases: ["setfav"]
 * description: Define tu personaje favorito (claim) 💕
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
  const fav = args.join(' ').trim()
  if (!fav) {
    await sock.sendMessage(remoteJid, { text: '✨ Dime tu personaje favorito, porfi~ Ej: $setfav Kirby' }, { quoted: msg })
    return
  }
  u.favourite = fav.slice(0, 60)
  users[sender] = u
  await db.saveJSON(USERS_FILE, users)
  await sock.sendMessage(remoteJid, { text: `🎀 ¡Hecho! Tu favorito ahora es: ${u.favourite} ✨` }, { quoted: msg })
}
