// 위젯 공통 시작: 창 제목 표시줄을 붙이고, 본문에 물 장면을 깔고, 픽셀 아이콘을 그린다
import { startPool } from "./pool.js";
import { paintIcons } from "./icons.js";

// <main class="window" data-title="..."><div class="window__body">…</div></main>
// → 제목 표시줄 + 안쪽 둥근 틀로 감싼다
function mountWindow(win) {
  const inner = document.createElement("div");
  inner.className = "window__inner";
  inner.innerHTML =
    '<div class="window__bar"><span class="window__title"></span>' +
    '<span class="window__controls" aria-hidden="true"><span>_</span><span>□</span><span>×</span></span></div>';
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
  return startPool(canvas, scene);
}
