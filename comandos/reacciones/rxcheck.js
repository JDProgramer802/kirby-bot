/**
 * name: rxcheck
 * aliases: ["reaccionescheck","testreacciones"]
 * description: Verifica rápidamente varias reacciones y reporta si encuentran media.
 * category: Reacciones
 */

import { requireGroup, isAdmin } from '../administracion/_common.js'
import { NB_MAP, pickUrl } from './_common.js'

export async function run(ctx){
  const { sock, msg } = ctx
  const { ok, gid } = await requireGroup(sock, msg)
  if (!ok) return
  // Solo admin para evitar spam
  const sender = msg.key?.participant || gid
  if (!(await isAdmin(sock, gid, sender))) return

  const keys = Object.keys(NB_MAP)
  // Tomar una muestra razonable (hasta 12 claves distintas al azar)
  const sample = [...new Set(keys)].sort(()=>Math.random()-0.5).slice(0, 12)

  const results = []
  for (const k of sample) {
    try {
      const media = await pickUrl(k, ctx)
      if (media?.url) results.push({ k, ok: true, type: media.type })
      else results.push({ k, ok: false })
    } catch {
      results.push({ k, ok: false })
    }
  }

  const okList = results.filter(r=>r.ok)
  const badList = results.filter(r=>!r.ok)
  const lines = []
  lines.push('🔎 Revisión de reacciones (muestra aleatoria)')
  if (okList.length) {
    lines.push('✅ Disponibles:')
    for (const r of okList) lines.push(`• ${r.k} (${r.type||'?'})`)
  }
  if (badList.length) {
    lines.push('')
    lines.push('❌ Sin resultados ahora:')
    for (const r of badList) lines.push(`• ${r.k}`)
  }
  lines.push('')
  lines.push('ℹ️ Fuente: nekos.best + Tenor (si hay API key) + waifu.im (mp4)')

  await sock.sendMessage(gid, { text: lines.join('\n') }, { quoted: msg })
}
