/**
 * name: listaudios
 * aliases: ["audios","allaudios"]
 * description: Lista todos los audios registrados
 * category: Audios
 */

import { ensureAudioDB } from './_common.js'

export async function run(ctx){
  const { sock, msg, files, db } = ctx
  const gid = msg.key.remoteJid
  const { aud } = await ensureAudioDB(files, db)
  const list = (aud.audios||[]).slice().sort((a,b)=> (a.trigger||'').localeCompare(b.trigger||''))
  if(!list.length) return sock.sendMessage(gid,{ text:'🌸 No hay audios registrados todavía 💫'},{ quoted: msg })
  const lines = ['🎵 Audios registrados:']
  list.forEach(a=> lines.push(`• ${a.trigger}${a.groupOnly?' (solo grupos)':''}`))
  await sock.sendMessage(gid,{ text: lines.join('\n') },{ quoted: msg })
}
