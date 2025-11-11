/**
 * name: uptime
 * aliases: []
 * description: Muestra el tiempo activo del bot desde que inició.
 * category: Utilidades
 */

function fmt(ms){
  const s = Math.floor(ms/1000)
  const h = Math.floor(s/3600)
  const m = Math.floor((s%3600)/60)
  const sec = s%60
  return `${h}h ${m}m ${sec}s`
}

export async function run(ctx){
  const { sock, msg } = ctx
  const gid = msg.key.remoteJid
  const up = fmt(process.uptime()*1000)
  await sock.sendMessage(gid,{ text:`💖 Uptime: ${up} — ¡Kirby Dream sigue feliz~! 🌸` },{ quoted: msg })
}
