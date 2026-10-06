<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="mobile-bar lt-md">
      <q-toolbar>
        <q-btn dense flat round icon="menu" aria-label="Abrir menú" @click="drawer = !drawer" />
        <q-toolbar-title class="text-weight-bold"><router-link to="/">Academia Andina</router-link></q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="drawer" show-if-above :width="272" :breakpoint="1024" class="app-drawer bg-dark" content-class="bg-dark">
      <router-link to="/" class="brand" aria-label="Ir al panorama">
        <span class="brand__logo">A</span>
        <div>
          <div class="brand__name">Academia Andina</div>
          <div class="brand__sub">Sistema de matrícula</div>
        </div>
      </router-link>

      <div class="periodo">
        <div class="periodo__title">Semestre {{ periodo.nombre }}</div>
        <div class="periodo__sub">Semana {{ periodo.semana }} en curso</div>
      </div>

      <div class="nav-label">Menú</div>
      <q-list class="nav-list" role="navigation">
        <q-item v-for="item in menu" :key="item.to" clickable v-ripple :to="item.to" :exact="item.exact" class="nav-item">
          <q-item-section avatar><q-icon :name="item.icono" size="22px" /></q-item-section>
          <q-item-section>{{ item.label }}</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import { periodoActual } from './composables/useResumen'

const drawer = ref(false)
const periodo = periodoActual()
const menu = [
  { label: 'Panorama', to: '/', exact: true, icono: 'space_dashboard' },
  { label: 'Estudiantes', to: '/estudiantes', icono: 'school' },
  { label: 'Cursos', to: '/cursos', icono: 'menu_book' },
  { label: 'Matrículas', to: '/matricular', icono: 'assignment_turned_in' },
]
</script>
