export default function Dashboard({ api }){
  return {
    async render(){
      let h = { ok:false }
      let s = { users:0, groups:0, wallet:0, bank:0, total:0, msgsToday:0 }
      try{ h = await api.health() }catch{}
      try{ const r = await api.getStats(); if(r?.ok){ s = r } }catch{}
      return `
      <section class="p-6 bg-gradient-to-b from-kirby-rose/10 to-transparent min-h-screen">
        <header class="mb-6">
          <h1 class="text-2xl font-bold text-kirby-rose">📊 Dashboard</h1>
          <p class="text-slate-400">Estado general del bot, economía y actividad.</p>
        </header>
        <div class="grid md:grid-cols-5 gap-4">
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 transition hover:border-kirby-rose/40">
            <div class="text-sm text-slate-400">Salud</div>
            <div class="text-3xl font-semibold mt-1">${h.ok? '✅ OK':'⚠️ N/D'}</div>
            <div class="text-xs text-slate-500">Ping: ${(h.ts? Date.now()-h.ts : '—')} ms</div>
          </div>
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 transition hover:border-kirby-rose/40">
            <div class="text-sm text-slate-400">Usuarios</div>
            <div class="text-3xl font-semibold mt-1" data-count-to="${s.users||0}">0</div>
            <div class="text-xs text-slate-500">Registrados en data</div>
          </div>
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 transition hover:border-kirby-rose/40">
            <div class="text-sm text-slate-400">Grupos</div>
            <div class="text-3xl font-semibold mt-1" data-count-to="${s.groups||0}">0</div>
            <div class="text-xs text-slate-500">Configurados</div>
          </div>
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 transition hover:border-kirby-rose/40">
            <div class="text-sm text-slate-400">Economía total</div>
            <div class="text-xl font-semibold mt-1">Wallet: <span data-count-to="${Number(s.wallet||0)}">0</span></div>
            <div class="text-xl font-semibold">Bank: <span data-count-to="${Number(s.bank||0)}">0</span></div>
            <div class="h-2 rounded bg-slate-800 mt-2 overflow-hidden">
              <div class="h-2 bg-kirby-pink/40 transition-all duration-700" style="width: ${(s.total? (s.wallet/s.total*100) : 0).toFixed(1)}%"></div>
            </div>
            <div class="text-xs text-slate-500 mt-1">Total: <span data-count-to="${Number(s.total||0)}">0</span></div>
          </div>
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 transition hover:border-kirby-rose/40">
            <div class="text-sm text-slate-400">Mensajes hoy</div>
            <div class="text-3xl font-semibold mt-1" data-count-to="${(s.msgsToday||0)}">0</div>
            <div class="text-xs text-slate-500">(aprox. Bogotá)</div>
          </div>
        </div>
        <div class="grid md:grid-cols-3 gap-4 mt-6">
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 transition hover:scale-[1.01] hover:border-kirby-rose/40">
            <div class="text-sm text-slate-400">Vinculación</div>
            <div class="mt-2"><a href="#/link" class="px-3 py-2 rounded bg-kirby-pink/20 text-kirby-rose hover:bg-kirby-pink/30">Ir a Vincular</a></div>
          </div>
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 transition hover:scale-[1.01] hover:border-kirby-rose/40">
            <div class="text-sm text-slate-400">Control</div>
            <div class="mt-2"><a href="#/control" class="px-3 py-2 rounded bg-kirby-pink/20 text-kirby-rose hover:bg-kirby-pink/30">Ir a Control</a></div>
          </div>
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 transition hover:scale-[1.01] hover:border-kirby-rose/40">
            <div class="text-sm text-slate-400">Administración</div>
            <div class="mt-2"><a href="#/admin" class="px-3 py-2 rounded bg-kirby-pink/20 text-kirby-rose hover:bg-kirby-pink/30">Ir a Admin</a></div>
          </div>
        </div>
      </section>`
    },
    async mount(){
      // Animación count-up para valores numéricos
      const els = document.querySelectorAll('[data-count-to]')
      els.forEach(el=>{
        const target = Number(el.getAttribute('data-count-to')||0)
        const dur = 700
        const start = performance.now()
        const step = (t)=>{
          const p = Math.min(1, (t-start)/dur)
          const val = Math.floor(target * p)
          el.textContent = val.toLocaleString()
          if(p<1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      })
    }
  }
}
