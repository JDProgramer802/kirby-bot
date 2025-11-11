/**
 * name: fish
 * aliases: ["pescar"]
 * description: Pesca y gana ₭ con algo de suerte 🎣
 * category: Economía
 */

import { requireRegisteredEco, cooldownOk, nowBogotaISO, msUntil, fmtDuration } from './_common.js'

export async function run(ctx){
  const { sock, msg, files, db, util } = ctx
  const chk = await requireRegisteredEco(ctx); if(!chk.ok) return
  const { jid, users, u } = chk

  const cdHours = 0.5 // 30 minutos
  if(!cooldownOk(u.lastFish, cdHours)){
    const rest = fmtDuration(msUntil(u.lastFish, cdHours))
    const card = [
      '｡ﾟ✧ ¡Descanso de pesca! ✧ﾟ｡',
      '———————————',
      `⏳ Vuelve en: ${rest}`,
      '🎣 Afila el anzuelo y regresa pronto~'
    ].join('\n')
    return sock.sendMessage(msg.key.remoteJid,{ text: card },{ quoted: msg })
  }

  // Recompensas aleatorias con pequeñas variaciones
  const roll = Math.random()
  let gain = 0
  let flavor = ''
  if (roll < 0.05) {
    gain = 1000
    flavor = '¡Sacaste un pez dorado legendario! ✨'
  } else if (roll < 0.30) {
    gain = Math.floor(Math.random()*151)+350 // 350-500
    flavor = 'Un bonito salmón apareció~ 🐟'
  } else if (roll < 0.90) {
    gain = Math.floor(Math.random()*151)+200 // 200-350
    flavor = 'Un pez pequeñito pero adorable~ 🐠'
  } else {
    gain = Math.floor(Math.random()*51)+50 // 50-100
    flavor = 'Solo alguitas… pero algo vendiste 🍀'
  }

  u.coins = (u.coins||0) + gain
  u.lastFish = nowBogotaISO()
  users[jid] = u
  await db.saveJSON(files.USERS_FILE, users)

  const card = [
    '｡ﾟ✧ ¡Pesca exitosa! ✧ﾟ｡',
    '———————————',
    `🎣 ${flavor}`,
    `💰 Ganaste: ${util.formatKirby(gain)}`,
    `🪙 Cartera: ${util.formatKirby(u.coins)}`
  ].join('\n')
  await sock.sendMessage(msg.key.remoteJid, { text: card }, { quoted: msg })
}
