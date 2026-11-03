// 브리핑: 가장 최근 브리핑의 종류·시각(스티커), 첫 섹션 몇 줄, 집계 줄을 쪽지로 보여 주고, 누르면 노션에서 연다.
// 제목(「날짜 저녁 브리핑」)은 스티커와 겹쳐서 보여 주지 않는다
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
  const lines = $("[data-lines]");
  const footer = $("[data-footer]");

  // 게시판 높이에 줄이 다 안 들어가면 들어가는 줄 수만큼만 보이게 한다 (재기 전에 한 번 풀어서 늘어날 자리도 잰다).
  // 줄 묶음 높이도 그 줄 수로 줄여서, 말줄임 뒤로 넘친 줄이 쪽지에 비치지 않게 한다
  function fitLines() {
    lines.style.removeProperty("--note-lines");
    lines.style.removeProperty("max-height");
    if (lines.scrollHeight <= lines.clientHeight) return;
    const lineHeight = parseFloat(getComputedStyle(lines).lineHeight);
    const fit = Math.max(1, Math.floor(lines.clientHeight / lineHeight));
    lines.style.setProperty("--note-lines", fit);
    lines.style.maxHeight = `${fit * lineHeight}px`;
  }
  new ResizeObserver(fitLines).observe(link.parentElement);

  function render(briefing) {
    if (!briefing) {
      meta.textContent = "아직 브리핑이 없어요";
      return;
    }
    link.href = briefing.url;
    meta.textContent = metaText(briefing);
    lines.replaceChildren(
      ...briefing.lines.map((text) => {
        const li = document.createElement("li");
        li.textContent = text;
        return li;
      }),
    );
    footer.textContent = briefing.footer;
    fitLines();
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
