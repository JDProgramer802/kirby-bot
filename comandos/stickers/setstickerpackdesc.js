/**
 * name: setstickerpackdesc
 * aliases: ["setpackdesc"]
 * description: Actualiza descripción del pack
 * category: Stickers
 */

import { ensureStickerDB, getUserStickerData, saveRoot } from './_common.js'

export async function run(ctx){
  const { sock, msg, args, files, db } = ctx
  const gid = msg.key.remoteJid
  const jid = msg.key?.participant || gid
  const pack = (args[0]||'').trim()
  const desc = args.slice(1).join(' ').trim()
  if(!pack || !desc) return sock.sendMessage(gid,{ text:'✨ Usa: $setpackdesc <pack> <descripcion>'},{ quoted: msg })
  const root = await ensureStickerDB(files, db, jid)
  const usr = getUserStickerData(root, jid)
  if(!usr.packs[pack]) return sock.sendMessage(gid,{ text:'🌸 Ese pack no existe 💕'},{ quoted: msg })
  usr.packs[pack].description = desc
  await saveRoot(files, db, root)
  await sock.sendMessage(gid,{ text:`🎨 Descripción de ${pack} actualizada 🌸`},{ quoted: msg })
}
