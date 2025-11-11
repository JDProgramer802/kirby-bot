/**
 * name: petshop
 * aliases: ["shop"]
 * description: Muestra la tienda de Mascotas de Dreamland
 * category: Mascotas
 */

import { requireRegisteredEco } from '../economia/_common.js'

export async function run(ctx){
  const { sock, msg, files, db, util } = ctx
  const chk = await requireRegisteredEco(ctx); if(!chk.ok) return
  const pets = await db.loadJSON(files.PETS_FILE, {})
  const list = Object.values(pets)
  if(!list.length) return sock.sendMessage(msg.key.remoteJid,{ text:'🐾 La tienda está vacía por ahora.' },{ quoted: msg })

  const lines = ['╭─🌸 ᴅʀᴇᴀᴍʟᴀɴᴅ ᴘᴇᴛꜱʜᴏᴘ 🌸─╮','🐾 Mascotas disponibles:']
  list.slice(0,20).forEach((p,i)=>{
    lines.push(`${i+1}. 💫 *${p.name}* — ₭${util.formatKirby(p.price)} ${p.rarity}`)
    const short = String(p.description||'').replace(/\s+/g,' ').slice(0,80)
    lines.push(`   ${short}`)
  })
  lines.push('')
  lines.push('💸 Usa: $buypet <id>')
  lines.push('╰──────────────────────────────🌈')
  await sock.sendMessage(msg.key.remoteJid,{ text: lines.join('\n') },{ quoted: msg })
}
