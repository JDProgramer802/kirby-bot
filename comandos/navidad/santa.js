/**
  * name: santa
  * aliases: ["navidadsanta","xmassanta","regalar"]
  * description: Envia ₭ a otro usuario como Santa 🎅
  * category: Navidad
  */
 import { requireRegisteredEco, parseAmount, saveUsers } from '../economia/_common.js'
 import { EVENTS } from '../../config.js'
 import fs from 'fs'

export async function run(ctx){
  const { sock, msg, args, files, db, util } = ctx
  if(!EVENTS.CHRISTMAS_ENABLED){
    return sock.sendMessage(msg.key.remoteJid,{ text:'🎄 El evento navideño no está disponible por ahora.' },{ quoted: msg })
  }
  const chk = await requireRegisteredEco(ctx); if(!chk.ok) return
  const { jid, users, u } = chk

  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
  let to = mentioned[0]
  const looksNumber = (s)=> !!s && /[0-9]/.test(s) && !isNaN(Number(String(s).replace(/[^0-9.]/g,'')))
  let amountArg
  if(!to){
    if(looksNumber(args[0])){ amountArg = args[0]; to = args[1] } else { to = args[0]; amountArg = args[1] }
  } else {
    amountArg = looksNumber(args[0]) ? args[0] : args[1]
  }
  const normalizeTo = (raw)=>{
    if(!raw) return ''
    if(typeof raw !== 'string') return String(raw)
    let r = raw.trim()
    if(/@s\.whatsapp\.net$/.test(r) || /@lid$/.test(r)) return r
    r = r.replace(/^@+/, '')
    const digits = r.replace(/\D+/g,'')
    if(!digits) return raw
    return `${digits}@s.whatsapp.net`
  }
  to = normalizeTo(to)

  if(!to || !amountArg) return sock.sendMessage(msg.key.remoteJid,{ text:'✨ Usa: $santa @usuario <cantidad>' },{ quoted: msg })
  if(to===jid) return sock.sendMessage(msg.key.remoteJid,{ text:'🎅 Santa no entrega regalos a uno mismo.' },{ quoted: msg })

  users[to] ||= { registered:false, coins:0, bank:0 }
  const available = (u.coins||0) + (u.bank||0)
  const amount = parseAmount(amountArg, available)
  if(!amount) return sock.sendMessage(msg.key.remoteJid,{ text:'🎁 Monto inválido.' },{ quoted: msg })
  if(available < amount) return sock.sendMessage(msg.key.remoteJid,{ text:`💔 No tienes suficientes ₭ (Disponible: ${util.formatKirby(available)})` },{ quoted: msg })

  let fromWallet = Math.min(u.coins||0, amount)
  let remaining = amount - fromWallet
  let fromBank = remaining > 0 ? Math.min(u.bank||0, remaining) : 0
  u.coins = Math.max(0, (u.coins||0) - fromWallet)
  u.bank = Math.max(0, (u.bank||0) - fromBank)
  users[to].coins = (users[to].coins||0) + amount
  users[jid] = u
  await saveUsers(files, db, users)

  const parts = []
  if(fromWallet>0) parts.push(`cartera ${util.formatKirby(fromWallet)}`)
  if(fromBank>0) parts.push(`banco ${util.formatKirby(fromBank)}`)
  const card = [
    '╭─🎅 sᴀɴᴛᴀ ᴅʀᴇᴀᴍʟᴀɴᴅ ─╮',
    `│ 🎁 Enviado: ${util.formatKirby(amount)}`,
    `│ 🎄 Para: ${users[to].name||to}`,
    `│ 🧾 Origen: ${parts.join(' + ')}`,
    '╰──────────────────🌟'
  ].join('\n')
  await sock.sendMessage(msg.key.remoteJid,{ text: card },{ quoted: msg })
  try{
    if (fs.existsSync('./stickers/navidad.webp')){
      await sock.sendMessage(msg.key.remoteJid,{ sticker: { url: './stickers/navidad.webp' } },{ quoted: msg })
    }
    if (fs.existsSync('./audios/navidad.mp3')){
      await sock.sendMessage(msg.key.remoteJid,{ audio: { url: './audios/navidad.mp3' }, mimetype: 'audio/mpeg', ptt: true },{ quoted: msg })
    }
  }catch{}
}
