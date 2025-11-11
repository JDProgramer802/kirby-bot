/**
  * name: adviento
  * aliases: ["advent","navidadadviento"]
  * description: Reclama recompensas del calendario de adviento (1-24) 
  * category: Navidad
  */
 import { requireRegisteredEco, cooldownOk, nowBogotaISO, todayBogota, eliteAdjust, ensureTier } from '../economia/_common.js'
 import { EVENTS } from '../../config.js'
 import fs from 'fs'

const getDecemberDay = () => {
  const d = new Date()
  const month = d.getUTCMonth()+1
  if (month !== 12) return null
  return d.getUTCDate()
}

export async function run(ctx){
  const { sock, msg, args, files, db, util } = ctx
  if(!EVENTS.CHRISTMAS_ENABLED){
    return sock.sendMessage(msg.key.remoteJid,{ text:'🎄 El evento navideño no está disponible por ahora.' },{ quoted: msg })
  }
  const chk = await requireRegisteredEco(ctx); if(!chk.ok) return
  const { jid, users, u } = chk

  let dayArg = Number(args[0])
  let day = Number.isInteger(dayArg) && dayArg>=1 && dayArg<=24 ? dayArg : getDecemberDay()
  if(!day || day<1 || day>24){
    return sock.sendMessage(msg.key.remoteJid,{ text:'📅 Adviento disponible del 1 al 24 de diciembre. Usa: $adviento [día]' },{ quoted: msg })
  }

  const today = todayBogota()
  u.xmasAdv ||= { claimed: {}, last: '' }
  if (u.xmasAdv.claimed[day]){
    return sock.sendMessage(msg.key.remoteJid,{ text:`🎁 Ya reclamaste el día ${day} del calendario de adviento.` },{ quoted: msg })
  }
  // Restricción suave: solo reclamar días hasta el actual
  const currentDay = getDecemberDay()
  if (currentDay && day > currentDay){
    return sock.sendMessage(msg.key.remoteJid,{ text:`⏳ Aún no llegamos al día ${day}.` },{ quoted: msg })
  }

  // Recompensa sube con el día
  const base = 300 + day * 50
  const variance = Math.floor(Math.random()*101) // 0-100
  let gain = base + variance
  gain = eliteAdjust({ u, gain }).gain

  u.coins = (u.coins||0) + gain
  u.xmasAdv.claimed[day] = today
  u.xmasAdv.last = nowBogotaISO()
  users[jid] = u
  await db.saveJSON(files.USERS_FILE, users)
  await ensureTier(ctx, { jid, users, u })

  const card = [
    '╭─🗓️ ᴀᴅᴠɪᴇɴᴛᴏ ─╮',
    `│ Día ${day}: +${util.formatKirby(gain)}`,
    '│ ✨ Sigue reclamando hasta el 24',
    '╰───────────────🌟'
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
