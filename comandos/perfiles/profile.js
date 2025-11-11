/**
 * name: profile
 * aliases: []
 * description: Muestra tu perfil o el de otro usuario 🌸
 * category: Perfiles
 */

export async function run(ctx) {
  const { sock, msg, args, files, db, util } = ctx
  const { USERS_FILE } = files
  const remoteJid = msg.key?.remoteJid
  const sender = msg.key?.participant || remoteJid
  const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
  const target = mentions[0] || args[0] || sender

  const users = await db.loadJSON(USERS_FILE, {})
  const u = users[target]
  if (!u?.registered) {
    await sock.sendMessage(remoteJid, { text: `🌸 ¡Yay~! Aún no hay perfil para ese usuario. Usa $register para comenzar 💕` }, { quoted: msg })
    return
  }
  const name = u.name || 'Dreamer'
  const gender = u.gender || '—'
  const partner = u.partner ? (users[u.partner]?.name || u.partner) : 'ninguna'
  const birth = u.birthdate ? `🎂 ${u.birthdate}` : ''
  const desc = u.description ? `🎀 ${u.description}` : ''
  const fav = u.favourite ? `⭐ Favorito: ${u.favourite}` : ''

  const coins = util.formatKirby(u.coins ?? 0)
  const bank = util.formatKirby(u.bank ?? 0)

  const lines = [
    `💖 Perfil de ${name}`,
    `Nivel ${u.level ?? 1} | XP ${u.xp ?? 0}`,
    `Género: ${gender} | Pareja: ${partner}`,
    [birth, desc, fav].filter(Boolean).join(' | ') || '—',
    `🪙 Cartera: ${coins} | 🏦 Banco: ${bank}`
  ]
  await sock.sendMessage(remoteJid, { text: lines.join('\n') }, { quoted: msg })
}
