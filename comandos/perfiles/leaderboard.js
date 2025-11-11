/**
 * name: leaderboard
 * aliases: ["lboard", "top"]
 * description: Muestra el Top global de Dreamers por XP 🌟
 * category: Perfiles
 */

export async function run(ctx) {
  const { sock, msg, args, files, db } = ctx
  const { USERS_FILE } = files
  const remoteJid = msg.key?.remoteJid

  const page = Math.max(1, parseInt(args[0] || '1', 10) || 1)
  const size = 10

  const users = await db.loadJSON(USERS_FILE, {})
  const arr = Object.values(users)
    .filter(u => u?.registered)
    .sort((a, b) => (b.xp || 0) - (a.xp || 0))

  if (!arr.length) {
    await sock.sendMessage(remoteJid, { text: '> 🌸 *No hay Dreamers con XP aún.* ¡Comienza tu aventura en Dreamland!* 💫' }, { quoted: msg })
    return
  }

  const start = (page - 1) * size
  const slice = arr.slice(start, start + size)
  const totalPages = Math.ceil(arr.length / size)

  if (!slice.length) {
    await sock.sendMessage(remoteJid, { text: '> 💫 *Página fuera de rango.* Intenta con otra: `$leaderboard 1`' }, { quoted: msg })
    return
  }

  const medals = ['👑', '💎', '🌟']
  const header = [
    `╭─❖  *DREAMLAND LEADERBOARD*  ❖─╮`,
    `🌈 _Top global de aventureros más brillantes_`,
    `📖 Página *${page}* / *${totalPages}*`,
    `──────────────────────────────`
  ].join('\n')

  const body = slice.map((u, i) => {
    const pos = start + i + 1
    const icon = medals[i] || `#${pos}`
    const name = u.name || 'Dreamer'
    const lvl = u.level ?? 1
    const xp = u.xp ?? 0
    const xpNext = Math.floor((lvl + 1) * 200)
    const percent = Math.min(100, Math.floor((xp / xpNext) * 100))
    const filled = Math.floor((percent / 100) * 15)
    const bar = '█'.repeat(filled) + '░'.repeat(15 - filled)

    return [
      `🎖️ *${icon} ${name}*`,
      '```',
      ` Nivel:    ${lvl}`,
      ` XP:       ${xp} / ${xpNext}`,
      ` Progreso: [${bar}] ${percent}%`,
      '```'
    ].join('\n')
  })

  const footer = [
    `──────────────────────────────`,
    `🌸 Usa \`$leaderboard <página>\` para explorar más rankings.`,
    `╰──────────────────────────────╯`
  ].join('\n')

  const caption = [header, body.join('\n'), footer].join('\n')

  await sock.sendMessage(remoteJid, { text: caption }, { quoted: msg })
}
