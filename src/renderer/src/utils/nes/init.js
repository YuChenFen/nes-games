import jsnes from 'jsnes';

// 屏幕宽度
const SCREEN_WIDTH = 256;
// 屏幕高度
const SCREEN_HEIGHT = 240;
const FRAMEBUFFER_SIZE = SCREEN_WIDTH * SCREEN_HEIGHT;
let nes;
let animationFrameFunc;
let animationFrameId;

export function createNes(canvasId) {
    // init
    const canvas = document.getElementById(canvasId);
    canvas.width = SCREEN_WIDTH;
    canvas.height = SCREEN_HEIGHT;
    // 等比例放大到屏幕大小
    const widthScale = (window.innerWidth - 30) / SCREEN_WIDTH;
    const heightScale = (window.innerHeight - 30) / SCREEN_HEIGHT;
    const scale = Math.min(widthScale, heightScale);
    canvas.style.width = `${SCREEN_WIDTH * scale - 10}px`;
    canvas.style.height = `${SCREEN_HEIGHT * scale - 10}px`;
    window.addEventListener("resize", () => {
        const widthScale = (window.innerWidth - 30) / SCREEN_WIDTH;
        const heightScale = (window.innerHeight - 30) / SCREEN_HEIGHT;
        const scale = Math.min(widthScale, heightScale);
        canvas.style.width = `${SCREEN_WIDTH * scale - 10}px`;
        canvas.style.height = `${SCREEN_HEIGHT * scale - 10}px`;
    });
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        console.log("画布不存在");
        return;
    }
    const imageData = ctx.getImageData(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // Allocate framebuffer array.
    const buffer = new ArrayBuffer(imageData.data.length);
    const framebuffer_u8 = new Uint8ClampedArray(buffer);
    const framebuffer_u32 = new Uint32Array(buffer);

    // Setup audio.
    const AUDIO_BUFFERING = 512;
    const audioCtx = new window.AudioContext();
    const script_processor = audioCtx.createScriptProcessor(
        AUDIO_BUFFERING,
        0,
        2
    );
    script_processor.onaudioprocess = audio_callback;
    script_processor.connect(audioCtx.destination);

    const SAMPLE_COUNT = 4 * 1024;
    const SAMPLE_MASK = SAMPLE_COUNT - 1;
    const audio_samples_L = new Float32Array(SAMPLE_COUNT);
    const audio_samples_R = new Float32Array(SAMPLE_COUNT);
    let audio_write_cursor = 0;
    let audio_read_cursor = 0;

    // 初始化 NES 实例
    nes = new jsnes.NES({
        onFrame: function (frameBuffer) {
            // 将 frameBuffer 写入屏幕
            for (let i = 0; i < FRAMEBUFFER_SIZE; i++) {
                framebuffer_u32[i] = 0xff000000 | frameBuffer[i];
            }
        },
        onAudioSample: function (left, right) {
            // 播放音频样本
            audio_samples_L[audio_write_cursor] = left;
            audio_samples_R[audio_write_cursor] = right;
            audio_write_cursor = (audio_write_cursor + 1) & SAMPLE_MASK;
        }
    });

    function onAnimationFrame() {
        if (!ctx) {
            return;
        }

        animationFrameId = window.requestAnimationFrame(onAnimationFrame);

        nes.frame();
        imageData.data.set(framebuffer_u8);
        ctx.putImageData(imageData, 0, 0);
    }

    animationFrameFunc = onAnimationFrame;

    // function audio_remain() {
    //     return (audio_write_cursor - audio_read_cursor) & SAMPLE_MASK;
    // }

    function audio_callback(event) {
        const dst = event.outputBuffer;
        const len = dst.length;

        // Attempt to avoid buffer underruns.
        // if (audio_remain() < AUDIO_BUFFERING) nes.frame();

        let dst_l = dst.getChannelData(0);
        let dst_r = dst.getChannelData(1);
        for (let i = 0; i < len; i++) {
            const src_idx = (audio_read_cursor + i) & SAMPLE_MASK;
            dst_l[i] = audio_samples_L[src_idx];
            dst_r[i] = audio_samples_R[src_idx];
        }

        audio_read_cursor = (audio_read_cursor + len) & SAMPLE_MASK;
    }

    return { nes, onAnimationFrame }
}

export function load(romData) {
    // 加载ROM
    nes.loadROM(romData);
    window.cancelAnimationFrame(animationFrameId);
    animationFrameFunc();
    console.log("ROM加载成功，开始游戏");
}