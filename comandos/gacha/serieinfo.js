/**
 * name: serieinfo
 * aliases: ["ainfo","animeinfo"]
 * description: Información de una serie o anime con estilo Dreamland 🌸
 * category: Gacha
 */

import { ensureStores } from './_common.js'

export async function run(ctx){
  const { sock, msg, args, files, db, util } = ctx
  await ensureStores(files, db)

  const gid = msg.key.remoteJid
  const q = args.join(' ').trim().toLowerCase()
  if(!q) {
    return sock.sendMessage(gid, {
      text: '🌸 Usa: *$serieinfo <nombre de serie>*\n\nEjemplo: `$serieinfo kirby` o `$serieinfo naruto`'
    }, { quoted: msg })
  }

  const chars = await db.loadJSON(files.CHARACTERS_FILE, {})
  const list = Object.values(chars).filter(c => (c.serie||'').toLowerCase().includes(q))
  if(!list.length){
    return sock.sendMessage(gid, {
      text: `💫 No encontré resultados para: *${q}*\n🌧️ Prueba con otro nombre o revisa mayúsculas.`
    }, { quoted: msg })
  }

  const total = list.length
  const claimed = list.filter(c => c.owner).length
  const avg = list.reduce((a, c) => a + (c.value || 0), 0) / total
  const max = list.reduce((m, c) => Math.max(m, c.value || 0), 0)

  // 🩵 Decoración estilo Dreamland
  const header = [
    '┈┈┈ ⋆｡ﾟ☁︎｡⋆｡ ﾟ☾ ﾟ｡⋆ ┈┈┈',
    `🌸 *Información de Serie*`,
    '┈┈┈ ⋆｡ﾟ☁︎｡⋆｡ ﾟ☾ ﾟ｡⋆ ┈┈┈'
  ].join('\n')

  const body = [
    `🎬 *Serie:* ${list[0].serie || '—'}`,
    `👥 *Personajes:* ${total}`,
    `💗 *Reclamados:* ${claimed} (${((claimed/total)*100).toFixed(1)}%)`,
    '',
    `💰 *Valor promedio:* ${util.formatKirby(avg)}`,
    `💎 *Valor máximo:* ${util.formatKirby(max)}`,
  ].join('\n')

  const footer = [
    '',
    '🌈 _Dreamland vibra con la energía de esta serie..._ 💫',
    '⋆ ┈┈┈ ｡ﾟ☁︎｡⋆｡ ﾟ☾ ﾟ｡⋆ ┈┈┈'
  ].join('\n')

  const message = [header, '', body, footer].join('\n')

  await sock.sendMessage(gid, { text: message }, { quoted: msg })
}
