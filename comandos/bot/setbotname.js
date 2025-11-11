/**
 * name: setbotname
 * aliases: ["setname","setbotusername","setusername"]
 * description: Cambia nombres del bot: corto / largo
 * category: Bot
 */

const isOwner = async (sock, cfg, jid) => {
  const bare = (j)=> String(j||'').split(':')[0].split('@')[0]
  const owner = bare(cfg.botOwner || process.env.BOT_OWNER || '')
  return !owner || bare(jid) === owner
}

export async function run(ctx){
  const { sock, msg, args, files, db } = ctx
  const { CONFIG_FILE } = files
  const cfg = await db.loadJSON(CONFIG_FILE, {})
  const sender = msg.key?.participant || msg.key?.remoteJid
  if (!(await isOwner(sock, cfg, sender))) return sock.sendMessage(msg.key.remoteJid,{ text:'🌸 Solo el owner puede usar este comando.'},{ quoted: msg })
  const text = args.join(' ').trim()
  if (!text) return sock.sendMessage(msg.key.remoteJid,{ text:'✨ Usa: $setbotname [nombre corto] / [nombre largo]'},{ quoted: msg })
  const [short, long] = text.split('/').map(s=>s?.trim()).filter(Boolean)
  if (short) cfg.botNameShort = short
  if (long) cfg.botNameLong = long
  await db.saveJSON(CONFIG_FILE, cfg)
  await sock.sendMessage(msg.key.remoteJid,{ text:`🎀 Nombres actualizados${short?`\nCorto: ${short}`:''}${long?`\nLargo: ${long}`:''}\nNota: algunos cambios aplican tras reinicio.`},{ quoted: msg })
}
