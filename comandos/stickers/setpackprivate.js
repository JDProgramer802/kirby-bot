/**
 * name: setpackprivate
 * aliases: ["setpackpriv","packprivate"]
 * description: Marca pack como privado
 * category: Stickers
 */

import { ensureStickerDB, getUserStickerData, saveRoot } from './_common.js'

export async function run(ctx){
  const { sock, msg, args, files, db } = ctx
  const gid = msg.key.remoteJid
  const jid = msg.key?.participant || gid
  const pack = (args[0]||'').trim()
  if(!pack) return sock.sendMessage(gid,{ text:'✨ Usa: $setpackprivate <pack>'},{ quoted: msg })
  const root = await ensureStickerDB(files, db, jid)
  const usr = getUserStickerData(root, jid)
  if(!usr.packs[pack]) return sock.sendMessage(gid,{ text:'🌸 Ese pack no existe 💕'},{ quoted: msg })
  usr.packs[pack].private = true
  await saveRoot(files, db, root)
  await sock.sendMessage(gid,{ text:`🔒 ${pack} ahora es privado 🌸`},{ quoted: msg })
}
