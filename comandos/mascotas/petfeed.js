/**
 * name: petfeed
 * aliases: ["alimentar","feedpet"]
 * description: Alimenta a tu mascota para subir su felicidad (mejora tus bonos)
 * category: Mascotas
 */

import { requireRegisteredEco, saveUsers, nowBogotaISO } from '../economia/_common.js'

export async function run(ctx){
  const { sock, msg, args, files, db, util } = ctx
  const chk = await requireRegisteredEco(ctx); if(!chk.ok) return
  const { jid, users, u } = chk

  const petsDb = await db.loadJSON(files.PETS_FILE, {})
  const queryRaw = args.length ? args.join(' ') : (u.petFav||'')
  const norm = s => String(s||'').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'').trim()
  const qn = norm(queryRaw)
  if(!qn) return sock.sendMessage(msg.key.remoteJid,{ text:'✨ Usa: $petfeed <nombre o id> (o define favorita con $setpet)' },{ quoted: msg })
  let petKey = Object.keys(petsDb).find(k => norm(k) === qn)
  if(!petKey){
    petKey = Object.keys(petsDb).find(k => norm(petsDb[k]?.name) === qn)
  }
  if(!petKey) return sock.sendMessage(msg.key.remoteJid,{ text:'🐾 Mascota no encontrada. Usa $petshop para ver nombres/IDs.' },{ quoted: msg })
  const owns = Array.isArray(u.pets) ? u.pets.includes(petKey) : false
  if(!owns) return sock.sendMessage(msg.key.remoteJid,{ text:'💔 No tienes esta mascota. Cómprala con $buypet.' },{ quoted: msg })

  // Coste de alimento y efecto
  const cost = 200
  if((u.coins||0) < cost){
    return sock.sendMessage(msg.key.remoteJid,{ text:`💔 Te faltan ₭${util.formatKirby(cost - (u.coins||0))} para alimentar a tu mascota.` },{ quoted: msg })
  }

  u.petStats = typeof u.petStats === 'object' && u.petStats ? u.petStats : {}
  u.petStats[petKey] = u.petStats[petKey] || { happiness: 50, lastFed: null }

  // Pequeño cooldown de alimentación (15 min)
  const last = u.petStats[petKey].lastFed ? new Date(u.petStats[petKey].lastFed).getTime() : 0
  const now = Date.now()
  const cd = 15 * 60 * 1000
  if (last && (now - last) < cd){
    const left = Math.ceil((cd - (now - last))/60000)
    return sock.sendMessage(msg.key.remoteJid,{ text:`⏳ Espera ${left} min para volver a alimentar.` },{ quoted: msg })
  }

  u.coins = (u.coins||0) - cost
  u.petStats[petKey].happiness = Math.max(0, Math.min(100, Number(u.petStats[petKey].happiness||0) + 20))
  u.petStats[petKey].lastFed = nowBogotaISO()
  users[jid] = u
  await saveUsers(files, db, users)

  await sock.sendMessage(msg.key.remoteJid,{ text:`🍓 Alimentaste a ${petsDb[petKey].name}. Felicidad: ${u.petStats[petKey].happiness}/100 (₭${util.formatKirby(cost)})` },{ quoted: msg })
}
