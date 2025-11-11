/**
 * name: importcatalog
 * aliases: ["gachaimport","importchars"]
 * description: Importa/actualiza el catálogo de personajes para rollwaifu desde un JSON (URL o citado)
 * category: Gacha
 */

import { ensureStores, requireRegistered, slugify, saveChars } from './_common.js'

export async function run(ctx){
  const { sock, msg, args, files, db } = ctx
  await ensureStores(files, db)
  const chk = await requireRegistered(ctx); if(!chk.ok) return
  const gid = msg.key.remoteJid

  // Solo owner por seguridad
  const owner = process.env.BOT_OWNER || ''
  const jid = msg.key?.participant || gid
  if(!owner || jid !== owner){
    return sock.sendMessage(gid,{ text:'🚫 Solo mi dueñ@ puede importar el catálogo 💔'},{ quoted: msg })
  }

  // Obtener JSON del catálogo
  let catalog = null
  try {
    // 1) Si hay URL
    const url = (args[0]||'').trim()
    if(/^https?:\/\//i.test(url)){
      const res = await fetch(url)
      catalog = await res.json()
    }
  } catch {}

  // 2) Si viene citado como documento/texto
  if(!catalog){
    try{
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
      const doc = quoted?.documentMessage
      const txt = quoted?.extendedTextMessage?.text || quoted?.conversation
      if(doc){
        const { downloadContentFromMessage } = await import('@whiskeysockets/baileys')
        const stream = await downloadContentFromMessage(doc, 'document')
        let buf = Buffer.from([])
        for await (const ch of stream) buf = Buffer.concat([buf, ch])
        catalog = JSON.parse(buf.toString('utf8'))
      } else if (txt) {
        catalog = JSON.parse(txt)
      }
    }catch{}
  }

  if(!catalog){
    return sock.sendMessage(gid,{ text:'✨ Provee una URL o responde con un archivo/texto JSON del catálogo.'},{ quoted: msg })
  }

  // Esperamos un array de objetos: { name, serie, value, images[], videos[] }
  if(!Array.isArray(catalog)){
    return sock.sendMessage(gid,{ text:'🌸 El catálogo debe ser un array JSON de personajes 💕'},{ quoted: msg })
  }

  const chars = await db.loadJSON(files.CHARACTERS_FILE, {})
  let added=0, updated=0
  for(const it of catalog){
    try{
      const name = String(it.name||'').trim()
      if(!name) continue
      const key = slugify(name)
      const prev = chars[key]
      const entry = {
        id: key,
        name,
        serie: String(it.serie||'').trim(),
        value: Number(it.value||0),
        images: Array.isArray(it.images)? it.images.filter(Boolean) : [],
        videos: Array.isArray(it.videos)? it.videos.filter(Boolean) : [],
        owner: prev?.owner || null,
      }
      if(prev) updated++; else added++
      chars[key] = { ...prev, ...entry }
    }catch{}
  }
  await saveChars(files, db, chars)
  await sock.sendMessage(gid,{ text:`🎀 Catálogo importado: ${added} nuevos, ${updated} actualizados 🌸`},{ quoted: msg })
}
