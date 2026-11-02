<template>
  <div>
    <router-view />
  </div>
</template>

<script setup>
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTheme } from './composables/useTheme'

const { initTheme } = useTheme()

initTheme()
const route = useRoute()
watch(() => route.path, path => {
  document.body.classList.toggle('public-page', path !== '/admin')
}, { immediate: true })
</script>
