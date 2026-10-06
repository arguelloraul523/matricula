<template>
  <q-page class="vista">
    <header class="dash-head">
      <div>
        <nav class="migas" aria-label="Ruta">
          <router-link to="/">Academia</router-link><q-icon name="chevron_right" size="16px" /> Panorama
        </nav>
        <h1 class="dash-title">Panorama general</h1>
        <p class="dash-sub">{{ fechaHoy }} · Semestre {{ periodo.nombre }}. Un resumen de estudiantes, cupos y notas.</p>
      </div>

      <div class="dash-tools">
        <div class="search">
          <q-input v-model="busqueda" outlined dense bg-color="white" placeholder="Buscar estudiante o curso..."
            aria-label="Buscar estudiante o curso" @focus="enfocado = true" @blur="enfocado = false">
            <template #prepend><q-icon name="search" color="grey-7" /></template>
            <template #append>
              <q-icon v-if="busqueda" name="close" class="cursor-pointer" @mousedown.prevent="busqueda = ''" />
            </template>
          </q-input>
          <q-list v-if="busqueda && enfocado" class="search__drop">
            <q-item v-if="!resultados.length"><q-item-section class="text-grey-7">Sin resultados para "{{ busqueda }}"</q-item-section></q-item>
            <q-item v-for="r in resultados" :key="r.clave" clickable @mousedown.prevent="irA(r.ruta)">
              <q-item-section avatar><q-icon :name="r.icono" color="primary" /></q-item-section>
              <q-item-section>
                <q-item-label>{{ r.titulo }}</q-item-label>
                <q-item-label caption>{{ r.detalle }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
        <q-btn unelevated no-caps color="primary" icon="add" label="Nueva matrícula" class="cta" to="/matricular" />
      </div>
    </header>

    <div class="vista__cuerpo">
      <q-banner v-if="!estudiantesStore.estudiantes.length" rounded class="bg-green-1 text-primary">
        <template #avatar><q-icon name="info" color="primary" /></template>
        Aún no hay estudiantes registrados. Empieza en "Estudiantes" creando el primero.
      </q-banner>

      <section v-if="cursosSinCalificar.length" class="alerta-notas" role="alert" aria-label="Cursos con notas pendientes">
        <q-icon name="warning_amber" size="28px" class="alerta-notas__icono" />
        <div class="alerta-notas__texto">
          <strong>{{ cursosSinCalificar.length === 1 ? 'Un curso terminó' : `${cursosSinCalificar.length} cursos terminaron` }} con estudiantes sin calificar</strong>
          <ul>
            <li v-for="c in cursosSinCalificar" :key="c.id">
              <router-link :to="`/cursos/${c.id}`">{{ c.nombre }}</router-link>
              — {{ c.pendientes }} {{ c.pendientes === 1 ? 'estudiante pendiente' : 'estudiantes pendientes' }} (finalizó el {{ formatearFecha(c.fechaFin) }})
            </li>
          </ul>
        </div>
        <q-btn unelevated no-caps color="warning" text-color="dark" label="Calificar ahora" to="/cursos" />
      </section>

      <!-- 1. Resumen -->
      <section aria-labelledby="t-resumen">
        <h2 id="t-resumen" class="sec-titulo">Resumen</h2>
        <div class="kpis">
          <router-link to="/estudiantes" class="kpi">
            <q-icon name="school" size="22px" class="kpi__icono" />
            <div class="kpi__valor">{{ estudiantesActivos }}</div>
            <div class="kpi__titulo">Estudiantes activos</div>
            <div class="kpi__nota">Tienen al menos un curso en marcha. {{ estudiantesInactivos }} sin cursos activos.</div>
          </router-link>
          <router-link to="/cursos" class="kpi">
            <q-icon name="menu_book" size="22px" class="kpi__icono" />
            <div class="kpi__valor">{{ cursosDisponibles }}<span class="kpi__de"> de {{ cursosInfo.length }}</span></div>
            <div class="kpi__titulo">Cursos con cupo libre</div>
            <div class="kpi__nota">{{ cuposOcupados }} de {{ cuposTotales }} cupos ocupados en total.</div>
          </router-link>
          <router-link to="/matricular" class="kpi">
            <q-icon name="assignment_turned_in" size="22px" class="kpi__icono" />
            <div class="kpi__valor">{{ matriculasStore.totalActivas }}</div>
            <div class="kpi__titulo">Matrículas en curso</div>
            <div class="kpi__nota">{{ activasEstaSemana }} nuevas en los últimos 7 días.</div>
          </router-link>
          <div class="kpi kpi--oscuro">
            <q-icon name="grade" size="22px" class="kpi__icono" />
            <div class="kpi__valor">{{ promedio }}<span class="kpi__de"> / 5.0</span></div>
            <div class="kpi__titulo">Promedio general</div>
            <div class="kpi__nota">Promedio de todas las notas registradas.</div>
          </div>
        </div>
      </section>

      <!-- 2. Cupos y resultados -->
      <div class="dos-col">
        <section class="panel-blanco" aria-labelledby="t-cupos">
          <h2 id="t-cupos">Cupos por curso</h2>
          <p class="panel-blanco__sub">Cuántos estudiantes hay inscritos frente al cupo máximo. Toca un curso para ver su detalle.</p>
          <div v-if="!cursosInfo.length" class="vacio"><q-icon name="inbox" size="28px" /><br />Aún no hay cursos registrados.</div>
          <div v-for="c in cursosInfo" :key="c.id" class="occ">
            <div class="occ__fila">
              <router-link :to="`/cursos/${c.id}`" class="occ__nombre">{{ c.nombre }}</router-link>
              <span class="occ__datos">
                <span v-if="etiquetaCupo(c)" class="tag" :class="etiquetaCupo(c).clase">{{ etiquetaCupo(c).texto }}</span>
                {{ c.inscritos }} / {{ c.cupo }}
              </span>
            </div>
            <q-linear-progress :value="Math.min(1, c.inscritos / c.cupo)" :color="c.inscritos >= c.cupo ? 'negative' : 'primary'"
              track-color="grey-4" size="8px" rounded />
          </div>
        </section>

        <section class="panel-blanco" aria-labelledby="t-res">
          <h2 id="t-res">Resultados académicos</h2>
          <p class="panel-blanco__sub">Estado de todas las matrículas registradas.</p>
          <div class="res">
            <div class="res__item"><strong>{{ matriculasStore.totalActivas }}</strong><span>En curso</span></div>
            <div class="res__item res__item--ok"><strong>{{ matriculasStore.totalAprobadas }}</strong><span>Aprobadas</span></div>
            <div class="res__item res__item--mal"><strong>{{ matriculasStore.totalReprobadas }}</strong><span>Reprobadas</span></div>
            <div class="res__item"><strong>{{ totalRetiradas }}</strong><span>Retiradas</span></div>
          </div>

          <h3 class="mini-titulo">¿Cómo están distribuidas las notas?</h3>
          <div class="bars" role="img" :aria-label="`Distribución de notas de 0 a 5`">
            <div v-for="(t, i) in distribucionNotas" :key="i" class="bars__col">
              <div class="bars__fill" :style="{ height: t.altura + '%' }"><q-tooltip>{{ t.desde.toFixed(1) }} a {{ t.hasta.toFixed(1) }}: {{ t.cantidad }} {{ t.cantidad === 1 ? 'nota' : 'notas' }}</q-tooltip></div>
            </div>
          </div>
          <div class="bars__eje"><span>0.0</span><span>2.5</span><span>5.0</span></div>
          <p class="bars__ayuda">Cada barra agrupa las notas en rangos de 0.5. Pasa el cursor para ver cuántas hay.</p>
        </section>
      </div>

      <!-- 3. Últimas matrículas -->
      <section class="panel-blanco" aria-labelledby="t-rec">
        <div class="rec__cab">
          <div>
            <h2 id="t-rec">Últimas matrículas</h2>
            <p class="panel-blanco__sub" style="margin:0">Las 6 inscripciones más recientes.</p>
          </div>
          <q-btn flat no-caps color="primary" label="Ver todas" icon-right="arrow_forward" to="/matricular" />
        </div>
        <div v-if="!recientes.length" class="vacio">Aún no hay matrículas.</div>
        <ul class="rec">
          <li v-for="r in recientes.slice(0, 6)" :key="r.id">
            <router-link :to="`/estudiantes/${r.estudianteId}`" class="rec__item">
              <span class="avatar-mini">{{ r.iniciales }}</span>
              <span class="rec__txt"><strong>{{ r.nombre }}</strong><small>{{ r.curso }}</small></span>
              <span class="rec__cuando">{{ r.cuando }}</span>
            </router-link>
          </li>
        </ul>
      </section>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useResumen, periodoActual } from '../composables/useResumen'
import { formatearFecha } from '../utils/estado'
import { avisar } from '../utils/alertas'

const router = useRouter()
const {
  estudiantesStore, matriculasStore, cursosInfo, estudiantesActivos, estudiantesInactivos,
  cursosDisponibles, cursosPorCerrar, cursosSinCalificar, cuposTotales, cuposOcupados, activasEstaSemana,
  distribucionNotas, recientes,
} = useResumen()

const periodo = periodoActual()

// Aviso emergente (una vez por carga de la app) si hay cursos terminados sin calificar
if (cursosSinCalificar.value.length && !window.__avisoNotasMostrado) {
  window.__avisoNotasMostrado = true
  avisar({
    type: 'warning',
    title: 'Notas pendientes',
    message: `Hay ${cursosSinCalificar.value.length} curso(s) finalizado(s) con estudiantes sin calificar.`,
  })
}
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const fechaHoy = (() => {
  const h = new Date()
  const d = DIAS[h.getDay()]
  return `${d[0].toUpperCase()}${d.slice(1)} ${h.getDate()} de ${MESES[h.getMonth()]}`
})()

const promedio = computed(() => {
  const p = matriculasStore.promedioGeneral
  return p === null ? '—' : Number(p).toFixed(1)
})
const totalRetiradas = computed(() => matriculasStore.matriculas.filter(m => m.estado === 'retirado').length)

function etiquetaCupo(c) {
  if (c.inscritos >= c.cupo) return { texto: 'Lleno', clase: 'tag--full' }
  if (cursosPorCerrar.value.some(x => x.id === c.id)) return { texto: 'Pocos cupos', clase: 'tag--warn' }
  return null
}

const busqueda = ref('')
const enfocado = ref(false)
const resultados = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  if (!q) return []
  const est = estudiantesStore.estudiantes
    .filter(e => e.nombre.toLowerCase().includes(q) || String(e.documento).includes(q))
    .map(e => ({ clave: `e${e.id}`, icono: 'school', titulo: e.nombre, detalle: `Estudiante · doc. ${e.documento}`, ruta: `/estudiantes/${e.id}` }))
  const cur = cursosInfo.value
    .filter(c => c.nombre.toLowerCase().includes(q) || c.docente.toLowerCase().includes(q))
    .map(c => ({ clave: `c${c.id}`, icono: 'menu_book', titulo: c.nombre, detalle: `Curso · ${c.docente}`, ruta: `/cursos/${c.id}` }))
  return [...est, ...cur].slice(0, 6)
})
function irA(ruta) { busqueda.value = ''; router.push(ruta) }
</script>

<style scoped>
.dash-head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 20px; padding: 30px 32px 24px; border-bottom: 1px solid var(--borde); }
.migas { display: flex; align-items: center; gap: 4px; color: var(--tinta-suave); font-size: 14.5px; }
.migas a { color: var(--teal); font-weight: 600; text-decoration: none; }
.migas a:hover { text-decoration: underline; }
.dash-title { font: 700 clamp(30px, 4vw, 40px)/1.1 var(--fuente-titulo); margin: 8px 0 6px; letter-spacing: -.01em; }
.dash-sub { margin: 0; color: var(--tinta-suave); font-size: 15.5px; max-width: 62ch; }
.dash-tools { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.search { position: relative; width: 320px; max-width: 100%; }
.search :deep(.q-field__control) { border-radius: 12px; height: 48px; }
.search__drop { position: absolute; z-index: 10; left: 0; right: 0; top: 54px; background: #fff; border: 1px solid var(--borde); border-radius: 14px; box-shadow: 0 12px 30px rgba(18,48,42,.14); overflow: hidden; }
.cta { height: 48px; padding: 0 20px; border-radius: 12px; font-weight: 700; font-size: 15px; }

.sec-titulo { font: 700 22px var(--fuente-titulo); margin: 0 0 14px; }
.kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 18px; }
.kpi { display: block; background: #fff; border: 1px solid var(--borde); border-radius: 20px; padding: 22px 24px; box-shadow: var(--sombra); text-decoration: none; color: inherit; transition: transform .15s, border-color .15s; }
a.kpi:hover { transform: translateY(-2px); border-color: var(--teal); }
.kpi__icono { color: var(--teal); background: var(--menta); border-radius: 12px; padding: 10px; box-sizing: content-box; }
.kpi__valor { font: 700 42px/1 var(--fuente-titulo); margin: 20px 0 8px; }
.kpi__de { font: 500 17px var(--fuente-texto); color: var(--tinta-suave); }
.kpi__titulo { font-size: 16.5px; font-weight: 700; }
.kpi__nota { font-size: 14px; color: var(--tinta-suave); margin-top: 6px; line-height: 1.45; }
.kpi--oscuro { background: var(--noche); border-color: var(--noche); color: #fff; }
.kpi--oscuro .kpi__icono { background: rgba(255,255,255,.12); color: var(--ambar); }
.kpi--oscuro .kpi__de, .kpi--oscuro .kpi__nota { color: #E3EEE8; }
@media (max-width: 1280px) { .kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 640px) { .kpis { grid-template-columns: 1fr; } .dash-head { padding: 20px 16px; } .search { width: 100%; } }

.dos-col { display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; align-items: start; }
@media (max-width: 1100px) { .dos-col { grid-template-columns: 1fr; } }

.occ + .occ { margin-top: 20px; }
.occ__fila { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 8px; }
.occ__nombre { font-weight: 700; font-size: 16px; color: var(--tinta); text-decoration: none; }
.occ__nombre:hover { color: var(--teal); text-decoration: underline; }
.occ__datos { display: flex; align-items: center; gap: 10px; font-size: 14.5px; color: var(--tinta); font-weight: 700; white-space: nowrap; }
.tag { font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 999px; }
.tag--full { background: #F8E1DE; color: #A5281D; }
.tag--warn { background: #FBE3A0; color: #5E4004; }

.res { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.res__item { background: #EEEBE1; border-radius: 14px; padding: 14px 16px; display: flex; flex-direction: column; }
.res__item strong { font: 700 28px/1.1 var(--fuente-titulo); }
.res__item span { font-size: 14.5px; font-weight: 600; color: var(--tinta); }
.res__item--ok strong { color: #166534; }
.res__item--mal strong { color: #9b1c1c; }

.mini-titulo { font-size: 15px; font-weight: 700; margin: 26px 0 12px; }
.bars { display: flex; align-items: flex-end; gap: 6px; height: 90px; }
.bars__col { flex: 1; height: 100%; background: #E3DFD2; border-radius: 6px; display: flex; align-items: flex-end; overflow: hidden; }
.bars__fill { width: 100%; background: var(--teal); border-radius: 6px; }
.bars__eje { display: flex; justify-content: space-between; font-size: 13px; color: var(--tinta-suave); margin-top: 6px; }
.bars__ayuda { font-size: 13.5px; color: var(--tinta-suave); margin: 10px 0 0; }

.rec__cab { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 8px; }
.rec { list-style: none; margin: 0; padding: 0; }
.rec__item { display: flex; align-items: center; gap: 14px; padding: 12px 6px; border-top: 1px solid var(--borde); text-decoration: none; color: inherit; border-radius: 10px; }
.rec li:first-child .rec__item { border-top: 0; }
.rec__item:hover { background: var(--papel); }
.rec__txt { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.rec__txt strong { font-size: 15.5px; }
.rec__txt small { font-size: 14px; color: var(--tinta-suave); }
.rec__cuando { font-size: 14px; color: var(--tinta-suave); white-space: nowrap; }
.alerta-notas { display: flex; align-items: center; gap: 18px; padding: 18px 22px; border-radius: 18px; background: #FFF6DD; border: 1px solid #F0D58A; border-left: 6px solid var(--ambar); color: #5C4300; }
.alerta-notas__icono { color: #B7791F; flex: none; }
.alerta-notas__texto { flex: 1; min-width: 0; font-size: 15px; }
.alerta-notas__texto ul { margin: 6px 0 0; padding-left: 18px; }
.alerta-notas__texto a { color: inherit; font-weight: 700; }
@media (max-width: 640px) { .alerta-notas { flex-direction: column; align-items: flex-start; } }
</style>
