/**
 * name: kick
 * aliases: []
 * description: Expulsa usuario del grupo
 * category: Administración
 */

import { requireGroup, isAdmin, isBotAdmin, mentionTarget, kirbyAdminCard } from './_common.js'
const bare = (j)=> String(j||'').split(':')[0].split('@')[0]

export async function run(ctx){
  const { sock, msg } = ctx
  const { ok, gid } = await requireGroup(sock, msg)
  if(!ok){
    const card = kirbyAdminCard('kick', {
      lines:[ '🧹 Acción: **Kick**', '🏡 Ámbito: *Grupos*' ],
      quote:'🌸 Este comando solo funciona en grupos 💫',
      note:'💫 _Usa esta magia dentro de Dreamland._'
    })
    return sock.sendMessage(msg.key.remoteJid,{ text: card },{ quoted: msg })
  }
  const sender = msg.key?.participant || gid
  if(!(await isAdmin(sock,gid,sender))){
    const card = kirbyAdminCard('kick', {
      lines:[ '🧹 Acción: **Kick**', `👤 Ejecutado por: **@${bare(sender)}**` ],
      quote:'🌸 Comando solo para administradores 💕',
      note:'🛡️ _Pide a un admin que invoque este poder._'
    })
    return sock.sendMessage(gid,{ text: card, mentions:[sender] },{ quoted: msg })
  }
  // Resolver target compatible con LID o s.whatsapp.net
  let rawTarget = mentionTarget(msg, [])
  if(!rawTarget){
    const card = kirbyAdminCard('kick', {
      lines:[ '🧹 Acción: **Kick**', '📌 Uso: *$kick @usuario*' ],
      quote:'✨ Menciona a quien expulsar',
      note:'🧹 _Dreamland se mantiene limpito._'
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
    await sock.groupParticipantsUpdate(gid,[resolved],'remove')
    const gname = meta?.subject || 'Dreamland'
    const card = kirbyAdminCard('kick', {
      lines:[ '🧹 Acción: **Kick**', `👤 Usuario: **@${bare(resolved)}**`, `📍 Grupo: *${gname}*` ],
      quote:'🌸 *Listo.* Usuario expulsado.',
      note:'🌟 _Que las estrellitas lo guíen afuera._'
    })
    await sock.sendMessage(gid,{ text: card, mentions:[resolved] },{ quoted: msg })
  }catch{
    let extra = ''
    if(meta){
      const me = sock.user?.id
      const admins = (meta.participants||[]).filter(p=>p.admin).map(p=>`@${bare(p.id)}`).join(', ')
      extra = `\n> 🤖 Yo: @${bare(me)}\n> Bot admin: ${botIsAdmin ? 'sí' : 'no'}\n> Admins: ${admins||'(sin admins)'}\n`
    }
    const card = kirbyAdminCard('kick', {
      lines:[ '🧹 Acción: **Kick**', `🎯 Objetivo: **@${bare(resolved)}**` ],
      quote:`🌸 No pude expulsar. ${botIsAdmin? '*Puede ser restricción del grupo o del usuario.*' : '*Parece que no tengo admin.*'}${extra}`,
      note:'🛠️ _Otorga permisos de admin al bot y reintenta._'
    })
    await sock.sendMessage(gid,{ text: card, mentions:[resolved] },{ quoted: msg })
  }
}
