/**
 * name: blackjack
 * aliases: ["bj"]
 * description: Juega Blackjack contra la casa 🃏
 * category: Casino
 */

import { requireRegisteredEco, parseAmount, eliteAdjust, ensureTier, cooldownOk, msUntil, fmtDuration, nowBogotaISO } from '../economia/_common.js'

const deckValues = [
  { r: 'A', v: [1,11] },
  { r: '2', v: 2 }, { r: '3', v: 3 }, { r: '4', v: 4 }, { r: '5', v: 5 },
  { r: '6', v: 6 }, { r: '7', v: 7 }, { r: '8', v: 8 }, { r: '9', v: 9 },
  { r: '10', v: 10 }, { r: 'J', v: 10 }, { r: 'Q', v: 10 }, { r: 'K', v: 10 }
]

function draw() { return deckValues[Math.floor(Math.random()*deckValues.length)] }
function bestTotal(cards){
  let total = 0
  let aces = 0
  for(const c of cards){
    if(Array.isArray(c.v)) { aces += 1; total += 11 } else total += c.v
  }
  while(total>21 && aces>0){ total -= 10; aces -= 1 }
  return total
}

export async function run(ctx){
  const { sock, msg, args, files, db, util } = ctx
  const chk = await requireRegisteredEco(ctx); if(!chk.ok) return
  const { jid, users, u } = chk

  // Cooldown corto para evitar spam (base 1 min; Elite +50%)
  const cdBase = 1/60
  const cdAdj = eliteAdjust({ u, cooldownHours: cdBase }).cooldownHours
  if(!cooldownOk(u.lastBlackjack, cdAdj)){
    const rest = fmtDuration(msUntil(u.lastBlackjack, cdAdj))
    return sock.sendMessage(msg.key.remoteJid,{ text:`⏳ Blackjack disponible en: ${rest}` },{ quoted: msg })
  }

  const available = (u.coins||0) + (u.bank||0)
  const bet = parseAmount(args[0], available)
  if(!bet) return sock.sendMessage(msg.key.remoteJid,{ text:'✨ Usa: $blackjack <apuesta>' },{ quoted: msg })
  if(available < bet) return sock.sendMessage(msg.key.remoteJid,{ text:`💔 No tienes suficientes ₭ (Disponible: ${util.formatKirby(available)})` },{ quoted: msg })

  // Reparto y juego automático del jugador: roba hasta 17 o más
  const player = [draw(), draw()]
  const dealer = [draw(), draw()]
  while(bestTotal(player) < 17) player.push(draw())
  while(bestTotal(dealer) < 17) dealer.push(draw())

  const pt = bestTotal(player), dt = bestTotal(dealer)
  let outcome = ''
  if (pt>21) outcome = 'lose'
  else if (dt>21) outcome = 'win'
  else if (pt>dt) outcome = 'win'
  else if (pt<dt) outcome = 'lose'
  else outcome = 'push'

  const formatHand = (cards)=> cards.map(c=>c.r).join(' ')
  let gain = 0
  let loss = 0
  if (outcome === 'win'){
    // pago 1:1
    gain = bet
    gain = eliteAdjust({ u, gain }).gain
    u.coins = (u.coins||0) + gain
  } else if (outcome === 'lose'){
    loss = bet
    loss = eliteAdjust({ u, loss }).loss
    // Descontar primero de cartera y luego de banco
    const fromWallet = Math.min(u.coins||0, loss)
    const remaining = loss - fromWallet
    const fromBank = remaining > 0 ? Math.min(u.bank||0, remaining) : 0
    u.coins = Math.max(0, (u.coins||0) - fromWallet)
    u.bank = Math.max(0, (u.bank||0) - fromBank)
  } else {
    // push: no cambios
  }

  u.lastBlackjack = nowBogotaISO()
  users[jid] = u
  await db.saveJSON(files.USERS_FILE, users)
  await ensureTier(ctx, { jid, users, u })

  const card = [
    '╭─🃏 ʙʟᴀᴄᴋᴊᴀᴄᴋ Dreamland ─╮',
    `👤 Tú: ${formatHand(player)} = ${pt}`,
    `🏛️ Casa: ${formatHand(dealer)} = ${dt}`,
    '────────────────────',
    outcome==='win' ? `🌸 ¡Ganaste! +${util.formatKirby(gain)}`:
    outcome==='lose'? `💔 Perdiste −${util.formatKirby(loss)}`:
    '🤝 Empate (push): sin cambios',
    `🪙 Saldo: ₭ ${util.formatKirby(u.coins)} (Banco: ₭ ${util.formatKirby(u.bank||0)})`,
    '╰────────────────────🌸'
  ].join('\n')

  await sock.sendMessage(msg.key.remoteJid,{ text: card },{ quoted: msg })
}
