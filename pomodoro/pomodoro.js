// 뽀모도로: 집중 25분 → 휴식 5분. 끝나면 짧게 울리고 다음 단계에서 멈춰 기다린다
import { $, pad } from "../shared/js/dom.js";

const MODES = {
  focus: { label: "집중", seconds: 25 * 60, next: "rest" },
  rest: { label: "휴식", seconds: 5 * 60, next: "focus" },
};

export function startPomodoro() {
  const modeEl = $("[data-mode]");
  const remainingEl = $("[data-remaining]");
  const progressEl = $("[data-progress]");
  const toggleBtn = $("[data-toggle]");
  const resetBtn = $("[data-reset]");

  let mode = "focus";
  let leftMs = MODES[mode].seconds * 1000;
  let endAt = null; // 돌아가는 중일 때만 끝나는 시각
  let timer = null;
  let audio = null;

  const running = () => endAt !== null;

  function render() {
    const total = MODES[mode].seconds * 1000;
    const left = running() ? Math.max(0, endAt - Date.now()) : leftMs;
    const secs = Math.ceil(left / 1000);
    remainingEl.textContent = `${pad(Math.floor(secs / 60))}:${pad(secs % 60)}`;
    progressEl.style.width = `${((total - left) / total) * 100}%`;
    modeEl.textContent = MODES[mode].label;
    toggleBtn.textContent = running() ? "멈춤" : leftMs < total ? "계속" : "시작";
    return left;
  }

  function tick() {
    if (render() > 0) return;
    chime();
    setMode(MODES[mode].next);
  }

  function setMode(next) {
    clearInterval(timer);
    endAt = null;
    mode = next;
    leftMs = MODES[mode].seconds * 1000;
    render();
  }

  // 8비트 느낌의 두 음 알림 (버튼을 누른 뒤에만 소리를 낼 수 있다)
  function chime() {
    if (!audio) return;
    [880, 1320].forEach((freq, i) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      const start = audio.currentTime + i * 0.18;
      osc.type = "square";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.08, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);
      osc.connect(gain).connect(audio.destination);
      osc.start(start);
      osc.stop(start + 0.16);
    });
  }

  toggleBtn.addEventListener("click", () => {
    audio ??= new AudioContext();
    if (running()) {
      leftMs = Math.max(0, endAt - Date.now());
      endAt = null;
      clearInterval(timer);
    } else {
      endAt = Date.now() + leftMs;
      timer = setInterval(tick, 250);
    }
    render();
  });

  resetBtn.addEventListener("click", () => setMode("focus"));

  render();
}
