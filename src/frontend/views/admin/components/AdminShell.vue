<template>
  <div class="admin-layout">
    <button v-if="menuOpen" class="admin-backdrop" :aria-label="trans.close" @click="menuOpen = false"></button>
    <aside ref="sidebar" id="admin-sidebar" class="admin-sidebar" :class="{ 'is-open': menuOpen }" :aria-label="trans.adminPanel">
      <a class="admin-brand" href="/#/">
        <span class="admin-brand-mark"><AdminIcon name="activity" :size="23" /></span>
        <span class="admin-brand-name" :title="siteTitle">{{ siteTitle || 'CF Monitor' }}<small>{{ trans.adminPanel }}</small></span>
      </a>
      <div class="admin-workspace"><span class="admin-workspace-avatar"><AdminIcon name="cloud" /></span><div><strong>Cloudflare</strong><span>Workers · D1</span></div><span class="admin-workspace-dot"></span></div>
      <nav class="admin-nav">
        <div class="admin-nav-label">{{ trans.adminWorkspace }}</div>
        <button v-for="item in primary" :key="item.id" class="admin-nav-item" :class="{ 'is-active': activeTab === item.id }" :aria-current="activeTab === item.id ? 'page' : undefined" @click="navigate(item.id)">
          <AdminIcon :name="item.icon" /><span>{{ item.label }}</span><span v-if="item.id === 'servers'" class="admin-nav-count">{{ nodeCount ?? '—' }}</span>
        </button>
        <div class="admin-nav-label admin-nav-label-spaced">{{ trans.adminPreferences }}</div>
        <button v-for="item in secondary" :key="item.id" class="admin-nav-item" :class="{ 'is-active': activeTab === item.id }" :aria-current="activeTab === item.id ? 'page' : undefined" @click="navigate(item.id)">
          <AdminIcon :name="item.icon" /><span>{{ item.label }}</span>
        </button>
      </nav>
      <div class="admin-sidebar-bottom">
        <a href="/#/" class="admin-nav-item"><AdminIcon name="external" /><span>{{ trans.adminPublicSite }}</span></a>
        <button class="admin-nav-item" @click="$emit('logout')"><AdminIcon name="logout" /><span>{{ trans.logout }}</span></button>
        <div class="admin-sidebar-version"><span class="admin-version-dot"></span>CF-Server-Monitor <span v-if="version">v{{ version }}</span></div>
      </div>
    </aside>
    <div class="admin-main" :inert="menuOpen || undefined">
      <header class="admin-topbar">
        <div class="admin-breadcrumb">
          <button ref="menuButton" class="admin-icon-button admin-menu-button" :aria-label="trans.adminPageMenu" :aria-expanded="menuOpen" aria-controls="admin-sidebar" @click="menuOpen = !menuOpen"><AdminIcon name="menu" /></button>
          <span class="admin-breadcrumb-root">{{ trans.adminPanel }}</span><AdminIcon name="chevron-right" :size="14" /><strong>{{ current.label }}</strong>
        </div>
        <div class="admin-topbar-actions">
          <slot name="site-picker" />
          <AdminAppearanceControls :trans="trans" />
          <button class="admin-icon-button" :aria-label="trans.refresh" :title="trans.refresh" :disabled="refreshing" @click="$emit('refresh')"><AdminIcon name="refresh" :class="{ 'is-spinning': refreshing }" :size="17" /></button>
        </div>
      </header>
      <main id="admin-main-content" class="admin-page-content" tabindex="-1" :aria-busy="refreshing">
        <div class="admin-page-heading"><div><h1>{{ current.label }}</h1><p>{{ current.description }}</p></div><slot name="page-actions" /></div>
        <slot />
      </main>
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import AdminAppearanceControls from './AdminAppearanceControls.vue'
import AdminIcon from './AdminIcon.vue'

const props = defineProps({ trans: Object, activeTab: String, siteTitle: String, nodeCount: Number, version: String, refreshing: Boolean })
const emit = defineEmits(['navigate', 'logout', 'refresh'])
const menuOpen = ref(false)
const menuButton = ref(null)
const sidebar = ref(null)
const primary = computed(() => [
  { id: 'overview', icon: 'dashboard', label: props.trans.adminOverview, description: props.trans.adminOverviewDesc },
  { id: 'servers', icon: 'server', label: props.trans.servers, description: props.trans.adminNodesDesc },
  { id: 'settings', icon: 'settings', label: props.trans.settings, description: props.trans.adminSettingsDesc },
])
const secondary = computed(() => [
  { id: 'themeStore', icon: 'palette', label: props.trans.themeStore, description: props.trans.adminThemesDesc },
  { id: 'database', icon: 'database', label: props.trans.dbManagement, description: props.trans.adminDatabaseDesc },
  { id: 'donation', icon: 'heart', label: props.trans.donation, description: props.trans.donationDesc },
])
const current = computed(() => [...primary.value, ...secondary.value].find(item => item.id === props.activeTab) || primary.value[0])
const navigate = async (id) => {
  menuOpen.value = false
  emit('navigate', id)
  await nextTick()
  document.getElementById('admin-main-content')?.focus({ preventScroll: true })
}
const handleKeydown = (event) => {
  if (!menuOpen.value) return
  if (event.key === 'Escape') { menuOpen.value = false; nextTick(() => menuButton.value?.focus()) }
  if (event.key === 'Tab') {
    const items = [...sidebar.value.querySelectorAll('button, a[href]')]
    const first = items[0], last = items.at(-1)
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
  }
}
watch(menuOpen, async (open) => {
  document.body.classList.toggle('admin-menu-open', open)
  if (open) { await nextTick(); sidebar.value?.querySelector('.is-active')?.focus() }
})
const onResize = () => { if (window.innerWidth > 760) menuOpen.value = false }
window.addEventListener('resize', onResize)
window.addEventListener('keydown', handleKeydown)
onBeforeUnmount(() => { window.removeEventListener('keydown', handleKeydown); window.removeEventListener('resize', onResize); document.body.classList.remove('admin-menu-open') })
</script>
