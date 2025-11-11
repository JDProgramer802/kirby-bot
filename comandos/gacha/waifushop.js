/**
 * name: waifushop
 * aliases: ["shop","tienda","wshop"]
 * description: Tienda diaria de waifus/husbandos. Muestra 10 ofertas al día y permite comprar.
 * category: Gacha
 */

import {
  ensureStores,
  requireRegistered,
  saveUsers,
  saveChars,
  loadSales,
  saveSales,
  recalcHaremValue,
  nowBogotaISO,
} from './_common.js'

function todayKey() {
  const d = new Date()
  const off = 5 * 60 * 60 * 1000
  const t = new Date(d.getTime() - off).toISOString().slice(0,10)
  return t
}

function pickRandom(arr, n) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a.slice(0, n)
}

function priceFor(char){
  const base = Number(char?.value||0)
  const mult = 0.7 + Math.random() * 0.8 // 0.7x a 1.5x
  const p = Math.max(100, Math.round(base * mult))
  return p
}

export async function run(ctx){
  const { sock, msg, args, files, db, util } = ctx
  const gid = msg.key.remoteJid
  await ensureStores(files, db)

  const chk = await requireRegistered(ctx)
  if (!chk.ok) return
  const jid = chk.jid

  // cargar estructuras
  const chars = await db.loadJSON(files.CHARACTERS_FILE, {})
  const users = await db.loadJSON(files.USERS_FILE, {})
  const sales = await loadSales(files, db)

  // rotación diaria automática
  const today = todayKey()
  sales.lastDay ||= ''
  sales.items = Array.isArray(sales.items) ? sales.items : []

  const needRotate = sales.lastDay !== today || sales.items.length === 0
  if (needRotate) {
    const ids = Object.keys(chars)
    if (ids.length >= 1) {
      // priorizar sin dueño
      const unclaimed = ids.filter(id=>!chars[id]?.owner)
      const pool = (unclaimed.length >= 10 ? unclaimed : ids)
      const picks = pickRandom(pool, Math.min(10, pool.length))
      sales.items = picks.map(id=>({ id, price: priceFor(chars[id]), sold: false }))
      sales.lastDay = today
      sales.generatedAt = nowBogotaISO()
      await saveSales(files, db, sales)
    }
  }

  // comprar
  if ((args[0]||'').toLowerCase() === 'buy' || (args[0]||'').toLowerCase() === 'comprar'){
    const target = (args[1]||'').toLowerCase()
    if (!target) {
      return sock.sendMessage(gid,{ text: '✨ Usa: $waifushop buy <id|#pos> (por ejemplo: $waifushop buy #3 o $waifushop buy kirby)' },{ quoted: msg })
    }
    let idx = -1
    let item = null
    if (target.startsWith('#')){
      const pos = parseInt(target.slice(1),10)
      if (!Number.isFinite(pos) || pos<1 || pos>sales.items.length) {
        return sock.sendMessage(gid,{ text: '🌸 Posición inválida.' },{ quoted: msg })
      }
      idx = pos-1
      item = sales.items[idx]
    } else {
      idx = sales.items.findIndex(x=>String(x.id).toLowerCase()===target)
      if (idx>=0) item = sales.items[idx]
    }
    if (!item) return sock.sendMessage(gid,{ text: '💫 Esa oferta no existe en la tienda actual.' },{ quoted: msg })
    if (item.sold) return sock.sendMessage(gid,{ text: '❌ Ya fue vendida.' },{ quoted: msg })

    const ch = chars[item.id]
    if (!ch) return sock.sendMessage(gid,{ text: '❌ El personaje ya no está disponible.' },{ quoted: msg })
    if (ch.owner) return sock.sendMessage(gid,{ text: '💔 Ya tiene dueñ@.' },{ quoted: msg })

    users[jid] ||= { registered: true, coins: 0 }
    const coins = Number(users[jid].coins||0)
    if (coins < item.price) return sock.sendMessage(gid,{ text: `🪙 Fondos insuficientes. Necesitas ₭ ${util.formatKirby(item.price)} y tienes ₭ ${util.formatKirby(coins)}.` },{ quoted: msg })

    // cobrar y asignar
    users[jid].coins = coins - item.price
    ch.owner = jid
    // claims
    users[jid].claims = Array.isArray(users[jid].claims)? users[jid].claims : []
    if (!users[jid].claims.includes(ch.id)) users[jid].claims.push(ch.id)
    recalcHaremValue(users, jid, chars)
    item.sold = true
    item.buyer = jid
    item.soldAt = nowBogotaISO()

    await saveUsers(files, db, users)
    await saveChars(files, db, chars)
    await saveSales(files, db, sales)

    const txt = `🎀 ¡Compra exitosa!\n❀ Nombre » ${ch.name}\n✰ Precio » ₭ ${util.formatKirby(item.price)}\n♡ Dueñ@ » Tú ✨`
    return sock.sendMessage(gid,{ text: txt },{ quoted: msg })
  }

  // listar tienda
  if (!sales.items.length){
    return sock.sendMessage(gid,{ text: '🌸 La tienda está vacía por ahora. Vuelve más tarde~' },{ quoted: msg })
  }

  const lines = []
  lines.push(`🛍️ Tienda de Waifus — Día ${today}`)
  lines.push('')
  for (let i=0;i<sales.items.length;i++){
    const it = sales.items[i]
    const ch = chars[it.id]
    if (!ch) continue
    const estado = it.sold ? 'VENDIDA' : (ch.owner ? 'NO DISP.' : 'DISPONIBLE')
    lines.push(`#${i+1}. ${ch.name} — ₭ ${util.formatKirby(it.price)} — ${estado}`)
  }
  lines.push('')
  lines.push('Usa: $waifushop buy <id|#pos>')

  await sock.sendMessage(gid,{ text: lines.join('\n') },{ quoted: msg })
}
