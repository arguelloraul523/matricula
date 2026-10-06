import { defineStore } from "pinia"
import { ref, computed } from "vue"
import { useCursosStore } from "./cursos"
import { cursoTerminado, matriculaBloqueada } from "../utils/curso"

export const ESTADOS_MATRICULA = ["activo", "aprobado", "reprobado", "retirado"]

export const useMatriculasStore = defineStore("matriculas", () => {

  const matriculas = ref([
    { id: 1, estudianteId: 1, cursoId: 1, fecha: "2025-02-01", nota: 4.2, calificaciones: [4.2], estado: "aprobado" },
    { id: 2, estudianteId: 1, cursoId: 2, fecha: "2025-02-03", nota: null, calificaciones: [], estado: "activo" },
    { id: 3, estudianteId: 2, cursoId: 1, fecha: "2025-02-01", nota: 2.8, calificaciones: [2.8], estado: "reprobado" },
  ])

  function cursosDeEstudiante(estudianteId) {
    estudianteId = Number(estudianteId)
    return matriculas.value.filter(m => m.estudianteId === estudianteId)
  }

  function estudiantesDeCurso(cursoId) {
    cursoId = Number(cursoId)
    return matriculas.value.filter(m => m.cursoId === cursoId)
  }

  function calcularPromedio(estudianteId) {
    const notas = cursosDeEstudiante(estudianteId)
      .map(m => m.nota)
      .filter(n => n !== null && n !== undefined)

    if (!notas.length) return null
    const suma = notas.reduce((a, b) => a + b, 0)
    return (suma / notas.length).toFixed(2)
  }

  function matricularEstudiante(estudianteId, cursoId) {
    estudianteId = Number(estudianteId)
    cursoId = Number(cursoId)

    const yaExiste = matriculas.value.some(
      m => m.estudianteId === estudianteId && m.cursoId === cursoId
    )
    if (yaExiste) {
      return { ok: false, mensaje: "Este estudiante ya está inscrito en ese curso." }
    }

    const cursosStore = useCursosStore()
    const curso = cursosStore.obtenerCurso(cursoId)
    const inscritosActuales = estudiantesDeCurso(cursoId).length

    if (curso && cursoTerminado(curso)) {
      return { ok: false, mensaje: `El curso "${curso.nombre}" ya finalizó.` }
    }
    if (curso && inscritosActuales >= curso.cupo) {
      return { ok: false, mensaje: `El curso "${curso.nombre}" ya no tiene cupo disponible.` }
    }

    const nuevoId = matriculas.value.length
      ? Math.max(...matriculas.value.map(m => m.id)) + 1
      : 1

    matriculas.value.push({
      id: nuevoId,
      estudianteId,
      cursoId,
      fecha: new Date().toISOString().split("T")[0],
      nota: null,
      calificaciones: [],
      estado: "activo",
    })

    return { ok: true, mensaje: "Matrícula registrada correctamente." }
  }

  function actualizarMatricula(id, datos) {
    const idx = matriculas.value.findIndex(m => m.id === id)
    if (idx === -1) return { ok: false, mensaje: "Matrícula no encontrada." }
    const curso = useCursosStore().obtenerCurso(matriculas.value[idx].cursoId)
    if (matriculaBloqueada(curso, matriculas.value[idx])) {
      return { ok: false, mensaje: "El curso ya finalizó: las notas no se pueden modificar." }
    }
    matriculas.value[idx] = { ...matriculas.value[idx], ...datos }
    return { ok: true }
  }

  function eliminarMatricula(id) {
    matriculas.value = matriculas.value.filter(m => m.id !== id)
  }

  // Al borrar un estudiante o curso se limpian sus matrículas (evita registros huérfanos)
  function eliminarPorEstudiante(estudianteId) {
    matriculas.value = matriculas.value.filter(m => m.estudianteId !== Number(estudianteId))
  }
  function eliminarPorCurso(cursoId) {
    matriculas.value = matriculas.value.filter(m => m.cursoId !== Number(cursoId))
  }

  // Indicadores usados en el panorama: las 4 tarjetas/badges de DashboardView.vue.
  // OJO: no se agrega totalMatriculas porque ningún template lo muestra
  // (el dashboard usa estudiantes.length / cursos.length directamente).
  const totalActivas = computed(() => matriculas.value.filter(m => m.estado === "activo").length)
  const totalAprobadas = computed(() => matriculas.value.filter(m => m.estado === "aprobado").length)
  const totalReprobadas = computed(() => matriculas.value.filter(m => m.estado === "reprobado").length)

  const promedioGeneral = computed(() => {
    const notas = matriculas.value.map(m => m.nota).filter(n => n !== null && n !== undefined)
    if (!notas.length) return null
    return (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(2)
  })

  return {
    matriculas,
    matricularEstudiante,
    actualizarMatricula,
    eliminarMatricula,
    eliminarPorEstudiante,
    eliminarPorCurso,
    cursosDeEstudiante,
    estudiantesDeCurso,
    calcularPromedio,
    totalActivas,
    totalAprobadas,
    totalReprobadas,
    promedioGeneral,
  }
},
{
  persist: true,
})
