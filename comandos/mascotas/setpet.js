/**
 * name: setpet
 * aliases: ["petset","favorita"]
 * description: Establece tu mascota favorita para obtener bonificaciones
 * category: Mascotas
 */

import { requireRegisteredEco, saveUsers } from '../economia/_common.js'

export async function run(ctx){
  const { sock, msg, args, files, db } = ctx
  const chk = await requireRegisteredEco(ctx); if(!chk.ok) return
  const { jid, users, u } = chk

  const id = (args[0]||'').toLowerCase().trim()
  if(!id) return sock.sendMessage(msg.key.remoteJid,{ text:'✨ Usa: $setpet <id>' },{ quoted: msg })
  const petsDb = await db.loadJSON(files.PETS_FILE, {})
  if(!petsDb[id]) return sock.sendMessage(msg.key.remoteJid,{ text:'🐾 Mascota no encontrada. Usa $petshop para ver IDs.' },{ quoted: msg })

  const owns = Array.isArray(u.pets) ? u.pets.includes(id) : false
  if(!owns) return sock.sendMessage(msg.key.remoteJid,{ text:'💔 No tienes esta mascota. Cómprala con $buypet.' },{ quoted: msg })

  u.petFav = id
  users[jid] = u
  await saveUsers(files, db, users)
  await sock.sendMessage(msg.key.remoteJid,{ text:`🎀 Mascota favorita establecida: ${petsDb[id].name} ${petsDb[id].rarity}` },{ quoted: msg })
}
