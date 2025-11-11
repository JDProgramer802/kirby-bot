/**
 * name: botinfo
 * aliases: ["infobot"]
 * description: Muestra información del bot
 * category: Bot
 */

export async function run(ctx){
  const { sock, msg, files, db } = ctx
  const { CONFIG_FILE } = files
  const cfg = await db.loadJSON(CONFIG_FILE, {})
  const me = sock.user || {}
  const lines = [
    '｡ﾟ✧ Info del Bot ✧ﾟ｡',
    `ID: ${me.id || 'desconocido'}`,
    `Nombre: ${cfg.botNameLong || cfg.botNameShort || 'Kirby Dream'}`,
    `Moneda: ${cfg.currency || '💎'}`,
    `Owner: ${cfg.botOwner || process.env.BOT_OWNER || 'no configurado'}`,
    `Autojoin: ${cfg.autojoin ? 'ON' : 'OFF'}`,
    cfg.menuBannerUrl ? `Banner: ${cfg.menuBannerUrl}` : null,
  ].filter(Boolean)
  await sock.sendMessage(msg.key.remoteJid, { text: lines.join('\n') }, { quoted: msg })
}
