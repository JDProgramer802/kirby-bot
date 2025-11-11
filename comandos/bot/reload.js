/**
 * name: reload
 * aliases: []
 * description: Recarga la sesión del bot
 * category: Bot
 */

export async function run(ctx){
  const { sock, msg, files, db } = ctx
  const { CONFIG_FILE } = files
  const cfg = await db.loadJSON(CONFIG_FILE, {})
  const bare = (j)=> String(j||'').split(':')[0].split('@')[0]
  const owner = bare(cfg.botOwner || process.env.BOT_OWNER || '')
  const sender = msg.key?.participant || msg.key?.remoteJid
  if (owner && bare(sender) !== owner) return sock.sendMessage(msg.key.remoteJid,{ text:'🌸 Solo el owner puede usar este comando.'},{ quoted: msg })
  await sock.sendMessage(msg.key.remoteJid,{ text:'♻️ Reiniciando la sesión (el proceso se reiniciará)...'},{ quoted: msg })
  try { process.exit(0) } catch {}
}
