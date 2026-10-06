import Swal from 'sweetalert2'

// Todas las alertas de la app usan SweetAlert2 con el mismo tema (ver style.css)
const iconos = { positive: 'success', negative: 'error', warning: 'warning', info: 'info' }

const base = Swal.mixin({
  buttonsStyling: false,
  reverseButtons: true,
  focusCancel: true,
  customClass: {
    popup: 'swal-app',
    title: 'swal-app__titulo',
    htmlContainer: 'swal-app__texto',
    actions: 'swal-app__acciones',
    confirmButton: 'swal-app__btn swal-app__btn--ok',
    cancelButton: 'swal-app__btn swal-app__btn--cancel',
  },
})

// Notificación corta tipo "toast"
export function notificar({ type = 'info', message = '' }) {
  Swal.fire({
    icon: iconos[type] ?? 'info',
    title: message,
    toast: true,
    position: 'top-end',
    timer: 2800,
    timerProgressBar: true,
    showConfirmButton: false,
    customClass: { popup: 'swal-toast swal-toast--' + (iconos[type] ?? 'info'), title: 'swal-toast__texto' },
    didOpen: (t) => {
      t.addEventListener('mouseenter', Swal.stopTimer)
      t.addEventListener('mouseleave', Swal.resumeTimer)
    },
  })
}

// Diálogo de confirmación. Uso: confirmar({ title, message }).then(ok => { if (ok) { ... } })
export function confirmar({ title = 'Confirmar', message = '', confirmText = 'Sí, eliminar', icon = 'warning' }) {
  return base.fire({
    icon,
    title,
    text: message,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancelar',
  }).then((res) => res.isConfirmed)
}

// Mensaje informativo con un solo botón
export function avisar({ title = 'Aviso', message = '', type = 'info' }) {
  return base.fire({ icon: iconos[type] ?? 'info', title, text: message, confirmButtonText: 'Entendido' })
}

const esc = (t) => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

// Ejecuta reglas estilo Quasar ([valor, [v => true | 'mensaje', ...]]) y devuelve la lista de errores
export function validarCampos(campos) {
  const errores = []
  for (const [valor, reglas] of campos) {
    for (const regla of reglas) {
      const r = regla(valor)
      if (r !== true) { errores.push(r || 'Dato no válido'); break } // un error por campo
    }
  }
  return errores
}

// Muestra los errores de validación de un formulario. Devuelve true si no hay errores.
export function validarConAlerta(errores, titulo = 'Revisa el formulario') {
  if (!errores.length) return true
  base.fire({
    icon: 'error',
    title: titulo,
    html: `<ul class="swal-errores">${errores.map(e => `<li>${esc(e)}</li>`).join('')}</ul>`,
    confirmButtonText: 'Corregir',
    showCancelButton: false,
    focusConfirm: true,
    focusCancel: false,
  })
  return false
}
