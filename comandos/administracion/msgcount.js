/**
 * name: msgcount
 * aliases: ["count","messages","mensajes"]
 * description: Muestra conteo de mensajes de un usuario
 * category: Administración
 */

import { requireGroup, mentionTarget, nowBogotaISODate, sumDays } from './_common.js'

export async function run(ctx){
  const { sock, msg, args, db, files } = ctx
  const { GROUPSTATS_FILE } = files
  const { ok, gid } = await requireGroup(sock, msg)
  if(!ok) return sock.sendMessage(msg.key.remoteJid,{text:'🌸 Este comando solo funciona en grupos 💫'},{quoted:msg})
  const days = Math.max(1, parseInt(args[1]||args[0]||'7',10)||7)
  const target = mentionTarget(msg, args)
  const stats = await db.loadJSON(GROUPSTATS_FILE,{})
  const su = stats[gid]?.users?.[target]
  if(!target || !su) return sock.sendMessage(gid,{text:'🌸 No tengo registros para esa personita 💫'},{quoted:msg})
  const totalDays = sumDays(su.byDay, days)
  await sock.sendMessage(gid,{text:`✨ Mensajes de ${target}: últimos ${days} días → ${totalDays} (total: ${su.total})`},{quoted:msg})
}
