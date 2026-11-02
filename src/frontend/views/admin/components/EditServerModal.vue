<template>
  <div id="editModal" class="modal-overlay" :class="{ active: show }">
    <div class="modal-dialog edit-server-modal">
      <div class="modal-header">
        <div class="modal-title">{{ currentServerName }}</div>
        <button class="modal-close" @click="$emit('close')" :aria-label="trans.close"><AdminIcon name="x" :size="16" /></button>
      </div>

      <nav class="admin-settings-tabs admin-editor-tabs" :aria-label="trans.edit"><button v-for="section in sections" :key="section.id" :class="{ 'is-active': activeSection === section.id }" :aria-pressed="activeSection === section.id" @click="activeSection = section.id"><AdminIcon :name="section.icon" :size="16" />{{ section.label }}</button></nav>
      <input type="hidden" v-model="editForm.id">

      <div v-show="activeSection === 'general'" class="form-row">
        <div class="form-group flex-1">
          <label class="form-label">{{ trans.hostnameLabel }} <span class="required">*</span></label>
          <input type="text" name="edit_name" autocomplete="off" v-model="editForm.name" class="form-input" placeholder="e.g. My Server">
        </div>

        <div class="form-group flex-1">
          <label class="form-label">{{ trans.groupName }}</label>
          <input type="text" name="edit_server_group" autocomplete="off" v-model="editForm.server_group" class="form-input" placeholder="e.g. US VPS">
        </div>
      </div>
      <div v-show="activeSection === 'general'" class="form-row">
        <div class="form-group flex-1">
          <label class="form-label">{{ trans.tags }}</label>
          <input type="text" name="edit_tags" autocomplete="off" v-model="editForm.tags" class="form-input" :placeholder="trans.tagsPlaceholder">
        </div>

        <div class="form-group flex-1">
          <label class="form-label">{{ trans.region }} CN/US/GB</label>
          <input type="text" name="edit_region" autocomplete="off" v-model.trim="editForm.region" class="form-input" :placeholder="trans.regionPlaceholder">
        </div>
      </div>

      <div v-show="activeSection === 'general'" class="form-group">
        <label class="form-label">{{ trans.note }}</label>
        <textarea name="edit_note" autocomplete="off" v-model="editForm.note" class="form-textarea" rows="2" :placeholder="trans.notePlaceholder"></textarea>
      </div>

      <div v-show="activeSection === 'billing'" class="form-row mobile-two-row">
        <div class="form-group flex-1">
          <label class="form-label">{{ trans.currency }}</label>
          <UiSelect v-model="editForm.currency" class="form-select">
            <option v-for="item in currencySelectOptions" :key="item.symbol" :value="item.symbol">{{ currencyLabel(item) }}</option>
          </UiSelect>
        </div>

        <div class="form-group flex-1">
          <label class="form-label">{{ trans.price }}</label>
          <input type="text" name="edit_price" autocomplete="off" inputmode="decimal" v-model="editForm.price" class="form-input" placeholder="40.00" @blur="normalizePriceInput">
        </div>

        <div class="form-group flex-1">
          <label class="form-label">{{ trans.billingCycle }}</label>
          <UiSelect v-model="editForm.billing_cycle" class="form-select">
            <option v-for="item in billingCycleOptions" :key="item.value" :value="item.value">{{ cycleLabel(item) }}</option>
          </UiSelect>
        </div>

        <div class="form-group flex-1">
          <label class="form-label">{{ trans.expirationDate }}</label>
          <input type="date" name="edit_expire_date" autocomplete="off" v-model="editForm.expire_date" class="form-input" @click="openDatePicker">
        </div>
      </div>

      <div v-show="activeSection === 'billing'" class="form-row mobile-two-row">
        <div class="form-group flex-1">
          <label class="form-label">{{ trans.trafficLimit }} (GB)</label>
          <input type="number" name="edit_traffic_limit" autocomplete="off" v-model="editForm.traffic_limit" class="form-input" placeholder="e.g. 1000" min="0" step="1">
        </div>
        <div class="form-group flex-1">
          <label class="form-label">{{ trans.trafficCalcType }}</label>
          <UiSelect v-model="editForm.traffic_calc_type" class="form-select">
            <option value="total">{{ trans.trafficCalcTotal }}</option>
            <option value="ul">{{ trans.trafficCalcUl }}</option>
            <option value="dl">{{ trans.trafficCalcDl }}</option>
            <option value="max">{{ trans.trafficCalcMax }}</option>
          </UiSelect>
        </div>
        <div class="form-group flex-1">
          <label class="form-label">
            {{ trans.trafficResetDay }}
            <HelpTooltip :text="trans.trafficResetDayTip" />
          </label>
          <UiSelect ref="editResetDayRef" name="edit_reset_day" v-model="editForm.reset_day" class="form-select">
            <option :value="0">0</option>
            <option v-for="day in 31" :key="day" :value="day">{{ day }}</option>
          </UiSelect>
        </div>
        <div class="form-group flex-1">
          <label class="form-label">
            {{ trans.trafficAlertPercent }} (%)
            <HelpTooltip :text="trans.trafficAlertPercentTip" />
          </label>
          <input type="number" name="edit_traffic_alert_percent" autocomplete="off" v-model="editForm.traffic_alert_percent" class="form-input" min="0" max="100" step="1">
        </div>
      </div>

      <div v-show="activeSection === 'monitoring'" class="form-row mobile-two-row">
        <div class="form-group flex-1">
          <label class="form-label">
            {{ trans.collectInterval }}
            <HelpTooltip :text="trans.collectIntervalHint" />
          </label>
          <UiSelect v-model="editForm.collect_interval" class="form-select">
            <option :value="0">0</option>
            <option :value="1">1</option>
            <option :value="2">2</option>
            <option :value="5">5</option>
            <option :value="10">10</option>
          </UiSelect>
        </div>
        <div class="form-group flex-1">
          <label class="form-label">{{ trans.reportInterval }}</label>
          <UiSelect v-model="editForm.report_interval" class="form-select">
            <option :value="30">30</option>
            <option :value="60">60</option>
            <option :value="120">120</option>
            <option :value="180">180</option>
          </UiSelect>
        </div>
        <div class="form-group flex-1">
          <label class="form-label">
            {{ trans.connectionMode }}
            <HelpTooltip v-if="!isWssReportEnabled" :text="trans.wssReportDisabledConnectionHint" />
          </label>
          <UiSelect v-model="editForm.connection_mode" class="form-select" :disabled="!isWssReportEnabled">
            <option value="auto">{{ trans.connectionModeAuto }}</option>
            <option value="http">{{ trans.connectionModeHttp }}</option>
          </UiSelect>
        </div>
        <div v-if="isWssReportEnabled && editForm.connection_mode === 'auto'" class="form-group flex-1">
          <label class="form-label">{{ trans.wssReportInterval }}</label>
          <UiSelect v-model="editForm.wss_report_interval" class="form-select">
            <option v-for="second in 5" :key="second" :value="second">{{ second }}</option>
          </UiSelect>
        </div>
      </div>

      <div v-show="activeSection === 'monitoring'" class="form-row mobile-two-row">
        <div class="form-group flex-1">
          <label class="form-label">
            {{ trans.pingMode }}
            <HelpTooltip :text="trans.pingModeIcmpRootHint" />
          </label>
          <UiSelect v-model="editForm.ping_mode" class="form-select">
            <option value="tcp">TCP</option>
            <option value="icmp">ICMP (root)</option>
          </UiSelect>
        </div>
        <div class="form-group flex-1">
          <label class="form-label">
            {{ trans.networkInterface }}
            <HelpTooltip :text="trans.networkInterfaceHint" />
          </label>
          <input type="text" name="edit_interface" autocomplete="off" v-model.trim="editForm.interface" class="form-input" placeholder="eth0">
        </div>
        <div class="form-group flex-1">
          <label class="form-label">
            {{ trans.rxCorrection }} (GB)
            <HelpTooltip :text="trans.correctionHint" />
          </label>
          <input type="number" name="edit_rx_correction" autocomplete="off" v-model="editForm.rx_correction" class="form-input" placeholder="0" min="0" step="0.1">
        </div>
        <div class="form-group flex-1">
          <label class="form-label">
            {{ trans.txCorrection }} (GB)
            <HelpTooltip :text="trans.correctionHint" />
          </label>
          <input type="number" name="edit_tx_correction" autocomplete="off" v-model="editForm.tx_correction" class="form-input" placeholder="0" min="0" step="0.1">
        </div>
      </div>

      <div v-show="activeSection === 'monitoring'" class="form-row">
        <div class="form-group flex-1">
          <label class="form-label">
            {{ settings.custom_ct_name || trans.customCt }}
            <HelpTooltip :text="trans.pingNodeTip" />
          </label>
          <input type="text" name="edit_custom_ct" autocomplete="off" v-model.trim="editForm.custom_ct" :class="['form-input', { 'input-invalid': pingNodeErrors.custom_ct }]" :placeholder="settings.custom_ct || 'gd-ct-dualstack.ip.zstaticcdn.com'">
          <p v-if="pingNodeErrors.custom_ct" class="text-red text-sm mt-1">{{ pingNodeErrors.custom_ct }}</p>
        </div>
        <div class="form-group flex-1">
          <label class="form-label">
            {{ settings.custom_cu_name || trans.customCu }}
            <HelpTooltip :text="trans.pingNodeTip" />
          </label>
          <input type="text" name="edit_custom_cu" autocomplete="off" v-model.trim="editForm.custom_cu" :class="['form-input', { 'input-invalid': pingNodeErrors.custom_cu }]" :placeholder="settings.custom_cu || 'gd-cu-dualstack.ip.zstaticcdn.com'">
          <p v-if="pingNodeErrors.custom_cu" class="text-red text-sm mt-1">{{ pingNodeErrors.custom_cu }}</p>
        </div>
      </div>
      <div v-show="activeSection === 'monitoring'" class="form-row">
        <div class="form-group flex-1">
          <label class="form-label">
            {{ settings.custom_cm_name || trans.customCm }}
            <HelpTooltip :text="trans.pingNodeTip" />
          </label>
          <input type="text" name="edit_custom_cm" autocomplete="off" v-model.trim="editForm.custom_cm" :class="['form-input', { 'input-invalid': pingNodeErrors.custom_cm }]" :placeholder="settings.custom_cm || 'gd-cm-dualstack.ip.zstaticcdn.com'">
          <p v-if="pingNodeErrors.custom_cm" class="text-red text-sm mt-1">{{ pingNodeErrors.custom_cm }}</p>
        </div>
        <div class="form-group flex-1">
          <label class="form-label">
            {{ settings.custom_bd_name || trans.customBd }}
            <HelpTooltip :text="trans.pingNodeTip" />
          </label>
          <input type="text" name="edit_custom_bd" autocomplete="off" v-model.trim="editForm.custom_bd" :class="['form-input', { 'input-invalid': pingNodeErrors.custom_bd }]" :placeholder="settings.custom_bd || 'ip.zstaticcdn.com'">
          <p v-if="pingNodeErrors.custom_bd" class="text-red text-sm mt-1">{{ pingNodeErrors.custom_bd }}</p>
        </div>
      </div>
      <div v-show="activeSection === 'monitoring'" class="form-row">
        <div v-for="(field, index) in ['node_1', 'node_2']" :key="field" class="form-group flex-1">
          <label class="form-label">
            {{ settings[`${field}_name`] || `Node ${index + 1}` }}
            <HelpTooltip :text="trans.pingNodeTip" />
          </label>
          <input type="text" :name="`edit_${field}`" autocomplete="off" v-model.trim="editForm[field]" :class="['form-input', { 'input-invalid': pingNodeErrors[field] }]" :placeholder="settings[field] || 'host[:port] / [IPv6]:port'">
          <p v-if="pingNodeErrors[field]" class="text-red text-sm mt-1">{{ pingNodeErrors[field] }}</p>
        </div>
      </div>
      <div v-show="activeSection === 'monitoring'" class="form-row">
        <div v-for="(field, index) in ['node_3', 'node_4']" :key="field" class="form-group flex-1">
          <label class="form-label">
            {{ settings[`${field}_name`] || `Node ${index + 3}` }}
            <HelpTooltip :text="trans.pingNodeTip" />
          </label>
          <input type="text" :name="`edit_${field}`" autocomplete="off" v-model.trim="editForm[field]" :class="['form-input', { 'input-invalid': pingNodeErrors[field] }]" :placeholder="settings[field] || 'host[:port] / [IPv6]:port'">
          <p v-if="pingNodeErrors[field]" class="text-red text-sm mt-1">{{ pingNodeErrors[field] }}</p>
        </div>
      </div>
      <div class="form-row">
        <div v-show="activeSection === 'billing'" class="form-group flex-1">
          <div class="checkbox-item no-margin">
            <input id="edit_auto_renewal" type="checkbox" v-model="editForm.auto_renewal">
            <label for="edit_auto_renewal">
              <b>{{ trans.autoRenewal }}</b>
            </label>
          </div>
        </div>

        <div v-show="activeSection === 'monitoring'" class="form-group">
          <div class="checkbox-item no-margin">
            <input id="edit_auto_update" type="checkbox" :checked="editForm.auto_update" @change="handleAutoUpdateChange">
            <label for="edit_auto_update">
              <b>{{ trans.autoUpdate }}</b>
            </label>
          </div>
        </div>

        <div v-show="activeSection === 'general'" class="form-group">
          <div class="checkbox-item no-margin">
            <input id="edit_is_hidden" type="checkbox" v-model="editForm.is_hidden">
            <label for="edit_is_hidden">
              <b>{{ trans.hideFromPublic }}</b>
            </label>
          </div>
        </div>

        <div v-show="activeSection === 'monitoring'" v-if="hasNodeNotificationOptions" class="form-group">
          <div class="checkbox-item no-margin">
            <input id="edit_offline_notify_disabled" type="checkbox" v-model="editForm.offline_notify_disabled">
            <label for="edit_offline_notify_disabled">
              <b>{{ trans.disableOfflineNotify }}</b>
            </label>
          </div>
        </div>
      </div>
      <button v-if="hasPingNodeErrors && activeSection !== 'monitoring'" class="btn btn-red" @click="activeSection = 'monitoring'">{{ trans.invalidPingNodeFormat }}</button>
      <div class="modal-footer flex-justify-between">
        <button @click="$emit('save')" class="btn btn-primary" :disabled="hasPingNodeErrors">{{ trans.save }}</button>
        <button @click="$emit('close')" class="btn">{{ trans.cancel }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import UiSelect from '../../../components/UiSelect.vue'
import AdminIcon from './AdminIcon.vue'
import { computed, ref, watch } from 'vue'
import HelpTooltip from '../../../components/HelpTooltip.vue'
import { PING_NODE_FIELDS, validatePingNode } from '../../../utils/pingNode.js'
import { currentLang } from '../../../utils/i18n.js'
import { BILLING_CYCLES, CURRENCY_OPTIONS, getLocalizedOptionField, normalizePrice, renewExpireDateIfNeeded } from '../../../utils/server.js'

const editForm = defineModel('editForm', { type: Object, required: true })

const props = defineProps({
  trans: { type: Object, required: true },
  show: { type: Boolean, default: false },
  currentServerName: { type: String, default: '' },
  settings: { type: Object, required: true }
})

const activeSection = ref('general')
const sections = computed(() => [
  { id: 'general', label: props.trans.basicInfo, icon: 'server' },
  { id: 'billing', label: props.trans.billing, icon: 'database' },
  { id: 'monitoring', label: props.trans.adminMonitoring, icon: 'activity' },
])
watch(() => props.show, (show) => { if (show) activeSection.value = 'general' })

const pingNodeErrorMessage = computed(() => (
  props.trans.invalidPingNodeFormat || 'Use domain, IPv4, or host:port. Port must be 1-65535.'
))

const pingNodeErrors = computed(() => Object.fromEntries(
  PING_NODE_FIELDS.map(field => [
    field,
    validatePingNode(editForm.value[field]).valid ? '' : pingNodeErrorMessage.value
  ])
))

const hasPingNodeErrors = computed(() => Object.values(pingNodeErrors.value).some(Boolean))

const billingCycleOptions = BILLING_CYCLES
const currencyOptions = CURRENCY_OPTIONS
const currencySelectOptions = computed(() => {
  const currentCurrency = String(editForm.value.currency || '').trim()
  if (!currentCurrency || currencyOptions.some(item => item.symbol === currentCurrency)) {
    return currencyOptions
  }
  return [
    { symbol: currentCurrency, nameZh: currentCurrency, nameEn: currentCurrency },
    ...currencyOptions
  ]
})

const cycleLabel = (item) => getLocalizedOptionField(item, 'label', currentLang.value)
const currencyLabel = (item) => `${item.symbol} ${getLocalizedOptionField(item, 'name', currentLang.value)}`

const normalizeTgNotifySetting = (value) => {
  if (value === true || value === 'true') return '5'
  if (value === false || value === 'false' || value === undefined || value === null || value === '') return '0'

  const minutes = Number(value)
  if (Number.isInteger(minutes) && (minutes === 0 || (minutes >= 2 && minutes <= 30))) {
    return String(minutes)
  }

  return '0'
}

const isOfflineNotifyEnabled = computed(() => normalizeTgNotifySetting(props.settings.tg_notify) !== '0')
const hasNodeNotificationOptions = computed(() => (
  !!props.settings.tg_bot_token &&
  isOfflineNotifyEnabled.value
))
const isWssReportEnabled = computed(() => props.settings.wss_report_enabled === true)

const normalizePriceInput = () => {
  editForm.value.price = normalizePrice(editForm.value.price)
}

const openDatePicker = (event) => {
  const input = event?.currentTarget
  if (typeof input?.showPicker !== 'function') return
  try {
    input.showPicker()
  } catch (_) {}
}

watch(
  () => [editForm.value.auto_renewal, editForm.value.billing_cycle, editForm.value.expire_date],
  () => {
    if (!editForm.value.auto_renewal) return
    const renewal = renewExpireDateIfNeeded(
      editForm.value.expire_date,
      editForm.value.billing_cycle,
      editForm.value.auto_renewal
    )
    if (renewal.renewed) {
      editForm.value.expire_date = renewal.expire_date
    }
  }
)

watch(
  isWssReportEnabled,
  (enabled) => {
    if (!enabled) {
      editForm.value.connection_mode = 'http'
    }
  },
  { immediate: true }
)

const emit = defineEmits(['save', 'close', 'toggle-auto-update'])

const handleAutoUpdateChange = (event) => {
  const nextValue = event.target.checked
  if (nextValue) {
    event.target.checked = false
  }
  emit('toggle-auto-update', nextValue)
}
</script>
