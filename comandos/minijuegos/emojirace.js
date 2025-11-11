/**
 * name: emojirace
 * aliases: ["carrera","race"]
 * description: Mini-juego: carrera de emojis entre Kirby y Meta Knight.
 * category: Minijuegos de Kirby
 */

export async function run(ctx){
  const { sock, msg } = ctx
  const gid = msg.key.remoteJid

  const trackLen = 12
  const step = ()=> 1 + Math.floor(Math.random()*3)
  let k = 0, m = 0
  for(let i=0;i<4;i++){ k += step(); m += step() }
  k = Math.min(k, trackLen); m = Math.min(m, trackLen)

  const lane = (p, icon) => `${icon}` + '·'.repeat(Math.max(0, p)) + '🏁'
  const text = [
    '╭─⊹ ᴄᴀʀʀᴇʀᴀ ᴇᴍᴏᴊɪ ⊹─╮',
    `> ${lane(k,'🌸')}`,
    `> ${lane(m,'🗡️')}`,
    '',
    (k>m?'🎉 ¡Kirby gana!':'🗡️ Meta Knight gana…')
  ].join('\n')

  await sock.sendMessage(gid,{ text },{ quoted: msg })
}
