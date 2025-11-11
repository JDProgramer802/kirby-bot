/**
 * name: stxt
 * aliases: ["stickertext","sttexto"]
 * description: Crea un sticker desde una imagen con un texto arriba y fondo negro.
 * category: Stickers
 */

export async function run(ctx){
    const { sock, msg, args } = ctx
    const text = (args||[]).join(' ').trim()
    const jid = msg.key.remoteJid
    const qmsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || msg.message?.imageMessage ? msg : null
    const imageMessage = qmsg?.message?.imageMessage || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage || null
    if(!text){
      return sock.sendMessage(jid, { text: '💫 Escribe el texto: $stxt <texto>' }, { quoted: msg })
    }
    try{
      const baileys = await import('@whiskeysockets/baileys')
      const { writeFile, mkdtemp, unlink, readFile, access } = await import('node:fs/promises')
      const { tmpdir } = await import('node:os')
      const path = await import('node:path')
      const { pipeline } = await import('node:stream/promises')
      const { spawn } = await import('node:child_process')

      const dir = await mkdtemp(path.default.join(tmpdir(), 'kirby-stxt-'))
      const inFile = path.default.join(dir, 'in.jpg')
      const outFile = path.default.join(dir, 'out.webp')

      let buf = null
      if(imageMessage){
        const stream = await baileys.downloadContentFromMessage(imageMessage, 'image')
        const chunks = []
        for await (const c of stream) chunks.push(c)
        buf = Buffer.concat(chunks)
      } else {
        // usar imagen por defecto en assets/kirby.png
        const defPath = path.default.resolve(process.cwd(), 'assets', 'kirby.png')
        buf = await readFile(defPath)
      }
      await writeFile(inFile, buf)

      let usedCanvas = false
      try{
        let mod
        try { mod = await import('@napi-rs/canvas') } catch { mod = await import('canvas') }
        const createCanvas = mod.createCanvas || (mod.default && mod.default.createCanvas)
        const loadImage = mod.loadImage || (mod.default && mod.default.loadImage)
        if(createCanvas && loadImage){
          const img = await loadImage(inFile)
          const W = img.width, H = img.height
          const cv = createCanvas(W, H)
          const ctx = cv.getContext('2d')
          // base
          ctx.drawImage(img, 0, 0, W, H)
          // nube (varias circunferencias unidas)
          ctx.save()
          ctx.globalAlpha = 0.88
          ctx.fillStyle = '#FFFFFF'
          const cloudH = Math.floor(H*0.22)
          const cy = Math.floor(cloudH*0.55)
          const r = Math.floor(cloudH*0.35)
          ctx.beginPath()
          // banda base
          ctx.moveTo(0,0)
          ctx.lineTo(W,0)
          ctx.lineTo(W,cloudH)
          ctx.lineTo(0,cloudH)
          ctx.closePath()
          ctx.fill()
          // bultos de nube
          const bumps = 6
          for(let i=0;i<bumps;i++){
            const x = Math.floor((W/(bumps+1))*(i+1))
            ctx.beginPath()
            ctx.arc(x, cy, r, 0, Math.PI*2)
            ctx.fill()
          }
          ctx.restore()
          // texto
          ctx.fillStyle = '#111111'
          const fs = Math.max(28, Math.floor(W/14))
          ctx.font = `bold ${fs}px Arial, sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          // envolver simple por ancho
          const maxWidth = W*0.9
          const words = text.split(/\s+/)
          const lines=[]
          let line=''
          const measure = (t)=> ctx.measureText(t).width
          for(const w of words){
            const t = line? `${line} ${w}`: w
            if(measure(t) > maxWidth){ if(line) lines.push(line); line=w } else { line=t }
          }
          if(line) lines.push(line)
          const lh = Math.floor(fs*1.15)
          const totalH = lines.length*lh
          let y = Math.floor((cloudH-totalH)/2 + lh/2)
          for(let i=0;i<lines.length;i++) ctx.fillText(lines[i], W/2, y + i*lh)

          const outPng = path.default.join(dir,'canvas.png')
          await writeFile(outPng, cv.toBuffer('image/png'))
          // convertir a webp
          const argsC = ['-y','-i', outPng, '-vf','scale=512:-2','-vcodec','libwebp','-lossless','0','-q:v','60','-preset','picture','-an', outFile]
          await new Promise((resolve,reject)=>{
            const p = spawn('ffmpeg', argsC)
            let err=''; p.stderr.on('data', d=> err+=String(d))
            p.on('exit', code=> code===0? resolve(): reject(new Error(err||`ffmpeg exited ${code}`)))
          })
          usedCanvas = true
        }
      }catch{ /* canvas no disponible, fallback ffmpeg */ }

      if(!usedCanvas){
        const winFont = 'C:/Windows/Fonts/arial.ttf'
        const hasFont = await access(winFont).then(()=>true).catch(()=>false)
        const fontEsc = hasFont ? winFont.replace(':','\\:') : ''
        const escTxt = text
          .replace(/\\/g,'\\\\')
          .replace(/:/g,'\\:')
          .replace(/,/g,'\\,')
          .replace(/'/g,"\\'")
        const draw = `drawbox=x=0:y=0:w=iw:h=ih*0.16:color=black@0.75:t=fill,drawtext=${hasFont?`fontfile='${fontEsc}':`:''}text='${escTxt}':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h*0.08-text_h/2)`
        const argsff = ['-y','-i', inFile, '-vf', `${draw},scale=512:-2`, '-vcodec','libwebp','-lossless','0','-q:v','60','-preset','picture','-an', outFile]
        await new Promise((resolve,reject)=>{
          const p = spawn('ffmpeg', argsff)
          let err=''
          p.stderr.on('data', d=> { err += String(d) })
          p.on('exit', code=> code===0? resolve(): reject(new Error(err||`ffmpeg exited ${code}`)))
        })
      }

      const sticker = await readFile(outFile)
      await sock.sendMessage(jid, { sticker }, { quoted: msg })
      try{ await unlink(inFile); await unlink(outFile) }catch{}
    }catch(e){
      await sock.sendMessage(jid, { text: `⚠️ No pude crear el sticker: ${e?.message||e}` }, { quoted: msg })
    }
}
