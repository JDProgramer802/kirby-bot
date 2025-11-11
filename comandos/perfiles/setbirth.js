/**
 * name: setbirth
 * aliases: []
 * description: Establece tu fecha de cumpleaños 🎉
 * category: Perfiles
 */

function toDDMM(s) {
  // Acepta DD/MM o YYYY-MM-DD
  s = s.trim()
  const dash = /^\d{4}-\d{2}-\d{2}$/
  const slash = /^\d{2}\/\d{2}$/
  if (dash.test(s)) {
    const [y,m,d] = s.split('-').map(Number)
    if (m<1||m>12||d<1||d>31) return null
    return `${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}`
  }
  if (slash.test(s)) {
    const [d,m] = s.split('/').map(Number)
    if (m<1||m>12||d<1||d>31) return null
    return `${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}`
  }
  return null
}

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
  const dateText = (args[0] || '').trim()
  const ddmm = toDDMM(dateText)
  if (!ddmm) {
    await sock.sendMessage(remoteJid, { text: '🎂 Formato inválido. Usa DD/MM (ej: 05/11) o YYYY-MM-DD (ej: 2000-11-05).' }, { quoted: msg })
    return
  }
  u.birthdate = ddmm
  users[sender] = u
  await db.saveJSON(USERS_FILE, users)
  await sock.sendMessage(remoteJid, { text: `🎉 ¡Cumple listo! Guardé ${ddmm} en tu perfil ✨` }, { quoted: msg })
}
