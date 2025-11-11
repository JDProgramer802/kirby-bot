/**
 * name: clearaudios
 * aliases: ["borraraudios"]
 * description: Elimina todos los audios (solo owner)
 * category: Audios
 */

import { promises as fs } from 'fs'
import path from 'path'

export async function run(ctx){
  const { sock, msg, files, db } = ctx
  const gid = msg.key.remoteJid
  const owner = process.env.BOT_OWNER || ''
  const jid = msg.key?.participant || gid
  if(!owner || jid !== owner){
    return sock.sendMessage(gid,{ text:'🚫 Solo mi dueñ@ puede usar este comando 💔'},{ quoted: msg })
  }
  const aud = await db.loadJSON(files.AUDIOS_DB, { audios: [] })
  const list = aud.audios || []
  // Borrar archivos
  for (const it of list){
    try{ await fs.unlink(path.resolve(it.url)) }catch{}
  }
  aud.audios = []
  await db.saveJSON(files.AUDIOS_DB, aud)
  await sock.sendMessage(gid,{ text:'🧹 Audios limpiados. Dreamland en silencio (por ahora) 🌸'},{ quoted: msg })
}
