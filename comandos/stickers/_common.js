// Helpers comunes para módulo Stickers
import { promises as fs } from 'fs'
import path from 'path'
import axios from 'axios'

export const ensureStickerDB = async (files, db, jid) => {
  await fs.mkdir(files.STICKERS_DIR, { recursive: true })
  const root = await db.loadJSON(files.STICKERS_DB, { users: {} })
  // Asegurar estructura aún si el archivo existente está corrupto o legado
  if (!root || typeof root !== 'object') {
    Object.assign(root, { users: {} })
  }
  if (!root.users || typeof root.users !== 'object') {
    root.users = {}
  }
  root.users[jid] ||= {
    defaultAuthor: 'Kirby Dream',
    defaultPack: 'Dreamland',
    packs: { Dreamland: { description: 'Stickers mágicos ✨', private: false, stickers: [] } },
    favouritePack: 'Dreamland',
  }
  await db.saveJSON(files.STICKERS_DB, root)
  return root
}

export const getUserStickerData = (root, jid) => root.users[jid]
export const saveRoot = async (files, db, root) => db.saveJSON(files.STICKERS_DB, root)

export const ensurePackDir = async (files, pack) => {
  const dir = path.join(files.STICKERS_DIR, pack)
  await fs.mkdir(dir, { recursive: true })
  return dir
}

export const downloadToFile = async (url, filePath) => {
  const res = await axios.get(url, { responseType: 'arraybuffer' })
  await fs.writeFile(filePath, Buffer.from(res.data))
}

export const saveQuotedMedia = async (sock, msg, filePath) => {
  const q = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
  const any = q?.imageMessage || q?.videoMessage || q?.stickerMessage || msg.message?.imageMessage || msg.message?.videoMessage || msg.message?.stickerMessage
  if (!any) return null
  const { downloadContentFromMessage } = await import('@whiskeysockets/baileys')
  const type = any.imageMessage ? 'image' : any.videoMessage ? 'video' : 'sticker'
  const stream = await downloadContentFromMessage(any[type + 'Message'] || any, type)
  let buffer = Buffer.from([])
  for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
  await fs.writeFile(filePath, buffer)
  return { type, filePath }
}
