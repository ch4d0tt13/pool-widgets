// 위젯 공통 시작: 물 배경을 깔고, 창 제목 표시줄을 붙이고, 픽셀 아이콘을 그린다
import { startPool } from "./pool.js";
import { paintIcons } from "./icons.js";

function mountBar(win) {
  const bar = document.createElement("div");
  bar.className = "window__bar";
  bar.innerHTML =
    '<span class="window__title"></span>' +
    '<span class="window__controls" aria-hidden="true"><span>_</span><span>□</span><span>×</span></span>';
  bar.querySelector(".window__title").textContent = win.dataset.title;
  win.prepend(bar);
}

export function startWidget(scene) {
  const canvas = document.createElement("canvas");
  canvas.className = "pool";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);

  document.querySelectorAll(".window[data-title]").forEach(mountBar);
  paintIcons();
  return startPool(canvas, scene);
}
