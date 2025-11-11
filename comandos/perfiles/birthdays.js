/**
 * name: birthdays
 * aliases: ["cumpleaños", "births"]
 * description: Ver cumpleaños cercanos en el grupo 🥳
 * category: Perfiles
 */

function daysUntil(ddmm) {
  const [d,m] = ddmm.split('/').map(Number)
  const now = new Date()
  const year = now.getFullYear()
  const target = new Date(year, m-1, d)
  if (target < now) target.setFullYear(year+1)
  const diff = Math.ceil((target - now) / (1000*60*60*24))
  return diff
}

export async function run(ctx) {
  const { sock, msg, files, db } = ctx
  const { USERS_FILE } = files
  const remoteJid = msg.key?.remoteJid
  const isGroup = remoteJid.endsWith('@g.us')

  const users = await db.loadJSON(USERS_FILE, {})
  let list = []
  if (isGroup) {
    try {
      const meta = await sock.groupMetadata(remoteJid)
      const members = meta.participants?.map(p => p.id) || []
      for (const jid of members) {
        const u = users[jid]
        if (u?.registered && u.birthdate) list.push({ jid, name: u.name||jid, ddmm: u.birthdate })
      }
    } catch {}
  } else {
    for (const [jid,u] of Object.entries(users)) {
      if (u?.registered && u.birthdate) list.push({ jid, name: u.name||jid, ddmm: u.birthdate })
    }
  }
  if (!list.length) {
    await sock.sendMessage(remoteJid, { text: '🌸 Aún no hay cumpleaños registrados 💫' }, { quoted: msg })
    return
  }
  list = list.map(x => ({ ...x, in: daysUntil(x.ddmm) })).sort((a,b) => a.in - b.in).slice(0,10)
  const lines = ['🎂 Próximos cumpleaños en Dreamland:']
  for (const x of list) lines.push(`• ${x.name} — ${x.ddmm} (en ${x.in} días)`) 
  await sock.sendMessage(remoteJid, { text: lines.join('\n') }, { quoted: msg })
}
