// 마감일 계산 (D-day·프로젝트 위젯 공통). 날짜는 "YYYY-MM-DD", 기준은 보는 기기의 오늘
const DAY_MS = 24 * 60 * 60 * 1000;

export function daysUntil(dateText) {
  const [y, m, d] = dateText.split("-").map(Number);
  const now = new Date();
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / DAY_MS);
}

export const ddayLabel = (days) => (days < 0 ? "지남" : days === 0 ? "D-DAY" : `D-${days}`);

// "2026-11-12" → "11/12"
export const shortDate = (dateText) => {
  const [, m, d] = dateText.split("-").map(Number);
  return `${m}/${d}`;
};
