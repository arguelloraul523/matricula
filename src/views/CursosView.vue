<template>
  <q-page class="vista">
    <PageHeader seccion="Cursos" titulo="Gestión de cursos" v-model="busqueda"
      placeholder="Buscar por nombre o docente..." accion="Nuevo curso" @accion="abrirNuevo" />

    <div class="vista__cuerpo">
      <section class="stats" aria-label="Indicadores de cursos">
        <StatCard icono="menu_book" :valor="store.cursos.length" etiqueta="Cursos activos" />
        <StatCard icono="groups" :valor="estudiantesActivos" etiqueta="Estudiantes inscritos" />
        <StatCard icono="grade" :valor="matriculasStore.promedioGeneral ?? '—'" etiqueta="Promedio general"
          :progreso="matriculasStore.promedioGeneral ? Number(matriculasStore.promedioGeneral) / 5 : 0" />
        <StatCard :anillo="cuposTotales ? cuposOcupados / cuposTotales : 0" etiqueta="Ocupación total" />
      </section>

      <section class="panel-blanco" aria-label="Catálogo de cursos">
        <h2>Catálogo de cursos</h2>
        <p class="panel-blanco__sub">Elige "Inscritos" para calificar a los estudiantes de un curso.</p>

        <div v-if="!cursosFiltrados.length" class="vacio">
          <q-icon name="inbox" size="32px" /><br />
          {{ store.cursos.length ? 'Sin resultados para tu búsqueda.' : 'Aún no hay cursos. Crea el primero con "Nuevo curso".' }}
        </div>

        <div class="catalogo">
          <article v-for="c in cursosFiltrados" :key="c.id" :class="['curso', { 'curso--sel': c.id === seleccionado }]">
            <div class="curso__cab">
              <div>
                <router-link :to="`/cursos/${c.id}`" class="curso__nombre">{{ c.nombre }}</router-link>
                <div><span :class="['estado-curso', 'estado-curso--' + estadoCurso(c)]">{{ etiquetaCurso[estadoCurso(c)] }}</span></div>
              </div>
              <q-btn flat round dense size="sm" icon="delete" color="negative" aria-label="Eliminar curso" @click="eliminar(c)"><q-tooltip>Eliminar</q-tooltip></q-btn>
            </div>
            <div class="curso__dato"><q-icon name="person" size="20px" />{{ c.docente }}</div>
            <div class="curso__dato"><q-icon name="schedule" size="20px" />{{ c.horario || 'Horario por definir' }}</div>
            <div class="curso__dato"><q-icon name="date_range" size="20px" />{{ c.fechaInicio && c.fechaFin ? `${formatearFecha(c.fechaInicio)} → ${formatearFecha(c.fechaFin)}` : 'Fechas por definir' }}</div>
            <div class="curso__cupo"><span>Capacidad</span><span>{{ c.inscritos }} / {{ c.cupo }} cupos</span></div>
            <q-linear-progress :value="Math.min(1, c.inscritos / c.cupo)" size="7px" rounded track-color="grey-3"
              :color="c.inscritos >= c.cupo ? 'negative' : 'accent'" />
            <div class="curso__botones">
              <q-btn unelevated no-caps class="btn-ambar" :label="`Inscritos (${c.inscritos})`" @click="irACalificar(c.id)" />
              <q-btn unelevated no-caps class="btn-gris" :icon="cursoTerminado(c) ? 'lock' : 'edit'" :label="cursoTerminado(c) ? 'Cerrado' : 'Editar'" :disable="cursoTerminado(c)" @click="abrirEditar(c)">
                <q-tooltip v-if="cursoTerminado(c)">El curso finalizó y ya no se puede modificar</q-tooltip>
              </q-btn>
            </div>
          </article>
        </div>
      </section>

      <section id="calificaciones" class="panel-blanco" aria-label="Registro de calificaciones">
        <h2>Registro de calificaciones</h2>
        <p class="panel-blanco__sub">Escribe la nota (0.0 a 5.0) y guarda. Con nota, un estudiante "Inscrito" pasa a Aprobado desde 3.0, o a Reprobado por debajo.</p>

        <q-select v-model="seleccionado" :options="opcionesCurso" emit-value map-options outlined
          label="Curso" class="sel-curso" behavior="menu" popup-content-class="menu-select">
          <template #prepend><q-icon name="menu_book" color="primary" /></template>
        </q-select>

        <div v-if="cursoSel && cursoTerminado(cursoSel)" :class="['aviso-curso', pendientesSel ? 'aviso-curso--warn' : 'aviso-curso--ok']" role="status">
          <q-icon :name="pendientesSel ? 'warning_amber' : 'lock'" size="22px" />
          <span v-if="pendientesSel"><strong>El curso finalizó el {{ formatearFecha(cursoSel.fechaFin) }}</strong> y {{ pendientesSel }} {{ pendientesSel === 1 ? 'estudiante no tiene nota' : 'estudiantes no tienen nota' }}. Solo puedes completar las notas faltantes; las ya registradas están bloqueadas.</span>
          <span v-else><strong>Curso finalizado.</strong> Todos los estudiantes están calificados y las notas ya no se pueden modificar.</span>
        </div>

        <q-table class="tabla q-mt-md" flat :rows="filasNotas" :columns="columnas" row-key="id"
          :rows-per-page-options="[5, 10]" rows-per-page-label="Filas por página"
          :pagination-label="(a, b, t) => `${a}–${b} de ${t}`">
          <template #no-data>
            <div class="vacio">{{ seleccionado ? 'Aún no hay estudiantes inscritos en este curso.' : 'Elige un curso para ver sus estudiantes.' }}</div>
          </template>
          <template #body-cell-estudiante="p">
            <q-td :props="p">
              <div class="celda-persona">
                <span class="avatar-mini">{{ iniciales(p.row.nombre) }}</span>
                <div><button type="button" class="link-button" @click="abrirCalificaciones(p.row.m)">{{ p.row.nombre }}</button><small>Doc. {{ p.row.documento }}</small></div>
              </div>
            </q-td>
          </template>
          <template #body-cell-estado="p">
            <q-td :props="p"><EstadoSelector :estado="estadoDe(p.row.m)" :editable="!p.row.bloqueada" @cambiar="e => editarFila(p.row.m, { estado: e })" /></q-td>
          </template>
          <template #body-cell-nota="p">
            <q-td :props="p">
              <q-input :model-value="notaDe(p.row.m)" type="number" step="0.1" min="0" max="5" outlined dense :disable="p.row.bloqueada"
                class="nota" aria-label="Nota" @update:model-value="v => editarFila(p.row.m, { nota: v })" />
            </q-td>
          </template>
          <template #body-cell-acciones="p">
            <q-td :props="p">
              <q-btn unelevated no-caps color="primary" label="Guardar calificación" :disable="p.row.bloqueada || !borradores[p.row.id]" :icon="p.row.bloqueada ? 'lock' : undefined" @click="guardarNota(p.row.m)" />
            </q-td>
          </template>
        </q-table>
      </section>
    </div>

    <q-dialog transition-show="scale" transition-hide="scale" v-model="calificacionesDialog">
      <q-card class="dialogo dialogo-calificaciones">
        <div class="dialogo__cabecera">
          <span class="dialogo__icono"><q-icon name="grade" size="24px" /></span>
          <span class="dialogo__titulo">Calificaciones · {{ estudianteCalificacion?.nombre }}</span>
          <q-btn flat round dense icon="close" class="dialogo__cerrar" v-close-popup aria-label="Cerrar" />
        </div>
        <div class="dialogo__cuerpo">
          <p class="panel-blanco__sub">{{ cursoSeleccionadoNombre }}</p>
          <div v-for="(nota, index) in calificacionesForm" :key="index" class="row items-center q-col-gutter-sm q-mb-sm">
            <div class="col"><q-input v-model.number="calificacionesForm[index]" type="number" min="0" max="5" step="0.1" outlined :label="`Calificación ${index + 1}`"><template #prepend><q-icon name="grade" /></template></q-input></div>
            <div class="col-auto"><q-btn flat round dense icon="delete" color="negative" :disable="calificacionesForm.length === 1" @click="quitarCalificacion(index)" /></div>
          </div>
          <div class="row items-center justify-between q-mt-md">
            <strong>Promedio: {{ promedioCalificaciones }}</strong>
            <q-btn flat no-caps color="primary" icon="add" label="Agregar calificación" @click="agregarCalificacion" />
          </div>
          <div class="dialogo__acciones">
            <q-btn flat no-caps color="grey-8" label="Cancelar" v-close-popup />
            <q-btn unelevated no-caps color="primary" label="Guardar calificaciones" @click="guardarCalificaciones" />
          </div>
        </div>
      </q-card>
    </q-dialog>

    <q-dialog transition-show="scale" transition-hide="scale" v-model="dialogAbierto">
      <q-card class="dialogo">
        <div class="dialogo__cabecera">
          <span class="dialogo__icono"><q-icon name="menu_book" size="24px" /></span>
          <span class="dialogo__titulo">{{ editando ? 'Editar curso' : 'Nuevo curso' }}</span>
          <q-btn flat round dense icon="close" class="dialogo__cerrar" v-close-popup aria-label="Cerrar" />
        </div>
        <q-form class="dialogo__cuerpo" greedy @submit="guardar">
          <p class="dialogo__seccion">Información del curso</p>
          <div class="form-grid">
            <div class="full"><q-input v-model="form.nombre" outlined label="Nombre del curso *"><template #prepend><q-icon name="menu_book" /></template></q-input></div>
            <div><q-input v-model="form.docente" outlined label="Docente *"><template #prepend><q-icon name="badge" /></template></q-input></div>
            <div><q-input v-model.number="form.cupo" outlined type="number" min="1" label="Cupo máximo *" suffix="est."><template #prepend><q-icon name="groups" /></template></q-input></div>
            <div class="full"><q-select v-model="diasSel" :options="DIAS_SEMANA" multiple emit-value map-options outlined label="Días de clase *" :display-value="resumenDias" hint="Despliega y marca los días" behavior="menu" popup-content-class="menu-select"><template #prepend><q-icon name="calendar_view_week" /></template></q-select></div>
            <div><q-select v-model="horaInicio" :options="opcionesHoraInicio" emit-value map-options outlined label="Hora de inicio *" hint="Despliega y elige la hora" behavior="menu" popup-content-class="menu-select"><template #prepend><q-icon name="schedule" /></template></q-select></div>
            <div><q-select v-model="horaFin" :options="opcionesHoraFin" emit-value map-options outlined label="Hora de fin *" :hint="horaInicio ? 'Despliega y elige la hora' : 'Primero elige la hora de inicio'" :disable="!horaInicio" behavior="menu" popup-content-class="menu-select"><template #prepend><q-icon name="schedule" /></template></q-select></div>
            <div><q-input v-model="form.fechaInicio" outlined label="Fecha de inicio *" mask="####-##-##" placeholder="AAAA-MM-DD">
                <template #prepend><q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="form.fechaInicio" mask="YYYY-MM-DD" :locale="localeEs" :options="opcionesInicio" color="primary">
                      <div class="row justify-end"><q-btn v-close-popup flat no-caps color="primary" label="Listo" /></div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon></template>
              </q-input></div>
            <div><q-input v-model="form.fechaFin" outlined label="Fecha de fin *" mask="####-##-##" placeholder="AAAA-MM-DD">
                <template #prepend><q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="form.fechaFin" mask="YYYY-MM-DD" :locale="localeEs" :options="opcionesFin" color="primary">
                      <div class="row justify-end"><q-btn v-close-popup flat no-caps color="primary" label="Listo" /></div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon></template>
              </q-input></div>
          </div>
          <div class="dialogo__acciones">
            <q-btn flat no-caps color="grey-8" label="Cancelar" v-close-popup />
            <q-btn unelevated no-caps color="primary" type="submit" label="Guardar curso" />
          </div>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import PageHeader from '../components/PageHeader.vue'
import StatCard from '../components/StatCard.vue'
import EstadoSelector from '../components/EstadoSelector.vue'
import { notificar, confirmar, validarCampos, validarConAlerta, avisar } from '../utils/alertas'
import { iniciales } from '../utils/estado'
import { useResumen } from '../composables/useResumen'
import { formatearFecha } from '../utils/estado'
import {
  DIAS_SEMANA, construirHorario, parsearHorario, formatearHora, localeEs, hoyISO, fechaValida, diasEntre,
  cursoTerminado, estadoCurso, etiquetaCurso, matriculaBloqueada, pendienteDeNota,
} from '../utils/curso'

const {
  cursosStore: store, estudiantesStore, matriculasStore, cursosInfo,
  estudiantesActivos, cuposTotales, cuposOcupados,
} = useResumen()

const busqueda = ref('')
const cursosFiltrados = computed(() => {
  const q = (busqueda.value ?? '').trim().toLowerCase()
  return cursosInfo.value.filter(c => !q || [c.nombre, c.docente].some(v => String(v).toLowerCase().includes(q)))
})

function irACalificar(id) {
  seleccionado.value = id
  document.getElementById('calificaciones')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Calificaciones del curso elegido
const seleccionado = ref(store.cursos[0]?.id ?? null)
watch(() => store.cursos.length, () => {
  if (!store.obtenerCurso(seleccionado.value)) seleccionado.value = store.cursos[0]?.id ?? null
})
const opcionesCurso = computed(() => store.cursos.map(c => ({ label: c.nombre, value: c.id })))
const borradores = reactive({})
const calificacionesDialog = ref(false)
const estudianteCalificacion = ref(null)
const matriculaCalificacion = ref(null)
const calificacionesForm = ref([null])
const cursoSeleccionadoNombre = computed(() => {
  const m = matriculaCalificacion.value
  return m ? store.obtenerCurso(m.cursoId)?.nombre ?? 'Curso eliminado' : ''
})
const promedioCalificaciones = computed(() => {
  const notas = calificacionesForm.value.filter(n => n !== null && n !== '' && !Number.isNaN(Number(n))).map(Number)
  return notas.length ? (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(2) : '—'
})
function abrirCalificaciones(m) {
  if (matriculaBloqueada(store.obtenerCurso(m.cursoId), m)) {
    notificar({ type: 'warning', message: 'El curso finalizó: las notas ya no se pueden modificar.' })
    return
  }
  const est = estudiantesStore.obtenerEstudiante(m.estudianteId)
  estudianteCalificacion.value = est
  matriculaCalificacion.value = m
  const existentes = Array.isArray(m.calificaciones) && m.calificaciones.length ? m.calificaciones : (m.nota !== null && m.nota !== undefined ? [m.nota] : [null])
  calificacionesForm.value = [...existentes]
  calificacionesDialog.value = true
}
function agregarCalificacion() { calificacionesForm.value.push(null) }
function quitarCalificacion(index) { if (calificacionesForm.value.length > 1) calificacionesForm.value.splice(index, 1) }
function guardarCalificaciones() {
  const notas = calificacionesForm.value.filter(n => n !== null && n !== '').map(Number)
  const errores = []
  calificacionesForm.value.forEach((n, i) => {
    if (n === null || n === '') return
    if (Number.isNaN(Number(n)) || Number(n) < 0 || Number(n) > 5) errores.push(`La calificación ${i + 1} debe estar entre 0.0 y 5.0`)
  })
  if (!notas.length) errores.push('Ingresa al menos una calificación')
  if (!validarConAlerta(errores, 'Calificaciones no válidas')) return
  const promedio = notas.length ? Number((notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(2)) : null
  const estado = promedio === null ? matriculaCalificacion.value.estado : promedio >= 3 ? 'aprobado' : 'reprobado'
  const r = matriculasStore.actualizarMatricula(matriculaCalificacion.value.id, { calificaciones: notas, nota: promedio, estado })
  calificacionesDialog.value = false
  notificar(r.ok ? { type: 'positive', message: 'Calificaciones guardadas.' } : { type: 'negative', message: r.mensaje })
}

const cursoSel = computed(() => store.obtenerCurso(seleccionado.value))
const pendientesSel = computed(() => cursoSel.value ? matriculasStore.estudiantesDeCurso(cursoSel.value.id).filter(pendienteDeNota).length : 0)

const filasNotas = computed(() =>
  seleccionado.value === null ? [] :
  matriculasStore.estudiantesDeCurso(seleccionado.value).map(m => {
    const est = estudiantesStore.obtenerEstudiante(m.estudianteId)
    return { id: m.id, m, bloqueada: matriculaBloqueada(cursoSel.value, m), nombre: est?.nombre ?? 'Estudiante eliminado', documento: est?.documento ?? '—' }
  })
)
const columnas = [
  { name: 'estudiante', label: 'Estudiante', field: 'nombre', align: 'left', sortable: true },
  { name: 'estado', label: 'Estado', field: 'id', align: 'left' },
  { name: 'nota', label: 'Nota', field: 'id', align: 'left' },
  { name: 'acciones', label: 'Acciones', field: 'id', align: 'right' },
]
const notaDe = m => borradores[m.id]?.nota ?? m.nota ?? ''
const estadoDe = m => borradores[m.id]?.estado ?? m.estado
function editarFila(m, datos) {
  borradores[m.id] = { nota: notaDe(m), estado: estadoDe(m), ...datos }
}
function guardarNota(m) {
  const b = borradores[m.id]
  const nota = b.nota === '' || b.nota === null ? null : Number(b.nota)
  if (nota !== null && (Number.isNaN(nota) || nota < 0 || nota > 5)) {
    validarConAlerta(['La nota debe ser un número entre 0.0 y 5.0'], 'Nota no válida')
    return
  }
  let estado = b.estado
  if (estado === 'activo' && nota !== null) estado = nota >= 3 ? 'aprobado' : 'reprobado'
  const r = matriculasStore.actualizarMatricula(m.id, { nota, estado })
  delete borradores[m.id]
  notificar(r.ok ? { type: 'positive', message: 'Calificación guardada.' } : { type: 'negative', message: r.mensaje })
}

// Crear / editar / eliminar curso
const dialogAbierto = ref(false)
const editando = ref(null)
const vacio = () => ({ nombre: '', docente: '', cupo: 20, fechaInicio: '', fechaFin: '' })
const form = reactive(vacio())
const diasSel = ref([])      // ej: ['Lun', 'Mié', 'Vie']
const horaInicio = ref('')   // 'HH:mm' (24 h)
const horaFin = ref('')
// Horas disponibles cada 30 min (05:00 a 23:30), guardadas como 'HH:mm'
const TODAS_LAS_HORAS = Array.from({ length: 38 }, (_, i) => {
  const min = 5 * 60 + i * 30
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
})
const aOpcion = h => ({ label: formatearHora(h), value: h })
// Si un curso guardado trae una hora fuera de la lista, se incluye para no perderla al editar
const conActual = (lista, actual) => (actual && !lista.includes(actual) ? [...lista, actual].sort() : lista)
const opcionesHoraInicio = computed(() => conActual(TODAS_LAS_HORAS, horaInicio.value).map(aOpcion))
const opcionesHoraFin = computed(() => conActual(TODAS_LAS_HORAS.filter(h => !horaInicio.value || h > horaInicio.value), horaFin.value).map(aOpcion))
// Si cambia la hora de inicio y la de fin ya no es posterior, se limpia para que la vuelvan a elegir
watch(horaInicio, v => { if (horaFin.value && v && horaFin.value <= v) horaFin.value = '' })
const resumenDias = computed(() => DIAS_SEMANA.filter(d => diasSel.value.includes(d.value)).map(d => d.value).join('-'))
const hoy = hoyISO()
const soloFecha = d => d.replace(/\//g, '-')
const opcionesInicio = d => editando.value ? true : soloFecha(d) >= hoy
const opcionesFin = d => soloFecha(d) >= hoy && (!fechaValida(form.fechaInicio) || soloFecha(d) > form.fechaInicio)

const reglasCurso = {
  nombre: [v => !!v?.trim() || 'Ingresa el nombre del curso'],
  docente: [v => !!v?.trim() || 'Ingresa el docente'],
  cupo: [
    v => (v !== '' && v !== null && !Number.isNaN(Number(v))) || 'Ingresa el cupo máximo',
    v => Number.isInteger(Number(v)) && Number(v) > 0 || 'El cupo debe ser un número entero mayor a 0',
    v => !editando.value || Number(v) >= matriculasStore.estudiantesDeCurso(editando.value).length || `El cupo no puede ser menor a los ${matriculasStore.estudiantesDeCurso(editando.value).length} estudiantes ya inscritos`,
  ],
  inicio: [
    v => !!v || 'Selecciona la fecha de inicio',
    v => fechaValida(v) || 'Fecha no válida (AAAA-MM-DD)',
    v => editando.value || v >= hoy || 'No puede ser anterior a hoy',
  ],
  fin: [
    v => !!v || 'Selecciona la fecha de fin',
    v => fechaValida(v) || 'Fecha no válida (AAAA-MM-DD)',
    v => !fechaValida(form.fechaInicio) || v > form.fechaInicio || 'Debe ser posterior a la de inicio',
    v => v >= hoy || 'No puede ser anterior a hoy',
    v => !fechaValida(form.fechaInicio) || diasEntre(form.fechaInicio, v) <= 366 || 'El curso no puede durar más de un año',
  ],
  dias: [v => v.length > 0 || 'Selecciona al menos un día de clase'],
  horaInicio: [v => !!v || 'Selecciona la hora de inicio'],
  horaFin: [
    v => !!v || 'Selecciona la hora de fin',
    v => !horaInicio.value || v > horaInicio.value || 'La hora de fin debe ser posterior a la de inicio',
  ],
}
const horarioFinal = () => construirHorario(diasSel.value, horaInicio.value, horaFin.value)

function abrirNuevo() {
  editando.value = null
  Object.assign(form, vacio())
  diasSel.value = []; horaInicio.value = ''; horaFin.value = ''
  dialogAbierto.value = true
}
function abrirEditar(c) {
  if (cursoTerminado(c)) { notificar({ type: 'warning', message: 'El curso finalizó y ya no se puede modificar.' }); return }
  editando.value = c.id
  Object.assign(form, { nombre: c.nombre, docente: c.docente, cupo: c.cupo, fechaInicio: c.fechaInicio ?? '', fechaFin: c.fechaFin ?? '' })
  const h = parsearHorario(c.horario)
  diasSel.value = h?.dias ?? []; horaInicio.value = h?.inicio ?? ''; horaFin.value = h?.fin ?? ''
  dialogAbierto.value = true
}
function guardar() {
  const ok = validarConAlerta(validarCampos([
    [form.nombre, reglasCurso.nombre], [form.docente, reglasCurso.docente], [form.cupo, reglasCurso.cupo],
    [diasSel.value, reglasCurso.dias], [horaInicio.value, reglasCurso.horaInicio], [horaFin.value, reglasCurso.horaFin],
    [form.fechaInicio, reglasCurso.inicio], [form.fechaFin, reglasCurso.fin],
  ]), editando.value ? 'No se pudo actualizar el curso' : 'No se pudo crear el curso')
  if (!ok) return
  const datos = {
    nombre: form.nombre.trim(), docente: form.docente.trim(), horario: horarioFinal(), cupo: form.cupo,
    fechaInicio: form.fechaInicio, fechaFin: form.fechaFin,
  }
  if (editando.value) {
    const r = store.editarCurso(editando.value, datos)
    if (!r.ok) { avisar({ type: 'negative', title: 'No se pudo guardar', message: r.mensaje }); dialogAbierto.value = false; return }
    notificar({ type: 'positive', message: 'Curso actualizado.' })
  } else {
    store.agregarCurso(datos)
    notificar({ type: 'positive', message: 'Curso creado.' })
    seleccionado.value ??= store.cursos.at(-1).id
  }
  dialogAbierto.value = false
}
function eliminar(c) {
  confirmar({
    title: 'Confirmar eliminación',
    message: `¿Seguro que deseas eliminar el curso "${c.nombre}"? Se eliminarán también las matrículas de ese curso.`,
  }).then(ok => {
    if (!ok) return
    store.eliminarCurso(c.id)
    matriculasStore.eliminarPorCurso(c.id)
    notificar({ type: 'warning', message: `Curso "${c.nombre}" eliminado.` })
  })
}
</script>

<style scoped>
.catalogo { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 18px; }
.curso { border: 1px solid var(--borde); border-radius: 16px; padding: 20px; display: flex; flex-direction: column; gap: 12px; background: #fff; }
.curso--sel { border-color: var(--teal); box-shadow: 0 0 0 2px var(--menta); }
.curso__cab { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
.curso__nombre { font: 700 19px/1.25 var(--fuente-titulo); color: inherit; text-decoration: none; }
.link-button { border: 0; padding: 0; background: transparent; color: var(--teal); font: inherit; font-weight: 600; cursor: pointer; text-align: left; }
.dialogo-calificaciones { min-width: 420px; max-width: 620px; }
.curso__nombre:hover { color: var(--teal); }
.curso__dato { display: flex; align-items: center; gap: 10px; font-size: 15px; }
.curso__cupo { display: flex; justify-content: space-between; font-size: 15px; margin-top: 4px; }
.curso__botones { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 6px; }
.sel-curso { max-width: 360px; }
.nota { width: 96px; }
.estado-curso { display: inline-block; margin-top: 4px; padding: 2px 10px; border-radius: 999px; font: 700 11.5px var(--fuente-texto); letter-spacing: .02em; }
.estado-curso--enCurso { background: #dcefe2; color: #166534; }
.estado-curso--porIniciar { background: #dcedf0; color: #0d5566; }
.estado-curso--finalizado { background: #e8e9e4; color: #4f5a55; }
.aviso-curso { display: flex; align-items: flex-start; gap: 12px; padding: 14px 18px; border-radius: 14px; margin-top: 16px; font-size: 14.5px; line-height: 1.5; }
.aviso-curso--warn { background: #FFF6DD; border: 1px solid #F0D58A; color: #5C4300; }
.aviso-curso--ok { background: #EFF3EF; border: 1px solid var(--borde); color: var(--tinta-suave); }
</style>
