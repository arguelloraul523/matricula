<template>
  <header class="cab">
    <div class="cab__titulos">
      <nav class="migas" aria-label="Ruta"><router-link to="/">Academia</router-link> <q-icon name="chevron_right" size="16px" /> {{ seccion }}</nav>
      <h1>{{ titulo }}</h1>
      <p v-if="subtitulo">{{ subtitulo }}</p>
    </div>
    <div class="cab__acciones">
      <q-input v-model="busqueda" outlined dense clearable bg-color="white" class="cab__buscar"
        :placeholder="placeholder" :aria-label="placeholder">
        <template #prepend><q-icon name="search" /></template>
      </q-input>
      <q-btn unelevated no-caps color="primary" icon="add" :label="accion" class="cab__nuevo" @click="$emit('accion')" />
    </div>
  </header>
</template>

<script setup>
defineProps({
  seccion: String, titulo: String, subtitulo: String,
  placeholder: { type: String, default: 'Buscar...' },
  accion: String,
})
defineEmits(['accion'])
const busqueda = defineModel({ type: String, default: '' })
</script>

<style scoped>
.cab { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 20px; padding: 30px 32px 24px; border-bottom: 1px solid var(--borde); }
.migas { display: flex; align-items: center; gap: 4px; color: var(--tinta-suave); font-size: 14.5px; }
.migas a { color: var(--teal); font-weight: 600; text-decoration: none; }
.migas a:hover { text-decoration: underline; }
h1 { font: 700 clamp(28px, 4vw, 38px)/1.1 var(--fuente-titulo); margin: 10px 0 8px; letter-spacing: -.01em; }
p { margin: 0; color: var(--tinta-suave); font-size: 15.5px; max-width: 62ch; }
.cab__acciones { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.cab__buscar { width: 320px; max-width: 100%; }
.cab__buscar :deep(.q-field__control) { border-radius: 12px; height: 48px; border-radius: 12px; }
.cab__nuevo { height: 48px; padding: 0 20px; border-radius: 12px; font-size: 15px; font-weight: 700; }
@media (max-width: 640px) { .cab { padding: 20px 16px; } .cab__buscar { width: 100%; } .cab__nuevo { flex: 1; } }
</style>
