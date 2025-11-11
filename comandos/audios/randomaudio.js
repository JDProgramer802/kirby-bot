/**
 * name: randomaudio
 * aliases: ["rndaudio","azar"]
 * description: Reproduce un audio aleatorio de la lista
 * category: Audios
 */

import { ensureAudioDB } from './_common.js'

export async function run(ctx){
  const { sock, msg, files, db } = ctx
  const gid = msg.key.remoteJid
  const isGroup = gid?.endsWith('@g.us')
  const { aud } = await ensureAudioDB(files, db)
  const list = (aud.audios||[]).filter(a=> isGroup || !a.groupOnly)
  if(!list.length) return sock.sendMessage(gid,{ text:'🌸 No hay audios disponibles para este chat 💫'},{ quoted: msg })
  const item = list[Math.floor(Math.random()*list.length)]
  await sock.sendMessage(gid,{ audio: { url: item.url }, mimetype: 'audio/mpeg', ptt: false },{ quoted: msg })
}
