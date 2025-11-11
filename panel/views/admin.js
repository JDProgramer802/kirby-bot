export default function AdminView({ api }){
  let es = null
  return {
    async render(){
      return `
      <section class="p-6 min-h-screen bg-gradient-to-b from-sky-500/10 to-transparent">
        <header class="mb-6">
          <h1 class="text-2xl font-bold text-sky-300">🛡️ Administración</h1>
          <p class="text-slate-400">Moderación rápida y logs en vivo.</p>
        </header>
        <div class="grid md:grid-cols-2 gap-6">
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <h2 class="font-semibold mb-2">Logs en vivo</h2>
            <pre id="logs" class="h-96 overflow-auto bg-slate-950 border border-slate-800 rounded p-3 text-xs text-slate-300"></pre>
            <div class="mt-2 flex gap-2">
              <button id="btnClearLogs" class="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600">Limpiar</button>
            </div>
          </div>
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <h2 class="font-semibold mb-2">Moderación rápida</h2>
            <div class="space-y-3">
              <label class="text-sm text-slate-300 block">Grupo (JID)
                <input id="grp" class="mt-1 w-full px-3 py-2 bg-slate-800 rounded font-mono text-xs" placeholder="1203...@g.us" />
              </label>
              <label class="text-sm text-slate-300 block">Usuario (JID o @num)
                <input id="usr" class="mt-1 w-full px-3 py-2 bg-slate-800 rounded font-mono text-xs" placeholder="1234567890@s.whatsapp.net" />
              </label>
              <label class="text-sm text-slate-300 block">Admin Token (opcional para ejecutar desde el panel)
                <input id="admTok" class="mt-1 w-full px-3 py-2 bg-slate-800 rounded font-mono text-xs" placeholder="pegue su ADMIN_TOKEN" />
              </label>
              <div class="grid grid-cols-3 gap-2">
                <button data-act="promote" class="px-3 py-2 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30">Promote</button>
                <button data-act="demote" class="px-3 py-2 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30">Demote</button>
                <button data-act="kick" class="px-3 py-2 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30">Kick</button>
              </div>
              <label class="text-sm text-slate-300 block">Comando sugerido
                <input id="cmdOut" readonly class="mt-1 w-full px-3 py-2 bg-slate-950 rounded font-mono text-xs border border-slate-800" />
              </label>
              <button id="btnCopy" class="px-3 py-2 rounded bg-sky-500/20 text-sky-300 hover:bg-sky-500/30">Copiar</button>
              <button id="btnExec" class="px-3 py-2 rounded bg-kirby-pink/20 text-kirby-rose hover:bg-kirby-pink/30">Ejecutar desde Panel</button>
              <div id="toastAdmin" class="hidden text-xs"></div>
              <p class="text-xs text-slate-500">Pégalo en WhatsApp con el prefijo configurado para ejecutar la acción.</p>
            </div>
          </div>
        </div>
      </section>`
    },
    async mount(){
      // Logs SSE
      const logs = document.getElementById('logs')
      try{
        es = new EventSource('/api/logs')
        es.onmessage = (e)=>{
          const atBottom = logs.scrollTop + logs.clientHeight >= logs.scrollHeight - 4
          logs.textContent += (e.data||'') + '\n'
          if(atBottom) logs.scrollTop = logs.scrollHeight
        }
      }catch{}
      document.getElementById('btnClearLogs').onclick = ()=>{ logs.textContent = '' }
      // Moderación helpers
      const grp = document.getElementById('grp')
      const usr = document.getElementById('usr')
      const out = document.getElementById('cmdOut')
      const tok = document.getElementById('admTok')
      const toast = document.getElementById('toastAdmin')
      const show = (ok,msg)=>{ toast.textContent=msg; toast.className=`text-xs ${ok?'text-sky-300':'text-red-300'}`; setTimeout(()=>toast.className='hidden',2000) }
      let selAct = ''
      const mk = (act)=>{
        const g = (grp.value||'').trim(); const u = (usr.value||'').trim()
        if(!g || !u) return ''
        const map = { promote:'promote', demote:'demote', kick:'kick' }
        return `$${map[act]} ${u}`
      }
      document.body.addEventListener('click', (ev)=>{
        const b = ev.target.closest('button[data-act]')
        if(!b) return
        selAct = b.getAttribute('data-act') || ''
        out.value = mk(selAct)
      })
      document.getElementById('btnCopy').onclick = async ()=>{
        try{ await navigator.clipboard.writeText(out.value||'') }catch{}
      }
      document.getElementById('btnExec').onclick = async ()=>{
        const g = (grp.value||'').trim(); const u = (usr.value||'').trim(); const t = (tok.value||'').trim()
        if(!g || !u){ show(false,'Completa Grupo y Usuario'); return }
        if(!t){ show(false,'Debe especificar ADMIN_TOKEN'); return }
        try{
          if(!selAct){ show(false,'Selecciona una acción'); return }
          await api.adminAction(selAct, { gid:g, user:u }, t)
          show(true,'Encolado ✔ (se ejecutará en ~2s)')
        }catch(e){ show(false,'Error: '+(e?.message||e)) }
      }
    }
  }
}
