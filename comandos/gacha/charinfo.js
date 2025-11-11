/**
 * name: charinfo
 * aliases: ["winfo","waifuinfo"]
 * description: Muestra información de un personaje
 * category: Gacha
 */

import { ensureStores, getChar } from './_common.js'

export async function run(ctx){
  const { sock, msg, args, files, db, util } = ctx
  await ensureStores(files, db)
  const gid = msg.key.remoteJid
  const name = args.join(' ').trim(); if(!name) return sock.sendMessage(gid,{text:'✨ Usa: $charinfo <nombre>'},{quoted:msg})
  const { char } = await getChar(files, db, name)
  if(!char) return sock.sendMessage(gid,{text:'🌸 No encuentro ese personaje en el catálogo 💫'},{quoted:msg})
  const lines = [
    `💖 ${char.name} — ${char.serie}`,
    `Tipo: ${char.type||'—'} | Valor: ${util.formatKirby(char.value||0)}`,
    `Owner: ${char.owner || '—'}`,
    `Votos: ${(char.voters||[]).length}`,
    `Tags: ${(char.tags||[]).join(', ') || '—'}`
  ]
  await sock.sendMessage(gid,{ text: lines.join('\n') },{ quoted: msg })
}
