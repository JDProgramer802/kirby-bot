/**
 * name: setpfp
 * aliases: ["setimage"]
 * description: Cambia la imagen de perfil del bot (responder a imagen)
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
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || {}
  const imgMsg = quoted.imageMessage || msg.message?.imageMessage
  if (!imgMsg) return sock.sendMessage(msg.key.remoteJid,{ text:'✨ Responde a una imagen.'},{ quoted: msg })
  const { downloadContentFromMessage } = await import('@whiskeysockets/baileys')
  const stream = await downloadContentFromMessage(imgMsg, 'image')
  let buffer = Buffer.from([])
  for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
  try {
    await sock.updateProfilePicture(sock.user.id, buffer)
    await sock.sendMessage(msg.key.remoteJid,{ text:'🎀 Imagen de perfil actualizada.'},{ quoted: msg })
  } catch {
    await sock.sendMessage(msg.key.remoteJid,{ text:'⚠️ No se pudo actualizar la imagen.'},{ quoted: msg })
  }
}
