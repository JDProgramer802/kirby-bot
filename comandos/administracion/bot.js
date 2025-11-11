/**
 * name: bot
 * aliases: []
 * description: Activa/desactiva al bot en el grupo
 * category: Administración
 */

import { ensureGroupConfig, saveGroups, requireGroup, isAdmin } from './_common.js'

export async function run(ctx){
  const { sock, msg, args, db, files } = ctx
  const { GROUPS_FILE } = files
  const { ok, gid } = await requireGroup(sock, msg)
  if (!ok) return sock.sendMessage(msg.key.remoteJid,{text:'🌸 Este comando solo funciona en grupos 💫'},{quoted:msg})
  const sender = msg.key?.participant || gid
  if (!(await isAdmin(sock, gid, sender))) return sock.sendMessage(gid,{text:'🌸 Comando solo para administradores 💕'},{quoted:msg})
  const groups = await ensureGroupConfig(GROUPS_FILE, db, gid)
  const v = (args[0]||'').toLowerCase()
  if (!['enable','disable'].includes(v)) return sock.sendMessage(gid,{text:'✨ Usa: $bot enable | disable'},{quoted:msg})
  groups[gid].active = v === 'enable'
  await saveGroups(GROUPS_FILE, db, groups)
  await sock.sendMessage(gid,{text:'🎀 ¡Listo! Estado del bot actualizado 💖'},{quoted:msg})
}
