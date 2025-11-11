/**
 * name: delpack
 * aliases: []
 * description: Elimina un pack completo
 * category: Stickers
 */

import { promises as fs } from 'fs'
import path from 'path'
import { ensureStickerDB, getUserStickerData, saveRoot } from './_common.js'

export async function run(ctx){
  const { sock, msg, args, files, db } = ctx
  const gid = msg.key.remoteJid
  const jid = msg.key?.participant || gid
  const pack = (args[0]||'').trim()
  if(!pack) return sock.sendMessage(gid,{ text:'✨ Usa: $delpack <nombre>'},{ quoted: msg })

  const root = await ensureStickerDB(files, db, jid)
  const usr = getUserStickerData(root, jid)
  if(!usr.packs[pack]) return sock.sendMessage(gid,{ text:'🌸 Ese pack no existe 💕'},{ quoted: msg })
  delete usr.packs[pack]
  if(usr.defaultPack === pack) usr.defaultPack = 'Dreamland'
  if(usr.favouritePack === pack) usr.favouritePack = 'Dreamland'
  await saveRoot(files, db, root)
  try{ await fs.rm(path.join(files.STICKERS_DIR, pack), { recursive:true, force:true }) }catch{}
  await sock.sendMessage(gid,{ text:`🗑️ Pack ${pack} eliminado 🌸`},{ quoted: msg })
}
