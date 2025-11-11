/**
 * name: stickeradd
 * aliases: ["addsticker"]
 * description: Agrega un sticker al pack activo
 * category: Stickers
 */

import path from 'path'
import { promises as fs } from 'fs'
import { ensureStickerDB, getUserStickerData, ensurePackDir, saveQuotedMedia } from './_common.js'

export async function run(ctx){
  const { sock, msg, files, db } = ctx
  const gid = msg.key.remoteJid
  const jid = msg.key?.participant || gid
  const root = await ensureStickerDB(files, db, jid)
  const usr = getUserStickerData(root, jid)
  const pack = usr.defaultPack || 'Dreamland'
  const dir = await ensurePackDir(files, pack)

  const saved = await saveQuotedMedia(sock, msg, path.join(dir, `tmp-${Date.now()}`))
  if(!saved) return sock.sendMessage(gid,{ text:'🌸 Responde a un sticker o imagen para agregar 💕'},{ quoted: msg })

  let finalName = `${Date.now()}.webp`
  let finalPath = path.join(dir, finalName)
  try{
    // Si ya es sticker, solo guardar como .webp
    if (saved.type === 'sticker'){
      await fs.rename(saved.filePath, finalPath)
    } else {
      // No convertimos aquí para evitar dependencia extra; guardar como .webp si ya lo es, si no, intentamos renombrar
      await fs.rename(saved.filePath, finalPath)
    }
    usr.packs[pack].stickers ||= []
    usr.packs[pack].stickers.push(finalName)
    await db.saveJSON(files.STICKERS_DB, root)
    await sock.sendMessage(gid,{ text:`🎀 ¡Sticker agregado a ${pack}! 🌸✨`},{ quoted: msg })
  }catch(e){
    try{ await fs.unlink(saved.filePath) }catch{}
    await sock.sendMessage(gid,{ text:'💔 No pude agregar el sticker. Intenta con un sticker existente (no imagen) 💕'},{ quoted: msg })
  }
}
