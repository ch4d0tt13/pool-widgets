// 탁상 달력: 이번 달을 그리고 오늘을 강조, 프로젝트 마감일을 표시한다(마우스를 올리면 이름).
// 날짜 칸이 작으면 숫자 아래 픽셀 점, 넉넉하면 칸 안에 마감 이름 막대(다 안 들어가면 「+n」)
import { $, pad, el, showText } from "../shared/js/dom.js";
import { api, hasKey } from "../shared/js/api.js";
import { onAnnounce } from "../shared/js/live.js";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const REFRESH_MS = 30 * 60 * 1000;

// 칸 단위 (calendar.css와 맞춘다)
const BAR_MIN_WIDTH = 20; // 막대를 넣을 날짜 칸의 최소 너비
const BAR_STEP = 6; // 막대 한 줄: 높이 5칸 + 틈 1칸
const DAY_PAD = 2; // 날짜 칸 위아래 여백 1칸씩

export function startCalendar() {
  const month = $("[data-month]");
  const board = $("[data-grid]");
  const status = $("[data-status]");
  const px = parseInt(getComputedStyle(board).getPropertyValue("--px"), 10);
  let deadlines = [];
  let loadedMonth = "";

  const blanks = (n) => Array.from({ length: n }, () => el("span", "calendar__day"));

  // 칸이 넉넉하면 마감 이름을 막대로 넣는다. 들어갈 줄 수는 넉넉한 배치로 바꿔 놓고 첫 날짜 칸을 재서 정한다
  function fillBars(due) {
    board.classList.add("is-big");
    const num = board.querySelector(".calendar__num");
    const cell = num.parentElement;
    const fit = Math.floor((cell.clientHeight - num.offsetHeight - DAY_PAD * px) / (BAR_STEP * px));
    const big = cell.clientWidth >= BAR_MIN_WIDTH * px && fit >= 1;
    board.classList.toggle("is-big", big);
    if (!big) return;

    // 다 안 들어가면 남은 개수를 칸 오른쪽 위에 「+n」으로
    for (const [day, names] of due) {
      day.append(...names.slice(0, fit).map((name) => el("span", "calendar__bar", name)));
      if (names.length > fit) day.append(el("span", "calendar__more", `+${names.length - fit}`));
    }
  }

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
    const due = [];
    cells.push(...blanks(firstWeekday));
    for (let d = 1; d <= lastDay; d++) {
      const cell = el("span", "calendar__day");
      cell.append(el("span", "calendar__num", String(d)));
      if (d === now.getDate()) cell.classList.add("is-today");
      const list = names.get(d);
      if (list) {
        cell.classList.add("has-deadline");
        cell.title = `마감: ${list.join(", ")}`;
        due.push([cell, list]);
      }
      cells.push(cell);
    }
    // 마지막 주 남는 칸도 채운다 (넉넉한 배치에서 줄눈이 끊기지 않게)
    cells.push(...blanks((7 - ((firstWeekday + lastDay) % 7)) % 7));
    board.replaceChildren(...cells);
    fillBars(due);
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

  // 임베드 칸 크기가 바뀌면 점·막대를 다시 고른다 (처음 한 번도 여기서 그린다)
  new ResizeObserver(render).observe(board, { box: "border-box" });
  if (!hasKey) {
    showText(status, "연결 정보가 없어요");
    return;
  }
  update();
  setInterval(update, REFRESH_MS);
  // 프로젝트 위젯에서 마감일을 바꾸면 바로 다시 본다
  onAnnounce("deadlines-changed", update);
}
