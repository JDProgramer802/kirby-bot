/**
 * name: play
 * aliases: ["yt","ytaudio","playaudio"]
 * description: Descarga audio de YouTube con previsualización kawaii 🌸
 * category: Descargas
 */

import ytdlp from "youtube-dl-exec"
import ffmpeg from "fluent-ffmpeg"
import ffmpegPath from "ffmpeg-static"
import yts from "yt-search"
import fs from "fs"
import os from "os"
import path from "path"

ffmpeg.setFfmpegPath(ffmpegPath)

export const name = "play"
export const aliases = ["yt", "ytaudio", "playaudio"]
export const description = "Descarga audio de YouTube con previsualización kawaii 🌸"
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
        { text: `🌸 Usa: *${PREFIX}play <título o link de YouTube>*` },
        { quoted: msg }
      )

    // 🎵 Detección de enlace o búsqueda
    const ytUrlRe =
      /(?:https?:\/\/)?(?:www\.)?youtu(?:\.be|be\.com)\/(?:watch\?v=|shorts\/|live\/)?([\w-]{6,})/i

    let url = ""
    let song = null

    if (ytUrlRe.test(query)) {
      url = query.trim()
    } else {
      const res = await yts(query)
      song = res?.videos?.[0]
      if (!song)
        return sock.sendMessage(
          chat,
          { text: "🌧️ Ups~ no encontré resultados, poyo... 💫" },
          { quoted: msg }
        )
      url = song.url
    }

    // 💫 Enviar preview kawaii
    if (song) {
      const caption = `
╭───────────────🎧
│ *🎶 Kirby Dream Preview 💫*
│ 
│ 💖 *Título:* _${song.title}_
│ 👤 *Autor:* _${song.author?.name || "Desconocido"}_
│ 🕒 *Duración:* _${song.timestamp}_
│ 📅 *Publicado:* _${song.ago}_
│ 👁️ *Vistas:* _${song.views?.toLocaleString() || "∞"}_
│ 🔗 *Link:* ${song.url}
│ 
│ 🌈 _Descargando audio mágico..._
╰───────────────🌸
`
      await sock.sendMessage(
        chat,
        { image: { url: song.thumbnail }, caption },
        { quoted: msg }
      )
    } else {
      await sock.sendMessage(
        chat,
        { text: "🌸 _Procesando enlace directo... espera un momento, Dreamer~_ 💕" },
        { quoted: msg }
      )
    }

    const tmpPath = path.join(os.tmpdir(), `kirbydream-${Date.now()}.mp3`)
    const tmpOpus = path.join(os.tmpdir(), `kirbydream-${Date.now()}.ogg`)
    const start = Date.now()

    await ytdlp(url, {
      extractAudio: true,
      audioFormat: "mp3",
      output: tmpPath,
      noWarnings: true,
      noCheckCertificates: true,
      preferFreeFormats: true,
      quiet: true
    })

    // ⏱️ Calcular tiempo de descarga
    const elapsed = ((Date.now() - start) / 1000).toFixed(1)
    const caption = `💖 *¡Listo, Dreamer~!* 🌸\n> 🎧 Audio convertido mágicamente 💕\n> ⏰ Tiempo: ${elapsed}s`

    // Convertir a OGG/Opus (requerido para que WhatsApp lo trate como nota de voz)
    await new Promise((resolve, reject) => {
      ffmpeg(tmpPath)
        .audioCodec('libopus')
        .format('ogg')
        .audioChannels(1)
        .audioBitrate('48k')
        .on('error', reject)
        .on('end', resolve)
        .save(tmpOpus)
    })

    await sock.sendMessage(
      chat,
      { audio: { url: tmpOpus }, mimetype: 'audio/ogg; codecs=opus', ptt: true },
      { quoted: msg }
    )
    // Enviar texto aparte (algunas apps ocultan caption en PTT)
    await sock.sendMessage(chat, { text: caption }, { quoted: msg })

    setTimeout(() => {
      try{ if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath) }catch{}
      try{ if (fs.existsSync(tmpOpus)) fs.unlinkSync(tmpOpus) }catch{}
    }, 3000)
  } catch (e) {
    console.error("❌ Error en comando $play:", e)
    await sock.sendMessage(
      chat,
      {
        text: `🌧️ _Ups~ algo salió mal, poyo... intenta otro enlace 💫_\n> ${e?.message || e}`,
      },
      { quoted: msg }
    )
  }
}
