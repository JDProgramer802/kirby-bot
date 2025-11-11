/**
 * name: coinflip
 * aliases: ["flip","cf"]
 * description: Apuesta tus ₭ en un cara o cruz 🎲
 * category: Economía
 */

import { requireRegisteredEco, parseAmount, eliteAdjust, ensureTier } from './_common.js'

export async function run(ctx){
  const { sock, msg, args, util, files, db } = ctx
  const chk = await requireRegisteredEco(ctx); if(!chk.ok) return
  const { jid, users, u } = chk

  const amount = parseAmount(args[0], u.coins||0)
  const guess = (args[1]||'').toLowerCase()
  if(!amount || !['cara','cruz','head','tail'].includes(guess)){
    return sock.sendMessage(msg.key.remoteJid,{ text:'✨ Usa: $coinflip <cantidad> <cara|cruz>' },{ quoted: msg })
  }
  if((u.coins||0) < amount) return sock.sendMessage(msg.key.remoteJid,{ text:'💔 No tienes suficientes ₭ para esa acción 💕' },{ quoted: msg })

  const flip = Math.random() < 0.5 ? 'cara' : 'cruz'
  const normalized = (g)=> (g==='head'?'cara': g==='tail'?'cruz': g)
  const userPick = normalized(guess)
  if(userPick === flip){
    // gana x2
    let gain = amount
    gain = eliteAdjust({ u, gain }).gain
    u.coins = (u.coins||0) + gain
    users[jid] = u
    await db.saveJSON(files.USERS_FILE, users)
    await ensureTier(ctx, { jid, users, u })
    return sock.sendMessage(msg.key.remoteJid,{ text:`🎀 Apostaste ${util.formatKirby(amount)} a ${userPick.toUpperCase()} y ganaste ${util.formatKirby(gain)} 💖 (Resultado: ${flip.toUpperCase()})` },{ quoted: msg })
  } else {
    let loss = amount
    loss = eliteAdjust({ u, loss }).loss
    u.coins = (u.coins||0) - loss
    if(u.coins < 0) u.coins = 0
    users[jid] = u
    await db.saveJSON(files.USERS_FILE, users)
    await ensureTier(ctx, { jid, users, u })
    return sock.sendMessage(msg.key.remoteJid,{ text:`💫 Oh no~ Perdiste ${util.formatKirby(loss)} (Elegiste: ${userPick.toUpperCase()} • Resultado: ${flip.toUpperCase()})` },{ quoted: msg })
  }
}
