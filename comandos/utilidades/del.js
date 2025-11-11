/**
 * name: del
 * aliases: ["delete"]
 * description: Elimina un mensaje citado si el bot tiene permisos.
 * category: Utilidades
 */

export async function run(ctx){
  const { sock, msg } = ctx
  const gid = msg.key.remoteJid
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.stanzaId
  const participant = msg.message?.extendedTextMessage?.contextInfo?.participant
  if(!quoted){
    return sock.sendMessage(gid,{ text:'🌸 Responde al mensaje que quieres borrar~' },{ quoted: msg })
  }
  try{
    // WhatsApp solo permite borrar mensajes enviados por el propio bot
    await sock.sendMessage(gid, { delete: { id: quoted, remoteJid: gid, fromMe: true } })
  }catch{
    await sock.sendMessage(gid,{ text:'🌸 ¡Ups~! Necesito permisos o que sea mi propio mensaje para borrarlo 💕' },{ quoted: msg })
  }
}
