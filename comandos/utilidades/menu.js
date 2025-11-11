/**
 * name: menu
 * aliases: ["help","commands","comandos"]
 * description: Muestra el menú principal de Kirby Dream con todas las categorías o una específica.
 * category: Utilidades
 */

import fs from 'fs'
import path from 'path'

export async function run(ctx) {
  const { sock, msg, PREFIX, args = [] } = ctx
  const gid = msg.key.remoteJid

  const catsMap = {}
  const baseDir = path.resolve('comandos')
  try {
    const dirs = fs.readdirSync(baseDir, { withFileTypes: true }).filter(d=>d.isDirectory()).map(d=>d.name)
    for (const dir of dirs) {
      if (String(dir).toLowerCase() === 'subbots') continue
      const dirPath = path.join(baseDir, dir)
      const files = fs.readdirSync(dirPath).filter(f=>f.endsWith('.js') && !f.startsWith('_'))
      for (const f of files) {
        const fp = path.join(dirPath, f)
        let content = ''
        try { content = fs.readFileSync(fp, 'utf8') } catch {}
        const mName = content.match(/\*\s*name:\s*([^\n*]+)/i)
        const mDesc = content.match(/\*\s*description:\s*([^\n*]+)/i)
        const mCat  = content.match(/\*\s*category:\s*([^\n*]+)/i)
        const name = (mName?.[1] || path.basename(f, '.js')).trim()
        const desc = (mDesc?.[1] || 'Comando sin descripción.').trim()
        const category = (mCat?.[1] || dir).trim()
        if (name.toLowerCase() === 'subbots') continue
        if (String(category).toLowerCase() === 'deprecated') continue
        const niceCat = category.charAt(0).toUpperCase() + category.slice(1)
        catsMap[niceCat] ||= []
        catsMap[niceCat].push({ c: name, d: desc })
      }
    }
  } catch {}

  const order = ['Utilidades','Economía','Gacha','Mascotas','Casino','Eventos','Audios','Stickers']
  const deco = {
    Utilidades:'🔮',
    Economía:'₭',
    Gacha:'🌠',
    Mascotas:'🐾',
    Casino:'🎰',
    Eventos:'🎀',
    Audios:'🎧',
    Stickers:'💫'
  }

  const magicIntro = {
    Utilidades: "—ᳮ᳤𐨎🔮 *¡La energía del conocimiento fluye!* ᷁˸",
    Economía: "—ᳮ᳤𐨎₭ *¡Brilla tu fortuna estelar!* ᷁˸",
    Gacha: "—ᳮ᳤𐨎🌠 *¡Colecciona almas de estrellas!* ᷁˸",
    Mascotas: "—ᳮ᳤𐨎🐾 *¡Los compañeros sueñan contigo!* ᷁˸",
    Casino: "—ᳮ᳤𐨎🎰 *¡La suerte es caprichosa, pero brillante!* ᷁˸",
    Eventos: "—ᳮ᳤𐨎🎀 *¡La magia del momento te envuelve!* ᷁˸",
    Audios: "—ᳮ᳤𐨎🎧 *¡Las melodías del cosmos resuenan!* ᷁˸",
    Stickers: "—ᳮ᳤𐨎💫 *¡Crea magia visual en cada sticker!* ᷁˸"
  }

  const catDesc = {
    Utilidades: "Comandos básicos y herramientas mágicas.",
    Economía: "Administra tu dinero estelar.",
    Gacha: "Colecciona, intercambia y reclama personajes.",
    Mascotas: "Cuida y evoluciona a tus compañeros mágicos.",
    Casino: "Pon a prueba tu suerte cósmica.",
    Eventos: "Participa en desafíos y celebraciones.",
    Audios: "Descarga y escucha melodías del universo.",
    Stickers: "Crea y gestiona tus stickers kawaii."
  }

  const cats = []
  const allCats = Object.keys(catsMap).sort((a,b)=>{
    const ia = order.indexOf(a); const ib = order.indexOf(b)
    if (ia === -1 && ib === -1) return a.localeCompare(b)
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })
  for (const cName of allCats) {
    cats.push({
      title: cName,
      deco: deco[cName] || '✨',
      items: catsMap[cName].sort((a,b)=>a.c.localeCompare(b.c))
    })
  }

  const lines = []
  const separator = "✦───･｡✧･ﾟﾟ･:༅｡ﾟ☆｡ﾟ༄:･ﾟﾟ･✧｡･───✦"

  // 🌈 CABECERA GENERAL
  lines.push("> ᅟᅟ୧܀⊹╴   ᷼ᮬ︵ֺ᷼⏜̈፝֟᷼⏜ֺ᷼᷼︵᷼   𑂳╶⊹܀୨")
  lines.push("> ⊱ ⋰ ִㅤֺ   ִ   ⁝   ִㅤֺ   ִ  ⋱ ⊰                ")
  lines.push("> ⡇͡ᩘ ֹ ̫⃝౼᳥💖 ۪ -̯⏝᳔۪۪۪۪۪۪፝֟͜͜͡˗⏝֟- ۪ ⡇͡ᩘ꯭⃝౼᳤᳥🌈ᩣ̤𐨎")
  lines.push("> ╭─ ⊹ *𝗞𝗂𝗋𝖻𝗒 𝗗𝗋𝖾𝖺𝗆 𝗠𝖾𝗇𝗎* ⊹ ─╮")
  lines.push("> ✧ 𝓑𝓨 *𝐃𝐫𝐞𝐚𝐦𝐥𝐚𝐧𝐝 𝐃𝐞𝐯 𝐓𝐞𝐚𝐦* ✧")
  lines.push("> ⏝⃨֟፝︶ . ⋆˚𝜗⌗𝜚˚⋆ .︶⃨֟፝⏝")
  lines.push(">")
  lines.push(`> ⌗ *Prefijo:* \`${PREFIX}\``)
  lines.push("> ⌗✨ *𝙋ᰔ𝘺ᰔ~* Soy _Kirby Dream_, tu guía mágica de comandos.")
  lines.push(`> ⌗💬 Usa *\`${PREFIX}menu <categoría>\`* para explorar Dreamland.`)
  lines.push("> " + separator)
  lines.push("")

  const arg = (args[0] || '').toLowerCase()
  const arg2 = (args[1] || '').toLowerCase()
  const singleCat = cats.find(c => c.title.toLowerCase() === arg)

  // 💫 NUEVO: MENÚ DE CATEGORÍAS
  if (['categorias','categorías','cats','category','categories'].includes(arg)) {
    lines.push(`> 💫 *Categorías de Kirby Dream* 💫`)
    lines.push(`> ${separator}`)
    for (const cat of cats) {
      const icon = deco[cat.title] || '✨'
      const desc = catDesc[cat.title] || "Categoría mágica."
      lines.push(`> ${icon} *${cat.title}* → _${desc}_`)
    }
    lines.push(">")
    lines.push(`> Usa *${PREFIX}menu <nombre>* para ver los comandos de una categoría.`)
    lines.push(`> ${separator}`)
  }

  // 💎 MENÚ INDIVIDUAL O COMPLETO
  else {
    const toShow = singleCat ? [singleCat] : cats
    for (const cat of toShow) {
      const icon = deco[cat.title] || '✨'
      const line = magicIntro[cat.title] || "—ᳮ᳤𐨎✨ *¡Brilla, viajero de las estrellas!* ᷁˸"
      lines.push(`> ${line}`)
      lines.push(`> ${separator}`)
      lines.push(`> 💫 *${icon} ${cat.title.toUpperCase()} ${icon}*`)
      lines.push(`> ${separator}`)
      for (const it of cat.items) {
        lines.push(`> ☾ *${PREFIX}${it.c}*`)
        if (it.d) lines.push(`>    ↳ _${it.d}_`)
      }
      lines.push(`> ${separator}`)
    }
  }

  // 🌸 PIE SOLO EN MENÚ GENERAL
  if (!singleCat && !['categorias','categorías','cats','category','categories'].includes(arg)) {
    lines.push(">")
    lines.push(`> ${separator}`)
    lines.push(`> _Kirby susurra:_ “*Cada estrella brilla por una razón… la tuya también.*” 💖`)
    lines.push(">")
    lines.push("> 📢 *Canal oficial:*")
    lines.push("> https://whatsapp.com/channel/0029Vb73ONiF6smvTEoQPV3I")
    lines.push(">")
    lines.push("> 💖 _Desarrollado con amor por Dreamland Dev Team_")
    lines.push("> 🌸 _Versión:_ *Kirby Dream v3.0.0*")
    lines.push(`> ${separator}`)
  }

  const text = lines.join("\n")

  try {
    const bannerPath = path.resolve('assets', 'banner.png')
    if (fs.existsSync(bannerPath)) {
      const img = fs.readFileSync(bannerPath)
      await sock.sendMessage(gid, { image: img, caption: text }, { quoted: msg })
      return
    }
  } catch {}

  await sock.sendMessage(gid, { text }, { quoted: msg })
}
