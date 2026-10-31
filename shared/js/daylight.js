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
