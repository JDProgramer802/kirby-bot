/**
 * name: buycharacter
 * aliases: ["buychar","buyc"]
 * description: Compra un personaje listado en venta
 * category: Gacha
 */

import { ensureStores, requireRegistered, getChar, saveChars, saveUsers, loadSales, saveSales, slugify } from './_common.js'

export async function run(ctx){
  const { sock, msg, args, files, db, util } = ctx
  await ensureStores(files, db)
  const chk = await requireRegistered(ctx); if(!chk.ok) return
  const gid = msg.key.remoteJid; const buyer = chk.jid
  const name = args.join(' ').trim(); if(!name) return sock.sendMessage(gid,{text:'✨ Usa: $buychar <nombre>'},{quoted:msg})

  const sales = await loadSales(files, db)
  const id = slugify(name)
  const itemIdx = sales.items.findIndex(it=>slugify(it.charId)===id)
  if(itemIdx<0) return sock.sendMessage(gid,{text:'🌸 Ese personaje no está en venta 💫'},{quoted:msg})
  const item = sales.items[itemIdx]

  const users = await db.loadJSON(files.USERS_FILE,{})
  const seller = item.seller
  if(seller === buyer) return sock.sendMessage(gid,{text:'🌸 No puedes comprarte a ti mism@ 💕'},{quoted:msg})
  users[buyer] ||= { registered:false, coins:0, claims:[] }
  users[seller] ||= { registered:false, coins:0, claims:[] }
  const price = Number(item.price||0)
  if((users[buyer].coins||0) < price) return sock.sendMessage(gid,{text:`🌸 Te faltan KirbyCoins. Precio: ${util.formatKirby(price)} 💫`},{quoted:msg})

  const { chars, key, char } = await getChar(files, db, id)
  if(!char) return sock.sendMessage(gid,{text:'🌸 No encuentro el personaje en catálogo 💫'},{quoted:msg})
  if(char.owner !== seller) return sock.sendMessage(gid,{text:'🌸 El vendedor ya no es el dueño. La lista es inválida 💫'},{quoted:msg})

  // Transferencias
  users[buyer].coins = (users[buyer].coins||0) - price
  users[seller].coins = (users[seller].coins||0) + price
  // mover en claims
  users[buyer].claims = Array.isArray(users[buyer].claims)?users[buyer].claims:[]
  users[seller].claims = Array.isArray(users[seller].claims)?users[seller].claims:[]
  users[seller].claims = users[seller].claims.filter(c=>c!==key)
  if(!users[buyer].claims.includes(key)) users[buyer].claims.push(key)
  // owner
  char.owner = buyer
  chars[key] = char

  // guardar
  sales.items.splice(itemIdx,1)
  await saveSales(files, db, sales)
  await saveChars(files, db, chars)
  await saveUsers(files, db, users)

  await sock.sendMessage(gid,{text:`💫 ${users[buyer].name||buyer} compró ${char.name} por ${util.formatKirby(price)} 🎀`},{quoted:msg})
}
