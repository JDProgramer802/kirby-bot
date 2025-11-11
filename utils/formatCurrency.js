const nf = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

export const formatKirby = (value = 0) => {
  const num = Number(value) || 0
  return nf.format(num)
}

export default { formatKirby }
