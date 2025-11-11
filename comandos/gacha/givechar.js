/**
 * name: givechar
 * aliases: ["givewaifu","regalar"]
 * description: Regala un personaje específico a otra persona
 * category: Gacha
 */

import { ensureStores, requireRegistered, getChar, saveChars, saveUsers } from './_common.js'

export async function run(ctx){
  const { sock, msg, args, files, db } = ctx
  await ensureStores(files, db)
  const chk = await requireRegistered(ctx); if(!chk.ok) return
  const gid = msg.key.remoteJid; const from = chk.jid
  const to = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || args[0]
  const name = args.slice(1).join(' ').trim()
  if(!to || !name) return sock.sendMessage(gid,{text:'✨ Usa: $givechar @usuario <nombre>'},{quoted:msg})
  if(to===from) return sock.sendMessage(gid,{text:'🌸 No puedes regalarte a ti mism@ 💕'},{quoted:msg})

  const { chars, key, char } = await getChar(files, db, name)
  if(!char) return sock.sendMessage(gid,{text:'🌸 No encuentro ese personaje 💫'},{quoted:msg})
  if(char.owner !== from) return sock.sendMessage(gid,{text:'🌸 Solo el dueñ@ puede regalarlo 💕'},{quoted:msg})

  const users = await db.loadJSON(files.USERS_FILE,{})
  users[from] ||= { claims: [] }; users[to] ||= { claims: [] }
  users[from].claims = (users[from].claims||[]).filter(id=>id!==key)
  users[to].claims = users[to].claims||[]; if(!users[to].claims.includes(key)) users[to].claims.push(key)
  char.owner = to; chars[key] = char
  // Recalcular haremValue
  users[from].haremValue = (users[from].claims||[]).reduce((a,id)=> a + (chars[id]?.value||0),0)
  users[to].haremValue = (users[to].claims||[]).reduce((a,id)=> a + (chars[id]?.value||0),0)
  await saveChars(files, db, chars)
  await saveUsers(files, db, users)
  await sock.sendMessage(gid,{text:`💖 ${users[from].name||from} regaló ${char.name} a ${users[to].name||to} 🌸 ¡Qué detalle!`},{quoted:msg})
}
