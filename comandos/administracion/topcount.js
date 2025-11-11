/**
 * name: topcount
 * aliases: ["topmessages","topmsgcount","topmensajes"]
 * description: Top usuarios con más mensajes
 * category: Administración
 */

import { requireGroup, sumDays } from './_common.js'
const bare = (j)=> String(j||'').split(':')[0].split('@')[0]

export async function run(ctx){
  const { sock, msg, args, db, files } = ctx
  const { GROUPSTATS_FILE } = files
  const { ok, gid } = await requireGroup(sock, msg)
  if(!ok) return sock.sendMessage(msg.key.remoteJid,{text:'🌸 Este comando solo funciona en grupos 💫'},{quoted:msg})

  const days = Math.max(1, parseInt(args[0]||'7',10)||7)
  const stats = await db.loadJSON(GROUPSTATS_FILE,{})
  const users = stats[gid]?.users || {}
  const rows = Object.entries(users).map(([jid, u])=>({ jid, total: sumDays(u.byDay||{}, days) }))
    .sort((a,b)=>b.total-a.total).slice(0,10)
  if(!rows.length) return sock.sendMessage(gid,{text:'🌸 Aún no hay actividad registrada 💫'},{quoted:msg})
  const lines = [`🌟 Top mensajes — últimos ${days} días`]
  rows.forEach((r,i)=> lines.push(`${i+1}. @${bare(r.jid)} — ${r.total}`))
  const mentions = rows.map(r=> r.jid)
  await sock.sendMessage(gid,{ text: lines.join('\n'), mentions },{ quoted: msg })
}
