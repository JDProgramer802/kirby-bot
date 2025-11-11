/**
 * name: sticker
 * aliases: ["s","stickers"]
 * description: Convierte imagen/video corto a sticker
 * category: Stickers
 */

import { ensureStickerDB, getUserStickerData, ensurePackDir, saveQuotedMedia } from './_common.js'
import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'
import { Sticker, StickerTypes } from 'wa-sticker-formatter'

export async function run(ctx){
  const { sock, msg, files, db } = ctx
  const gid = msg.key.remoteJid
  const jid = msg.key?.participant || gid
  const root = await ensureStickerDB(files, db, jid)
  const usr = getUserStickerData(root, jid)

  const pack = usr.defaultPack || 'Dreamland'
  const author = usr.defaultAuthor || 'Kirby Dream'
  // Detectar tipo de medio para usar extensión correcta
  const q = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
  const any = q?.imageMessage || q?.videoMessage || q?.stickerMessage || msg.message?.imageMessage || msg.message?.videoMessage || msg.message?.stickerMessage
  if (!any) return sock.sendMessage(gid,{ text:'🌸 Responde a una imagen o video cortito para crear sticker 💕'},{ quoted: msg })
  const isImg = !!(any.imageMessage)
  const isVid = !!(any.videoMessage)
  const isWebp = !!(any.stickerMessage)
  const ext = isImg ? 'jpg' : isVid ? 'mp4' : 'webp'
  const tmpFile = path.join(files.STICKERS_DIR, `tmp-${Date.now()}.${ext}`)
  const saved = await saveQuotedMedia(sock, msg, tmpFile)
  if(!saved) return sock.sendMessage(gid,{ text:'🌸 Responde a una imagen o video cortito para crear sticker 💕'},{ quoted: msg })

  try{
    const sticker = new Sticker(tmpFile, { pack, author, type: StickerTypes.FULL })
    await sock.sendMessage(gid, await sticker.toMessage(), { quoted: msg })
  } catch(e){
    // Fallback a conversión directa con ffmpeg -> webp
    try {
      const outWebp = path.join(files.STICKERS_DIR, `tmp-${Date.now()}.webp`)
      const isVid = /\.mp4$/i.test(tmpFile)
      const args = isVid
        ? ['-y','-i', tmpFile,
           '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,fps=15',
           '-loop','0','-an','-vsync','0','-t','8','-vcodec','libwebp', outWebp]
        : ['-y','-i', tmpFile,
           '-vcodec','libwebp','-lossless','1','-qscale','75','-preset','picture', outWebp]
      await new Promise((res, rej)=>{
        const ff = spawn('ffmpeg', args)
        ff.on('error', rej)
        ff.on('close', (code)=> code===0 ? res() : rej(new Error('ffmpeg webp failed')))
      })
      const webp = fs.readFileSync(outWebp)
      await sock.sendMessage(gid, { sticker: webp }, { quoted: msg })
      try { fs.unlinkSync(outWebp) } catch {}
    } catch (err) {
      await sock.sendMessage(gid,{ text:'💔 No pude convertirlo. Asegúrate de que sea una imagen o video corto 💕'},{ quoted: msg })
    }
  }
}
