<template>
  <div class="admin-appearance-controls">
    <div class="admin-language"><AdminIcon name="globe" :size="16" /><UiSelect :value="currentLang" :aria-label="trans.language" :disabled="switching" @change="changeLanguage"><option v-for="language in LANGUAGES" :key="language.code" :value="language.code">{{ language.nativeLabel }}</option></UiSelect></div>
    <div class="admin-theme-control" :aria-label="trans.theme" role="group"><button v-for="theme in themes" :key="theme.value" :class="{ 'is-active': currentTheme === theme.value }" :title="trans[theme.label]" :aria-label="trans[theme.label]" :aria-pressed="currentTheme === theme.value" @click="setTheme(theme.value)"><AdminIcon :name="theme.icon" :size="15" /></button></div>
  </div>
</template>

<script setup>
import UiSelect from '../../../components/UiSelect.vue'
import { ref } from 'vue'
import { LANGUAGES, currentLang, setLanguage } from '../../../utils/i18n'
import { useTheme } from '../../../composables/useTheme'
import AdminIcon from './AdminIcon.vue'
defineProps({ trans: Object })
const { currentTheme, setTheme } = useTheme()
const switching = ref(false)
const themes = [{ value: 'light', icon: 'sun', label: 'themeLight' }, { value: 'dark', icon: 'moon', label: 'themeDark' }, { value: 'auto', icon: 'monitor', label: 'themeAuto' }]
const changeLanguage = async (event) => {
  switching.value = true
  try { const changed = await setLanguage(event.target.value); if (!changed) event.target.value = currentLang.value } finally { switching.value = false }
}
</script>
