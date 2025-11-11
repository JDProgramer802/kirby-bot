/**
 * name: addaudio
 * aliases: ["addaudio","agregaraudio"]
 * description: Agrega un nuevo audio respondiendo a un mensaje de voz o archivo de audio
 * category: Audios
 */

import path from 'path'
import { ensureAudioDB, saveAudioFileFromMsg } from './_common.js'

export async function run(ctx){
  const { sock, msg, args, files, db } = ctx
  const gid = msg.key.remoteJid
  const trigger = (args[0]||'').trim().toLowerCase()
  if(!trigger) return sock.sendMessage(gid,{ text:'✨ Usa: $addaudio <trigger> respondiendo a un audio/nota de voz'},{ quoted: msg })

  const { aud } = await ensureAudioDB(files, db)
  if(aud.audios.find(a=>a.trigger===trigger)){
    return sock.sendMessage(gid,{ text:'🌸 Ya existe un audio con ese trigger 💕'},{ quoted: msg })
  }

  const filename = `${trigger}-${Date.now()}.mp3`
  const saved = await saveAudioFileFromMsg(sock, msg, path.resolve('audios'), filename)
  if(!saved){
    return sock.sendMessage(gid,{ text:'🌸 Debes responder a un audio o nota de voz 💫'},{ quoted: msg })
  }

  aud.audios.push({ trigger, url: `./audios/${filename}`, addedBy: msg.key.participant || gid, groupOnly: false })
  await db.saveJSON(files.AUDIOS_DB, aud)
  await sock.sendMessage(gid,{ text:'💫 Audio añadido con éxito 💕'},{ quoted: msg })
}
