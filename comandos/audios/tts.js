/**
 * name: tts
 * aliases: ["texttospeech","voz"]
 * description: Convierte texto a voz y lo reproduce 🎙️
 * category: Audios
 */

import gtts from 'google-tts-api'

const SUPPORTED = new Set(['es','en','pt','fr','ja','ko'])

export async function run(ctx){
  const { sock, msg, args } = ctx
  const gid = msg.key.remoteJid
  if(!args.length) return sock.sendMessage(gid,{ text:'✨ Usa: $tts [idioma] [texto]. Idiomas: es,en,pt,fr,ja,ko'},{ quoted: msg })

  let lang = 'es'
  let text = args.join(' ')
  const cand = (args[0]||'').toLowerCase()
  if(SUPPORTED.has(cand)){
    lang = cand
    text = args.slice(1).join(' ')
  }
  text = (text||'').trim()
  if(!text) return sock.sendMessage(gid,{ text:'🌸 Escribe el texto a convertir a voz 💕'},{ quoted: msg })

  // Dividir en trozos <=200 chars
  const chunks = []
  let remaining = text
  while(remaining.length>200){
    chunks.push(remaining.slice(0,200))
    remaining = remaining.slice(200)
  }
  if(remaining) chunks.push(remaining)

  for(const part of chunks){
    const url = gtts.getAudioUrl(part, { lang, slow: false })
    await sock.sendMessage(gid, { audio: { url }, mimetype: 'audio/mp4', ptt: true }, { quoted: msg })
  }
  await sock.sendMessage(gid,{ text:'🎙️ ¡Aquí tienes tu voz mágica, poyo~! 🌸'},{ quoted: msg })
}
