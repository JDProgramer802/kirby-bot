/**
 * name: join
 * aliases: []
 * description: Unir el bot a un grupo con enlace de invitación
 * category: Bot
 */

const extractCode = (t) => (t.match(/chat\.whatsapp\.com\/([A-Za-z0-9]+)/i)||[])[1]

export async function run(ctx){
  const { sock, msg, args, files, db } = ctx
  const { CONFIG_FILE } = files
  const cfg = await db.loadJSON(CONFIG_FILE, {})
  const bare = (j)=> String(j||'').split(':')[0].split('@')[0]
  const owner = bare(cfg.botOwner || process.env.BOT_OWNER || '')
  const sender = msg.key?.participant || msg.key?.remoteJid
  if (owner && bare(sender) !== owner) return sock.sendMessage(msg.key.remoteJid,{ text:'🌸 Solo el owner puede usar este comando.'},{ quoted: msg })
  const text = args.join(' ') || ''
  const code = extractCode(text)
  if (!code) return sock.sendMessage(msg.key.remoteJid,{ text:'✨ Usa: $join [enlace de invitación]'},{ quoted: msg })
  try{ await sock.groupAcceptInvite(code); await sock.sendMessage(msg.key.remoteJid,{ text:'🎀 ¡Unido al grupo!'},{ quoted: msg }) }catch{ await sock.sendMessage(msg.key.remoteJid,{ text:'⚠️ No pude unirme. Enlace inválido o expirado.'},{ quoted: msg }) }
}
