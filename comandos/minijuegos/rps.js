/**
 * name: rps
 * aliases: ["ppt","piedrapapeltijera"]
 * description: Mini-juego: Piedra, Papel o Tijera contra Kirby.
 * category: Minijuegos de Kirby
 */

export async function run(ctx){
  const { sock, msg, args = [] } = ctx
  const gid = msg.key.remoteJid

  const opts = [
    { k: 'piedra', icon: '🪨' },
    { k: 'papel', icon: '📄' },
    { k: 'tijera', icon: '✂️' }
  ]
  const userIn = (args[0]||'').toLowerCase()
  const user = opts.find(o => o.k.startsWith(userIn))
  if(!user){
    const help = [
      '╭─⊹ ᴘɪᴇᴅʀᴀ ᴘᴀᴘᴇʟ ᴛɪᴊᴇʀᴀ ⊹─╮',
      'Usa: rps <piedra|papel|tijera>',
      'Ej: rps piedra'
    ].join('\n')
    await sock.sendMessage(gid,{ text: help },{ quoted: msg })
    return
  }
  const kirby = opts[Math.floor(Math.random()*opts.length)]

  const win = (
    (user.k==='piedra' && kirby.k==='tijera') ||
    (user.k==='papel' && kirby.k==='piedra') ||
    (user.k==='tijera' && kirby.k==='papel')
  )
  const status = win ? '🎉 ¡Ganaste!' : (user.k===kirby.k ? '🤝 Empate' : '😿 Perdiste…')

  const text = [
    '╭─⊹ ᴋɪʀʙʏ ᴠs ᴛᴜ́ ⊹─╮',
    `Tú: ${user.icon} ${user.k}  |  Kirby: ${kirby.icon} ${kirby.k}`,
    status
  ].join('\n')
  await sock.sendMessage(gid,{ text },{ quoted: msg })
}
