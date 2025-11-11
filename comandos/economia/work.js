/**
 * name: work
 * aliases: ["w"]
 * description: Gana ₭ trabajando 💪
 * category: Economía
 */

import { requireRegisteredEco, cooldownOk, nowBogotaISO, msUntil, fmtDuration, eliteAdjust, ensureTier, petAdjust } from './_common.js'

export async function run(ctx){
  const { sock, msg, files, db, util } = ctx
  const chk = await requireRegisteredEco(ctx); if(!chk.ok) return
  const { jid, users, u } = chk

  // Ajustes Elite: cooldown base 1h
  const cdAdj = eliteAdjust({ u, cooldownHours: 1 }).cooldownHours
  if(!cooldownOk(u.lastWork, cdAdj)){
    const rest = fmtDuration(msUntil(u.lastWork, cdAdj))
    const card = [
      '｡ﾟ✧ Aún en descanso ✧ﾟ｡',
      '———————————',
      `⏳ Próximo trabajo en: ${rest}`,
      '🌸 ¡Toma agüita y vuelve con energía!'
    ].join('\n')
    return sock.sendMessage(msg.key.remoteJid,{ text: card },{ quoted: msg })
  }
  let gain = Math.floor(Math.random()*301)+300 // 300-600
  // Ajustes Elite y Mascota
  gain = eliteAdjust({ u, gain }).gain
  gain = await petAdjust(ctx, { u, gain })
  u.coins = (u.coins||0) + gain
  u.lastWork = nowBogotaISO()
  users[jid] = u
  await db.saveJSON(files.USERS_FILE, users)
  await ensureTier(ctx, { jid, users, u })
  const card = [
    '｡ﾟ✧ ¡Buen trabajo! ✧ﾟ｡',
    '———————————',
    `💼 Ganancia: ${util.formatKirby(gain)}`,
    `🪙 Cartera: ${util.formatKirby(u.coins)}`,
    '✨ ¡Sigue así, Dreamer!'
  ].join('\n')
  await sock.sendMessage(msg.key.remoteJid,{ text: card },{ quoted: msg })
}
