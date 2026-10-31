// 위젯 공통 시작: 창 제목 표시줄을 붙이고, 본문에 물 장면을 깔고, 픽셀 아이콘을 그리고, 툴팁을 켠다
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
  mountWindow(win);

  const canvas = document.createElement("canvas");
  canvas.className = "pool";
  canvas.setAttribute("aria-hidden", "true");
  win.querySelector(".window__body").prepend(canvas);

  paintIcons();
  startTooltips();
  return startPool(canvas, scene);
}
