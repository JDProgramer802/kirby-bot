/**
 * name: stickerpacks
 * aliases: ["packlist"]
 * description: Lista todos los packs del usuario
 * category: Stickers
 */

import { ensureStickerDB, getUserStickerData } from './_common.js'

export async function run(ctx){
  const { sock, msg, files, db } = ctx
  const gid = msg.key.remoteJid
  const jid = msg.key?.participant || gid
  const root = await ensureStickerDB(files, db, jid)
  const usr = getUserStickerData(root, jid)
  const names = Object.keys(usr.packs||{})
  if(!names.length) return sock.sendMessage(gid,{ text:'🌸 Aún no tienes packs. Usa $newpack para crear uno 💕'},{ quoted: msg })
  const lines = [
    '🌟 Tus packs de stickers:',
    `Predeterminado: ${usr.defaultPack} | Favorito: ${usr.favouritePack||usr.defaultPack}`
  ]
  for(const n of names){
    const p = usr.packs[n]
    lines.push(`• ${n} — ${p.stickers?.length||0} stickers ${p.private?'(privado)':'(público)'}`)
  }
  await sock.sendMessage(gid,{ text: lines.join('\n') },{ quoted: msg })
}
