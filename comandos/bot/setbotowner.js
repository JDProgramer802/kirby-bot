/**
 * name: setbotowner
 * aliases: []
 * description: Cambia el owner del bot
 * category: Bot
 */

const bare = (j)=> String(j||'').split(':')[0].split('@')[0]

export async function run(ctx){
  const { sock, msg, args, files, db } = ctx
  const { CONFIG_FILE } = files
  const cfg = await db.loadJSON(CONFIG_FILE, {})
  const sender = msg.key?.participant || msg.key?.remoteJid
  const currentOwner = bare(cfg.botOwner || process.env.BOT_OWNER || '')
  const inGroup = (msg.key?.remoteJid||'').endsWith('@g.us')
  // Si aún no hay owner definido, permitir que un admin de grupo lo defina (solo ejecutable en grupo)
  if (!currentOwner) {
    if (!inGroup) {
      return sock.sendMessage(msg.key.remoteJid,{ text:'✨ No hay owner configurado. Pide a un admin de un grupo que ejecute este comando dentro del grupo para establecerlo.'},{ quoted: msg })
    }
    try {
      const meta = await sock.groupMetadata(msg.key.remoteJid)
      const adminsBare = (meta.participants||[]).filter(p=>p.admin).map(p=>bare(p.id))
      if (!adminsBare.includes(bare(sender))) {
        return sock.sendMessage(msg.key.remoteJid,{ text:'🌸 Solo un admin del grupo puede definir el owner por primera vez.'},{ quoted: msg })
      }
    } catch {
      return sock.sendMessage(msg.key.remoteJid,{ text:'⚠️ No pude verificar admins del grupo. Intenta de nuevo.'},{ quoted: msg })
    }
  } else {
    // Ya hay owner: solo él puede cambiarlo
    if (bare(sender) !== currentOwner) {
      return sock.sendMessage(msg.key.remoteJid,{ text:'🌸 Solo el owner actual puede cambiar el owner.'},{ quoted: msg })
    }
  }
  const mention = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
  const target = mention || (args[0]||'')
  if (!target) return sock.sendMessage(msg.key.remoteJid,{ text:'✨ Usa: $setbotowner @usuario'},{ quoted: msg })
  cfg.botOwner = target
  await db.saveJSON(CONFIG_FILE, cfg)
  await sock.sendMessage(msg.key.remoteJid,{ text:`🎀 Owner actualizado a ${target}`},{ quoted: msg })
}
