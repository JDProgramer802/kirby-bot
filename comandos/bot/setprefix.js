/**
 * name: setprefix
 * aliases: []
 * description: Cambia el prefijo del bot (persistente por instancia)
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
  const p = (args[0]||'').trim()
  if(!p) return sock.sendMessage(msg.key.remoteJid,{ text:'✨ Usa: $setprefix <nuevo_prefijo>'},{ quoted: msg })
  cfg.prefix = p
  await db.saveJSON(CONFIG_FILE, cfg)
  await sock.sendMessage(msg.key.remoteJid,{ text:`🎀 Prefijo guardado: "${p}"\nNota: se aplicará al reiniciar esta instancia.`},{ quoted: msg })
}
