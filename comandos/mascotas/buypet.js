/**
 * name: buypet
 * aliases: ["comprarmascota"]
 * description: Compra una mascota del Petshop
 * category: Mascotas
 */

import { requireRegisteredEco, saveUsers } from '../economia/_common.js'

export async function run(ctx){
  const { sock, msg, args, files, db, util } = ctx
  const chk = await requireRegisteredEco(ctx); if(!chk.ok) return
  const { jid, users, u } = chk

  const query = (args.join(' ')||'').trim()
  if(!query) return sock.sendMessage(msg.key.remoteJid,{ text:'✨ Usa: $buypet <nombre o id>' },{ quoted: msg })

  const pets = await db.loadJSON(files.PETS_FILE, {})
  const norm = s => String(s||'').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'').trim()
  const qn = norm(query)
  // Buscar por id exacto o por nombre
  let petKey = Object.keys(pets).find(k => norm(k) === qn)
  if(!petKey){
    petKey = Object.keys(pets).find(k => norm(pets[k]?.name) === qn)
  }
  const pet = petKey ? pets[petKey] : null
  if(!pet) return sock.sendMessage(msg.key.remoteJid,{ text:'🐾 Mascota no encontrada. Usa $petshop para ver nombres/IDs.' },{ quoted: msg })

  const available = (u.coins||0) + (u.bank||0)
  if(available < pet.price){
    return sock.sendMessage(msg.key.remoteJid,{ text:`💔 No tienes suficientes ₭ para comprar ${pet.name}. Disponible: ${util.formatKirby(available)} / Requiere: ${util.formatKirby(pet.price)}` },{ quoted: msg })
  }

  // Descontar primero de cartera, luego del banco
  let fromWallet = Math.min(u.coins||0, pet.price)
  let remaining = pet.price - fromWallet
  let fromBank = remaining > 0 ? Math.min(u.bank||0, remaining) : 0
  u.coins = Math.max(0, (u.coins||0) - fromWallet)
  u.bank = Math.max(0, (u.bank||0) - fromBank)
  u.pets = Array.isArray(u.pets) ? u.pets : []
  if(!u.pets.includes(pet.id)) u.pets.push(pet.id)
  // Inicializar stats de la mascota comprada
  u.petStats = typeof u.petStats === 'object' && u.petStats ? u.petStats : {}
  u.petStats[pet.id] = u.petStats[pet.id] || { happiness: 50, lastFed: null }
  // Si no hay favorita, setear esta
  if(!u.petFav) u.petFav = pet.id
  users[jid] = u
  await saveUsers(files, db, users)

  const parts = []
  if(fromWallet>0) parts.push(`cartera ${util.formatKirby(fromWallet)}`)
  if(fromBank>0) parts.push(`banco ${util.formatKirby(fromBank)}`)
  const text = [
    `🐾 Compraste a *${pet.name}* por ₭${util.formatKirby(pet.price)} 💕`,
    `🧾 Origen: ${parts.join(' + ')}`,
    `${pet.description || ''}`
  ].join('\n')

  try{
    await sock.sendMessage(msg.key.remoteJid,{ image: { url: pet.image }, caption: text },{ quoted: msg })
  }catch{
    await sock.sendMessage(msg.key.remoteJid,{ text },{ quoted: msg })
  }
}
