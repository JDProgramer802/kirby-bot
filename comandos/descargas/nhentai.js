/**
 * name: nhentai
 * aliases: ["nh","nhdl"]
 * description: Descarga doujin completo de NHentai en ZIP 🔥
 * category: Descargas
 */

import axios from "axios"
import fs from "fs"
import os from "os"
import path from "path"

export const name = "nhentai"
export const aliases = ["nh","nhdl"]
export const description = "Descarga doujin completo de NHentai en ZIP 🔥"
export const category = "Descargas"

async function tryImportArchiver(){
  try{ const m = await import('archiver'); return m.default || m }catch{ return null }
}

export async function run(ctx){
  const { sock, msg } = ctx
  const chat = msg.key.remoteJid
  try{
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const id = (text.split(/\s+/).slice(1).join(' ').trim()||'').replace(/[^0-9]/g,'')
    if(!id){
      return sock.sendMessage(chat,{ text: "🌸 Usa: $nhentai <id> (ej: $nhentai 177013)"},{ quoted: msg })
    }
    await sock.sendMessage(chat,{ text: "🌈 Descargando con amor desde Dreamland... espera un poquito 💕"},{ quoted: msg })
    // Usar API JSON oficial; probar múltiples mirrors antes de fallar
    const API_BASES = [
      'https://nhentai.net',
      'https://nhentai.xxx',
      'https://nhentai.to'
    ]
    const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    let g
    let lastErr
    let baseUsed = null
    let all404 = true
    for (const base of API_BASES) {
      try {
        const headersApi = { 'User-Agent': UA, 'Referer': base + '/' }
        const apiRes = await axios.get(`${base}/api/gallery/${id}`, { headers: headersApi })
        g = apiRes.data
        baseUsed = base
        break
      } catch (e) {
        lastErr = e
        if (e?.response?.status !== 404) all404 = false
        // continuar probando siguiente base
      }
    }
    if (!g) {
      if (all404) {
        return sock.sendMessage(chat,{ text: '❌ Doujin no encontrado (404). Verifica el ID.'},{ quoted: msg })
      } else {
        const status = lastErr?.response?.status
        const msgTxt = status ? `⚠️ No se pudo acceder a la API (HTTP ${status}). Intenta más tarde.` : '⚠️ No se pudo acceder a la API. Intenta más tarde.'
        return sock.sendMessage(chat,{ text: msgTxt },{ quoted: msg })
      }
    }
    const mediaId = g.media_id
    const title = (g.title?.pretty || g.title?.english || g.title?.japanese || `nhentai-${id}`).toString()
    const typeMap = { j: 'jpg', p: 'png', g: 'gif' }
    const images = Array.isArray(g.images?.pages) ? g.images.pages : []
    const hosts = ['https://i.nhentai.net','https://i3.nhentai.net','https://i5.nhentai.net']
    const buildUrl = (host, idx, t) => `${host}/galleries/${mediaId}/${idx}.${typeMap[t] || 'jpg'}`
    const pageObjs = images.map((pg, i) => hosts.map(h => buildUrl(h, i+1, pg?.t)))

    // Descarga páginas a memoria para reutilizar en PDF/ZIP
    let idx = 1
    let okCount = 0
    const pageBuffers = [] // { name, buffer, ext }
    const refBase = baseUsed || 'https://nhentai.net'
    const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Referer': `${refBase}/g/${id}/` }
    for(const variants of pageObjs){
      try{
        let resp, url
        for (const candidate of variants) {
          try {
            url = candidate
            resp = await axios.get(url, { responseType: 'arraybuffer', headers })
            break
          } catch {}
        }
        if (!resp) throw new Error('all hosts failed')
        const ext = (url.match(/\.(jpg|png|gif)/i)?.[1] || 'jpg').toLowerCase()
        const name = `${String(idx).padStart(3,'0')}.${ext}`
        const buffer = Buffer.from(resp.data)
        pageBuffers.push({ name, buffer, ext })
        idx++
        okCount++
      }catch{}
    }

    if (okCount === 0) {
      return sock.sendMessage(chat,{ text: '⚠️ No se pudieron descargar páginas (posible bloqueo regional). Intenta más tarde o con otro ID.'},{ quoted: msg })
    }

    // Intentar generar PDF con pdf-lib
    async function tryBuildPdf(pages){
      try {
        const m = await import('pdf-lib')
        const { PDFDocument } = m
        const pdfDoc = await PDFDocument.create()
        for (const pg of pages) {
          if (pg.ext === 'gif') continue // PDF soporta JPG/PNG
          let img
          if (pg.ext === 'jpg' || pg.ext === 'jpeg') img = await pdfDoc.embedJpg(pg.buffer)
          else if (pg.ext === 'png') img = await pdfDoc.embedPng(pg.buffer)
          else continue
          const w = img.width
          const h = img.height
          const page = pdfDoc.addPage([w, h])
          page.drawImage(img, { x: 0, y: 0, width: w, height: h })
        }
        const pdfBytes = await pdfDoc.save()
        const tmpPdf = path.join(os.tmpdir(), `${title.replace(/[^a-z0-9_-]+/gi,'_')}.pdf`)
        await fs.promises.writeFile(tmpPdf, Buffer.from(pdfBytes))
        return tmpPdf
      } catch {
        return null
      }
    }

    const pdfPath = await tryBuildPdf(pageBuffers)
    if (pdfPath) {
      await sock.sendMessage(chat,{ document: { url: pdfPath }, mimetype: 'application/pdf', fileName: `${title}.pdf`, caption: "📕 Tu doujin en PDF está listo ✨"},{ quoted: msg })
      return
    }

    // Fallback: crear ZIP usando buffers en memoria
    const archiver = await tryImportArchiver()
    if(!archiver){
      return sock.sendMessage(chat,{ text: "⚠️ Falta dependencia: instala 'archiver' para crear ZIP (npm i archiver)"},{ quoted: msg })
    }
    const tmpZip = path.join(os.tmpdir(), `${title.replace(/[^a-z0-9_-]+/gi,'_')}.zip`)
    const output = fs.createWriteStream(tmpZip)
    const archive = archiver('zip', { zlib: { level: 9 } })
    archive.pipe(output)
    for (const pg of pageBuffers) archive.append(pg.buffer, { name: pg.name })
    await archive.finalize()
    await new Promise(r=> output.once('close', r))
    await sock.sendMessage(chat,{ document: { url: tmpZip }, mimetype: 'application/zip', fileName: `${title}.zip`, caption: "🔥 Dreamland ha preparado tu tesoro secreto 💋"},{ quoted: msg })
  }catch(e){
    await sock.sendMessage(chat,{ text: `🌧️ Ups~ algo salió mal, poyo... 💫\n${e?.message||e}`},{ quoted: msg })
  }
}
