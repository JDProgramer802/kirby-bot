export default function GroupsView({ api }){
  let data = { list: [] }
  const load = async () => { data = await api.getGroups() }
  const row = (g) => `
    <tr class="border-b border-slate-800">
      <td class="px-3 py-2">${g.name||g.jid}</td>
      <td class="px-3 py-2 font-mono text-xs text-slate-400">${g.jid}</td>
      <td class="px-3 py-2 text-center"><input type="checkbox" data-k="active" data-jid="${g.jid}" ${g.active===false?'':'checked'} class="accent-emerald-400"></td>
      <td class="px-3 py-2 text-center"><input type="checkbox" data-k="onlyAdmin" data-jid="${g.jid}" ${g.onlyAdmin?'checked':''} class="accent-emerald-400"></td>
      <td class="px-3 py-2 text-center"><input type="checkbox" data-k="antilink" data-jid="${g.jid}" ${g.antilink?'checked':''} class="accent-emerald-400"></td>
      <td class="px-3 py-2 text-center"><input type="checkbox" data-k="goodbye" data-jid="${g.jid}" ${g.goodbye===false?'':'checked'} class="accent-emerald-400"></td>
      <td class="px-3 py-2 text-center"><input type="number" min="1" max="10" step="1" value="${g.warnLimit||3}" data-k="warnLimit" data-jid="${g.jid}" class="w-16 bg-slate-800 rounded px-2 py-1 text-center"></td>
      <td class="px-3 py-2 text-right space-x-2">
        <button data-action="msg" data-jid="${g.jid}" class="px-3 py-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30">Mensajes</button>
        <button data-action="save" data-jid="${g.jid}" class="px-3 py-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30">Guardar</button>
      </td>
    </tr>`
  return {
    async render(){
      await load()
      const rows = (data.list||[]).sort((a,b)=> a.jid.localeCompare(b.jid)).map(row).join('') || `<tr><td colspan="7" class="px-3 py-6 text-center text-slate-500">(sin datos)</td></tr>`
      return `
      <section class="p-6 min-h-screen bg-gradient-to-b from-emerald-500/10 to-transparent">
        <header class="mb-6">
          <h1 class="text-2xl font-bold text-emerald-300">👥 Grupos</h1>
          <p class="text-slate-400">Activa/desactiva el bot por grupo y configura políticas.</p>
        </header>
        <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 overflow-auto">
          <table class="min-w-full text-sm">
            <thead class="text-slate-400">
              <tr>
                <th class="px-3 py-2 text-left">Nombre</th>
                <th class="px-3 py-2 text-left">JID</th>
                <th class="px-3 py-2">Activo</th>
                <th class="px-3 py-2">Solo Admin</th>
                <th class="px-3 py-2">AntiLink</th>
                <th class="px-3 py-2">Goodbye</th>
                <th class="px-3 py-2">WarnLimit</th>
                <th class="px-3 py-2 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div id="toast" class="hidden mt-3 text-xs"></div>
        </div>
      </section>`
    },
    async mount(){
      const el = document.querySelector('[data-action]')?.closest('table')
      const toast = document.getElementById('toast')
      const showToast = (ok, msg) => {
        toast.textContent = msg
        toast.className = `mt-3 text-xs ${ok? 'text-emerald-300':'text-red-300'}`
        setTimeout(()=>{ toast.className = 'hidden' }, 2500)
      }
      el?.addEventListener('click', async (ev)=>{
        const btn = ev.target.closest('button[data-action="save"]')
        const btnMsg = ev.target.closest('button[data-action="msg"]')
        if(btn){
          const jid = btn.getAttribute('data-jid')
          const q = (k)=> document.querySelector(`[data-k="${k}"][data-jid="${CSS.escape(jid)}"]`)
          const payload = {
            jid,
            active: q('active')?.checked ? true : false,
            onlyAdmin: q('onlyAdmin')?.checked ? true : false,
            antilink: q('antilink')?.checked ? true : false,
            goodbye: q('goodbye')?.checked ? true : false,
            warnLimit: Math.max(1, Math.min(10, Number(q('warnLimit')?.value||3)))
          }
          try{
            await api.saveGroup(payload)
            showToast(true, 'Guardado ✔')
          }catch(e){
            showToast(false, 'Error: '+(e?.message||e))
          }
          return
        }
        if(btnMsg){
          const jid = btnMsg.getAttribute('data-jid')
          const body = `
            <label class=\"block text-sm\">Bienvenida (usa {mentions} y {grupo})
              <textarea id=\"mWelcome\" class=\"mt-1 w-full h-24 bg-slate-800 rounded p-2\" placeholder=\"🎀 ¡Bienvenid@ {mentions} a {grupo}!\"></textarea>
            </label>
            <label class=\"block text-sm\">Despedida (usa {mentions} y {grupo})
              <textarea id=\"mGoodbye\" class=\"mt-1 w-full h-24 bg-slate-800 rounded p-2\" placeholder=\"💫 {mentions} ha salido de {grupo}. ¡Hasta pronto!\"></textarea>
            </label>`
          window.showModal({
            title:'Editar mensajes', bodyHTML: body, confirmText:'Guardar', cancelText:'Cancelar',
            onConfirm: async ()=>{
              const welcome = document.getElementById('mWelcome').value.trim()
              const goodbye = document.getElementById('mGoodbye').value.trim()
              try{ await api.saveGroup({ jid, ...(welcome?{welcomeMsg:welcome}:{}) , ...(goodbye?{goodbyeMsg:goodbye}:{}) })
                showToast(true, 'Mensajes guardados ✔')
              }catch(e){ showToast(false, 'Error: '+(e?.message||e)) }
            }
          })
        }
      })
    }
  }
}
