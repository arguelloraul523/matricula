import { defineStore } from "pinia"
import { ref } from "vue"

export const useEstudiantesStore = defineStore("estudiantes", () => {

  const estudiantes = ref([
    { id: 1, nombre: "Ana Torres", email: "ana.torres@mail.com", documento: "1001", telefono: "310 442 8891" },
    { id: 2, nombre: "Luis Pérez", email: "luis.perez@mail.com", documento: "1002", telefono: "322 510 7734" },
    { id: 3, nombre: "María Gómez", email: "maria.gomez@mail.com", documento: "1003", telefono: "" },
  ])

  function agregarEstudiante(datos) {
    const nuevoId = estudiantes.value.length
      ? Math.max(...estudiantes.value.map(e => e.id)) + 1
      : 1
    estudiantes.value.push({ id: nuevoId, ...datos })
  }

  function editarEstudiante(id, datos) {
    const idx = estudiantes.value.findIndex(e => e.id === id)
    if (idx !== -1) {
      estudiantes.value[idx] = { ...estudiantes.value[idx], ...datos }
    }
  }

  function eliminarEstudiante(id) {
    estudiantes.value = estudiantes.value.filter(e => e.id !== id)
  }

  // Nueva en este avance: MatricularView.vue la usa para mostrar el
  // nombre del estudiante en la tabla de matrículas registradas.
  function obtenerEstudiante(id) {
    return estudiantes.value.find(e => e.id === Number(id))
  }

  return {
    estudiantes,
    agregarEstudiante,
    editarEstudiante,
    eliminarEstudiante,
    obtenerEstudiante,
  }
},
{
  persist: true,
})
