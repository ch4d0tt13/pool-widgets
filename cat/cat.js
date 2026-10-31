// 고양이 키우기: 간식·쓰다듬기·물장구로 배부름과 기분을 채운다. 시간이 지나면 조금씩 줄어든다
// 간식은 뽀모도로에서 집중을 끝낼 때마다 하나씩 생긴다 (records.js)
// 기록은 이 기기의 브라우저에만 저장된다 (기기마다 따로)
import { $, el, showText } from "../shared/js/dom.js";
import { drawSprite } from "../shared/js/sprite.js";
import { CAT, CAT_HAPPY, setIcon } from "../shared/js/icons.js";
import { snacks, useSnack } from "../shared/js/records.js";
import { onAnnounce } from "../shared/js/live.js";

const STORE_KEY = "pool-widgets:cat";
const MAX = 3;
const HOUR_MS = 60 * 60 * 1000;
const DECAY_MS = { full: 2.5 * HOUR_MS, mood: 3 * HOUR_MS }; // 한 칸 줄어드는 데 걸리는 시간
const REACT_MS = 1600; // 반응(행복한 얼굴·말풍선)이 보이는 시간
const TICK_MS = 60 * 1000;

const ACTIONS = {
  feed: { stat: "full", say: "냠냠!", saidFull: "배불러요" },
  pet: { stat: "mood", say: "냥!", saidFull: "골골골…" },
  splash: { stat: "mood", say: "첨벙!", saidFull: "첨벙첨벙!" },
};

function load() {
  const now = Date.now();
  const fresh = { full: MAX, mood: MAX, fullAt: now, moodAt: now };
  try {
    return { ...fresh, ...JSON.parse(localStorage.getItem(STORE_KEY)) };
  } catch {
    return fresh;
  }
}

function save(state) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    // 저장이 막힌 환경(시크릿 창 등)에서는 이번 화면에서만 기억한다
  }
}

// 지난 시간만큼 칸을 줄인다
function decay(state, now = Date.now()) {
  for (const stat of ["full", "mood"]) {
    const at = `${stat}At`;
    const steps = Math.floor((now - state[at]) / DECAY_MS[stat]);
    if (steps <= 0) continue;
    state[stat] = Math.max(0, state[stat] - steps);
    state[at] = state[stat] === 0 ? now : state[at] + steps * DECAY_MS[stat];
  }
  return state;
}

export function startCat(pool) {
  const catCanvas = $("[data-cat]");
  const say = $("[data-say]");
  const fx = $("[data-fx]");
  const hearts = { full: $("[data-full]"), mood: $("[data-mood]") };
  const snackCount = $("[data-snacks]");
  const state = decay(load());
  let reactUntil = 0;
  let sayTimer = null;

  // 아이콘 색은 화면에 붙은 뒤에야 읽을 수 있어서, 붙이고 나서 그린다
  function renderHearts(stat) {
    const icons = Array.from({ length: MAX }, () => el("canvas", "icon"));
    hearts[stat].replaceChildren(...icons);
    icons.forEach((c, i) => setIcon(c, i < state[stat] ? "heart" : "heart-empty"));
    hearts[stat].setAttribute("aria-label", `${state[stat]}/${MAX}`);
  }

  function render() {
    renderHearts("full");
    renderHearts("mood");
    snackCount.textContent = snacks();
    const happy = Date.now() < reactUntil || (state.full > 0 && state.mood >= 2);
    drawSprite(catCanvas, happy ? CAT_HAPPY : CAT);
    if (state.full === 0 && Date.now() >= reactUntil) showText(say, "배고파요…");
  }

  function speak(text) {
    showText(say, text);
    clearTimeout(sayTimer);
    sayTimer = setTimeout(() => {
      showText(say, "");
      render();
    }, REACT_MS);
  }

  // 픽셀 하트가 고양이 위로 떠오른다
  function burstHearts() {
    for (let k = 0; k < 3; k++) {
      const c = el("canvas", "icon");
      c.style.left = `${30 + k * 18}%`;
      c.style.animationDelay = `${k * 0.15}s`;
      c.addEventListener("animationend", () => c.remove());
      fx.append(c);
      setIcon(c, "heart");
    }
  }

  function act(name) {
    const { stat, say: line, saidFull } = ACTIONS[name];
    decay(state);
    const wasFull = state[stat] === MAX;
    // 간식은 쌓아 둔 것만 줄 수 있다 (배부르면 아끼고)
    if (name === "feed" && !wasFull && !useSnack()) {
      speak("간식이 없어요");
      return;
    }
    state[stat] = Math.min(MAX, state[stat] + 1);
    state[`${stat}At`] = Date.now();
    save(state);
    reactUntil = Date.now() + REACT_MS;
    speak(wasFull ? saidFull : line);
    if (name === "splash") pool.splash();
    else burstHearts();
    render();
  }

  document.querySelectorAll("[data-act]").forEach((btn) => {
    btn.addEventListener("click", () => act(btn.dataset.act));
  });

  setInterval(() => {
    decay(state);
    save(state);
    render();
  }, TICK_MS);

  onAnnounce("records-changed", render);
  save(state);
  render();
}
