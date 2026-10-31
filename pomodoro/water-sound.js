// 물소리: 파일 없이 브라우저가 만든다. 잔잔한 물결(걸러 낸 잡음) + 가끔 똑 떨어지는 물방울
const VOLUME = 0.5;
const FADE_S = 0.8;
const NOISE_S = 4; // 반복할 잡음 길이

// 낮게 웅웅거리는 잡음(브라운 노이즈)을 한 번 만들어 둔다
function noiseBuffer(ctx) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * NOISE_S, ctx.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = last * 3.5;
  }
  return buf;
}

export function createWaterSound(getContext) {
  let master = null;
  let sources = [];
  let dripTimer = null;
  let buffer = null;

  // 물방울: 높은 음이 빠르게 내려가는 짧은 소리
  function drip(ctx) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(900 + Math.random() * 500, t);
    osc.frequency.exponentialRampToValueAtTime(280, t + 0.12);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(gain).connect(master);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  function scheduleDrip(ctx) {
    dripTimer = setTimeout(() => {
      drip(ctx);
      scheduleDrip(ctx);
    }, 1500 + Math.random() * 3500);
  }

  function start() {
    if (master) return;
    const ctx = getContext();
    ctx.resume();
    buffer ??= noiseBuffer(ctx);

    master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(VOLUME, ctx.currentTime + FADE_S);
    master.connect(ctx.destination);

    // 물결: 낮은 소리만 남긴 잡음을 느리게 커졌다 작아지게 한다
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 600;
    const swell = ctx.createGain();
    swell.gain.value = 0.6;
    const wave = ctx.createOscillator();
    wave.frequency.value = 0.15;
    const waveDepth = ctx.createGain();
    waveDepth.gain.value = 0.3;
    wave.connect(waveDepth).connect(swell.gain);
    noise.connect(lowpass).connect(swell).connect(master);
    noise.start();
    wave.start();
    sources = [noise, wave];
    scheduleDrip(ctx);
  }

  function stop() {
    if (!master) return;
    const ctx = getContext();
    const fading = master;
    clearTimeout(dripTimer);
    fading.gain.setValueAtTime(fading.gain.value, ctx.currentTime);
    fading.gain.linearRampToValueAtTime(0, ctx.currentTime + FADE_S);
    sources.forEach((s) => s.stop(ctx.currentTime + FADE_S));
    setTimeout(() => fading.disconnect(), FADE_S * 1000 + 100);
    master = null;
    sources = [];
  }

  return { start, stop };
}
