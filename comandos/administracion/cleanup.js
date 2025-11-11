/**
 * name: cleanup
 * aliases: ["resetdata","wipeall","cleanall"]
 * description: Limpia/borrado seguro de datos (usuarios, gacha, economía, logs). SOLO Owner.
 * category: Administracion
 */

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
    return sock.sendMessage(gid,{ text:'🚫 Solo admins u owner pueden ejecutar limpieza total.'},{ quoted: msg })
  }

  const wantsAll = args.includes('all') || /mode=all/i.test(args.join(' '))
  const confirm = /confirm=(YES|SI|SÍ)/i.test(args.join(' ')) || args.includes('CONFIRM')
  const includeConfig = /includeconfig=(true|1|yes|si|sí)/i.test(args.join(' '))

  if(!wantsAll || !confirm){
    const lines = [
      '⚠️ Operación PELIGROSA: esto borrará datos.','',
      'Ejemplos:','• $cleanup all confirm=YES','• $cleanup all confirm=SI includeconfig=true','',
      'Parámetros:','- all: requerido para limpiar todo','- confirm=YES/SI: requerido','- includeconfig=true: opcional, también limpia config.json'
    ]
    return sock.sendMessage(gid,{ text: lines.join('\n') },{ quoted: msg })
  }

  const {
    USERS_FILE, ECON_FILE, GACHA_FILE, GROUPS_FILE, GROUPSTATS_FILE,
    CHARACTERS_FILE, SALES_FILE, GACHALOGS_FILE, AUDIOS_DB, CONFIG_FILE,
    STICKERS_DB
  } = files

  try {
    await db.saveJSON(USERS_FILE, {})
    await db.saveJSON(ECON_FILE, {})
    await db.saveJSON(GACHA_FILE, {})
    await db.saveJSON(GROUPS_FILE, {})
    await db.saveJSON(GROUPSTATS_FILE, {})
    await db.saveJSON(CHARACTERS_FILE, {})
    await db.saveJSON(SALES_FILE, { items: [] })
    await db.saveJSON(GACHALOGS_FILE, { logs: [] })
    await db.saveJSON(AUDIOS_DB, {})
    await db.saveJSON(STICKERS_DB, {})
    if (includeConfig) {
      await db.saveJSON(CONFIG_FILE, {})
    }
  } catch (e) {
    return sock.sendMessage(gid,{ text:`❌ Error durante limpieza: ${e?.message||e}` },{ quoted: msg })
  }

  const ok = [
    '🧹 Limpieza completada:',
    '• users.json → {}',
    '• economy.json → {}',
    '• gacha.json → {}',
    '• groups.json → {}',
    '• groupStats.json → {}',
    '• characters.json → {}',
    '• sales.json → { items: [] }',
    '• gachaLogs.json → { logs: [] }',
    '• audios.json → {}',
    '• stickers.json → {}',
    includeConfig ? '• config.json → {}' : null
  ].filter(Boolean)

  return sock.sendMessage(gid,{ text: ok.join('\n') },{ quoted: msg })
}
