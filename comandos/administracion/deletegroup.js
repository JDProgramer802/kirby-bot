/**
 * name: deletegroup
 * aliases: ["delgrupo","nuke","purgegroup"]
 * description: Elimina un grupo (expulsa a todos, revoca enlaces y el bot sale). Requiere confirmación.
 * category: Administración
 */

export async function run(ctx){
  const { sock, msg, args = [], PREFIX } = ctx
  const gid = msg.key.remoteJid
  const isGroup = gid?.endsWith('@g.us')
  if(!isGroup) return sock.sendMessage(gid,{text:'Este comando solo funciona en grupos.'},{quoted:msg})

  const meta = await sock.groupMetadata(gid)
  // Detectar JID del bot de forma robusta
  const rawMe = sock.user?.id || ''
  const botNum = rawMe.split(':')[0]
  const me = (meta.participants||[]).find(p => (p.id||'').includes(botNum))?.id || rawMe
  const sender = msg.key.participant || msg.participant || msg.key.remoteJid
  const admins = (meta.participants||[]).filter(p=>['admin','superadmin'].includes(p.admin)).map(p=>p.id)
  const isSenderAdmin = admins.includes(sender)
  const isBotAdmin = admins.includes(me)
  if(!isSenderAdmin) return sock.sendMessage(gid,{text:'Necesitas ser administrador del grupo para usar este comando.'},{quoted:msg})
  if(!isBotAdmin) return sock.sendMessage(gid,{text:'Necesito permisos de administrador para proceder.'},{quoted:msg})

  const confirmWord = (args[0]||'').toLowerCase()
  const groupName = meta.subject || 'este grupo'
  const needConfirm = !(confirmWord === 'confirmar' || confirmWord === 'confirm' || confirmWord === '--confirm')
  if(needConfirm){
    const tip = [`⚠️ Esta acción eliminará a todos los miembros de *${groupName}* y el bot saldrá.`,
                 `No es reversible.`,
                 `Para continuar usa: \`${PREFIX||'$'}deletegroup confirmar\``].join('\n')
    return sock.sendMessage(gid,{text: tip},{quoted: msg})
  }

  try {
    await sock.sendMessage(gid,{text:'Procesando eliminación… cerrando el grupo y expulsando miembros.'},{quoted:msg})
    try { await sock.groupSettingUpdate(gid,'announcement') } catch {}
    try { await sock.groupRevokeInvite(gid) } catch {}
    try { await sock.groupUpdateSubject(gid, `【CERRADO】${groupName}`) } catch {}
    try { await sock.groupUpdateDescription(gid, 'Grupo cerrado por administración. ✦') } catch {}

    const participants = (meta.participants||[]).map(p=>p.id)
    const toKick = participants.filter(j=> j !== me)

    const chunk = (arr, size)=> arr.reduce((acc,_,i)=> (i%size? acc[acc.length-1].push(arr[i]) : acc.push([arr[i]]), acc), [])
    const batches = chunk(toKick, 10)
    for(const batch of batches){
      try{ await sock.groupParticipantsUpdate(gid, batch, 'remove') }catch{}
      await new Promise(r=>setTimeout(r, 800))
    }

    await sock.sendMessage(gid,{text:'Grupo limpiado. El bot abandonará ahora.'},{quoted:msg})
    await sock.groupLeave(gid)
  } catch (e) {
    await sock.sendMessage(gid,{text:`Ocurrió un error al eliminar el grupo.`},{quoted:msg})
  }
}
