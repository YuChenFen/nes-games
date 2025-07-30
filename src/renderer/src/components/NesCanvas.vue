<template>
    <canvas id="nes-canvas"></canvas>
</template>

<script setup>
import { onMounted } from 'vue';
import { createNes } from '../utils/nes/init'
import { bindKeyboard } from '../utils/nes/keyboard';

onMounted(() => {
    const { nes, onAnimationFrame } = createNes("nes-canvas");
    bindKeyboard(nes);
})
</script>

<style scoped></style>