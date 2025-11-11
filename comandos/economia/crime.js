/**
 * name: crime
 * aliases: []
 * description: Intenta un crimen para ganar ₭ rápido 😈
 * category: Economía
 */

import { requireRegisteredEco, cooldownOk, nowBogotaISO, msUntil, fmtDuration } from './_common.js'

export async function run(ctx){
  const { sock, msg, files, db, util } = ctx
  const chk = await requireRegisteredEco(ctx); if(!chk.ok) return
  const { jid, users, u } = chk

  if(!cooldownOk(u.lastCrime, 1)){
    const rest = fmtDuration(msUntil(u.lastCrime, 1))
    return sock.sendMessage(msg.key.remoteJid,{ text:`⏳ Cooldown activo: ${rest} restantes 🌸`},{ quoted: msg })
  }
  const success = Math.random() < 0.6
  if(success){
    const gain = Math.floor(Math.random()*701)+100 // 100-800
    u.coins = (u.coins||0) + gain
    u.lastCrime = nowBogotaISO()
    users[jid] = u
    await db.saveJSON(files.USERS_FILE, users)
    return sock.sendMessage(msg.key.remoteJid,{ text:`😈 ¡Crimen exitoso! Ganaste ${util.formatKirby(gain)} 🌸`},{ quoted: msg })
  } else {
    const loss = Math.floor(Math.random()*151)+50 // 50-200
    u.coins = Math.max(0, (u.coins||0) - loss)
    u.lastCrime = nowBogotaISO()
    users[jid] = u
    await db.saveJSON(files.USERS_FILE, users)
    return sock.sendMessage(msg.key.remoteJid,{ text:`💔 El crimen salió mal y perdiste ${util.formatKirby(loss)} 💕`},{ quoted: msg })
  }
}
