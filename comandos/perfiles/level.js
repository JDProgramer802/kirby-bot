/**
 * name: level
 * aliases: ["lvl"]
 * description: Muestra tu nivel y experiencia actual con estilo RPG ✨
 * category: Perfiles
 */

export async function run(ctx) {
  const { sock, msg, args, files, db } = ctx
  const { USERS_FILE } = files
  const remoteJid = msg.key?.remoteJid
  const sender = msg.key?.participant || remoteJid
  const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
  const target = mentions[0] || args[0] || sender

  const users = await db.loadJSON(USERS_FILE, {})
  const u = users[target]
  if (!u?.registered) {
    await sock.sendMessage(
      remoteJid,
      { text: `> 🌸 *Ese usuario no tiene perfil aún.*\n> Usa \`$register\` para comenzar tu aventura en Dreamland 💕` },
      { quoted: msg }
    )
    return
  }

  // Calcular nivel y progreso
  const level = u.level ?? 1
  const xp = u.xp ?? 0
  const xpNext = Math.floor((level + 1) * 200)
  const percent = Math.min(100, Math.floor((xp / xpNext) * 100))
  const barLength = 20
  const filled = Math.floor((percent / 100) * barLength)
  const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled)

  const caption = [
    `> ╭───★・✧・🌈・✧・★───╮`,
    `> 💖 *PROGRESO DE ENTRENAMIENTO*`,
    `>`,
    '```',
    `👤 Usuario:   ${u.name || 'Dreamer'}`,
    `🏅 Nivel:     ${level}`,
    `✨ XP:        ${xp} / ${xpNext}`,
    `📈 Progreso:  [${bar}] ${percent}%`,
    '```',
    `> 🌸 *Sigue explorando Dreamland para subir de nivel!*`,
    `> ╰──────────────🌸──────────────╯`
  ].join('\n')

  await sock.sendMessage(
    remoteJid,
    { text: caption, mentions: [target] },
    { quoted: msg }
  )
}

