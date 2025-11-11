export const parseCommand = (text = '', prefix = '$') => {
  if (!text.startsWith(prefix)) return null
  const sliced = text.slice(prefix.length).trim()
  const [cmd, ...args] = sliced.split(/\s+/)
  return { cmd: cmd?.toLowerCase() || '', args }
}

export const isGroup = (remoteJid = '') => remoteJid.endsWith('@g.us')

export const extractText = (msg = {}) => {
  const m = msg.message || {}
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    ''
  )
}

export const sleep = (ms) => new Promise((res) => setTimeout(res, ms))

export const pick = (obj, keys = []) => Object.fromEntries(keys.map(k => [k, obj[k]]))

export default { parseCommand, isGroup, extractText, sleep, pick }

export const getIds = (msg) => {
  const remoteJid = msg.key?.remoteJid || ''
  const fromMe = !!msg.key?.fromMe
  const participant = msg.key?.participant || msg.participant || msg.pushName || ''
  const senderJid = fromMe ? (msg.key?.id ? undefined : undefined) : (participant || remoteJid)
  const messageId = msg.key?.id
  return { remoteJid, participant, senderJid, fromMe, messageId }
}

// named export ya definido arriba con `export const getIds`
