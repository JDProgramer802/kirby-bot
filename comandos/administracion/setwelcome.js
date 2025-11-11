/**
 * name: setwelcome
 * aliases: []
 * description: Define mensaje personalizado de bienvenida
 * category: Administración
 */

import { ensureGroupConfig, saveGroups, requireGroup, isAdmin } from './_common.js'

export async function run(ctx){
  const { sock, msg, args, db, files, PREFIX, rawCmd } = ctx
  const { GROUPS_FILE } = files
  const { ok, gid } = await requireGroup(sock, msg)
  if(!ok) return sock.sendMessage(msg.key.remoteJid,{text:'🌸 Este comando solo funciona en grupos 💫'},{quoted:msg})
  const sender = msg.key?.participant || gid
  if(!(await isAdmin(sock,gid,sender))) return sock.sendMessage(gid,{text:'🌸 Comando solo para administradores 💕'},{quoted:msg})
  // Tomar el texto original para preservar saltos de línea
  const full = msg.message?.extendedTextMessage?.text || msg.message?.conversation || ''
  const needle = (PREFIX + (rawCmd || 'setwelcome')).toLowerCase()
  const idx = full.toLowerCase().indexOf(needle)
  const text = idx >= 0 ? full.slice(idx + needle.length).replace(/^\s+/,'') : args.join(' ')
  if(!text.trim()) return sock.sendMessage(gid,{text:'✨ Escribe el mensaje. Ej: $setwelcome ¡Bienvenid@ a Dreamland!'},{quoted:msg})
  const groups = await ensureGroupConfig(GROUPS_FILE, db, gid)
  groups[gid].welcomeMsg = text
  await saveGroups(GROUPS_FILE, db, groups)
  await sock.sendMessage(gid,{text:'🎀 ¡Listo! Mensaje de bienvenida actualizado 💖'},{quoted:msg})
}
