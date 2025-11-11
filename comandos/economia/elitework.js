/**
 * name: elitework
 * aliases: ["ework","ew"]
 * description: Trabajo de alto nivel para Elite: más duro, mejores premios
 * category: Economía
 */

import { requireRegisteredEco, cooldownOk, nowBogotaISO, msUntil, fmtDuration, eliteAdjust, ensureTier, isElite, petAdjust } from './_common.js'

export async function run(ctx){
  const { sock, msg, files, db, util } = ctx
  const chk = await requireRegisteredEco(ctx); if(!chk.ok) return
  const { jid, users, u } = chk

  if (!isElite(u)){
    return sock.sendMessage(msg.key.remoteJid,{ text:'🔒 Requiere rango Elite. Supera ₭ 2,000,000 para desbloquear.'},{ quoted: msg })
  }

  // Base más exigente: cooldown 2h (afectado por Elite => 3h)
  const cdAdj = eliteAdjust({ u, cooldownHours: 2 }).cooldownHours
  if(!cooldownOk(u.lastEliteWork, cdAdj)){
    const rest = fmtDuration(msUntil(u.lastEliteWork, cdAdj))
    const card = [
      '｡ﾟ✧ Descanso de misión Elite ✧ﾟ｡',
      '———————————',
      `⏳ Próxima misión en: ${rest}`,
      '🛡️ “Los grandes logros requieren paciencia.”'
    ].join('\n')
    return sock.sendMessage(msg.key.remoteJid,{ text: card },{ quoted: msg })
  }

  // Misión con posibilidad de fallar levemente
  const fail = Math.random() < 0.2
  if(fail){
    let loss = Math.floor(Math.random()*401)+200 // 200–600
    loss = eliteAdjust({ u, loss }).loss
    // Descontar primero de cartera, luego del banco
    const fromWallet = Math.min(u.coins||0, loss)
    const remaining = loss - fromWallet
    const fromBank = remaining > 0 ? Math.min(u.bank||0, remaining) : 0
    u.coins = Math.max(0, (u.coins||0) - fromWallet)
    u.bank = Math.max(0, (u.bank||0) - fromBank)
    u.lastEliteWork = nowBogotaISO()
    users[jid] = u
    await db.saveJSON(files.USERS_FILE, users)
    await ensureTier(ctx, { jid, users, u })
    const total = (u.coins||0)+(u.bank||0)
    const card = [
      '╭─🛡️ ᴍɪsɪóɴ ᴇʟɪᴛᴇ ғᴀʟʟɪᴅᴀ ─╮',
      `🔻 Pérdida: ${util.formatKirby(loss)}`,
      `🪙 Total (cartera+banco): ${util.formatKirby(total)}`,
      '💫 “Incluso los élite tropiezan; vuelve más fuerte.”',
      '╰──────────────────────────🌸'
    ].join('\n')
    return sock.sendMessage(msg.key.remoteJid,{ text: card },{ quoted: msg })
  } else {
    // Recompensas base más altas; EliteAdjust las mejora aún más (+25%)
    let gain = Math.floor(Math.random()*801)+800 // 800–1600
    if (Math.random() < 0.12){
      gain += Math.floor(Math.random()*1200)+800
    }
    gain = eliteAdjust({ u, gain }).gain
    gain = await petAdjust(ctx, { u, gain })
    u.coins = (u.coins||0) + gain
    u.lastEliteWork = nowBogotaISO()
    users[jid] = u
    await db.saveJSON(files.USERS_FILE, users)
    await ensureTier(ctx, { jid, users, u })
    const total = (u.coins||0)+(u.bank||0)
    const card = [
      '╭─🛡️ ᴍɪsɪóɴ ᴇʟɪᴛᴇ ᴄᴏᴍᴘʟᴇᴛᴀ ─╮',
      `💼 Ganancia: ${util.formatKirby(gain)}`,
      `🪙 Total (cartera+banco): ${util.formatKirby(total)}`,
      '✨ “El brillo de Dreamland premia a sus élites.”',
      '╰──────────────────────────🌸'
    ].join('\n')
    return sock.sendMessage(msg.key.remoteJid,{ text: card },{ quoted: msg })
  }
}
