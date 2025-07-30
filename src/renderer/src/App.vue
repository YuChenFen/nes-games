<script setup>
import TitleBar from './components/titleBar/TitleBar.vue';
import NesCanvas from './components/NesCanvas.vue';
</script>

<template>
  <TitleBar></TitleBar>
  <div class="main">
    <NesCanvas></NesCanvas>
  </div>
</template>

<style scoped>
.main {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #000;
}
</style>
