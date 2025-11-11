/**
 * name: rouletteplus
 * aliases: ["rt+","rta"]
 * description: Ruleta avanzada: rojo/negro, docena (1-12/13-24/25-36), columna (1ra/2da/3ra)
 * category: Casino
 */

import { requireRegisteredEco, parseAmount, eliteAdjust, ensureTier, cooldownOk, msUntil, fmtDuration, nowBogotaISO } from '../economia/_common.js'

const colors = {
  red: new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]),
  black: new Set([2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35])
}

function spin(){ return Math.floor(Math.random()*37) } // 0..36

export async function run(ctx){
  const { sock, msg, args, files, db, util } = ctx
  const chk = await requireRegisteredEco(ctx); if(!chk.ok) return
  const { jid, users, u } = chk

  // Cooldown base 45s (Elite +50%)
  const cdBase = 45/3600
  const cdAdj = eliteAdjust({ u, cooldownHours: cdBase }).cooldownHours
  if(!cooldownOk(u.lastRoulettePlus, cdAdj)){
    const rest = fmtDuration(msUntil(u.lastRoulettePlus, cdAdj))
    return sock.sendMessage(msg.key.remoteJid,{ text:`⏳ Roulette+ en: ${rest}` },{ quoted: msg })
  }

  // Apuesta: <tipo> <valor> <monto>
  // tipos: color (red|black|rojo|negro), docena (d1|d2|d3), columna (c1|c2|c3)
  const type = (args[0]||'').toLowerCase()
  const value = (args[1]||'').toLowerCase()
  const available = (u.coins||0) + (u.bank||0)
  const bet = parseAmount(args[2], available)
  if(!bet) return sock.sendMessage(msg.key.remoteJid,{ text:'✨ Usa: $rouletteplus <color|docena|columna> <valor> <apuesta>\nEj: $rouletteplus color rojo 1000 | $rouletteplus docena d2 2000 | $rouletteplus columna c3 1500' },{ quoted: msg })
  if(available < bet) return sock.sendMessage(msg.key.remoteJid,{ text:`💔 No tienes suficientes ₭ (Disponible: ${util.formatKirby(available)})` },{ quoted: msg })

  const n = spin()
  const col = colors.red.has(n) ? 'red' : colors.black.has(n) ? 'black' : 'green'

  // Payouts: color 1:1, docena 2:1, columna 2:1
  let outcome = 'lose', mult = 0, betDesc = ''
  if (type === 'color'){
    const want = ['rojo','red'].includes(value) ? 'red' : ['negro','black'].includes(value) ? 'black' : ''
    betDesc = `Color ${want||value}`
    if (want && want === col && n!==0) { outcome='win'; mult = 1 }
  } else if (type === 'docena'){
    betDesc = `Docena ${value}`
    const inD1 = n>=1 && n<=12, inD2 = n>=13 && n<=24, inD3 = n>=25 && n<=36
    const want = value==='d1'? inD1 : value==='d2'? inD2 : value==='d3'? inD3 : false
    if (want) { outcome='win'; mult = 2 }
  } else if (type === 'columna'){
    betDesc = `Columna ${value}`
    const c1 = n%3===1, c2 = n%3===2, c3 = n%3===0
    const want = value==='c1'? c1 : value==='c2'? c2 : value==='c3'? c3 : false
    if (n!==0 && want) { outcome='win'; mult = 2 }
  } else {
    return sock.sendMessage(msg.key.remoteJid,{ text:'✨ Tipos válidos: color (rojo/negro), docena (d1/d2/d3), columna (c1/c2/c3)' },{ quoted: msg })
  }

  let gain = 0, loss = 0
  if (outcome==='win'){
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

  u.lastRoulettePlus = nowBogotaISO()
  users[jid] = u
  await db.saveJSON(files.USERS_FILE, users)
  await ensureTier(ctx, { jid, users, u })

  const card = [
    '╭─🎡 ʀᴏᴜʟᴇᴛᴛᴇ+ Dreamland ─╮',
    `│ Apuesta: ${betDesc} por ₭ ${util.formatKirby(bet)}`,
    `│ Resultado: ${n} (${col.toUpperCase()})`,
    '│──────────────────',
    outcome==='win' ? `│ 🌸 ¡Ganaste! +${util.formatKirby(gain)}` : `│ 💔 Perdiste −${util.formatKirby(loss)}`,
    `│ 🪙 Saldo: ₭ ${util.formatKirby(u.coins)} (Banco: ₭ ${util.formatKirby(u.bank||0)})`,
    '╰──────────────────🌸'
  ].join('\n')

  await sock.sendMessage(msg.key.remoteJid,{ text: card },{ quoted: msg })
}
