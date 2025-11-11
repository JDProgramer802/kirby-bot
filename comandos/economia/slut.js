/**
 * name: slut
 * aliases: ["coqueta", "traviesa"]
 * description: Gana ₭ de forma atrevida 💋 (versión animada y aleatoria)
 * category: Economía
 */

import { 
  requireRegisteredEco, 
  cooldownOk, 
  nowBogotaISO, 
  msUntil, 
  fmtDuration 
} from "./_common.js"

export async function run(ctx) {
  const { sock, msg, files, db, util } = ctx
  const chk = await requireRegisteredEco(ctx)
  if (!chk.ok) return

  const { jid, users, u } = chk
  const chat = msg.key.remoteJid
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

  // ⏳ Cooldown: 1 hora
  if (!cooldownOk(u.lastSlut, 1)) {
    const rest = fmtDuration(msUntil(u.lastSlut, 1))
    const text = `
💋 *Demasiado encanto, Dreamer~* ✨
———————————————
⏳ Podrás coquetear de nuevo en *${rest}*
🌸 Ve a descansar un poco... las estrellas también lo hacen~
`
    return sock.sendMessage(chat, { text }, { quoted: msg })
  }

  // 🎀 Frases posibles (animación + resultado)
  const stages = [
    "💃 Te arreglas el cabello y lanzas una sonrisa coqueta...",
    "💄 Caminas por Dreamland mostrando tu encanto mágico...",
    "💋 Unos cuantos te dejan propinas por tu ternura... ✨"
  ]

  const outcomes = [
    "🌸 Te invitaron un helado y dejaste huella 💕",
    "💫 Ganaste un concurso de encanto estelar ✨",
    "💖 Alguien cayó rendid@ ante tu ternura 💋",
    "🌈 Tus pasos brillan y la suerte te acompaña 💫",
    "💎 Te dieron propina por ser irresistiblemente cute~ 💕",
    "🔥 Dejaste corazones ardiendo en Dreamland 😳",
    "🎀 Eres una mezcla perfecta de picardía y dulzura 💖"
  ]

  const gain = Math.floor(Math.random() * 601) + 200 // 200–800 ₭
  const flavor = outcomes[Math.floor(Math.random() * outcomes.length)]

  // 🌈 Animación de proceso coqueto
  const m = await sock.sendMessage(chat, { text: "💃 Moviendo las caderas..." }, { quoted: msg })
  for (const s of stages) {
    await sleep(800)
    await sock.sendMessage(chat, { edit: m.key, text: s })
  }

  // 🪙 Actualizar economía
  u.coins = (u.coins || 0) + gain
  u.lastSlut = nowBogotaISO()
  users[jid] = u
  await db.saveJSON(files.USERS_FILE, users)

  // 💞 Mensaje final
  const finalCard = `
╭──────────────💋 *Dreamland Coqueta* 💋
│ ${flavor}
│────────────────────────────
│ 💰 *Ganancia:* ₭ ${util.formatKirby(gain)}
│ 🪙 *Total:* ₭ ${util.formatKirby(u.coins)}
│────────────────────────────
│ 🌸 “El encanto es un arma poderosa... úsalo con brillo y cuidado~”
╰────────────────────────────💞
`

  await sleep(1000)
  await sock.sendMessage(chat, { edit: m.key, text: finalCard })
}
