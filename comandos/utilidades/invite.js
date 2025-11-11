/**
 * name: invite
 * aliases: ["invitar","joinlink"]
 * description: Muestra el enlace para invitar al bot a grupos.
 * category: Utilidades
 */

export async function run(ctx){
  const { sock, msg } = ctx
  const gid = msg.key.remoteJid
  const text = [
    '💫 ¡Invita a Kirby Dream a tu grupo, Dreamer~! 🌸',
    '👉 Canal oficial: https://whatsapp.com/channel/0029Vb73ONiF6smvTEoQPV3I'
  ].join('\n')
  await sock.sendMessage(gid,{ text },{ quoted: msg })
}
