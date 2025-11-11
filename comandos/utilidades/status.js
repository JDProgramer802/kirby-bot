/**
 * name: status
 * aliases: []
 * description: Muestra el estado actual del bot (versión, estado, bots activos).
 * category: Utilidades
 */

export async function run(ctx){
  const { sock, msg, files, db } = ctx
  const gid = msg.key.remoteJid
  const cfg = await db.loadJSON(files.CONFIG_FILE, { status: '🌸 En línea', version: '0.0.0', botsActive: 1 })
  const text = [
    '🌸 Kirby Dream — Estado ✨',
    `🕒 Versión: ${cfg.version || '1.0.0'}`,
    `💖 Estado: ${cfg.status || 'En línea'}`,
    `🤖 Instancias: ${cfg.botsActive ?? 1}`
  ].join('\n')
  await sock.sendMessage(gid, { text }, { quoted: msg })
}
