/**
 * name: waifusboard
 * aliases: ["waifustop","topwaifus","wtop"]
 * description: Top de personajes con mayor valor
 * category: Gacha
 */

import { ensureStores } from './_common.js'

export async function run(ctx){
  const { sock, msg, args, files, db, util } = ctx
  await ensureStores(files, db)
  const gid = msg.key.remoteJid
  const n = Math.max(1, parseInt(args[0]||'10',10)||10)
  const chars = await db.loadJSON(files.CHARACTERS_FILE,{})
  const list = Object.values(chars)
    .map(c=>({ name:c.name, serie:c.serie, value:Number(c.value||0), owner:c.owner||'' }))
    .sort((a,b)=> b.value - a.value)
    .slice(0, n)
  if(!list.length) return sock.sendMessage(gid,{text:'🌸 No hay personajes en el catálogo todavía 💫'},{quoted:msg})
  const lines = ['🌟 Top waifus/husbandos por valor']
  list.forEach((c,i)=> lines.push(`${i+1}. ${c.name} — ${c.serie||'—'} — ${util.formatKirby(c.value)}${c.owner?` — owner: ${c.owner}`:''}`))
  await sock.sendMessage(gid,{ text: lines.join('\n') },{ quoted: msg })
}
