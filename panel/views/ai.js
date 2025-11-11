export default function AIView({ api }){
  let st = { running:false }
  let cfg = { backend:'gpt4all_node', persona:'', temp:0.7, max_tokens:512, gpt4allNodeModel:'gpt4all' }
  return {
    async render(){
      try{ st = await api.aiLocalStatus() }catch{}
      try{ cfg = await api.aiGetConfig(); cfg.backend='gpt4all_node' }catch{}
      return `
      <section class="p-6 min-h-screen bg-gradient-to-b from-violet-500/10 to-transparent">
        <header class="mb-6">
          <h1 class="text-2xl font-bold text-violet-300">🤖 IA (Local)</h1>
          <p class="text-slate-400">Motor local basado en llama.cpp. Inicia, prueba y ajusta parámetros.</p>
        </header>
        <div class="grid md:grid-cols-3 gap-6">
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 md:col-span-1">
            <div class="text-sm text-slate-400">Estado</div>
            <div id="aiState" class="mt-1 text-xl font-semibold">${st.running? '🟢 Ejecutándose':'🔴 Detenido'}</div>
            <div class="text-xs text-slate-500 mt-1">Binario: ${st.binExists? 'Sí':'No'}</div>
            <div class="text-xs text-slate-500">Modelo: ${st.modelHint||'-'}</div>
            <div class="mt-3 flex gap-2">
              <button id="btnAIStart" class="px-3 py-2 rounded ${st.running?'bg-slate-700 text-slate-400':'bg-violet-500/20 text-violet-300 hover:bg-violet-500/30'}" ${st.running?'disabled':''}>Start</button>
              <button id="btnAIStop" class="px-3 py-2 rounded ${!st.running?'bg-slate-700 text-slate-400':'bg-red-500/20 text-red-300 hover:bg-red-500/30'}" ${!st.running?'disabled':''}>Stop</button>
            </div>
            <div id="toastAI" class="hidden mt-2 text-xs"></div>
          </div>
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 md:col-span-2">
            <h2 class="font-semibold mb-2">Prueba rápida</h2>
            <div class="grid grid-cols-1 gap-2">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                <label class="text-sm text-slate-300">Backend
                  <input value="GPT4All (Node)" disabled class="ml-2 px-2 py-1 bg-slate-800 rounded text-slate-400" />
                </label>
                <label class="text-sm text-slate-300">Modelo GPT4All (Node)
                  <input id="aiG4NodeModel" value="${cfg.gpt4allNodeModel||'gpt4all'}" class="ml-2 w-full px-2 py-1 bg-slate-800 rounded" placeholder="gpt4all" />
                </label>
              </div>
              <label class="text-sm text-slate-300">Persona (estilo kirby)
                <textarea id="aiPersona" class="w-full h-24 bg-slate-800 rounded p-3">${cfg.persona||''}</textarea>
              </label>
              <textarea id="aiPrompt" class="w-full h-28 bg-slate-800 rounded p-3" placeholder="Escribe tu pregunta..."></textarea>
              <div class="flex items-center gap-3">
                <label class="text-sm text-slate-300">Temperatura
                  <input id="aiTemp" type="number" step="0.1" value="${cfg.temp??0.7}" class="ml-2 w-20 px-2 py-1 bg-slate-800 rounded" />
                </label>
                <label class="text-sm text-slate-300">Max Tokens
                  <input id="aiMaxT" type="number" value="${cfg.max_tokens??512}" class="ml-2 w-24 px-2 py-1 bg-slate-800 rounded" />
                </label>
                <button id="btnAISave" class="px-3 py-2 rounded bg-slate-700 text-slate-200 hover:bg-slate-600">Guardar config</button>
                <button id="btnAISend" class="ml-auto px-3 py-2 rounded bg-violet-500/20 text-violet-300 hover:bg-violet-500/30">Enviar</button>
              </div>
              <pre id="aiOut" class="mt-2 h-64 overflow-auto bg-slate-950 border border-slate-800 rounded p-3 text-sm text-slate-300"></pre>
            </div>
          </div>
        </div>
      </section>`
    },
    async mount(){
      const aiState = document.getElementById('aiState')
      const toast = document.getElementById('toastAI')
      const out = document.getElementById('aiOut')
      const show = (ok,msg)=>{ toast.textContent=msg; toast.className=`mt-2 text-xs ${ok?'text-violet-300':'text-red-300'}`; setTimeout(()=>toast.className='hidden',2000) }
      document.getElementById('btnAIStart')?.addEventListener('click', async ()=>{
        try{ await api.aiLocalStart(); aiState.textContent='🟢 Ejecutándose'; show(true,'IA iniciada') }catch(e){ show(false,'Error: '+(e?.message||e)) }
      })
      document.getElementById('btnAIStop')?.addEventListener('click', async ()=>{
        try{ await api.aiLocalStop(); aiState.textContent='🔴 Detenido'; show(true,'IA detenida') }catch(e){ show(false,'Error: '+(e?.message||e)) }
      })
      document.getElementById('btnAISave')?.addEventListener('click', async ()=>{
        try{
          await api.aiSaveConfig({ 
            backend: 'gpt4all_node',
            persona: document.getElementById('aiPersona').value,
            temp: Number(document.getElementById('aiTemp').value||0.7),
            max_tokens: Number(document.getElementById('aiMaxT').value||512),
            gpt4allNodeModel: document.getElementById('aiG4NodeModel').value
          })
          show(true,'Config guardada ✔')
        }catch(e){ show(false,'Error: '+(e?.message||e)) }
      })
      document.getElementById('btnAISend')?.addEventListener('click', async ()=>{
        const prompt = (document.getElementById('aiPrompt').value||'').trim()
        if(!prompt){ show(false,'Escribe algo'); return }
        out.textContent = '…'
        try{
          const r = await api.aiLocalChat({ prompt, temp: Number(document.getElementById('aiTemp').value||0.7), max_tokens: Number(document.getElementById('aiMaxT').value||256) })
          out.textContent = r?.reply || JSON.stringify(r)
        }catch(e){ out.textContent = 'Error: '+(e?.message||e) }
      })
    }
  }
}
