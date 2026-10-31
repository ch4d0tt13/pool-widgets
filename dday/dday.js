// D-day: 프로젝트 DB의 마감일 중 가장 가까운 1개를 크게, 그다음 3개를 목록으로
import { $ } from "../shared/js/dom.js";
import { api, hasKey } from "../shared/js/api.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const REFRESH_MS = 30 * 60 * 1000;

// 보는 기기의 오늘 날짜 기준 남은 날 수
function daysUntil(dateText) {
  const [y, m, d] = dateText.split("-").map(Number);
  const now = new Date();
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / DAY_MS);
}

const label = (days) => (days <= 0 ? "D-DAY" : `D-${days}`);

export function startDday() {
  const count = $("[data-count]");
  const name = $("[data-name]");
  const list = $("[data-list]");

  function render([first, ...rest]) {
    if (!first) {
      count.textContent = "D-?";
      name.textContent = "다가오는 마감이 없어요";
      list.replaceChildren();
      return;
    }
    count.textContent = label(daysUntil(first.date));
    name.textContent = first.name;
    list.replaceChildren(
      ...rest.map((item) => {
        const li = document.createElement("li");
        li.className = "dday__item";
        const pill = document.createElement("span");
        pill.className = "dday__pill";
        pill.textContent = label(daysUntil(item.date));
        const text = document.createElement("span");
        text.className = "dday__name";
        text.textContent = item.name;
        li.append(pill, text);
        return li;
      }),
    );
  }

  async function update() {
    try {
      render(await api("/dday"));
    } catch {
      name.textContent = "마감을 못 불러왔어요";
    }
  }

  if (!hasKey) {
    name.textContent = "연결 정보가 없어요";
    return;
  }
  update();
  setInterval(update, REFRESH_MS);
}
