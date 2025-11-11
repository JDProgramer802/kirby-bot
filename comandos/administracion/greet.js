/**
 * name: greet
 * aliases: ["saludo","buenosdias","buenasnoches"]
 * description: Envía un saludo mágico de buenos días o buenas noches al grupo 🌸
 * category: Administracion
 */

import { requireGroup, isAdmin } from './_common.js'

const bogotaNow = () => {
  const now = new Date()
  const offsetMs = 5 * 60 * 60 * 1000 // UTC-5
  return new Date(now.getTime() - offsetMs)
}

const makeMessage = (type = 'auto', groupName = '') => {
  const now = bogotaNow()
  const hour = now.getUTCHours()
  let mode = type
  if (type === 'auto') {
    if (hour >= 5 && hour < 12) mode = 'dia'
    else if (hour >= 18 || hour < 5) mode = 'noche'
    else mode = 'dia'
  }

  if (mode === 'dia') {
    const phrases = [
      '🌞 ¡Despierta, estrellita! Hoy brillas más que nunca ✨',
      '💫 Que la suerte acompañe tus tiradas del día~',
      '🍓 Recuerda sonreír, soñar y compartir buena energía 💕',
      '🌈 Kirby ya está flotando entre las nubes... ¡síguelo hacia un día feliz!',
    ]
    const pick = phrases[Math.floor(Math.random() * phrases.length)]
    return [
      '╭─🌸 ᴅʀᴇᴀᴍʟᴀɴᴅ ᴍᴏʀɴɪɴɢ 🌸─╮',
      `🌅 ¡Buenos días, *${groupName || 'Dreamland'}*!`,
      '',
      pick,
      '',
      '☕ ¡A conquistar el día con sonrisas y estrellas! ⭐',
      '╰─────────────────────────────🌈'
    ].join('\n')
  }

  // NOCHE 🌙
  const nightPhrases = [
    '🌙 El cielo brilla con estrellas que guardan tus sueños~',
    '💤 Kirby prepara su manta y te desea dulces sueños ☁️',
    '✨ Que descanses, mañana el universo traerá nuevas oportunidades~',
    '🌠 Las estrellas susurran: “Todo saldrá bien…”',
  ]
  const pickNight = nightPhrases[Math.floor(Math.random() * nightPhrases.length)]
  return [
    '╭─🌙 ᴅʀᴇᴀᴍʟᴀɴᴅ ɴɪɢʜᴛ 🌙─╮',
    `💤 Buenas noches, *${groupName || 'Dreamland'}*!`,
    '',
    pickNight,
    '',
    '🌸 Cierra los ojos y deja que las estrellas te arrullen~ ⭐',
    '╰──────────────────────────────💤'
  ].join('\n')
}

export async function run(ctx){
  const { sock, msg, args } = ctx
  const { ok, gid } = await requireGroup(sock, msg)
  if (!ok)
    return sock.sendMessage(msg.key.remoteJid,{text:'🌸 Este comando solo funciona en grupos 💫'},{quoted:msg})

  const sender = msg.key?.participant || gid
  if (!(await isAdmin(sock, gid, sender)))
    return sock.sendMessage(gid,{text:'🌸 Solo administradores pueden usar este comando 💕'},{quoted:msg})

  const meta = await sock.groupMetadata(gid).catch(()=>null)
  const subject = meta?.subject || ''
  const t = (args[0]||'').toLowerCase()
  const type = (t === 'dia' || t === 'd' || t === 'morning' || t === 'buenosdias') ? 'dia'
            : (t === 'noche' || t === 'n' || t === 'night' || t === 'buenasnoches') ? 'noche'
            : 'auto'

  const text = makeMessage(type, subject)
  await sock.sendMessage(gid,{ text },{ quoted: msg })
}
