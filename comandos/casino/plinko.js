/**
 * name: plinko
 * aliases: ["plk"]
 * description: Plinko de Dreamland: deja caer la ficha y gana según el casillero 🌟
 * category: Casino
 */

import { requireRegisteredEco, parseAmount, eliteAdjust, ensureTier, cooldownOk, msUntil, fmtDuration, nowBogotaISO } from '../economia/_common.js'

// Config simple de filas -> multiplicadores por casillero (simétricos)
const BOARDS = {
  low:   [0.5, 0.7, 0.9, 1.2, 1.5, 2.0, 1.5, 1.2, 0.9, 0.7, 0.5],
  mid:   [0.3, 0.6, 0.9, 1.3, 1.8, 3.0, 1.8, 1.3, 0.9, 0.6, 0.3],
  high:  [0.2, 0.4, 0.8, 1.2, 2.0, 5.0, 2.0, 1.2, 0.8, 0.4, 0.2]
}

function simulatePath(rows=10){
  // Modelo binomial simple: número de "derechas" en 10 filas => índice 0..10
  let rights = 0
  for(let i=0;i<rows;i++){
    if(Math.random()<0.5) rights++
  }
  return rights
}

export async function run(ctx){
  const { sock, msg, args, files, db, util } = ctx
  const chk = await requireRegisteredEco(ctx); if(!chk.ok) return
  const { jid, users, u } = chk

  // Cooldown base 40s (Elite +50%)
  const cdBase = 40/3600
  const cdAdj = eliteAdjust({ u, cooldownHours: cdBase }).cooldownHours
  if(!cooldownOk(u.lastPlinko, cdAdj)){
    const rest = fmtDuration(msUntil(u.lastPlinko, cdAdj))
    return sock.sendMessage(msg.key.remoteJid,{ text:`⏳ Plinko disponible en: ${rest}` },{ quoted: msg })
  }

  const risk = (args[0]||'mid').toLowerCase()
  const board = BOARDS[risk] || BOARDS.mid
  const available = (u.coins||0) + (u.bank||0)
  const bet = parseAmount(args[1], available)
  if(!bet) return sock.sendMessage(msg.key.remoteJid,{ text:'✨ Usa: $plinko <low|mid|high> <apuesta>' },{ quoted: msg })
  if(available < bet) return sock.sendMessage(msg.key.remoteJid,{ text:`💔 No tienes suficientes ₭ (Disponible: ${util.formatKirby(available)})` },{ quoted: msg })

  const idx = simulatePath(10)
  let mult = board[idx] || 0
  let outcome = mult>=1 ? 'win' : (mult>0 ? 'half' : 'lose')
  let gain = 0, loss = 0
  if (outcome==='win' || outcome==='half'){
    gain = Math.floor(bet * mult)
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

  u.lastPlinko = nowBogotaISO()
  users[jid] = u
  await db.saveJSON(files.USERS_FILE, users)
  await ensureTier(ctx, { jid, users, u })

  const card = [
    '╭─🪙 ᴘʟɪɴᴋᴏ Dreamland ─╮',
    `│ Riesgo: ${risk.toUpperCase()} | Casillero: ${idx+1}/${board.length}`,
    `│ Multiplicador: x${mult.toFixed(2)}`,
    '│──────────────────',
    outcome==='win' ? `│ 🌸 ¡Ganaste! +${util.formatKirby(gain)}` :
    outcome==='half'? `│ ⭐ Premio parcial +${util.formatKirby(gain)}` :
                       `│ 💔 Sin premio −${util.formatKirby(loss)}`,
    `│ 🪙 Saldo: ₭ ${util.formatKirby(u.coins)} (Banco: ₭ ${util.formatKirby(u.bank||0)})`,
    '╰──────────────────🌸'
  ].join('\n')

  await sock.sendMessage(msg.key.remoteJid,{ text: card },{ quoted: msg })
}
