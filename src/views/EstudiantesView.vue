<template>
  <q-page class="vista">
    <PageHeader seccion="Estudiantes" titulo="Gestión de estudiantes" v-model="busqueda"
      :subtitulo="`${store.estudiantes.length} registros · cursos activos por estudiante`"
      placeholder="Buscar por nombre o documento..." accion="Nuevo estudiante" @accion="abrirNuevo" />

    <div class="vista__cuerpo">
      <section class="panel-blanco" aria-label="Listado de estudiantes">
        <div class="filtros" role="group" aria-label="Filtrar estudiantes">
          <button v-for="f in filtros" :key="f.clave" type="button"
            :class="['filtro', { 'filtro--on': filtro === f.clave }]" :aria-pressed="filtro === f.clave"
            @click="filtro = f.clave">{{ f.texto }} · {{ f.cantidad }}</button>
        </div>

        <q-table class="tabla" flat :rows="filasVisibles" :columns="columnas" row-key="id"
          :filter="busqueda" :filter-method="filtrarTexto" :rows-per-page-options="[5, 10, 20]"
          rows-per-page-label="Filas por página" :pagination-label="(a, b, t) => `${a}–${b} de ${t}`">
          <template #no-data>
            <div class="vacio">
              <q-icon name="inbox" size="32px" /><br />
              {{ store.estudiantes.length ? 'Sin resultados para tu filtro.' : 'Aún no hay estudiantes. Crea el primero con "Nuevo estudiante".' }}
            </div>
          </template>

          <template #body-cell-nombre="p">
            <q-td :props="p">
              <div class="celda-persona">
                <span class="avatar-mini">{{ iniciales(p.row.nombre) }}</span>
                <router-link :to="`/estudiantes/${p.row.id}`">{{ p.row.nombre }}</router-link>
              </div>
            </q-td>
          </template>
          <template #body-cell-cursos="p">
            <q-td :props="p"><span class="chip-curso">{{ p.row.cursosActivos }} {{ p.row.cursosActivos === 1 ? 'activo' : 'activos' }}</span></q-td>
          </template>
          <template #body-cell-estado="p">
            <q-td :props="p">
              <span :class="['estado', p.row.cursosActivos ? 'estado--on' : 'estado--off']">{{ p.row.cursosActivos ? 'Activo' : 'Inactivo' }}</span>
            </q-td>
          </template>
          <template #body-cell-acciones="p">
            <q-td :props="p" auto-width>
              <q-btn flat round dense icon="history" aria-label="Ver historial" @click="historialId = p.row.id"><q-tooltip>Ver historial</q-tooltip></q-btn>
              <q-btn flat round dense icon="edit" aria-label="Editar" @click="abrirEditar(p.row)"><q-tooltip>Editar</q-tooltip></q-btn>
              <q-btn flat round dense icon="delete" color="negative" aria-label="Eliminar" @click="eliminar(p.row)"><q-tooltip>Eliminar</q-tooltip></q-btn>
            </q-td>
          </template>
        </q-table>
      </section>
    </div>

    <!-- Crear / editar -->
    <q-dialog transition-show="scale" transition-hide="scale" v-model="dialogAbierto">
      <q-card class="dialogo">
        <div class="dialogo__cabecera">
          <span class="dialogo__icono"><q-icon name="person_add" size="24px" /></span>
          <span class="dialogo__titulo">{{ editando ? 'Editar estudiante' : 'Registrar estudiante' }}</span>
          <q-btn flat round dense icon="close" class="dialogo__cerrar" v-close-popup aria-label="Cerrar" />
        </div>
        <q-form class="dialogo__cuerpo" greedy @submit="guardar">
          <p class="dialogo__seccion">Datos personales</p>
          <div class="form-grid">
            <div class="full"><q-input v-model="form.nombre" outlined label="Nombre completo *"><template #prepend><q-icon name="person" /></template></q-input></div>
            <div><q-input v-model="form.documento" outlined label="Documento *" inputmode="numeric"><template #prepend><q-icon name="badge" /></template></q-input></div>
            <div><q-input v-model="form.telefono" outlined inputmode="tel" label="Teléfono"><template #prepend><q-icon name="call" /></template></q-input></div>
            <div class="full"><q-input v-model="form.email" outlined type="email" label="Correo electrónico *"><template #prepend><q-icon name="mail" /></template></q-input></div>
          </div>
          <div class="dialogo__acciones">
            <q-btn flat no-caps color="grey-8" label="Cancelar" v-close-popup />
            <q-btn unelevated no-caps color="primary" type="submit" label="Guardar estudiante" />
          </div>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- Historial -->
    <q-dialog transition-show="scale" transition-hide="scale" v-model="historialAbierto" @hide="filtroHistorial = 'todos'">
      <q-card class="dialogo" v-if="estudianteHistorial">
        <div class="dialogo__cabecera">
          <span class="dialogo__icono"><q-icon name="history" size="24px" /></span>
          <span class="dialogo__titulo">{{ estudianteHistorial.nombre }}</span>
          <span class="prom">Promedio <strong>{{ matriculasStore.calcularPromedio(estudianteHistorial.id) ?? '—' }}</strong></span>
          <q-btn flat round dense icon="close" class="dialogo__cerrar" v-close-popup aria-label="Cerrar" />
        </div>
        <div class="dialogo__cuerpo">
          <p class="panel-blanco__sub">{{ estudianteHistorial.email }} · Doc. {{ estudianteHistorial.documento }}</p>
          <div class="filtros" role="group" aria-label="Filtrar por estado">
            <button v-for="f in filtrosHistorial" :key="f.clave" type="button"
              :class="['filtro', { 'filtro--on': filtroHistorial === f.clave }]" @click="filtroHistorial = f.clave">
              {{ f.texto }} ({{ f.cantidad }})
            </button>
          </div>
          <div v-if="!matriculasHistorial.length" class="vacio">Sin matrículas en este filtro.</div>
          <div v-for="m in matriculasHistorial" :key="m.id" class="hist">
            <div>
              <div class="hist__curso">{{ cursosStore.obtenerCurso(m.cursoId)?.nombre ?? 'Curso eliminado' }}</div>
              <div class="hist__sub">Inscrito el {{ formatearFecha(m.fecha) }}</div>
            </div>
            <EstadoSelector :estado="m.estado" :editable="false" />
            <strong class="hist__nota">{{ m.nota ?? 'Sin nota' }}</strong>
          </div>
          <div class="dialogo__acciones" style="justify-content: space-between; align-items: center">
            <router-link :to="`/estudiantes/${estudianteHistorial.id}`" class="enlace" @click="historialId = null">Ver ficha completa</router-link>
            <q-btn unelevated no-caps color="dark" label="Cerrar" v-close-popup />
          </div>
        </div>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import PageHeader from '../components/PageHeader.vue'
import EstadoSelector from '../components/EstadoSelector.vue'
import { notificar, confirmar, validarCampos, validarConAlerta } from '../utils/alertas'
import { iniciales, formatearFecha } from '../utils/estado'
import { useEstudiantesStore } from '../stores/estudiantes'
import { useCursosStore } from '../stores/cursos'
import { useMatriculasStore } from '../stores/matriculas'

const store = useEstudiantesStore()
const cursosStore = useCursosStore()
const matriculasStore = useMatriculasStore()

const busqueda = ref('')
const filtro = ref('todos')

const filas = computed(() =>
  store.estudiantes.map(e => {
    const ms = matriculasStore.cursosDeEstudiante(e.id)
    return { ...e, telefono: e.telefono || '—', total: ms.length, cursosActivos: ms.filter(m => m.estado === 'activo').length }
  })
)
const filtros = computed(() => [
  { clave: 'todos', texto: 'Todos', cantidad: filas.value.length },
  { clave: 'activos', texto: 'Activos', cantidad: filas.value.filter(f => f.cursosActivos).length },
  { clave: 'inactivos', texto: 'Inactivos', cantidad: filas.value.filter(f => !f.cursosActivos).length },
  { clave: 'sin', texto: 'Sin cursos', cantidad: filas.value.filter(f => !f.total).length },
])
const filasVisibles = computed(() => filas.value.filter(f =>
  filtro.value === 'todos' ? true
    : filtro.value === 'activos' ? f.cursosActivos > 0
    : filtro.value === 'inactivos' ? f.cursosActivos === 0
    : f.total === 0
))
function filtrarTexto(rows, terms) {
  const q = terms.trim().toLowerCase()
  return rows.filter(r => [r.nombre, r.documento, r.email].some(v => String(v).toLowerCase().includes(q)))
}

const columnas = [
  { name: 'documento', label: 'Documento', field: 'documento', align: 'left', sortable: true },
  { name: 'nombre', label: 'Nombre completo', field: 'nombre', align: 'left', sortable: true },
  { name: 'email', label: 'Correo electrónico', field: 'email', align: 'left' },
  { name: 'telefono', label: 'Teléfono', field: 'telefono', align: 'left' },
  { name: 'cursos', label: 'Cursos', field: 'cursosActivos', align: 'left', sortable: true },
  { name: 'estado', label: 'Estado', field: 'cursosActivos', align: 'left' },
  { name: 'acciones', label: 'Acciones', field: 'acciones', align: 'right' },
]

// Formulario
const dialogAbierto = ref(false)
const editando = ref(null)
const form = reactive({ nombre: '', email: '', documento: '', telefono: '' })
const reglas = {
  documento: [
    v => !!v?.trim() || 'Ingresa el documento',
    v => /^\d+$/.test(v.trim()) || 'Usa solo números',
    v => !store.estudiantes.some(e => e.documento === (v ?? '').trim() && e.id !== editando.value) || 'Ya existe un estudiante con este documento',
  ],
  nombre: [v => !!v?.trim() || 'Ingresa el nombre completo'],
  email: [v => !!v?.trim() || 'Ingresa el correo', v => /^\S+@\S+\.\S+$/.test(v.trim()) || 'Escribe un correo válido, como nombre@mail.com'],
  telefono: [v => !v || /^[\d\s]+$/.test(v) || 'Usa solo dígitos'],
}

function abrirNuevo() {
  editando.value = null
  Object.assign(form, { nombre: '', email: '', documento: '', telefono: '' })
  dialogAbierto.value = true
}
function abrirEditar(fila) {
  editando.value = fila.id
  Object.assign(form, { nombre: fila.nombre, email: fila.email, documento: fila.documento, telefono: fila.telefono === '—' ? '' : fila.telefono })
  dialogAbierto.value = true
}
function guardar() {
  const ok = validarConAlerta(validarCampos([
    [form.nombre, reglas.nombre], [form.documento, reglas.documento],
    [form.email, reglas.email], [form.telefono, reglas.telefono],
  ]), editando.value ? 'No se pudo actualizar el estudiante' : 'No se pudo registrar el estudiante')
  if (!ok) return
  const datos = { nombre: form.nombre.trim(), email: form.email.trim(), documento: form.documento.trim(), telefono: form.telefono.trim() }
  if (editando.value) {
    store.editarEstudiante(editando.value, datos)
    notificar({ type: 'positive', message: 'Estudiante actualizado.' })
  } else {
    store.agregarEstudiante(datos)
    notificar({ type: 'positive', message: 'Estudiante guardado.' })
  }
  dialogAbierto.value = false
}
function eliminar(fila) {
  confirmar({
    title: 'Confirmar eliminación',
    message: `¿Seguro que deseas eliminar a "${fila.nombre}"? Se eliminarán también sus matrículas y notas. Esta acción no se puede deshacer.`,
  }).then(ok => {
    if (!ok) return
    store.eliminarEstudiante(fila.id)
    matriculasStore.eliminarPorEstudiante(fila.id)
    notificar({ type: 'warning', message: `Estudiante "${fila.nombre}" eliminado.` })
  })
}

// Historial
const historialId = ref(null)
const filtroHistorial = ref('todos')
const historialAbierto = computed({ get: () => historialId.value !== null, set: v => { if (!v) historialId.value = null } })
const estudianteHistorial = computed(() => historialId.value ? store.obtenerEstudiante(historialId.value) : null)
const todasHistorial = computed(() => historialId.value ? matriculasStore.cursosDeEstudiante(historialId.value) : [])
const matriculasHistorial = computed(() =>
  todasHistorial.value.filter(m => filtroHistorial.value === 'todos' || m.estado === filtroHistorial.value)
)
const filtrosHistorial = computed(() => [
  { clave: 'todos', texto: 'Todos', cantidad: todasHistorial.value.length },
  { clave: 'aprobado', texto: 'Aprobado', cantidad: todasHistorial.value.filter(m => m.estado === 'aprobado').length },
  { clave: 'activo', texto: 'Inscrito', cantidad: todasHistorial.value.filter(m => m.estado === 'activo').length },
  { clave: 'reprobado', texto: 'Reprobado', cantidad: todasHistorial.value.filter(m => m.estado === 'reprobado').length },
])
</script>

<style scoped>
.chip-curso { background: var(--menta); color: var(--teal); font-weight: 600; font-size: 14px; padding: 4px 12px; border-radius: 8px; }
.estado { display: inline-flex; align-items: center; gap: 8px; padding: 4px 12px; border-radius: 8px; font-size: 14px; font-weight: 500; }
.estado::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
.estado--on { background: var(--menta); color: #166534; }
.hist__nota { font-size: 15px; }
.estado--off { background: #e8e9e4; color: #5b6560; }
.prom { font-size: 14px; font-weight: 400; color: #b9cbc4; margin-left: auto; }
.prom strong { font: 700 26px var(--fuente-titulo); color: #fff; margin-left: 6px; }
.hist { display: grid; grid-template-columns: 1fr auto 64px; gap: 12px; align-items: center; padding: 14px 0; border-top: 1px solid var(--borde); }
.hist__curso { font-weight: 600; font-size: 17px; }
.hist__sub { color: var(--tinta-suave); font-size: 14px; }
.hist__nota { text-align: right; }
.enlace { color: var(--teal); font-weight: 600; }
</style>
