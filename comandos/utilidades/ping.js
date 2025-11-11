/**
 * name: ping
 * aliases: ["p"]
 * description: Mide el tiempo de respuesta del bot (ping).
 * category: Utilidades
 */

export async function run(ctx) {
  const { sock, msg } = ctx
  const gid = msg.key.remoteJid

  const start = Date.now()
  // Se envía un mensaje temporal para medir
  const sent = await sock.sendMessage(gid, { text: "⌛ Midiendo latencia..." }, { quoted: msg })
  const ms = Date.now() - start

  // Definir nivel de latencia visual (estilo solicitado)
  let estado = "🌿 𝐏𝐞𝐫𝐟𝐞𝐜𝐭𝐨"
  if (ms > 400) estado = "🌩️ 𝐋𝐞𝐧𝐭𝐨"
  else if (ms > 200) estado = "⚡ 𝐑𝐚́𝐩𝐢𝐝𝐨"

  // Convertir dígitos a estilo matemático sans-serif bold (𝟎-𝟗)
  const fancyDigits = (n) => String(n).replace(/[0-9]/g, d => {
    const map = {
      '0':'𝟎','1':'𝟏','2':'𝟐','3':'𝟑','4':'𝟒','5':'𝟓','6':'𝟔','7':'𝟕','8':'𝟖','9':'𝟗'
    }
    return map[d] || d
  })
  const msFancy = fancyDigits(ms)

  const text = [
    "╭│╿࿒𐨹  ᳮ⃨⳯𝗣𝖨𝖭᳔̤̱̅𝖦 𝗗̠݇𝖱⃨𝖤𝖠᷐҇𝖬𝖫᳔̫𐨸𝖠̱𝖭𝖣̯ ✷💗⃝–.╮",
    `> ⌗📡 \`𝐋𝐚𝐭𝐞𝐧𝐜𝐢𝐚:\` ${msFancy} 𝐦𝐬`,
    `> ⌗📶 \`𝐄𝐬𝐭𝐚𝐝𝐨:\`${estado}`,
    `        ──────────────`,
    `୧⃯᷀⸌˙🌈⃝̸̸̸̫.—˺᳜᠀ 𝐒𝐢𝐬𝐭𝐞𝐦𝐚 𝐀𝐜𝐭𝐢𝐯𝐨 𝐲 𝐄𝐬𝐭𝐚𝐛𝐥𝐞. `,
    `╰─────────────────────╯`
  ].join('\n')

  // Editar el mensaje original en lugar de enviar otro
  await sock.sendMessage(gid, {
    text: text,
    edit: sent.key
  })
}
