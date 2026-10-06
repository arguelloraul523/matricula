// Fechas, estados y horarios de los cursos
export const DIAS_SEMANA = [
  { label: 'Lunes', value: 'Lun' },
  { label: 'Martes', value: 'Mar' },
  { label: 'Miércoles', value: 'Mié' },
  { label: 'Jueves', value: 'Jue' },
  { label: 'Viernes', value: 'Vie' },
  { label: 'Sábado', value: 'Sáb' },
  { label: 'Domingo', value: 'Dom' },
]
const ORDEN_DIAS = DIAS_SEMANA.map(d => d.value)

// "18:00" -> "6:00 pm" (el mediodía se escribe "12:00 m", como en el resto de la app)
export function formatearHora(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  if (h === 12 && m === 0) return '12:00 m'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'pm' : 'am'}`
}

// "6:00 pm" -> "18:00"
function aHHmm(h, m, suf) {
  h = Number(h)
  if (suf === 'm') return '12:00'
  if (suf === 'am') h = h === 12 ? 0 : h
  else h = h === 12 ? 12 : h + 12
  return `${String(h).padStart(2, '0')}:${m}`
}

// (['Vie','Lun','Mié'], '18:00', '20:00') -> "Lun-Mié-Vie 6:00 pm – 8:00 pm"
export function construirHorario(dias, inicio, fin) {
  if (!dias?.length || !inicio || !fin) return ''
  const ordenados = [...dias].sort((a, b) => ORDEN_DIAS.indexOf(a) - ORDEN_DIAS.indexOf(b))
  return `${ordenados.join('-')} ${formatearHora(inicio)} – ${formatearHora(fin)}`
}

// Operación inversa, para editar un curso existente. Devuelve null si el texto no tiene el formato esperado.
export function parsearHorario(texto) {
  const r = /^(\S+)\s+(\d{1,2}):(\d{2})\s*(am|pm|m)\s*[–-]\s*(\d{1,2}):(\d{2})\s*(am|pm|m)$/i.exec((texto ?? '').trim())
  if (!r) return null
  const dias = r[1].split('-')
  if (!dias.every(d => ORDEN_DIAS.includes(d))) return null
  return { dias, inicio: aHHmm(r[2], r[3], r[4].toLowerCase()), fin: aHHmm(r[5], r[6], r[7].toLowerCase()) }
}

export const localeEs = {
  days: 'Domingo_Lunes_Martes_Miércoles_Jueves_Viernes_Sábado'.split('_'),
  daysShort: 'Dom_Lun_Mar_Mié_Jue_Vie_Sáb'.split('_'),
  months: 'Enero_Febrero_Marzo_Abril_Mayo_Junio_Julio_Agosto_Septiembre_Octubre_Noviembre_Diciembre'.split('_'),
  monthsShort: 'Ene_Feb_Mar_Abr_May_Jun_Jul_Ago_Sep_Oct_Nov_Dic'.split('_'),
  firstDayOfWeek: 1,
}

const MS_DIA = 86400000
const aFecha = (t) => new Date(`${t}T00:00:00`)

// Fecha de hoy como YYYY-MM-DD (hora local)
export function hoyISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function fechaValida(t) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t ?? '')) return false
  const d = aFecha(t)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === t
}

export const diasEntre = (a, b) => Math.round((aFecha(b) - aFecha(a)) / MS_DIA)

// El curso termina después de su fecha de fin (el último día todavía está abierto)
export function cursoTerminado(c) {
  return !!c?.fechaFin && c.fechaFin < hoyISO()
}

export function estadoCurso(c) {
  if (cursoTerminado(c)) return 'finalizado'
  if (c?.fechaInicio && c.fechaInicio > hoyISO()) return 'porIniciar'
  return 'enCurso'
}
export const etiquetaCurso = { finalizado: 'Finalizado', porIniciar: 'Por iniciar', enCurso: 'En curso' }

// Una nota no se puede modificar cuando el curso ya terminó y el estudiante ya fue calificado.
// (Si quedó sin calificar, se puede completar: es justamente lo que alerta el panorama.)
export function matriculaBloqueada(curso, m) {
  return cursoTerminado(curso) && m?.nota !== null && m?.nota !== undefined
}

// Matrículas de un curso terminado que aún no tienen nota (los retirados no cuentan)
export const pendienteDeNota = (m) => (m.nota === null || m.nota === undefined) && m.estado !== 'retirado'
