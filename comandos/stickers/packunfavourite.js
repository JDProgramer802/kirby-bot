/**
 * name: packunfavourite
 * aliases: ["unsetpackfav","packunfav"]
 * description: Quita pack favorito
 * category: Stickers
 */

import { ensureStickerDB, getUserStickerData, saveRoot } from './_common.js'

export async function run(ctx){
  const { sock, msg, files, db } = ctx
  const gid = msg.key.remoteJid
  const jid = msg.key?.participant || gid
  const root = await ensureStickerDB(files, db, jid)
  const usr = getUserStickerData(root, jid)
  usr.favouritePack = usr.defaultPack || 'Dreamland'
  await saveRoot(files, db, root)
  await sock.sendMessage(gid,{ text:'💕 Pack favorito quitado. Usando el pack activo como favorito 🌸'},{ quoted: msg })
}
