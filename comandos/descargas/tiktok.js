/**
 * name: tiktok
 * aliases: ["tt"]
 * description: Descarga video de TikTok sin marca de agua 💫
 * category: Descargas
 */

import axios from "axios"

export const name = "tiktok"
export const aliases = ["tt"]
export const description = "Descarga video de TikTok sin marca de agua 💫"
export const category = "Descargas"

export async function run(ctx){
  const { sock, msg } = ctx
  const chat = msg.key.remoteJid
  try{
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const url = text.split(/\s+/).slice(1).join(' ').trim()
    if(!url){
      return sock.sendMessage(chat,{ text: "🌸 Usa: $tiktok <link de TikTok>"},{ quoted: msg })
    }
    await sock.sendMessage(chat,{ text: "🌈 Descargando con amor desde Dreamland... espera un poquito 💕"},{ quoted: msg })
    const { data } = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`)
    const dl = data?.data?.play || data?.data?.hdplay
    if(!dl){
      return sock.sendMessage(chat,{ text: "🌧️ No pude obtener el video (API). Intenta otro enlace 💫"},{ quoted: msg })
    }
    await sock.sendMessage(chat,{ video: { url: dl }, caption: "💫 ¡Tu TikTok mágico ha llegado, Dreamer~! 💕"},{ quoted: msg })
  }catch(e){
    await sock.sendMessage(chat,{ text: `🌧️ Ups~ algo salió mal, poyo... 💫\n${e?.message||e}`},{ quoted: msg })
  }
}
