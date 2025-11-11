/**
 * name: getpack
 * aliases: ["stickerpack","pack"]
 * description: Descarga un pack completo (ZIP)
 * category: Stickers
 */

import path from 'path'
import { promises as fs } from 'fs'
import archiver from 'archiver'
import { ensureStickerDB, getUserStickerData, ensurePackDir } from './_common.js'

export async function run(ctx){
  const { sock, msg, args, files, db } = ctx
  const gid = msg.key.remoteJid
  const jid = msg.key?.participant || gid
  const root = await ensureStickerDB(files, db, jid)
  const usr = getUserStickerData(root, jid)
  const pack = (args[0]||usr.defaultPack||'Dreamland')
  if(!usr.packs[pack]) return sock.sendMessage(gid,{ text:'🌸 Ese pack no existe en tu colección 💕'},{ quoted: msg })
  const dir = await ensurePackDir(files, pack)
  const zipPath = path.join(files.STICKERS_DIR, `${pack}.zip`)
  // crear zip
  await new Promise((resolve, reject)=>{
    const output = fs.createWriteStream(zipPath)
    const archive = archiver('zip', { zlib: { level: 9 }})
    output.on('close', resolve)
    archive.on('error', reject)
    archive.pipe(output)
    archive.directory(dir, false)
    archive.finalize()
  })
  await sock.sendMessage(gid, { document: { url: zipPath }, fileName: `${pack}.zip`, mimetype: 'application/zip' }, { quoted: msg })
}
