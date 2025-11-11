/**
 * name: playaudio
 * aliases: ["reproduciraudio"]
 * description: Reproduce manual un audio por trigger
 * category: Audios
 */

import { ensureAudioDB } from './_common.js'

export async function run(ctx){
  const { sock, msg, args, files, db } = ctx
  const gid = msg.key.remoteJid
  const trigger = (args[0]||'').toLowerCase()
  if(!trigger) return sock.sendMessage(gid,{ text:'✨ Usa: $playaudio <trigger>'},{ quoted: msg })
  const { aud } = await ensureAudioDB(files, db)
  const item = (aud.audios||[]).find(a=>a.trigger===trigger)
  if(!item) return sock.sendMessage(gid,{ text:'🌸 ¡Ups~! No encontré ese audio 💕'},{ quoted: msg })
  if(!(gid?.endsWith('@g.us')) && item.groupOnly){
    return sock.sendMessage(gid,{ text:'🌸 Ese audio está restringido a grupos 💫'},{ quoted: msg })
  }
  await sock.sendMessage(gid,{ audio: { url: item.url }, mimetype: 'audio/mpeg', ptt: true },{ quoted: msg })
}
