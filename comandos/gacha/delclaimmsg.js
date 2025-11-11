/**
 * name: delclaimmsg
 * aliases: []
 * description: Restablece el mensaje por defecto de claim
 * category: Gacha
 */

import { ensureStores, requireRegistered, saveUsers } from './_common.js'

export async function run(ctx){
  const { sock, msg, files, db } = ctx
  await ensureStores(files, db)
  const chk = await requireRegistered(ctx); if(!chk.ok) return
  const gid = msg.key.remoteJid; const jid = chk.jid
  const users = await db.loadJSON(files.USERS_FILE,{})
  users[jid].claimMsg = ''
  await saveUsers(files, db, users)
  await sock.sendMessage(gid,{ text:'🎀 Mensaje de claim restablecido al predeterminado 💖'},{quoted:msg})
}
