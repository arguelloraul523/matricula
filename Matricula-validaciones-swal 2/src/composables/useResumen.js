import { computed } from 'vue'
import { useEstudiantesStore } from '../stores/estudiantes'
import { useCursosStore } from '../stores/cursos'
import { useMatriculasStore } from '../stores/matriculas'
import { cursoTerminado, pendienteDeNota } from '../utils/curso'

const MS_DIA = 86400000
const aFecha = (texto) => new Date(`${texto}T00:00:00`)

export function periodoActual(hoy = new Date()) {
  const anio = hoy.getFullYear()
  const primero = hoy.getMonth() < 6
  const inicio = new Date(anio, primero ? 1 : 7, 1)
  const semana = Math.max(1, Math.floor((hoy - inicio) / (7 * MS_DIA)) + 1)
  return { nombre: `${anio}-${primero ? 'I' : 'II'}`, semana }
}

export function tiempoRelativo(texto) {
  const dias = Math.round((new Date().setHours(0, 0, 0, 0) - aFecha(texto)) / MS_DIA)
  if (dias <= 0) return 'hoy'
  if (dias === 1) return 'ayer'
  if (dias < 30) return `hace ${dias} días`
  return aFecha(texto).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Todo lo que muestra el panorama se calcula aquí a partir de los stores.
export function useResumen() {
  const estudiantesStore = useEstudiantesStore()
  const cursosStore = useCursosStore()
  const matriculasStore = useMatriculasStore()

  const cursosInfo = computed(() =>
    cursosStore.cursos.map(c => ({
      ...c,
      inscritos: matriculasStore.estudiantesDeCurso(c.id).length,
    }))
  )

  const idsConMatriculaActiva = computed(() => new Set(
    matriculasStore.matriculas.filter(m => m.estado === 'activo').map(m => m.estudianteId)
  ))
  const estudiantesActivos = computed(() =>
    estudiantesStore.estudiantes.filter(e => idsConMatriculaActiva.value.has(e.id)).length
  )
  const estudiantesInactivos = computed(() => estudiantesStore.estudiantes.length - estudiantesActivos.value)

  const cursosDisponibles = computed(() => cursosInfo.value.filter(c => c.inscritos < c.cupo).length)
  const cursosPorCerrar = computed(() =>
    cursosInfo.value.filter(c => {
      const libres = c.cupo - c.inscritos
      return libres > 0 && libres <= Math.max(1, Math.ceil(c.cupo * 0.2))
    })
  )
  const cursosLlenos = computed(() => cursosInfo.value.filter(c => c.inscritos >= c.cupo))
  const alertasCupo = computed(() => [...cursosLlenos.value, ...cursosPorCerrar.value])

  // Cursos terminados con estudiantes sin calificar (alerta del panorama)
  const cursosSinCalificar = computed(() =>
    cursosStore.cursos
      .filter(cursoTerminado)
      .map(c => ({ ...c, pendientes: matriculasStore.estudiantesDeCurso(c.id).filter(pendienteDeNota).length }))
      .filter(c => c.pendientes > 0)
  )

  const cuposTotales = computed(() => cursosInfo.value.reduce((s, c) => s + c.cupo, 0))
  const cuposOcupados = computed(() => cursosInfo.value.reduce((s, c) => s + Math.min(c.inscritos, c.cupo), 0))

  const activasEstaSemana = computed(() => {
    const limite = Date.now() - 7 * MS_DIA
    return matriculasStore.matriculas.filter(m => m.estado === 'activo' && aFecha(m.fecha) >= limite).length
  })

  // Estudiantes cuya primera matrícula ocurrió en el mes en curso
  const nuevosEsteMes = computed(() => {
    const hoy = new Date()
    const prefijo = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
    const primera = {}
    matriculasStore.matriculas.forEach(m => {
      if (!primera[m.estudianteId] || m.fecha < primera[m.estudianteId]) primera[m.estudianteId] = m.fecha
    })
    return Object.values(primera).filter(f => f.startsWith(prefijo)).length
  })

  // 10 tramos de 0.5 entre 0.0 y 5.0
  const distribucionNotas = computed(() => {
    const tramos = Array.from({ length: 10 }, (_, i) => ({ desde: i * 0.5, hasta: (i + 1) * 0.5, cantidad: 0 }))
    matriculasStore.matriculas.forEach(m => {
      if (m.nota === null || m.nota === undefined) return
      tramos[Math.min(9, Math.floor(m.nota / 0.5))].cantidad++
    })
    const max = Math.max(1, ...tramos.map(t => t.cantidad))
    return tramos.map(t => ({ ...t, altura: t.cantidad ? Math.max(12, (t.cantidad / max) * 100) : 0 }))
  })

  const recientes = computed(() =>
    [...matriculasStore.matriculas]
      .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id)
      .slice(0, 10)
      .map(m => {
        const est = estudiantesStore.obtenerEstudiante(m.estudianteId)
        const cur = cursosStore.obtenerCurso(m.cursoId)
        const [nombre = '?', apellido = ''] = (est?.nombre ?? '').split(' ')
        return {
          id: m.id,
          estudianteId: m.estudianteId,
          iniciales: `${nombre[0] ?? '?'}${apellido[0] ?? ''}`.toUpperCase(),
          nombre: apellido ? `${nombre} ${apellido[0]}.` : nombre,
          curso: cur?.nombre ?? 'Curso eliminado',
          cuando: tiempoRelativo(m.fecha),
        }
      })
  )

  return {
    estudiantesStore, cursosStore, matriculasStore,
    cursosInfo, estudiantesActivos, estudiantesInactivos,
    cursosDisponibles, cursosPorCerrar, alertasCupo, cursosSinCalificar,
    cuposTotales, cuposOcupados, activasEstaSemana, nuevosEsteMes,
    distribucionNotas, recientes,
  }
}
