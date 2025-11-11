/**
 * name: populatecatalog
 * aliases: ["gachapopulate","fillcatalog"]
 * description: Completa/el enriquece el catálogo existente consultando Waifu.im (fallback Nekos.best)
 * category: Gacha
 */

import { ensureStores, requireRegistered, slugify, saveChars } from './_common.js'
import { waifuIm, nekosBest } from '../../utils/fetchApi.js'

export async function run(ctx){
  const { sock, msg, args, files, db } = ctx
  const gid = msg.key.remoteJid
  const owner = process.env.BOT_OWNER || ''
  const jid = msg.key?.participant || gid
  const isGroup = gid?.endsWith('@g.us')
  let allowed = false
  if (owner && jid === owner) allowed = true
  if (isGroup) {
    try {
      const meta = await sock.groupMetadata(gid)
      const bare = (j)=> String(j||'').split(':')[0].split('@')[0]
      const adminsBare = (meta.participants||[]).filter(p=>p.admin).map(p=>bare(p.id))
      if (adminsBare.includes(bare(jid))) allowed = true
    } catch {}
  }
  if(!allowed){
    return sock.sendMessage(gid,{ text:'🚫 Solo admins u owner pueden poblar el catálogo 💔'},{ quoted: msg })
  }

  await ensureStores(files, db)
  const mode = (args.find(a=>/^mode=/.test(a))||'mode=missing').split('=')[1]
  const startArg = args.find(a=>/^start=\d+$/i.test(a))
  const stepArg = args.find(a=>/^step=\d+$/i.test(a)) || args.find(a=>/^\+\d+$/i.test(a))
  let start = startArg ? parseInt(startArg.split('=')[1],10) : 500
  let step = stepArg ? parseInt(stepArg.replace(/^.*?(\d+)/,'$1'),10) : 100
  const limArg = args.find(a=>/^limit=\d+$/i.test(a))
  const limit = limArg ? parseInt(limArg.split('=')[1],10) : 5
  const paramsRegex = /^(mode=|limit=\d+|start=\d+|step=\d+|\+\d+)/i
  const rest = args.filter(a=>!paramsRegex.test(a))
  const filter = rest.map(s=>String(s).toLowerCase())

  const chars = await db.loadJSON(files.CHARACTERS_FILE, {})
  const keys = Object.keys(chars)
  if(!keys.length){
    return sock.sendMessage(gid,{ text:'🌸 No hay personajes en el catálogo para poblar 💫'},{ quoted: msg })
  }

  const inferGender = (k='') => {
    const s = String(k).toLowerCase()
    if (/(^|\b)(boy|male|man|hombre)(\b|$)/.test(s)) return 'Hombre'
    if (/(^|\b)(girl|female|woman|mujer)(\b|$)/.test(s)) return 'Mujer'
    if (/(waifu|neko|maid|idol|nurse|bunny|kimono|blonde|pink_hair|blue_hair|brown_hair|long_hair|short_hair|glasses|school|uniform|goth|elf|catgirl|bikini)/.test(s)) return 'Mujer'
    return '—'
  }
  const pretty = (s='') => String(s).replace(/_/g,' ').replace(/\b\w/g, c=>c.toUpperCase())

  let updated = 0
  let added = 0

  // Soporte crear nuevos: mode=create
  if (mode === 'create') {
    const baseList = filter.length ? filter : [
      'waifu','neko','maid','uniform','blonde','blue_hair','brown_hair',
      'pink_hair','short_hair','long_hair','smile','wink','blush','glasses',
      'school','kimono','bikini','idol','catgirl','nurse','bunny','goth','elf',
      'pokemon','kirby'
    ]
    let idx = 0
    for (const tagRaw of baseList) {
      const tag = String(tagRaw).trim()
      if (!tag) continue
      const key = slugify(tag)
      if (chars[key]) continue
      // buscar imágenes
      let imgs = []
      try {
        const res = await waifuIm({ included_tags: key, is_nsfw: false, many: true, limit })
        imgs = (res?.images||[]).map(i=>i?.url).filter(Boolean)
      } catch {}
      if (!imgs.length) {
        try { const nb = await nekosBest('neko'); const url = nb?.results?.[0]?.url; if (url) imgs = [url] } catch {}
      }
      if (!imgs.length) continue
      const g = inferGender(key)
      const entry = {
        id: key,
        name: String(tag).replace(/_/g,' '),
        serie: pretty(tag),
        value: start + idx*step,
        images: imgs.slice(0, Math.max(limit, 10)),
        videos: [],
        owner: null,
        gender: g,
        genero: g,
      }
      chars[key] = entry
      added++
      idx++
    }
    await saveChars(files, db, chars)
    await sock.sendMessage(gid,{ text:`🌸 Catálogo poblado: ${added} nuevos añadidos\n🔧 Modo: ${mode}\n🪙 Valores desde ${start} en pasos de ${step}${filter.length?`\n🔎 Tags: ${filter.join(', ')}`:''}\n🖼️ Límite imágenes por tag: ${limit}`},{ quoted: msg })
    return
  }

  for(const key of keys){
    const ch = chars[key]
    const name = ch?.name || key
    if (filter.length){
      const L = (name + ' ' + key).toLowerCase()
      if (!filter.some(f=>L.includes(f))) continue
    }

    let changed = false

    // Serie si falta
    if (!ch.serie || !String(ch.serie).trim()) { ch.serie = pretty(name); changed = true }

    // Genero si falta
    if (!ch.gender && !ch.genero) {
      const g = inferGender(key + ' ' + name)
      ch.gender = g; ch.genero = g; changed = true
    }

    // Imágenes: completar segun mode
    try {
      const includeTag = slugify(name)
      const res = await waifuIm({ included_tags: includeTag, is_nsfw: false, many: true, limit })
      const imgs = (res?.images||[]).map(i=>i?.url).filter(Boolean)
      if (imgs.length){
        const prev = Array.isArray(ch.images) ? ch.images : []
        if (mode === 'overwrite') {
          ch.images = Array.from(new Set(imgs)).slice(0, Math.max(limit, 10))
          changed = true
        } else {
          const merged = Array.from(new Set([ ...prev, ...imgs ]))
          if (merged.length !== prev.length) { ch.images = merged.slice(0, Math.max(limit, 10)); changed = true }
        }
      }
    } catch {}

    // Fallback Nekos.best si aún no hay imágenes
    if (!Array.isArray(ch.images) || ch.images.length === 0) {
      try {
        const nb = await nekosBest('neko')
        const url = nb?.results?.[0]?.url
        if (url) { ch.images = [url]; changed = true }
      } catch {}
    }

    if (changed){
      chars[key] = ch
      updated++
    }
  }

  await saveChars(files, db, chars)
  await sock.sendMessage(gid,{ text:`🌸 Catálogo poblado: ${updated} personajes actualizados\n🔧 Modo: ${mode}\n🖼️ Límite imágenes por tag: ${limit}${filter.length?`\n🔎 Filtro: ${filter.join(', ')}`:''}`},{ quoted: msg })
}
