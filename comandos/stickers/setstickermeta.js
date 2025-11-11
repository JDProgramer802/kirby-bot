/**
 * name: setstickermeta
 * aliases: ["setmeta"]
 * description: Define autor y pack predeterminado
 * category: Stickers
 */

import { ensureStickerDB, getUserStickerData, saveRoot, ensurePackDir } from './_common.js'

export async function run(ctx){
  const { sock, msg, args, files, db } = ctx
  const gid = msg.key.remoteJid
  const jid = msg.key?.participant || gid
  if(args.length < 2) return sock.sendMessage(gid,{ text:'✨ Usa: $setmeta <author|pack> <valor>'},{ quoted: msg })
  const field = (args[0]||'').toLowerCase()
  const value = args.slice(1).join(' ').trim()
  const root = await ensureStickerDB(files, db, jid)
  const usr = getUserStickerData(root, jid)
  if(field === 'author'){
    usr.defaultAuthor = value || 'Kirby Dream'
  } else if(field === 'pack'){
    usr.packs[value] ||= { description:'Stickers mágicos ✨', private:false, stickers:[] }
    usr.defaultPack = value
    await ensurePackDir(files, value)
  } else {
    return sock.sendMessage(gid,{ text:'🌸 Campo inválido. Usa author o pack 💕'},{ quoted: msg })
  }
  await saveRoot(files, db, root)
  await sock.sendMessage(gid,{ text:'🎀 Metadatos actualizados 🌸'},{ quoted: msg })
}
