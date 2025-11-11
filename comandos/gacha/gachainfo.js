/**
 * name: gachainfo
 * aliases: ["ginfo","infogacha"]
 * description: Ver tu información de gacha
 * category: Gacha
 */

import { ensureStores, requireRegistered, cooldownPassed, msUntil, fmtDuration } from './_common.js'

export async function run(ctx){
  const { sock, msg, files, db, util } = ctx
  await ensureStores(files, db)
  const chk = await requireRegistered(ctx); if(!chk.ok) return
  const gid = msg.key.remoteJid; const jid = chk.jid
  const users = await db.loadJSON(files.USERS_FILE,{})
  const u = users[jid] || {}
  const claims = (u.claims||[]).length
  const hv = u.haremValue||0
  const fav = u.favourite||'—'
  const lastRoll = u.lastRoll ? new Date(u.lastRoll).toLocaleString() : '—'
  const lastClaim = u.lastClaim ? new Date(u.lastClaim).toLocaleString() : '—'
  // Cooldowns (10 min = 600s)
  const rollFree = cooldownPassed(u.lastRoll, 600)
  const claimFree = cooldownPassed(u.lastClaim, 600)
  const rollRem = rollFree ? 'Disponible ahora' : fmtDuration(msUntil(u.lastRoll, 600))
  const claimRem = claimFree ? 'Disponible ahora' : fmtDuration(msUntil(u.lastClaim, 600))
  const lines = [
    '┈┈┈ ⋆｡ﾟ☁︎｡⋆｡ ﾟ☾ ﾟ｡⋆ ┈┈┈',
    '🎀  Tu Panel de Gacha',
    '┈┈┈ ⋆｡ﾟ☁︎｡⋆｡ ﾟ☾ ﾟ｡⋆ ┈┈┈',
    `• 💞 Claims: ${claims}`,
    `• 🪙 HaremValue: ₭ ${util.formatKirby(hv)}`,
    `• 🌟 Favorito: ${fav}`,
    '',
    `🕒 Último roll: ${lastRoll}`,
    `🕒 Último claim: ${lastClaim}`,
    '',
    `⏳ Siguiente roll: ${rollRem}`,
    `⏳ Siguiente claim: ${claimRem}`,
    '┈┈┈ ⋆｡ﾟ☁︎｡⋆｡ ﾟ☾ ﾟ｡⋆ ┈┈┈'
  ]
  await sock.sendMessage(gid,{ text: lines.join('\n') },{ quoted: msg })
}
