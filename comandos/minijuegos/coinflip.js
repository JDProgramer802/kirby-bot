/**
 * name: coinflip
 * aliases: ["moneda","caraocruz","flip"]
 * description: Mini-juego: lanza una moneda (cara o cruz).
 * category: Minijuegos de Kirby
 */

export async function run(ctx){
  const { sock, msg, args = [] } = ctx
  const gid = msg.key.remoteJid

  const pick = (args[0]||'').toLowerCase()
  const choice = pick.startsWith('c') ? 'cara' : pick.startsWith('z') ? 'cruz' : null
  const flip = Math.random() < 0.5 ? 'cara' : 'cruz'
  const win = choice ? (choice === flip) : null

  const text = [
    '╭─⊹ ᴄᴏɪɴꜰʟɪᴘ ⊹─╮',
    `Lanzando moneda…`,
    `Resultado: ${flip === 'cara' ? '🪙 CARA' : '🪙 CRUZ'}`,
    choice ? (win ? '🎉 ¡Acertaste!' : '😿 Fallaste…') : 'Tip: usa `coinflip cara` o `coinflip cruz`'
  ].join('\n')
  await sock.sendMessage(gid,{ text },{ quoted: msg })
}
