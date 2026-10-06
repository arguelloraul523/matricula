// Colores consistentes para el estado de una matrícula en toda la app
export function colorEstado(estado) {
  const colores = { activo: 'blue', aprobado: 'green', reprobado: 'red', retirado: 'grey' }
  return colores[estado] ?? 'grey'
}

// El estado "activo" del store se muestra como "Inscrito"
export function etiquetaEstado(estado) {
  const t = { activo: 'Inscrito', aprobado: 'Aprobado', reprobado: 'Reprobado', retirado: 'Retirado' }
  return t[estado] ?? estado
}

export function iniciales(nombre = '') {
  const [a = '?', b = ''] = nombre.trim().split(/\s+/)
  return `${a[0]}${b[0] ?? ''}`.toUpperCase()
}

export function formatearFecha(texto) {
  return new Date(`${texto}T00:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}
