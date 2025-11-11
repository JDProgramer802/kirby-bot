/**
 * name: harem
 * aliases: ["waifus","claims"]
 * description: Muestra el harem del usuario con formato elegante Dreamland 🌸
 * category: Gacha
 */

import { ensureStores, requireRegistered } from './_common.js'

export async function run(ctx) {
  const { sock, msg, args, files, db, util } = ctx
  await ensureStores(files, db)

  const gid = msg.key.remoteJid
  const mention = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
  const page = Math.max(1, parseInt(args.find(a => /^\d+$/.test(a)) || '1', 10))
  let jid

  if (mention) jid = mention
  else {
    const chk = await requireRegistered(ctx)
    if (!chk.ok) return
    jid = chk.jid
  }

  const users = await db.loadJSON(files.USERS_FILE, {})
  const chars = await db.loadJSON(files.CHARACTERS_FILE, {})
  const u = users[jid]

  if (!u?.registered)
    return sock.sendMessage(gid, { text: '🌸 ¡Ups~! Esa personita no está registrada 💕' }, { quoted: msg })

  const list = (u.claims || [])
    .map(id => ({
      id,
      name: chars[id]?.name || id,
      value: chars[id]?.value || 0,
      serie: chars[id]?.serie || '—'
    }))
    .sort((a, b) => (b.value || 0) - (a.value || 0))

  if (!list.length)
    return sock.sendMessage(gid, { text: '🌸 No hay personajes en este harem aún 💫' }, { quoted: msg })

  const size = 20
  const start = (page - 1) * size
  const slice = list.slice(start, start + size)
  const totalPages = Math.max(1, Math.ceil(list.length / size))
  const username = u.name || jid.split('@')[0]

  // 💖 Valor total del harem
  const totalValue = util.formatKirby(list.reduce((sum, c) => sum + (c.value || 0), 0))

  // 🌸 Diseño Dreamland Harem clásico
  let text = `╭─❀ ᴅʀᴇᴀᴍʟᴀɴᴅ ʜᴀʀᴇᴍ ❀─╮\n`
  text += `🌸 Usuario: *${username}*\n`
  text += `💞 Personajes reclamados: *${list.length}*\n\n`

  const icons = ['💖','💫','✨','🌷','💎','🩵','💜','🪞','🌟','🎀']

  slice.forEach((c, i) => {
    const idx = start + i + 1
    const emoji = icons[i % icons.length]
    text += `${idx}. ${emoji} *${c.name}* — ₭${util.formatKirby(c.value)}\n`
  })

  text += `\n📖 Página *${page}* de *${totalPages}*\n`
  text += `╰───────────────🌸───────────────╯`

  await sock.sendMessage(gid, { text }, { quoted: msg })
}
