import { defineStore } from "pinia"
import { ref } from "vue"
import { cursoTerminado } from "../utils/curso"

export const useCursosStore = defineStore("cursos", () => {

  const cursos = ref([
    { id: 1, nombre: "Matemáticas I", docente: "Prof. Ramírez", cupo: 3, horario: "Lun-Mié 8:00 am – 10:00 am", fechaInicio: "2026-08-03", fechaFin: "2026-12-04" },
    { id: 2, nombre: "Programación Web", docente: "Prof. Salazar", cupo: 2, horario: "Mar-Jue 10:00 am – 12:00 m", fechaInicio: "2026-08-10", fechaFin: "2026-12-11" },
    { id: 3, nombre: "Inglés Básico", docente: "Prof. López", cupo: 4, horario: "Vie 2:00 pm – 5:00 pm", fechaInicio: "2026-09-07", fechaFin: "2026-12-18" },
  ])

  function agregarCurso(datos) {
    const nuevoId = cursos.value.length
      ? Math.max(...cursos.value.map(c => c.id)) + 1
      : 1
    cursos.value.push({ id: nuevoId, ...datos })
  }

  function editarCurso(id, datos) {
    const idx = cursos.value.findIndex(c => c.id === id)
    if (idx === -1) return { ok: false, mensaje: "Curso no encontrado." }
    // Un curso finalizado no se puede modificar
    if (cursoTerminado(cursos.value[idx])) {
      return { ok: false, mensaje: "El curso ya finalizó y no se puede modificar." }
    }
    cursos.value[idx] = { ...cursos.value[idx], ...datos }
    return { ok: true }
  }

  function eliminarCurso(id) {
    cursos.value = cursos.value.filter(c => c.id !== id)
  }

  // Nueva en este avance: MatricularView.vue la usa para mostrar el
  // nombre del curso en la tabla, y matriculas.js la usa internamente
  // para validar el cupo al inscribir.
  function obtenerCurso(id) {
    return cursos.value.find(c => c.id === Number(id))
  }

  return {
    cursos,
    agregarCurso,
    editarCurso,
    eliminarCurso,
    obtenerCurso,
  }
},
{
  persist: true,
})
