/**
 * name: groupaudio
 * aliases: ["grupaudio","audiogrupo"]
 * description: Restringe audios a grupos
 * category: Audios
 */

import { ensureAudioDB } from './_common.js'

export async function run(ctx){
  const { sock, msg, args, files, db } = ctx
  const gid = msg.key.remoteJid
  const trigger = (args[0]||'').trim().toLowerCase()
  const v = (args[1]||'').toLowerCase()
  if(!trigger || !['true','false','on','off','enable','disable'].includes(v)){
    return sock.sendMessage(gid,{ text:'✨ Usa: $groupaudio <trigger> <true|false>' },{ quoted: msg })
  }
  const toVal = ['true','on','enable'].includes(v)
  const { aud } = await ensureAudioDB(files, db)
  const item = aud.audios.find(a=>a.trigger===trigger)
  if(!item) return sock.sendMessage(gid,{ text:'🌸 ¡Ups~! No encontré ese audio 💕'},{ quoted: msg })
  item.groupOnly = toVal
  await db.saveJSON(files.AUDIOS_DB, aud)
  await sock.sendMessage(gid,{ text:`🎀 Listo. ${trigger} ahora ${toVal? 'solo en grupos' : 'disponible en cualquier chat'} 💖`},{ quoted: msg })
}
