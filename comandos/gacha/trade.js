/**
 * name: trade
 * aliases: ["intercambiar"]
 * description: Intercambia un personaje con otro usuario
 * category: Gacha
 */

import { ensureStores, requireRegistered, getChar, saveChars, saveUsers } from './_common.js'

export async function run(ctx){
  const { sock, msg, args, files, db } = ctx
  await ensureStores(files, db)
  const chk = await requireRegistered(ctx); if(!chk.ok) return
  const gid = msg.key.remoteJid; const from = chk.jid
  const to = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || ''
  const raw = args.join(' ')
  const parts = raw.split('/').map(s=>s.trim())
  if(!to || parts.length<2) return sock.sendMessage(gid,{text:'✨ Usa: $trade @usuario <tuPersonaje> / <suPersonaje>'},{quoted:msg})
  const myName = parts[0]
  const theirName = parts[1]

  const users = await db.loadJSON(files.USERS_FILE,{})
  users[from] ||= { claims: [] }
  users[to] ||= { claims: [] }

  const A = await getChar(files, db, myName)
  const B = await getChar(files, db, theirName)
  if(!A.char || !B.char) return sock.sendMessage(gid,{text:'🌸 No encuentro alguno de los personajes 💫'},{quoted:msg})
  if(A.char.owner !== from) return sock.sendMessage(gid,{text:'🌸 Debes ser dueñ@ de tu personaje para ofrecer intercambio 💕'},{quoted:msg})
  if(B.char.owner !== to) return sock.sendMessage(gid,{text:'🌸 La otra personita no es dueña del personaje ofrecido 💫'},{quoted:msg})

  // Intercambio
  A.char.owner = to
  B.char.owner = from
  const chars = await db.loadJSON(files.CHARACTERS_FILE,{})
  chars[A.key] = A.char
  chars[B.key] = B.char

  users[from].claims = (users[from].claims||[]).filter(id=>id!==A.key)
  if(!users[from].claims.includes(B.key)) users[from].claims.push(B.key)
  users[to].claims = (users[to].claims||[]).filter(id=>id!==B.key)
  if(!users[to].claims.includes(A.key)) users[to].claims.push(A.key)

  // Recalcular haremValue
  users[from].haremValue = (users[from].claims||[]).reduce((a,id)=> a + (chars[id]?.value||0),0)
  users[to].haremValue = (users[to].claims||[]).reduce((a,id)=> a + (chars[id]?.value||0),0)

  await saveChars(files, db, chars)
  await saveUsers(files, db, users)

  await sock.sendMessage(gid,{text:`🤝 Intercambio completado: ${A.char.name} ⇄ ${B.char.name} ✨`},{quoted:msg})
}
