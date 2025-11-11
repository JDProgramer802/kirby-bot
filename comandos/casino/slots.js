/**
 * name: slots
 * aliases: ["tragamonedas","slot"]
 * description: Tragamonedas de Dreamland 🎰
 * category: Casino
 */

import { requireRegisteredEco, parseAmount, eliteAdjust, ensureTier, cooldownOk, msUntil, fmtDuration, nowBogotaISO } from '../economia/_common.js'

const symbols = [
  { s: '⭐', p: 0.25, mult3: 3, mult2: 1.2 },
  { s: '💖', p: 0.2, mult3: 4, mult2: 1.5 },
  { s: '🍒', p: 0.2, mult3: 2.5, mult2: 1.2 },
  { s: '🔔', p: 0.15, mult3: 6, mult2: 2 },
  { s: '💎', p: 0.1, mult3: 10, mult2: 3 },
  { s: '🌈', p: 0.1, mult3: 15, mult2: 4 }
]

function pick(){
  const r = Math.random()
  let acc = 0
  for(const it of symbols){ acc += it.p; if(r <= acc) return it }
  return symbols[symbols.length-1]
}

export async function run(ctx){
  const { sock, msg, args, files, db, util } = ctx
  const chk = await requireRegisteredEco(ctx); if(!chk.ok) return
  const { jid, users, u } = chk

  // Cooldown base 30s (Elite +50%)
  const cdBase = 0.5/60
  const cdAdj = eliteAdjust({ u, cooldownHours: cdBase }).cooldownHours
  if(!cooldownOk(u.lastSlots, cdAdj)){
    const rest = fmtDuration(msUntil(u.lastSlots, cdAdj))
    return sock.sendMessage(msg.key.remoteJid,{ text:`⏳ Slots disponible en: ${rest}` },{ quoted: msg })
  }

  const available = (u.coins||0) + (u.bank||0)
  const bet = parseAmount(args[0], available)
  if(!bet) return sock.sendMessage(msg.key.remoteJid,{ text:'✨ Usa: $slots <apuesta>' },{ quoted: msg })
  if(available < bet) return sock.sendMessage(msg.key.remoteJid,{ text:`💔 No tienes suficientes ₭ (Disponible: ${util.formatKirby(available)})` },{ quoted: msg })

  // Tirada
  const r1 = pick(), r2 = pick(), r3 = pick()
  const row = [r1.s, r2.s, r3.s].join(' | ')
  let outcome = 'lose'
  let mult = 0
  if (r1.s === r2.s && r2.s === r3.s){ outcome = 'win'; mult = r1.mult3 }
  else if (r1.s === r2.s || r2.s === r3.s || r1.s === r3.s){ outcome = 'half'; mult = (r1.s===r2.s? r1.mult2 : r2.s===r3.s? r2.mult2 : r1.s===r3.s? r1.mult2 : 1) }

  let gain = 0
  let loss = 0
  if (outcome === 'win' || outcome === 'half'){
    gain = Math.floor(bet * mult)
    gain = eliteAdjust({ u, gain }).gain
    u.coins = (u.coins||0) + gain
  } else {
    loss = bet
    loss = eliteAdjust({ u, loss }).loss
    const fromWallet = Math.min(u.coins||0, loss)
    const remaining = loss - fromWallet
    const fromBank = remaining > 0 ? Math.min(u.bank||0, remaining) : 0
    u.coins = Math.max(0, (u.coins||0) - fromWallet)
    u.bank = Math.max(0, (u.bank||0) - fromBank)
  }

  u.lastSlots = nowBogotaISO()
  users[jid] = u
  await db.saveJSON(files.USERS_FILE, users)
  await ensureTier(ctx, { jid, users, u })

  const card = [
    '╭─🎰 ᴅʀᴇᴀᴍʟᴀɴᴅ ꜱʟᴏᴛꜱ ─╮',
    `│ ${row}`,
    '│──────────────────',
    outcome==='win' ? `│ 🌈 ¡Jackpot! x${mult}  +${util.formatKirby(gain)}` :
    outcome==='half'? `│ ⭐ Coincidencia parcial x${mult} +${util.formatKirby(gain)}` :
                       `│ 💔 Sin premio −${util.formatKirby(loss)}`,
    `│ 🪙 Saldo: ₭ ${util.formatKirby(u.coins)} (Banco: ₭ ${util.formatKirby(u.bank||0)})`,
    '╰──────────────────🌸'
  ].join('\n')

  await sock.sendMessage(msg.key.remoteJid,{ text: card },{ quoted: msg })
}
