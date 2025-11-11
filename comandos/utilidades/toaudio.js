/**
 * name: toaudio
 * aliases: ["convert","mp3","extractaudio","extraeraudio","video2audio","audio"]
 * description: Convierte un video en audio con ffmpeg.
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
  const v = q?.videoMessage || q?.audioMessage || msg.message?.videoMessage
  if(!v){
    return sock.sendMessage(gid,{ text:'🌸 Responde a un video/notita para convertir a audio~ 💫' },{ quoted: msg })
  }
  try{
    const kind = v.mimetype?.includes('audio') ? 'audio' : 'video'
    const stream = await downloadContentFromMessage(v, kind)
    const chunks = []
    for await (const c of stream) chunks.push(c)
    const inBuf = Buffer.concat(chunks)

    const tmpIn = path.join(os.tmpdir(), `kd_${Date.now()}.${kind==='video'?'mp4':'ogg'}`)
    const tmpOut = path.join(os.tmpdir(), `kd_${Date.now()}.mp3`)
    fs.writeFileSync(tmpIn, inBuf)

    await new Promise((res, rej)=>{
      const ff = spawn('ffmpeg', ['-y','-i', tmpIn, '-vn','-codec:a','libmp3lame','-q:a','2', tmpOut])
      ff.on('error', rej)
      ff.on('close', code=> code===0?res():rej(new Error('ffmpeg falló')))
    })

    const mp3 = fs.readFileSync(tmpOut)
    await sock.sendMessage(gid, { audio: mp3, mimetype: 'audio/mpeg' }, { quoted: msg })

    fs.unlink(tmpIn, ()=>{})
    fs.unlink(tmpOut, ()=>{})
  }catch(e){
    await sock.sendMessage(gid,{ text:`❌ Ups~ no pude convertirlo: ${e?.message||e}` },{ quoted: msg })
  }
}
