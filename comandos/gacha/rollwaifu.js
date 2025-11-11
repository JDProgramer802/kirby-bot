/**
 * name: rollwaifu
 * aliases: ["rw","roll"]
 * description: Muestra una waifu/husbando aleatorio (prioriza no reclamados)
 * category: Gacha
 */

import {
  ensureStores,
  requireRegistered,
  nowBogotaISO,
  cooldownPassed,
  msUntil,
  fmtDuration,
  findImageForChar,
  startProgress
} from "./_common.js"

export async function run(ctx) {
  const { sock, msg, files, db } = ctx
  const { USERS_FILE, CHARACTERS_FILE } = files
  await ensureStores(files, db)

  const chk = await requireRegistered(ctx)
  if (!chk.ok) return
  const jid = chk.jid
  const users = await db.loadJSON(USERS_FILE, {})
  const u = users[jid]

  // Cooldown: 10 min
  if (!cooldownPassed(u.lastRoll, 600)) {
    const rest = fmtDuration(msUntil(u.lastRoll, 600))
    return sock.sendMessage(
      msg.key.remoteJid,
      { text: `⏳ Roll en cooldown: ${rest} restantes 🌸` },
      { quoted: msg }
    )
  }

  const chars = await db.loadJSON(CHARACTERS_FILE, {})
  const ids = Object.keys(chars)
  if (!ids.length)
    return sock.sendMessage(
      msg.key.remoteJid,
      { text: "🌸 No hay personajes en el catálogo aún 💫" },
      { quoted: msg }
    )

  // 🎯 Priorización balanceada:
  const unclaimed = ids.filter((id) => !chars[id].owner)
  const claimed = ids.filter((id) => chars[id].owner)

  // Excluir el último personaje del mismo usuario (antirrepetición)
  const excludeLast = u.lastRollChar || null
  const availableUnclaimed = unclaimed.filter((id) => id !== excludeLast)
  const availableClaimed = claimed.filter((id) => id !== excludeLast)

  // 80% sin owner, 20% con owner
  let pool = []
  if (availableUnclaimed.length && Math.random() < 0.8) {
    pool = availableUnclaimed
  } else {
    // Seleccionar 20% aleatorio de los reclamados
    const sample = availableClaimed.sort(() => Math.random() - 0.5).slice(0, Math.ceil(availableClaimed.length * 0.2))
    pool = sample.length ? sample : availableUnclaimed
  }

  // Elegir personaje final
  const pickId = pool[Math.floor(Math.random() * pool.length)]
  const ch = chars[pickId]
  const img = await findImageForChar(ch)

  // Guardar timestamp y personaje
  u.lastRoll = nowBogotaISO()
  users[jid] = u
  await db.saveJSON(USERS_FILE, users)

  // 🌟 Generar tirada estilizada
  const numero = Math.floor(Math.random() * 6) + 1
  const energiaMap = {
    1: { emoji: "🖤", resultado: "Nebulosa Somnolienta", frase: "Kirby bosteza… ¡aún así, nunca pierde la esperanza!" },
    2: { emoji: "💙", resultado: "Cúmulo Tranquilo", frase: "Todo se siente calmo… ¡la suerte está calentando motores!" },
    3: { emoji: "💚", resultado: "Órbita Brillante", frase: "Algo vibra en el aire… ¡podría mejorar en el próximo intento!" },
    4: { emoji: "💛", resultado: "Constelación Viva", frase: "¡Kirby guiña! La estrella sonríe a tu favor~" },
    5: { emoji: "🧡", resultado: "Supernova Dulce", frase: "¡Wow! La suerte gira como un carrusel cósmico~" },
    6: { emoji: "💖", resultado: "Estrella de Ensueño", frase: "¡Brilla intensamente! Dreamland celebra tu tirada~" }
  }

  const pick = energiaMap[numero]
  const header = '┈┈┈ ⋆｡ﾟ☁︎｡⋆｡ ﾟ☾ ﾟ｡⋆ ┈┈┈\n🎲 *𝐑𝐨𝐥𝐥 𝐄𝐬𝐭𝐞𝐥𝐚𝐫* 🎲\n┈┈┈ ⋆｡ﾟ☁︎｡⋆｡ ﾟ☾ ﾟ｡⋆ ┈┈┈'
  const quote = '> ✨ *Kirby lanza su dado cósmico entre las estrellas...* 💫\n> 🎡 *Resultado:* ' + '`' + pick.resultado + '`'
  const body = [
    `✧ *Número mágico:* \`${numero}\``,
    `✧ *Energía estelar:* ${pick.emoji}`,
    `✧ *Comentario de Kirby:* _"${pick.frase}"_ 💕`
  ].join('\n')
  const footer = '> 🌈 “A veces la suerte brilla, y otras… ¡rebota como una estrella fugaz! 🌟”\n\n⋆ ┈┈┈ ｡ﾟ☁︎｡⋆｡ ﾟ☾ ﾟ｡⋆ ┈┈┈'

  const ownerName = ch.owner ? (users[ch.owner]?.name || ch.owner) : null
  const waifuLine = `\n\n🎴 ¡Tu carta es **${ch.name}** de **${ch.serie||'—'}**!\n🪙 Valor: ${ctx.util.formatKirby(ch.value||0)}${ownerName?`\n👑 Dueñ@: ${ownerName}`:`\n💌 Usa $claim para quedártela`}`

  // Bloque extra con los campos solicitados por el usuario (sin perder el diseño original)
  const generoRaw = (ch.gender || ch.genero || '').toString()
  const gl = generoRaw.toLowerCase()
  const genero = generoRaw
    ? (gl === 'm' || gl === 'male' || gl === 'hombre' ? 'Hombre' : (gl === 'f' || gl === 'female' || gl === 'mujer' ? 'Mujer' : generoRaw))
    : '—'
  const estado = ownerName ? 'Reclamado' : 'Libre'
  const fuente = ch.serie || '—'
  const extra = [
    `❀ Nombre » ${ch.name}`,
    `⚥ Genero » ${genero}`,
    `✰ Valor » ${ctx.util.formatKirby(ch.value || 0)}`,
    `♡ Estado » ${estado}${ownerName ? '' : ''}`,
    `❖ Fuente » ${fuente}`,
  ].join('\n')

  const caption = [header, '', quote, '', body, '', footer, waifuLine, '', extra].join('\n')

  // Enviar un solo mensaje (imagen con caption si hay imagen; si no, texto)
  let sent
  if (img) {
    sent = await sock.sendMessage(msg.key.remoteJid, { image: { url: img }, caption }, { quoted: msg })
  } else {
    sent = await sock.sendMessage(msg.key.remoteJid, { text: caption }, { quoted: msg })
  }

  try {
    users[jid].lastRollChar = pickId
    users[jid].lastRollMsgId = sent?.key?.id || users[jid].lastRollMsgId
    await db.saveJSON(USERS_FILE, users)
  } catch {}

  // Registrar log de roll en gachaLogs.json
  try {
    const logs = await db.loadJSON(files.GACHALOGS_FILE, { logs: [] })
    logs.logs = Array.isArray(logs.logs) ? logs.logs : []
    logs.logs.push({
      at: nowBogotaISO(),
      action: 'roll',
      by: jid,
      group: msg.key?.remoteJid,
      charId: pickId,
    })
    await db.saveJSON(files.GACHALOGS_FILE, logs)
  } catch {}
}
