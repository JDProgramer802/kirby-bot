/**
 * name: register
 * aliases: []
 * description: Crea tu perfil y únete oficialmente a Dreamland 🌸
 * category: Perfiles
 */

export async function run(ctx) {
  const { sock, msg, files, db } = ctx
  const { USERS_FILE } = files
  const remoteJid = msg.key?.remoteJid
  const sender = msg.key?.participant || remoteJid
  const name = msg.pushName || 'Dreamer'

  const users = await db.loadJSON(USERS_FILE, {})
  const u = users[sender]
  if (u?.registered) {
    await sock.sendMessage(remoteJid, { text: `🌸 Ya tienes perfil, ${name}. Usa $profile para verlo 💕` }, { quoted: msg })
    return
  }

  users[sender] = {
    id: sender,
    name,
    registered: true,
    coins: 1000.00,
    bank: 0,
    level: 1,
    xp: 0,
    description: '',
    gender: '',
    birthdate: '',
    partner: '',
    favourite: ''
  }
  await db.saveJSON(USERS_FILE, users)

  await sock.sendMessage(remoteJid, { text: `💫 ¡Registro completado, ${name}! Bienvenid@ a Dreamland 🌸 Recibes ₭ 1000.00 🎀` }, { quoted: msg })
}
