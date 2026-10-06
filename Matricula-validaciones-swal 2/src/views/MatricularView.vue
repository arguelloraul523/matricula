<template>
  <q-page class="vista">
    <PageHeader seccion="Matrículas" titulo="Gestión de matrículas" v-model="busqueda"
      placeholder="Buscar por estudiante o curso..." accion="Agregar matrícula" @accion="abrirMatricula" />

    <div class="vista__cuerpo">
      <section class="stats" aria-label="Indicadores de matrículas">
        <StatCard icono="assignment_turned_in" :valor="matriculasStore.totalActivas" etiqueta="Matrículas activas" />
        <StatCard icono="event_seat" :valor="cuposTotales - cuposOcupados" etiqueta="Cupos disponibles"
          :progreso="cuposTotales ? (cuposTotales - cuposOcupados) / cuposTotales : 0" />
        <StatCard icono="edit_note" :valor="sinCalificar" etiqueta="Sin calificar" />
        <StatCard :anillo="cuposTotales ? cuposOcupados / cuposTotales : 0" etiqueta="Ocupación de cupos" />
      </section>

      <section class="panel-blanco" aria-label="Historial de matrículas">
        <h2>Historial de matrículas</h2>
        <p class="panel-blanco__sub">Cambia el estado con un clic sobre la etiqueta.</p>

        <div class="filtros" role="group" aria-label="Filtrar por estado">
          <button v-for="f in filtros" :key="f.clave" type="button"
            :class="['filtro', { 'filtro--on': filtro === f.clave }]" :aria-pressed="filtro === f.clave"
            @click="filtro = f.clave">{{ f.texto }}: {{ f.cantidad }}</button>
        </div>

        <q-table class="tabla" flat :rows="filasVisibles" :columns="columnas" row-key="id"
          :filter="busqueda" :filter-method="filtrarTexto" :rows-per-page-options="[5, 10, 20]"
          rows-per-page-label="Filas por página" :pagination-label="(a, b, t) => `${a}–${b} de ${t}`">
          <template #no-data>
            <div class="vacio">
              <q-icon name="inbox" size="32px" /><br />
              {{ filas.length ? 'Sin resultados para tu filtro.' : 'Aún no hay matrículas. Registra la primera arriba.' }}
            </div>
          </template>
          <template #body-cell-estudiante="p">
            <q-td :props="p">
              <div class="celda-persona">
                <span class="avatar-mini">{{ iniciales(p.row.estudiante) }}</span>
                <div><router-link :to="`/estudiantes/${p.row.estudianteId}`">{{ p.row.estudiante }}</router-link><small>Doc. {{ p.row.documento }}</small></div>
              </div>
            </q-td>
          </template>
          <template #body-cell-estado="p">
            <q-td :props="p"><EstadoSelector :estado="p.row.estado" @cambiar="e => cambiarEstado(p.row.id, e)" /></q-td>
          </template>
          <template #body-cell-acciones="p">
            <q-td :props="p" auto-width>
              <q-btn flat round dense icon="delete" color="negative" aria-label="Eliminar matrícula" @click="eliminar(p.row)"><q-tooltip>Eliminar matrícula</q-tooltip></q-btn>
            </q-td>
          </template>
        </q-table>
      </section>
    </div>

    <q-dialog transition-show="scale" transition-hide="scale" v-model="matriculaDialog">
      <q-card class="dialogo dialogo-matricula">
        <div class="dialogo__cabecera">
          <span class="dialogo__icono"><q-icon name="how_to_reg" size="24px" /></span>
          <span class="dialogo__titulo">Agregar matrícula</span>
          <q-btn flat round dense icon="close" class="dialogo__cerrar" v-close-popup aria-label="Cerrar" />
        </div>
        <q-form class="dialogo__cuerpo" greedy @submit="inscribir">
          <p class="panel-blanco__sub">Selecciona el estudiante y el curso para registrar la matrícula.</p>
          <q-select v-model="estudianteSeleccionado" :options="estudiantesFiltrados" label="Estudiante *" outlined emit-value map-options use-input hide-selected fill-input input-debounce="0" behavior="menu" popup-content-class="menu-select" class="q-mb-sm" @filter="filtrarEstudiantes">
            <template #prepend><q-icon name="person_search" color="primary" /></template>
            <template #option="{ itemProps, opt, selected }">
              <q-item v-bind="itemProps">
                <q-item-section avatar><span class="opcion-avatar">{{ iniciales(opt.nombre) }}</span></q-item-section>
                <q-item-section><q-item-label>{{ opt.nombre }}</q-item-label><q-item-label caption>Doc. {{ opt.documento }}</q-item-label></q-item-section>
                <q-item-section v-if="selected" side><q-icon name="check" color="primary" /></q-item-section>
              </q-item>
            </template>
            <template #no-option><q-item><q-item-section class="text-grey-7">Sin resultados</q-item-section></q-item></template>
          </q-select>
          <q-select v-model="cursoSeleccionado" :options="cursosFiltrados" label="Curso *" outlined emit-value map-options use-input hide-selected fill-input input-debounce="0" behavior="menu" popup-content-class="menu-select" @filter="filtrarCursos">
            <template #prepend><q-icon name="menu_book" color="primary" /></template>
            <template #option="{ itemProps, opt, selected }">
              <q-item v-bind="itemProps">
                <q-item-section><q-item-label>{{ opt.nombre }}</q-item-label><q-item-label caption>{{ opt.docente }}</q-item-label></q-item-section>
                <q-item-section side>
                  <span :class="['opcion-chip', { 'opcion-chip--lleno': opt.finalizado || opt.inscritos >= opt.cupo }]">{{ opt.finalizado ? 'Finalizado' : opt.inscritos >= opt.cupo ? 'Lleno' : `${opt.inscritos}/${opt.cupo}` }}</span>
                </q-item-section>
                <q-item-section v-if="selected" side><q-icon name="check" color="primary" /></q-item-section>
              </q-item>
            </template>
            <template #no-option><q-item><q-item-section class="text-grey-7">Sin resultados</q-item-section></q-item></template>
          </q-select>
          <ul class="checks" aria-live="polite">
            <li v-for="c in checks" :key="c.texto" :class="'check--' + c.estado">
              <q-icon :name="c.estado === 'ok' ? 'check_circle' : c.estado === 'error' ? 'cancel' : 'radio_button_unchecked'" size="20px" />
              {{ c.texto }}
            </li>
          </ul>
          <div class="dialogo__acciones">
            <q-btn flat no-caps color="grey-8" label="Cancelar" @click="matriculaDialog = false" />
            <q-btn unelevated no-caps color="primary" type="submit" label="Guardar matrícula" :loading="inscribiendo" />
          </div>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, ref } from 'vue'
import PageHeader from '../components/PageHeader.vue'
import StatCard from '../components/StatCard.vue'
import EstadoSelector from '../components/EstadoSelector.vue'
import { notificar, confirmar, avisar, validarConAlerta } from '../utils/alertas'
import { iniciales, etiquetaEstado, formatearFecha } from '../utils/estado'
import { useResumen } from '../composables/useResumen'
import { cursoTerminado } from '../utils/curso'

const { estudiantesStore, cursosStore, matriculasStore, cursosInfo, cuposTotales, cuposOcupados } = useResumen()

const busqueda = ref('')
const filtro = ref('todos')
const matriculaDialog = ref(false)
const estudianteSeleccionado = ref(null)
const cursoSeleccionado = ref(null)
const inscribiendo = ref(false)

const opcionesEstudiantes = computed(() => estudiantesStore.estudiantes.map(e => ({ label: e.nombre, nombre: e.nombre, documento: e.documento, value: e.id })))
const opcionesCursos = computed(() => cursosInfo.value.map(c => ({
  label: c.nombre, nombre: c.nombre, docente: c.docente, inscritos: c.inscritos, cupo: c.cupo, value: c.id, finalizado: cursoTerminado(c), disable: cursoTerminado(c),
})))

// Búsqueda dentro de los select
const textoEst = ref('')
const textoCur = ref('')
const estudiantesFiltrados = computed(() => { const q = textoEst.value.toLowerCase(); return opcionesEstudiantes.value.filter(o => !q || `${o.nombre} ${o.documento}`.toLowerCase().includes(q)) })
const cursosFiltrados = computed(() => { const q = textoCur.value.toLowerCase(); return opcionesCursos.value.filter(o => !q || `${o.nombre} ${o.docente}`.toLowerCase().includes(q)) })
const filtrarEstudiantes = (val, update) => update(() => { textoEst.value = val })
const filtrarCursos = (val, update) => update(() => { textoCur.value = val })

const sinCalificar = computed(() => matriculasStore.matriculas.filter(m => m.nota === null && m.estado !== 'retirado').length)

// Validaciones en vivo
const ambos = computed(() => estudianteSeleccionado.value !== null && cursoSeleccionado.value !== null)
const duplicado = computed(() => ambos.value && matriculasStore.matriculas.some(
  m => m.estudianteId === estudianteSeleccionado.value && m.cursoId === cursoSeleccionado.value))
const cursoInfo = computed(() => cursosInfo.value.find(c => c.id === cursoSeleccionado.value))
const sinCupo = computed(() => !!cursoInfo.value && cursoInfo.value.inscritos >= cursoInfo.value.cupo)
const checks = computed(() => [
  {
    estado: !ambos.value ? 'neutro' : duplicado.value ? 'error' : 'ok',
    texto: duplicado.value ? 'Este estudiante ya está inscrito en el curso' : 'Sin duplicados',
  },
  {
    estado: !cursoInfo.value ? 'neutro' : sinCupo.value ? 'error' : 'ok',
    texto: !cursoInfo.value ? 'Cupo disponible' : sinCupo.value ? 'El curso no tiene cupos' : `Quedan ${cursoInfo.value.cupo - cursoInfo.value.inscritos} cupos`,
  },
])
const puedeInscribir = computed(() => ambos.value && !duplicado.value && !sinCupo.value)

function abrirMatricula() {
  estudianteSeleccionado.value = null
  cursoSeleccionado.value = null
  matriculaDialog.value = true
}
function inscribir() {
  const errores = []
  if (estudianteSeleccionado.value === null) errores.push('Selecciona un estudiante')
  if (cursoSeleccionado.value === null) errores.push('Selecciona un curso')
  if (ambos.value && duplicado.value) errores.push('Este estudiante ya está inscrito en ese curso')
  if (cursoInfo.value && cursoTerminado(cursoInfo.value)) errores.push('El curso ya finalizó y no admite matrículas')
  else if (sinCupo.value) errores.push('El curso no tiene cupos disponibles')
  if (!validarConAlerta(errores, 'No se pudo matricular')) return
  inscribiendo.value = true
  const r = matriculasStore.matricularEstudiante(estudianteSeleccionado.value, cursoSeleccionado.value)
  if (r.ok) notificar({ type: 'positive', message: r.mensaje })
  else avisar({ type: 'negative', title: 'No se pudo matricular', message: r.mensaje })
  if (r.ok) {
    matriculaDialog.value = false
    estudianteSeleccionado.value = null
    cursoSeleccionado.value = null
  }
  inscribiendo.value = false
}

// Historial
const filas = computed(() =>
  [...matriculasStore.matriculas]
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id)
    .map(m => {
      const est = estudiantesStore.obtenerEstudiante(m.estudianteId)
      return {
        id: m.id,
        estudianteId: m.estudianteId,
        estudiante: est?.nombre ?? 'Estudiante eliminado',
        documento: est?.documento ?? '—',
        curso: cursosStore.obtenerCurso(m.cursoId)?.nombre ?? 'Curso eliminado',
        fecha: m.fecha,
        estado: m.estado,
      }
    })
)
const filtros = computed(() => [
  { clave: 'todos', texto: 'Todas', cantidad: filas.value.length },
  ...['activo', 'aprobado', 'reprobado', 'retirado'].map(e => ({
    clave: e, texto: etiquetaEstado(e), cantidad: filas.value.filter(f => f.estado === e).length,
  })),
])
const filasVisibles = computed(() => filas.value.filter(f => filtro.value === 'todos' || f.estado === filtro.value))
function filtrarTexto(rows, terms) {
  const q = terms.trim().toLowerCase()
  return rows.filter(r => [r.estudiante, r.curso, r.documento].some(v => String(v).toLowerCase().includes(q)))
}
const columnas = [
  { name: 'estudiante', label: 'Estudiante', field: 'estudiante', align: 'left', sortable: true },
  { name: 'curso', label: 'Curso', field: 'curso', align: 'left', sortable: true },
  { name: 'fecha', label: 'Fecha de registro', field: 'fecha', align: 'left', sortable: true, format: formatearFecha },
  { name: 'estado', label: 'Estado', field: 'estado', align: 'left' },
  { name: 'acciones', label: 'Acciones', field: 'id', align: 'right' },
]

function cambiarEstado(id, estado) {
  const r = matriculasStore.actualizarMatricula(id, { estado })
  notificar(r.ok ? { type: 'info', message: 'Estado actualizado.' } : { type: 'warning', message: r.mensaje })
}
function eliminar(fila) {
  confirmar({
    title: 'Confirmar eliminación',
    message: `¿Eliminar la matrícula de "${fila.estudiante}" en "${fila.curso}"? Se liberará el cupo.`,
  }).then(ok => {
    if (!ok) return
    matriculasStore.eliminarMatricula(fila.id)
    notificar({ type: 'warning', message: 'Matrícula eliminada.' })
  })
}
</script>

<style scoped>
.checks { list-style: none; padding: 0; margin: 20px 0; display: flex; flex-wrap: wrap; gap: 8px 24px; font-size: 16px; }
.checks li { display: flex; align-items: center; gap: 8px; }
.check--ok { color: #166534; }
.check--error { color: #b3261e; font-weight: 600; }
.check--neutro { color: var(--tinta-suave); }
</style>
