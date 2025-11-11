/**
 * name: setwarnlimit
 * aliases: []
 * description: Define límite de advertencias (1–10)
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
  const n = parseInt(args[0],10)
  if (!Number.isFinite(n)) return sock.sendMessage(gid,{text:'✨ Usa: $setwarnlimit <número 1–10>'},{quoted:msg})
  const limit = Math.min(10, Math.max(1, n))
  const groups = await ensureGroupConfig(GROUPS_FILE, db, gid)
  groups[gid].warnLimit = limit
  await saveGroups(GROUPS_FILE, db, groups)
  await sock.sendMessage(gid,{text:`🎀 ¡Listo! Límite de warns establecido en ${limit}`},{quoted:msg})
}
