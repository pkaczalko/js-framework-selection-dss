<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
</script>

<template>
  <AppHeader />
  <RouterView />
  <AppFooter />
</template>

<style>
#app {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 100vh;
}
</style>
