/**
 * name: removesale
 * aliases: ["removerventa"]
 * description: Elimina un personaje de tu venta
 * category: Gacha
 */

import { ensureStores, requireRegistered, loadSales, saveSales, slugify } from './_common.js'

export async function run(ctx){
  const { sock, msg, args, files, db } = ctx
  await ensureStores(files, db)
  const chk = await requireRegistered(ctx); if(!chk.ok) return
  const gid = msg.key.remoteJid; const jid = chk.jid
  const name = args.join(' ').trim()
  if(!name) return sock.sendMessage(gid,{text:'✨ Usa: $removesale <nombre>'},{quoted:msg})
  const id = slugify(name)
  const sales = await loadSales(files, db)
  const before = sales.items.length
  sales.items = sales.items.filter(it=> !(slugify(it.charId)===id && it.seller===jid))
  if(sales.items.length===before) return sock.sendMessage(gid,{text:'🌸 No encontré una venta tuya para ese personaje 💫'},{quoted:msg})
  await saveSales(files, db, sales)
  await sock.sendMessage(gid,{text:'🎀 ¡Listo! Venta eliminada 💖'},{quoted:msg})
}
