/**
 * name: worldtime
 * aliases: ["horario","time","times","wt"]
 * description: Muestra horarios actuales por país con prefijo telefónico, código ISO, y hora en formato 12h con estilo mágico Dreamland.
 * category: Utilidades
 */

const COUNTRIES = [
  // LATINOAMÉRICA 🌎
  { label: 'México', tz: 'America/Mexico_City', icon: '🇲🇽', prefix: 'MEX', phone: '+52' },
  { label: 'Colombia', tz: 'America/Bogota', icon: '🇨🇴', prefix: 'COL', phone: '+57' },
  { label: 'Perú', tz: 'America/Lima', icon: '🇵🇪', prefix: 'PER', phone: '+51' },
  { label: 'Ecuador', tz: 'America/Guayaquil', icon: '🇪🇨', prefix: 'ECU', phone: '+593' },
  { label: 'Bolivia', tz: 'America/La_Paz', icon: '🇧🇴', prefix: 'BOL', phone: '+591' },
  { label: 'Chile', tz: 'America/Santiago', icon: '🇨🇱', prefix: 'CHL', phone: '+56' },
  { label: 'Argentina', tz: 'America/Argentina/Buenos_Aires', icon: '🇦🇷', prefix: 'ARG', phone: '+54' },
  { label: 'Paraguay', tz: 'America/Asuncion', icon: '🇵🇾', prefix: 'PRY', phone: '+595' },
  { label: 'Uruguay', tz: 'America/Montevideo', icon: '🇺🇾', prefix: 'URY', phone: '+598' },
  { label: 'Brasil', tz: 'America/Sao_Paulo', icon: '🇧🇷', prefix: 'BRA', phone: '+55' },
  { label: 'Venezuela', tz: 'America/Caracas', icon: '🇻🇪', prefix: 'VEN', phone: '+58' },
  { label: 'República Dominicana', tz: 'America/Santo_Domingo', icon: '🇩🇴', prefix: 'DOM', phone: '+1-809' },
  { label: 'Puerto Rico', tz: 'America/Puerto_Rico', icon: '🇵🇷', prefix: 'PR', phone: '+1-787' },
  { label: 'Panamá', tz: 'America/Panama', icon: '🇵🇦', prefix: 'PAN', phone: '+507' },
  { label: 'Costa Rica', tz: 'America/Costa_Rica', icon: '🇨🇷', prefix: 'CRI', phone: '+506' },
  { label: 'Nicaragua', tz: 'America/Managua', icon: '🇳🇮', prefix: 'NIC', phone: '+505' },
  { label: 'Honduras', tz: 'America/Tegucigalpa', icon: '🇭🇳', prefix: 'HND', phone: '+504' },
  { label: 'Guatemala', tz: 'America/Guatemala', icon: '🇬🇹', prefix: 'GTM', phone: '+502' },
  { label: 'Cuba', tz: 'America/Havana', icon: '🇨🇺', prefix: 'CUB', phone: '+53' },

  // NORTEAMÉRICA 🍁
  { label: 'Estados Unidos', tz: 'America/New_York', icon: '🇺🇸', prefix: 'USA', phone: '+1' },
  { label: 'Canadá', tz: 'America/Toronto', icon: '🇨🇦', prefix: 'CAN', phone: '+1' },

  // EUROPA 🌍
  { label: 'España', tz: 'Europe/Madrid', icon: '🇪🇸', prefix: 'ESP', phone: '+34' },
  { label: 'Francia', tz: 'Europe/Paris', icon: '🇫🇷', prefix: 'FRA', phone: '+33' },
  { label: 'Italia', tz: 'Europe/Rome', icon: '🇮🇹', prefix: 'ITA', phone: '+39' },
  { label: 'Alemania', tz: 'Europe/Berlin', icon: '🇩🇪', prefix: 'DEU', phone: '+49' },
  { label: 'Reino Unido', tz: 'Europe/London', icon: '🇬🇧', prefix: 'GBR', phone: '+44' },
  { label: 'Portugal', tz: 'Europe/Lisbon', icon: '🇵🇹', prefix: 'PRT', phone: '+351' },
  { label: 'Suecia', tz: 'Europe/Stockholm', icon: '🇸🇪', prefix: 'SWE', phone: '+46' },
  { label: 'Noruega', tz: 'Europe/Oslo', icon: '🇳🇴', prefix: 'NOR', phone: '+47' },

  // ASIA 🐉
  { label: 'India', tz: 'Asia/Kolkata', icon: '🇮🇳', prefix: 'IND', phone: '+91' },
  { label: 'Tailandia', tz: 'Asia/Bangkok', icon: '🇹🇭', prefix: 'THA', phone: '+66' },
  { label: 'China', tz: 'Asia/Shanghai', icon: '🇨🇳', prefix: 'CHN', phone: '+86' },
  { label: 'Japón', tz: 'Asia/Tokyo', icon: '🇯🇵', prefix: 'JPN', phone: '+81' },
  { label: 'Corea del Sur', tz: 'Asia/Seoul', icon: '🇰🇷', prefix: 'KOR', phone: '+82' },
  { label: 'Filipinas', tz: 'Asia/Manila', icon: '🇵🇭', prefix: 'PHL', phone: '+63' },

  // OCEANÍA 🪸
  { label: 'Australia', tz: 'Australia/Sydney', icon: '🇦🇺', prefix: 'AUS', phone: '+61' },
  { label: 'Nueva Zelanda', tz: 'Pacific/Auckland', icon: '🇳🇿', prefix: 'NZL', phone: '+64' },

  // ÁFRICA 🦁
  { label: 'Sudáfrica', tz: 'Africa/Johannesburg', icon: '🇿🇦', prefix: 'ZAF', phone: '+27' },
  { label: 'Egipto', tz: 'Africa/Cairo', icon: '🇪🇬', prefix: 'EGY', phone: '+20' },
  { label: 'Marruecos', tz: 'Africa/Casablanca', icon: '🇲🇦', prefix: 'MAR', phone: '+212' },
]

// Formato 12h (am/pm)
const fmt = (date, tz) => new Intl.DateTimeFormat('es-ES', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
  timeZone: tz
}).format(date)

export async function run(ctx) {
  const { sock, msg, args = [] } = ctx
  const gid = msg.key.remoteJid
  const now = new Date()
  const query = (args.join(' ') || '').toLowerCase()
  const separator = '✦───･｡✧･ﾟﾟ･:༅｡ﾟ☆｡ﾟ༄:･ﾟﾟ･✧｡･───✦'

  // Filtrado
  const filtered = query
    ? COUNTRIES.filter(c =>
        c.label.toLowerCase().includes(query) ||
        (query.includes('america') && c.tz.startsWith('America/')) ||
        (query.includes('europa') && c.tz.startsWith('Europe/')) ||
        (query.includes('asia') && c.tz.startsWith('Asia/')) ||
        (query.includes('africa') && c.tz.startsWith('Africa/')) ||
        (query.includes('oceania') && c.tz.startsWith('Australia/')) ||
        (query.includes('mundo') || query.includes('global'))
      )
    : COUNTRIES.filter(c => c.tz.startsWith('America/'))

  const lines = []
  lines.push("> ╭─⊹ *𝗞𝗶𝗿𝗯𝘆 𝗗𝗿𝗲𝗮𝗺 𝗪𝗼𝗿𝗹𝗱 𝗧𝗶𝗺𝗲* ⊹─╮")
  lines.push("> ✧ *Horario Cósmico Universal* ✧")
  lines.push("> ⏝⃨֟፝︶ . ⋆˚𝜗⌗𝜚˚⋆ .︶⃨֟፝⏝")
  lines.push("> " + separator)

  for (const c of filtered) {
    const hora = fmt(now, c.tz)
    lines.push(`> ${c.icon} *${c.prefix} — ${c.label} (${c.phone})* → 🕒 _${hora}_`)
  }

  lines.push("> " + separator)
  lines.push("> 💬 _Usa_ `worldtime <país>` _o_ `worldtime europa` _para filtrar._")
  lines.push("> 🌍 _Ejemplo:_ `worldtime colombia`, `worldtime asia`, `worldtime all`.")
  lines.push("> ✨ _Kirby susurra:_ “Cada estrella marca su propio tiempo en el universo.” 🌈")

  await sock.sendMessage(gid, { text: lines.join('\n') }, { quoted: msg })
}
