import { spawnSync } from 'child_process'
import { warn, success } from './logger.js'

const isWin = process.platform === 'win32'

const which = (cmd) => {
  const bin = isWin ? 'where' : 'which'
  const res = spawnSync(bin, [cmd], { encoding: 'utf8' })
  return res.status === 0 && res.stdout.trim().length > 0
}

export const checkDeps = () => {
  const hasYtDlp = which('yt-dlp') || which('yt-dlp.exe')
  const hasFfmpeg = which('ffmpeg') || which('ffmpeg.exe')

  if (!hasYtDlp) {
    warn('Falta yt-dlp. Instálalo y agrega al PATH:',
      '\n - Windows: pip install yt-dlp  o descarga binario: https://github.com/yt-dlp/yt-dlp/releases',
      '\n - Linux/Mac: pip install yt-dlp')
  } else {
    success('yt-dlp detectado ✓')
  }

  if (!hasFfmpeg) {
    warn('Falta ffmpeg. Instálalo y agrega al PATH:',
      '\n - Windows: https://www.gyan.dev/ffmpeg/builds/',
      '\n - Linux: apt install ffmpeg | Mac: brew install ffmpeg')
  } else {
    success('ffmpeg detectado ✓')
  }

  return { hasYtDlp, hasFfmpeg }
}

export default { checkDeps }
