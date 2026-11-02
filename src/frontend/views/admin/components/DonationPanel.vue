<template>
  <div id="tab-donation" class="tab-content" :class="{ active: activeTab === 'donation' }">
    <div class="settings-section donation-section">
      <div class="section-title">{{ trans.donationTitle }}</div>

      <div class="donation-content">
        <div class="donation-qr-card">
          <img
            class="donation-qr"
            src="/donate/wechat-reward.jpg"
            :alt="trans.donationQrAlt"
          >
          <div class="donation-qr-caption">{{ trans.donationWechat }}</div>
        </div>

        <div class="donation-copy">
          <p>{{ trans.donationDesc }}</p>
          <p class="donation-token"><AdminIcon name="heart" :size="16" /> {{ trans.donationToken }}</p>
          <p class="text-secondary text-sm">{{ trans.donationThanks }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import AdminIcon from './AdminIcon.vue'
defineProps({
  trans: {
    type: Object,
    required: true
  },
  activeTab: {
    type: String,
    default: ''
  }
})
</script>
