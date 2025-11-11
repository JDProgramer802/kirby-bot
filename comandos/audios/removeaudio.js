/**
 * name: removeaudio
 * aliases: ["rmaudio","deleteaudio"]
 * description: Elimina un audio registrado (solo admins/owner)
 * category: Audios
 */

import { promises as fs } from 'fs'
import path from 'path'
import { ensureAudioDB, isOwnerOrAdmin } from './_common.js'

export async function run(ctx){
  const { sock, msg, args, files, db } = ctx
  const gid = msg.key.remoteJid
  const trigger = (args[0]||'').trim().toLowerCase()
  if(!trigger) return sock.sendMessage(gid,{ text:'✨ Usa: $removeaudio <trigger>'},{ quoted: msg })

  const allowed = await isOwnerOrAdmin(sock, msg)
  if(!allowed) return sock.sendMessage(gid,{ text:'🚫 No tienes permisos para borrar audios 💔'},{ quoted: msg })

  const { aud } = await ensureAudioDB(files, db)
  const idx = aud.audios.findIndex(a=>a.trigger===trigger)
  if(idx<0) return sock.sendMessage(gid,{ text:'🌸 ¡Ups~! No encontré ese audio 💕'},{ quoted: msg })

  const item = aud.audios[idx]
  aud.audios.splice(idx,1)
  await db.saveJSON(files.AUDIOS_DB, aud)
  try{
    const p = path.resolve(item.url)
    await fs.unlink(p)
  }catch{}
  await sock.sendMessage(gid,{ text:'💫 Audio eliminado con éxito 🎀'},{ quoted: msg })
}
