/**
 * name: charimage
 * aliases: ["waifuimage","cimage","wimage"]
 * description: Muestra una imagen aleatoria del personaje
 * category: Gacha
 */

import { ensureStores, getChar, findImageForChar } from './_common.js'

export async function run(ctx){
  const { sock, msg, args, files, db } = ctx
  await ensureStores(files, db)
  const gid = msg.key.remoteJid
  const name = args.join(' ').trim(); if(!name) return sock.sendMessage(gid,{text:'✨ Usa: $charimage <nombre>'},{quoted:msg})
  const { char } = await getChar(files, db, name)
  if(!char) return sock.sendMessage(gid,{text:'🌸 No encuentro ese personaje en el catálogo 💫'},{quoted:msg})
  const img = await findImageForChar(char)
  if(img) return sock.sendMessage(gid,{ image: { url: img }, caption: `💖 ${char.name} — ${char.serie} ✨` },{ quoted: msg })
  return sock.sendMessage(gid,{ text:'🌸 No tengo imagen ahora mismo, intenta más tarde 💫'},{quoted:msg})
}
