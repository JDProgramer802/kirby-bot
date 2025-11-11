/**
 * name: approve
 * aliases: ["aprobar","aprove","aprv"]
 * description: Aprueba solicitudes de ingreso al grupo. Uso: $approve [cantidad] [recientes|antiguas|random]
 * category: Utilidades
 */

export async function run(ctx){
  const { sock, msg, args } = ctx
  const gid = msg.key.remoteJid
  if(!gid?.endsWith('@g.us')){
    return sock.sendMessage(gid,{ text:'🌸 Usa este comando dentro de un grupo con aprobación de solicitudes~'},{ quoted: msg })
  }

  const bare = (j)=> String(j||'').split(':')[0].split('@')[0]

  // Verificar que el actor sea admin
  try{
    const meta = await sock.groupMetadata(gid)
    const sender = msg.key?.participant || gid
    const adminsBare = (meta.participants||[]).filter(p=>p.admin).map(p=>bare(p.id))
    if(!adminsBare.includes(bare(sender))){
      return sock.sendMessage(gid,{ text:'🌸 Solo admins pueden aprobar solicitudes, Dreamer~ 💕'},{ quoted: msg })
    }
  }catch{}

  // Verificar que el BOT sea admin (no bloquear; intentaremos igualmente y capturaremos 403)
  let botIsAdmin = true
  try{
    const meta = await sock.groupMetadata(gid)
    const me = sock.user?.id
    const adminsBare = (meta.participants||[]).filter(p=>p.admin).map(p=>bare(p.id))
    botIsAdmin = adminsBare.includes(bare(me))
  }catch{}

  const qtyArg = (args[0]||'').toLowerCase()
  const n = qtyArg === 'all' || qtyArg === 'todos' ? Number.POSITIVE_INFINITY : Math.max(1, Math.min(500, parseInt(qtyArg||'0',10) || 10))
  const mode = (args[1]||'recientes').toLowerCase()
  const wantDebug = args.includes('debug')

  // Verificar soporte en la librería
  const hasList = typeof sock.groupRequestParticipantsList === 'function'
  const hasUpdate = typeof sock.groupRequestParticipantsUpdate === 'function'
  if(!hasList || !hasUpdate){
    return sock.sendMessage(gid,{ text:'❌ Esta versión no soporta aprobación automática por API. Actualiza Baileys o aprueba manualmente en el grupo.'},{ quoted: msg })
  }

  try{
    const resp = await sock.groupRequestParticipantsList(gid)
    let participants = Array.isArray(resp) ? resp : (resp?.participants || [])
    // Algunos despliegues exponen otras claves potenciales
    if(!participants?.length){
      participants = resp?.pending || resp?.requests || resp?.list || []
    }
    // Normalizar a objetos { jid, requestTimestamp }
    participants = participants.map(p => {
      if (typeof p === 'string') return { jid: p, requestTimestamp: 0 }
      const jid = p?.jid || p?.id || p?.user || ''
      const ts = Number(p?.requestTimestamp || p?.ts || 0)
      return { jid, requestTimestamp: isFinite(ts) ? ts : 0 }
    }).filter(x=> x.jid)
    if (wantDebug) {
      try{
        const meta = await sock.groupMetadata(gid)
        const bare = (j)=> String(j||'').split(':')[0].split('@')[0]
        const admins = (meta.participants||[]).filter(p=>p.admin)
        const adminsList = admins.map(p=>`- ${p.id} -> ${bare(p.id)}`).join('\n')
        const me = sock.user?.id
        let info = [
          '*🔧 Debug admin*',
          `me: ${me}`,
          `me(bare): ${bare(me)}`,
          `admins:`,
          adminsList || '(vacío)',
          `pending: ${participants.length}`
        ].join('\n')
        // Adjuntar muestra cruda de la respuesta (truncada)
        try{
          const raw = JSON.stringify(resp).slice(0, 900)
          info += `\nraw: ${raw}${raw.length===900?'…':''}`
        }catch{}
        await sock.sendMessage(gid,{ text: info },{ quoted: msg })
      } catch {}
    }
    if(!participants.length){
      return sock.sendMessage(gid,{ text:'💫 No hay solicitudes pendientes por ahora~'},{ quoted: msg })
    }

    let sorted = participants.slice()
    if(mode === 'recientes'){
      sorted.sort((a,b)=> (b?.requestTimestamp||0) - (a?.requestTimestamp||0))
    } else if(mode === 'antiguas' || mode === 'antiguos' || mode === 'antiguo'){
      sorted.sort((a,b)=> (a?.requestTimestamp||0) - (b?.requestTimestamp||0))
    } else if(mode === 'random' || mode === 'aleatorio'){
      sorted.sort(()=> Math.random() - 0.5)
    }

    const picks = Number.isFinite(n) ? sorted.slice(0, n) : sorted
    const jids = picks.map(p=>p.jid).filter(Boolean)
    if(!jids.length){
      return sock.sendMessage(gid,{ text:'💫 No encontré solicitudes válidas para aprobar.'},{ quoted: msg })
    }

    try{
      await sock.groupRequestParticipantsUpdate(gid, jids, 'approve')
    }catch(e){
      // Si no somos admin, WhatsApp devolverá error de permisos
      return sock.sendMessage(gid,{ text:`🌸 Necesito ser admin para aprobar solicitudes~${botIsAdmin? '' : ' (verifica permisos del bot)'}\n${e?.message? 'Detalles: '+e.message : ''}`},{ quoted: msg })
    }
    await sock.sendMessage(gid,{ text:`✨ Aprobé ${jids.length} solicitudes (${mode}). ¡Bienvenid@s a Dreamland! 🌸`},{ quoted: msg })
  }catch(e){
    await sock.sendMessage(gid,{ text:`❌ No pude aprobar: ${e?.message||e}`},{ quoted: msg })
  }
}
