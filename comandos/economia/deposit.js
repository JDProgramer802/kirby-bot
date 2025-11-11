/**
 * name: deposit
 * aliases: ["dep","depositar","d"]
 * description: Deposita ₭ en el banco 🏦
 * category: Economía
 */

import { requireRegisteredEco, parseAmount, saveUsers } from './_common.js'

export async function run(ctx){
  const { sock, msg, args, files, db, util } = ctx
  const chk = await requireRegisteredEco(ctx); if(!chk.ok) return
  const { jid, users, u } = chk
  const amount = parseAmount(args[0], u.coins||0)
  if(!amount) return sock.sendMessage(msg.key.remoteJid,{ text:'✨ Usa: $deposit <cantidad|all>' },{ quoted: msg })
  if((u.coins||0) < amount) return sock.sendMessage(msg.key.remoteJid,{ text:'💔 No tienes suficientes ₭ para esa acción 💕' },{ quoted: msg })
  u.coins = Math.max(0, (u.coins||0) - amount)
  u.bank = (u.bank||0) + amount
  users[jid] = u
  await saveUsers(files, db, users)
  const card = [
    '｡ﾟ✧ Depósito completado ✧ﾟ｡',
    '———————————',
    `➕ Monto:  ${util.formatKirby(amount)}`,
    `🏦 Banco:  ${util.formatKirby(u.bank)}`,
    `🪙 Cartera: ${util.formatKirby(u.coins)}`
  ].join('\n')
  await sock.sendMessage(msg.key.remoteJid,{ text: card },{ quoted: msg })
}
