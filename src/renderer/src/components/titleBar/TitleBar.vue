<template>
    <div class="titlebar">
        <div style="display: flex; gap: 5px; align-items: center;">
            <button @click="showGameList">游戏</button>
            <button @click="showHelp">帮助</button>
        </div>
        <div>
            <!--菜单栏右侧-->
            <WindowControls></WindowControls>
        </div>
    </div>
</template>

<script setup>
import WindowControls from './WindowControls.vue'
import { nextTick, onMounted, ref } from 'vue';
import { menusEvent } from 'vue3-menus';
import { load } from '../../utils/nes/init';
const menus = ref({});

onMounted(async () => {
    try {
        const roms = await electron.ipcRenderer.invoke('get-roms');
        menus.value = {
            menus: [
                ...roms.map((rom) => {
                    return {
                        label: rom.slice(0, -4),
                        tip: '',
                        click: async () => {
                            const romData = await electron.ipcRenderer.invoke('get-romdata', rom);
                            load(romData)
                        }
                    }
                })
            ]
        }
    } catch (error) {
        console.log(error);
    }
})
function showGameList(event) {
    menusEvent({
        clientX: 10,
        clientY: 30,
        preventDefault: () => {
            event.preventDefault();
        }
    }, menus.value);
    nextTick(() => {
        // 查找v3-menus
        const menus = document.querySelector('.v3-menus');
        if (menus) {
            menus.addEventListener('wheel', (e) => {
                // 滚轮滑动
                if (e.deltaY > 0) {
                    // 滚轮向下滚动
                    menus.scrollTop += 15;
                } else {
                    // 滚轮向上滚动
                    menus.scrollTop -= 15;
                }
                e.preventDefault(); // 阻止滚轮事件的默认行为
                e.stopPropagation(); // 阻止事件冒泡
            }, { passive: false });
        }
    })
}

function showHelp(){
    electron.ipcRenderer.send('show-help')
}
</script>

<style scoped>
.titlebar {
    background-color: rgb(65, 65, 65);
    height: 30px;
    flex: 0 0 30px;
    color: aliceblue;
    display: flex;
    align-items: center;
    padding-left: 10px;
    display: flex;
    justify-content: space-between;
    app-region: drag;
}

.titlebar button {
    background-color: transparent;
    border: none;
    cursor: pointer;
    color: aliceblue;
    padding: 3px 10px;
    border-radius: 3px;
    user-select: none;
    app-region: no-drag;
}

.titlebar button:hover {
    background-color: rgb(255, 255, 255, 0.1);
}
</style>