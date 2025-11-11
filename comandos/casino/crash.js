/**
 * name: crash
 * aliases: ["cohete"]
 * description: Crash de Dreamland: sube el multiplicador y retírate antes de que explote 🚀
 * category: Casino
 */

import { requireRegisteredEco, parseAmount, eliteAdjust, ensureTier, cooldownOk, msUntil, fmtDuration, nowBogotaISO } from '../economia/_common.js'

function genCrashPoint(){
  // Genera un punto de crash aleatorio (media ~2.0)
  const r = Math.random()
  return Math.max(1.01, parseFloat((1/(1-r)).toFixed(2)))
}

export async function run(ctx){
  const { sock, msg, args, files, db, util } = ctx
  const chk = await requireRegisteredEco(ctx); if(!chk.ok) return
  const { jid, users, u } = chk

  // Cooldown base 45s (Elite +50%)
  const cdBase = 45/3600
  const cdAdj = eliteAdjust({ u, cooldownHours: cdBase }).cooldownHours
  if(!cooldownOk(u.lastCrash, cdAdj)){
    const rest = fmtDuration(msUntil(u.lastCrash, cdAdj))
    return sock.sendMessage(msg.key.remoteJid,{ text:`⏳ Crash disponible en: ${rest}` },{ quoted: msg })
  }

  const available = (u.coins||0) + (u.bank||0)
  const bet = parseAmount(args[0], available)
  const cashoutArg = args[1] ? Number(String(args[1]).replace(/[^0-9.]/g,'')) : NaN
  const cashout = isFinite(cashoutArg) && cashoutArg >= 1.01 ? cashoutArg : 2.0
  if(!bet) return sock.sendMessage(msg.key.remoteJid,{ text:'✨ Usa: $crash <apuesta> [cashout] (ej: $crash 2000 2.5)' },{ quoted: msg })
  if(available < bet) return sock.sendMessage(msg.key.remoteJid,{ text:`💔 No tienes suficientes ₭ (Disponible: ${util.formatKirby(available)})` },{ quoted: msg })

  const point = genCrashPoint()
  let outcome = 'lose'
  let gain = 0, loss = 0
  if (cashout <= point){
    outcome = 'win'
    gain = Math.floor(bet * cashout)
    gain = eliteAdjust({ u, gain }).gain
    u.coins = (u.coins||0) + gain
  } else {
    loss = eliteAdjust({ u, loss: bet }).loss
    const fromWallet = Math.min(u.coins||0, loss)
    const remaining = loss - fromWallet
    const fromBank = remaining > 0 ? Math.min(u.bank||0, remaining) : 0
    u.coins = Math.max(0, (u.coins||0) - fromWallet)
    u.bank = Math.max(0, (u.bank||0) - fromBank)
  }

  u.lastCrash = nowBogotaISO()
  users[jid] = u
  await db.saveJSON(files.USERS_FILE, users)
  await ensureTier(ctx, { jid, users, u })

  const card = [
    '╭─🚀 ᴄʀᴀꜱʜ Dreamland ─╮',
    `│ Tu cashout: x${cashout.toFixed(2)}`,
    `│ Crash en: x${point.toFixed(2)}`,
    '│──────────────────',
    outcome==='win' ? `│ 🌸 ¡Ganaste! +${util.formatKirby(gain)}` : `│ 💔 Perdiste −${util.formatKirby(loss)}`,
    `│ 🪙 Saldo: ₭ ${util.formatKirby(u.coins)} (Banco: ₭ ${util.formatKirby(u.bank||0)})`,
    '╰──────────────────🌸'
  ].join('\n')

  await sock.sendMessage(msg.key.remoteJid,{ text: card },{ quoted: msg })
}
