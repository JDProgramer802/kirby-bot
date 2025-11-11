/**
  * name: regalo
  * aliases: ["navidad","xmas","regalonavidad"]
  * description: Regalo diario navideño con racha 🎄
  * category: Navidad
  */
 import { requireRegisteredEco, cooldownOk, nowBogotaISO, msUntil, fmtDuration, todayBogota, isYesterdayBogota, eliteAdjust, ensureTier, petAdjust } from '../economia/_common.js'
 import { EVENTS } from '../../config.js'
 import fs from 'fs'

export async function run(ctx){
  const { sock, msg, files, db, util } = ctx
  if(!EVENTS.CHRISTMAS_ENABLED){
    return sock.sendMessage(msg.key.remoteJid,{ text:'🎄 El evento navideño no está disponible por ahora.' },{ quoted: msg })
  }
  const chk = await requireRegisteredEco(ctx); if(!chk.ok) return
  const { jid, users, u } = chk

  const cdAdj = eliteAdjust({ u, cooldownHours: 24 }).cooldownHours
  if(!cooldownOk(u.lastXmasRegalo, cdAdj)){
    const rest = fmtDuration(msUntil(u.lastXmasRegalo, cdAdj))
    const card = [
      '🎁 Regalo navideño en descanso',
      '———————————',
      `⏳ Tiempo restante: ${rest}`,
      '✨ Vuelve mañana para otro regalo'
    ].join('\n')
    return sock.sendMessage(msg.key.remoteJid,{ text: card },{ quoted: msg })
  }

  const today = todayBogota()
  if (u.xmasRegaloDate === today){
    const rest = fmtDuration(msUntil(u.lastXmasRegalo, 24))
    return sock.sendMessage(msg.key.remoteJid,{ text:`🎄 Ya reclamaste tu regalo hoy.
⏳ Próximo en: ${rest}` },{ quoted: msg })
  }

  // Racha navideña (similar a daily): x2 por día consecutivo
  let streak = Number(u.xmasStreak||0)
  if (isYesterdayBogota(u.xmasRegaloDate)) streak += 1
  else streak = 1

  const base = Math.floor(Math.random()*701)+800 // 800-1500
  const bonus = Math.floor(Math.random()*201)    // 0-200 extra festivo
  const multiplier = Math.pow(2, Math.max(0, streak-1))
  let gain = Math.floor((base + bonus) * multiplier)
  gain = eliteAdjust({ u, gain }).gain
  gain = await petAdjust(ctx, { u, gain })

  u.coins = (u.coins||0) + gain
  u.lastXmasRegalo = nowBogotaISO()
  u.xmasRegaloDate = today
  u.xmasStreak = streak
  users[jid] = u
  await db.saveJSON(files.USERS_FILE, users)
  await ensureTier(ctx, { jid, users, u })

  const card = [
    '╭─🎄 ʀᴇɢᴀʟᴏ ɴᴀᴠɪᴅᴇɴ̃ᴏ ─╮',
    `│ 🔥 Racha: x${multiplier} (día ${streak})`,
    `│ 🎁 Ganaste: ${util.formatKirby(gain)}`,
    '│ ✨ ¡Felices fiestas! ✨',
    '╰──────────────────🌟'
  ].join('\n')
  await sock.sendMessage(msg.key.remoteJid,{ text: card },{ quoted: msg })
  try{
    if (fs.existsSync('./stickers/navidad.webp')){
      await sock.sendMessage(msg.key.remoteJid,{ sticker: { url: './stickers/navidad.webp' } },{ quoted: msg })
    }
    if (fs.existsSync('./audios/navidad.mp3')){
      await sock.sendMessage(msg.key.remoteJid,{ audio: { url: './audios/navidad.mp3' }, mimetype: 'audio/mpeg', ptt: true },{ quoted: msg })
    }
  }catch{}
}
