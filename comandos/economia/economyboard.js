/**
 * name: economyboard
 * aliases: ["eboard","baltop"]
 * description: Ranking global de usuarios con más ₭ 🏆
 * category: Economía
 */

import { requireRegisteredEco } from './_common.js'

export async function run(ctx){
  const { sock, msg, files, db, util, PREFIX, args = [] } = ctx
  const chk = await requireRegisteredEco(ctx); if(!chk.ok) return
  const gid = msg.key.remoteJid
  const users = await db.loadJSON(files.USERS_FILE,{})
  const all = Object.values(users).filter(u=>u?.registered)
    .map(u=>({ name: u.name||'Dreamer', total: (u.coins||0)+(u.bank||0) }))
    .sort((a,b)=> b.total - a.total)
  if(!all.length) return sock.sendMessage(gid,{text:'🌸 Aún no hay economía registrada 💫'},{quoted:msg})

  // Paginación: 10 por página
  const PAGE = 10
  const totalPages = Math.max(1, Math.ceil(all.length / PAGE))
  const page = Math.min(totalPages, Math.max(1, parseInt(args?.[0]||'1')||1))
  const start = (page-1)*PAGE
  const arr = all.slice(start, start+PAGE)

  // Total general (todos los registrados)
  const totalGeneral = Object.values(users)
    .filter(u=>u?.registered)
    .reduce((acc,u)=> acc + (u.coins||0) + (u.bank||0), 0)

  const sep = '✦───･｡✧･ﾟﾟ･:༅｡ﾟ☆｡ﾟ༄:･ﾟﾟ･✧｡･───✦'
  const medal = ['🥇','🥈','🥉']
  const iconsRest = ['💎','💫','🌙','🔥','⭐','✨','💼'] // 4..10

  const fmtNumber = (n)=> new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n)
  const fmt = (n)=> `₭ ${fmtNumber(n)} KirbyCoin`
  const padName = (s, len=14) => {
    const str = String(s||'')
    return str.length >= len ? str.slice(0, len) : str.padEnd(len, ' ')
  }

  const lines = []
  lines.push('「✿」Top de riqueza en KirbyCoin:')
  lines.push(sep)
  // Top 1-3
  for (let i=0; i<arr.length; i++) {
    const u = arr[i]
    const globalRank = start + i + 1
    const icon = globalRank <= 3 ? medal[globalRank-1] : '✰'
    const name = padName(u.name, 18)
    lines.push(`✰ ${globalRank} » *${u.name}*:\n\t\t Total→ *${fmt(u.total)}*`)
  }
  lines.push('')
  lines.push(`> • Página *${page}* de *${totalPages}*`)
  lines.push('')
  lines.push(`> Usa \`${PREFIX || '$'}eboard <página>\` para navegar.`)
  const topName = all[0]?.name || 'Dreamer'
  lines.push(sep)
  lines.push(`🏦 Total general: ${fmt(totalGeneral)}`)
  lines.push(`💭 Kirby dice: “¡Waa! 🌟 La fortuna de ${topName} brilla más que una supernova 💰”`)
  lines.push(sep)

  await sock.sendMessage(gid,{ text: lines.join('\n') },{ quoted: msg })
}
