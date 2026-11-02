<template><AppIcon :name="name" :size="size" /></template>
<script setup>
import AppIcon from '../../../components/AppIcon.vue'
defineProps({ name: { type: String, default: 'server' }, size: { type: Number, default: 18 } })
</script>
