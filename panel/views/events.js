export default function EventsView({ api }){
  let ev = { active:false, name:'', currency:'', daily:{ amount:0, cooldown:86400 }, shop: [] }
  const shopRow = (it, idx) => `
    <div class="grid md:grid-cols-12 gap-2 items-start border-b border-slate-800 pb-3">
      <input class="md:col-span-2 px-2 py-1 bg-slate-800 rounded" data-ek="shop-name" data-idx="${idx}" placeholder="Nombre" value="${it.name||''}">
      <input class="md:col-span-2 px-2 py-1 bg-slate-800 rounded font-mono text-xs" data-ek="shop-id" data-idx="${idx}" placeholder="id" value="${it.id||''}">
      <input type="number" class="md:col-span-2 px-2 py-1 bg-slate-800 rounded" data-ek="shop-price" data-idx="${idx}" placeholder="Precio" value="${it.price||0}">
      <input class="md:col-span-4 px-2 py-1 bg-slate-800 rounded" data-ek="shop-desc" data-idx="${idx}" placeholder="Descripción" value="${it.description||''}">
      <div class="md:col-span-2 flex justify-end">
        <button data-del-shop="${idx}" class="px-2 py-1 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30">Borrar</button>
      </div>
    </div>`
  return {
    async render(){
      try { const r = await api.getEvents(); if(r) ev = Object.assign(ev, r) } catch {}
      const shop = Array.isArray(ev.shop) ? ev.shop : []
      return `
      <section class="p-6 min-h-screen bg-gradient-to-b from-rose-500/10 to-transparent">
        <header class="mb-6">
          <h1 class="text-2xl font-bold text-rose-300">🎀 Eventos</h1>
          <p class="text-slate-400">Configura temporadas, tienda y recompensas.</p>
        </header>
        <div class="grid md:grid-cols-2 gap-6">
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div class="grid md:grid-cols-2 gap-3">
              <label class="text-sm text-slate-300">Activo
                <input id="evActive" type="checkbox" class="ml-2 align-middle accent-rose-400" ${ev.active?'checked':''} />
              </label>
              <label class="text-sm text-slate-300">Nombre
                <input id="evName" class="mt-1 w-full px-3 py-2 bg-slate-800 rounded" placeholder="Nombre del evento" value="${ev.name||''}" />
              </label>
              <label class="text-sm text-slate-300">Moneda
                <input id="evCurrency" class="mt-1 w-full px-3 py-2 bg-slate-800 rounded" placeholder="KirbyCoinsX" value="${ev.currency||''}" />
              </label>
              <label class="text-sm text-slate-300">Daily (cantidad)
                <input id="evDailyAmount" type="number" class="mt-1 w-full px-3 py-2 bg-slate-800 rounded" value="${ev.daily?.amount||0}" />
              </label>
              <label class="text-sm text-slate-300">Daily (cooldown s)
                <input id="evDailyCD" type="number" class="mt-1 w-full px-3 py-2 bg-slate-800 rounded" value="${ev.daily?.cooldown||86400}" />
              </label>
            </div>
            <div class="mt-2">
              <h3 class="font-semibold mb-2">Tienda</h3>
              <div class="flex justify-end mb-2">
                <button id="btnAddShop" class="px-3 py-2 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30">Añadir item</button>
              </div>
              <div id="shopList" class="space-y-3">${shop.map(shopRow).join('') || '<div class="text-slate-500 text-sm">(sin items)</div>'}</div>
            </div>
            <div class="mt-3 flex gap-2">
              <button id="btnSaveEvents" class="px-3 py-2 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30">Guardar</button>
              <div id="toastEvents" class="hidden text-xs"></div>
            </div>
          </div>
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <h2 class="font-semibold mb-2">Previsualización</h2>
            <div id="evPreview" class="text-sm text-slate-300 whitespace-pre-wrap">${(()=>{
              try{
                const out = []
                out.push(`Nombre: ${ev.name||'-'}`)
                out.push(`Moneda: ${ev.currency||'-'}`)
                out.push(`Daily: ${ev.daily?.amount||0} (cada ${ev.daily?.cooldown||0}s)`) 
                out.push('Tienda:')
                const arr = Array.isArray(shop)? shop : []
                arr.forEach((it,i)=> out.push(`  ${i+1}. ${it.name||'-'} — ${it.price||0}`))
                return out.join('\n')
              }catch(e){ return 'No se pudo generar la previsualización' }
            })()}</div>
            <p class="text-xs text-slate-500 mt-3">Valida que los números sean positivos. El botón Guardar creará un backup previo.</p>
          </div>
        </div>
      </section>`
    },
    async mount(){
      const toast = document.getElementById('toastEvents')
      const show = (ok,msg)=>{ toast.textContent=msg; toast.className=`text-xs ${ok?'text-rose-300':'text-red-300'}`; setTimeout(()=>toast.className='hidden',2000) }
      const list = document.getElementById('shopList')
      document.getElementById('btnAddShop').onclick = ()=>{
        const idx = list.querySelectorAll('[data-del-shop]').length
        const wrap = document.createElement('div')
        wrap.innerHTML = `
        <div class="grid md:grid-cols-12 gap-2 items-start border-b border-slate-800 pb-3">
          <input class="md:col-span-2 px-2 py-1 bg-slate-800 rounded" data-ek="shop-name" data-idx="${idx}" placeholder="Nombre">
          <input class="md:col-span-2 px-2 py-1 bg-slate-800 rounded font-mono text-xs" data-ek="shop-id" data-idx="${idx}" placeholder="id">
          <input type="number" class="md:col-span-2 px-2 py-1 bg-slate-800 rounded" data-ek="shop-price" data-idx="${idx}" placeholder="Precio">
          <input class="md:col-span-4 px-2 py-1 bg-slate-800 rounded" data-ek="shop-desc" data-idx="${idx}" placeholder="Descripción">
          <div class="md:col-span-2 flex justify-end">
            <button data-del-shop="${idx}" class="px-2 py-1 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30">Borrar</button>
          </div>
        </div>`
        list.appendChild(wrap.firstElementChild)
      }
      list.addEventListener('click', (ev)=>{
        const del = ev.target.closest('button[data-del-shop]')
        if(del){ del.parentElement.parentElement.remove() }
      })
      document.getElementById('btnSaveEvents').onclick = async ()=>{
        const active = document.getElementById('evActive').checked
        const name = document.getElementById('evName').value.trim()
        const currency = document.getElementById('evCurrency').value.trim()
        const amount = Math.max(0, Number(document.getElementById('evDailyAmount').value||0))
        const cooldown = Math.max(0, Number(document.getElementById('evDailyCD').value||0))
        const rows = Array.from(list.querySelectorAll('[data-del-shop]')).map(b=> b.parentElement.parentElement)
        const shop = rows.map(r=>({
          name: r.querySelector('[data-ek="shop-name"]').value.trim(),
          id: r.querySelector('[data-ek="shop-id"]').value.trim(),
          price: Math.max(0, Number(r.querySelector('[data-ek="shop-price"]').value||0)),
          description: r.querySelector('[data-ek="shop-desc"]').value.trim()
        })).filter(it=> it.name && it.id)
        if(!name){ show(false,'Nombre requerido'); return }
        if(!currency){ show(false,'Moneda requerida'); return }
        try{ await api.saveEvents({ active, name, currency, daily:{ amount, cooldown }, shop }); show(true,'Guardado ✔') }
        catch(e){ show(false,'Error: '+(e?.message||e)) }
      }
    }
  }
}
