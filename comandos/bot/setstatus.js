/**
 * name: setstatus
 * aliases: []
 * description: Cambia el estado del bot
 * category: Bot
 */

const isOwnerBare = (cfg, jid) => {
  const bare = (j)=> String(j||'').split(':')[0].split('@')[0]
  const owner = bare(cfg.botOwner || process.env.BOT_OWNER || '')
  return !owner || bare(jid) === owner
}

export async function run(ctx){
  const { sock, msg, args, files, db } = ctx
  const { CONFIG_FILE } = files
  const cfg = await db.loadJSON(CONFIG_FILE, {})
  const sender = msg.key?.participant || msg.key?.remoteJid
  if (!isOwnerBare(cfg, sender)) return sock.sendMessage(msg.key.remoteJid,{ text:'🌸 Solo el owner puede usar este comando.'},{ quoted: msg })
  const text = args.join(' ').trim()
  if (!text) return sock.sendMessage(msg.key.remoteJid,{ text:'✨ Usa: $setstatus [estado]'},{ quoted: msg })
  try {
    await sock.updateProfileStatus(text)
    await sock.sendMessage(msg.key.remoteJid,{ text:'🎀 Estado actualizado.'},{ quoted: msg })
  } catch {
    await sock.sendMessage(msg.key.remoteJid,{ text:'⚠️ No pude actualizar el estado en este dispositivo.'},{ quoted: msg })
  }
}
