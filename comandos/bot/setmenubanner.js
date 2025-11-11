/**
 * name: setmenubanner
 * aliases: ["setbanner"]
 * description: Cambia el banner del menú (URL)
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
  const url = args[0]
  if (!url) return sock.sendMessage(msg.key.remoteJid,{ text:'✨ Usa: $setmenubanner [url_de_imagen]'},{ quoted: msg })
  cfg.menuBannerUrl = url
  await db.saveJSON(CONFIG_FILE, cfg)
  await sock.sendMessage(msg.key.remoteJid,{ text:'🎀 Banner actualizado.'},{ quoted: msg })
}
