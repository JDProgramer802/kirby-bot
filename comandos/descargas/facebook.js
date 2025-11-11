/**
 * name: facebook
 * aliases: ["fb"]
 * description: Descarga videos públicos de Facebook 💖
 * category: Descargas
 */

import axios from "axios"
import { load as cheerioLoad } from "cheerio"

export const name = "facebook"
export const aliases = ["fb"]
export const description = "Descarga videos públicos de Facebook 💖"
export const category = "Descargas"

export async function run(ctx) {
  const { sock, msg } = ctx
  const chat = msg.key.remoteJid

  try {
    const FB_COOKIES = process.env.FB_COOKIES && String(process.env.FB_COOKIES).trim()
    const withHeaders = (h={}) => FB_COOKIES ? { ...h, Cookie: FB_COOKIES } : h
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ""
    const url = text.split(/\s+/).slice(1).join(" ").trim()
    if (!url)
      return sock.sendMessage(chat, { text: "🌸 Usa: $facebook <link público de Facebook>" }, { quoted: msg })

    await sock.sendMessage(chat, { text: "🌈 Conectando con Dreamland... preparando tu video mágico 💕" }, { quoted: msg })

    // 💫 Resolver URLs finales (incluye /share/v/)
    const resolveFinal = async (u) => {
      try {
        const res = await axios.get(u, {
          maxRedirects: 5,
          headers: withHeaders({
            "User-Agent": "Mozilla/5.0 (Linux; Android 10; Mobile; rv:102.0) Gecko/20100101 Firefox/102.0",
          }),
          validateStatus: (s) => s >= 200 && s < 400,
        })
        const finalUrl = res?.request?.res?.responseUrl || res?.request?.responseURL || u
        return finalUrl
      } catch {
        return u
      }
    }

    // 🧩 Caso especial: enlaces tipo /reel/<id>
    const mReel = /facebook\.com\/reel\/(\d+)/i.exec(target)
    if (mReel) {
      const vid = mReel[1]
      const tryWatch = async (host) => {
        const watchUrl = `https://${host}/watch/?v=${vid}`
        const r = await axios.get(watchUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Mobile Safari/537.36",
            "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
          },
          maxRedirects: 5,
          validateStatus: (s) => s >= 200 && s < 400,
        })
        const $m = cheerioLoad(r.data)
        let red = null
        $m('a[href*="/video_redirect/"]').each((_, a) => {
          const href = $m(a).attr('href')
          if (href && href.includes('video_redirect')) { red = href; return false }
        })
        if (red) {
          if (red.startsWith('/')) red = `https://${host}` + red
          const u = new URL(red)
          const src = u.searchParams.get('src')
          const final = src ? decodeURIComponent(src) : red
          if (/^https?:\/\//.test(final)) {
            await sock.sendMessage(chat, { video: { url: final }, caption: '💖 *¡Listo, Dreamer~!* 🎬 Reel descargado' }, { quoted: msg })
            return true
          }
        }
        return false
      }
      try { if (await tryWatch('m.facebook.com')) return } catch {}
      try { if (await tryWatch('mbasic.facebook.com')) return } catch {}
    }

    let target = await resolveFinal(url)

    // 🧩 Caso especial: enlaces tipo /share/v/
    if (/facebook\.com\/share\/v\//i.test(target)) {
      try {
        const res = await axios.get(target, {
          maxRedirects: 5,
          headers: withHeaders({
            "User-Agent": "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Mobile Safari/537.36",
          }),
        })
        const $ = cheerioLoad(res.data)
        // Buscar el enlace de redirección de video
        let redir = null
        $('a[href*="/video_redirect/"]').each((_, a) => {
          const href = $(a).attr("href")
          if (href && href.includes("video_redirect")) {
            redir = href
            return false
          }
        })
        if (redir) {
          if (redir.startsWith("/")) redir = "https://mbasic.facebook.com" + redir
          const u = new URL(redir)
          const src = u.searchParams.get("src")
          const final = src ? decodeURIComponent(src) : redir
          if (/^https?:\/\//.test(final)) {
            await sock.sendMessage(chat, {
              video: { url: final },
              caption: "💖 *¡Listo, Dreamer~!* 🎬 Video descargado del enlace compartido 🌸",
            }, { quoted: msg })
            return
          }
        }
      } catch (e) {
        console.warn("⚠️ Share redirect fallback:", e.message)
      }
    }

    // 🎬 Intentar extraer OpenGraph
    const tryOG = async (pageUrl) => {
      const res = await axios.get(pageUrl, {
        headers: withHeaders({
          "User-Agent": "Mozilla/5.0 (Linux; Android 10; Mobile; rv:102.0) Gecko/20100101 Firefox/102.0",
          "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
        }),
      })
      const $ = cheerioLoad(res.data)
      const meta = (prop) =>
        $(`meta[property='${prop}']`).attr("content") || $(`meta[name='${prop}']`).attr("content")
      const vUrl = meta("og:video:secure_url") || meta("og:video") || meta("og:video:url")
      const img = meta("og:image") || meta("og:image:secure_url")
      if (vUrl) return { type: "video", url: vUrl }
      if (img) return { type: "image", url: img }
      return null
    }

    try {
      const og = await tryOG(target)
      if (og?.url) {
        const caption =
          og.type === "video"
            ? "💖 *¡Listo, Dreamer~!* 🎬 Video público descargado desde Dreamland 💫"
            : "💖 *¡Listo, Dreamer~!* 🖼️ Imagen pública de Facebook"
        await sock.sendMessage(chat, { [og.type]: { url: og.url }, caption }, { quoted: msg })
        return
      }
    } catch (e) {
      console.warn("⚠️ OG parser fallback:", e.message)
    }

    // 🌈 Fallback: Snapsave.app
    try {
      const form = new URLSearchParams({ q: url, lang: "en" })
      const api = await axios.post("https://snapsave.app/api/ajaxSearch", form.toString(), {
        headers: withHeaders({
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36",
          "X-Requested-With": "XMLHttpRequest",
        }),
      })
      const data = api?.data
      const $$ = cheerioLoad(data?.data || data)
      const found = []
      $$("a").each((_, a) => {
        const href = $$(a).attr("href")
        const label = $$(a).text().trim()
        if (href && /^https?:\/\//.test(href)) found.push({ href, label })
      })
      const hd = found.find((x) => /HD/i.test(x.label)) || found[0]
      if (hd?.href) {
        await sock.sendMessage(chat, {
          video: { url: hd.href },
          caption: "💖 *¡Listo, Dreamer~!* 🎬 Video descargado con magia (Snapsave)",
        }, { quoted: msg })
        return
      }
    } catch (e) {
      console.warn("⚠️ Snapsave fallback:", e.message)
    }

    // ❇️ Último recurso: FDown (parseo HTML)
    try {
      const form2 = new URLSearchParams({ URLz: url })
      const f = await axios.post('https://fdown.net/download.php', form2.toString(), {
        headers: withHeaders({
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36',
          'Origin': 'https://fdown.net',
          'Referer': 'https://fdown.net/'
        }),
        timeout: 20000
      })
      const $f = cheerioLoad(f.data)
      const links = []
      $f('a').each((_,a)=>{
        const href = $f(a).attr('href')
        const text = $f(a).text().trim()
        if(href && /^https?:\/\//.test(href) && (/\.mp4(\?|$)/i.test(href) || /Download/i.test(text))) links.push({ href, text })
      })
      const best = links.find(l=>/HD/i.test(l.text)) || links.find(l=>/MP4|Download/i.test(l.text)) || links[0]
      if(best?.href){
        await sock.sendMessage(chat, { video: { url: best.href }, caption: '💖 *¡Listo, Dreamer~!* 🎬 Video descargado (FDown)' }, { quoted: msg })
        return
      }
    } catch {}

    // ❌ Si nada funcionó
    await sock.sendMessage(
      chat,
      { text: "🌧️ No pude extraer el medio (¿es privado o restringido?). Prueba con un enlace público diferente 💫" },
      { quoted: msg }
    )
  } catch (e) {
    console.error("❌ Error en $facebook:", e)
    await sock.sendMessage(chat, { text: `🌧️ Ups~ algo salió mal, poyo... 💫\n${e?.message || e}` }, { quoted: msg })
  }
}
