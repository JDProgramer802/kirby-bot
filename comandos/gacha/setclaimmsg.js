/**
 * name: setclaimmsg
 * aliases: ["setclaim"]
 * description: Define el mensaje personalizado al reclamar
 * category: Gacha
 */

import { ensureStores, requireRegistered, saveUsers } from './_common.js'

export async function run(ctx){
  const { sock, msg, args, files, db } = ctx
  await ensureStores(files, db)
  const chk = await requireRegistered(ctx); if(!chk.ok) return
  const gid = msg.key.remoteJid; const jid = chk.jid
  const text = args.join(' ').trim()
  if(!text) return sock.sendMessage(gid,{text:'✨ Escribe una plantilla. Variables: {name} {value} {serie} {owner}'},{quoted:msg})
  const users = await db.loadJSON(files.USERS_FILE,{})
  users[jid].claimMsg = text.slice(0, 200)
  await saveUsers(files, db, users)
  await sock.sendMessage(gid,{text:'🎀 ¡Listo! Mensaje de claim actualizado 💖'},{quoted:msg})
}
