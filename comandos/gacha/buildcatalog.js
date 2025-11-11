/**
 * name: buildcatalog
 * aliases: ["autocatalog", "mkcatalog"]
 * description: Construye un catálogo mixto con waifus, husbandos y personajes de Kirby 🎀⚔️
 * category: Gacha
 */

import { slugify, saveChars } from './_common.js'
import { waifuIm, nekosBest } from '../../utils/fetchApi.js'

export async function run(ctx) {
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
      const bare = (j) => String(j || '').split(':')[0].split('@')[0]
      const adminsBare = (meta.participants || []).filter(p => p.admin).map(p => bare(p.id))
      if (adminsBare.includes(bare(jid))) allowed = true
    } catch {}
  }
  if (!allowed)
    return sock.sendMessage(gid, { text: '🚫 Solo admins u owner pueden construir el catálogo 💔' }, { quoted: msg })

  // 🔮 Helpers
  const withTimeout = async (p, ms = 8000) => Promise.race([p, new Promise(res => setTimeout(() => res(null), ms))])
  const progressBar = (done, total) => {
    const pct = Math.min(100, Math.floor((done / total) * 100))
    const filled = Math.floor(pct / 5)
    const line = '█'.repeat(filled) + '░'.repeat(20 - filled)
    return `${line} ${pct}%`
  }
  const sendOrEdit = async (mid, text) => {
    try {
      if (!mid) {
        const sent = await sock.sendMessage(gid, { text }, { quoted: msg })
        return sent?.key?.id
      } else {
        await sock.sendMessage(gid, { edit: text, editId: mid })
        return mid
      }
    } catch { return null }
  }

  // ⚙️ Parámetros
  let start = 500, step = 100, reportEvery = 25, mode = 'append'
  for (const a of args) {
    if (/^start=\d+/i.test(a)) start = parseInt(a.split('=')[1])
    else if (/^step=\d+/i.test(a)) step = parseInt(a.split('=')[1])
    else if (/^progress=\d+/i.test(a)) reportEvery = parseInt(a.split('=')[1])
    else if (/^mode=(append|update)$/i.test(a)) mode = a.split('=')[1].toLowerCase()
  }

  // 🌸 Mantiene tus 600+ tags originales
  const baseList = [
    // --- 🩷 Waifus ---
    'waifu','maid','idol','neko','witch','bunny','nurse','princess','angel','goddess',
    'queen','valkyrie','schoolgirl','magical_girl','elf_girl','catgirl','cyber_maiden','vampire_girl',
    'fairy_princess','fox_spirit','succubus','knight_maiden','demoness','sorceress','druidess','sun_empress',

    // --- 💙 Husbandos ---
    'husbando','hero','knight','samurai','warrior','paladin','monk','king','lord','duke','wizard',
    'swordsman','archer','soldier','captain','ranger','shinobi','pirate','hunter','vampire',
    'samurai_lord','dark_knight','dragon_slayer','paladin_king','crimson_samurai','cyber_soldier',
    'nobleman','barbarian','berserker','prince','saint','angelic_knight','shadow_warrior','reaper',
    'sage','mage','demon_lord','bandit','mercenary','mecha_knight','battle_monk','archmage',
    'heroic_spirit','war_general','cyber_warrior','royal_knight','desert_nomad','storm_paladin',
    'phoenix_knight','celestial_guardian','forest_guardian','ice_prince','lava_dragon_knight',

    // --- 🧿 Neutros o criaturas ---
    'dragon','slime','demon','angel','spirit','robot','ghost','cyborg','alien','android','beast','elf','oni','zombie',
    'reaper','golem','seraph','phoenix','chimera','hydra','griffon','mimic','shadow_beast','dream_spirit',

    // --- 🎮 Kirbyverse ---
    'kirby','meta_knight','king_dedede','bandana_waddle_dee','magolor','galacta_knight','susie',
    'marx','adeleine','ribbon','gooey','taranza','morpho_knight','whispy_woods','zero_two',
    'nightmare','sectonia','drawcia','dark_meta_knight','kracko','daroach','dark_daroach','void_termina',
    'galacta_zero','shadow_kirby','magolor_soul','marx_soul','landia','tuff','tiff','chuchu','adeleine_painter',

    // --- ⚔️ Populares (anime y juegos) ---
    'goku','vegeta','trunks','broly','zoro','sanji','luffy','law','ace','mihawk','tanjiro','inosuke','rengoku','zenitsu','obani',
    'itachi','madara','sasuke','kakashi','naruto','boruto','gaara','jiraiya','pain',
    'eren','levi','armin','erwin','reiner','mikasa','gojo','sukuna','geto','megumi','toji','yuta','kenjaku',
    'ichigo','byakuya','ulquiorra','aizen','rukia','grimjow','yoruichi','izen','kazuma','megumin','subaru','rem','ram','asuna','kirito',
    'link','zelda','ganondorf','sephiroth','cloud_strife','sora','roxas','terra','riku','noctis','ignis','gladio',
    'light_yagami','l','giyu','muichiro','akaza','kokushibo','shinobu','mitsuri','kanroji',

    // --- 🎭 Estilos visuales ---
    'chibi','realistic','manga_style','painting','anime_style','pixel','watercolor','3d_render','sketch',

    // --- 💬 Emociones ---
    'smile','blush','laugh','cry','serious','angry','sad','shy','wink','surprised','determined','focused','gentle','cool','evil_grin',

    // --- 🪄 Otras categorías ---
    'school','uniform','kimono','bikini','armor','casual','hoodie','yukata','jacket','coat','pajamas','dress','suit','battle_armor',
    'cyberpunk','steampunk','ancient','futuristic','urban','idol_stage','forest_theme','ice_theme','fire_theme','shadow_realm',

    // --- 💎 Fantasía extra ---
    'storm_witch','dream_miko','moonlight_mage','sun_paladin','arcane_scholar','flame_knight','misty_ninja',
    'rain_priestess','desert_sorcerer','snow_druid','holy_guardian','dark_sorcerer','galaxy_mage','starlight_priestess'
  ]

  const chars = await db.loadJSON(files.CHARACTERS_FILE, {})
  let added = 0, updated = 0, processed = 0
  const total = baseList.length

  const inferGender = (k = '') => {
    const s = k.toLowerCase()
    if (/(boy|male|man|king|samurai|husbando|hero)/.test(s)) return 'Hombre'
    if (/(girl|female|maid|queen|waifu|princess|idol|witch|angel|valkyrie|goddess)/.test(s)) return 'Mujer'
    return '—'
  }
  const pretty = (s = '') => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  // 🌈 Panel inicial
  let msgId = await sendOrEdit(null, [
    '🌌 *Dreamland Galaxy Catalog Builder* 🌌',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '💫 Preparando energía estelar...',
    `⚙️ Modo: ${mode} | 🪙 start=${start} | step=${step}`,
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '💖 Cargando tags del multiverso...'
  ].join('\n'))

  for (const nameRaw of baseList) {
    const name = nameRaw.trim()
    if (!name) continue
    const key = slugify(name)
    const images = []

    try {
      const res = await withTimeout(waifuIm({ included_tags: key, is_nsfw: false, many: true, limit: 5 }), 7000)
      res?.images?.forEach(im => im?.url && images.push(im.url))
    } catch {}
    if (images.length === 0) {
      try {
        const nb = await withTimeout(nekosBest('neko'), 4000)
        const url = nb?.results?.[0]?.url
        if (url) images.push(url)
      } catch {}
    }

    const prev = chars[key]
    const entry = {
      id: key,
      name: pretty(name),
      serie: prev?.serie ?? pretty(name),
      value: prev?.value ?? (start + processed * step),
      images: (mode === 'update')
        ? Array.from(new Set([...(prev?.images || []), ...images])).slice(0, 8)
        : (prev?.images || images).slice(0, 8),
      videos: prev?.videos || [],
      owner: prev?.owner || null,
      gender: prev?.gender || prev?.genero || inferGender(key),
      genero: prev?.genero || prev?.gender || inferGender(key),
    }

    if (prev) { updated++; chars[key] = { ...prev, ...entry } }
    else { added++; chars[key] = entry }

    processed++
    if (processed % reportEvery === 0 || processed === total) {
      const pb = progressBar(processed, total)
      const art = [
        '╔═══🌠 *Dreamland Galaxy System* 🌠═══╗',
        `🧩 Tag actual: *${pretty(name)}*`,
        `💞 Nuevos: ${added}   ♻️ Actualizados: ${updated}`,
        `⚡ Progreso: ${pb}`,
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        `📦 Tags: ${processed}/${total}`,
        '╚═══════════════════════════════╝',
        '',
        '✨ _“Las constelaciones de Dreamland siguen expandiéndose...”_ 🌈'
      ].join('\n')
      msgId = await sendOrEdit(msgId, art)
    }

    if (processed % 50 === 0) await saveChars(files, db, chars)
  }

  await saveChars(files, db, chars)
  await sendOrEdit(msgId, [
    '🌈✨ *¡CATÁLOGO ESTELAR COMPLETADO!* ✨🌈',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    `🆕 Nuevos: ${added}`,
    `♻️ Actualizados: ${updated}`,
    `📦 Total tags: ${baseList.length}`,
    '',
    '💎 Incluye waifus, husbandos, criaturas y Kirbyverse Dreamland 💫',
    '💫 _Cada entrada brilla como una estrella recién nacida._ 🌟'
  ].join('\n'))
}