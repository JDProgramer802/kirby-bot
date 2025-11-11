/**
 * name: tagadmins
 * aliases: ["admins","mentionadmins","llamaradmins","@admins"]
 * description: Menciona a todos los administradores del grupo con un mensaje opcional.
 * category: Administración
 */

import { requireGroup, isAdmin, getAdmins } from './_common.js'

const bare = (j)=> String(j||'').split(':')[0].split('@')[0]

export async function run(ctx){
  const { sock, msg, args = [] } = ctx

  // Solo funciona en grupos
  const { ok, gid } = await requireGroup(sock, msg)
  if (!ok) return

  // Evitar spam: solo admins pueden usarlo
  const sender = msg.key?.participant || gid
  if (!(await isAdmin(sock, gid, sender))) return

  try {
    const { admins } = await getAdmins(sock, gid)
    const mentions = admins.filter(Boolean)
    if (!mentions.length) return

    const note = args.join(' ').trim()
    const title = '🔔 Llamado a administradores'
    const lines = []
    lines.push(title)
    if (note) lines.push(`🗒️ ${note}`)
    lines.push('')
    // Agregar líneas con @usuario legible
    for (const a of mentions) {
      lines.push(`• @${bare(a)}`)
    }

    await sock.sendMessage(gid, {
      text: lines.join('\n'),
      mentions
    }, { quoted: msg })
  } catch {}
}
