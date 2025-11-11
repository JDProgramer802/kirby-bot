/**
 * name: sell
 * aliases: ["vender"]
 * description: Pone un personaje a la venta por un precio en ₭
 * category: Gacha
 */

import { ensureStores, requireRegistered, getChar, loadSales, saveSales, saveUsers, saveChars, nowBogotaISO, slugify } from './_common.js'

export async function run(ctx){
  const { sock, msg, args, files, db, util } = ctx
  await ensureStores(files, db)
  const chk = await requireRegistered(ctx); if(!chk.ok) return
  const gid = msg.key.remoteJid; const jid = chk.jid
  const priceRaw = args[0]; const name = args.slice(1).join(' ').trim()
  const price = Number(priceRaw)
  if(!price || price<=0 || !name) return sock.sendMessage(gid,{text:'✨ Usa: $sell <precio> <nombre>'},{quoted:msg})

  const { chars, key, char } = await getChar(files, db, name)
  if(!char) return sock.sendMessage(gid,{text:'🌸 No encuentro ese personaje 💫'},{quoted:msg})
  if(char.owner !== jid) return sock.sendMessage(gid,{text:'🌸 Solo el dueñ@ puede venderlo 💕'},{quoted:msg})

  const sales = await loadSales(files, db)
  if(sales.items.some(it=>slugify(it.charId)===key)) return sock.sendMessage(gid,{text:'🌸 Ya está listado en la tienda 💫'},{quoted:msg})

  sales.items.push({ charId: key, seller: jid, price, listedAt: nowBogotaISO() })
  await saveSales(files, db, sales)
  await sock.sendMessage(gid,{text:`🏪 ${char.name} listado por ${util.formatKirby(price)}. Usa $wshop para verlo ✨`},{quoted:msg})
}
