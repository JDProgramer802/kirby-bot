/**
 * name: open
 * aliases: []
 * description: Abre el grupo para todos (not_announcement)
 * category: Administración
 */

import { requireGroup, isAdmin, isBotAdmin } from './_common.js'

export async function run(ctx){
  const { sock, msg, args } = ctx
  const { ok, gid } = await requireGroup(sock, msg)
  if(!ok) return sock.sendMessage(msg.key.remoteJid,{text:'🌸 Este comando solo funciona en grupos 💫'},{quoted:msg})
  const sender = msg.key?.participant || gid
  if(!(await isAdmin(sock,gid,sender))) return sock.sendMessage(gid,{text:'🌸 Comando solo para administradores 💕'},{quoted:msg})
  // No bloquear por isBotAdmin; intentar y capturar error de permisos
  let botIsAdmin = true
  try{ botIsAdmin = await isBotAdmin(sock,gid) } catch {}
  try{
    const sleep = (ms)=> new Promise(r=>setTimeout(r,ms))
    const tryOpenOnce = async ()=>{
      // Intento 1: string API
      try { await sock.groupSettingUpdate(gid,'not_announcement') } catch {}
      // Intento 2: objeto API (algunas versiones de Baileys)
      try { await sock.groupSettingUpdate(gid, { announcement: false }) } catch {}
    }
    // Reintentar hasta 3 veces para evitar timeouts transitorios de red
    for (let i=0;i<3;i++){
      try { await tryOpenOnce() } catch {}
      // Pequeña espera entre intentos
      if(i<2) await sleep(500)
    }
    // Verificar estado real
    let okOpen = false
    let meta
    try { meta = await sock.groupMetadata(gid); okOpen = meta?.announce === false } catch {}
    if(okOpen){
      await sock.sendMessage(gid,{text:'🔓 Grupo abierto para todos 🌸'},{quoted:msg})
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
      await sock.sendMessage(gid,{text:`🌸 Intenté abrir el grupo pero sigue en modo anuncios. ${botIsAdmin? 'Puede estar bloqueado por Comunidad o políticas del grupo.' : 'Parece que no tengo admin.'}${extra}`},{quoted:msg})
    }
  }catch{
    await sock.sendMessage(gid,{text:'🌸 No pude abrir el grupo, intenta más tarde ✨'},{quoted:msg})
  }
}
