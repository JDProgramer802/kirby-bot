/**
 * name: roulette
 * aliases: ["rt"]
 * description: Apuesta ₭ en la ruleta de Dreamland 🎰 (con animación)
 * category: Economía
 */

import { requireRegisteredEco, parseAmount } from "./_common.js"

export async function run(ctx) {
  const { sock, msg, args, util, files, db } = ctx
  const chk = await requireRegisteredEco(ctx)
  if (!chk.ok) return

  const { jid, users, u } = chk
  const color = (args[0] || "").toLowerCase()
  const amount = parseAmount(args[1], u.coins || 0)

  if (!["red", "black", "rojo", "negro"].includes(color) || !amount) {
    return sock.sendMessage(
      msg.key.remoteJid,
      { text: "✨ Usa: $roulette <red|black> <cantidad>" },
      { quoted: msg }
    )
  }

  if ((u.coins || 0) < amount) {
    return sock.sendMessage(
      msg.key.remoteJid,
      { text: "💔 No tienes suficientes ₭ para esa acción 💕" },
      { quoted: msg }
    )
  }

  const chat = msg.key.remoteJid
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

  // 🎡 Enviar mensaje inicial
  const spinMsg = await sock.sendMessage(chat, { text: "🎰 Girando la ruleta..." }, { quoted: msg })

  // 🎠 Animación del giro de la ruleta
  const frames = [
    "🎲 Girando... ⭕⭕⭕",
    "🎲 Girando... 🔴⚫🔴",
    "🎲 Girando... ⚫🔴⚫",
    "🎲 Girando... 🔴⚫🔴",
    "🎲 Girando... ⚫🔴⚫",
    "🎲 Girando... 🌀🌀🌀",
    "🎲 Girando... ✨✨✨"
  ]

  for (const f of frames) {
    await sleep(450)
    await sock.sendMessage(chat, { edit: spinMsg.key, text: f })
  }

  // 🧮 Resultado final
  const outcome = Math.random() < 0.5 ? "red" : "black"
  const userColor = ["rojo", "red"].includes(color) ? "red" : "black"
  const isWin = outcome === userColor
  const outcomeEmoji = outcome === "red" ? "🔴" : "⚫"
  const userBetEmoji = userColor === "red" ? "🔴" : "⚫"

  // 💎 Actualizar economía
  if (isWin) {
    u.coins = (u.coins || 0) + amount
  } else {
    u.coins = Math.max(0, (u.coins || 0) - amount)
  }
  users[jid] = u
  await db.saveJSON(files.USERS_FILE, users)

  // 🎁 Mensaje final (editando el mismo mensaje)
  const resultCard = `
╭───────────🎰 *Dreamland Roulette* 🎰
│ 🎠 *Tu apuesta:* ${userBetEmoji} ₭ ${util.formatKirby(amount)}
│ 🎡 *Color ganador:* ${outcomeEmoji}
│────────────────────────────
│ ${isWin ? "🌸 *¡Felicidades, Dreamer!* Has ganado 💖" : "💔 *Oh no~* perdiste esta ronda 😭"}
│────────────────────────────
│ 🪙 *Saldo actual:* ₭ ${util.formatKirby(u.coins)}
│────────────────────────────
│ 💫 “La suerte sopla en Dreamland... pero solo si sigues jugando~”
╰──────────────────────────────🌸
`

  await sleep(600)
  await sock.sendMessage(chat, { edit: spinMsg.key, text: resultCard })
}
