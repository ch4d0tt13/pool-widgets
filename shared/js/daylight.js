// 시간대: 보는 기기의 현지 시각으로 새벽·노을·밤을 정한다 (낮은 물들이지 않는다)
// 확인용으로 주소에 ?hour=21 처럼 시각을 줄 수 있다
const PHASES = [
  { from: 5, to: 7, tint: "--tint-dawn", amount: 0.18 },
  { from: 17, to: 19, tint: "--tint-sunset", amount: 0.25 },
  { from: 19, to: 29, tint: "--tint-night", amount: 0.38, night: true }, // 19시 ~ 다음 날 5시
];

export function currentPhase() {
  const forced = new URLSearchParams(location.search).get("hour");
  const hour = forced !== null ? Number(forced) : new Date().getHours();
  const h = hour < 5 ? hour + 24 : hour;
  return PHASES.find((p) => h >= p.from && h < p.to) ?? null;
}
