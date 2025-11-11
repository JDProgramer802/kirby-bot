/**
 * name: topinactive
 * aliases: ["topinactivos","topinactiveusers"]
 * description: Usuarios menos activos
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
  const usersStats = stats[gid]?.users || {}
  let members = []
  try{
    const meta = await sock.groupMetadata(gid)
    members = meta.participants?.map(p=>p.id) || []
  }catch{}
  if(!members.length) return sock.sendMessage(gid,{text:'🌸 No pude obtener miembros del grupo 💫'},{quoted:msg})

  const rows = members.map(jid=>{
    const u = usersStats[jid]
    const total = u ? sumDays(u.byDay||{}, days) : 0
    return { jid, total }
  }).sort((a,b)=>a.total-b.total).slice(0,10)

  const lines = [`🌟 Menos activos — últimos ${days} días`]
  rows.forEach((r,i)=> lines.push(`${i+1}. @${bare(r.jid)} — ${r.total}`))
  const mentions = rows.map(r=> r.jid)
  await sock.sendMessage(gid,{ text: lines.join('\n'), mentions },{ quoted: msg })
}
