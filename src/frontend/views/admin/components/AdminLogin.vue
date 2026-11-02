<template>
  <div class="admin-login-page">
    <header class="admin-login-top"><a class="admin-brand" href="/#/"><span class="admin-brand-mark"><AdminIcon name="activity" :size="23" /></span><span>{{ siteTitle || 'CF Monitor' }}</span></a><AdminAppearanceControls :trans="trans" /></header>
    <main class="admin-login-main">
      <section class="admin-login-art" aria-hidden="true">
        <div class="admin-login-orbit orbit-one"></div><div class="admin-login-orbit orbit-two"></div><div class="admin-login-orbit orbit-three"></div>
        <div class="admin-login-center"><AdminIcon name="activity" :size="64" /></div>
        <span class="admin-login-satellite satellite-one"><AdminIcon name="server" :size="28" /></span><span class="admin-login-satellite satellite-two"><AdminIcon name="cloud" :size="28" /></span><span class="admin-login-satellite satellite-three"><AdminIcon name="globe" :size="24" /></span>
        <div class="admin-login-art-caption"><span>CF-Server-Monitor</span><h2>{{ trans.adminOverviewDesc }}</h2></div>
      </section>
      <section class="login-container">
        <div class="login-header"><span class="admin-login-lock"><AdminIcon name="shield" :size="24" /></span><h1 class="login-title">{{ trans.adminLogin }}</h1><p class="login-subtitle">{{ trans.enterCredentials }}</p></div>
        <form @submit.prevent="$emit('login')">
          <div v-if="isMultipleMode" class="login-form-group"><label for="admin-login-site" class="login-label">{{ trans.apiEndpoint }}</label><UiSelect id="admin-login-site" :value="selectedApiIndex" class="login-input" @change="$emit('api-index-change', Number($event.target.value))"><option v-for="(base, index) in apiBases" :key="index" :value="index">{{ base }}</option></UiSelect></div>
          <div class="login-form-group"><label for="admin-login-username" class="login-label">{{ trans.username }}</label><input id="admin-login-username" type="text" name="username" autocomplete="username" v-model="loginForm.username" required class="login-input" :placeholder="trans.username" :disabled="loginLoading"></div>
          <div class="login-form-group"><label for="admin-login-password" class="login-label">{{ trans.password }}</label><div class="password-input-wrapper"><input id="admin-login-password" :type="passwordVisible.login ? 'text' : 'password'" name="password" autocomplete="current-password" v-model="loginForm.password" required class="login-input" :disabled="loginLoading"><button type="button" class="password-toggle" :aria-label="trans.password" :aria-pressed="passwordVisible.login" @click="$emit('toggle-password', 'login')"><AdminIcon :name="passwordVisible.login ? 'eye-off' : 'eye'" :size="18" /></button></div></div>
          <div v-if="turnstileSiteKey && (turnstileLoginEnabled || (turnstileEnabled && !turnstileVerified))" class="login-form-group"><div id="admin-turnstile-container"></div></div>
          <div v-if="loginError" id="login-error" class="login-error" role="alert"><AdminIcon name="alert" :size="17" />{{ loginError }}</div>
          <button type="submit" class="login-btn" :disabled="loginLoading"><AdminIcon v-if="loginLoading" name="loader" class="is-spinning" />{{ trans.login }}<AdminIcon v-if="!loginLoading" name="arrow-up-right" :size="17" /></button>
        </form>
        <a class="admin-login-return" href="/#/"><AdminIcon name="arrow-left" :size="15" />{{ trans.adminPublicSite }}</a>
      </section>
    </main>
    <Footer />
  </div>
</template>

<script setup>
import UiSelect from '../../../components/UiSelect.vue'
import Footer from '../../../components/Footer.vue'
import AdminIcon from './AdminIcon.vue'
import AdminAppearanceControls from './AdminAppearanceControls.vue'
defineProps({
  trans: { type: Object, required: true },
  siteTitle: { type: String, default: '' },
  isMultipleMode: { type: Boolean, default: false },
  apiBases: { type: Array, default: () => [] },
  selectedApiIndex: { type: Number, default: 0 },
  loginForm: { type: Object, required: true },
  passwordVisible: { type: Object, required: true },
  loginError: { type: String, default: '' },
  loginLoading: { type: Boolean, default: false },
  turnstileSiteKey: { type: String, default: '' },
  turnstileLoginEnabled: { type: Boolean, default: false },
  turnstileEnabled: { type: Boolean, default: false },
  turnstileVerified: { type: Boolean, default: false },
})
defineEmits(['login', 'toggle-password', 'api-index-change'])
</script>
