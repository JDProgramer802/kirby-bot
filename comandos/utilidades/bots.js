/**
 * name: bots
 * aliases: ["sockets"]
 * description: Muestra el número de instancias activas.
 * category: Utilidades
 */

export async function run(ctx){
  const { sock, msg, files, db } = ctx
  const gid = msg.key.remoteJid
  const cfg = await db.loadJSON(files.CONFIG_FILE, { botsActive: 1 })
  await sock.sendMessage(gid, { text: `🤖 Bots activos: ${cfg.botsActive ?? 1} 🌸` }, { quoted: msg })
}
