/**
 * name: starspin
 * aliases: ["tragaperras","slots","ruleta"]
 * description: Mini-juego: tragamonedas cósmica de estrellas.
 * category: Minijuegos de Kirby
 */

export async function run(ctx){
  const { sock, msg } = ctx
  const gid = msg.key.remoteJid

  const reels = [
    ['⭐','🌟','✨','💫','🌈','🪐'],
    ['⭐','🌟','✨','💫','🌈','🪐'],
    ['⭐','🌟','✨','💫','🌈','🪐']
  ]
  const spin = () => reels.map(r => r[Math.floor(Math.random()*r.length)])
  const r = spin()

  const win3 = (r[0]===r[1] && r[1]===r[2])
  const win2 = (!win3) && (r[0]===r[1] || r[1]===r[2] || r[0]===r[2])
  const result = win3 ? '🎉 ¡JACKPOT de estrellas!'
               : win2 ? '✨ ¡Combinación brillante!'
               : '🌌 Las estrellas siguen su curso…'

  const text = [
    '╭─⊹ sᴛᴀʀ sᴘɪɴ ⊹─╮',
    '✧ Tragamonedas cósmica ✧',
    '⏝⃨֟፝︶ . ⋆˚𝜗⌗𝜚˚⋆ .︶⃨֟፝⏝',
    '',
    `> ┃ ${r[0]} ┃ ${r[1]} ┃ ${r[2]} ┃`,
    '',
    `> ${result}`
  ].join('\n')

  await sock.sendMessage(gid,{ text },{ quoted: msg })
}
