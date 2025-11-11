/**
 * name: balance
 * aliases: ["bal","coins"]
 * description: Muestra tus KirbyCoins actuales 💰
 * category: Economía
 */

import { requireRegisteredEco } from './_common.js'

export async function run(ctx){
  const { sock, msg, util } = ctx
  const chk = await requireRegisteredEco(ctx); if(!chk.ok) return
  const { u } = chk
  const coins = util.formatKirby(u.coins||0)
  const bank = util.formatKirby(u.bank||0)
  const total = util.formatKirby((u.coins||0)+(u.bank||0))
  const card = [
    '｡ﾟ✧ Tu Monedero Kirby ✧ﾟ｡',
    '———————————',
    `🪙 Cartera: ${coins}`,
    `🏦 Banco:   ${bank}`,
    '———————————',
    `✨ Total:   ${total}`
  ].join('\n')
  await sock.sendMessage(msg.key.remoteJid,{ text: card },{ quoted: msg })
}
