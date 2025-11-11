/**
 * name: allbirthdays
 * aliases: ["allbirths"]
 * description: Muestra todos los cumpleaños de Dreamland 🎂
 * category: Perfiles
 */

export async function run(ctx) {
  const { sock, msg, files, db } = ctx
  const { USERS_FILE } = files
  const remoteJid = msg.key?.remoteJid

  const users = await db.loadJSON(USERS_FILE, {})
  const list = Object.entries(users)
    .filter(([,u]) => u?.registered && u.birthdate)
    .map(([jid,u]) => ({ name: u.name||jid, ddmm: u.birthdate }))
    .sort((a,b) => {
      const [ad,am] = a.ddmm.split('/').map(Number)
      const [bd,bm] = b.ddmm.split('/').map(Number)
      return am===bm ? ad-bd : am-bm
    })

  if (!list.length) {
    await sock.sendMessage(remoteJid, { text: '🌸 Nadie ha registrado su cumpleaños aún 💫' }, { quoted: msg })
    return
  }
  const lines = ['🎂 Cumpleaños de Dreamland:']
  for (const x of list) lines.push(`• ${x.name} — ${x.ddmm}`)
  await sock.sendMessage(remoteJid, { text: lines.join('\n') }, { quoted: msg })
}
