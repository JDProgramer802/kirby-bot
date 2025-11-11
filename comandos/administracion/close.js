/**
 * name: close
 * aliases: []
 * description: Cierra el grupo (modo anuncios/solo admins)
 * category: Administración
 */

import { requireGroup, isAdmin, isBotAdmin } from './_common.js'

export async function run(ctx){
  const { sock, msg, args } = ctx
  const { ok, gid } = await requireGroup(sock, msg)
  if(!ok) return sock.sendMessage(msg.key.remoteJid,{text:'🌸 Este comando solo funciona en grupos 💫'},{quoted:msg})
  const sender = msg.key?.participant || gid
  if(!(await isAdmin(sock,gid,sender))) return sock.sendMessage(gid,{text:'🌸 Comando solo para administradores 💕'},{quoted:msg})
  // No bloquear por isBotAdmin; intentar y capturar
  let botIsAdmin = true
  try{ botIsAdmin = await isBotAdmin(sock,gid) } catch {}
  try{
    // Intento 1: string API
    try { await sock.groupSettingUpdate(gid,'announcement') } catch {}
    // Intento 2: objeto API
    try { await sock.groupSettingUpdate(gid, { announcement: true }) } catch {}
    // Verificar estado real
    let okClosed = false
    let meta
    try { meta = await sock.groupMetadata(gid); okClosed = meta?.announce === true } catch {}
    if(okClosed){
      await sock.sendMessage(gid,{text:'🔒 Grupo cerrado (solo admins) 💖'},{quoted:msg})
    } else {
      const wantDebug = (args||[]).includes('debug')
      let extra = ''
      if (wantDebug && meta) {
        const me = sock.user?.id
        const bare = (j)=> String(j||'').split(':')[0].split('@')[0]
        const admins = (meta.participants||[]).filter(p=>p.admin)
        const adminsList = admins.map(p=>`- ${p.id} -> ${bare(p.id)}`).join('\n')
        extra = `\n\n*🔧 Debug*\nme: ${me}\nme(bare): ${bare(me)}\nannounce: ${String(meta?.announce)}\nadmins:\n${adminsList||'(vacío)'}\n`
      }
      await sock.sendMessage(gid,{text:`🌸 Intenté cerrar el grupo pero sigue abierto. ${botIsAdmin? 'Puede estar bloqueado por Comunidad o políticas del grupo.' : 'Parece que no tengo admin.'}${extra}`},{quoted:msg})
    }
  }catch{
    await sock.sendMessage(gid,{text:'🌸 No pude cerrar el grupo, intenta más tarde ✨'},{quoted:msg})
  }
}
