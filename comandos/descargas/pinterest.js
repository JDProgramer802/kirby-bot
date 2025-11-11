/**
 * name: pinterest
 * aliases: ["pin","pdl"]
 * description: Descarga imagen o video de Pinterest con magia kawaii 🌸
 * category: Descargas
 */

import axios from "axios"
import { load as cheerioLoad } from "cheerio"

export const name = "pinterest"
export const aliases = ["pin", "pdl"]
export const description = "Descarga imagen o video de Pinterest con magia kawaii 🌸"
export const category = "Descargas"

function extractFromHtml(html){
  const $ = cheerioLoad(html)
  const meta = (prop)=> $(`meta[property='${prop}']`).attr('content') || $(`meta[name='${prop}']`).attr('content')
  const candidates = []
  const vSecure = meta('og:video:secure_url')
  const v = meta('og:video')
  const vUrl = vSecure || v
  if(vUrl) candidates.push({ type:'video', url: vUrl })
  const img = meta('og:image') || meta('og:image:secure_url')
  if(img) candidates.push({ type:'image', url: img })

  // Intento adicional: buscar JSON con contentUrl o images.orig.url
  const scripts = $('script[type="application/ld+json"], script').toArray()
  for(const s of scripts){
    const txt = $(s).html() || ''
    try{
      if(/\{/.test(txt)){
        const jsonMatch = txt.match(/\{[\s\S]*\}/)
        if(jsonMatch){
          const data = JSON.parse(jsonMatch[0])
          const tryPush = (u,t)=>{ if(u && /^https?:\/\//.test(u)) candidates.push({ type:t, url:u }) }
          tryPush(data.contentUrl, 'video')
          tryPush(data.thumbnailUrl, 'image')
          // Pinterest a veces anida
          const imgs = data?.images || data?.image
          if(imgs){
            if(typeof imgs === 'string') tryPush(imgs, 'image')
            if(imgs.orig?.url) tryPush(imgs.orig.url, 'image')
            if(Array.isArray(imgs)) for(const it of imgs){
              if(typeof it === 'string') tryPush(it, 'image')
              if(it?.url) tryPush(it.url, 'image')
            }
          }
        }
      }
    }catch{}
  }

  // Deduplicar preservando orden
  const seen = new Set()
  return candidates.filter(c=>{ if(seen.has(c.url)) return false; seen.add(c.url); return true })
}

function isPinterestUrl(text){
  return /https?:\/\/[^\s]+/i.test(text) && /(pinterest\.(?:com|\w+)|pin\.it)/i.test(text)
}

async function searchPinterestPin(query){
  // Usamos DuckDuckGo HTML; también soportamos sus enlaces de redirección /l/?uddg=
  const queries = [
    `site:pinterest.com/pin ${query}`,
    `site:pin.it ${query}`,
    query
  ]
  const pick = (html)=>{
    const $ = cheerioLoad(html)
    const hrefs = new Set()
    $('a.result__a, a.result__url, a[href^="/l/?"]').each((_,a)=>{
      let href = $(a).attr('href') || ''
      if(!href) return
      // Desenredar redirect de DDG
      if(href.startsWith('/l/?')){
        try{
          const u = new URL('https://duckduckgo.com'+href)
          const enc = u.searchParams.get('uddg')
          if(enc) href = decodeURIComponent(enc)
        }catch{}
      }
      if(/^https?:\/\//i.test(href)) hrefs.add(href)
    })
    // Elegir primer pin válido
    for(const h of hrefs){
      if(/pinterest\.[^/]+\/pin\//i.test(h) || /https?:\/\/pin\.it\//i.test(h)) return h
    }
    return null
  }
  for(const q of queries){
    // 1) DuckDuckGo HTML
    try{
      const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(q)}`
      const res = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36'
        },
        timeout: 15000
      })
      const candidate = pick(res.data)
      if(candidate) return candidate
    }catch{}
    // 2) DuckDuckGo Lite
    try{
      const url2 = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`
      const res2 = await axios.get(url2, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36'
        },
        timeout: 15000
      })
      const candidate2 = pick(res2.data)
      if(candidate2) return candidate2
    }catch{}
    // 3) Bing como fallback
    try{
      const url3 = `https://www.bing.com/search?q=${encodeURIComponent(q)}`
      const res3 = await axios.get(url3, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36'
        },
        timeout: 15000
      })
      const $b = cheerioLoad(res3.data)
      const hrefs = []
      $b('li.b_algo h2 a, a[href^="https://www.pinterest."]').each((_,a)=>{
        const h = $b(a).attr('href')
        if(h) hrefs.push(h)
      })
      const cand = hrefs.find(h => /pinterest\.[^/]+\/pin\//i.test(h) || /https?:\/\/pin\.it\//i.test(h))
      if(cand) return cand
    }catch{}
  }
  return null
}

async function resolveFinalUrl(u){
  try{
    const res = await axios.get(u, {
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36'
      },
      validateStatus: s=> s>=200 && s<400
    })
    const final = res?.request?.res?.responseUrl || res?.request?.responseURL || u
    return final
  }catch{
    return u
  }
}

export async function run(ctx){
  const { sock, msg, PREFIX } = ctx
  const chat = msg.key.remoteJid
  try{
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const query = text.split(/\s+/).slice(1).join(' ').trim()

    if(!query){
      return sock.sendMessage(chat,{ text: `🌸 Usa: *${PREFIX}pinterest <link o texto>*\nEjemplos:\n• ${PREFIX}pin https://www.pinterest.com/pin/xxxxxxxxx/\n• ${PREFIX}pin vestido rosa anime` },{ quoted: msg })
    }

    let pinUrl = null
    if(isPinterestUrl(query)){
      pinUrl = query.trim()
    } else {
      await sock.sendMessage(chat,{ text: "🔎 Buscando el pin perfecto en Pinterest... ✨"},{ quoted: msg })
      pinUrl = await searchPinterestPin(query)
      if(!pinUrl){
        return sock.sendMessage(chat,{ text: "🌧️ No encontré resultados para ese texto, poyo... intenta con otras palabras 💫"},{ quoted: msg })
      }
    }

    await sock.sendMessage(chat,{ text: "🌈 Abriendo el pin y preparando la descarga mágica... 💕"},{ quoted: msg })

    // Descargar HTML con cabeceras para evitar bloqueos
    const res = await axios.get(pinUrl, {
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
      },
      validateStatus: s=> s>=200 && s<400
    })

    const candidates = extractFromHtml(res.data)
    if(!candidates.length){
      return sock.sendMessage(chat,{ text: "🌧️ No pude extraer el medio, poyo... prueba con otro link o público 💫"},{ quoted: msg })
    }

    const video = candidates.find(c=>c.type==='video')
    const image = candidates.find(c=>c.type==='image')

    if(video){
      const caption = `💖 *¡Listo, Dreamer~!*\n> 🎬 Video mágico desde Pinterest`
      await sock.sendMessage(chat, { video: { url: video.url }, caption }, { quoted: msg })
      return
    }

    if(image){
      const caption = `💖 *¡Listo, Dreamer~!*\n> 🖼️ Imagen kawaii desde Pinterest`
      await sock.sendMessage(chat, { image: { url: image.url }, caption }, { quoted: msg })
      return
    }

    await sock.sendMessage(chat,{ text: "🌧️ No encontré un medio descargable, poyo... 💫"},{ quoted: msg })
  }catch(e){
    await sock.sendMessage(chat,{ text: `🌧️ Ocurrió un error, poyo...\n> ${e?.message||e}`},{ quoted: msg })
  }
}
