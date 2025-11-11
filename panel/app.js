import { Router } from './router.js'
import * as api from './api.js'
import Dashboard from './views/dashboard.js'
import AIView from './views/ai.js'
import LinkView from './views/link.js'
import ControlView from './views/control.js'
import GroupsView from './views/groups.js'
import EconomyView from './views/economy.js'
import CasinoView from './views/casino.js'
import PetsView from './views/pets.js'
import EventsView from './views/events.js'
import AdminView from './views/admin.js'
import AudiosView from './views/audios.js'
import StickersView from './views/stickers.js'

const app = document.getElementById('app')

const Layout = (content) => {
  const cur = location.hash || '#/dashboard'
  const items = [
    ['#/dashboard','📊 Dashboard'],
    ['#/link','🔗 Vinculación'],
    ['#/control','🛠️ Control'],
    ['#/ai','🤖 IA'],
    ['#/groups','👥 Grupos'],
    ['#/economy','💰 Economía'],
    ['#/casino','🎰 Casino'],
    ['#/pets','🐾 Mascotas'],
    ['#/events','🎀 Eventos'],
    ['#/admin','🛡️ Administración'],
    ['#/audios','🎧 Audios'],
    ['#/stickers','💫 Stickers']
  ]
  const nav = items.map(([href, label])=>`<a href="${href}" class="block rounded px-3 py-2 ${cur.startsWith(href)?'bg-slate-800 text-kirby-rose':''} hover:bg-slate-800">${label}</a>`).join('')
  return `
  <div class="flex min-h-screen">
    <aside class="w-64 bg-slate-900/50 border-r border-slate-800">
      <div class="p-4 text-xl font-bold text-kirby-rose">🌈 Kirby Dream</div>
      <nav class="px-2 space-y-1">${nav}</nav>
      <div class="px-4 py-3 text-xs text-slate-400">SPA • Tailwind CDN</div>
    </aside>
    <main class="flex-1">
      <div class="sticky top-0 z-10 backdrop-blur bg-slate-900/40 border-b border-slate-800 px-4 py-2 flex items-center justify-between">
        <div class="text-sm text-slate-400">${new Date().toLocaleString()}</div>
        <div class="text-sm text-slate-400">Panel v1</div>
      </div>
      ${content}
    </main>
  </div>`
}

const mount = async (View) => {
  const v = await View({ api })
  app.innerHTML = Layout(await v.render())
  await v.mount?.(document)
}

// ─── Utilidad de Modales (Tailwind + animaciones) ────────────────────────────
function ensureModalRoot(){
  let root = document.getElementById('modal-root')
  if(!root){
    root = document.createElement('div')
    root.id = 'modal-root'
    document.body.appendChild(root)
  }
  return root
}
function showModal({ title = 'Acción', bodyHTML = '', confirmText = 'Guardar', cancelText = 'Cancelar', onConfirm = null }){
  const root = ensureModalRoot()
  const overlay = document.createElement('div')
  overlay.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 opacity-0 transition-opacity duration-200'
  overlay.innerHTML = `
  <div class="w-full max-w-2xl px-4" role="dialog" aria-modal="true">
    <div class="bg-slate-900 border border-slate-800 rounded-xl shadow-xl transform scale-95 transition-transform duration-200">
      <div class="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-slate-100">${title}</h3>
        <button class="text-slate-400 hover:text-slate-200" data-modal-x>✕</button>
      </div>
      <div class="p-5 space-y-3 text-slate-200">${bodyHTML}</div>
      <div class="px-5 py-3 border-t border-slate-800 flex items-center justify-end gap-2">
        <button class="px-3 py-2 rounded bg-slate-700 text-slate-200 hover:bg-slate-600" data-modal-cancel>${cancelText}</button>
        <button class="px-3 py-2 rounded bg-kirby-pink/20 text-kirby-rose hover:bg-kirby-pink/30" data-modal-confirm>${confirmText}</button>
      </div>
    </div>
  </div>`
  root.appendChild(overlay)
  requestAnimationFrame(()=>{ overlay.classList.remove('opacity-0') })
  const box = overlay.querySelector('.transform')
  requestAnimationFrame(()=>{ box.classList.remove('scale-95') })
  const close = ()=>{
    overlay.classList.add('opacity-0')
    box.classList.add('scale-95')
    setTimeout(()=> overlay.remove(), 180)
  }
  overlay.addEventListener('click', (e)=>{ if(e.target===overlay) close() })
  overlay.querySelector('[data-modal-x]').onclick = close
  overlay.querySelector('[data-modal-cancel]').onclick = close
  overlay.querySelector('[data-modal-confirm]').onclick = async ()=>{
    try{ await onConfirm?.({ close }) } finally { close() }
  }
  return { close }
}
window.showModal = showModal


const router = new Router({
  routes: {
    '': () => mount(Dashboard),
    '#/': () => mount(Dashboard),
    '#/dashboard': () => mount(Dashboard),
    '#/link': () => mount(LinkView),
    '#/control': () => mount(ControlView),
    '#/groups': () => mount(GroupsView),
    '#/economy': () => mount(EconomyView),
    '#/casino': () => mount(CasinoView),
    '#/pets': () => mount(PetsView),
    '#/events': () => mount(EventsView),
    '#/admin': () => mount(AdminView),
    '#/audios': () => mount(AudiosView),
    '#/stickers': () => mount(StickersView),
    '#/ai': () => mount(AIView),
  },
  notFound: () => mount(Dashboard)
})

router.start()
