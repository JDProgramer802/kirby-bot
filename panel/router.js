export class Router {
  constructor({ routes, notFound }){
    this.routes = routes
    this.notFound = notFound
    window.addEventListener('hashchange', () => this.resolve())
  }
  start(){ this.resolve() }
  resolve(){
    const h = location.hash || '#/dashboard'
    const fn = this.routes[h] || this.routes[h.split('?')[0]] || this.notFound
    fn && fn()
  }
}
