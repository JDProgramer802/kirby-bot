export default {
  name: 'ask',
  category: 'Utilidades',
  alias: ['ai','pregunta'],
  aliases: ['ai','pregunta'],
  description: 'Pregunta a la IA local (Kirby Dream) y obtiene una respuesta kawaii',
  usage: '$ask <tu pregunta>',
  groupOnly: false,
  adminOnly: false,
  botAdmin: false,
  async run(ctx){
    const { sock, msg, args } = ctx
    const text = (args||[]).join(' ').trim()
    if(!text){
      return sock.sendMessage(msg.key.remoteJid, { text: '💫 Usa: $ask <pregunta>' }, { quoted: msg })
    }
    try{
      const res = await fetch('http://127.0.0.1:3000/api/ai/local/chat', { method: 'POST', headers: { 'content-type':'application/json' }, body: JSON.stringify({ prompt: text }) })
      if(!res.ok){ const t = await res.text(); throw new Error(t) }
      const jr = await res.json()
      const reply = (jr?.reply||'').trim() || '✨ (sin respuesta)'
      await sock.sendMessage(msg.key.remoteJid, { text: `⭐ ${reply}` }, { quoted: msg })
    }catch(e){
      await sock.sendMessage(msg.key.remoteJid, { text: `⚠️ IA no disponible. Inicia en Panel → IA (Local). Detalle: ${e?.message||e}` }, { quoted: msg })
    }
  }
}
