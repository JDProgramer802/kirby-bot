export default function AudiosView({ api }){
  let aud = { audios: [] }
  const reload = async () => { aud = await api.getAudios() }
  return {
    async render(){
      try { await reload() } catch {}
      const rows = (aud.audios||[]).map((a,i)=>`
        <tr class="border-b border-slate-800">
          <td class="px-3 py-2">${i+1}</td>
          <td class="px-3 py-2 font-mono text-xs">${a.trigger}</td>
          <td class="px-3 py-2 truncate max-w-[28ch]" title="${a.url}">${a.url}</td>
          <td class="px-3 py-2 text-center">${a.groupOnly? 'Sí':'No'}</td>
          <td class="px-3 py-2 text-right"><button data-del="${a.trigger}" class="px-2 py-1 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30">Borrar</button></td>
        </tr>`).join('') || `<tr><td colspan="5" class="px-3 py-6 text-center text-slate-500">(sin audios)</td></tr>`
      return `
      <section class="p-6 min-h-screen bg-gradient-to-b from-teal-500/10 to-transparent">
        <header class="mb-6">
          <h1 class="text-2xl font-bold text-teal-300">🎧 Audios</h1>
          <p class="text-slate-400">Gestión de triggers (crear/actualizar/borrar).</p>
        </header>
        <div class="grid md:grid-cols-3 gap-6">
          <div class="md:col-span-2 p-4 rounded-xl bg-slate-900 border border-slate-800 overflow-auto">
            <table class="min-w-full text-sm">
              <thead class="text-slate-400">
                <tr>
                  <th class="px-3 py-2 text-left">#</th>
                  <th class="px-3 py-2 text-left">Trigger</th>
                  <th class="px-3 py-2 text-left">URL</th>
                  <th class="px-3 py-2">Solo grupos</th>
                  <th class="px-3 py-2 text-right">Acción</th>
                </tr>
              </thead>
              <tbody id="audRows">${rows}</tbody>
            </table>
          </div>
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <h2 class="font-semibold mb-2">Agregar / Actualizar</h2>
            <div class="space-y-2">
              <input id="trig" class="w-full px-3 py-2 bg-slate-800 rounded" placeholder="trigger" />
              <input id="url" class="w-full px-3 py-2 bg-slate-800 rounded" placeholder="https://...mp3" />
              <label class="flex items-center gap-2 text-sm text-slate-300"><input id="gonly" type="checkbox" class="accent-teal-400" /> Solo grupos</label>
              <div class="flex gap-2">
                <button id="btnSave" class="px-3 py-2 rounded bg-teal-500/20 text-teal-300 hover:bg-teal-500/30">Guardar</button>
                <button id="btnClear" class="px-3 py-2 rounded bg-slate-700 text-slate-200 hover:bg-slate-600">Limpiar</button>
              </div>
              <div id="toast" class="hidden text-xs"></div>
            </div>
          </div>
        </div>
      </section>`
    },
    async mount(){
      const t = document.getElementById('trig')
      const u = document.getElementById('url')
      const g = document.getElementById('gonly')
      const toast = document.getElementById('toast')
      const rowsEl = document.getElementById('audRows')
      const show = (ok,msg)=>{ toast.textContent=msg; toast.className=`text-xs ${ok?'text-teal-300':'text-red-300'}`; setTimeout(()=>toast.className='hidden',2000) }
      const renderRows = () => {
        const list = (aud.audios||[])
        rowsEl.innerHTML = (list.length? list.map((a,i)=>`
          <tr class="border-b border-slate-800">
            <td class="px-3 py-2">${i+1}</td>
            <td class="px-3 py-2 font-mono text-xs">${a.trigger}</td>
            <td class="px-3 py-2 truncate max-w-[28ch]" title="${a.url}">${a.url}</td>
            <td class="px-3 py-2 text-center">${a.groupOnly? 'Sí':'No'}</td>
            <td class="px-3 py-2 text-right"><button data-del="${a.trigger}" class="px-2 py-1 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30">Borrar</button></td>
          </tr>`).join('') : `<tr><td colspan="5" class="px-3 py-6 text-center text-slate-500">(sin audios)</td></tr>`)
      }
      document.getElementById('btnSave').onclick = async ()=>{
        const payload = { trigger:t.value.trim(), url:u.value.trim(), groupOnly:g.checked }
        if(!payload.trigger || !payload.url){ show(false,'Completa trigger y URL'); return }
        try{
          document.getElementById('btnSave').disabled = true
          await api.upsertAudio(payload)
          await reload()
          renderRows()
          t.value=''; u.value=''; g.checked=false
          show(true,'Guardado ✔')
        }
        catch(e){ show(false,'Error: '+(e?.message||e)) }
        finally{ document.getElementById('btnSave').disabled = false }
      }
      document.getElementById('btnClear').onclick = ()=>{ t.value=''; u.value=''; g.checked=false }
      document.querySelector('table')?.addEventListener('click', async (ev)=>{
        const b = ev.target.closest('button[data-del]'); if(!b) return
        if(!confirm('¿Borrar trigger?')) return
        try{
          await api.deleteAudio(b.getAttribute('data-del'))
          await reload(); renderRows(); show(true,'Borrado ✔')
        }catch(e){ alert('Error: '+(e?.message||e)) }
      })
      // primera render después de mount por si cambia
      renderRows()
    }
  }
}
