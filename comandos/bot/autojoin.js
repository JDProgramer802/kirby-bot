/**
 * name: autojoin
 * aliases: []
 * description: Unirse automáticamente a invitaciones del owner
 * category: Bot
 */

export async function run(ctx){
  const { sock, msg, args, files, db } = ctx
  const { CONFIG_FILE } = files
  const cfg = await db.loadJSON(CONFIG_FILE, {})
  const bare = (j)=> String(j||'').split(':')[0].split('@')[0]
  const owner = bare(cfg.botOwner || process.env.BOT_OWNER || '')
  const sender = msg.key?.participant || msg.key?.remoteJid
  if (owner && bare(sender) !== owner) return sock.sendMessage(msg.key.remoteJid,{ text:'🌸 Solo el owner puede usar este comando.'},{ quoted: msg })
  const v = (args[0]||'').toLowerCase()
  if (!['enable','disable'].includes(v)) return sock.sendMessage(msg.key.remoteJid,{ text:'✨ Usa: $autojoin enable | disable'},{ quoted: msg })
  cfg.autojoin = v === 'enable'
  await db.saveJSON(CONFIG_FILE, cfg)
  await sock.sendMessage(msg.key.remoteJid,{ text:`🎀 Autojoin ${cfg.autojoin?'activado':'desactivado'}`},{ quoted: msg })
}
