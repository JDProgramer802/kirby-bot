/**
 * name: demote
 * aliases: []
 * description: Degrada administrador
 * category: Administración
 */

import { requireGroup, isAdmin, isBotAdmin, mentionTarget, kirbyAdminCard } from './_common.js'
const bare = (j)=> String(j||'').split(':')[0].split('@')[0]

export async function run(ctx){
  const { sock, msg } = ctx
  const { ok, gid } = await requireGroup(sock, msg)
  if(!ok){
    const card = kirbyAdminCard('demote', {
      lines:[ '👑 Acción: **Demote**', '🏡 Ámbito: *Grupos*' ],
      quote:'🌸 Este comando solo funciona en grupos 💫',
      note:'💫 _Usa esta magia dentro de Dreamland._'
    })
    return sock.sendMessage(msg.key.remoteJid,{ text: card },{ quoted: msg })
  }
  const sender = msg.key?.participant || gid
  if(!(await isAdmin(sock,gid,sender))){
    const card = kirbyAdminCard('demote', {
      lines:[ '👑 Acción: **Demote**', `👤 Ejecutado por: **@${bare(sender)}**` ],
      quote:'🌸 Comando solo para administradores 💕',
      note:'🛡️ _Pide a un admin que invoque este poder._'
    })
    return sock.sendMessage(gid,{ text: card, mentions:[sender] },{ quoted: msg })
  }
  let rawTarget = mentionTarget(msg, [])
  if(!rawTarget){
    const card = kirbyAdminCard('demote', {
      lines:[ '👑 Acción: **Demote**', '📌 Uso: *$demote @usuario*' ],
      quote:'✨ Menciona a quien degradar',
      note:'🌙 _A veces bajar un poco ayuda a brillar después._'
    })
    return sock.sendMessage(gid,{ text: card },{ quoted: msg })
  }
  let meta
  try { meta = await sock.groupMetadata(gid) } catch {}
  let resolved = rawTarget
  try{
    const list = (meta?.participants||[]).map(p=>p.id)
    const wanted = bare(rawTarget)
    const found = list.find(j => bare(j) === wanted)
    if(found) resolved = found
  }catch{}
  let botIsAdmin = true
  try{ botIsAdmin = await isBotAdmin(sock,gid) } catch {}
  try{
    await sock.groupParticipantsUpdate(gid,[resolved],'demote')
    const gname = meta?.subject || 'Dreamland'
    const card = kirbyAdminCard('demote', {
      lines:[ '👑 Acción: **Demote**', `👤 Usuario: **@${bare(resolved)}**`, `📍 Grupo: *${gname}*` ],
      quote:'🌸 *Listo.* El usuario ya no es admin.',
      note:'🌙 _Descansar también es parte del cielo._'
    })
    await sock.sendMessage(gid,{ text: card, mentions:[resolved] },{ quoted: msg })
  }catch{
    let extra = ''
    if(meta){
      const me = sock.user?.id
      const admins = (meta.participants||[]).filter(p=>p.admin).map(p=>`@${bare(p.id)}`).join(', ')
      extra = `\n> 🤖 Yo: @${bare(me)}\n> Bot admin: ${botIsAdmin ? 'sí' : 'no'}\n> Admins: ${admins||'(sin admins)'}\n`
    }
    const card = kirbyAdminCard('demote', {
      lines:[ '👑 Acción: **Demote**', `🎯 Objetivo: **@${bare(resolved)}**` ],
      quote:`🌸 No pude degradar. ${botIsAdmin? '*Puede ser restricción del grupo o del usuario.*' : '*Parece que no tengo admin.*'}${extra}`,
      note:'🛠️ _Otorga permisos de admin al bot y reintenta._'
    })
    await sock.sendMessage(gid,{ text: card, mentions:[resolved] },{ quoted: msg })
  }
}
