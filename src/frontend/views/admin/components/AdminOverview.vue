<template>
  <section class="admin-overview" :aria-busy="loading">
    <div class="admin-metric-grid">
      <button v-for="metric in metrics" :key="metric.label" class="admin-metric-card" @click="$emit('navigate', 'servers', metric.action)">
        <div class="admin-metric-top"><span>{{ metric.label }}</span><span class="admin-metric-icon" :class="metric.tone"><AdminIcon :name="metric.icon" :size="19" /></span></div>
        <strong>{{ loading ? '—' : metric.value }}<small v-if="!loading">{{ metric.unit }}</small></strong>
        <div class="admin-metric-caption"><span class="admin-status-dot" :class="metric.tone"></span>{{ metric.caption }}</div>
      </button>
    </div>
    <div class="admin-overview-columns">
      <section class="admin-surface admin-fleet">
        <div class="admin-section-heading"><div><h2>{{ trans.adminResourceUsage }}</h2><p>{{ trans.adminResourceDesc }}</p></div><button class="btn btn-quiet" @click="$emit('navigate', 'servers')">{{ trans.adminViewAll }}<AdminIcon name="arrow-up-right" :size="15" /></button></div>
        <div v-if="loading" class="admin-overview-skeleton" aria-hidden="true"><div v-for="row in 4" :key="row"><span></span><span></span></div></div>
        <div v-else-if="!servers.length" class="admin-empty"><AdminIcon name="server" :size="30" /><strong>{{ trans.noServers }}</strong><p>{{ trans.adminEmptyDesc }}</p><button class="btn btn-primary" @click="$emit('navigate', 'servers')"><AdminIcon name="plus" :size="16" />{{ trans.addServer }}</button></div>
        <div v-else class="admin-fleet-list">
          <div class="admin-fleet-labels"><span>{{ trans.hostname }}</span><span>CPU</span><span>{{ trans.ram }}</span><span>{{ trans.status }}</span></div>
          <div v-for="server in resourceServers" :key="server.id" class="admin-fleet-row">
            <div class="admin-fleet-name"><img v-if="server.region && server.region !== 'xx'" :src="getPublicAssetUrl(`flags/${getFlagRegionCode(server.region)}.svg`)" :alt="server.region" /><span v-else class="admin-fleet-server-icon"><AdminIcon name="server" :size="16" /></span><div><strong :title="server.name">{{ server.name }}</strong><small>{{ server.server_group || trans.default }}</small></div></div>
            <div v-for="(value, index) in [server.cpu, percent(server.ram_used, server.ram_total)]" :key="index" class="admin-mini-metric"><span>{{ server.is_online && value != null && Number.isFinite(Number(value)) ? Math.round(Number(value)) + '%' : '—' }}</span><div class="admin-meter-track"><span :class="{ warning: value >= 70, danger: value >= 90, offline: !server.is_online }" :style="{ transform: `scaleX(${server.is_online ? Math.min(100, Math.max(0, Number(value) || 0)) / 100 : 0})` }"></span></div></div>
            <span class="admin-status-badge" :class="server.is_online ? 'online' : 'offline'"><span></span>{{ server.is_online ? trans.online : trans.offline }}</span>
          </div>
        </div>
      </section>
      <section class="admin-surface admin-region-panel"><div class="admin-section-heading"><div><h2>{{ trans.adminRegions }}</h2><p>{{ loading ? '—' : regions.length }} {{ trans.adminRegionsCount }}</p></div><AdminIcon name="globe" :size="20" /></div><div v-if="loading" class="admin-overview-skeleton" aria-hidden="true"><div v-for="row in 4" :key="row"><span></span><span></span></div></div><div v-else-if="!regions.length" class="admin-empty"><AdminIcon name="globe" :size="30" /><span>{{ trans.noServers }}</span></div><div v-else class="admin-region-list"><div v-for="region in regions" :key="region.code" class="admin-region-row"><div><img v-if="region.code !== 'xx'" :src="getPublicAssetUrl(`flags/${getFlagRegionCode(region.code)}.svg`)" :alt="region.code" /><AdminIcon v-else name="globe" :size="18" /><span>{{ region.name }}</span><strong>{{ region.count }}</strong></div><div class="admin-meter-track"><span :style="{ transform: `scaleX(${region.count / servers.length})` }"></span></div></div></div></section>
    </div>
    <section class="admin-surface admin-quick-panel"><div class="admin-section-heading"><div><h2>{{ trans.adminQuickActions }}</h2><p>{{ trans.adminQuickActionsDesc }}</p></div></div><div class="admin-quick-grid"><button v-for="item in shortcuts" :key="item.id" @click="$emit('navigate', item.id, item.action)"><span class="admin-quick-icon"><AdminIcon :name="item.icon" :size="21" /></span><div><strong>{{ item.label }}</strong><small>{{ item.description }}</small></div><AdminIcon name="chevron-right" :size="16" /></button></div></section>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { currentLang } from '../../../utils/i18n'
import { getFlagRegionCode } from '../../../utils/api'
import { getPublicAssetUrl } from '../../../utils/config'
import AdminIcon from './AdminIcon.vue'
const props = defineProps({ trans: Object, servers: { type: Array, default: () => [] }, stats: Object, loading: Boolean })
defineEmits(['navigate'])
const online = computed(() => props.servers.filter(server => server.is_online))
const onlineRate = computed(() => props.servers.length ? Math.round(online.value.length / props.servers.length * 100) : 0)
const averageCpu = computed(() => online.value.length ? Math.round(online.value.reduce((sum, server) => sum + (Number(server.cpu) || 0), 0) / online.value.length) : null)
const metrics = computed(() => [
  { label: props.trans.totalServers, value: props.servers.length, icon: 'server', tone: 'neutral', caption: props.trans.adminManageNodes },
  { label: props.trans.online, value: online.value.length, icon: 'activity', action: 'online', tone: 'success', caption: props.loading ? props.trans.adminOnlineRate : `${onlineRate.value}% ${props.trans.adminOnlineRate}` },
  { label: props.trans.offline, value: props.servers.length - online.value.length, icon: 'circle', action: 'offline', tone: 'warning', caption: props.trans.adminNodeHealth },
  { label: props.trans.avgCpu, value: averageCpu.value ?? '—', unit: averageCpu.value === null ? '' : '%', icon: 'cpu', tone: 'primary', caption: props.trans.adminOnlineNodes },
])
const percent = (used, total) => Number(total) > 0 ? Number(used) / Number(total) * 100 : null
const resourceServers = computed(() => [...props.servers].sort((a, b) => Number(b.is_online) - Number(a.is_online) || Number(b.cpu || 0) - Number(a.cpu || 0)).slice(0, 7))
const regions = computed(() => {
  const counts = new Map()
  for (const server of props.servers) { const code = String(server.region || 'xx').toUpperCase(); counts.set(code, (counts.get(code) || 0) + 1) }
  let names
  try { names = new Intl.DisplayNames([currentLang.value], { type: 'region' }) } catch (_) { /* Unknown region codes retain their code. */ }
  return [...counts].map(([code, count]) => { let name = props.trans.adminUnknownRegion; try { if (code !== 'XX') name = names?.of(code) || code } catch (_) { name = code } return { code: code === 'XX' ? 'xx' : code, count, name } }).sort((a, b) => b.count - a.count)
})
const shortcuts = computed(() => [
  { id: 'servers', action: 'add', icon: 'plus', label: props.trans.addServer, description: props.trans.adminManageNodes },
  { id: 'settings', action: 'notifications', icon: 'bell', label: props.trans.notifications, description: props.trans.adminSettingsDesc },
  { id: 'themeStore', icon: 'palette', label: props.trans.themeStore, description: props.trans.adminThemesDesc },
])
</script>
