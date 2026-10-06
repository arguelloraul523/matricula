<template>
  <q-page class="vista" v-if="estudiante">
    <header class="det-cab">
      <nav class="migas" aria-label="Ruta"><router-link to="/">Academia</router-link><q-icon name="chevron_right" size="16px" /><router-link to="/estudiantes">Estudiantes</router-link><q-icon name="chevron_right" size="16px" />{{ estudiante.nombre }}</nav>
      <h1>{{ estudiante.nombre }}</h1>
      <p>{{ estudiante.email }} · Documento {{ estudiante.documento }}<template v-if="estudiante.telefono"> · {{ estudiante.telefono }}</template></p>
    </header>
    <div class="vista__cuerpo">
      <section class="stats" style="grid-template-columns: repeat(2, minmax(0, 1fr)); max-width: 640px">
        <StatCard icono="menu_book" :valor="matriculas.length" etiqueta="Cursos inscritos" />
        <StatCard icono="grade" :valor="promedio ?? '—'" etiqueta="Promedio general" />
      </section>
      <section class="panel-blanco">
        <h2>Historial académico</h2>
        <p class="panel-blanco__sub">Las notas se registran desde la sección Cursos.</p>
        <q-table class="tabla" flat :rows="filas" :columns="columnas" row-key="id" hide-pagination :rows-per-page-options="[0]">
          <template #no-data><div class="vacio">Este estudiante aún no está inscrito en ningún curso.</div></template>
          <template #body-cell-curso="p"><q-td :props="p"><router-link :to="`/cursos/${p.row.cursoId}`" class="enlace">{{ p.row.curso }}</router-link></q-td></template>
          <template #body-cell-estado="p"><q-td :props="p"><EstadoSelector :estado="p.row.estado" :editable="false" /></q-td></template>
        </q-table>
      </section>
    </div>
  </q-page>
  <q-page v-else class="vista"><div class="vista__cuerpo"><q-banner rounded class="bg-orange-1 text-orange-9">Estudiante no encontrado. <router-link to="/estudiantes">Volver a estudiantes</router-link></q-banner></div></q-page>
</template>

<script setup>
import { computed } from 'vue'
import StatCard from '../components/StatCard.vue'
import EstadoSelector from '../components/EstadoSelector.vue'
import { useEstudiantesStore } from '../stores/estudiantes'
import { useCursosStore } from '../stores/cursos'
import { useMatriculasStore } from '../stores/matriculas'
import { formatearFecha } from '../utils/estado'

const props = defineProps({ id: { type: [String, Number], required: true } })
const estudiantesStore = useEstudiantesStore()
const cursosStore = useCursosStore()
const matriculasStore = useMatriculasStore()

const estudiante = computed(() => estudiantesStore.obtenerEstudiante(props.id))
const matriculas = computed(() => matriculasStore.cursosDeEstudiante(props.id))
const promedio = computed(() => matriculasStore.calcularPromedio(props.id))
const columnas = [
  { name: 'curso', label: 'Curso', field: 'curso', align: 'left' },
  { name: 'fecha', label: 'Inscripción', field: 'fecha', align: 'left', format: formatearFecha },
  { name: 'nota', label: 'Nota', field: 'nota', align: 'left', format: v => v ?? 'Sin nota' },
  { name: 'estado', label: 'Estado', field: 'estado', align: 'left' },
]
const filas = computed(() => matriculas.value.map(m => ({
  id: m.id, cursoId: m.cursoId, curso: cursosStore.obtenerCurso(m.cursoId)?.nombre ?? 'Curso eliminado',
  fecha: m.fecha, nota: m.nota, estado: m.estado,
})))
</script>

<style scoped>
.det-cab { padding: 30px 32px 24px; border-bottom: 1px solid var(--borde); }
.migas { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; color: var(--tinta-suave); font-size: 14.5px; }
.migas a { color: var(--teal); font-weight: 600; text-decoration: none; }
h1 { font: 700 clamp(28px, 4vw, 38px)/1.1 var(--fuente-titulo); margin: 8px 0 6px; }
p { margin: 0; color: var(--tinta-suave); font-size: 15.5px; }
@media (max-width: 640px) { .det-cab { padding: 20px 16px; } }
</style>
