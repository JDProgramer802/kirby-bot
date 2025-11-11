/**
 * name: brat
 * aliases: ["!brat","stickertext","txtsticker"]
 * description: Genera un sticker con fondo blanco y texto personalizado
 * category: Stickers
 */

import path from 'path'
import { promises as fs } from 'fs'
import { Sticker, StickerTypes } from 'wa-sticker-formatter'
// Importación diferida de 'canvas' dentro de run() para evitar fallo en el loader si no está instalado

function wrapTextSimple(text, maxChars){
  const words = (text||'').split(/\s+/)
  const lines = []
  let line = ''
  for(const w of words){
    const test = (line ? line + ' ' : '') + w
    if(test.length > maxChars){
      if(line) lines.push(line)
      line = w
    } else {
      line = test
    }
  }
  if(line) lines.push(line)
  return lines
}

async function pngFromText(text){
  const W = 512, H = 512
  const mod = await import('canvas')
  const createCanvas = mod.createCanvas || (mod.default && mod.default.createCanvas)
  if(!createCanvas) throw new Error('canvas no disponible')
  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext('2d')
  // Fondo blanco
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0,0,W,H)

  // Heurística de tamaño inicial
  let fontSize = 48
  if(text.length > 20) fontSize = 42
  if(text.length > 40) fontSize = 36
  if(text.length > 70) fontSize = 30

  ctx.fillStyle = '#111111'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Envoltura de líneas por ancho real
  const setFont = ()=> ctx.font = `${fontSize}px Arial, sans-serif`
  setFont()
  const maxWidth = W * 0.9
  const words = String(text||'').split(/\s+/)
  const lines = []
  let line = ''
  for(const w of words){
    const test = line ? `${line} ${w}` : w
    const wTest = ctx.measureText(test).width
    if(wTest > maxWidth){
      if(line) lines.push(line)
      line = w
    } else {
      line = test
    }
  }
  if(line) lines.push(line)

  // Si demasiadas líneas, reducir fuente
  const lineHeight = Math.floor(fontSize * 1.25)
  while(lines.length * lineHeight > H * 0.9 && fontSize > 18){
    fontSize -= 2
    setFont()
  }

  const totalHeight = lines.length * Math.floor(fontSize * 1.25)
  let y = Math.floor((H - totalHeight)/2 + (fontSize * 1.25)/2)
  for(let i=0;i<lines.length;i++){
    ctx.fillText(lines[i], W/2, y + i * Math.floor(fontSize * 1.25))
  }
  return canvas.toBuffer('image/png')
}

export async function run(ctx){
  const { sock, msg, args, files } = ctx
  const gid = msg.key.remoteJid
  const text = args.join(' ').trim()
  if(!text) return sock.sendMessage(gid,{ text:'🌸 ¡Ups~! Debes escribir algo, poyo 💕'},{ quoted: msg })

  let pngBuf
  try {
    pngBuf = await pngFromText(text)
  } catch (e) {
    return sock.sendMessage(gid,{ text:'⚠️ Para usar este comando necesitas instalar dependencias nativas: npm i canvas'},{ quoted: msg })
  }
  const tmpPng = path.join(files.STICKERS_DIR, 'brat_temp.png')
  await fs.writeFile(tmpPng, pngBuf)

  const sticker = new Sticker(tmpPng, {
    pack: 'Brat Texts',
    author: 'Kirby Dream',
    type: StickerTypes.FULL,
  })
  await sock.sendMessage(gid, await sticker.toMessage(), { quoted: msg })
  try{ await fs.unlink(tmpPng) }catch{}
  await sock.sendMessage(gid,{ text:'🎨 ¡Sticker de texto generado con éxito, poyo~! 🌸💫'},{ quoted: msg })
}
