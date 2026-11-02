<template>
  <div id="tab-servers" class="tab-content" :class="{ active: activeTab === 'servers' }">
    <div class="admin-node-heading">
      <div><h2>{{ trans.servers }}<span class="admin-count-pill">{{ servers.length }}</span></h2></div>
      <div class="admin-inline-actions"><button class="btn" @click="$emit('auto-discovery-cmd')"><AdminIcon name="zap" :size="16" />{{ trans.autoAdd }}</button><button class="btn btn-primary" aria-haspopup="dialog" @click="toggleAdding"><AdminIcon name="plus" :size="17" />{{ trans.addServer }}</button></div>
    </div>
    <Teleport to=".admin-app">
    <div v-if="adding" class="modal-overlay active" @click.self="adding = false">
      <form class="modal-dialog admin-add-server-dialog" @submit.prevent="$emit('add-server')">
        <div class="modal-header"><div class="modal-title">{{ trans.addServer }}</div><button type="button" class="modal-close" :aria-label="trans.close" @click="adding = false"><AdminIcon name="x" :size="16" /></button></div>
        <div class="form-group"><label for="new-server-name" class="form-label">{{ trans.serverName }} <span class="required">*</span></label><input id="new-server-name" ref="nameInput" type="text" v-model="newServerName" required class="form-input" :placeholder="trans.serverName" autocomplete="off" /></div>
        <div class="form-group"><label for="new-server-group" class="form-label">{{ trans.group }}</label><UiSelect id="new-server-group" v-model="selectedServerGroup" class="form-select"><option v-for="group in serverGroupOptions" :key="group.value" :value="group.value">{{ group.label }}</option><option :value="CUSTOM_SERVER_GROUP_VALUE">{{ trans.custom }}</option></UiSelect><input v-if="showCustomServerGroup" v-model="newServerGroup" type="text" class="form-input mt-2" :aria-label="trans.groupName" :placeholder="trans.groupName" /></div>
        <div class="modal-footer"><button type="button" class="btn" @click="adding = false">{{ trans.cancel }}</button><button type="submit" class="btn btn-primary" :disabled="addingServer"><AdminIcon :name="addingServer ? 'loader' : 'plus'" :class="{ 'is-spinning': addingServer }" :size="16" />{{ trans.addServer }}</button></div>
      </form>
    </div>

    </Teleport>
    <div class="admin-node-filters">
      <div class="admin-search-field"><AdminIcon name="search" :size="17" /><input v-model="search" type="search" :placeholder="trans.adminSearch" :aria-label="trans.adminSearch" /></div>
      <UiSelect v-model="statusFilter" class="form-select" :aria-label="trans.status"><option value="">{{ trans.adminAllStatus }}</option><option value="online">{{ trans.online }}</option><option value="offline">{{ trans.offline }}</option></UiSelect>
      <UiSelect v-model="regionFilter" class="form-select" :aria-label="trans.region"><option value="">{{ trans.adminAllRegions }}</option><option v-for="region in regionOptions" :key="region.value" :value="region.value">{{ region.label }}</option></UiSelect>
      <UiSelect v-model="groupFilter" class="form-select" :aria-label="trans.group"><option value="">{{ trans.adminAllGroups }}</option><option v-for="group in groups.filter(Boolean)" :key="group" :value="group">{{ group }}</option></UiSelect>
      <details class="admin-column-picker"><summary class="btn"><AdminIcon name="filter" :size="16" />{{ trans.adminColumns }}<AdminIcon name="chevron-down" :size="13" /></summary><div class="admin-column-menu"><label v-for="column in optionalColumns" :key="column.key"><input type="checkbox" :checked="visibleColumns.includes(column.key)" @change="toggleColumn(column.key)" />{{ column.label }}</label></div></details>
    </div>
    <div v-if="search || statusFilter || regionFilter || groupFilter" class="admin-filter-summary"><span>{{ filteredServers.length }} / {{ servers.length }}</span><button class="btn btn-quiet" @click="clearFilters"><AdminIcon name="x" :size="14" />{{ trans.adminClearFilters }}</button></div>
    <div class="batch-actions"><span class="admin-selection-count">{{ selectedServers.length }} {{ trans.adminSelected }}</span>
      <button @click="$emit('batch-edit')" class="btn btn-blue" :disabled="selectedServers.length === 0"><AdminIcon name="edit" :size="16" /> {{ trans.batchEdit }}</button>
      <button @click="$emit('batch-delete')" class="btn btn-red" :disabled="selectedServers.length === 0"><AdminIcon name="trash" :size="16" /> {{ trans.batchDelete }}</button>
      <button @click="$emit('toggle-select-all', filteredServers.map(server => server.id))" class="btn"><AdminIcon name="check" :size="16" /> {{ trans.toggleAll }}</button>
      <button @click="$emit('refresh-cache')" class="btn" :disabled="cacheRefreshing"><AdminIcon :name="cacheRefreshing ? 'loader' : 'refresh'" :class="{ 'is-spinning': cacheRefreshing }" /> {{ trans.refreshCache }}</button>
    </div>

    <div class="table-wrapper">
      <table class="terminal-table"><caption class="admin-sr-only">{{ trans.servers }}</caption>
        <thead>
          <tr>
            <th class="table-center-cell col-width-35">
              <HelpTooltip :text="trans.dragSort" />
            </th>
            <th class="col-width-30"><input type="checkbox" id="select-all" :aria-label="trans.toggleAll" :checked="allVisibleSelected" :indeterminate="someVisibleSelected && !allVisibleSelected" @change="$emit('select-all', { checked: $event.target.checked, ids: filteredServers.map(server => server.id) })" class="checkbox-accent-green"></th>
            <th>{{ trans.hostname }}</th>
            <th v-show="visibleColumns.includes('network')">IP</th>
            <th v-show="visibleColumns.includes('group')">{{ trans.group }}</th>
            <th v-show="visibleColumns.includes('tags')">{{ trans.tags }}</th>
            <th v-show="visibleColumns.includes('note')">{{ trans.note }}</th>
            <th v-show="visibleColumns.includes('billing')">{{ trans.price }}</th>
            <th v-show="visibleColumns.includes('expiry')">{{ trans.expirationDate }}</th>
            <th v-show="visibleColumns.includes('renewal')">{{ trans.autoRenewal }}</th>
            <th v-show="visibleColumns.includes('traffic')">{{ trans.traffic }}</th>
            <th v-show="visibleColumns.includes('agent')">{{ trans.agentVersion }}</th>
            <th>{{ trans.status }}</th>
            <th>{{ trans.actions }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredServers.length === 0">
            <td colspan="14" class="empty-state"><span class="empty-icon"><AdminIcon name="server" :size="16" /></span><strong>{{ servers.length ? trans.adminNoResults : trans.noServers }}</strong><p>{{ servers.length ? trans.adminSearch : trans.adminEmptyDesc }}</p><button v-if="servers.length" class="btn" @click="clearFilters">{{ trans.adminClearFilters }}</button></td>
          </tr>
          <tr
            v-for="server in filteredServers"
            :key="server.id"
            class="server-row"
            :data-server-id="server.id"
          >
            <td
              class="drag-handle table-center-cell"
              :aria-label="trans.dragSort"
              draggable="false"
              @pointerdown="handlePointerDown($event, server.id)"
              @pointermove="handlePointerMove"
              @pointerup="handlePointerUp"
              @pointercancel="handlePointerCancel"
            ><AdminIcon name="grip" :size="16" /></td>
            <td class="table-center-cell"><input type="checkbox" :aria-label="server.name" class="server-checkbox" :value="server.id" :checked="selectedServers.includes(server.id)" @change="$emit('toggle-server', server.id)"></td>
            <td>
              <div class="server-info">
                <span v-if="server.region && server.region !== 'xx'" class="country-os-icons">
                  <img :src="getPublicAssetUrl('flags/' + getFlagRegionCode(server.region) + '.svg')" :alt="server.region" class="flag-img">
                  <OsIcon :os="server.os" />
                </span>
                <span v-else class="country-os-icons">
                  <span class="flag-fallback"><AdminIcon name="globe" :size="16" /></span>
                  <OsIcon :os="server.os" />
                </span>
                <a
                  :href="getServerDetailHref(server)"
                  class="server-name-link"
                >{{ server.name }}</a>
              </div>
            </td>
            <td v-show="visibleColumns.includes('network')">
              <div
                v-if="getServerIpRows(server).length"
                class="server-ip-list"
              >
                <span
                  v-for="ipItem in getServerIpRows(server)"
                  :key="ipItem.copyField"
                  class="server-ip-line"
                  :class="{ 'spec-copied': isSpecCopied(server, ipItem.copyField) }"
                  @click.stop="emitCopySpec(server, ipItem.copyField, ipItem.address)"
                >
                  <span class="server-ip-value">{{ ipItem.address }}</span>
                </span>
              </div>
              <span v-else>-</span>
            </td>
            <td v-show="visibleColumns.includes('group')">{{ server.server_group || trans.default }}</td>
            <td v-show="visibleColumns.includes('tags')">
              <div v-if="splitTags(server.tags).length" class="tag-list admin-tag-list">
                <span v-for="(tag, index) in splitTags(server.tags)" :key="tag" :class="['badge', 'badge-tag', tagColorClass(index)]">{{ tag }}</span>
              </div>
              <span v-else>-</span>
            </td>
            <td v-show="visibleColumns.includes('note')">
              <span
                class="note-text"
                :class="{ 'note-copied': copiedNoteServerId === server.id }"
                @click.stop="$emit('copy-note', server)"
              >{{ server.note || '-' }}</span>
            </td>
            <td v-show="visibleColumns.includes('billing')">
              <span
                class="spec-text"
                :class="{ 'spec-copied': isSpecCopied(server, 'price') }"
                @click.stop="emitCopySpec(server, 'price', formatServerPrice(server))"
              >{{ formatServerPrice(server) }}</span>
            </td>
            <td v-show="visibleColumns.includes('expiry')"><span class="date-text">{{ server.expire_date || '-' }}</span></td>
            <td v-show="visibleColumns.includes('renewal')">
              <span
                class="renewal-text"
              >{{ isServerAutoRenewal(server) ? trans.enabled : trans.disabled }}</span>
            </td>
            <td v-show="visibleColumns.includes('traffic')">
              <span
                class="spec-text"
                :class="{ 'spec-copied': isSpecCopied(server, 'traffic_limit') }"
                @click.stop="emitCopySpec(server, 'traffic_limit', server.traffic_limit ? formatBytes(server.traffic_limit * 1024 * 1024 * 1024) : '')"
              >{{ server.traffic_limit ? formatBytes(server.traffic_limit * 1024 * 1024 * 1024) : '-' }}</span>
            </td>
            <td v-show="visibleColumns.includes('agent')">
              <span
                class="spec-text"
                :class="[getAgentVersionClass(server.agent_version), { 'spec-copied': isSpecCopied(server, 'agent_version') }]"
                @click.stop="emitCopySpec(server, 'agent_version', server.agent_version)"
              >{{ server.agent_version || '—' }}</span>
            </td>
            <td>
              <span class="admin-status-badge" :class="server.is_online ? 'online' : 'offline'"><span></span>{{ server.is_online ? trans.online : trans.offline }}</span>
            </td>
            <td>
              <div class="action-group">
                <div class="action-btns">
                  <button @click="$emit('copy-cmd', server.id)" class="btn btn-icon btn-green" :aria-label="trans.installCommand" :title="trans.installCommand"><AdminIcon :name="copiedServerId === server.id ? 'check' : 'copy'" /></button>
                  <button @click="$emit('edit', server)" class="btn btn-icon btn-blue" :aria-label="trans.edit"><AdminIcon name="edit" :size="16" /></button>
                  <button @click="$emit('delete', server.id)" class="btn btn-icon btn-red" :aria-label="trans.delete"><AdminIcon name="trash" :size="16" /></button>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import UiSelect from '../../../components/UiSelect.vue'
import AdminIcon from './AdminIcon.vue'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { getFlagRegionCode, formatBytes } from '../../../utils/api'
import { getPublicAssetUrl } from '../../../utils/config'
import { currentLang } from '../../../utils/i18n'
import { detectBillingCycle, detectCurrencySymbol, getBillingCycleOption, getLocalizedOptionField, isEnabledFlag, isFreePrice, normalizeCurrency, normalizePrice } from '../../../utils/server.js'
import { filterServers } from '../serverFilters.js'
import OsIcon from '../../../components/OsIcon.vue'
import HelpTooltip from '../../../components/HelpTooltip.vue'

const props = defineProps({
  trans: { type: Object, required: true },
  servers: { type: Array, default: () => [] },
  selectedServers: { type: Array, default: () => [] },
  groups: { type: Array, default: () => ['Default'] },
  activeTab: { type: String, default: 'servers' },
  selectedApiIndex: { type: Number, default: 0 },
  latestAgentVersion: { type: String, default: '' },
  cacheRefreshing: { type: Boolean, default: false },
  addingServer: Boolean,
  copiedServerId: { type: [String, Number], default: null },
  copiedNoteServerId: { type: [String, Number], default: null },
  copiedSpecKey: { type: String, default: null }
})

const newServerName = defineModel('newServerName', { type: String, default: '' })
const newServerGroup = defineModel('newServerGroup', { type: String, default: '' })

const emit = defineEmits([
  'add-server', 'auto-discovery-cmd', 'batch-edit', 'batch-delete', 'toggle-select-all', 'refresh-cache', 'select-all',
  'drag-start', 'drop', 'toggle-server', 'copy-note',
  'copy-spec', 'copy-cmd', 'edit', 'delete'
])

const adding = ref(false)
const nameInput = ref(null)
const toggleAdding = async () => { adding.value = !adding.value; if (adding.value) { await nextTick(); nameInput.value?.focus() } }
watch(() => props.activeTab, (tab) => { if (tab !== 'servers') adding.value = false })
const search = ref('')
const statusFilter = ref('')
const regionFilter = ref('')
const groupFilter = ref('')
const filteredServers = computed(() => filterServers(props.servers, { search: search.value, status: statusFilter.value, region: regionFilter.value, group: groupFilter.value, defaultGroup: props.trans.default }))
const allVisibleSelected = computed(() => filteredServers.value.length > 0 && filteredServers.value.every(server => props.selectedServers.includes(server.id)))
const someVisibleSelected = computed(() => filteredServers.value.some(server => props.selectedServers.includes(server.id)))
const clearFilters = () => { search.value = ''; statusFilter.value = ''; regionFilter.value = ''; groupFilter.value = '' }
const regionOptions = computed(() => {
  let names
  try { names = new Intl.DisplayNames([currentLang.value], { type: 'region' }) } catch (_) {}
  return [...new Set(props.servers.map(server => String(server.region || 'xx').toUpperCase()))].sort().map(value => {
    let label = value
    try { label = value === 'XX' ? props.trans.adminUnknownRegion : names?.of(value) || value } catch (_) {}
    return { value, label }
  })
})
const visibleColumns = ref(['network', 'group', 'tags', 'billing', 'expiry', 'agent'])
const optionalColumns = computed(() => [
  { key: 'network', label: 'IP' }, { key: 'group', label: props.trans.group }, { key: 'tags', label: props.trans.tags },
  { key: 'note', label: props.trans.note }, { key: 'billing', label: props.trans.price }, { key: 'expiry', label: props.trans.expirationDate },
  { key: 'renewal', label: props.trans.autoRenewal }, { key: 'traffic', label: props.trans.traffic }, { key: 'agent', label: props.trans.agentVersion },
])
const toggleColumn = (key) => { visibleColumns.value = visibleColumns.value.includes(key) ? visibleColumns.value.filter(value => value !== key) : [...visibleColumns.value, key] }

defineExpose({
  closeAddForm: () => { adding.value = false },
  openAddForm: async () => { adding.value = true; await nextTick(); nameInput.value?.focus() },
  filterStatus: (status) => { clearFilters(); statusFilter.value = status },
})

const POINTER_DRAG_THRESHOLD = 6
const CUSTOM_SERVER_GROUP_VALUE = '__custom__'
let pointerDragState = null

const serverGroupOptions = computed(() => {
  const defaultLabel = props.trans.default || 'Default'
  const seen = new Set(['', defaultLabel])
  const options = [{ value: '', label: defaultLabel }]
  for (const group of props.groups) {
    const value = String(group || '').trim()
    if (!value || seen.has(value)) continue
    seen.add(value)
    options.push({ value, label: value })
  }
  return options
})

const manualCustomServerGroup = ref(false)
const isKnownServerGroup = (value) => serverGroupOptions.value.some(group => group.value === String(value || '').trim())

const selectedServerGroup = computed({
  get: () => {
    const currentGroup = String(newServerGroup.value || '').trim()
    if (manualCustomServerGroup.value || (!isKnownServerGroup(currentGroup) && currentGroup)) {
      return CUSTOM_SERVER_GROUP_VALUE
    }
    return currentGroup
  },
  set: (value) => {
    if (value === CUSTOM_SERVER_GROUP_VALUE) {
      manualCustomServerGroup.value = true
      if (isKnownServerGroup(newServerGroup.value)) {
        newServerGroup.value = ''
      }
      return
    }
    manualCustomServerGroup.value = false
    newServerGroup.value = value
  }
})

const showCustomServerGroup = computed(() => selectedServerGroup.value === CUSTOM_SERVER_GROUP_VALUE)

watch(
  newServerGroup,
  (value) => {
    if (!String(value || '').trim() || isKnownServerGroup(value)) {
      manualCustomServerGroup.value = false
    }
  }
)

const emitDragStart = (event, serverId) => {
  emit('drag-start', event, serverId)
}

const emitDrop = (event, serverId) => {
  emit('drop', event, serverId)
}

const getServerRow = (target) => target?.closest?.('.server-row') || null
const getServerRowAtPoint = (clientX, clientY) => {
  const element = document.elementFromPoint(clientX, clientY)
  return getServerRow(element)
}

const createDragGhost = () => {
  if (!pointerDragState?.row || pointerDragState.ghost) return
  const row = pointerDragState.row
  const rect = row.getBoundingClientRect()
  const table = row.closest('table')
  const ghost = document.createElement('div')
  ghost.className = 'server-row-drag-ghost'
  ghost.style.width = `${rect.width}px`

  const ghostTable = document.createElement('table')
  ghostTable.className = table?.className || 'terminal-table'
  const ghostBody = document.createElement('tbody')
  const rowClone = row.cloneNode(true)
  rowClone.classList.remove('dragging', 'drag-over')
  rowClone.removeAttribute('data-server-id')
  Array.from(row.children).forEach((cell, index) => {
    const cloneCell = rowClone.children[index]
    if (!cloneCell) return
    const width = cell.getBoundingClientRect().width
    cloneCell.style.width = `${width}px`
    cloneCell.style.minWidth = `${width}px`
  })
  ghostBody.appendChild(rowClone)
  ghostTable.appendChild(ghostBody)
  ghost.appendChild(ghostTable)
  document.body.appendChild(ghost)

  pointerDragState.ghost = ghost
  pointerDragState.ghostOffsetX = pointerDragState.startX - rect.left
  pointerDragState.ghostOffsetY = pointerDragState.startY - rect.top
}

const updateDragGhost = (event) => {
  if (!pointerDragState?.ghost) return
  pointerDragState.ghost.style.left = `${event.clientX - pointerDragState.ghostOffsetX}px`
  pointerDragState.ghost.style.top = `${event.clientY - pointerDragState.ghostOffsetY}px`
}

const clearPointerDragClasses = () => {
  document.querySelectorAll('.server-row.dragging, .server-row.drag-over').forEach(row => {
    row.classList.remove('dragging', 'drag-over')
  })
}

const updatePointerDragTarget = (event) => {
  if (!pointerDragState?.active) return null
  const targetRow = getServerRowAtPoint(event.clientX, event.clientY)
  const targetId = targetRow?.dataset?.serverId || ''

  if (targetId !== pointerDragState.targetId) {
    if (pointerDragState.targetRow) {
      pointerDragState.targetRow.classList.remove('drag-over')
    }
    pointerDragState.targetRow = targetRow
    pointerDragState.targetId = targetId
    if (targetRow && targetId !== pointerDragState.serverId) {
      targetRow.classList.add('drag-over')
    }
  }

  return targetRow
}

const cleanupPointerDrag = () => {
  if (pointerDragState?.handle?.releasePointerCapture && pointerDragState.pointerId !== undefined) {
    try {
      pointerDragState.handle.releasePointerCapture(pointerDragState.pointerId)
    } catch (_) {}
  }
  clearPointerDragClasses()
  pointerDragState?.ghost?.remove()
  document.body.classList.remove('server-row-drag-active')
  pointerDragState = null
}

const startPointerDrag = (event) => {
  if (!pointerDragState || pointerDragState.active) return
  pointerDragState.active = true
  pointerDragState.row?.classList.add('dragging')
  document.body.classList.add('server-row-drag-active')
  createDragGhost()
  updateDragGhost(event)
  emitDragStart(event, pointerDragState.serverId)
}

const handlePointerDown = (event, serverId) => {
  if (event.isPrimary === false) return
  if (event.pointerType === 'mouse' && event.button !== 0) return
  const row = getServerRow(event.target)
  if (!row) return
  event.preventDefault()

  pointerDragState = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    serverId: String(serverId || ''),
    row,
    handle: event.currentTarget,
    active: false,
    targetId: '',
    targetRow: null,
    ghost: null,
    ghostOffsetX: 0,
    ghostOffsetY: 0
  }

  if (event.currentTarget?.setPointerCapture) {
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch (_) {}
  }
}

const handlePointerMove = (event) => {
  if (!pointerDragState || event.pointerId !== pointerDragState.pointerId) return

  const dx = Math.abs(event.clientX - pointerDragState.startX)
  const dy = Math.abs(event.clientY - pointerDragState.startY)
  if (!pointerDragState.active && Math.max(dx, dy) >= POINTER_DRAG_THRESHOLD) {
    startPointerDrag(event)
  }
  if (!pointerDragState.active) return

  event.preventDefault()
  updateDragGhost(event)
  updatePointerDragTarget(event)
}

const handlePointerUp = (event) => {
  if (!pointerDragState || event.pointerId !== pointerDragState.pointerId) return

  if (pointerDragState.active) {
    event.preventDefault()
    const targetRow = updatePointerDragTarget(event)
    const targetId = targetRow?.dataset?.serverId || pointerDragState.targetId
    emitDrop(event, targetId || pointerDragState.serverId)
  }

  cleanupPointerDrag()
}

const handlePointerCancel = (event) => {
  if (!pointerDragState || event.pointerId !== pointerDragState.pointerId) return
  if (pointerDragState.active) {
    emitDrop(event, pointerDragState.serverId)
  }
  cleanupPointerDrag()
}

onBeforeUnmount(() => {
  cleanupPointerDrag()
})

const getSpecCopyKey = (server, field) => `${server.id}:${field}`
const isSpecCopied = (server, field) => props.copiedSpecKey === getSpecCopyKey(server, field)
const emitCopySpec = (server, field, value) => {
  const text = String(value || '').trim()
  if (!text || text === '-') return
  emit('copy-spec', {
    key: getSpecCopyKey(server, field),
    text
  })
}

const splitTags = (value) => String(value || '')
  .split(',')
  .map(tag => tag.trim())
  .filter(Boolean)
const tagColorClass = (index) => `tag-color-${index % 6}`
const normalizePublicIpValue = (value) => String(value ?? '').trim()
const isPublicIpAvailable = (value) => {
  const normalized = normalizePublicIpValue(value)
  return normalized !== '' && normalized !== '0' && normalized.toLowerCase() !== 'false'
}
const getPublicIpAddress = (value) => {
  const normalized = normalizePublicIpValue(value)
  if (!isPublicIpAvailable(normalized) || normalized === '1') return ''
  return normalized
}
const getServerIpRows = (server) => [
  { copyField: 'ip_v4', address: getPublicIpAddress(server.ip_v4) },
  { copyField: 'ip_v6', address: getPublicIpAddress(server.ip_v6) }
].filter(item => item.address)
const trimDisplayPrice = (price) => String(price || '').replace(/\.00$/, '')
const formatServerPrice = (server) => {
  const price = normalizePrice(server.price)
  if (!price) return '-'
  if (isFreePrice(price)) return props.trans.free
  const currency = normalizeCurrency(server.currency || detectCurrencySymbol(server.price))
  const option = getBillingCycleOption(detectBillingCycle(server.price) || server.billing_cycle)
  const cycleLabel = getLocalizedOptionField(option, 'shortLabel', currentLang.value)
  return `${currency}${trimDisplayPrice(price)}/${cycleLabel}`
}
const isServerAutoRenewal = (server) => isEnabledFlag(server.auto_renewal)
const normalizeVersion = (version) => String(version || '').trim()
const getAgentVersionClass = (version) => {
  const latest = normalizeVersion(props.latestAgentVersion)
  if (!latest) return ''
  return normalizeVersion(version) === latest ? 'text-green' : 'text-secondary'
}
const getServerQuery = () => props.selectedApiIndex ? `?apiIndex=${props.selectedApiIndex}` : ''
// 详情页是公开页面，走域名根路径入口 /#/server/:id
const getServerDetailHref = (server) => `/#/server/${encodeURIComponent(server.id)}${getServerQuery()}`
</script>
