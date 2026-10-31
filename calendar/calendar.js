// 미니 달력: 이번 달을 그리고 오늘을 강조, 프로젝트 마감일에는 픽셀 점(마우스를 올리면 이름)
import { $, pad, el, showText } from "../shared/js/dom.js";
import { api, hasKey } from "../shared/js/api.js";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const REFRESH_MS = 30 * 60 * 1000;

export function startCalendar() {
  const month = $("[data-month]");
  const board = $("[data-grid]");
  const status = $("[data-status]");
  let deadlines = [];
  let loadedMonth = "";

  function render() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    month.textContent = `${y}년 ${m + 1}월`;

    const names = new Map();
    for (const { name, date } of deadlines) {
      const day = Number(date.slice(8, 10));
      names.set(day, [...(names.get(day) ?? []), name]);
    }

    const cells = WEEKDAYS.map((w, i) => el("span", i === 0 ? "calendar__weekday is-sun" : "calendar__weekday", w));
    const firstWeekday = new Date(y, m, 1).getDay();
    const lastDay = new Date(y, m + 1, 0).getDate();
    for (let i = 0; i < firstWeekday; i++) cells.push(el("span", "calendar__day"));
    for (let d = 1; d <= lastDay; d++) {
      const cell = el("span", "calendar__day", String(d));
      if (d === now.getDate()) cell.classList.add("is-today");
      const due = names.get(d);
      if (due) {
        cell.classList.add("has-deadline");
        cell.title = `마감: ${due.join(", ")}`;
      }
      cells.push(cell);
    }
    board.replaceChildren(...cells);
  }

  async function update() {
    const now = new Date();
    const key = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
    try {
      deadlines = await api(`/calendar?month=${key}`);
      loadedMonth = key;
      showText(status, "");
    } catch {
      if (loadedMonth !== key) deadlines = [];
      showText(status, "마감일을 못 불러왔어요");
    }
    render();
  }

  render();
  if (!hasKey) {
    showText(status, "연결 정보가 없어요");
    return;
  }
  update();
  setInterval(update, REFRESH_MS);
}
