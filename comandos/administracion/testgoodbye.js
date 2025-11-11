/**
 * name: testgoodbye
 * aliases: []
 * description: Previsualiza el mensaje de despedida configurado
 * category: Administración
 */

import { ensureGroupConfig, requireGroup, isAdmin } from './_common.js'

export async function run(ctx){
  const { sock, msg, db, files } = ctx
  const { GROUPS_FILE } = files
  const { ok, gid } = await requireGroup(sock, msg)
  if(!ok) return sock.sendMessage(msg.key.remoteJid,{text:'🌸 Este comando solo funciona en grupos 💫'},{quoted:msg})
  const sender = msg.key?.participant || gid
  if(!(await isAdmin(sock,gid,sender))) return sock.sendMessage(gid,{text:'🌸 Comando solo para administradores 💕'},{quoted:msg})
  const groups = await ensureGroupConfig(GROUPS_FILE, db, gid)
  const conf = groups[gid] || {}
  const text = conf.goodbyeMsg || '💫 {mentions} ha salido de {grupo}. ¡Hasta pronto!'
  await sock.sendMessage(gid,{ text },{ quoted: msg })
}
