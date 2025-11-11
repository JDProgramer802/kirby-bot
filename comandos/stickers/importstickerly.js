/**
 * name: importstickerly
 * aliases: ["importstly","stickerly"]
 * description: Importa un pack desde Sticker.ly
 * category: Stickers
 */

import axios from 'axios'
import path from 'path'
import { promises as fs } from 'fs'
import { ensureStickerDB, getUserStickerData, ensurePackDir, saveRoot, downloadToFile } from './_common.js'

export async function run(ctx){
  const { sock, msg, args, files, db } = ctx
  const gid = msg.key.remoteJid
  const jid = msg.key?.participant || gid
  if(!args.length){
    return sock.sendMessage(gid,{ text:'✨ Usa: $importstickerly <pack_id|consulta>'},{ quoted: msg })
  }
  const query = args.join(' ').trim()
  const root = await ensureStickerDB(files, db, jid)
  const usr = getUserStickerData(root, jid)

  let packInfo = null
  try {
    if (/^\d+$/.test(query)) {
      const { data } = await axios.get(`https://api.sticker.ly/v2/packs/${query}`)
      packInfo = data
    } else {
      const { data } = await axios.get(`https://api.sticker.ly/v2/search`, { params: { q: query } })
      const first = data?.results?.[0]
      if(!first) return sock.sendMessage(gid,{ text:'🌸 No encontré resultados en Sticker.ly 💕'},{ quoted: msg })
      const { data: d2 } = await axios.get(`https://api.sticker.ly/v2/packs/${first.id}`)
      packInfo = d2
    }
  } catch {
    return sock.sendMessage(gid,{ text:'💔 No pude obtener el pack de Sticker.ly 💕'},{ quoted: msg })
  }

  const packName = (packInfo?.name || `stly_${Date.now()}`).replace(/[^a-zA-Z0-9_\- ]/g,'').slice(0,40)
  usr.packs[packName] ||= { description: packInfo?.description || 'Importado de Sticker.ly', private:false, stickers: [] }
  const dir = await ensurePackDir(files, packName)
  const items = packInfo?.stickers || []
  let imported = 0
  for(const st of items){
    try{
      const url = st?.url || st?.webp || st?.image
      if(!url) continue
      const fileName = `${packName}-${st.id||Date.now()}-${Math.floor(Math.random()*9999)}.webp`
      const fp = path.join(dir, fileName)
      await downloadToFile(url, fp)
      usr.packs[packName].stickers.push(fileName)
      imported++
    }catch{}
  }
  await saveRoot(files, db, root)
  await sock.sendMessage(gid,{ text:`🎀 Importados ${imported} stickers al pack ${packName} 🌸`},{ quoted: msg })
}
