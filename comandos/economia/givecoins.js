/**
 * name: givecoins
 * aliases: ["pay","coinsgive"]
 * description: Envia ₭ a otro usuario 💸
 * category: Economía
 */

import { requireRegisteredEco, parseAmount, saveUsers } from './_common.js'

export async function run(ctx){
  const { sock, msg, args, files, db, util } = ctx
  const chk = await requireRegisteredEco(ctx); if(!chk.ok) return
  const { jid, users, u } = chk

  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
  let to = mentioned[0]
  // Aceptar ambos órdenes: <@user> <monto> | <monto> <@user>
  const looksNumber = (s)=> !!s && /[0-9]/.test(s) && !isNaN(Number(String(s).replace(/[^0-9.]/g,'')))
  let amountArg
  if(!to){
    // Sin mención real, inferir por args
    if(looksNumber(args[0])){
      amountArg = args[0]
      to = args[1]
    } else {
      to = args[0]
      amountArg = args[1]
    }
  } else {
    // Hay mención real; cantidad es el otro argumento
    amountArg = looksNumber(args[0]) ? args[0] : args[1]
  }

  // Normalizar 'to' cuando es texto como '@523...' o '523...'
  const normalizeTo = (raw)=>{
    if(!raw) return ''
    if(typeof raw !== 'string') return String(raw)
    let r = raw.trim()
    // Si ya es JID completo
    if(/@s\.whatsapp\.net$/.test(r) || /@lid$/.test(r)) return r
    // Si es @mención escrita
    r = r.replace(/^@+/, '')
    // Dejar solo dígitos
    const digits = r.replace(/\D+/g,'')
    if(!digits) return raw
    return `${digits}@s.whatsapp.net`
  }
  to = normalizeTo(to)

  if(!to || !amountArg) return sock.sendMessage(msg.key.remoteJid,{ text:'✨ Usa: $givecoins @usuario <cantidad> (también acepta: $givecoins <cantidad> @usuario)' },{ quoted: msg })
  if(to===jid) return sock.sendMessage(msg.key.remoteJid,{ text:'🌸 No puedes transferirte a ti mism@ 💕' },{ quoted: msg })

  users[to] ||= { registered:false, coins:0, bank:0 }
  const available = (u.coins||0) + (u.bank||0)
  const amount = parseAmount(amountArg, available)
  if(!amount) return sock.sendMessage(msg.key.remoteJid,{ text:'🌸 Monto inválido 💫' },{ quoted: msg })
  if(available < amount) return sock.sendMessage(msg.key.remoteJid,{ text:`💔 No tienes suficientes ₭ (Disponible: ${util.formatKirby(available)})` },{ quoted: msg })

  // Descontar primero de cartera, luego del banco
  let fromWallet = Math.min(u.coins||0, amount)
  let remaining = amount - fromWallet
  let fromBank = 0
  if(remaining > 0){
    fromBank = Math.min(u.bank||0, remaining)
  }
  u.coins = Math.max(0, (u.coins||0) - fromWallet)
  u.bank = Math.max(0, (u.bank||0) - fromBank)
  users[to].coins = (users[to].coins||0) + amount
  users[jid] = u
  await saveUsers(files, db, users)
  const parts = []
  if(fromWallet>0) parts.push(`cartera ${util.formatKirby(fromWallet)}`)
  if(fromBank>0) parts.push(`banco ${util.formatKirby(fromBank)}`)
  await sock.sendMessage(msg.key.remoteJid,{ text:`💸 Enviados ${util.formatKirby(amount)} a ${users[to].name||to} 🎀\n🧾 Origen: ${parts.join(' + ')}` },{ quoted: msg })
}
