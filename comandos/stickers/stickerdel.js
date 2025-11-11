/**
 * name: stickerdel
 * aliases: ["delsticker"]
 * description: Elimina un sticker de un pack
 * category: Stickers
 */

import { promises as fs } from 'fs'
import path from 'path'
import { ensureStickerDB, getUserStickerData, ensurePackDir } from './_common.js'

export async function run(ctx){
  const { sock, msg, args, files, db } = ctx
  const gid = msg.key.remoteJid
  const jid = msg.key?.participant || gid
  const root = await ensureStickerDB(files, db, jid)
  const usr = getUserStickerData(root, jid)
  const pack = usr.defaultPack || 'Dreamland'
  const file = (args[0]||'').trim()
  if(!file) return sock.sendMessage(gid,{ text:'✨ Usa: $stickerdel <nombre.webp>'},{ quoted: msg })
  const list = usr.packs[pack]?.stickers || []
  const idx = list.indexOf(file)
  if(idx<0) return sock.sendMessage(gid,{ text:'🌸 Ese sticker no existe en tu pack activo 💕'},{ quoted: msg })
  list.splice(idx,1)
  await db.saveJSON(files.STICKERS_DB, root)
  try{ await fs.unlink(path.join(files.STICKERS_DIR, pack, file)) }catch{}
  await sock.sendMessage(gid,{ text:`🗑️ Sticker eliminado de ${pack} 🌸`},{ quoted: msg })
}
