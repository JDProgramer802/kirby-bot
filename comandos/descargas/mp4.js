/**
 * name: mp4
 * aliases: ["ytmp4","mp4doc"]
 * description: Descarga video de YouTube en MP4 con preview 🌸
 * category: Descargas
 */

import ytdlp from "youtube-dl-exec"
import yts from "yt-search"
import fs from "fs"
import os from "os"
import path from "path"

export const name = "mp4"
export const aliases = ["ytmp4", "mp4doc"]
export const description = "Descarga video de YouTube en MP4 con preview 🌸"
export const category = "Descargas"

export async function run(ctx) {
  const { sock, msg, PREFIX } = ctx
  const chat = msg.key.remoteJid

  try {
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ""
    const query = text.split(/\s+/).slice(1).join(" ").trim()

    if (!query)
      return sock.sendMessage(
        chat,
        { text: `🌸 Usa: *${PREFIX}mp4 <título o link de YouTube>*` },
        { quoted: msg }
      )

    // 🎞️ Detectar si es enlace o texto
    const ytUrlRe =
      /(?:https?:\/\/)?(?:www\.)?youtu(?:\.be|be\.com)\/(?:watch\?v=|shorts\/|live\/)?([\w-]{6,})/i

    let url = ""
    let videoInfo = null

    if (ytUrlRe.test(query)) {
      url = query.trim()
    } else {
      const res = await yts(query)
      videoInfo = res?.videos?.[0]
      if (!videoInfo)
        return sock.sendMessage(
          chat,
          { text: "🌧️ No encontré resultados, poyo... 💫" },
          { quoted: msg }
        )
      url = videoInfo.url
    }

    // 🌈 Enviar preview kawaii
    if (videoInfo) {
      const caption = `
╭───────────────💫
│ *🎬 Kirby Dream Preview 🌸*
│ 
│ 💖 *Título:* _${videoInfo.title}_
│ 👤 *Autor:* _${videoInfo.author?.name || "desconocido"}_
│ 🕒 *Duración:* _${videoInfo.timestamp}_
│ 👁️ *Vistas:* _${videoInfo.views?.toLocaleString() || "∞"}_
│ 🔗 *Link:* ${videoInfo.url}
│ 
│ 🌈 _Descargando video mágico..._
╰───────────────💫
`
      await sock.sendMessage(
        chat,
        { image: { url: videoInfo.thumbnail }, caption },
        { quoted: msg }
      )
    } else {
      await sock.sendMessage(
        chat,
        {
          text:
            "🌸 _Procesando enlace directo..._ 🎬\n💫 _Prepara tus palomitas, Dreamer~_ 🍿",
        },
        { quoted: msg }
      )
    }

    // 💫 Descargar con amor desde Dreamland
    const tmpPath = path.join(os.tmpdir(), `kirbydream-${Date.now()}.mp4`)
    const startTime = Date.now()

    await ytdlp(url, {
      output: tmpPath,
      format: "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]",
      mergeOutputFormat: "mp4",
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      quiet: true
    })

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    const caption = `💖 *¡Listo, Dreamer~!* 🌸\n> 🎞️ Video mágico descargado con amor desde Dreamland 💕\n> ⏰ Tiempo: ${elapsed}s`

    await sock.sendMessage(
      chat,
      { video: { url: tmpPath }, caption },
      { quoted: msg }
    )

    // 🧹 Limpieza
    setTimeout(() => {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath)
    }, 3000)
  } catch (e) {
    console.error("❌ Error en comando $mp4:", e)
    await sock.sendMessage(
      chat,
      {
        text: `🌧️ _Ups~ algo salió mal, poyo... intenta otro enlace 💫_\n> ${e?.message || e}`,
      },
      { quoted: msg }
    )
  }
}
