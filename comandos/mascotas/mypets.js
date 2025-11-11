/**
 * name: mypets
 * aliases: ["mymascotas","pets"]
 * description: Muestra tus mascotas actuales
 * category: Mascotas
 */

import { requireRegisteredEco } from '../economia/_common.js'

export async function run(ctx){
  const { sock, msg, files, db } = ctx
  const chk = await requireRegisteredEco(ctx); if(!chk.ok) return
  const { u } = chk

  const petsDb = await db.loadJSON(files.PETS_FILE, {})
  const mine = Array.isArray(u.pets) ? u.pets : []
  if(!mine.length){
    return sock.sendMessage(msg.key.remoteJid,{ text:'🐾 No tienes mascotas aún. Visita el $petshop.' },{ quoted: msg })
  }
  const lines = ['╭─🌈 ᴍɪꜱ ᴍᴀꜱᴄᴏᴛᴀꜱ 🌈─╮']
  mine.forEach((id,i)=>{
    const p = petsDb[id]
    if(!p) return
    lines.push(`🐾 ${i+1}. ${p.name} ${p.rarity}`)
  })
  lines.push('╰──────────────────────────────🌸')
  await sock.sendMessage(msg.key.remoteJid,{ text: lines.join('\n') },{ quoted: msg })
}
