/**
 * name: steal
 * aliases: ["robar","rob"]
 * description: Intenta robar ₭ a otro usuario 🕵️‍♀️
 * category: Economía
 */

import { requireRegisteredEco, nowBogotaISO, eliteAdjust, ensureTier } from './_common.js'

export async function run(ctx){
  const { sock, msg, args, files, db, util } = ctx
  const chk = await requireRegisteredEco(ctx); if(!chk.ok) return
  const { jid, users, u } = chk

  const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || args[0]
  if(!target) return sock.sendMessage(msg.key.remoteJid,{ text:'✨ Usa: $steal @usuario' },{ quoted: msg })
  if(target===jid) return sock.sendMessage(msg.key.remoteJid,{ text:'🌸 No puedes robarte a ti mism@ 💕' },{ quoted: msg })

  users[target] ||= { registered:false, coins:0 }
  if(!users[target].registered){
    return sock.sendMessage(msg.key.remoteJid,{ text:'🌸 Esa personita no está registrada 💫' },{ quoted: msg })
  }

  const success = Math.random() < 0.5
  if(success){
    const pct = (Math.floor(Math.random()*21)+10) / 100 // 10% - 30%
    let amount = Math.floor(((users[target].coins||0) * pct) * 100) / 100
    // Reducir botín si es Elite
    amount = eliteAdjust({ u, gain: amount }).gain
    if(amount <= 0) {
      return sock.sendMessage(msg.key.remoteJid,{ text:'🌸 Nada que robar por ahora~ 💫' },{ quoted: msg })
    }
    users[target].coins = Math.max(0, (users[target].coins||0) - amount)
    u.coins = (u.coins||0) + amount
    users[jid] = u
    await db.saveJSON(files.USERS_FILE, users)
    await ensureTier(ctx, { jid, users, u })
    return sock.sendMessage(msg.key.remoteJid,{ text:`🕵️‍♀️ ¡Robo exitoso! Te llevaste ${util.formatKirby(amount)} de ${users[target].name||target} ✨` },{ quoted: msg })
  } else {
    let loss = Math.floor(Math.random()*201)+100 // 100-300
    // Aumentar multa si es Elite
    loss = eliteAdjust({ u, loss }).loss
    u.coins = Math.max(0, (u.coins||0) - loss)
    users[jid] = u
    await db.saveJSON(files.USERS_FILE, users)
    await ensureTier(ctx, { jid, users, u })
    return sock.sendMessage(msg.key.remoteJid,{ text:`💔 Te atraparon y perdiste ${util.formatKirby(loss)} 💕` },{ quoted: msg })
  }
}
