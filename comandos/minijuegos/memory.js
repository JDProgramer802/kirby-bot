/**
 * name: memory
 * aliases: ["memoria","secuencia"]
 * description: Mini-juego: recuerda la secuencia de estrellitas.
 * category: Minijuegos de Kirby
 */

export async function run(ctx){
  const { sock, msg, args = [] } = ctx
  const gid = msg.key.remoteJid

  const pool = ['⭐','🌟','✨','💫','🪐','🌈']
  const len = Math.min(6, Math.max(3, parseInt(args[0]||'0')||4))
  const seq = Array.from({length:len},()=> pool[Math.floor(Math.random()*pool.length)])
  const shown = seq.join(' ')
  const hidden = seq.map(()=> '▢').join(' ')
  const tip = 'Escribe la secuencia exacta en 10s (separada por espacios).'

  await sock.sendMessage(gid,{ text:[
    '╭─⊹ ᴍᴇᴍᴏʀɪᴀ ᴄᴏsᴍɪᴄᴀ ⊹─╮',
    `> ${shown}`,
    '> (Mostrando...)',
  ].join('\n') },{ quoted: msg })

  setTimeout(async ()=>{
    await sock.sendMessage(gid,{ text:[
      '╭─⊹ ᴍᴇᴍᴏʀɪᴀ ᴄᴏsᴍɪᴄᴀ ⊹─╮',
      `> ${hidden}`,
      `> ${tip}`,
    ].join('\n') },{ quoted: msg })
  }, 1200)

  const waitId = 'mem-'+Date.now()
  const listener = async (ev)=>{
    try{
      const m = ev.messages?.[0]; if(!m) return
      const from = m.key.remoteJid
      if(from !== gid) return
      const body = m.message?.conversation || m.message?.extendedTextMessage?.text
      if(!body) return
      const parts = body.trim().split(/\s+/)
      if(parts.length !== len) return
      const ok = parts.join(' ') === shown
      await sock.sendMessage(gid,{ text: ok ? '🎉 ¡Memoria perfecta!' : `❌ Fallaste. Era: ${shown}` },{ quoted: msg })
    } finally {
      sock.ev.off('messages.upsert', listener)
    }
  }
  sock.ev.on('messages.upsert', listener)
  setTimeout(()=> sock.ev.off('messages.upsert', listener), 11000)
}
