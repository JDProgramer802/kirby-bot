/**
 * name: economyinfo
 * aliases: ["einfo"]
 * description: Muestra tu información económica global 📊
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
  const lines = [
    '📊 Tu economía Dreamland',
    `🪙 Cartera: ${coins}`,
    `🏦 Banco: ${bank}`,
    `✨ Total: ${total}`,
    `⭐ Nivel: ${u.level||1} | XP: ${u.xp||0}`
  ]
  await sock.sendMessage(msg.key.remoteJid,{ text: lines.join('\n') },{ quoted: msg })
}
