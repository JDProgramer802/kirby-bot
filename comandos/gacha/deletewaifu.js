/**
 * name: deletewaifu
 * aliases: ["delwaifu","delchar"]
 * description: Elimina un personaje reclamado de tu harem
 * category: Gacha
 */

import { ensureStores, requireRegistered, getChar, saveChars, saveUsers } from './_common.js'

export async function run(ctx){
  const { sock, msg, args, files, db } = ctx
  await ensureStores(files, db)
  const chk = await requireRegistered(ctx); if(!chk.ok) return
  const gid = msg.key.remoteJid; const jid = chk.jid
  const ref = args.join(' ').trim(); if(!ref) return sock.sendMessage(gid,{text:'✨ Usa: $deletewaifu <nombre>'},{quoted:msg})
  const { chars, key, char } = await getChar(files, db, ref)
  if(!char) return sock.sendMessage(gid,{text:'🌸 No encuentro ese personaje 💫'},{quoted:msg})
  if(char.owner !== jid) return sock.sendMessage(gid,{text:'🌸 Solo el dueñ@ puede eliminarlo de su harem 💕'},{quoted:msg})
  char.owner = ''
  chars[key] = char
  const users = await db.loadJSON(files.USERS_FILE,{})
  users[jid].claims = (users[jid].claims||[]).filter(id=>id!==key)
  // Recalcular haremValue
  users[jid].haremValue = (users[jid].claims||[]).reduce((a,id)=> a + (chars[id]?.value||0),0)
  await saveChars(files, db, chars)
  await saveUsers(files, db, users)
  await sock.sendMessage(gid,{text:`🗑️ ${char.name} fue removid@ de tu harem. ¡Ánimo, nuevas estrellas te esperan! 🌸`},{quoted:msg})
}
