// 뽀모도로: 집중 25분 → 휴식 5분. 끝나면 물방울 알림(chime.js)과 튜브 반짝임으로 알리고 다음 단계에서 멈춰 기다린다
// 진행은 튜브가 동그랗게 찬 만큼 보여 주고(ring.js), 물소리를 켜 두면 도는 동안만 들린다
import { $, pad } from "../shared/js/dom.js";
import { setIcon } from "../shared/js/icons.js";
import { record, addSnack } from "../shared/js/records.js";
import { createWaterSound } from "./water-sound.js";
import { createChime } from "./chime.js";

const MODES = {
  focus: { label: "집중", seconds: 25 * 60, next: "rest" },
  rest: { label: "휴식", seconds: 5 * 60, next: "focus" },
};

export function startPomodoro(ring) {
  const modeEl = $("[data-mode]");
  const remainingEl = $("[data-remaining]");
  const toggleBtn = $("[data-toggle]");
  const toggleIcon = $("[data-toggle-icon]");
  const resetBtn = $("[data-reset]");
  const soundBtn = $("[data-sound]");
  const soundIcon = $("[data-sound-icon]");

  let mode = "focus";
  let leftMs = MODES[mode].seconds * 1000;
  let endAt = null; // 돌아가는 중일 때만 끝나는 시각
  let timer = null;
  let audio = null;
  let soundOn = false;

  // 소리는 버튼을 누른 뒤에만 낼 수 있어서, 처음 누를 때 만든다
  const getAudio = () => (audio ??= new AudioContext());
  const water = createWaterSound(getAudio);
  const chime = createChime(getAudio);
  const running = () => endAt !== null;

  function syncSound() {
    if (soundOn && running()) water.start();
    else water.stop();
  }

  function render() {
    const total = MODES[mode].seconds * 1000;
    const left = running() ? Math.max(0, endAt - Date.now()) : leftMs;
    const secs = Math.ceil(left / 1000);
    remainingEl.textContent = `${pad(Math.floor(secs / 60))}:${pad(secs % 60)}`;
    ring.setProgress((total - left) / total);
    modeEl.textContent = MODES[mode].label;

    const label = running() ? "멈춤" : leftMs < total ? "계속" : "시작";
    toggleBtn.setAttribute("aria-label", label);
    toggleBtn.title = label;
    setIcon(toggleIcon, running() ? "pause-small" : "play-small");
    return left;
  }

  function tick() {
    if (render() > 0) return;
    ring.flash(); // 알림 소리는 시작할 때 이 시각에 맞춰 예약해 두었다
    // 집중을 끝까지 마치면 기록하고 고양이 간식을 하나 쌓는다
    if (mode === "focus") {
      record("focus");
      addSnack();
    }
    setMode(MODES[mode].next);
  }

  function setMode(next) {
    clearInterval(timer);
    endAt = null;
    mode = next;
    leftMs = MODES[mode].seconds * 1000;
    ring.setMode(mode);
    syncSound();
    render();
  }

  toggleBtn.addEventListener("click", () => {
    getAudio();
    if (running()) {
      leftMs = Math.max(0, endAt - Date.now());
      endAt = null;
      clearInterval(timer);
      chime.cancel();
    } else {
      endAt = Date.now() + leftMs;
      timer = setInterval(tick, 250);
      chime.schedule(leftMs / 1000);
    }
    syncSound();
    render();
  });

  soundBtn.addEventListener("click", () => {
    getAudio();
    soundOn = !soundOn;
    soundBtn.setAttribute("aria-pressed", String(soundOn));
    soundBtn.title = soundOn ? "물소리 끄기" : "물소리 켜기";
    setIcon(soundIcon, soundOn ? "sound-on-small" : "sound-off-small");
    syncSound();
  });

  resetBtn.addEventListener("click", () => {
    chime.cancel();
    setMode("focus");
  });

  render();
}
