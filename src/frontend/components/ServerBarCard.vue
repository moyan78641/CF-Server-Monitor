<template>
  <router-link :to="to" class="server-card" :class="{ 'is-offline': !isOnline }" :data-region="regionCode">
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
    <div class="server-stats">
      <div class="stat-row">
        <span class="stat-key">CPU</span>
        <div class="stat-content stat-content-meter">
          <div class="stat-bar-container">
            <div class="stat-bar-fill" :style="{ transform: `scaleX(${(cpuPercent) / 100})`, background: getUsageColor(cpuPercent) }"></div>
          </div>
          <span class="stat-value">{{ cpuPercent.toFixed(2) }}%</span>
        </div>
      </div>
      <div class="stat-row">
        <span class="stat-key">RAM</span>
        <div class="stat-content stat-content-meter">
          <div class="stat-bar-container">
            <div class="stat-bar-fill" :style="{ transform: `scaleX(${(ramPercent) / 100})`, background: getUsageColor(ramPercent) }"></div>
          </div>
          <span class="stat-value">{{ ramPercent.toFixed(2) }}%</span>
        </div>
      </div>
      <div class="stat-row">
        <span class="stat-key">DISK</span>
        <div class="stat-content stat-content-meter">
          <div class="stat-bar-container">
            <div class="stat-bar-fill" :style="{ transform: `scaleX(${(diskPercent) / 100})`, background: getUsageColor(diskPercent) }"></div>
          </div>
          <span class="stat-value">{{ diskPercent.toFixed(2) }}%</span>
        </div>
      </div>
      <div class="stat-row" v-if="sysConfig.show_tf">
        <span class="stat-key">USE</span>
        <div class="stat-content stat-content-meter">
          <template v-if="server.traffic_limit">
            <div class="stat-bar-container">
              <div class="stat-bar-fill" :style="{ transform: `scaleX(${(Math.min(100, trafficUsagePercent)) / 100})`, background: getUsageColor(trafficUsagePercent) }"></div>
            </div>
            <span class="stat-value">{{ trafficUsagePercentText }}%</span>
          </template>
          <template v-else>
            <div class="stat-bar-container">
              <div class="stat-bar-fill" style="background-image: linear-gradient(to right, #00d4aa, #4da6ff, #ffb870, #f85149);"></div>
            </div>
            <span class="stat-value" style="font-size: 2em;line-height: 0;">∞</span>
          </template>
        </div>
      </div>
      <div class="stat-row">
        <span class="stat-key">LOAD</span>
        <div class="stat-content">
          <span class="net-down">{{ loadAvg[0].toFixed(2) }}</span>
          <span>{{ loadAvg[1].toFixed(2) }}</span>
          <span class="net-up">{{ loadAvg[2].toFixed(2) }}</span>
        </div>
      </div>
      <div class="stat-row">
        <span class="stat-key">NET</span>
        <div class="stat-content">
          <span class="net-down">▼ {{ netInSpeed }}/s</span>
          <span class="net-up">▲ {{ netOutSpeed }}/s</span>
        </div>
      </div>
      <div class="stat-row">
        <span class="stat-key">TRF</span>
        <div class="stat-content">
          <span class="net-down">▼ {{ totalRxMonthly }}</span>
          <span class="net-up">▲ {{ totalTxMonthly }}</span>
          <span v-if="sysConfig.show_tf && server.traffic_limit" class="stat-limit">/ <AppIcon name="network" :size="12" /> {{ formatBytes(server.traffic_limit * 1024 * 1024 * 1024) }}</span>
        </div>
      </div>
    </div>
    <div class="server-space"></div>
    <ServerLatencyPanel
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
  </router-link>
</template>

<script setup>
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
  ramPercent,
  diskPercent,
  trafficUsagePercent,
  trafficUsagePercentText,
  getUsageColor,
  tagList,
  tagColorClass,
  hasPublicIPv4,
  hasPublicIPv6,
  netInSpeed,
  netOutSpeed,
  totalRxMonthly,
  totalTxMonthly,
  priceText,
  expireDateTitle,
  loadAvg,
  isExpired,
  expireText,
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
  formatBytes
} = useServerCardData(props)
</script>
