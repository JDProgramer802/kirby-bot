/**
 * name: warns
 * aliases: []
 * description: Muestra advertencias activas del usuario
 * category: Administración
 */

import { ensureGroupConfig, requireGroup, mentionTarget } from './_common.js'

export async function run(ctx){
  const { sock, msg, args, db, files } = ctx
  const { GROUPS_FILE } = files
  const { ok, gid } = await requireGroup(sock, msg)
  if(!ok) return sock.sendMessage(msg.key.remoteJid,{text:'🌸 Este comando solo funciona en grupos 💫'},{quoted:msg})

  const target = mentionTarget(msg, args)
  if(!target) return sock.sendMessage(gid,{text:'✨ Usa: $warns @usuario'},{quoted:msg})

  const groups = await ensureGroupConfig(GROUPS_FILE, db, gid)
  const list = groups[gid].warns[target] || []
  if(!list.length) return sock.sendMessage(gid,{text:'🌸 Esa personita no tiene advertencias activas 💫'},{quoted:msg})

  const lines = ['🚩 Advertencias:']
  list.forEach((w,i)=> lines.push(`${i+1}. ${w.reason} — por ${w.by} — id:${w.id}`))
  await sock.sendMessage(gid,{ text: lines.join('\n') },{ quoted: msg })
}
