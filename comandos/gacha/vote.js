/**
 * name: vote
 * aliases: ["votar"]
 * description: Vota por un personaje para aumentar su valor
 * category: Gacha
 */

import { ensureStores, requireRegistered, getChar, saveChars } from './_common.js'

export async function run(ctx){
  const { sock, msg, args, files, db, util } = ctx
  await ensureStores(files, db)
  const chk = await requireRegistered(ctx); if(!chk.ok) return
  const gid = msg.key.remoteJid; const jid = chk.jid
  const name = args.join(' ').trim(); if(!name) return sock.sendMessage(gid,{text:'✨ Usa: $vote <nombre>'},{quoted:msg})
  const { chars, key, char } = await getChar(files, db, name)
  if(!char) return sock.sendMessage(gid,{text:'🌸 No encuentro ese personaje 💫'},{quoted:msg})
  char.voters = Array.isArray(char.voters)?char.voters:[]
  if(char.voters.includes(jid)) return sock.sendMessage(gid,{text:'🌸 Ya has votado por este personaje antes 💕'},{quoted:msg})
  char.voters.push(jid)
  char.value = Number(char.value||0) + 50
  chars[key] = char
  await saveChars(files, db, chars)
  await sock.sendMessage(gid,{text:`🌟 ¡Gracias por tu voto! ${char.name} sube su valor a ${util.formatKirby(char.value)} ✨`},{quoted:msg})
}
