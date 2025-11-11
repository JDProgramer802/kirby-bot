/**
 * name: daily
 * aliases: []
 * description: Reclama tu recompensa diaria 🌅
 * category: Economía
 */

import { requireRegisteredEco, cooldownOk, nowBogotaISO, msUntil, fmtDuration, todayBogota, isYesterdayBogota, eliteAdjust, ensureTier, petAdjust } from './_common.js'

export async function run(ctx){
  const { sock, msg, files, db, util } = ctx
  const chk = await requireRegisteredEco(ctx); if(!chk.ok) return
  const { jid, users, u } = chk

  const cdAdj = eliteAdjust({ u, cooldownHours: 24 }).cooldownHours
  if(!cooldownOk(u.lastDaily, cdAdj)){
    const rest = fmtDuration(msUntil(u.lastDaily, cdAdj))
    const card = [
      '｡ﾟ✧ Daily en descanso ✧ﾟ｡',
      '———————————',
      `⏳ Tiempo restante: ${rest}`,
      '🌸 Vuelve pronto para otra recompensa kawaii'
    ].join('\n')
    return sock.sendMessage(msg.key.remoteJid,{ text: card },{ quoted: msg })
  }
  // Racha por día calendario (TZ Bogotá) con multiplicador x2 por día consecutivo
  const today = todayBogota()
  const lastDate = u.lastDailyDate
  let streak = Number(u.dailyStreak||0)
  if (lastDate === today) {
    // Ya reclamó hoy; por seguridad mantener cooldown, pero informamos
    const rest = fmtDuration(msUntil(u.lastDaily, 24))
    const card = [
      '｡ﾟ✧ Daily ya reclamado ✧ﾟ｡',
      '———————————',
      `⏳ Próximo en: ${rest}`,
      '💖 Mantén tu racha para más recompensas'
    ].join('\n')
    return sock.sendMessage(msg.key.remoteJid,{ text: card },{ quoted: msg })
  } else if (isYesterdayBogota(lastDate)) {
    streak += 1
  } else {
    streak = 1
  }

  const base = Math.floor(Math.random()*501)+500 // 500-1000
  const multiplier = Math.pow(2, Math.max(0, streak-1))
  let gain = base * multiplier
  gain = eliteAdjust({ u, gain }).gain
  gain = await petAdjust(ctx, { u, gain })

  u.coins = (u.coins||0) + gain
  u.lastDaily = nowBogotaISO()
  u.lastDailyDate = today
  u.dailyStreak = streak
  users[jid] = u
  await db.saveJSON(files.USERS_FILE, users)
  await ensureTier(ctx, { jid, users, u })
  const card = [
    '｡ﾟ✧ ¡Daily recibido! ✧ﾟ｡',
    '———————————',
    `🔥 Racha: x${multiplier} (día ${streak})`,
    `🎁 Ganaste: ${util.formatKirby(gain)}`,
    '✨ ¡Sigue regresando para subir la racha!'
  ].join('\n')
  await sock.sendMessage(msg.key.remoteJid,{ text: card },{ quoted: msg })
}
