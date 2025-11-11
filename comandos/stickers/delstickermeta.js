/**
 * name: delstickermeta
 * aliases: ["delmeta"]
 * description: Restablece metadatos por defecto
 * category: Stickers
 */

import { ensureStickerDB, getUserStickerData, saveRoot } from './_common.js'

export async function run(ctx){
  const { sock, msg, files, db } = ctx
  const gid = msg.key.remoteJid
  const jid = msg.key?.participant || gid
  const root = await ensureStickerDB(files, db, jid)
  const usr = getUserStickerData(root, jid)
  usr.defaultAuthor = 'Kirby Dream'
  usr.defaultPack = 'Dreamland'
  await saveRoot(files, db, root)
  await sock.sendMessage(gid,{ text:'🎀 Metadatos restablecidos a valores de Dreamland 🌸'},{ quoted: msg })
}
