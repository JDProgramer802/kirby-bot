/**
 * name: kirbyrun
 * aliases: ["correr","runkirby"]
 * description: Mini-juego: ayuda a Kirby a esquivar obstáculos corriendo.
 * category: Minijuegos de Kirby
 */

export async function run(ctx){
  const { sock, msg } = ctx
  const gid = msg.key.remoteJid

  const obstacles = ['🌵','🪨','🔥','⚡','🌊']
  const track = Array.from({length:5}, (_,i)=>{
    const obs = Math.random()<0.6 ? obstacles[Math.floor(Math.random()*obstacles.length)] : ' '
    const lane = Math.floor(Math.random()*3)
    const lanes = ['  ', '  ', '  ']
    lanes[lane] = obs
    return `┃${lanes[0]}┃${lanes[1]}┃${lanes[2]}┃`
  })

  const success = Math.random() < 0.55
  const banner = [
    '╭─⊹ ᴋɪʀʙʏ ʀᴜɴ ⊹─╮',
    '✧ ¡Esquiva y llega a la meta! ✧',
    '⏝⃨֟፝︶ . ⋆˚𝜗⌗𝜚˚⋆ .︶⃨֟፝⏝',
  ]
  const end = success ? '🏁 ¡Kirby llegó a la meta! +1 suerte' : '💥 Kirby tropezó… ¡otra vez será!'
  const text = [
    ...banner,
    ...track.map(t=>`> ${t}`),
    '',
    `> ${end}`
  ].join('\n')

  await sock.sendMessage(gid,{ text },{ quoted: msg })
}
