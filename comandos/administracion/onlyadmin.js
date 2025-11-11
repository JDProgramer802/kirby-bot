/**
 * name: onlyadmin
 * aliases: ["onlyadmins"]
 * description: Restringe comandos solo para administradores
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
  const v=(args[0]||'').toLowerCase(); if(!['enable','disable'].includes(v)) return sock.sendMessage(gid,{text:'✨ Usa: $onlyadmin enable | disable'},{quoted:msg})
  const groups = await ensureGroupConfig(GROUPS_FILE, db, gid)
  groups[gid].onlyAdmin = v==='enable'
  await saveGroups(GROUPS_FILE, db, groups)
  await sock.sendMessage(gid,{text:'🎀 ¡Listo! Restricción actualizada 💖'},{quoted:msg})
}
