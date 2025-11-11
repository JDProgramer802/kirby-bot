/**
 * name: haremshop
 * aliases: ["tiendawaifus","wshop"]
 * description: Ver personajes en venta (marketplace)
 * category: Gacha
 */

import { ensureStores, loadSales } from './_common.js'

export async function run(ctx){
  const { sock, msg, args, files, db, util } = ctx
  await ensureStores(files, db)
  const gid = msg.key.remoteJid
  const sales = await loadSales(files, db)
  const page = Math.max(1, parseInt(args[0]||'1',10)||1)
  const size = 10
  const items = (sales.items||[]).slice().sort((a,b)=> new Date(b.listedAt||0)-new Date(a.listedAt||0))
  if(!items.length) return sock.sendMessage(gid,{text:'🏪 No hay personajes en venta por ahora 💫'},{quoted:msg})
  const start = (page-1)*size
  const slice = items.slice(start, start+size)
  if(!slice.length) return sock.sendMessage(gid,{text:'💫 Página fuera de rango'},{quoted:msg})
  const lines = [`🏪 Página ${page} — Usa $wshop ${page+1} para navegar`]
  slice.forEach((it,i)=> lines.push(`${start+i+1}. ${it.charId} — ${util.formatKirby(it.price)} — vendedor: ${it.seller}`))
  await sock.sendMessage(gid,{ text: lines.join('\n') },{ quoted: msg })
}
