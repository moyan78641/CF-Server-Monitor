<template>
  <router-link :to="to" class="server-card server-card-ring" :class="{ 'is-offline': !isOnline }" :data-region="regionCode">
    <div class="server-card-ring-header">
      <div class="server-card-header">
        <div class="server-identity">
          <span v-if="regionCode && regionCode !== 'xx'" class="country-os-icons">
            <img class="flag-img" :src="getPublicAssetUrl('flags/' + regionCode + '.svg')" :alt="regionCode">
            <OsIcon :os="server.os" />
          </span>
          <span v-else class="country-os-icons">
            <span class="flag-fallback"><AppIcon name="globe" :size="17" /></span>
            <OsIcon :os="server.os" />
          </span>
          <span class="server-name">{{ server.name }}</span>
        </div>
        <span class="status-label" :style="{ color: statusColor, borderColor: statusColor }">{{ statusText }}</span>
      </div>
      <div class="server-meta">
        <div class="card-meta">
          <div v-if="sysConfig.show_price && priceText" class="card-meta-item"><AppIcon name="wallet" :size="13" /> {{ priceText }}</div>
          <div v-if="sysConfig.show_expire && server.expire_date" class="card-meta-item card-meta-expire">
            <AppIcon name="calendar" :size="13" /> <span :class="{ 'expired': isExpired }">{{ expireText }}</span>
            <span v-if="expireDateTitle" class="card-meta-tooltip">{{ expireDateTitle }}</span>
          </div>
        </div>
        <div class="card-badges">
          <span v-if="server.server_group" class="badge badge-group" :title="server.server_group">{{ server.server_group }}</span>
          <span v-for="(tag, index) in tagList" :key="tag" :class="['badge', 'badge-tag', tagColorClass(index)]">{{ tag }}</span>
          <span v-if="hasPublicIPv4 && hasPublicIPv6" class="badge badge-v4-v6">IPv4/6</span>
          <template v-else>
            <span v-if="hasPublicIPv4" class="badge badge-v4">IPv4</span>
            <span v-if="hasPublicIPv6" class="badge badge-v6">IPv6</span>
          </template>
        </div>
      </div>
    </div>

    <div class="server-card-ring-divider"></div>

    <div class="server-card-ring-metrics">
      <GaugeRing :value="isOnline ? cpuPercent : null" label="CPU" :subtitle="`${cpuCores} ${trans.publicCores}`" />
      <GaugeRing :value="isOnline ? ramPercent : null" :label="trans.ram" :subtitle="ramUsageText" :secondary="hasSwapData && isOnline ? swapPercent : null" />
      <GaugeRing :value="isOnline ? diskPercent : null" :label="trans.disk" :subtitle="diskUsageText" :warning="80" :critical="92" />
    </div>

    <div class="server-card-network-panel">
      <div class="server-card-network-row">
        <span class="server-card-network-label">{{ trans.networkTraffic }}</span>
        <span class="server-card-network-values">
          <span class="server-card-speed-up">↑ {{ netOutSpeed }}/s</span>
          <span class="server-card-speed-down">↓ {{ netInSpeed }}/s</span>
        </span>
      </div>
      <div class="server-card-network-row">
        <span class="server-card-network-label">{{ trans.loadAvg }}</span>
        <span class="server-card-network-values">
          <span>{{ loadAvg[0].toFixed(2) }}</span>
          <span>{{ loadAvg[1].toFixed(2) }}</span>
          <span>{{ loadAvg[2].toFixed(2) }}</span>
        </span>
      </div>
      <div class="server-card-network-row">
        <span class="server-card-network-label">{{ trans.totalTraffic }}</span>
        <span class="server-card-network-values server-card-total-values">
          <span>↑ {{ totalTx }}</span>
          <span>↓ {{ totalRx }}</span>
        </span>
      </div>
      <div v-if="sysConfig.show_tf" class="server-card-limit-section">
        <div class="server-card-limit-header">
          <span>{{ trans.monthlyTraffic }}</span>
          <span>{{ trafficLimitText }}<template v-if="trafficLimitSummary"> | {{ trafficLimitPercentText }}%</template></span>
        </div>
        <div class="server-card-limit-bar">
          <div v-if="trafficLimitSummary" class="server-card-limit-fill" :style="{ transform: `scaleX(${(Math.min(100, trafficUsagePercent)) / 100})`, background: getUsageColor(trafficUsagePercent) }"></div>
          <div v-else class="server-card-limit-fill" style="background-image: linear-gradient(to right, #00d4aa, #4da6ff, #ffb870, #f85149);"></div>
        </div>
      </div>
      <ServerLatencyPanel
        variant="ring"
        :show-three-net-details="sysConfig.show_three_net_details"
        :has-three-net-details="hasThreeNetDetails"
        :three-net-details="threeNetDetails"
        :has-ping-data="hasPingData"
        :ping-list="pingList"
        :timeout-text="trans.timeout"
        :get-ping-color="getPingColor"
        :get-loss-color="getLossColor"
        :format-ping-value="formatPingValue"
        :format-loss-value="formatLossValue"
        :is-ping-valid="isPingValid"
      />
    </div>
  </router-link>
</template>

<script setup>
import GaugeRing from './GaugeRing.vue'
import AppIcon from './AppIcon.vue'
import OsIcon from './OsIcon.vue'
import ServerLatencyPanel from './ServerLatencyPanel.vue'
import { DEFAULT_SERVER_CARD_CONFIG, useServerCardData } from '../composables/useServerCardData'

const props = defineProps({
  server: {
    type: Object,
    required: true
  },
  sysConfig: {
    type: Object,
    default: () => ({ ...DEFAULT_SERVER_CARD_CONFIG })
  },
  to: {
    type: String,
    default: ''
  }
})

const {
  trans,
  regionCode,
  statusColor,
  isOnline,
  statusText,
  cpuPercent,
  cpuCores,
  ramPercent,
  swapPercent,
  hasSwapData,
  diskPercent,
  trafficLimitSummary,
  trafficUsagePercent,
  trafficLimitPercentText,
  trafficLimitText,
  netInSpeed,
  netOutSpeed,
  totalRx,
  totalTx,
  priceText,
  expireDateTitle,
  loadAvg,
  ramUsageText,
  diskUsageText,
  getUsageColor,
  getRingStyle,
  getMemoryRingStyle,
  roundedPercent,
  isPingValid,
  getPingColor,
  getLossColor,
  formatPingValue,
  formatLossValue,
  pingList,
  hasPingData,
  threeNetDetails,
  hasThreeNetDetails,
  getPublicAssetUrl,
  tagList,
  tagColorClass,
  hasPublicIPv4,
  hasPublicIPv6,
  isExpired,
  expireText
} = useServerCardData(props)
</script>
