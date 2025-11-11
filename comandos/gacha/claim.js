/**
 * name: claim
 * aliases: ["c","reclamar"]
 * description: Reclama el personaje mostrado recientemente
 * category: Gacha
 */

import { ensureStores, requireRegistered, nowBogotaISO, cooldownPassed, msUntil, fmtDuration, getChar, saveChars, saveUsers, findImageForChar, startProgress } from './_common.js'

export async function run(ctx){
  const { sock, msg, files, db, util } = ctx
  await ensureStores(files, db)
  const chk = await requireRegistered(ctx); if(!chk.ok) return
  const gid = msg.key.remoteJid; const jid = chk.jid

  const users = await db.loadJSON(files.USERS_FILE, {})
  const u = users[jid]
  if(!cooldownPassed(u.lastClaim, 600)){
    const rest = fmtDuration(msUntil(u.lastClaim, 600))
    return sock.sendMessage(gid,{ text:`⏳ Claim en cooldown: ${rest} restantes 🌸`},{quoted:msg})
  }

  // Soporte: responder al mensaje de roll para reclamar directamente
  const args = ctx.args
  const quotedId = (
    msg.message?.extendedTextMessage?.contextInfo?.stanzaId ||
    msg.message?.contextInfo?.stanzaId ||
    msg.message?.imageMessage?.contextInfo?.stanzaId ||
    msg.message?.videoMessage?.contextInfo?.stanzaId ||
    null
  )
  const usersAll = await db.loadJSON(files.USERS_FILE, {})
  const lastMsgId = usersAll[jid]?.lastRollMsgId
  const lastCharId = usersAll[jid]?.lastRollChar
  const lastImgId = usersAll[jid]?.lastRollImgId

  let targetKey = null
  if (quotedId && lastCharId && (quotedId === lastMsgId || quotedId === lastImgId)) {
    targetKey = lastCharId
  }

  let lookup = null
  if (targetKey) lookup = targetKey
  else lookup = (args.join(' ').trim() || msg.message?.extendedTextMessage?.text || '')
  if (!lookup && lastCharId) lookup = lastCharId

  if(!lookup) return sock.sendMessage(gid,{text:'✨ Responde al mensaje del roll o indica el nombre. Ej: $claim rem'},{quoted:msg})

  // Progreso en un solo mensaje
  const prog = await startProgress(sock, gid, msg, '💌 Validando reclamo...')
  await prog.sleep(400)
  const { chars, key, char } = await getChar(files, db, lookup)
  if(!char){ await prog.update('🌸 No encuentro ese personaje en el catálogo 💫'); return }
  if(char.owner){ await prog.update('🌸 Ya tiene dueñ@. ¡Suerte en el próximo roll! 💕'); return }

  char.owner = jid
  chars[key] = char
  users[jid].claims = Array.isArray(users[jid].claims)?users[jid].claims:[]
  if(!users[jid].claims.includes(key)) users[jid].claims.push(key)
  // recalcular haremValue
  const hv = users[jid].claims.reduce((a,id)=> a + (chars[id]?.value||0),0)
  users[jid].haremValue = hv
  users[jid].lastClaim = nowBogotaISO()
  await saveChars(files, db, chars)
  await saveUsers(files, db, users)

  const ownerName = users[jid]?.name || jid
  const lines = [
    '｡ﾟ✧ Reclamo exitoso ✧ﾟ｡',
    `💖 ¡Reclamaste a ${char.name}!`,
    `🪙 Valor: ${util.formatKirby(char.value||0)}`,
    `👑 Dueñ@: ${ownerName}`
  ]
  await prog.update(lines.join('\n'))
  return
}
