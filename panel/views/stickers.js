export default function StickersView({ api }){
  let db = { packs: [] }
  const reload = async () => { db = await api.getStickers() }
  return {
    async render(){
      try { await reload() } catch {}
      const rows = (db.packs||[]).map((p,i)=>`
        <tr class="border-b border-slate-800">
          <td class="px-3 py-2">${i+1}</td>
          <td class="px-3 py-2">${p.name}</td>
          <td class="px-3 py-2 truncate max-w-[28ch]" title="${p.url}">${p.url}</td>
          <td class="px-3 py-2 text-right"><button data-del="${p.name}" class="px-2 py-1 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30">Borrar</button></td>
        </tr>`).join('') || `<tr><td colspan="4" class="px-3 py-6 text-center text-slate-500">(sin packs)</td></tr>`
      return `
      <section class="p-6 min-h-screen bg-gradient-to-b from-purple-500/10 to-transparent">
        <header class="mb-6">
          <h1 class="text-2xl font-bold text-purple-300">💫 Stickers</h1>
          <p class="text-slate-400">Gestiona packs (agregar/actualizar/borrar).</p>
        </header>
        <div class="grid md:grid-cols-3 gap-6">
          <div class="md:col-span-2 p-4 rounded-xl bg-slate-900 border border-slate-800 overflow-auto">
            <table class="min-w-full text-sm">
              <thead class="text-slate-400">
                <tr>
                  <th class="px-3 py-2 text-left">#</th>
                  <th class="px-3 py-2 text-left">Nombre</th>
                  <th class="px-3 py-2 text-left">URL</th>
                  <th class="px-3 py-2 text-right">Acción</th>
                </tr>
              </thead>
              <tbody id="stkRows">${rows}</tbody>
            </table>
          </div>
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <h2 class="font-semibold mb-2">Agregar / Actualizar</h2>
            <div class="space-y-2">
              <input id="sname" class="w-full px-3 py-2 bg-slate-800 rounded" placeholder="nombre del pack" />
              <input id="surl" class="w-full px-3 py-2 bg-slate-800 rounded" placeholder="https://...zip" />
              <div class="flex gap-2">
                <button id="btnSaveSticker" class="px-3 py-2 rounded bg-purple-500/20 text-purple-300 hover:bg-purple-500/30">Guardar</button>
                <button id="btnClearSticker" class="px-3 py-2 rounded bg-slate-700 text-slate-200 hover:bg-slate-600">Limpiar</button>
              </div>
              <div id="toastSticker" class="hidden text-xs"></div>
            </div>
          </div>
        </div>
      </section>`
    },
    async mount(){
      const n = document.getElementById('sname')
      const u = document.getElementById('surl')
      const toast = document.getElementById('toastSticker')
      const rowsEl = document.getElementById('stkRows')
      const show = (ok,msg)=>{ toast.textContent=msg; toast.className=`text-xs ${ok?'text-purple-300':'text-red-300'}`; setTimeout(()=>toast.className='hidden',2000) }
      const renderRows = () => {
        const list = (db.packs||[])
        rowsEl.innerHTML = (list.length? list.map((p,i)=>`
          <tr class=\"border-b border-slate-800\">
            <td class=\"px-3 py-2\">${i+1}</td>
            <td class=\"px-3 py-2\">${p.name}</td>
            <td class=\"px-3 py-2 truncate max-w-[28ch]\" title=\"${p.url}\">${p.url}</td>
            <td class=\"px-3 py-2 text-right\"><button data-del=\"${p.name}\" class=\"px-2 py-1 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30\">Borrar</button></td>
          </tr>`).join('') : `<tr><td colspan=\"4\" class=\"px-3 py-6 text-center text-slate-500\">(sin packs)</td></tr>`)
      }
      document.getElementById('btnSaveSticker').onclick = async ()=>{
        const payload = { name:n.value.trim(), url:u.value.trim() }
        if(!payload.name || !payload.url){ show(false,'Completa nombre y URL'); return }
        try{
          document.getElementById('btnSaveSticker').disabled = true
          await api.upsertSticker(payload)
          await reload(); renderRows(); n.value=''; u.value=''
          show(true,'Guardado ✔')
        }catch(e){ show(false,'Error: '+(e?.message||e)) }
        finally{ document.getElementById('btnSaveSticker').disabled = false }
      }
      document.getElementById('btnClearSticker').onclick = ()=>{ n.value=''; u.value='' }
      document.querySelector('table')?.addEventListener('click', async (ev)=>{
        const b = ev.target.closest('button[data-del]'); if(!b) return
        if(!confirm('¿Borrar pack?')) return
        try{ await api.deleteSticker(b.getAttribute('data-del')); await reload(); renderRows(); show(true,'Borrado ✔') }catch(e){ alert('Error: '+(e?.message||e)) }
      })
      renderRows()
    }
  }
}
