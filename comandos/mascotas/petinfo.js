/**
 * name: petinfo
 * aliases: ["mascotainfo","infopet"]
 * description: Muestra la ficha de una mascota
 * category: Mascotas
 */

import { requireRegisteredEco } from '../economia/_common.js'

export async function run(ctx){
  const { sock, msg, args, files, db, util } = ctx
  const chk = await requireRegisteredEco(ctx); if(!chk.ok) return

  const id = (args[0]||'').toLowerCase().trim()
  if(!id) return sock.sendMessage(msg.key.remoteJid,{ text:'✨ Usa: $petinfo <id>' },{ quoted: msg })
  const pets = await db.loadJSON(files.PETS_FILE, {})
  const pet = pets[id]
  if(!pet) return sock.sendMessage(msg.key.remoteJid,{ text:'🐾 Mascota no encontrada. Usa $petshop para ver IDs.' },{ quoted: msg })

  const caption = [
    `🎀 ${pet.name} 🌸`,
    `💰 Precio: ₭${util.formatKirby(pet.price)}`,
    `⭐ Rareza: ${pet.rarity}`,
    `📖 ${pet.description}`
  ].join('\n')
  try{
    await sock.sendMessage(msg.key.remoteJid,{ image: { url: pet.image }, caption },{ quoted: msg })
  }catch{
    await sock.sendMessage(msg.key.remoteJid,{ text: caption },{ quoted: msg })
  }
}
