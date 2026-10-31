// 이번 주 기록: 월~일 날마다 끝낸 집중 횟수와 정리한 인박스 자료 수를 물탱크 수위로 (이 기기에 남긴 기록, records.js)
import { $, el } from "../shared/js/dom.js";
import { counts, dayKey } from "../shared/js/records.js";
import { onAnnounce, refreshWhileVisible } from "../shared/js/live.js";

const LABELS = ["월", "화", "수", "목", "금", "토", "일"];
const SERIES = ["focus", "tidy"];
const STACK = ["tidy", "focus"]; // 탱크 아래부터 쌓는 순서
const REFRESH_MS = 60 * 1000; // 자정이 지나면 오늘 칸이 넘어가게

// 이번 주 월요일부터 일요일까지
function weekDays(now = new Date()) {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  return LABELS.map((_, i) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i));
}

export function startStats() {
  const chart = $("[data-chart]");
  const totals = { focus: $("[data-total-focus]"), tidy: $("[data-total-tidy]") };

  function render() {
    const days = weekDays().map((d) => dayKey(d));
    const today = dayKey();
    const data = Object.fromEntries(SERIES.map((s) => [s, counts(s, days)]));
    // 한 주에서 가장 많이 한 날이 탱크를 가득 채운다
    const max = Math.max(1, ...days.map((_, i) => data.focus[i] + data.tidy[i]));

    chart.replaceChildren(
      ...days.map((day, i) => {
        const col = el("div", day === today ? "stats__day is-today" : "stats__day");
        const tank = el("div", "stats__tank");
        tank.title = `집중 ${data.focus[i]} · 정리 ${data.tidy[i]}`;
        for (const s of STACK) {
          const n = data[s][i];
          if (!n) continue;
          const water = el("span", `stats__water is-${s}`);
          water.style.height = `${(n / max) * 100}%`;
          tank.append(water);
        }
        col.append(tank, el("span", "stats__label", LABELS[i]));
        return col;
      }),
    );

    for (const s of SERIES) totals[s].textContent = data[s].reduce((a, b) => a + b, 0);
    chart.setAttribute("aria-label", `이번 주 집중 ${totals.focus.textContent}회, 정리 ${totals.tidy.textContent}개`);
  }

  render();
  onAnnounce("records-changed", render);
  refreshWhileVisible(render, REFRESH_MS);
}
