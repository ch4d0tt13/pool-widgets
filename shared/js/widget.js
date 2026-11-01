// 위젯 공통 시작: 창 제목 표시줄을 붙이고, 본문에 물 장면을 깔고, 픽셀 아이콘을 그리고, 툴팁을 켠다
// 창이 아닌 모양(게시판·선반·튜브 등)의 위젯은 .window 없이 부르고, 장면을 주지 않으면 물 장면도 없다
import { startPool } from "./pool.js";
import { paintIcons } from "./icons.js";
import { startTooltips } from "./tooltip.js";

// <main class="window" data-title="..."><div class="window__body">…</div></main>
// → 제목 표시줄 + 안쪽 둥근 틀로 감싼다
function mountWindow(win) {
  const inner = document.createElement("div");
  inner.className = "window__inner";
  inner.innerHTML =
    '<div class="window__bar"><span class="window__title"></span>' +
    '<span class="window__controls" aria-hidden="true">' +
    ["win-min", "win-max", "win-close"].map((icon) => `<span><canvas class="icon" data-icon="${icon}"></canvas></span>`).join("") +
    "</span></div>";
  inner.querySelector(".window__title").textContent = win.dataset.title;
  inner.append(...win.children);
  win.append(inner);
}

export function startWidget(scene) {
  const win = document.querySelector(".window");
  if (win) mountWindow(win);

  // 물 장면은 장면 이름을 주고 깔 자리([data-pool])가 있을 때만 (자리가 없으면 장면 없이 넘어간다)
  let pool = null;
  const host = scene && document.querySelector("[data-pool]");
  if (host) {
    const canvas = document.createElement("canvas");
    canvas.className = "pool";
    canvas.setAttribute("aria-hidden", "true");
    host.prepend(canvas);
    pool = startPool(canvas, scene);
  }

  paintIcons();
  startTooltips();
  return pool;
}
