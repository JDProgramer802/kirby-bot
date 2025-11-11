/**
 * name: tag
 * aliases: ["hidetag","tagsay","tagall"]
 * description: Menciona a todos los miembros
 * category: Administración
 */

import { requireGroup, isAdmin } from './_common.js'

export async function run(ctx){
  const { sock, msg, args } = ctx
  const { ok, gid } = await requireGroup(sock, msg)
  if(!ok) return sock.sendMessage(msg.key.remoteJid,{text:'🌸 Este comando solo funciona en grupos 💫'},{quoted:msg})
  const sender = msg.key?.participant || gid
  if(!(await isAdmin(sock,gid,sender))) return sock.sendMessage(gid,{text:'🌸 Comando solo para administradores 💕'},{quoted:msg})
  try{
    const meta = await sock.groupMetadata(gid)
    const members = meta.participants?.map(p=>p.id) || []
    const text = args.length ? args.join(' ') : '🌸 ¡Dreamland los saluda a tod@s!'
    await sock.sendMessage(gid,{ text, mentions: members },{ quoted: msg })
  }catch{ await sock.sendMessage(gid,{text:'🌸 No pude mencionar a todos ahora, intenta de nuevo ✨'},{quoted:msg}) }
}
