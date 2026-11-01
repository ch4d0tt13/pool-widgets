// 시간대: 보는 기기의 현지 시각으로 새벽·노을·밤을 정한다. 물 장면은 시간대마다 다른 색 토큰으로 칠한다(tokens.css의 data-phase)
// 확인용으로 주소에 ?hour=21 처럼 시각을 줄 수 있다
const PHASES = [
  { from: 5, to: 7, name: "dawn" },
  { from: 17, to: 19, name: "sunset" },
  { from: 19, to: 29, name: "night", night: true }, // 19시 ~ 다음 날 5시
];

export function currentPhase() {
  const forced = new URLSearchParams(location.search).get("hour");
  const hour = forced !== null ? Number(forced) : new Date().getHours();
  const h = hour < 5 ? hour + 24 : hour;
  return PHASES.find((p) => h >= p.from && h < p.to) ?? null;
}

// 문서(<html>)에 data-phase를 붙여 두고 1분마다 다시 본다. 물 장면이 없는 위젯도 tokens.css의 시간대 색을 받는다.
// 캔버스처럼 토큰 색을 읽어 그리는 쪽은 fn을 넘기면 시간대가 바뀔 때마다(처음 한 번 포함) 다시 부른다
const CHECK_MS = 60 * 1000;
const listeners = [];
let phase;

function applyPhase() {
  const next = currentPhase();
  const root = document.documentElement;
  if (next) root.dataset.phase = next.name;
  else delete root.dataset.phase;
  const changed = next?.name !== phase?.name;
  phase = next;
  if (changed) listeners.forEach((fn) => fn(phase));
}

export function watchPhase(fn) {
  if (phase === undefined) {
    applyPhase();
    setInterval(applyPhase, CHECK_MS);
  }
  if (fn) {
    listeners.push(fn);
    fn(phase);
  }
}
