/**
 * name: importstickermaker
 * aliases: ["importsm","stickermaker"]
 * description: Importa un pack desde Sticker Maker
 * category: Stickers
 */

import axios from 'axios'
import path from 'path'
import { ensureStickerDB, getUserStickerData, ensurePackDir, saveRoot, downloadToFile } from './_common.js'

export async function run(ctx){
  const { sock, msg, args, files, db } = ctx
  const gid = msg.key.remoteJid
  const jid = msg.key?.participant || gid
  const packId = (args[0]||'').trim()
  if(!packId) return sock.sendMessage(gid,{ text:'✨ Usa: $importstickermaker <pack_id>'},{ quoted: msg })

  let meta
  try{
    const { data } = await axios.get(`https://stickermaker.s3.amazonaws.com/${packId}/metadata.json`)
    meta = data
  }catch{
    return sock.sendMessage(gid,{ text:'💔 No pude obtener el pack de Sticker Maker 💕'},{ quoted: msg })
  }

  const root = await ensureStickerDB(files, db, jid)
  const usr = getUserStickerData(root, jid)
  const packName = (meta?.name || `sm_${packId}`).replace(/[^a-zA-Z0-9_\- ]/g,'').slice(0,40)
  usr.packs[packName] ||= { description: meta?.description || 'Importado de Sticker Maker', private:false, stickers: [] }
  const dir = await ensurePackDir(files, packName)

  let imported = 0
  const items = meta?.stickers || meta?.images || []
  for (const st of items){
    try{
      const url = st?.url || st?.image || (st?.file && `https://stickermaker.s3.amazonaws.com/${packId}/${st.file}`)
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
