<template>
  <span v-if="!editable" :class="['insignia', 'insignia--' + estado]">{{ etiquetaEstado(estado) }}</span>
  <button v-else type="button" :class="['insignia', 'insignia--btn', 'insignia--' + estado]"
    :aria-label="`Estado: ${etiquetaEstado(estado)}. Cambiar estado`">
    {{ etiquetaEstado(estado) }}<q-icon name="expand_more" size="16px" />
    <q-menu auto-close class="menu-select" :offset="[0, 6]" transition-show="jump-down" transition-hide="jump-up">
      <div class="menu-select__titulo">Cambiar estado</div>
      <q-list style="min-width: 190px">
        <q-item v-for="e in ESTADOS_MATRICULA" :key="e" clickable :active="e === estado" :class="['estado-item', 'estado-item--' + e]" @click="$emit('cambiar', e)">
          <q-item-section avatar><span class="estado-punto" /></q-item-section>
          <q-item-section><q-item-label>{{ etiquetaEstado(e) }}</q-item-label></q-item-section>
          <q-item-section v-if="e === estado" side><q-icon name="check" color="primary" size="20px" /></q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </button>
</template>

<script setup>
import { ESTADOS_MATRICULA } from '../stores/matriculas'
import { etiquetaEstado } from '../utils/estado'

defineProps({ estado: String, editable: { type: Boolean, default: true } })
defineEmits(['cambiar'])
</script>
