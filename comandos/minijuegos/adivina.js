/**
 * name: adivina
 * aliases: ["guess","numero"]
 * description: Mini-juego: adivina el número (1-10) en 3 intentos.
 * category: Minijuegos de Kirby
 */

export async function run(ctx){
  const { sock, msg } = ctx
  const gid = msg.key.remoteJid

  const secret = 1 + Math.floor(Math.random()*10)
  let tries = 3

  const banner = [
    '╭─⊹ ᴀᴅɪᴠɪɴᴀ ᴇʟ ɴᴜᴍᴇʀᴏ ⊹─╮',
    'Pienso un número del 1 al 10. ¡Tienes 3 intentos!' ,
    'Escribe tu respuesta en el chat.'
  ].join('\n')
  await sock.sendMessage(gid,{ text: banner },{ quoted: msg })

  const listener = async (ev)=>{
    const m = ev.messages?.[0]; if(!m) return
    if(m.key.remoteJid !== gid) return
    const body = m.message?.conversation || m.message?.extendedTextMessage?.text
    if(!body) return
    const n = parseInt(body.trim())
    if(!(n>=1 && n<=10)) return
    tries--
    if(n === secret){
      await sock.sendMessage(gid,{ text: '🎉 ¡Adivinaste! Kirby te aplaude ✨' },{ quoted: msg })
      sock.ev.off('messages.upsert', listener)
      return
    }
    if(tries<=0){
      await sock.sendMessage(gid,{ text: `❌ Fallaste. Era ${secret}.` },{ quoted: msg })
      sock.ev.off('messages.upsert', listener)
      return
    }
    const hint = n < secret ? 'más alto ⬆️' : 'más bajo ⬇️'
    await sock.sendMessage(gid,{ text: `No, intenta ${hint}. Te quedan ${tries}.` },{ quoted: msg })
  }
  sock.ev.on('messages.upsert', listener)
  setTimeout(()=> sock.ev.off('messages.upsert', listener), 45000)
}
