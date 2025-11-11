// Common helpers for anime reaction commands
import { nekosBest, waifuIm } from '../../utils/fetchApi.js'
import { promises as fs } from 'fs'
import path from 'path'
import axios from 'axios'
import { spawn } from 'child_process'

export const bare = (j)=> String(j||'').split(':')[0].split('@')[0]
export const pretty = (s='')=> String(s).replace(/_/g,' ')

// Map local command => nekos.best endpoint (approx when not exact)
export const NB_MAP = {
  // emociones / acciones base
  angry: 'angry', enojado: 'angry',
  bath: 'bath',
  bite: 'bite',
  bleh: 'bleh',
  blush: 'blush',
  bored: 'bored', aburrido: 'bored',
  call: 'call',
  clap: 'clap', aplaudir: 'clap',
  coffee: ['coffee','drink'], cafe: ['coffee','drink'],
  cold: 'cold',
  cook: ['cook','eat','nom'],
  cry: 'cry',
  cuddle: 'cuddle',
  dance: 'dance',
  dramatic: 'drama', drama: 'drama',
  draw: 'draw',
  drunk: 'drunk',
  eat: ['eat','nom'], comer: ['eat','nom'],
  facepalm: 'facepalm',
  gaming: 'gaming',
  greet: 'hi', hi: 'hi',
  happy: 'happy', feliz: 'happy',
  heat: 'hot',
  hug: 'hug',
  // roleplay sin endpoint específico: aproximaciones seguras
  impregnate: 'hug', preg: 'hug', 'preñar': 'hug',
  jump: 'jump',
  kill: 'kill',
  kiss: 'kiss', muak: 'kiss',
  kisscheek: 'kiss', beso: 'kiss',
  laugh: 'laugh',
  lewd: 'lewd',
  lick: 'lick',
  love: 'love', amor: 'love',
  nope: 'nope',
  pat: 'pat',
  poke: 'poke',
  pout: 'pout',
  psycho: 'psycho',
  punch: 'punch',
  push: 'kick',
  run: 'run',
  sad: 'sad', triste: 'sad',
  scared: 'scared',
  scream: 'scream',
  seduce: 'wink',
  shy: 'shy', timido: 'shy',
  sing: 'sing',
  slap: 'slap',
  sleep: 'sleep',
  smoke: 'smoke',
  spit: 'spit', escupir: 'spit',
  step: 'kick', pisar: 'kick',
  think: 'think',
  tickle: 'tickle',
  walk: 'walk'
}

// Fallbacks universales cuando un endpoint no devuelve resultados
const COMMON_FALLBACK = [
  'hug','kiss','slap','pat','cuddle','tickle','wink','hi','happy','laugh','blush','dance','eat','bite','poke'
]

export const extractMention = (msg) => msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || null

// 30+ variantes de caption por reacción (plantillas)
const DEFAULT_LINES = [
  '{actor} hace {action} a {target} ✨',
  '{actor} en modo {action} con {target} 💫',
  '¡{actor} no se contiene y {action} a {target}! 💕',
  '{actor} decide {action} a {target}~',
  'Momento épico: {actor} {action} a {target} 🌟',
  'Dreamland vibra cuando {actor} {action} a {target}',
  '{actor} suavemente {action} a {target} 🌸',
  'Con estilo, {actor} {action} a {target}',
  '{actor} prepara energía y {action} a {target}',
  '{actor} se acerca y {action} a {target} 💖',
  '{actor} piensa… y {action} a {target}',
  '¡Sorpresa! {actor} {action} a {target}',
  '{actor} no puede evitarlo: {action} a {target}',
  'Brilla la estrella: {actor} {action} a {target} ✨',
  '{actor} y {target} protagonizan un {action} inolvidable',
  'Entre risas, {actor} {action} a {target}',
  'Con ternura, {actor} {action} a {target} 💞',
  'Cielos rosados cuando {actor} {action} a {target}',
  '{actor} marca el destino y {action} a {target}',
  '¡Fiu! {actor} {action} a {target} como un cometa 🌠',
  'Kirby aplaude mientras {actor} {action} a {target} 🎀',
  'Estela de estrellas: {actor} {action} a {target}',
  '{actor} se lanza y {action} a {target}',
  '{actor} toma valor y {action} a {target}',
  '{actor} con dulzura {action} a {target} 🍓',
  'Suena música: {actor} {action} a {target} ♪',
  '{actor} brilla al {action} a {target}',
  '¡Plot twist! {actor} {action} a {target}',
  'Momento kirbycore: {actor} {action} a {target}',
  'Entre estrellas, {actor} {action} a {target}',
  'Apapachos celestiales: {actor} {action} a {target}',
  '{actor} hace de las suyas y {action} a {target}',
  'Sueños rosados cuando {actor} {action} a {target}',
]

const LINES_BY_ACTION = {
  hug: [
    '{actor} abraza con fuerza a {target} 💞',
    '{actor} da un abracito cálido a {target} ✨',
    '¡Apapacho! {actor} abraza a {target} (づ｡◕‿‿◕｡)づ',
    ...DEFAULT_LINES,
  ],
  kiss: [
    '{actor} besa dulcemente a {target} 💋',
    '{actor} le da un muak a {target} 💖',
    'Entre estrellas, {actor} besa a {target} 🌟',
    ...DEFAULT_LINES,
  ],
  slap: [
    '¡Paf! {actor} le da una bofetada a {target} 😳',
    '{actor} suelta un guantazo suave a {target} (con amor) 💫',
    '{actor} se indigna y le da slap a {target}',
    ...DEFAULT_LINES,
  ],
  angry: [
    '{actor} está furios@ con {target} (╬ Ò﹏Ó)',
    '{actor} frunce el ceño frente a {target} 💢',
    '{actor} enoja a niveles supernova con {target}',
    ...DEFAULT_LINES,
  ],
  happy: [
    '{actor} salta de felicidad con {target} 💫',
    '¡Yei! {actor} comparte su alegría con {target} ✨',
    '{actor} brilla de felicidad junto a {target} 🌸',
    ...DEFAULT_LINES,
  ],
  greet: [
    '{actor} saluda a {target} con una sonrisa 🌈',
    '¡Hola! {actor} hace señas a {target} 👋',
    'Kirby acompaña: {actor} saluda a {target} 🎀',
    ...DEFAULT_LINES,
  ],
  hi: [
    '{actor} dice hi a {target} 👋',
    '{actor} aparece y saluda a {target} ✨',
    ...DEFAULT_LINES,
  ],
}

const pickLine = (key, actorTag, targetTag, overrides = {}) => {
  const userDefault = Array.isArray(overrides.default) ? overrides.default : null
  const userPool = Array.isArray(overrides[key]) ? overrides[key] : null
  const base = LINES_BY_ACTION[key] || DEFAULT_LINES
  const pool = userPool || userDefault || base
  const tpl = pool[Math.floor(Math.random()*pool.length)]
  const actionPretty = pretty(key)
  return tpl
    .replaceAll('{actor}', actorTag)
    .replaceAll('{target}', targetTag || '')
    .replaceAll('{action}', actionPretty)
}

// Tenor API
const getTenorKey = async (ctx) => {
  const envKey = process.env.TENOR_API_KEY || process.env.GOOGLE_TENOR_KEY
  if (envKey) return envKey
  try {
    const cfg = await ctx?.db?.loadJSON?.(ctx?.files?.CONFIG_FILE, {})
    return cfg?.tenorApiKey || ''
  } catch { return '' }
}

const tenorSearch = async (q, key, limit = 10) => {
  try {
    if (!key) return null
    const url = `https://tenor.googleapis.com/v2/search?key=${encodeURIComponent(key)}&q=${encodeURIComponent(q)}&limit=${limit}`
    const r = (await axios.get(url)).data
    const results = Array.isArray(r?.results) ? r.results : []
    if (!results.length) return null
    // preferir mp4
    const pick = (it) => {
      const fmts = it?.media_formats || {}
      const mp4 = fmts?.mp4?.url || fmts?.mediumgif?.url || fmts?.gif?.url
      if (!mp4) return null
      const isMp4 = !!fmts?.mp4?.url
      return { url: mp4, type: isMp4 ? 'mp4' : 'gif' }
    }
    // barajar y elegir el primero válido
    const shuffled = results.sort(()=>Math.random()-0.5)
    for (const it of shuffled) {
      const got = pick(it)
      if (got) return got
    }
    return null
  } catch { return null }
}

export const pickUrl = async (cmd, ctx) => {
  const mapped = NB_MAP[cmd] || cmd
  const keys = Array.isArray(mapped) ? mapped : [mapped]
  // Probar múltiples endpoints relacionados en nekos.best
  for (const nbKey of keys) {
    try {
      const r = await nekosBest(nbKey)
      const arr = r?.results || []
      if (arr.length) {
        const shuffled = arr.sort(()=>Math.random()-0.5)
        const mp4 = shuffled.find(x => String(x?.url||'').toLowerCase().endsWith('.mp4'))
        if (mp4?.url) return { url: mp4.url, type: 'mp4' }
        const webm = shuffled.find(x => String(x?.url||'').toLowerCase().endsWith('.webm'))
        if (webm?.url) return { url: webm.url, type: 'webm' }
        const gif = shuffled.find(x => String(x?.url||'').toLowerCase().endsWith('.gif'))
        if (gif?.url) return { url: gif.url, type: 'gif' }
      }
  // Probar un conjunto común de acciones si no hubo éxito
  for (const nbKey of COMMON_FALLBACK) {
    try {
      const r = await nekosBest(nbKey)
      const arr = r?.results || []
      if (arr.length) {
        const shuffled = arr.sort(()=>Math.random()-0.5)
        const mp4 = shuffled.find(x => String(x?.url||'').toLowerCase().endsWith('.mp4'))
        if (mp4?.url) return { url: mp4.url, type: 'mp4' }
        const webm = shuffled.find(x => String(x?.url||'').toLowerCase().endsWith('.webm'))
        if (webm?.url) return { url: webm.url, type: 'webm' }
        const gif = shuffled.find(x => String(x?.url||'').toLowerCase().endsWith('.gif'))
        if (gif?.url) return { url: gif.url, type: 'gif' }
      }
    } catch {}
  }
    } catch {}
  }
  // Intentar Tenor si hay API Key
  try {
    const tKey = await getTenorKey(ctx)
    if (tKey) {
      for (const k of keys) {
        const r = await tenorSearch(k, tKey, 12)
        if (r?.url) return r
      }
    }
  } catch {}
  // Intentar waifu.im solo si provee mp4 (no usual)
  try {
    const tag = cmd.toLowerCase().replace(/[^a-z0-9_]/g,'')
    const r = await waifuIm({ included_tags: tag, is_nsfw: false })
    const any = r?.images?.[0]?.url
    if (any && String(any).toLowerCase().endsWith('.mp4')) return { url: any, type: 'mp4' }
  } catch {}
  return null
}

const downloadTo = async (url, filePath) => {
  const res = await axios.get(url, { responseType: 'arraybuffer' })
  await fs.writeFile(filePath, Buffer.from(res.data))
}

const ffmpegConvertToMp4 = (inputPath, outputPath) => new Promise((resolve, reject) => {
  const args = [
    '-y',
    '-i', inputPath,
    '-movflags', '+faststart',
    '-pix_fmt', 'yuv420p',
    '-vf', 'fps=24,scale=iw:ih:flags=lanczos',
    outputPath
  ]
  const p = spawn('ffmpeg', args, { stdio: 'ignore' })
  p.on('error', reject)
  p.on('close', code => code === 0 ? resolve(true) : reject(new Error('ffmpeg failed')))
})

export const sendReaction = async (ctx, key) => {
  const { sock, msg, files, db } = ctx
  const gid = msg.key.remoteJid
  const actor = msg.key?.participant || gid
  const target = extractMention(msg)
  const media = await pickUrl(key, ctx)
  if (!media?.url) {
    return sock.sendMessage(gid,{ text: '🌸 No encontré un video para esta reacción ahora. Intenta otra 💫'},{ quoted: msg })
  }
  const actorTag = `@${bare(actor)}`
  const targetTag = target ? `@${bare(target)}` : ''
  // Cargar plantillas personalizadas (si existen)
  let overrides = {}
  try {
    const cfg = await db.loadJSON(files.REACTIONS_FILE, {})
    overrides = cfg?.templates || {}
  } catch {}
  const line = target ? pickLine(key, actorTag, targetTag, overrides) : `${actorTag} está en modo ${pretty(key)}`
  const mentions = [actor, target].filter(Boolean)
  if (media.type === 'mp4') {
    await sock.sendMessage(gid, { video: { url: media.url }, caption: `✨ ${line}`, mentions }, { quoted: msg })
    return
  }
  // GIF/WEBM -> descargar y convertir a MP4 localmente
  try {
    const dir = files.STICKERS_DIR // usar directorio ya existente para temporales
    const ext = media.type === 'gif' ? 'gif' : media.type === 'webm' ? 'webm' : 'bin'
    const inPath = path.join(dir, `rx-${Date.now()}.${ext}`)
    const outPath = path.join(dir, `rx-${Date.now()}.mp4`)
    await downloadTo(media.url, inPath)
    await ffmpegConvertToMp4(inPath, outPath)
    await sock.sendMessage(gid, { video: { url: outPath }, caption: `✨ ${line}`, mentions }, { quoted: msg })
    try { await fs.unlink(inPath) } catch {}
    // opcional: limpiar mp4 después de enviar (WhatsApp puede tardar en leer del FS). Mejor no borrar de inmediato.
  } catch {
    await sock.sendMessage(gid,{ text: '🌸 No pude convertir la animación. Intenta otra reacción 💫'},{ quoted: msg })
  }
}
