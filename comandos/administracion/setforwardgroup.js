/**
 * name: setforwardgroup
 * aliases: ["setfwdgroup","setdestino","setgrupoenvio"]
 * description: Define el grupo destino (JID) al que se reenviarán imágenes por defecto.
 * category: Administración
 */

import { requireGroup, isAdmin } from './_common.js'

const bare = (j)=> String(j||'').split(':')[0].split('@')[0]

export async function run(ctx){
  const { sock, msg, args = [], files, db } = ctx
  const { CONFIG_FILE } = files

  // Debe ejecutarse en un grupo por un admin (o el owner detectado por isAdmin)
  const { ok, gid } = await requireGroup(sock, msg)
  if (!ok) return sock.sendMessage(msg.key.remoteJid, { text: '🌸 Este comando solo funciona en grupos.' }, { quoted: msg })
  const sender = msg.key?.participant || gid
  if (!(await isAdmin(sock, gid, sender))) {
    return sock.sendMessage(gid, { text: '🌸 Comando solo para administradores.' }, { quoted: msg })
  }

  // Si no se pasa argumento, usar el grupo actual
  let target = (args[0] || '').trim()
  if (!target) target = gid
  if (!target.endsWith('@g.us')) {
    return sock.sendMessage(gid, { text: '✨ Uso: `$setforwardgroup` (usa el grupo actual)\n   o `$setforwardgroup <grupoJID>`\nEjemplo: `$setforwardgroup 1234567890-123456@g.us`' }, { quoted: msg })
  }

  const cfg = await db.loadJSON(CONFIG_FILE, {})
  cfg.forwardTarget = target
  await db.saveJSON(CONFIG_FILE, cfg)
  let name = ''
  try { name = (await sock.groupMetadata(target))?.subject || '' } catch {}
  await sock.sendMessage(gid, { text: `✅ Grupo destino configurado: ${name ? `*${name}*` : target}` }, { quoted: msg })
}
