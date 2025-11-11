/**
 * name: linkinfo
 * aliases: ["infolink","groupinfo","invitelink"]
 * description: Muestra información completa de un enlace de invitación de grupo de WhatsApp.
 * category: Utilidades
 */

export async function run(ctx){
  const { sock, msg } = ctx
  const gid = msg.key.remoteJid

  const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
  const qText = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation
              || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text
              || ''
  const input = (text.split(/\s+/).slice(1).join(' ').trim()) || qText
  if(!input){
    return sock.sendMessage(gid,{ text:'🌸 Envía o responde al enlace de invitación del grupo para ver su información. Ej: $linkinfo https://chat.whatsapp.com/XXXXXXXXXXXXXXX'},{ quoted: msg })
  }

  // Extraer código de invitación
  const m = input.match(/(?:https?:\/\/)?chat\.whatsapp\.com\/([A-Za-z0-9]{10,256})/i)
  const code = m?.[1]
  if(!code){
    return sock.sendMessage(gid,{ text:'💫 No pude detectar un enlace válido de WhatsApp. Asegúrate de que sea como https://chat.whatsapp.com/XXXXXXXX'},{ quoted: msg })
  }

  try{
    // Obtener info de la invitación
    const info = await sock.groupGetInviteInfo(code)
    if(!info){
      return sock.sendMessage(gid,{ text:'❌ No pude obtener información del enlace. Puede haber expirado o ser inválido.'},{ quoted: msg })
    }

    const lines = []
    lines.push('*🌸 Link Info del Grupo ✨*')
    if(info.id) lines.push(`• ID: \`${info.id}\``)
    if(info.subject) lines.push(`• Nombre: *${info.subject}*`)
    if(typeof info.size === 'number') lines.push(`• Miembros: ${info.size}`)
    const bare = (j)=> String(j||'').split(':')[0].split('@')[0]
    const tag = (j)=> '@'+bare(j)
    const mentions = new Set()
    if(info.owner){
      mentions.add(info.owner)
      lines.push(`• Propietari@: ${tag(info.owner)}`)
    }
    if(info.creator){
      mentions.add(info.creator)
      lines.push(`• Creador@: ${tag(info.creator)}`)
    }
    if(info.creation) {
      const date = new Date(info.creation * 1000)
      lines.push(`• Creado: ${date.toISOString()}`)
    }
    if(info.subjectTime){
      const d2 = new Date(info.subjectTime * 1000)
      lines.push(`• Últ. cambio de nombre: ${d2.toISOString()}`)
    }
    if(info.desc) lines.push(`• Descripción:\n> ${info.desc.slice(0,500)}`)
    if(info.restrict !== undefined) lines.push(`• Restricciones: ${info.restrict ? 'Solo admins' : 'Todos pueden editar'}`)
    if(info.announce !== undefined) lines.push(`• Modo anuncios: ${info.announce ? 'Sí (cerrado)' : 'No (abierto)'}`)

    // Intentar listar admins con menciones (si el bot NO está en el grupo, se omite sin fallar)
    let adminListed = false
    try{
      if(info.id){
        const meta = await sock.groupMetadata(info.id)
        const admins = (meta.participants||[]).filter(p=>p.admin)
        if(admins.length){
          adminListed = true
          lines.push('')
          lines.push('*👑 Admins:*')
          for(const a of admins){
            mentions.add(a.id)
            lines.push(`• ${tag(a.id)}`)
          }
        }
      }
    }catch{
      // no estamos en el grupo: continuar sin admins
    }
    if(!adminListed){
      lines.push('')
      lines.push('_👑 Admins: no disponibles (el bot no está en el grupo)._')
    }

    const caption = lines.join('\n')

    // Intentar enviar con foto de perfil del grupo
    let sent = false
    try{
      const purl = info.id ? await sock.profilePictureUrl(info.id, 'image') : null
      if (purl) {
        await sock.sendMessage(gid, { image: { url: purl }, caption, mentions: Array.from(mentions) }, { quoted: msg })
        sent = true
      }
    }catch{}

    if(!sent){
      await sock.sendMessage(gid, { text: caption, mentions: Array.from(mentions) }, { quoted: msg })
    }
  }catch(e){
    await sock.sendMessage(gid,{ text:`❌ No pude obtener información del enlace: ${e?.message||e}`},{ quoted: msg })
  }
}
