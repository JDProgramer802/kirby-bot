/**
 * name: eliteheist
 * aliases: ["heist","raideo"]
 * description: Atraco Elite de alto riesgo: puedes ganar mucho o perder fuerte
 * category: Economía
 */

import { requireRegisteredEco, isElite, eliteAdjust, cooldownOk, fmtDuration, msUntil, nowBogotaISO, parseAmount, ensureTier } from './_common.js'

export async function run(ctx){
  const { sock, msg, args, files, db, util } = ctx
  const chk = await requireRegisteredEco(ctx); if(!chk.ok) return
  const { jid, users, u } = chk

  if (!isElite(u)){
    return sock.sendMessage(msg.key.remoteJid,{ text:'🔒 Requiere rango Elite. Supera ₭ 2,000,000 para desbloquear.'},{ quoted: msg })
  }

  // Apuesta requerida
  const available = (u.coins||0) + (u.bank||0)
  const suggested = Math.max(1000, Math.floor(available*0.05))
  const amount = parseAmount(args[0] || String(suggested), available)
  if(!amount) return sock.sendMessage(msg.key.remoteJid,{ text:`✨ Usa: $eliteheist <monto>\nSugerencia: ${util.formatKirby(suggested)}` },{ quoted: msg })
  if(available < amount) return sock.sendMessage(msg.key.remoteJid,{ text:`💔 No tienes suficientes ₭ (Disponible: ${util.formatKirby(available)})` },{ quoted: msg })

  // Cooldown base 3h (afectado por Elite => 4.5h)
  const cdAdj = eliteAdjust({ u, cooldownHours: 3 }).cooldownHours
  if(!cooldownOk(u.lastEliteHeist, cdAdj)){
    const rest = fmtDuration(msUntil(u.lastEliteHeist, cdAdj))
    return sock.sendMessage(msg.key.remoteJid,{ text:`⏳ Aún organizando el siguiente atraco. Vuelve en ${rest}` },{ quoted: msg })
  }

  // Probabilidad de éxito ~45%
  const success = Math.random() < 0.45
  if(success){
    // Ganancia: entre 1.2x y 2.8x del monto, ajustada por Elite (+25%)
    let mult = 1.2 + Math.random()*1.6 // 1.2–2.8
    let gain = Math.floor(amount * mult)
    gain = eliteAdjust({ u, gain }).gain
    u.coins = (u.coins||0) + gain
    u.lastEliteHeist = nowBogotaISO()
    users[jid] = u
    await db.saveJSON(files.USERS_FILE, users)
    await ensureTier(ctx, { jid, users, u })
    const card = [
      '╭─💼 ᴀᴛʀᴀᴄᴏ ᴇʟɪᴛᴇ: ɴᴀʀʀᴀᴛɪᴠᴀ ─╮',
      `🟢 Éxito total. Botín: ${util.formatKirby(gain)}`,
      `🪙 Cartera: ${util.formatKirby(u.coins)}`,
      '✨ “La planificación brilló; Dreamland te sonríe.”',
      '╰──────────────────────────🌸'
    ].join('\n')
    return sock.sendMessage(msg.key.remoteJid,{ text: card },{ quoted: msg })
  } else {
    // Pérdida: entre 0.6x y 1.3x del monto, ajustada por Elite (+25% pérdida)
    let mult = 0.6 + Math.random()*0.7 // 0.6–1.3
    let loss = Math.floor(amount * mult)
    loss = eliteAdjust({ u, loss }).loss
    // Descontar primero de cartera, luego del banco
    let fromWallet = Math.min(u.coins||0, loss)
    let remaining = loss - fromWallet
    let fromBank = remaining > 0 ? Math.min(u.bank||0, remaining) : 0
    u.coins = Math.max(0, (u.coins||0) - fromWallet)
    u.bank = Math.max(0, (u.bank||0) - fromBank)
    u.lastEliteHeist = nowBogotaISO()
    users[jid] = u
    await db.saveJSON(files.USERS_FILE, users)
    await ensureTier(ctx, { jid, users, u })
    const card = [
      '╭─💼 ᴀᴛʀᴀᴄᴏ ᴇʟɪᴛᴇ: ɴᴀʀʀᴀᴛɪᴠᴀ ─╮',
      `🔻 Falló el operativo. Pérdida: ${util.formatKirby(loss)}`,
      `🪙 Cartera: ${util.formatKirby(u.coins)}`,
      '💫 “Incluso las estrellas tropiezan; reintenta mejor preparado.”',
      '╰──────────────────────────🌸'
    ].join('\n')
    return sock.sendMessage(msg.key.remoteJid,{ text: card },{ quoted: msg })
  }
}
