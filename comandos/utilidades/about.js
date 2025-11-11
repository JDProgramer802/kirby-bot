/**
 * name: about
 * aliases: ["info","creditos"]
 * description: Muestra información de Kirby Dream.
 * category: Utilidades
 */

export async function run(ctx){
  const { sock, msg, files, db } = ctx
  const gid = msg.key.remoteJid
  const cfg = await db.loadJSON(files.CONFIG_FILE, { version: '1.0.0' })
  const text = [
    '🌸 Kirby Dream ✨',
    '💖 Desarrollado por Dreamland Dev Team',
    `🕒 Versión: ${cfg.version || '1.0.0'}`,
    '💫 Canal oficial: https://whatsapp.com/channel/0029Vb73ONiF6smvTEoQPV3I'
  ].join('\n')
  await sock.sendMessage(gid,{ text },{ quoted: msg })
}
