export const ETAPAS_MX = [
  { id: 1, label: 'En diseño digital',              desc: 'Todavía en boutique' },
  { id: 2, label: 'En tránsito a taller',           desc: 'Enviado o por recoger en paquetería' },
  { id: 3, label: 'En taller — preparación',        desc: 'Midiendo piedras, diseño 3D, impresión' },
  { id: 4, label: 'En taller — vaciado',             desc: 'Vaciando y perfeccionando modelo' },
  { id: 5, label: 'En taller — montado',             desc: 'Montando piedras' },
  { id: 6, label: 'Listo — en tránsito a boutique', desc: 'Adrián ya envió, esperando recoger' },
  { id: 7, label: 'En boutique — fotos y cert.',    desc: 'En proceso interno' },
  { id: 8, label: 'Listo para entregar',             desc: '' },
]

export const ETAPAS_EU = [
  { id: 1, label: 'En diseño',                       desc: 'Todavía en boutique' },
  { id: 2, label: 'En espera de envío',              desc: 'Lista para mandar, esperando recoger' },
  { id: 3, label: 'En tránsito a taller',            desc: '' },
  { id: 4, label: 'En producción — inicio',          desc: 'Semanas 1-4 aprox' },
  { id: 5, label: 'En producción — por terminar',    desc: 'Semanas 5-7 aprox' },
  { id: 6, label: 'En tránsito a POBOX',             desc: '' },
  { id: 7, label: 'En POBOX',                        desc: 'Esperando ser recogida y enviada' },
  { id: 8, label: 'En boutique — fotos y cert.',     desc: '' },
  { id: 9, label: 'Listo para entregar',             desc: '' },
]

export function getEtapas(taller) {
  return taller === 'EU' ? ETAPAS_EU : ETAPAS_MX
}

export function getEtapaLabel(taller, etapa) {
  const lista = getEtapas(taller)
  return lista.find(e => e.id === etapa)?.label || `Etapa ${etapa}`
}

export function getMaxEtapa(taller) {
  return taller === 'EU' ? 9 : 8
}

// Días hábiles lunes-viernes entre dos fechas
export function diasHabiles(fechaInicio, fechaFin = new Date()) {
  const inicio = new Date(fechaInicio + 'T12:00:00')
  const fin = new Date(fechaFin)
  let count = 0
  const cur = new Date(inicio)
  while (cur <= fin) {
    const day = cur.getDay()
    if (day !== 0 && day !== 6) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

// Semáforo por días hábiles desde fecha de confirmación
// verde / amarillo / rojo
export function getSemaforo(taller, fechaConfirmacion, etapa) {
  const maxEtapa = getMaxEtapa(taller)
  if (etapa >= maxEtapa - 1) return 'verde' // etapa 7-8 MX o 8-9 EU: ya llegando

  const dias = diasHabiles(fechaConfirmacion)

  if (taller === 'MX') {
    if (dias <= 10) return 'verde'
    if (dias <= 15) return 'amarillo'
    return 'rojo'
  } else {
    if (dias <= 25) return 'verde'
    if (dias <= 35) return 'amarillo'
    return 'rojo'
  }
}

export function semaforoColor(semaforo) {
  if (semaforo === 'verde')   return { bg: '#DCFCE7', text: '#166534', dot: '#22C55E' }
  if (semaforo === 'amarillo') return { bg: '#FEF9C3', text: '#854D0E', dot: '#EAB308' }
  return                              { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' }
}

// Devuelve el lunes de la semana de una fecha dada
export function getLunesDe(fecha = new Date()) {
  const d = new Date(fecha)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

export function formatFecha(str) {
  if (!str) return ''
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

export const ASESORAS = [
  'Fernanda', 'Dennise', 'Diana', 'Mónica',
  'Sofi', 'Maru', 'Miranda', 'Renata',
  'Daniela', 'Paulina', 'Nefer', 'Valeria',
]
