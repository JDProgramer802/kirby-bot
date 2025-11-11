/**
 * name: charvideo
 * aliases: ["waifuvideo","cvideo","wvideo"]
 * description: Muestra un video aleatorio del personaje
 * category: Gacha
 */

import { ensureStores, getChar, findVideoForChar } from './_common.js'

export async function run(ctx){
  const { sock, msg, args, files, db } = ctx
  await ensureStores(files, db)
  const gid = msg.key.remoteJid
  const name = args.join(' ').trim(); if(!name) return sock.sendMessage(gid,{text:'✨ Usa: $charvideo <nombre>'},{quoted:msg})
  const { char } = await getChar(files, db, name)
  if(!char) return sock.sendMessage(gid,{text:'🌸 No encuentro ese personaje en el catálogo 💫'},{quoted:msg})
  const vid = await findVideoForChar(char)
  if(vid) return sock.sendMessage(gid,{ video: { url: vid }, caption: `💖 ${char.name} — ${char.serie} ✨` },{ quoted: msg })
  return sock.sendMessage(gid,{ text:'🌸 No tengo video ahora mismo, intenta más tarde 💫'},{quoted:msg})
}
