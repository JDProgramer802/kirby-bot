/**
 * name: instagram
 * aliases: ["ig","reel"]
 * description: Descarga reels o publicaciones de Instagram 🌸
 * category: Descargas
 */

import axios from "axios"
import { load as cheerioLoad } from "cheerio"

export const name = "instagram"
export const aliases = ["ig","reel"]
export const description = "Descarga reels o publicaciones de Instagram 🌸"
export const category = "Descargas"

export async function run(ctx){
  const { sock, msg } = ctx
  const chat = msg.key.remoteJid
  try{
    const IG_COOKIES = process.env.IG_COOKIES && String(process.env.IG_COOKIES).trim()
    const withHeaders = (h={}) => IG_COOKIES ? { ...h, Cookie: IG_COOKIES } : h
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const url = text.split(/\s+/).slice(1).join(' ').trim()
    if(!url){
      return sock.sendMessage(chat,{ text: "🌸 Usa: $instagram <link de Instagram>"},{ quoted: msg })
    }
    await sock.sendMessage(chat,{ text: "🌈 Abriendo tu reel mágico... espera un poquito 💕"},{ quoted: msg })

    // Resolver redirecciones
    const resolveFinal = async (u)=>{
      try{
        const r = await axios.get(u, {
          maxRedirects: 5,
          headers: withHeaders({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36'
          }),
          validateStatus: s=> s>=200 && s<400
        })
        return r?.request?.res?.responseUrl || r?.request?.responseURL || u
      }catch{
        return u
      }
    }

    let target = await resolveFinal(url)
    // Normalizar y probar host alterno que suele exponer directo
    try{
      const u = new URL(target)
      if(/instagram\.com$/i.test(u.hostname)){
        // borrar query de tracking
        u.search = ''
        target = u.toString()
      }
    }catch{}

    // 1) Intento OG normal
    const tryOg = async (pageUrl)=>{
      const res = await axios.get(pageUrl, {
        maxRedirects: 5,
        headers: withHeaders({
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
        }),
        validateStatus: s=> s>=200 && s<400
      })
      const $ = cheerioLoad(res.data)
      const meta = (prop)=> $(`meta[property='${prop}']`).attr('content') || $(`meta[name='${prop}']`).attr('content')
      const vUrl = meta('og:video:secure_url') || meta('og:video')
      const img = meta('og:image') || meta('og:image:secure_url')
      return { vUrl, img }
    }

    let out = null
    try{
      out = await tryOg(target)
    }catch{}

    // 2) Intento con host alterno ddinstagram.com
    if(!out?.vUrl && !out?.img){
      try{
        const u = new URL(target)
        if(/instagram\.com$/i.test(u.hostname)){
          u.hostname = 'ddinstagram.com'
          out = await tryOg(u.toString())
        }
      }catch{}
    }

    if(out?.vUrl){
      await sock.sendMessage(chat, { video: { url: out.vUrl }, caption: "💖 *¡Listo, Dreamer~!*\n> 🎬 Reel descargado con amor" }, { quoted: msg })
      return
    }
    if(out?.img){
      await sock.sendMessage(chat, { image: { url: out.img }, caption: "💖 *¡Listo, Dreamer~!*\n> 🖼️ Publicación guardada con estrellitas" }, { quoted: msg })
      return
    }

    // 3) Fallback a SaveIG
    try{
      const form = new URLSearchParams({ q: url, t: 'media', lang: 'en' })
      const api = await axios.post('https://saveig.app/api/ajaxSearch', form.toString(), {
        headers: withHeaders({
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36',
          'X-Requested-With': 'XMLHttpRequest',
          'Origin': 'https://saveig.app',
          'Referer': 'https://saveig.app/es'
        }),
        timeout: 20000
      })
      const data = api?.data
      let found = []
      if (typeof data === 'object' && data?.data) {
        const $$ = cheerioLoad(String(data.data))
        $$('a').each((_,a)=>{
          const href = $$(a).attr('href')
          const label = $$(a).text().trim()
          if(href && /^https?:\/\//.test(href)) found.push({ href, label })
        })
      } else if (typeof data === 'string') {
        const $$ = cheerioLoad(data)
        $$('a').each((_,a)=>{
          const href = $$(a).attr('href')
          const label = $$(a).text().trim()
          if(href && /^https?:\/\//.test(href)) found.push({ href, label })
        })
      }
      // Preferir MP4
      const vid = found.find(x=>/\.mp4(\?|$)/i.test(x.href)) || found[0]
      if (vid?.href) {
        await sock.sendMessage(chat, { video: { url: vid.href }, caption: '💖 *¡Listo, Dreamer~!*\n> 🎬 Reel descargado (SaveIG)' }, { quoted: msg })
        return
      }
    }catch{}

    await sock.sendMessage(chat,{ text: "🌧️ No pude extraer el medio (quizá privado o restringido). ¿Puedes probar con otro enlace público? 💫"},{ quoted: msg })
  }catch(e){
    await sock.sendMessage(chat,{ text: `🌧️ Ups~ algo salió mal, poyo... 💫\n${e?.message||e}`},{ quoted: msg })
  }
}
