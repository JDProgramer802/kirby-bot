/**
 * name: giveallharem
 * aliases: []
 * description: Regala TODOS tus personajes a otro usuario
 * category: Gacha
 */

import { ensureStores, requireRegistered, saveChars, saveUsers } from './_common.js'

export async function run(ctx){
  const { sock, msg, args, files, db } = ctx
  await ensureStores(files, db)
  const chk = await requireRegistered(ctx); if(!chk.ok) return
  const gid = msg.key.remoteJid; const from = chk.jid
  const to = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || args[0]
  if(!to) return sock.sendMessage(gid,{text:'✨ Menciona a la persona a quien regalar tu harem. Ej: $giveallharem @amix'},{quoted:msg})
  if(to===from) return sock.sendMessage(gid,{text:'🌸 No puedes regalarte a ti mism@ 💕'},{quoted:msg})

  const users = await db.loadJSON(files.USERS_FILE,{})
  const chars = await db.loadJSON(files.CHARACTERS_FILE,{})
  users[from] ||= { claims: [] }
  users[to] ||= { claims: [] }
  const mine = Array.isArray(users[from].claims)?users[from].claims:[]
  if(!mine.length) return sock.sendMessage(gid,{text:'🌸 No tienes personajes para regalar 💫'},{quoted:msg})

  for(const id of mine){
    const ch = chars[id]
    if(!ch) continue
    ch.owner = to
    chars[id] = ch
    users[to].claims = users[to].claims||[]
    if(!users[to].claims.includes(id)) users[to].claims.push(id)
  }
  users[from].claims = []
  // Recalcular haremValue
  users[from].haremValue = 0
  users[to].haremValue = (users[to].claims||[]).reduce((a,id)=> a + (chars[id]?.value||0),0)

  await saveChars(files, db, chars)
  await saveUsers(files, db, users)
  await sock.sendMessage(gid,{text:`💖 ¡Transferencia completada! Regalaste ${mine.length} personajes 🌸`},{quoted:msg})
}
