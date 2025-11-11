/**
 * name: withdraw
 * aliases: ["with","retirar"]
 * description: Retira ₭ del banco 💳
 * category: Economía
 */

import { requireRegisteredEco, parseAmount, saveUsers } from './_common.js'

export async function run(ctx){
  const { sock, msg, args, files, db, util } = ctx
  const chk = await requireRegisteredEco(ctx); if(!chk.ok) return
  const { jid, users, u } = chk
  const amount = parseAmount(args[0], u.bank||0)
  if(!amount) return sock.sendMessage(msg.key.remoteJid,{ text:'✨ Usa: $withdraw <cantidad|all>' },{ quoted: msg })
  if((u.bank||0) < amount) return sock.sendMessage(msg.key.remoteJid,{ text:'💔 No tienes suficientes ₭ en el banco 💕' },{ quoted: msg })
  u.bank = Math.max(0, (u.bank||0) - amount)
  u.coins = (u.coins||0) + amount
  users[jid] = u
  await saveUsers(files, db, users)
  const card = [
    '｡ﾟ✧ Retiro completado ✧ﾟ｡',
    '———————————',
    `➖ Monto:  ${util.formatKirby(amount)}`,
    `🏦 Banco:  ${util.formatKirby(u.bank)}`,
    `🪙 Cartera: ${util.formatKirby(u.coins)}`
  ].join('\n')
  await sock.sendMessage(msg.key.remoteJid,{ text: card },{ quoted: msg })
}
