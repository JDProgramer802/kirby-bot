/**
 * name: setprimary
 * aliases: []
 * description: Define el bot primario del grupo (solo owner)
 * category: Administración
 */

import { ensureGroupConfig, saveGroups, requireGroup } from './_common.js'

export async function run(ctx){
  const { sock, msg, args, db, files } = ctx
  const owner = process.env.BOT_OWNER || ''
  const { GROUPS_FILE } = files
  const { ok, gid } = await requireGroup(sock, msg)
  if(!ok) return sock.sendMessage(msg.key.remoteJid,{text:'🌸 Este comando solo funciona en grupos 💫'},{quoted:msg})
  const sender = msg.key?.participant || gid
  if(owner && sender !== owner) return sock.sendMessage(gid,{text:'🌸 Solo mi dueñ@ puede usar este comando 💕'},{quoted:msg})
  const b = args[0]; if(!b) return sock.sendMessage(gid,{text:'✨ Usa: $setprimary @bot'},{quoted:msg})
  const groups = await ensureGroupConfig(GROUPS_FILE, db, gid)
  groups[gid].primaryBot = b
  await saveGroups(GROUPS_FILE, db, groups)
  await sock.sendMessage(gid,{text:'🎀 ¡Listo! Bot primario definido 💖'},{quoted:msg})
}
