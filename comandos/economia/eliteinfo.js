/**
 * name: eliteinfo
 * aliases: ["elite","elitehelp"]
 * description: Muestra tu estado Elite y sus reglas activas
 * category: Economía
 */

import { requireRegisteredEco, isElite, ELITE_THRESHOLD } from './_common.js'

export async function run(ctx){
  const { sock, msg, util } = ctx
  const chk = await requireRegisteredEco(ctx); if(!chk.ok) return
  const { u } = chk
  const elite = isElite(u)
  const lines = [
    '╭─💎 ᴅʀᴇᴀᴍʟᴀɴᴅ ᴇʟɪᴛᴇ 💎─╮',
    elite
      ? `🟢 Estado: ACTIVO desde ${new Date(u.eliteSince||Date.now()).toLocaleString('es-CO')}`
      : `🔴 Estado: bloqueado. Desbloquea al superar ₭ ${util.formatKirby(ELITE_THRESHOLD)}`,
    '──────────────────────────',
    '⚙️ Reglas Elite',
    '• Cooldowns: +50%',
    '• Recompensas: +25% (mejores premios)',
    '• Multas: +25% (más duras)',
    '──────────────────────────',
    '📝 Consejos',
    '• Usa $elitework para mayores retos y recompensas',
    '• Coordina con tu equipo para grandes golpes (próx. $heist)',
    '╰──────────────────────────🌸'
  ]
  await sock.sendMessage(msg.key.remoteJid,{ text: lines.join('\n') },{ quoted: msg })
}
