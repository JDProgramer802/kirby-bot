export default function LinkView({ api }){
  let lastQR = null
  let timer = null
  const genQR = async (reset=false) => {
    const out = await api.getQR('main', reset)
    lastQR = out.png || ''
    return lastQR
  }
  const genCode = (phone, reset=false) => api.getCode('main', phone, reset)
  return {
    async render(){
      return `
      <section class="p-6 min-h-screen bg-gradient-to-b from-kirby-pink/10 to-transparent">
        <header class="mb-6">
          <h1 class="text-2xl font-bold text-kirby-rose">🔗 Vinculación</h1>
          <p class="text-slate-400">Vincula el bot con QR o Código de emparejamiento.</p>
        </header>
        <div class="grid md:grid-cols-2 gap-6">
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <h2 class="font-semibold mb-2">QR</h2>
            <div id="qrWrap" class="aspect-square rounded bg-slate-800 flex items-center justify-center overflow-hidden">
              <span class="text-slate-500">Genera un QR…</span>
            </div>
            <div class="mt-3 flex gap-2">
              <button id="btnQR" class="px-3 py-2 rounded bg-kirby-pink/20 text-kirby-rose hover:bg-kirby-pink/30">Generar</button>
              <button id="btnQRReset" class="px-3 py-2 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30">Reset + Generar</button>
            </div>
            <p class="mt-2 text-xs text-slate-500">El QR expira en ~20-60s. Puedes regenerarlo.</p>
          </div>
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <h2 class="font-semibold mb-2">Código de emparejamiento</h2>
            <div class="flex gap-2">
              <input id="phone" placeholder="Teléfono con código país (Ej: 573001234567)" class="flex-1 px-3 py-2 bg-slate-800 rounded outline-none" />
              <button id="btnCode" class="px-3 py-2 rounded bg-kirby-pink/20 text-kirby-rose hover:bg-kirby-pink/30">Generar</button>
            </div>
            <pre id="codeOut" class="mt-3 p-3 rounded bg-slate-950 border border-slate-800 text-kirby-mint"></pre>
          </div>
        </div>
      </section>`
    },
    async mount(){
      const qrWrap = document.getElementById('qrWrap')
      const btnQR = document.getElementById('btnQR')
      const btnQRReset = document.getElementById('btnQRReset')
      const btnCode = document.getElementById('btnCode')
      const phone = document.getElementById('phone')
      const codeOut = document.getElementById('codeOut')

      const setQR = (b64) => {
        if (!b64) { qrWrap.innerHTML = '<span class="text-slate-500">No disponible</span>'; return }
        const img = new Image(); img.src = 'data:image/png;base64,' + b64
        img.className = 'w-full h-full object-contain'
        qrWrap.innerHTML = ''
        qrWrap.appendChild(img)
      }

      btnQR.onclick = async () => {
        btnQR.disabled = true
        try { const b = await genQR(false); setQR(b) } catch (e) { alert('Error: '+e) }
        btnQR.disabled = false
      }
      btnQRReset.onclick = async () => {
        btnQRReset.disabled = true
        try { const b = await genQR(true); setQR(b) } catch (e) { alert('Error: '+e) }
        btnQRReset.disabled = false
      }
      btnCode.onclick = async () => {
        btnCode.disabled = true
        try { const p = phone.value.trim(); if(!p) throw new Error('Ingresa un teléfono')
          const { code } = await genCode(p, false)
          codeOut.textContent = code || '(sin código)'
        } catch (e) { alert('Error: '+ (e?.message||e)) }
        btnCode.disabled = false
      }
    }
  }
}
