/**
 * name: mine
 * aliases: ["minar"]
 * description: Mina ₭ en la cueva de Dreamland ⛏️ (versión animada en un solo mensaje)
 * category: Economía
 */

import {
  requireRegisteredEco,
  cooldownOk,
  nowBogotaISO,
  msUntil,
  fmtDuration,
  eliteAdjust,
  ensureTier,
  petAdjust
} from "./_common.js"

export async function run(ctx) {
  const { sock, msg, files, db, util } = ctx
  const chk = await requireRegisteredEco(ctx)
  if (!chk.ok) return
  const { jid, users, u } = chk

  const cdHours = eliteAdjust({ u, cooldownHours: 1 }).cooldownHours // base 1h
  if (!cooldownOk(u.lastMine, cdHours)) {
    const rest = fmtDuration(msUntil(u.lastMine, cdHours))
    const card = `
💤 *Descanso minero, Dreamer~* 💎
———————————
⏳ Podrás minar otra vez en: *${rest}*
⛏️ Revisa tus herramientas y regresa con fuerza 🌸
`
    return sock.sendMessage(msg.key.remoteJid, { text: card }, { quoted: msg })
  }

  const chat = msg.key.remoteJid
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

  // 🌈 Paso 1: enviar mensaje inicial
  const m = await sock.sendMessage(chat, { text: "⛏️ [░░░░░] Buscando veta..." }, { quoted: msg })

  // 🌈 Paso 2: actualizar progresivamente el mismo mensaje
  const steps = [
    "⛏️ [▓░░░░] Cavando la entrada...",
    "⛏️ [▓▓░░░] Rompiendo rocas...",
    "⛏️ [▓▓▓░░] Descubriendo túneles secretos...",
    "⛏️ [▓▓▓▓░] ¡Se ve algo brillante! ✨",
    "⛏️ [▓▓▓▓▓] ¡Encontraste un mineral raro! 💎"
  ]

  for (const step of steps) {
    await sleep(800)
    await sock.sendMessage(chat, { edit: m.key, text: step })
  }

  // 🌈 Paso 3: cálculo de recompensa
  const roll = Math.random()
  let gain = 0
  let flavor = ""

  if (roll < 0.08) {
    gain = 1800
    flavor = "🌟 ¡Encontraste una *gema estelar*! 💎"
  } else if (roll < 0.3) {
    gain = Math.floor(Math.random() * 201) + 600
    flavor = "✨ Mineral brillante~"
  } else if (roll < 0.85) {
    gain = Math.floor(Math.random() * 201) + 350
    flavor = "⛏️ Unos cuantos minerales comunes~"
  } else {
    gain = Math.floor(Math.random() * 101) + 100
    flavor = "🪨 Piedritas... algo es algo 😅"
  }

  // 🌟 Crítico x2
  if (Math.random() < 0.1) {
    gain *= 2
    flavor += " *¡GOLPE CRÍTICO! x2 💥*"
  }

  // Ajustes: Elite y Mascota
  gain = eliteAdjust({ u, gain }).gain
  gain = await petAdjust(ctx, { u, gain })
  // Actualizar base de datos
  u.coins = (u.coins || 0) + gain
  u.lastMine = nowBogotaISO()
  users[jid] = u
  await db.saveJSON(files.USERS_FILE, users)
  await ensureTier(ctx, { jid, users, u })

  // 🌈 Paso 4: editar mensaje final con tarjeta de resultados
  const finalCard = `
｡ﾟ✧ *¡Minería exitosa en Dreamland!* ✧ﾟ｡
──────────────────────
${flavor}
💰 *Ganancia:* ₭ ${util.formatKirby(gain)}
🪙 *Total actual:* ₭ ${util.formatKirby(u.coins)}
──────────────────────
🌸 _“Brillan las cuevas para quienes sueñan con esfuerzo.”_
`

  await sleep(1000)
  await sock.sendMessage(chat, { edit: m.key, text: finalCard })
}
