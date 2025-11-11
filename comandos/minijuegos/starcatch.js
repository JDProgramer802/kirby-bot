/**
 * name: starcatch
 * aliases: ["atrapaestrella","estrella"]
 * description: Mini-juego: atrapa la estrella que cae en Dreamland.
 * category: Minijuegos de Kirby
 */

export async function run(ctx){
  const { sock, msg } = ctx
  const gid = msg.key.remoteJid

  const lanes = ['🌌     ⭐','  🌌   ⭐','    🌌 ⭐','      🌌⭐','        🌌']
  const outcome = Math.random() < 0.5 ? 'success' : 'fail'
  const banner = [
    '╭─⊹ ᴀᴛʀᴀᴘᴀ ʟᴀ ᴇsᴛʀᴇʟʟᴀ ⊹─╮',
    '✧ ¡Sigue la estrella y atrápala con Kirby! ✧',
    '⏝⃨֟፝︶ . ⋆˚𝜗⌗𝜚˚⋆ .︶⃨֟፝⏝',
  ]
  const frames = lanes.map(l=>`> ${l}`)
  const end = outcome === 'success'
    ? '🌟 ¡Kirby la atrapó! +1 felicidad'
    : '💫 Se escapó… ¡intenta de nuevo!'
  const text = [
    ...banner,
    ...frames,
    '',
    `> ${end}`
  ].join('\n')

  await sock.sendMessage(gid,{ text },{ quoted: msg })
}
