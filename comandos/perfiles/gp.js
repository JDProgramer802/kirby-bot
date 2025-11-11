/**
 * name: gp
 * aliases: ["group"]
 * description: Información del grupo actual 🏡
 * category: Perfiles
 */

export async function run(ctx) {
  const { sock, msg } = ctx
  const remoteJid = msg.key?.remoteJid
  const isGroup = remoteJid.endsWith('@g.us')

  if (!isGroup) {
    await sock.sendMessage(remoteJid, {
      text: '> 🏡 *Este comando solo funciona en grupos.*\n> 🌸 Intenta usarlo dentro de Dreamland 💕'
    }, { quoted: msg })
    return
  }

  try {
    const meta = await sock.groupMetadata(remoteJid)
    const name = meta.subject || '—'
    const count = meta.participants?.length || 0
    const owner = meta.owner ? `@${meta.owner.split('@')[0]}` : '—'
    const desc = meta.desc || '_Sin descripción._'
    const creationDate = new Date(meta.creation * 1000).toLocaleString('es-CO', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })

    const caption = [
      `╭─❖  *INFORMACIÓN DEL GRUPO*  ❖─╮`,
      `🏡 *Nombre:* ${name}`,
      `👑 *Creador:* ${owner}`,
      `👥 *Miembros:* ${count}`,
      `🕒 *Creado:* ${creationDate}`,
      `──────────────────────────────`,
      `📝 *Descripción:*`,
      '```',
      desc.length > 600 ? desc.slice(0, 600) + '…' : desc,
      '```',
      `──────────────────────────────`,
      `🌸 *Dreamland System*`,
      `╰──────────────────────────────╯`
    ].join('\n')

    await sock.sendMessage(remoteJid, {
      text: caption,
      mentions: [meta.owner]
    }, { quoted: msg })

  } catch (e) {
    await sock.sendMessage(remoteJid, {
      text: `> ❌ *No pude leer la información del grupo.*\n> Intenta nuevamente más tarde 🌸`
    }, { quoted: msg })
  }
}
