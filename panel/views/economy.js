export default function EconomyView({ api }){
  let list = []
  return {
    async render(){
      try { const r = await api.getEconomyTop(25); list = r.list||[] } catch {}
      const rows = list.map((u,i)=>`
        <tr class="border-b border-slate-800">
          <td class="px-3 py-2">${i+1}</td>
          <td class="px-3 py-2 font-mono text-xs">${u.jid}</td>
          <td class="px-3 py-2 text-right">${u.balance.toLocaleString()}</td>
          <td class="px-3 py-2 text-right">${u.bank.toLocaleString()}</td>
          <td class="px-3 py-2 text-right font-semibold">${u.total.toLocaleString()}</td>
        </tr>`).join('') || `<tr><td colspan="5" class="px-3 py-6 text-center text-slate-500">(sin datos)</td></tr>`
      return `
      <section class="p-6 min-h-screen bg-gradient-to-b from-amber-500/10 to-transparent">
        <header class="mb-6">
          <h1 class="text-2xl font-bold text-amber-300">💰 Economía</h1>
          <p class="text-slate-400">Top de riqueza (saldo + banco).</p>
        </header>
        <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 overflow-auto">
          <table class="min-w-full text-sm">
            <thead class="text-slate-400">
              <tr>
                <th class="px-3 py-2 text-left">#</th>
                <th class="px-3 py-2 text-left">JID</th>
                <th class="px-3 py-2 text-right">Wallet</th>
                <th class="px-3 py-2 text-right">Bank</th>
                <th class="px-3 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>`
    }
  }
}
