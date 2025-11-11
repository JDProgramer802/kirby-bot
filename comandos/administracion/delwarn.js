/**
 * name: delwarn
 * aliases: []
 * description: Elimina advertencia específica por índice
 * category: Administración
 */

import { ensureGroupConfig, saveGroups, requireGroup, isAdmin } from './_common.js'

export async function run(ctx){
  const { sock, msg, args, db, files } = ctx
  const { GROUPS_FILE } = files
  const { ok, gid } = await requireGroup(sock, msg)
  if(!ok) return sock.sendMessage(msg.key.remoteJid,{text:'🌸 Este comando solo funciona en grupos 💫'},{quoted:msg})
  const sender = msg.key?.participant || gid
  if(!(await isAdmin(sock,gid,sender))) return sock.sendMessage(gid,{text:'🌸 Comando solo para administradores 💕'},{quoted:msg})
  const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || args[0]
  const idx = parseInt(args[1]||'0',10)-1
  if(!target || isNaN(idx)) return sock.sendMessage(gid,{text:'✨ Usa: $delwarn @usuario <número>'},{quoted:msg})
  const groups = await ensureGroupConfig(GROUPS_FILE, db, gid)
  const arr = groups[gid].warns[target] || []
  if(idx<0 || idx>=arr.length) return sock.sendMessage(gid,{text:'💫 Índice inválido'},{quoted:msg})
  arr.splice(idx,1)
  groups[gid].warns[target] = arr
  await saveGroups(GROUPS_FILE, db, groups)
  await sock.sendMessage(gid,{text:`🎀 Listo. Advertencias ahora: ${arr.length}`},{quoted:msg})
}
