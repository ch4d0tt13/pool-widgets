// 브리핑: 가장 최근 브리핑의 종류·시각(스티커), 노션에 쓴 그대로 섹션마다 제목과 글머리, 집계 줄을 쪽지로 보여 주고, 누르면 노션에서 연다.
// 제목(「날짜 저녁 브리핑」)은 스티커와 겹쳐서 보여 주지 않는다
import { $, pad, el } from "../shared/js/dom.js";
import { setIcon } from "../shared/js/icons.js";
import { api, hasKey } from "../shared/js/api.js";

const REFRESH_MS = 30 * 60 * 1000;
const KIND_ICONS = { 아침: "sun-small", 저녁: "moon-small" }; // 스티커 앞: 아침은 해, 저녁은 달

function metaText({ kind, at }) {
  const d = new Date(at);
  const when = `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return kind ? `${kind} · ${when}` : when;
}

export function startBriefing() {
  const link = $("[data-link]");
  const meta = $("[data-meta]");
  const metaIcon = $("[data-meta-icon]");
  const lines = $("[data-lines]");
  const footer = $("[data-footer]");

  // 게시판 높이에 줄이 다 안 들어가면 들어가는 줄 수만큼만 보이게 한다 (재기 전에 한 번 풀어서 늘어날 자리도 잰다).
  // 섹션 사이 간격이 있어서 줄마다 실제 아래 끝 위치를 재고, 줄 묶음 높이도 마지막으로 들어가는 줄 아래 끝까지로 줄인다
  // (말줄임 뒤로 넘친 줄이 쪽지에 비치지 않게)
  function fitLines() {
    lines.style.removeProperty("--note-lines");
    lines.style.removeProperty("max-height");
    if (lines.scrollHeight <= lines.clientHeight) return;
    const lineHeight = parseFloat(getComputedStyle(lines).lineHeight);
    let fit = 0;
    let bottom = lineHeight;
    for (const li of lines.children) {
      const top = li.offsetTop - lines.offsetTop;
      const rows = Math.round(li.offsetHeight / lineHeight);
      for (let row = 1; row <= rows && top + row * lineHeight <= lines.clientHeight; row++) {
        fit++;
        bottom = top + row * lineHeight;
      }
      if (top + rows * lineHeight > lines.clientHeight) break;
    }
    lines.style.setProperty("--note-lines", Math.max(1, fit));
    lines.style.maxHeight = `${bottom}px`;
  }
  new ResizeObserver(fitLines).observe(link.parentElement);

  function render(briefing) {
    if (!briefing) {
      meta.textContent = "아직 브리핑이 없어요";
      return;
    }
    link.href = briefing.url;
    meta.textContent = metaText(briefing);
    const kindIcon = KIND_ICONS[briefing.kind];
    metaIcon.hidden = !kindIcon;
    if (kindIcon) setIcon(metaIcon, kindIcon);
    // 섹션 제목 줄과 글머리 줄을 한 목록에 (말줄임이 섹션을 넘어 이어지게). 줄 앞은 섹션 튜브(5×5)·글머리 작은 하트(3×3).
    // 글머리 앞쪽 굵은 글자(label)는 진하게, 설명(text)은 다음 줄에, 링크 글자(「원본」 등)는 끝에 흐리게
    const line = (className, icon, size, ...content) => {
      const mark = el("canvas", `icon icon--${size} note__mark`);
      mark.dataset.icon = icon;
      mark.setAttribute("aria-hidden", "true");
      const li = el("li", className);
      li.append(mark, ...content);
      return li;
    };
    lines.replaceChildren(
      ...briefing.sections.flatMap(({ title, items }) => [
        line("note__head", "tube-small", "small", title),
        ...items.map(({ label, text, links = [] }) =>
          line(
            "",
            "heart-tiny",
            "tiny",
            ...(label ? [el("span", "note__label", label), ...(text ? [document.createElement("br")] : [])] : []),
            text,
            ...(links.length ? [" ", el("span", "note__links", links.join(" · "))] : []),
          ),
        ),
      ]),
    );
    footer.textContent = briefing.footer;
    // 아이콘은 화면에 붙인 뒤에 그린다 (붙기 전에는 토큰 색을 읽지 못한다)
    lines.querySelectorAll("canvas[data-icon]").forEach((c) => setIcon(c, c.dataset.icon));
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
