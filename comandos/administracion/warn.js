/**
 * name: warn
 * aliases: []
 * description: Agrega advertencia a usuario. Si supera límite, expulsar
 * category: Administración
 */

import { ensureGroupConfig, saveGroups, requireGroup, isAdmin, isBotAdmin, mentionTarget, nowBogotaISODate } from './_common.js'
const bare = (j)=> String(j||'').split(':')[0].split('@')[0]

export async function run(ctx){
  const { sock, msg, args, db, files } = ctx
  const { GROUPS_FILE } = files
  const { ok, gid } = await requireGroup(sock, msg)
  if(!ok) return sock.sendMessage(msg.key.remoteJid,{text:'🌸 Este comando solo funciona en grupos 💫'},{quoted:msg})
  const sender = msg.key?.participant || gid
  if(!(await isAdmin(sock,gid,sender))) return sock.sendMessage(gid,{text:'🌸 Comando solo para administradores 💕'},{quoted:msg})

  const target = mentionTarget(msg, args)
  const reason = args.slice(target?1:0).join(' ').trim() || 'sin motivo'
  if(!target) return sock.sendMessage(gid,{text:'✨ Usa: $warn @usuario <razón>'},{quoted:msg})

  const groups = await ensureGroupConfig(GROUPS_FILE, db, gid)
  const conf = groups[gid]
  conf.warns[target] ||= []
  const id = `w${Date.now()}`
  conf.warns[target].push({ id, by: sender, reason, at: Math.floor(Date.now()/1000) })
  await saveGroups(GROUPS_FILE, db, groups)

  const total = conf.warns[target].length
  const limit = conf.warnLimit || 3
  await sock.sendMessage(gid,{text:`🚩 Warn agregado a ${target} — total: ${total}/${limit} 🌸 Razón: ${reason}`},{quoted:msg})

  if(total >= limit){
    let meta
    try { meta = await sock.groupMetadata(gid) } catch {}
    let resolved = target
    try{
      const list = (meta?.participants||[]).map(p=>p.id)
      const wanted = bare(target)
      const found = list.find(j => bare(j) === wanted)
      if(found) resolved = found
    }catch{}
    let botIsAdmin = true
    try{ botIsAdmin = await isBotAdmin(sock,gid) } catch {}
    try{
      await sock.groupParticipantsUpdate(gid,[resolved],'remove')
      await sock.sendMessage(gid,{text:'💫 Límite superado, usuario expulsado 🌸'},{quoted:msg})
    }catch{
      await sock.sendMessage(gid,{text:`🚨 Límite superado, pero no pude expulsar. ${botIsAdmin? 'Puede ser restricción del grupo o del usuario.' : 'Parece que no tengo admin.'}`},{quoted:msg})
    }
  }
}
