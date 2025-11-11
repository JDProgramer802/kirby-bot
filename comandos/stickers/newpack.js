/**
 * name: newpack
 * aliases: ["newstickerpack"]
 * description: Crea un nuevo pack
 * category: Stickers
 */

import { ensureStickerDB, getUserStickerData, ensurePackDir, saveRoot } from './_common.js'

export async function run(ctx){
  const { sock, msg, args, files, db } = ctx
  const gid = msg.key.remoteJid
  const jid = msg.key?.participant || gid
  const name = (args[0]||'').trim()
  if(!name) return sock.sendMessage(gid,{ text:'✨ Usa: $newpack <nombre>'},{ quoted: msg })
  const root = await ensureStickerDB(files, db, jid)
  const usr = getUserStickerData(root, jid)
  if(usr.packs[name]) return sock.sendMessage(gid,{ text:'🌸 Ya existe un pack con ese nombre 💕'},{ quoted: msg })
  usr.packs[name] = { description: 'Nuevo pack ✨', private: false, stickers: [] }
  usr.defaultPack = name
  await ensurePackDir(files, name)
  await saveRoot(files, db, root)
  await sock.sendMessage(gid,{ text:`🎨 Pack creado y activado: ${name} 💫`},{ quoted: msg })
}
