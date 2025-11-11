/**
 * name: dice
 * aliases: ["dados"]
 * description: Tira dos dados contra la casa 🎲
 * category: Casino
 */

import { requireRegisteredEco, parseAmount, eliteAdjust, ensureTier, cooldownOk, msUntil, fmtDuration, nowBogotaISO } from '../economia/_common.js'

const roll = () => Math.floor(Math.random()*6)+1

export async function run(ctx){
  const { sock, msg, args, files, db, util } = ctx
  const chk = await requireRegisteredEco(ctx); if(!chk.ok) return
  const { jid, users, u } = chk

  // Cooldown base 20s (Elite +50%)
  const cdBase = 20/3600
  const cdAdj = eliteAdjust({ u, cooldownHours: cdBase }).cooldownHours
  if(!cooldownOk(u.lastDice, cdAdj)){
    const rest = fmtDuration(msUntil(u.lastDice, cdAdj))
    return sock.sendMessage(msg.key.remoteJid,{ text:`⏳ Dice disponible en: ${rest}` },{ quoted: msg })
  }

  const available = (u.coins||0) + (u.bank||0)
  const bet = parseAmount(args[0], available)
  if(!bet) return sock.sendMessage(msg.key.remoteJid,{ text:'✨ Usa: $dice <apuesta>' },{ quoted: msg })
  if(available < bet) return sock.sendMessage(msg.key.remoteJid,{ text:`💔 No tienes suficientes ₭ (Disponible: ${util.formatKirby(available)})` },{ quoted: msg })

  const p1 = roll(), p2 = roll(); const player = p1+p2
  const h1 = roll(), h2 = roll(); const house = h1+h2
  let outcome = 'lose'
  if (player > house) outcome = 'win'
  else if (player === house) outcome = 'push'

  let gain = 0, loss = 0
  if (outcome === 'win'){
    gain = eliteAdjust({ u, gain: bet }).gain
    u.coins = (u.coins||0) + gain
  } else if (outcome === 'lose'){
    loss = eliteAdjust({ u, loss: bet }).loss
    const fromWallet = Math.min(u.coins||0, loss)
    const remaining = loss - fromWallet
    const fromBank = remaining > 0 ? Math.min(u.bank||0, remaining) : 0
    u.coins = Math.max(0, (u.coins||0) - fromWallet)
    u.bank = Math.max(0, (u.bank||0) - fromBank)
  }

  u.lastDice = nowBogotaISO()
  users[jid] = u
  await db.saveJSON(files.USERS_FILE, users)
  await ensureTier(ctx, { jid, users, u })

  const card = [
    '╭─🎲 ᴅɪᴄᴇ Dreamland ─╮',
    `│ Tú: ${p1} + ${p2} = ${player}`,
    `│ Casa: ${h1} + ${h2} = ${house}`,
    '│──────────────────',
    outcome==='win' ? `│ 🌸 ¡Ganaste! +${util.formatKirby(gain)}` :
    outcome==='lose'? `│ 💔 Perdiste −${util.formatKirby(loss)}` :
                       '│ 🤝 Empate (push)'
    ,`│ 🪙 Saldo: ₭ ${util.formatKirby(u.coins)} (Banco: ₭ ${util.formatKirby(u.bank||0)})`,
    '╰──────────────────🌸'
  ].join('\n')

  await sock.sendMessage(msg.key.remoteJid,{ text: card },{ quoted: msg })
}
