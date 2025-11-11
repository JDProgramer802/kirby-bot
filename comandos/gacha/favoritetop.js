/**
 * name: favoritetop
 * aliases: ["favtop"]
 * description: Top global de personajes favoritos
 * category: Gacha
 */

import { ensureStores } from './_common.js'

export async function run(ctx){
  const { sock, msg, files, db } = ctx
  await ensureStores(files, db)
  const gid = msg.key.remoteJid
  const users = await db.loadJSON(files.USERS_FILE,{})
  const count = {}
  for(const u of Object.values(users)){
    const fav = (u && u.favourite)||''
    if(fav) count[fav] = (count[fav]||0)+1
  }
  const rows = Object.entries(count).sort((a,b)=>b[1]-a[1]).slice(0,10)
  if(!rows.length) return sock.sendMessage(gid,{text:'🌸 Nadie ha definido favorito aún 💫'},{quoted:msg})
  const lines = ['🌟 Top favoritos']
  rows.forEach(([name, n], i)=> lines.push(`${i+1}. ${name} — ${n}`))
  await sock.sendMessage(gid,{ text: lines.join('\n') },{ quoted: msg })
}
