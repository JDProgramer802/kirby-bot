/**
 * name: getpic
 * aliases: ["pfp","profilepic"]
 * description: Obtiene la foto de perfil del usuario o mencionado.
 * category: Utilidades
 */

export async function run(ctx){
  const { sock, msg } = ctx
  const gid = msg.key.remoteJid
  const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
  const target = mentions[0] || msg.key?.participant || gid
  try{
    const url = await sock.profilePictureUrl(target, 'image')
    if(!url) throw new Error('sin foto')
    await sock.sendMessage(gid,{ image:{ url }, caption:'🌸 Aquí está tu fotito~ 💖' },{ quoted: msg })
  }catch{
    await sock.sendMessage(gid,{ text:'💫 No encontré foto, Dreamer~' },{ quoted: msg })
  }
}
