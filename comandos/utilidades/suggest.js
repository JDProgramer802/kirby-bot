/**
 * name: suggest
 * aliases: ["add","addanime","report"]
 * description: Guarda una sugerencia en /data/suggestions.json con nombre, fecha y texto.
 * category: Utilidades
 */

import path from 'path'
import moment from 'moment-timezone'

export async function run(ctx){
  const { sock, msg, db } = ctx
  const gid = msg.key.remoteJid
  const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
  const argsTxt = text.split(/\s+/).slice(1).join(' ').trim()
  if(!argsTxt){
    return sock.sendMessage(gid,{ text:'🌸 Escribe tu sugerencia después del comando, Dreamer~ 💖' },{ quoted: msg })
  }
  const SUG_FILE = path.resolve('data','suggestions.json')
  const store = await db.loadJSON(SUG_FILE, { suggestions: [] })
  const nextId = (store.suggestions.at(-1)?.id || 0) + 1
  const entry = {
    id: nextId,
    name: msg.pushName || (msg.key?.participant||'') ,
    text: argsTxt,
    date: moment.tz('America/Bogota').toDate().toISOString(),
  }
  store.suggestions.push(entry)
  await db.saveJSON(SUG_FILE, store)
  await sock.sendMessage(gid,{ text:'🎀 ¡Gracias por tu sugerencia! La guardé con cariño 💫' },{ quoted: msg })
}
