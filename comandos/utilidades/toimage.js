/**
 * name: toimage
 * aliases: ["toimg","img","convertimg"]
 * description: Convierte un sticker a imagen PNG (usa ffmpeg).
 * category: Utilidades
 */

import fs from 'fs'
import os from 'os'
import path from 'path'
import { spawn } from 'child_process'
import { downloadContentFromMessage } from '@whiskeysockets/baileys'

export async function run(ctx){
  const { sock, msg } = ctx
  const gid = msg.key.remoteJid
  const q = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
  if(!q || (!q.stickerMessage)){
    return sock.sendMessage(gid,{ text:'🌸 ¡Responde a un sticker para convertirlo a imagen, Dreamer~! 💫' },{ quoted: msg })
  }
  try{
    const stream = await downloadContentFromMessage(q.stickerMessage, 'sticker')
    const chunks = []
    for await (const c of stream) chunks.push(c)
    const webpBuf = Buffer.concat(chunks)

    const tmpIn = path.join(os.tmpdir(), `kd_${Date.now()}.webp`)
    const tmpOut = path.join(os.tmpdir(), `kd_${Date.now()}.png`)
    fs.writeFileSync(tmpIn, webpBuf)

    await new Promise((res, rej)=>{
      const ff = spawn('ffmpeg', ['-y','-i', tmpIn, tmpOut])
      ff.on('error', rej)
      ff.on('close', code=> code===0?res():rej(new Error('ffmpeg falló')))
    })

    const png = fs.readFileSync(tmpOut)
    await sock.sendMessage(gid, { image: png, caption:'🌸 ¡Listo! ✨' }, { quoted: msg })

    fs.unlink(tmpIn, ()=>{})
    fs.unlink(tmpOut, ()=>{})
  }catch(e){
    await sock.sendMessage(gid,{ text:`❌ Ups~ no pude convertirlo: ${e?.message||e}` },{ quoted: msg })
  }
}
