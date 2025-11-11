/**
 * name: serielist
 * aliases: ["slist","animelist"]
 * description: Lista todas las series disponibles
 * category: Gacha
 */

import { ensureStores } from './_common.js'

export async function run(ctx){
  const { sock, msg, files, db } = ctx
  await ensureStores(files, db)
  const gid = msg.key.remoteJid
  const chars = await db.loadJSON(files.CHARACTERS_FILE,{})
  const set = new Set(Object.values(chars).map(c => c.serie).filter(Boolean))
  if(!set.size) return sock.sendMessage(gid,{text:'🌸 No hay series registradas aún 💫'},{quoted:msg})
  const lines = ['📚 Series disponibles:']
  Array.from(set).sort((a,b)=> (a||'').localeCompare(b||'')).forEach(s => lines.push(`• ${s}`))
  await sock.sendMessage(gid,{ text: lines.join('\n') },{ quoted: msg })
}
