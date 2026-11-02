<template>
  <header class="public-header">
    <router-link to="/" class="public-brand"><span class="public-brand-mark"><AppIcon name="activity" :size="23" /></span><span :title="title">{{ title }}</span></router-link>
    <div class="public-header-actions">
      <UiSelect class="public-language" :value="currentLang" :disabled="switching" :aria-label="t('language')" @change="changeLanguage"><option v-for="language in LANGUAGES" :key="language.code" :value="language.code">{{ language.nativeLabel }}</option></UiSelect>
      <div class="public-theme-control" role="group" :aria-label="t('theme')"><button v-for="item in themes" :key="item.value" :class="{ active: currentTheme === item.value }" :title="t(item.label)" :aria-label="t(item.label)" :aria-pressed="currentTheme === item.value" @click="setTheme(item.value)"><AppIcon :name="item.icon" :size="16" /></button></div>
      <a :href="isAdminPage ? '/#/' : adminHref" class="public-icon-button" :aria-label="t(isAdminPage ? 'back' : 'adminPanel')" :title="t(isAdminPage ? 'back' : 'adminPanel')"><AppIcon :name="isAdminPage ? 'external' : 'settings'" :size="18" /></a>
    </div>
  </header>
</template>
<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { LANGUAGES, t, setLanguage, currentLang } from '../utils/i18n'
import { useTheme } from '../composables/useTheme'
import { DEFAULT_SITE_TITLE } from '../utils/constants'
import { hasConfiguredApiBase } from '../utils/config'
import AppIcon from './AppIcon.vue'
import UiSelect from './UiSelect.vue'
defineProps({ title: { type: String, default: DEFAULT_SITE_TITLE } })
const { currentTheme, setTheme } = useTheme()
const themes = [{ value: 'light', label: 'themeLight', icon: 'sun' }, { value: 'dark', label: 'themeDark', icon: 'moon' }, { value: 'auto', label: 'themeAuto', icon: 'monitor' }]
const route = useRoute()
const isAdminPage = computed(() => route.path === '/admin')
const adminHref = computed(() => hasConfiguredApiBase() ? '/#/admin' : '/admin#/admin')
const switching = ref(false)
const changeLanguage = async event => { switching.value = true; try { await setLanguage(event.target.value) } finally { switching.value = false } }
</script>
