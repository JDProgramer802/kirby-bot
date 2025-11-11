export default function CasinoView({ api }){
  let data = { odds:{}, cooldowns:{}, limits:{} }
  const keyValList = (id, title, entries = []) => `
    <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
      <div class="flex items-center justify-between mb-2">
        <h3 class="font-semibold">${title}</h3>
        <button data-add="${id}" class="px-2 py-1 rounded bg-fuchsia-500/20 text-fuchsia-300 hover:bg-fuchsia-500/30">Añadir</button>
      </div>
      <div id="${id}-list" class="space-y-2">
        ${entries.map(([k,v])=>`
        <div class="grid grid-cols-5 gap-2">
          <input class="col-span-2 px-2 py-1 bg-slate-800 rounded" data-k="${id}" placeholder="clave" value="${k}">
          <input class="col-span-2 px-2 py-1 bg-slate-800 rounded" data-v="${id}" placeholder="valor" value="${v}">
          <button data-del="${id}" class="px-2 py-1 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30">Borrar</button>
        </div>`).join('')}
      </div>
    </div>`
  return {
    async render(){
      try { const r = await api.getCasino(); data = r || data } catch {}
      const limits = data.limits||{}
      const cooldowns = Object.entries(data.cooldowns||{})
      const odds = Object.entries(data.odds||{})
      return `
      <section class="p-6 min-h-screen bg-gradient-to-b from-fuchsia-500/10 to-transparent">
        <header class="mb-6">
          <h1 class="text-2xl font-bold text-fuchsia-300">🎰 Casino</h1>
          <p class="text-slate-400">Ajusta probabilidades (odds), cooldowns y límites.</p>
        </header>
        <div class="grid md:grid-cols-2 gap-6">
          ${keyValList('cooldowns','Cooldowns (segundos)', cooldowns)}
          ${keyValList('odds','Odds (clave → probabilidad)', odds)}
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <h3 class="font-semibold mb-2">Límites</h3>
            <div class="grid grid-cols-2 gap-3">
              <label class="text-sm text-slate-300">Apuesta Máxima
                <input id="betMax" type="number" class="mt-1 w-full px-2 py-1 bg-slate-800 rounded" value="${limits.betMax||100000}">
              </label>
              <label class="text-sm text-slate-300">Apuesta Mínima
                <input id="betMin" type="number" class="mt-1 w-full px-2 py-1 bg-slate-800 rounded" value="${limits.betMin||100}">
              </label>
            </div>
            <div class="mt-3 flex gap-2">
              <button id="btnSaveCasino" class="px-3 py-2 rounded bg-fuchsia-500/20 text-fuchsia-300 hover:bg-fuchsia-500/30">Guardar</button>
              <div id="toastCasino" class="hidden text-xs"></div>
            </div>
          </div>
        </div>
      </section>`
    },
    async mount(){
      const toast = document.getElementById('toastCasino')
      const show = (ok,msg)=>{ toast.textContent=msg; toast.className=`text-xs ${ok?'text-fuchsia-300':'text-red-300'}`; setTimeout(()=>toast.className='hidden',2000) }

      const addRow = (id)=>{
        const list = document.getElementById(`${id}-list`)
        const wrap = document.createElement('div')
        wrap.className = 'grid grid-cols-5 gap-2'
        wrap.innerHTML = `
          <input class="col-span-2 px-2 py-1 bg-slate-800 rounded" data-k="${id}" placeholder="clave">
          <input class="col-span-2 px-2 py-1 bg-slate-800 rounded" data-v="${id}" placeholder="valor">
          <button data-del="${id}" class="px-2 py-1 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30">Borrar</button>`
        list.appendChild(wrap)
      }

      document.body.addEventListener('click', (ev)=>{
        const addBtn = ev.target.closest('button[data-add]')
        if(addBtn){ addRow(addBtn.getAttribute('data-add')); return }
        const delBtn = ev.target.closest('button[data-del]')
        if(delBtn){ delBtn.parentElement?.remove() }
      })

      document.getElementById('btnSaveCasino').onclick = async ()=>{
        // recoger cooldowns/odds/limits
        const pick = (id)=>{
          const ks = Array.from(document.querySelectorAll(`[data-k="${id}"]`)).map(i=>i.value.trim()).filter(Boolean)
          const vs = Array.from(document.querySelectorAll(`[data-v="${id}"]`)).map(i=>i.value.trim()).filter((_,i)=> i < ks.length)
          const obj = {}
          ks.forEach((k,i)=>{ const n = Number(vs[i]); obj[k] = isNaN(n)? vs[i] : n })
          return obj
        }
        const payload = {
          cooldowns: pick('cooldowns'),
          odds: pick('odds'),
          limits: { betMax: Number(document.getElementById('betMax').value||0), betMin: Number(document.getElementById('betMin').value||0) }
        }
        try{ await api.saveCasino(payload); show(true,'Guardado ✔') }catch(e){ show(false,'Error: '+(e?.message||e)) }
      }
    }
  }
}
