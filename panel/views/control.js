export default function ControlView({ api }){
  let st = { running: false }
  const load = async () => { try{ st = await api.getStatus() }catch{} }
  return {
    async render(){
      await load()
      return `
      <section class="p-6 min-h-screen bg-gradient-to-b from-indigo-500/10 to-transparent">
        <header class="mb-6">
          <h1 class="text-2xl font-bold text-indigo-300">🛠️ Control</h1>
          <p class="text-slate-400">Administra el proceso del bot.</p>
        </header>
        <div class="grid md:grid-cols-2 gap-6">
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div class="text-sm text-slate-400">Estado</div>
            <div id="state" class="mt-1 text-2xl font-semibold">${st.running? '🟢 Ejecutándose':'🔴 Detenido'}</div>
            <div class="mt-3 flex gap-2">
              <button id="btnStart" class="px-3 py-2 rounded ${st.running?'bg-slate-700 text-slate-400':'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30'}" ${st.running?'disabled':''}>Iniciar</button>
              <button id="btnStop" class="px-3 py-2 rounded ${!st.running?'bg-slate-700 text-slate-400':'bg-red-500/20 text-red-300 hover:bg-red-500/30'}" ${!st.running?'disabled':''}>Detener</button>
            </div>
            <div id="toastCtl" class="hidden mt-2 text-xs"></div>
          </div>
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div class="text-sm text-slate-400">Logs</div>
            <pre class="mt-2 text-xs text-slate-300">(En una iteración siguiente podemos añadir streaming de logs)</pre>
          </div>
        </div>
      </section>`
    },
    async mount(){
      const state = document.getElementById('state')
      const toast = document.getElementById('toastCtl')
      const show = (ok,msg)=>{ toast.textContent=msg; toast.className=`mt-2 text-xs ${ok?'text-indigo-300':'text-red-300'}`; setTimeout(()=>toast.className='hidden',2000) }
      const refresh = async ()=>{ try{ const s = await api.getStatus(); state.textContent = s.running? '🟢 Ejecutándose':'🔴 Detenido'; }catch{} }
      const btnStart = document.getElementById('btnStart')
      const btnStop = document.getElementById('btnStop')
      btnStart?.addEventListener('click', async ()=>{ try{ await api.startBot(); show(true,'Iniciado ✔'); location.reload() }catch(e){ show(false,'Error: '+(e?.message||e)) } })
      btnStop?.addEventListener('click', async ()=>{ try{ await api.stopBot(); show(true,'Detenido ✔'); location.reload() }catch(e){ show(false,'Error: '+(e?.message||e)) } })
      setTimeout(refresh, 1200)
    }
  }
}
