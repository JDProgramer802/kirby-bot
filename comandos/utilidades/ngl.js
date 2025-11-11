/**
 * name: ngl
 * aliases: ["anon","anonymous"]
 * description: Gestiona tu enlace de NGL (mensajes anónimos): configúralo y compártelo.
 * category: Utilidades
 */

export async function run(ctx){
  const { sock, msg, args = [], files, db, PREFIX } = ctx
  const gid = msg.key.remoteJid
  const sender = msg.key?.participant || gid

  const sub = (args[0]||'').toLowerCase()
  const mention = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]

  // Helpers
  const loadUsers = async ()=> await db.loadJSON(files.USERS_FILE, {})
  const saveUsers = async (u)=> await db.saveJSON(files.USERS_FILE, u)
  const getUser = async (jid)=> { const u = await loadUsers(); u[jid] ||= { registered:false }; return { users:u, u: u[jid] } }
  const fmt = (s)=> String(s||'').trim()
  const bare = (j)=> String(j||'').split(':')[0].split('@')[0]

  // Subcomandos:
  // $ngl set <usuarioNGL>
  // $ngl link [@alguien]
  // $ngl help

  if (sub === 'set') {
    const username = fmt(args[1]||'')
    if (!username) {
      await sock.sendMessage(gid,{ text:`✨ Uso: \`${PREFIX}ngl set <usuarioNGL>\`\nEjemplo: \`${PREFIX}ngl set kerbydream\`` },{ quoted: msg })
      return
    }
    const { users, u } = await getUser(sender)
    u.ngl = { username }
    users[sender] = u
    await saveUsers(users)
    await sock.sendMessage(gid,{ text:`💫 NGL configurado: https://ngl.link/${username}` },{ quoted: msg })
    return
  }

  if (sub === 'link' || !sub) {
    // Mostrar link propio o de @mención si existe
    const target = mention || sender
    const { u } = await getUser(target)
    const username = u?.ngl?.username
    if (!username) {
      if (target === sender) {
        await sock.sendMessage(gid,{ text:`🌸 Aún no has configurado tu NGL. Usa: \`${PREFIX}ngl set <usuarioNGL>\`\nEjemplo: \`${PREFIX}ngl set kerbydream\`` },{ quoted: msg })
      } else {
        await sock.sendMessage(gid,{ text:`🌸 Esa persona no ha configurado su NGL aún.` },{ quoted: msg })
      }
      return
    }
    const card = [
      '╭─✨ ɴɢʟ ʟɪɴᴋ ✨─╮',
      `👤 Usuario: @${bare(target)}`,
      `🔗 https://ngl.link/${username}`,
      '╰────────────────╯'
    ].join('\n')
    await sock.sendMessage(gid,{ text: card, mentions: [target] },{ quoted: msg })
    return
  }

  if (sub === 'help') {
    const txt = [
      `📝 Uso de ${PREFIX}ngl`,
      `• \`${PREFIX}ngl set <usuarioNGL>\` → Configura tu usuario de NGL.`,
      `• \`${PREFIX}ngl\` o \`${PREFIX}ngl link\` → Muestra tu enlace.`,
      `• \`${PREFIX}ngl link @alguien\` → Muestra el enlace de otra persona (si lo configuró).`,
      '',
      'NGL es un servicio externo de mensajes anónimos. Este bot solo comparte tu enlace.'
    ].join('\n')
    await sock.sendMessage(gid,{ text: txt },{ quoted: msg })
    return
  }

  // Si subcomando desconocido
  await sock.sendMessage(gid,{ text:`✨ Usa \`${PREFIX}ngl help\` para ver cómo configurarlo.` },{ quoted: msg })
}
