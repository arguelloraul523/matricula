# Academia Andina · Sistema de matrícula

Frontend con **Vue 3 + Quasar + Vue Router + Pinia** (+ `pinia-plugin-persistedstate`).

## Vistas
- **Panorama** (`/`): resumen de estudiantes, cupos, notas y últimas matrículas.
- **Estudiantes** (`/estudiantes`, `/estudiantes/:id`): CRUD, historial y promedio.
- **Cursos** (`/cursos`, `/cursos/:id`): CRUD, cupos y registro de calificaciones.
- **Matrículas** (`/matricular`): inscribir (valida duplicados y cupo), cambiar estado, eliminar.

## Ejecutar
`npm install && npm run dev`
