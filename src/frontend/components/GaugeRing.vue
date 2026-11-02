<template>
  <div class="gauge-ring-item">
    <div class="gauge-ring" :class="{ 'is-offline': value == null, 'is-animated': animate }" role="img" :aria-label="`${label}: ${value == null ? '—' : Math.round(value) + '%'}`">
      <svg viewBox="0 0 100 100" aria-hidden="true"><circle class="gauge-ring-track" cx="50" cy="50" r="43" /><circle class="gauge-ring-fill" cx="50" cy="50" r="43" pathLength="100" :style="{ stroke: tone, strokeDasharray: `${progress} 100`, opacity: value == null ? 0 : 1 }" /><template v-if="secondary != null"><circle class="gauge-ring-secondary-track" cx="50" cy="50" r="35" /><circle class="gauge-ring-secondary" cx="50" cy="50" r="35" pathLength="100" :style="{ strokeDasharray: `${secondary} 100` }" /></template></svg>
      <span class="gauge-ring-number">{{ value == null ? '—' : Math.round(value) }}<small v-if="value != null">%</small></span>
    </div>
    <strong class="gauge-ring-label">{{ label }}</strong><span v-if="subtitle" class="gauge-ring-subtitle">{{ subtitle }}</span><span v-if="secondary != null" class="gauge-ring-subtitle">Swap {{ Math.round(secondary) }}%</span>
  </div>
</template>
<script setup>
import { computed, ref, watch } from 'vue'
const props = defineProps({ value: { type: Number, default: null }, label: String, subtitle: String, secondary: { type: Number, default: null }, warning: { type: Number, default: 70 }, critical: { type: Number, default: 90 } })
const progress = computed(() => Math.min(100, Math.max(0, props.value || 0)))
const tone = computed(() => props.value >= props.critical ? 'var(--accent-red)' : props.value >= props.warning ? 'var(--accent-yellow)' : 'var(--accent-green)')
const animate = ref(false)
watch(() => props.value, (value, previous) => { animate.value = value != null && previous != null && Math.abs(value - previous) >= 4 })
</script>
