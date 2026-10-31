// 브리핑: 가장 최근 브리핑의 제목·첫 섹션 몇 줄·집계 줄을 쪽지로 보여 주고, 누르면 노션에서 연다
import { $, pad } from "../shared/js/dom.js";
import { api, hasKey } from "../shared/js/api.js";

const REFRESH_MS = 30 * 60 * 1000;

function metaText({ kind, at }) {
  const d = new Date(at);
  const when = `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return kind ? `${kind} · ${when}` : when;
}

export function startBriefing() {
  const link = $("[data-link]");
  const meta = $("[data-meta]");
  const heading = $("[data-heading]");
  const lines = $("[data-lines]");
  const footer = $("[data-footer]");

  function render(briefing) {
    if (!briefing) {
      meta.textContent = "아직 브리핑이 없어요";
      return;
    }
    link.href = briefing.url;
    meta.textContent = metaText(briefing);
    heading.textContent = briefing.title;
    lines.replaceChildren(
      ...briefing.lines.map((text) => {
        const li = document.createElement("li");
        li.textContent = text;
        return li;
      }),
    );
    footer.textContent = briefing.footer;
  }

  async function update() {
    try {
      render(await api("/briefing"));
    } catch {
      meta.textContent = "브리핑을 못 불러왔어요";
    }
  }

  if (!hasKey) {
    meta.textContent = "연결 정보가 없어요";
    return;
  }
  update();
  setInterval(update, REFRESH_MS);
}
