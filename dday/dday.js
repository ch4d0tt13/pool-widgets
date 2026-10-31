// D-day: 프로젝트 DB의 마감일 중 가장 가까운 1개를 크게, 그다음 3개를 목록으로
import { $, el } from "../shared/js/dom.js";
import { api, hasKey } from "../shared/js/api.js";
import { onAnnounce } from "../shared/js/live.js";
import { daysUntil, ddayLabel } from "../shared/js/dates.js";

const REFRESH_MS = 30 * 60 * 1000;

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
    count.textContent = ddayLabel(daysUntil(first.date));
    name.textContent = first.name;
    list.replaceChildren(
      ...rest.map((item) => {
        const li = el("li", "dday__item");
        li.append(el("span", "dday__pill", ddayLabel(daysUntil(item.date))), el("span", "dday__name", item.name));
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
  // 프로젝트 위젯에서 마감일을 바꾸면 바로 다시 본다
  onAnnounce("deadlines-changed", update);
}
