<template>
  <article class="stat" :class="{ 'stat--anillo': anillo !== null }">
    <template v-if="anillo === null">
      <div class="stat__tope">
        <div class="stat__icono"><q-icon :name="icono" size="22px" /></div>
        <slot />
      </div>
      <div class="stat__valor">{{ valor }}</div>
      <div class="stat__etiqueta">{{ etiqueta }}</div>
      <q-linear-progress v-if="progreso !== null" :value="progreso" size="6px" rounded color="primary" track-color="grey-3" class="stat__barra" />
    </template>
    <template v-else>
      <q-circular-progress :value="Math.round(anillo * 100)" size="118px" :thickness="0.16" color="primary"
        track-color="grey-3" show-value font-size="26px" class="stat__anillo">
        <strong>{{ Math.round(anillo * 100) }}%</strong>
      </q-circular-progress>
      <div class="stat__etiqueta">{{ etiqueta }}</div>
    </template>
  </article>
</template>

<script setup>
defineProps({
  icono: { type: String, default: 'circle' },
  valor: { type: [String, Number], default: '' },
  etiqueta: String,
  progreso: { type: Number, default: null },
  anillo: { type: Number, default: null },
})
</script>

<style scoped>
.stat { background: #fff; border: 1px solid var(--borde); border-radius: 20px; padding: 22px 24px; box-shadow: var(--sombra); display: flex; flex-direction: column; }
.stat--anillo { align-items: center; justify-content: center; gap: 12px; }
.stat__tope { display: flex; justify-content: space-between; align-items: flex-start; }
.stat__icono { width: 44px; height: 44px; border-radius: 14px; background: var(--menta); color: var(--teal); display: grid; place-items: center; }
.stat__valor { font: 700 40px/1 var(--fuente-titulo); margin: 20px 0 8px; }
.stat__etiqueta { font-size: 16px; font-weight: 600; }
.stat__barra { margin-top: 16px; }
</style>
