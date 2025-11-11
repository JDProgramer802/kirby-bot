/**
 * name: twitter
 * aliases: ["x"]
 * description: Descarga videos de Twitter/X 🐦
 * category: Descargas
 */

import axios from "axios"

export const name = "twitter"
export const aliases = ["x"]
export const description = "Descarga videos de Twitter/X 🐦"
export const category = "Descargas"

export async function run(ctx){
  const { sock, msg } = ctx
  const chat = msg.key.remoteJid
  try{
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const url = text.split(/\s+/).slice(1).join(' ').trim()
    if(!url){
      return sock.sendMessage(chat,{ text: "🌸 Usa: $twitter <link de Twitter/X>"},{ quoted: msg })
    }
    await sock.sendMessage(chat,{ text: "🌈 Descargando con amor desde Dreamland... espera un poquito 💕"},{ quoted: msg })
    const { data } = await axios.get(`https://api.vxtwitter.com/inspect?url=${encodeURIComponent(url)}`)
    const media = data?.media?.[0]?.url || data?.tweet?.mediaURLs?.[0]
    if(!media){
      return sock.sendMessage(chat,{ text: "🌧️ No pude obtener el video del tweet 💫"},{ quoted: msg })
    }
    await sock.sendMessage(chat,{ video: { url: media }, caption: "🐦 ¡Tweet mágico descargado desde Dreamland! 🌸"},{ quoted: msg })
  }catch(e){
    await sock.sendMessage(chat,{ text: `🌧️ Ups~ algo salió mal, poyo... 💫\n${e?.message||e}`},{ quoted: msg })
  }
}
