import { promises as fs } from 'fs'
import path from 'path'

const ensureDir = async (p) => {
  await fs.mkdir(p, { recursive: true })
}

export const loadJSON = async (filePath, fallback = {}) => {
  try {
    const data = await fs.readFile(filePath, 'utf8')
    return data.trim() ? JSON.parse(data) : fallback
  } catch (e) {
    if (e.code === 'ENOENT') {
      await saveJSON(filePath, fallback)
      return fallback
    }
    throw e
  }
}

export const saveJSON = async (filePath, data) => {
  const dir = path.dirname(filePath)
  await ensureDir(dir)
  const tmp = `${filePath}.tmp`
  await fs.writeFile(tmp, JSON.stringify(data, null, 2) + '\n', 'utf8')
  await fs.rename(tmp, filePath)
}

export default { loadJSON, saveJSON }
