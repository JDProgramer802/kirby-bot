/**
 * name: toggleaudio
 * aliases: ["disableaudio","enableaudio"]
 * description: Activa/desactiva el sistema de audios
 * category: Audios
 */

export async function run(ctx){
  const { sock, msg, args, files, db } = ctx
  const gid = msg.key.remoteJid
  const v = (args[0]||'').toLowerCase()
  if(!['enable','disable','on','off'].includes(v)){
    return sock.sendMessage(gid,{ text:'✨ Usa: $toggleaudio <enable|disable>'},{ quoted: msg })
  }
  const cfg = await db.loadJSON(files.CONFIG_FILE, { audiosEnabled: true })
  cfg.audiosEnabled = ['enable','on'].includes(v)
  await db.saveJSON(files.CONFIG_FILE, cfg)
  await sock.sendMessage(gid,{ text: cfg.audiosEnabled ? '💖 Sistema de audios activado 🌸 ¡Hora de cantar!' : '💤 Sistema de audios desactivado 💫' },{ quoted: msg })
}
