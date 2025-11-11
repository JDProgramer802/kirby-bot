/**
 * name: leave
 * aliases: ["salir"]
 * description: El bot sale del grupo actual
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
  const gid = msg.key.remoteJid
  if (!gid.endsWith('@g.us')) return sock.sendMessage(gid,{ text:'✨ Usa este comando dentro del grupo a salir.'},{ quoted: msg })
  try{ await sock.groupLeave(gid); }catch{ await sock.sendMessage(gid,{ text:'⚠️ No pude salir del grupo.'},{ quoted: msg }) }
}
