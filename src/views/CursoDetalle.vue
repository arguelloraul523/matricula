<template>
  <q-page class="vista" v-if="curso">
    <header class="det-cab">
      <nav class="migas" aria-label="Ruta"><router-link to="/">Academia</router-link><q-icon name="chevron_right" size="16px" /><router-link to="/cursos">Cursos</router-link><q-icon name="chevron_right" size="16px" />{{ curso.nombre }}</nav>
      <h1>{{ curso.nombre }}</h1>
      <p>{{ curso.docente }} · {{ curso.horario || 'Horario por definir' }}</p>
    </header>
    <div class="vista__cuerpo">
      <section class="panel-blanco cupo">
        <div class="cupo__fila"><strong>Cupo ocupado</strong><span>{{ inscritos.length }} / {{ curso.cupo }}</span></div>
        <q-linear-progress :value="Math.min(1, ocupacion)" :color="ocupacion >= 1 ? 'negative' : 'primary'" track-color="grey-3" size="10px" rounded />
        <small>{{ ocupacion >= 1 ? 'El curso está lleno.' : `Quedan ${curso.cupo - inscritos.length} cupos disponibles.` }}</small>
      </section>
      <section class="panel-blanco">
        <h2>Estudiantes inscritos</h2>
        <p class="panel-blanco__sub">Las notas se registran desde la sección Cursos.</p>
        <q-table class="tabla" flat :rows="filas" :columns="columnas" row-key="id" hide-pagination :rows-per-page-options="[0]">
          <template #no-data><div class="vacio">Aún no hay estudiantes inscritos en este curso.</div></template>
          <template #body-cell-nombre="p"><q-td :props="p"><router-link :to="`/estudiantes/${p.row.estudianteId}`" class="enlace">{{ p.row.nombre }}</router-link></q-td></template>
          <template #body-cell-estado="p"><q-td :props="p"><EstadoSelector :estado="p.row.estado" :editable="false" /></q-td></template>
        </q-table>
      </section>
    </div>
  </q-page>
  <q-page v-else class="vista"><div class="vista__cuerpo"><q-banner rounded class="bg-orange-1 text-orange-9">Curso no encontrado. <router-link to="/cursos">Volver a cursos</router-link></q-banner></div></q-page>
</template>

<script setup>
import { computed } from 'vue'
import EstadoSelector from '../components/EstadoSelector.vue'
import { useCursosStore } from '../stores/cursos'
import { useEstudiantesStore } from '../stores/estudiantes'
import { useMatriculasStore } from '../stores/matriculas'

const props = defineProps({ id: { type: [String, Number], required: true } })
const cursosStore = useCursosStore()
const estudiantesStore = useEstudiantesStore()
const matriculasStore = useMatriculasStore()

const curso = computed(() => cursosStore.obtenerCurso(props.id))
const inscritos = computed(() => matriculasStore.estudiantesDeCurso(props.id))
const ocupacion = computed(() => curso.value ? inscritos.value.length / curso.value.cupo : 0)
const columnas = [
  { name: 'nombre', label: 'Estudiante', field: 'nombre', align: 'left' },
  { name: 'nota', label: 'Nota', field: 'nota', align: 'left' },
  { name: 'estado', label: 'Estado', field: 'estado', align: 'left' },
]
const filas = computed(() => inscritos.value.map(m => ({
  id: m.id, estudianteId: m.estudianteId,
  nombre: estudiantesStore.obtenerEstudiante(m.estudianteId)?.nombre ?? 'Estudiante eliminado',
  nota: m.nota ?? 'Sin nota', estado: m.estado,
})))
</script>

<style scoped>
.det-cab { padding: 30px 32px 24px; border-bottom: 1px solid var(--borde); }
.migas { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; color: var(--tinta-suave); font-size: 14.5px; }
.migas a { color: var(--teal); font-weight: 600; text-decoration: none; }
h1 { font: 700 clamp(28px, 4vw, 38px)/1.1 var(--fuente-titulo); margin: 8px 0 6px; }
p { margin: 0; color: var(--tinta-suave); font-size: 15.5px; }
.cupo { max-width: 480px; display: flex; flex-direction: column; gap: 10px; }
.cupo__fila { display: flex; justify-content: space-between; }
.cupo small { color: var(--tinta-suave); font-size: 14px; }
@media (max-width: 640px) { .det-cab { padding: 20px 16px; } }
</style>
