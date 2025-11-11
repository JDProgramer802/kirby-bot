/**
 * name: logout
 * aliases: []
 * description: Cierra sesión del bot (requiere re-vincular)
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
  try { await sock.logout?.(); await sock.sendMessage(msg.key.remoteJid,{ text:'🔒 Sesión cerrada. Debes re-vincular.'},{ quoted: msg }) } catch { await sock.sendMessage(msg.key.remoteJid,{ text:'⚠️ No se pudo cerrar sesión en este dispositivo.'},{ quoted: msg }) }
}
