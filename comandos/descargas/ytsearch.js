/**
 * name: ytsearch
 * aliases: ["search"]
 * description: Busca videos kawaii y muestra top 5 💫
 * category: Descargas
 */

import yts from "yt-search"

export const name = "ytsearch"
export const aliases = ["search"]
export const description = "Busca videos kawaii y muestra top 5 💫"
export const category = "Descargas"

export async function run(ctx){
  const { sock, msg } = ctx
  const chat = msg.key.remoteJid
  try{
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const query = text.split(/\s+/).slice(1).join(' ').trim()
    if(!query){
      return sock.sendMessage(chat,{ text: "🌸 Usa: $ytsearch <término>"},{ quoted: msg })
    }
    const res = await yts(query)
    const vids = (res?.videos||[]).slice(0,5)
    if(!vids.length){
      return sock.sendMessage(chat,{ text: "🌧️ No encontré resultados, poyo... 💫"},{ quoted: msg })
    }
    let i=1
    const lines = [ `💫 Resultados para: ${query}` ]
    for(const v of vids){
      lines.push(`${i}️⃣ ${v.title} — ${v.timestamp}`)
      i++
    }
    lines.push("\n🌸 Usa $play <número> para reproducir 💕 (en desarrollo)")
    await sock.sendMessage(chat,{ text: lines.join('\n') },{ quoted: msg })
  }catch(e){
    await sock.sendMessage(chat,{ text: `🌧️ Ups~ algo salió mal, poyo... 💫\n${e?.message||e}`},{ quoted: msg })
  }
}
