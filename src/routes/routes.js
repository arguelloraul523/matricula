import DashboardView from "../views/DashboardView.vue"
import EstudiantesView from "../views/EstudiantesView.vue"
import EstudianteDetalle from "../views/EstudianteDetalle.vue"
import CursosView from "../views/CursosView.vue"
import CursoDetalle from "../views/CursoDetalle.vue"
import MatricularView from "../views/MatricularView.vue"
import { createRouter, createWebHashHistory } from "vue-router"

const routes = [
    { path: "/", component: DashboardView },
    { path: "/estudiantes", component: EstudiantesView },
    { path: "/estudiantes/:id", component: EstudianteDetalle, props: true },
    { path: "/cursos", component: CursosView },
    { path: "/cursos/:id", component: CursoDetalle, props: true },
    { path: "/matricular", component: MatricularView },
]

export const router = createRouter({
    routes,
    history: createWebHashHistory()
})
