export default function PetsView({ api }){
  let data = { pets: [] }
  const RARITIES = ['common','uncommon','rare','epic','legendary']
  const petRow = (p, idx) => `
    <div class="grid md:grid-cols-12 gap-2 items-start border-b border-slate-800 pb-3">
      <input class="md:col-span-1 px-2 py-1 bg-slate-800 rounded font-mono text-xs" data-pk="id" data-idx="${idx}" placeholder="id" value="${p.id||''}">
      <input class="md:col-span-2 px-2 py-1 bg-slate-800 rounded" data-pk="name" data-idx="${idx}" placeholder="Nombre" value="${p.name||''}">
      <input type="number" class="md:col-span-1 px-2 py-1 bg-slate-800 rounded" data-pk="price" data-idx="${idx}" placeholder="Precio" value="${p.price||0}">
      <select class="md:col-span-2 px-2 py-1 bg-slate-800 rounded" data-pk="rarity" data-idx="${idx}">
        ${RARITIES.map(r=>`<option value="${r}" ${p.rarity===r?'selected':''}>${r}</option>`).join('')}
      </select>
      <input class="md:col-span-3 px-2 py-1 bg-slate-800 rounded" data-pk="image" data-idx="${idx}" placeholder="URL imagen" value="${p.image||''}">
      <input class="md:col-span-2 px-2 py-1 bg-slate-800 rounded" data-pk="description" data-idx="${idx}" placeholder="Descripción" value="${p.description||''}">
      <div class="md:col-span-1 flex justify-end">
        <button data-del-pet="${idx}" class="px-2 py-1 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30">Borrar</button>
      </div>
    </div>`
  return {
    async render(){
      try { const r = await api.getPets(); data = r || data } catch {}
      const list = Array.isArray(data.pets)? data.pets : []
      return `
      <section class="p-6 min-h-screen bg-gradient-to-b from-pink-500/10 to-transparent">
        <header class="mb-6">
          <h1 class="text-2xl font-bold text-pink-300">🐾 Mascotas</h1>
          <p class="text-slate-400">Gestiona el catálogo (agregar, editar, borrar).</p>
        </header>
        <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-semibold">Catálogo</h2>
            <button id="btnAddPet" class="px-3 py-2 rounded bg-pink-500/20 text-pink-300 hover:bg-pink-500/30">Añadir mascota</button>
          </div>
          <div id="petsList" class="space-y-3">
            ${list.map(petRow).join('') || '<div class="text-slate-500 text-sm">(sin mascotas)</div>'}
          </div>
          <div class="mt-4 flex gap-2">
            <button id="btnSavePets" class="px-3 py-2 rounded bg-pink-500/20 text-pink-300 hover:bg-pink-500/30">Guardar cambios</button>
            <div id="toastPets" class="hidden text-xs"></div>
          </div>
        </div>
      </section>`
    },
    async mount(){
      const listEl = document.getElementById('petsList')
      const toast = document.getElementById('toastPets')
      const show = (ok,msg)=>{ toast.textContent=msg; toast.className=`text-xs ${ok?'text-pink-300':'text-red-300'}`; setTimeout(()=>toast.className='hidden',2000) }

      document.getElementById('btnAddPet').onclick = ()=>{
        const idx = listEl.querySelectorAll('[data-del-pet]').length
        const dummy = { id:'', name:'', price:0, rarity:'common', image:'', description:'' }
        const wrap = document.createElement('div')
        wrap.innerHTML = petRow(dummy, idx)
        listEl.appendChild(wrap.firstElementChild)
      }

      listEl.addEventListener('click', (ev)=>{
        const del = ev.target.closest('button[data-del-pet]')
        if(del){ del.parentElement.parentElement.remove() }
      })

      document.getElementById('btnSavePets').onclick = async ()=>{
        // recolectar
        const rows = Array.from(listEl.querySelectorAll('[data-del-pet]')).map(btn=> btn.parentElement.parentElement)
        const read = (row, sel)=> row.querySelector(sel)?.value || ''
        const pets = rows.map(row => ({
          id: row.querySelector('[data-pk="id"]').value.trim(),
          name: row.querySelector('[data-pk="name"]').value.trim(),
          price: Number(row.querySelector('[data-pk="price"]').value||0),
          rarity: row.querySelector('[data-pk="rarity"]').value,
          image: row.querySelector('[data-pk="image"]').value.trim(),
          description: row.querySelector('[data-pk="description"]').value.trim()
        })).filter(p=> p.id && p.name)
        try{ await api.savePets({ pets }); show(true,'Guardado ✔') }catch(e){ show(false,'Error: '+(e?.message||e)) }
      }
    }
  }
}
