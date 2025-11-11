/**
 * name: groupimage
 * aliases: ["groupimg","gpimg","setgroupimage"]
 * description: Cambia imagen del grupo (cita una imagen)
 * category: Administración
 */

import { requireGroup, isAdmin, isBotAdmin } from './_common.js'

export async function run(ctx){
  const { sock, msg } = ctx
  const { ok, gid } = await requireGroup(sock, msg)
  if(!ok) return sock.sendMessage(msg.key.remoteJid,{text:'🌸 Este comando solo funciona en grupos 💫'},{quoted:msg})
  const sender = msg.key?.participant || gid
  if(!(await isAdmin(sock,gid,sender))) return sock.sendMessage(gid,{text:'🌸 Comando solo para administradores 💕'},{quoted:msg})
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || msg.message?.imageMessage ? msg : null
  let imageMsg = quoted?.message?.imageMessage ? quoted.message.imageMessage : msg.message?.imageMessage
  if(!imageMsg) return sock.sendMessage(gid,{text:'✨ Debes citar o enviar una imagen junto al comando'},{quoted:msg})
  let botIsAdmin = true
  try{ botIsAdmin = await isBotAdmin(sock,gid) } catch {}
  try{
    const { downloadContentFromMessage } = await import('@whiskeysockets/baileys')
    const stream = await downloadContentFromMessage(imageMsg,'image')
    let buffer = Buffer.from([])
    for await (const chunk of stream) buffer = Buffer.concat([buffer,chunk])
    await sock.updateProfilePicture(gid, buffer)
    await sock.sendMessage(gid,{text:'💖 Imagen del grupo actualizada ✨'},{quoted:msg})
  }catch{
    // Mensaje con posible causa y debug opcional
    let extra = ''
    try {
      const meta = await sock.groupMetadata(gid)
      const wantDebug = false
      if (wantDebug && meta) {
        const me = sock.user?.id
        const bare = (j)=> String(j||'').split(':')[0].split('@')[0]
        const admins = (meta.participants||[]).filter(p=>p.admin)
        const adminsList = admins.map(p=>`- ${p.id} -> ${bare(p.id)}`).join('\n')
        extra = `\n\n*🔧 Debug*\nme: ${me}\nme(bare): ${bare(me)}\nadmins:\n${adminsList||'(vacío)'}\n`
      }
    } catch {}
    await sock.sendMessage(gid,{text:`🌸 No pude actualizar la imagen. ${botIsAdmin? 'Puede ser una restricción del grupo o de WhatsApp.' : 'Parece que no tengo admin.'}${extra}`},{quoted:msg})
  }
}
